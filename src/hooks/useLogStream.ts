import { useState, useEffect, useRef, useCallback } from 'react';

export interface LogStreamOptions {
  sinceTime?: string;
  sinceSeconds?: number;
}

export interface LogStreamResult {
  lines: string[];
  isStreaming: boolean;
  isRetrying: boolean;
  error?: Error;
  pause: () => void;
  resume: () => void;
  retry: () => void;
  clear: () => void;
  exportLogs: (filename?: string, options?: ExportOptions) => void;
}

export interface ExportOptions {
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
}

/**
 * Hook for streaming logs in real-time from a Kubernetes pod
 * Uses the Kubernetes API's follow=true endpoint with ReadableStream
 */
export function useLogStream(
  namespace: string,
  pod: string,
  options: LogStreamOptions = {}
): LogStreamResult {
  const { sinceTime, sinceSeconds } = options;
  
  const [lines, setLines] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs for managing stream state
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const decoderRef = useRef(new TextDecoder());
  const bufferRef = useRef('');

  // Maximum retry attempts and base delay
  const MAX_RETRIES = 3;
  const BASE_RETRY_DELAY = 1000; // 1 second

  /**
   * Builds the streaming URL with query parameters
   */
  const buildStreamUrl = useCallback(() => {
    const params = new URLSearchParams({
      follow: 'true',
      timestamps: 'true',
    });
    
    if (sinceTime) {
      params.set('sinceTime', sinceTime);
    }
    
    if (sinceSeconds) {
      params.set('sinceSeconds', sinceSeconds.toString());
    }
    
    return `/api/v1/namespaces/${namespace}/pods/${pod}/log?${params.toString()}`;
  }, [namespace, pod, sinceTime, sinceSeconds]);

  /**
   * Process incoming text chunks and extract complete log lines
   */
  const processChunk = useCallback((chunk: string) => {
    if (isPaused) return;

    bufferRef.current += chunk;
    const lines = bufferRef.current.split('\n');
    
    // Keep the last incomplete line in buffer
    bufferRef.current = lines.pop() || '';
    
    // Add complete lines to state
    if (lines.length > 0) {
      setLines(prevLines => [...prevLines, ...lines.filter(line => line.trim())]);
    }
  }, [isPaused]);

  /**
   * Start streaming logs from the Kubernetes API
   */
  const startStream = useCallback(async () => {
    if (!namespace || !pod) {
      return;
    }

    try {
      setError(undefined);
      setIsRetrying(false);
      
      // Create new AbortController for this stream
      abortControllerRef.current = new AbortController();
      
      const url = buildStreamUrl();
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Get reader from response stream
      readerRef.current = response.body.getReader();
      
      // Reset retry count on successful connection
      retryCountRef.current = 0;
      
      // Set streaming to true only after successful connection
      setIsStreaming(true);

      // Read stream chunks
      while (true) {
        const { done, value } = await readerRef.current.read();
        
        if (done) {
          console.log('[LogStream] Stream ended normally');
          break;
        }

        // Decode chunk and process
        const chunk = decoderRef.current.decode(value, { stream: true });
        processChunk(chunk);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('[LogStream] Stream aborted');
          setIsStreaming(false);
          return;
        }
        
        console.error('[LogStream] Stream error:', err);
        setError(err);
        
        // Attempt to reconnect if we haven't exceeded max retries
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          const delay = BASE_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
          
          console.log(`[LogStream] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
          
          // Set retrying state
          setIsRetrying(true);
          
          // Don't set isStreaming to false here - keep it true during retry
          retryTimeoutRef.current = setTimeout(() => {
            setIsRetrying(false);
            startStream();
          }, delay);
          return; // Exit early to avoid setting isStreaming to false
        } else {
          setIsStreaming(false);
          setIsRetrying(false);
        }
      }
    } finally {
      // Clean up reader
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
        readerRef.current = null;
      }
    }
  }, [namespace, pod, buildStreamUrl, processChunk]);

  /**
   * Stop the current stream
   */
  const stopStream = useCallback(() => {
    // Cancel any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Abort current request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsStreaming(false);
    setIsRetrying(false);
  }, []);

  /**
   * Pause streaming (stops processing new chunks but keeps connection)
   */
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume streaming
   */
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * Clear all log lines
   */
  const clear = useCallback(() => {
    setLines([]);
    bufferRef.current = '';
  }, []);

  /**
   * Export logs to a downloadable .log file
   */
  const exportLogs = useCallback((filename?: string, options?: ExportOptions) => {
    if (lines.length === 0) {
      console.warn('No logs to export');
      return;
    }

    const {
      includeTimestamps = true,
      includeMetadata = true
    } = options || {};

    // Generate filename if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `${namespace}-${pod}-${timestamp}.log`;
    const finalFilename = filename || defaultFilename;

    // Parse lines to separate timestamps and messages
    const parsedLines = lines.map(line => {
      const timestampRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+(.*)$/;
      const match = line.match(timestampRegex);
      
      if (match) {
        return {
          timestamp: match[1],
          message: match[2],
          original: line
        };
      }
      
      return {
        timestamp: null,
        message: line,
        original: line
      };
    });

    // Build export content
    const contentLines: string[] = [];

    // Add metadata header if requested
    if (includeMetadata) {
      contentLines.push(
        `# Kubernetes Pod Logs Export`,
        `# Namespace: ${namespace}`,
        `# Pod: ${pod}`,
        `# Export Time: ${new Date().toISOString()}`,
        `# Total Lines: ${lines.length}`,
        `# Include Timestamps: ${includeTimestamps}`,
        `# `,
        ``
      );
    }

    // Add log lines
    if (includeTimestamps) {
      // Keep original format with timestamps
      contentLines.push(...parsedLines.map(line => line.original));
    } else {
      // Export only messages without timestamps
      contentLines.push(...parsedLines.map(line => line.message));
    }

    // Create log content
    const logContent = contentLines.join('\n');

    // Create blob and download
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    URL.revokeObjectURL(url);
    
    console.log(`[LogStream] Exported ${lines.length} log lines to ${finalFilename}`);
  }, [lines, namespace, pod]);

  /**
   * Retry streaming (resets error state and retry count)
   */
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    setError(undefined);
    setLines([]);
    bufferRef.current = '';
    startStream();
  }, [startStream]);

  // Effect to start/stop streaming when dependencies change
  useEffect(() => {
    if (namespace && pod) {
      startStream();
    }
    
    return () => {
      stopStream();
    };
  }, [namespace, pod, sinceTime, sinceSeconds]); // Note: startStream and stopStream are not in deps to avoid infinite loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    lines,
    isStreaming,
    isRetrying,
    error,
    pause,
    resume,
    retry,
    clear,
    exportLogs,
  };
}

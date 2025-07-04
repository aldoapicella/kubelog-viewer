import { memo, useEffect, useRef, useState, useMemo } from 'react';
import { useLogStream } from '../hooks/useLogStream';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface LogViewerProps {
  namespace: string;
  pod: string;
  sinceSeconds?: number;
  searchTerm: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Highlights search terms in log lines
 */
const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-500 text-black px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

/**
 * Parse timestamp from log line if it exists
 */
const parseLogLine = (line: string): { timestamp?: string; message: string } => {
  // RFC3339 timestamp pattern: 2024-01-01T10:00:00Z or 2024-01-01T10:00:00.123456789Z
  const timestampRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+(.*)$/;
  const match = line.match(timestampRegex);
  
  if (match) {
    return {
      timestamp: match[1],
      message: match[2]
    };
  }
  
  return { message: line };
};

/**
 * Real-time log viewer component with streaming functionality
 */
export const LogViewer = memo<LogViewerProps>(({ 
  namespace, 
  pod, 
  sinceSeconds, 
  searchTerm,
  startDate,
  endDate
}) => {
  const { 
    lines, 
    isStreaming, 
    isRetrying,
    error, 
    pause, 
    resume, 
    retry,
    clear
  } = useLogStream(namespace, pod, { 
    sinceSeconds
  });
  
  const [autoScroll, setAutoScroll] = useState(true);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const previousLinesLength = useRef(0);

  // Parse and filter logs based on search term and date range
  const filteredLogs = useMemo(() => {
    const parsedLines = lines.map(line => parseLogLine(line));
    
    let filtered = parsedLines;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(({ message }) => 
        message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(({ timestamp }) => {
        if (!timestamp) return false; // Skip lines without timestamps
        
        const logDate = new Date(timestamp);
        
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        
        return true;
      });
    }
    
    return filtered;
  }, [lines, searchTerm, startDate, endDate]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && lines.length > previousLinesLength.current) {
      logContainerRef.current?.scrollTo({
        top: logContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    previousLinesLength.current = lines.length;
  }, [lines, autoScroll]);

  // Handle manual scroll - disable auto-scroll if user scrolls up
  const handleScroll = () => {
    if (!logContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
    
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    } else if (isAtBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  // Handle stream pause/resume
  const handleToggleStream = () => {
    if (isStreamPaused) {
      resume();
      setIsStreamPaused(false);
    } else {
      pause();
      setIsStreamPaused(true);
    }
  };

  if (!namespace || !pod) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Please select a namespace and pod to view logs.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-200">Logs</h3>
        </div>
        <ErrorAlert error={error} onRetry={retry} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-medium text-gray-200">
          Logs for {pod} 
          {searchTerm && (
            <span className="text-sm text-gray-400 ml-2">
              ({filteredLogs.length} of {lines.length} lines)
            </span>
          )}
        </h3>
        
        <div className="flex items-center space-x-3">
          {/* Streaming Status */}
          <div className="flex items-center space-x-2">
            {isStreaming && !isRetrying ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                <span className="text-sm text-green-400">Streaming</span>
              </div>
            ) : isRetrying ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" message="" />
                <span className="text-sm text-yellow-400">Reconnecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" message="" />
                <span className="text-sm text-gray-400">Connecting...</span>
              </div>
            )}
          </div>

          {/* Stream Pause/Resume Button */}
          <button
            onClick={handleToggleStream}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isStreamPaused
                ? 'bg-green-800 text-green-100 hover:bg-green-700'
                : 'bg-orange-800 text-orange-100 hover:bg-orange-700'
            }`}
            aria-label={isStreamPaused ? 'Resume stream' : 'Pause stream'}
          >
            {isStreamPaused ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            )}
          </button>

          {/* Auto-scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              autoScroll
                ? 'bg-blue-800 text-blue-100 hover:bg-blue-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            aria-label={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            <svg 
              className="w-4 h-4 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
            Auto-scroll
          </button>

          {/* Clear Logs Button */}
          <button
            onClick={clear}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-800 text-red-100 hover:bg-red-700 transition-colors"
            aria-label="Clear all logs"
          >
            <svg 
              className="w-4 h-4 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
            Clear
          </button>
        </div>
      </div>
      
      <div 
        ref={logContainerRef}
        onScroll={handleScroll}
        className="bg-gray-900 rounded-lg p-4 h-96 overflow-auto font-mono text-sm text-gray-100 border border-gray-700"
        role="log"
        aria-live={autoScroll && !isStreamPaused ? "polite" : "off"}
        aria-label="Real-time log output"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {lines.length === 0 ? 'Waiting for logs...' : 'No logs match your search.'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((logLine, index) => (
              <div 
                key={`${index}-${logLine.message.slice(0, 50)}`}
                className="whitespace-pre-wrap break-words hover:bg-gray-800 px-2 py-1 rounded"
              >
                {logLine.timestamp && (
                  <span className="text-blue-400 text-xs mr-2 font-mono">
                    {new Date(logLine.timestamp).toLocaleString()}
                  </span>
                )}
                <span className="text-gray-100">
                  {highlightText(logLine.message, searchTerm)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Log Count Info */}
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>
          {lines.length} total lines
          {searchTerm && ` • ${filteredLogs.length} matching`}
        </span>
        <span>
          {isStreamPaused ? 'Stream paused' : 'Live streaming'}
        </span>
      </div>
    </div>
  );
});

LogViewer.displayName = 'LogViewer';

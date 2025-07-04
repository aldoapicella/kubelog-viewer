import { useState } from 'react';

interface ExportOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  totalLines: number;
  namespace: string;
  pod: string;
}

interface ExportOptions {
  filename?: string;
  includeTimestamps: boolean;
  includeMetadata: boolean;
}

export function ExportOptionsModal({
  isOpen,
  onClose,
  onExport,
  totalLines,
  namespace,
  pod
}: ExportOptionsProps) {
  const [filename, setFilename] = useState('');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleExport = () => {
    const options: ExportOptions = {
      filename: filename.trim() || undefined,
      includeTimestamps,
      includeMetadata,
    };
    onExport(options);
    onClose();
  };

  const generateDefaultFilename = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${namespace}-${pod}-${timestamp}.log`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-200">Export Logs</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Filename */}
          <div>
            <label htmlFor="filename" className="block text-sm font-medium text-gray-300 mb-1">
              Filename
            </label>
            <input
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={generateDefaultFilename()}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty for auto-generated filename
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-300">Include metadata header</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeTimestamps}
                onChange={(e) => setIncludeTimestamps(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-300">Preserve timestamps</span>
            </label>
          </div>

          {/* Export Info */}
          <div className="bg-gray-700 rounded-md p-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Total lines:</span>
              <span>{totalLines.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={totalLines === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

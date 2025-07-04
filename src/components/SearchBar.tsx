import { memo, useState, useCallback, useEffect } from 'react';
import { DateRangeFilter } from './DateRangeFilter';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sinceSeconds?: number;
  onSinceSecondsChange: (seconds?: number) => void;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  className?: string;
}

/**
 * Search bar with filters for log viewer
 */
export const SearchBar = memo<SearchBarProps>(({ 
  searchTerm, 
  onSearchChange, 
  sinceSeconds, 
  onSinceSecondsChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '' 
}) => {
  const [tempSinceSeconds, setTempSinceSeconds] = useState(() => sinceSeconds?.toString() || '');

  // Update tempSinceSeconds when sinceSeconds prop changes
  useEffect(() => {
    setTempSinceSeconds(sinceSeconds?.toString() || '');
  }, [sinceSeconds]);

  const handleSinceSecondsBlur = useCallback(() => {
    if (tempSinceSeconds === '') {
      onSinceSecondsChange(undefined);
      return;
    }
    
    const parsed = parseInt(tempSinceSeconds, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onSinceSecondsChange(parsed);
    } else {
      setTempSinceSeconds(sinceSeconds?.toString() || '');
    }
  }, [tempSinceSeconds, sinceSeconds, onSinceSecondsChange]);

  const handleSinceSecondsKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSinceSecondsBlur();
    }
  }, [handleSinceSecondsBlur]);

  const handleQuickFilter = useCallback((seconds: number) => {
    setTempSinceSeconds(seconds.toString());
    onSinceSecondsChange(seconds);
  }, [onSinceSecondsChange]);

  const handleClearFilter = useCallback(() => {
    setTempSinceSeconds('');
    onSinceSecondsChange(undefined);
  }, [onSinceSecondsChange]);

  const handleClearDateRange = useCallback(() => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  }, [onStartDateChange, onEndDateChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input */}
      <div>
        <label htmlFor="search-input" className="block text-sm font-medium text-gray-200 mb-1">
          Search logs
        </label>
        <input
          id="search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Type to filter log lines..."
          className="block w-full rounded-md border-0 bg-gray-800 py-2 px-3 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
          aria-label="Search log lines"
        />
      </div>

      {/* Time Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="since-seconds" className="block text-sm font-medium text-gray-200 mb-1">
            Show logs since (seconds ago)
          </label>
          <input
            id="since-seconds"
            type="number"
            value={tempSinceSeconds}
            onChange={(e) => setTempSinceSeconds(e.target.value)}
            onBlur={handleSinceSecondsBlur}
            onKeyDown={handleSinceSecondsKeyDown}
            placeholder="e.g. 300 for last 5 minutes"
            min="1"
            className="block w-full rounded-md border-0 bg-gray-800 py-2 px-3 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            aria-label="Filter logs by time"
          />
        </div>

        {/* Quick Time Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickFilter(60)}
            className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            1m
          </button>
          <button
            onClick={() => handleQuickFilter(300)}
            className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            5m
          </button>
          <button
            onClick={() => handleQuickFilter(1800)}
            className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            30m
          </button>
          <button
            onClick={() => handleQuickFilter(3600)}
            className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            1h
          </button>
          <button
            onClick={handleClearFilter}
            className="px-3 py-2 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            All
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onClear={handleClearDateRange}
      />
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

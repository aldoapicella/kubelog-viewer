import React from 'react';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClear: () => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: DateRangeFilterProps) {
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onStartDateChange(value ? new Date(value) : undefined);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onEndDateChange(value ? new Date(value) : undefined);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-200">Date Range Filter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            id="start-date"
            value={startDate ? formatDateTimeLocal(startDate) : ''}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">
            End Date & Time
          </label>
          <input
            type="datetime-local"
            id="end-date"
            value={endDate ? formatDateTimeLocal(endDate) : ''}
            onChange={handleEndDateChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors cursor-pointer"
        >
          Clear Date Range
        </button>
        
        {(startDate || endDate) && (
          <div className="flex items-center text-sm text-gray-400">
            {startDate && endDate && (
              <span>
                Filtering from {startDate.toLocaleString()} to {endDate.toLocaleString()}
              </span>
            )}
            {startDate && !endDate && (
              <span>
                Filtering from {startDate.toLocaleString()}
              </span>
            )}
            {!startDate && endDate && (
              <span>
                Filtering until {endDate.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

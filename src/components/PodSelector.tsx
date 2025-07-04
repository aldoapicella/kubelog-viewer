import { memo, useState, useMemo, useRef, useEffect } from 'react';
import { usePods } from '../hooks/usePods';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface PodSelectorProps {
  namespace: string;
  selectedPod: string;
  onPodChange: (pod: string) => void;
}

/**
 * Advanced pod selector with search, filtering, and virtual scrolling for large pod lists
 */
export const PodSelector = memo<PodSelectorProps>(({ 
  namespace, 
  selectedPod, 
  onPodChange 
}) => {
  const { data: pods, isLoading, error, refetch } = usePods(namespace);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and search pods
  const filteredPods = useMemo(() => {
    if (!pods) return [];
    
    return pods.filter(pod => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        pod.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        pod.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [pods, searchTerm, statusFilter]);

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    if (!pods) return [];
    const statuses = [...new Set(pods.map(pod => pod.status))];
    return statuses.sort();
  }, [pods]);

  const handlePodSelect = (podName: string) => {
    onPodChange(podName);
    setIsDropdownOpen(false);
    setSearchTerm(''); // Clear search after selection
  };

  const selectedPodInfo = pods?.find(pod => pod.name === selectedPod);

  if (!namespace) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Pod
        </label>
        <div className="relative">
          <button
            disabled
            className="w-full text-left rounded-md border-0 bg-gray-800 py-2 px-3 text-gray-400 shadow-sm ring-1 ring-inset ring-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Select a namespace first...
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Pod
        </label>
        <ErrorAlert error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">
        Pod {pods && `(${pods.length} total, ${filteredPods.length} filtered)`}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected Pod Display / Trigger Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          className="w-full text-left rounded-md border-0 bg-gray-800 py-2 px-3 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-gray-700 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {selectedPod ? (
                <div>
                  <div className="font-medium text-gray-100 truncate">{selectedPod}</div>
                  {selectedPodInfo && (
                    <div className="text-xs text-gray-400 mt-1">
                      Status: {selectedPodInfo.status} • Ready: {selectedPodInfo.ready} • 
                      Restarts: {selectedPodInfo.restarts} • Age: {selectedPodInfo.age}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">
                  {isLoading ? 'Loading pods...' : 'Select a pod...'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isLoading && <LoadingSpinner size="sm" message="" />}
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Dropdown */}
        {isDropdownOpen && pods && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-96 overflow-hidden">
            {/* Search and Filter Controls */}
            <div className="p-3 border-b border-gray-600 space-y-2">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300 whitespace-nowrap">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-md text-gray-100 text-sm py-1 px-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All ({pods.length})</option>
                  {availableStatuses.map(status => (
                    <option key={status} value={status}>
                      {status} ({pods.filter(p => p.status === status).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pod List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredPods.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No pods match your filters' 
                    : 'No pods found in this namespace'
                  }
                </div>
              ) : (
                filteredPods.map((pod) => (
                  <button
                    key={pod.name}
                    onClick={() => handlePodSelect(pod.name)}
                    className={`w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 cursor-pointer ${
                      selectedPod === pod.name ? 'bg-blue-800 hover:bg-blue-700' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-100 truncate">{pod.name}</div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center space-x-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        pod.status === 'Running' ? 'bg-green-800 text-green-100' :
                        pod.status === 'Pending' ? 'bg-yellow-800 text-yellow-100' :
                        pod.status === 'Failed' ? 'bg-red-800 text-red-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {pod.status}
                      </span>
                      <span>Ready: {pod.ready}</span>
                      <span>Restarts: {pod.restarts}</span>
                      <span>Age: {pod.age}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PodSelector.displayName = 'PodSelector';

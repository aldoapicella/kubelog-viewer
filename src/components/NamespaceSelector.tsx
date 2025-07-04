import { memo, useState, useRef, useEffect } from 'react';
import { useNamespaces } from '../hooks/useNamespaces';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface NamespaceSelectorProps {
  selectedNamespace: string;
  onNamespaceChange: (namespace: string) => void;
}

/**
 * Modern dropdown selector for Kubernetes namespaces
 */
export const NamespaceSelector = memo<NamespaceSelectorProps>(({ 
  selectedNamespace, 
  onNamespaceChange 
}) => {
  const { data: namespaces, isLoading, error, refetch } = useNamespaces();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter namespaces based on search term
  const filteredNamespaces = namespaces?.filter(ns => 
    ns.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleNamespaceSelect = (namespace: string) => {
    onNamespaceChange(namespace);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Namespace
        </label>
        <ErrorAlert error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">
        Namespace
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected Namespace Display / Trigger Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          className="w-full text-left rounded-md border-0 bg-gray-800 py-2 px-3 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-gray-700 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {selectedNamespace ? (
                <div className="font-medium text-gray-100 truncate">{selectedNamespace}</div>
              ) : (
                <span className="text-gray-400">
                  {isLoading ? 'Loading namespaces...' : 'Select a namespace...'}
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
        {isDropdownOpen && namespaces && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-64 overflow-hidden">
            {/* Search Input */}
            {namespaces.length > 5 && (
              <div className="p-3 border-b border-gray-600">
                <input
                  type="text"
                  placeholder="Search namespaces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            )}

            {/* Namespace List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredNamespaces.length === 0 ? (
                <div className="p-3 text-center text-gray-400 text-sm">
                  {searchTerm ? 'No namespaces match your search' : 'No namespaces found'}
                </div>
              ) : (
                filteredNamespaces.map((namespace) => (
                  <button
                    key={namespace}
                    onClick={() => handleNamespaceSelect(namespace)}
                    className={`w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 cursor-pointer ${
                      selectedNamespace === namespace ? 'bg-blue-800 hover:bg-blue-700' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-100 truncate">{namespace}</div>
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

NamespaceSelector.displayName = 'NamespaceSelector';

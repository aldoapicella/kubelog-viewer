import { memo } from 'react';
import { useNamespaces } from '../hooks/useNamespaces';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface NamespaceSelectorProps {
  selectedNamespace: string;
  onNamespaceChange: (namespace: string) => void;
}

/**
 * Dropdown selector for Kubernetes namespaces
 */
export const NamespaceSelector = memo<NamespaceSelectorProps>(({ 
  selectedNamespace, 
  onNamespaceChange 
}) => {
  const { data: namespaces, isLoading, error, refetch } = useNamespaces();

  if (error) {
    return (
      <div className="space-y-2">
        <label htmlFor="namespace-select" className="block text-sm font-medium text-gray-200">
          Namespace
        </label>
        <ErrorAlert error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="namespace-select" className="block text-sm font-medium text-gray-200">
        Namespace
      </label>
      <div className="relative">
        <select
          id="namespace-select"
          value={selectedNamespace}
          onChange={(e) => onNamespaceChange(e.target.value)}
          disabled={isLoading}
          className="block w-full rounded-md border-0 bg-gray-800 py-2 pl-3 pr-10 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          aria-label="Select namespace"
        >
          <option value="">Select a namespace...</option>
          {namespaces?.map((namespace) => (
            <option key={namespace} value={namespace}>
              {namespace}
            </option>
          ))}
        </select>
        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <LoadingSpinner size="sm" message="" />
          </div>
        )}
      </div>
    </div>
  );
});

NamespaceSelector.displayName = 'NamespaceSelector';

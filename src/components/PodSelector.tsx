import { memo } from 'react';
import { usePods } from '../hooks/usePods';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface PodSelectorProps {
  namespace: string;
  selectedPod: string;
  onPodChange: (pod: string) => void;
}

/**
 * Dropdown selector for pods in a specific namespace
 */
export const PodSelector = memo<PodSelectorProps>(({ 
  namespace, 
  selectedPod, 
  onPodChange 
}) => {
  const { data: pods, isLoading, error, refetch } = usePods(namespace);

  if (!namespace) {
    return (
      <div className="space-y-2">
        <label htmlFor="pod-select" className="block text-sm font-medium text-gray-200">
          Pod
        </label>
        <select
          id="pod-select"
          disabled
          className="block w-full rounded-md border-0 bg-gray-800 py-2 pl-3 pr-10 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Select pod"
        >
          <option>Select a namespace first...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label htmlFor="pod-select" className="block text-sm font-medium text-gray-200">
          Pod
        </label>
        <ErrorAlert error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="pod-select" className="block text-sm font-medium text-gray-200">
        Pod
      </label>
      <div className="relative">
        <select
          id="pod-select"
          value={selectedPod}
          onChange={(e) => onPodChange(e.target.value)}
          disabled={isLoading}
          className="block w-full rounded-md border-0 bg-gray-800 py-2 pl-3 pr-10 text-gray-100 shadow-sm ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          aria-label="Select pod"
        >
          <option value="">Select a pod...</option>
          {pods?.map((pod) => (
            <option key={pod.name} value={pod.name}>
              {pod.name} ({pod.status}, {pod.ready}, {pod.restarts} restarts, {pod.age})
            </option>
          ))}
        </select>
        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <LoadingSpinner size="sm" message="" />
          </div>
        )}
      </div>
      {pods && pods.length === 0 && (
        <p className="text-sm text-gray-400">No pods found in this namespace.</p>
      )}
    </div>
  );
});

PodSelector.displayName = 'PodSelector';

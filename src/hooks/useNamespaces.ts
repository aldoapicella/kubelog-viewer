import { useQuery } from '@tanstack/react-query';
import { k8s } from '../api/k8s';

// Real Kubernetes API v1.Namespace interface
interface Namespace {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    uid: string;
    creationTimestamp: string;
    resourceVersion: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    finalizers?: string[];
  };
  status: {
    phase: 'Active' | 'Terminating';
  };
}

interface NamespaceList {
  apiVersion: string;
  kind: string;
  metadata: {
    resourceVersion: string;
  };
  items: Namespace[];
}

/**
 * Hook to fetch all available namespaces from the Kubernetes cluster
 * @returns React Query result with namespaces data
 */
export function useNamespaces() {
  return useQuery({
    queryKey: ['namespaces'],
    queryFn: async (): Promise<string[]> => {
      const response = await k8s.get<NamespaceList>('/api/v1/namespaces');
      return response.data.items
        .filter(ns => ns.status?.phase === 'Active')
        .map(ns => ns.metadata.name)
        .sort();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

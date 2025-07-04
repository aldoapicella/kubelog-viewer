import { useQuery } from '@tanstack/react-query';
import { k8s } from '../api/k8s';

// Real Kubernetes API v1.Pod interface
interface ContainerPort {
  containerPort: number;
  protocol?: string;
}

interface Container {
  name: string;
  image: string;
  ports?: ContainerPort[];
}

interface PodSpec {
  nodeName?: string;
  containers: Container[];
}

interface PodCondition {
  type: string;
  status: string;
  lastProbeTime?: string;
  lastTransitionTime: string;
  reason?: string;
  message?: string;
}

interface ContainerStatus {
  name: string;
  state: {
    waiting?: { reason: string; message?: string };
    running?: { startedAt: string };
    terminated?: { exitCode: number; reason: string; startedAt: string; finishedAt: string };
  };
  ready: boolean;
  restartCount: number;
  image: string;
  imageID?: string;
  containerID?: string;
}

interface PodStatus {
  phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  conditions?: PodCondition[];
  containerStatuses?: ContainerStatus[];
  startTime?: string;
  podIP?: string;
}

interface Pod {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
    resourceVersion: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: PodSpec;
  status: PodStatus;
}

interface PodList {
  apiVersion: string;
  kind: string;
  metadata: {
    resourceVersion: string;
  };
  items: Pod[];
}

export interface PodInfo {
  name: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
}

/**
 * Hook to fetch pods from a specific namespace
 * @param namespace - The namespace to fetch pods from
 * @returns React Query result with pods data
 */
export function usePods(namespace: string) {
  return useQuery({
    queryKey: ['pods', namespace],
    queryFn: async (): Promise<PodInfo[]> => {
      const response = await k8s.get<PodList>(`/api/v1/namespaces/${namespace}/pods`);
      
      return response.data.items.map(pod => {
        const containerStatuses = pod.status?.containerStatuses || [];
        const readyContainers = containerStatuses.filter(c => c?.ready).length;
        const totalContainers = containerStatuses.length;
        const restarts = containerStatuses.reduce((sum, c) => sum + (c?.restartCount || 0), 0);
        
        // Calculate age
        const createdAt = new Date(pod.metadata.creationTimestamp);
        const now = new Date();
        const ageMs = now.getTime() - createdAt.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageHours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let age: string;
        if (ageDays > 0) {
          age = `${ageDays}d`;
        } else if (ageHours > 0) {
          age = `${ageHours}h`;
        } else {
          age = `${ageMinutes}m`;
        }
        
        return {
          name: pod.metadata.name,
          status: pod.status?.phase || 'Unknown',
          ready: `${readyContainers}/${totalContainers}`,
          restarts,
          age,
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: Boolean(namespace),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

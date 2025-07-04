import { useQuery } from '@tanstack/react-query';
import { k8s } from '../api/k8s';

export function useLogs(ns: string, pod: string, lines = 100) {
  return useQuery({
    queryKey: ['logs', ns, pod, lines],
    queryFn: async () => {
      const res = await k8s.get<string>(
        `/api/v1/namespaces/${ns}/pods/${pod}/log`,
        { params: { timestamps: true, tailLines: lines } },
      );
      return res.data.split('\n');
    },
    refetchInterval: 5000,
  });
}

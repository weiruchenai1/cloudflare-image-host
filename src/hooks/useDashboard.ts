import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const useDashboard = () => {
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.getStats(),
  });

  const storageQuery = useQuery({
    queryKey: ['dashboard', 'storage'],
    queryFn: () => api.getStorageUsage(),
  });

  return {
    stats: statsQuery.data,
    storage: storageQuery.data,
    isLoading: statsQuery.isLoading || storageQuery.isLoading,
  };
}; 
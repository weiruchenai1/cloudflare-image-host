// src/hooks/useStats.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.getDashboardStats(),
    staleTime: 60000, // 1分钟
    refetchInterval: 300000, // 5分钟自动刷新
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['stats', 'user'],
    queryFn: () => api.getUserStats(),
    staleTime: 60000,
  });
};

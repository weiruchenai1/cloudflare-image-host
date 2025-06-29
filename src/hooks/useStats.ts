// src/hooks/useStats.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

interface DashboardStats {
  users?: {
    total: number;
    active: number;
    growth: string;
  };
  files?: {
    total: number;
    growth: string;
  };
  shares?: {
    total: number;
    growth: string;
  };
  storage?: {
    used: number;
    growth: string;
  };
  views?: {
    today: number;
    total: number;
    growth: string;
  };
}

interface UserStats {
  storage?: {
    used: number;
    quota: number;
    percentage: number;
  };
  files?: {
    count: number;
  };
  shares?: {
    count: number;
  };
  account?: {
    createdAt: string;
    role: string;
    isActive: boolean;
  };
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.getDashboardStats(),
    staleTime: 60000, // 1分钟
    refetchInterval: 300000, // 5分钟自动刷新
  });
};

export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: ['stats', 'user'],
    queryFn: () => api.getUserStats(),
    staleTime: 60000,
  });
};
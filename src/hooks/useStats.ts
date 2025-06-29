// src/hooks/useStats.ts - 修复版本
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { DashboardStats, UserStats } from '../types';

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['stats', 'dashboard'],
    queryFn: async () => {
      try {
        const data = await api.getDashboardStats();
        return data as DashboardStats;
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // 返回默认数据避免组件崩溃
        return {
          users: { total: 0, active: 0, growth: '+0%' },
          files: { total: 0, growth: '+0%' },
          shares: { total: 0, growth: '+0%' },
          storage: { used: 0, growth: '+0%' },
          views: { today: 0, total: 0, growth: '+0%' }
        } as DashboardStats;
      }
    },
    staleTime: 60000, // 1分钟
    refetchInterval: 300000, // 5分钟自动刷新
    retry: 1,
  });
};

export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: ['stats', 'user'],
    queryFn: async () => {
      try {
        const data = await api.getUserStats();
        return data as UserStats;
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        // 返回默认数据避免组件崩溃
        return {
          storage: { used: 0, quota: 0, percentage: 0 },
          files: { count: 0 },
          shares: { count: 0 },
          account: { createdAt: new Date().toISOString(), role: 'user', isActive: true }
        } as UserStats;
      }
    },
    staleTime: 60000,
    retry: 1,
  });
};
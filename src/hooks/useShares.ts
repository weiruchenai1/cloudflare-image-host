// src/hooks/useShares.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';

export const useShares = () => {
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ['shares'],
    queryFn: () => api.getShares(),
  });

  const createMutation = useMutation({
    mutationFn: ({ fileId, options }: { 
      fileId: string; 
      options: { password?: string; expiresAt?: string; maxViews?: number } 
    }) => api.createShare(fileId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      toast.success('分享链接创建成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '创建失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      toast.success('分享链接删除成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '删除失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ shareId, data }: { shareId: string; data: any }) =>
      api.updateShare(shareId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      toast.success('分享设置更新成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '更新失败');
    },
  });

  return {
    shares: (sharesQuery.data as { shares?: any[] })?.shares || [],
    isLoading: sharesQuery.isLoading,
    createShare: createMutation.mutate,
    deleteShare: deleteMutation.mutate,
    updateShare: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};

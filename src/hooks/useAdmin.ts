// src/hooks/useAdmin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';

export const useUsers = () => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.getUsers(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, action, value }: { userId: string; action: string; value?: any }) =>
      api.updateUser(userId, action, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('用户更新成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '更新失败');
    },
  });

  return {
    users: (usersQuery.data as { users?: any[] })?.users || [],
    isLoading: usersQuery.isLoading,
    updateUser: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};

export const useInviteCodes = () => {
  const queryClient = useQueryClient();

  const invitesQuery = useQuery({
    queryKey: ['admin', 'invites'],
    queryFn: () => api.getInviteCodes(),
  });

  const generateMutation = useMutation({
    mutationFn: (options: { expiresAt?: string; maxUses?: number }) =>
      api.generateInviteCode(options),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      toast.success(`邀请码生成成功：${data.invite?.code || ''}`);
    },
    onError: (error: any) => {
      toast.error(error.message || '生成失败');
    },
  });

  return {
    invites: (invitesQuery.data as { invites?: any[] })?.invites || [],
    isLoading: invitesQuery.isLoading,
    generateInvite: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
  };
};

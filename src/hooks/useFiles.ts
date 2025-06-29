// src/hooks/useFiles.ts - 修复版本
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';

export const useFiles = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  folderId?: string;
}) => {
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ['files', params],
    queryFn: () => api.getFiles(params),
    staleTime: 30000, // 30秒
    retry: 1,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, folderId, tags }: { file: File; folderId?: string; tags?: string }) =>
      api.uploadFile(file, folderId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      throw error; // 重新抛出错误以便组件处理
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('文件删除成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '删除失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ fileId, action, data }: { fileId: string; action: string; data: any }) =>
      api.updateFile(fileId, action, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('文件更新成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '更新失败');
    },
  });

  return {
    files: filesQuery.data?.files || [],
    pagination: filesQuery.data?.pagination,
    total: filesQuery.data?.pagination?.total || 0,
    isLoading: filesQuery.isLoading,
    error: filesQuery.error,
    uploadFile: uploadMutation.mutateAsync, // 使用 mutateAsync 以便处理异步结果
    deleteFile: deleteMutation.mutate,
    updateFile: updateMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    refetch: filesQuery.refetch,
  };
};

export const useFolders = (parentId?: string) => {
  const queryClient = useQueryClient();

  const foldersQuery = useQuery({
    queryKey: ['folders', parentId],
    queryFn: () => api.getFolders(parentId),
    staleTime: 60000, // 1分钟
  });

  const createMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      api.createFolder(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('文件夹创建成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '创建失败');
    },
  });

  return {
    folders: foldersQuery.data?.folders || [],
    isLoading: foldersQuery.isLoading,
    error: foldersQuery.error,
    createFolder: createMutation.mutate,
    isCreating: createMutation.isPending,
    refetch: foldersQuery.refetch,
  };
};
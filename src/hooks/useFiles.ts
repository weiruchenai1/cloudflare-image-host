// src/hooks/useFiles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';

export const useFiles = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}) => {
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ['files', params],
    queryFn: () => api.getFiles(params),
    staleTime: 30000, // 30秒
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, folderId, tags }: { file: File; folderId?: string; tags?: string }) =>
      api.uploadFile(file, folderId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('文件上传成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '上传失败');
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
    files: (filesQuery.data as { files?: any[] })?.files || [],
    total: (filesQuery.data as { total?: number })?.total || 0,
    isLoading: filesQuery.isLoading,
    error: filesQuery.error,
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    updateFile: updateMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    refetch: filesQuery.refetch,
  };
};

export const useFolders = () => {
  const queryClient = useQueryClient();

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: () => api.getFolders(),
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
    folders: (foldersQuery.data as { folders?: any[] })?.folders || [],
    isLoading: foldersQuery.isLoading,
    createFolder: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};

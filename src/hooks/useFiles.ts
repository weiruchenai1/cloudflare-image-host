import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';

export const useFiles = () => {
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ['files'],
    queryFn: () => api.getFiles(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: string }) =>
      api.uploadFile(file, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['files']);
      toast.success('文件上传成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '上传失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries(['files']);
      toast.success('文件删除成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '删除失败');
    },
  });

  return {
    files: (filesQuery.data as { files?: any[] })?.files || [],
    isLoading: filesQuery.isLoading,
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

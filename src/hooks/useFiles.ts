import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { FileItem } from '../types';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

interface FilesResponse {
  files: FileItem[];
}

export const useFiles = () => {
  const queryClient = useQueryClient();
  const { language } = useAppStore();

  const { data, isLoading } = useQuery<FilesResponse>({
    queryKey: ['files'],
    queryFn: async () => {
      const response = await api.getFiles();
      return response;
    }
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      await api.deleteFile(fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success(language === 'zh' ? '文件已删除' : 'File deleted');
    },
    onError: (error) => {
      console.error('Error deleting file:', error);
      toast.error(language === 'zh' ? '删除文件失败' : 'Failed to delete file');
    }
  });

  const updateFile = useMutation({
    mutationFn: async ({ fileId, data }: { fileId: string; data: Partial<FileItem> }) => {
      await api.updateFile(fileId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success(language === 'zh' ? '文件已更新' : 'File updated');
    },
    onError: (error) => {
      console.error('Error updating file:', error);
      toast.error(language === 'zh' ? '更新文件失败' : 'Failed to update file');
    }
  });

  return {
    files: data?.files || [],
    isLoading,
    deleteFile: deleteFile.mutate,
    updateFile: updateFile.mutate
  };
};

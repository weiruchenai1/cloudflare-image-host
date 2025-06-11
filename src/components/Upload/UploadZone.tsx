import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileType, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
}

const UploadZone: React.FC = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // 开始上传
    newFiles.forEach(uploadFile);
  }, []);

  const uploadFile = async (file: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'uploading' } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'success', progress: 100, url: response.url }
              : f
          ));
          toast.success(`${file.name} 上传成功！`);
        } else {
          throw new Error('上传失败');
        }
      };

      xhr.onerror = () => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ));
        toast.error(`${file.name} 上传失败！`);
      };

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'error' } : f
      ));
      toast.error(`${file.name} 上传失败！`);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        
        <motion.div
          animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isDragActive ? '释放文件开始上传' : '拖拽文件到此处或点击选择'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              支持图片、视频、文档等多种格式，单文件最大 100MB
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">JPG</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">PNG</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">MP4</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">PDF</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">ZIP</span>
          </div>
        </motion.div>
      </motion.div>

      {/* 文件列表 */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              上传队列 ({files.length})
            </h4>
            
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <FileType className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                      {file.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                {/* 进度条 */}
                {file.status === 'uploading' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${file.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;

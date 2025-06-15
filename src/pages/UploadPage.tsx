// src/pages/UploadPage.tsx
import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileType, CheckCircle, AlertCircle, X, Folder, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import { useFiles, useFolders } from '../hooks/useFiles';

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

const UploadPage: React.FC = () => {
  const { language } = useAppStore();
  const { uploadFile, isUploading } = useFiles();
  const { folders, createFolder } = useFolders();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [tags, setTags] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // 处理被拒绝的文件
    rejectedFiles.forEach((rejected: FileRejection) => {
      toast.error(`${rejected.file.name}: ${language === 'zh' ? '文件类型不支持或文件过大' : 'File type not supported or file too large'}`);
    });

    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(2, 11),
      progress: 0,
      status: 'pending'
    }));
    
    setFiles((prev: UploadFile[]) => [...prev, ...newFiles]);
    
    // 开始上传
    newFiles.forEach(handleUploadFile);
  }, [language]);

  const handleUploadFile = async (file: UploadFile) => {
    setFiles((prev: UploadFile[]) => prev.map((f: UploadFile) =>
      f.id === file.id ? { ...f, status: 'uploading' } : f
    ));

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setFiles((prev: UploadFile[]) => prev.map((f: UploadFile) =>
          f.id === file.id && f.status === 'uploading' 
            ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) } 
            : f
        ));
      }, 500);

      await uploadFile({
        file,
        folderId: selectedFolder || undefined,
        tags: tags || undefined
      });

      clearInterval(progressInterval);
      
      setFiles((prev: UploadFile[]) => prev.map((f: UploadFile) =>
        f.id === file.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));
    } catch (error: any) {
      setFiles((prev: UploadFile[]) => prev.map((f: UploadFile) =>
        f.id === file.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev: UploadFile[]) => prev.filter((f: UploadFile) => f.id !== fileId));
  };

  const retryUpload = (file: UploadFile) => {
    setFiles((prev: UploadFile[]) => prev.map((f: UploadFile) =>
      f.id === file.id ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
    handleUploadFile(file);
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
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  });

  const handleCreateFolder = () => {
    const folderName = prompt(language === 'zh' ? '请输入文件夹名称：' : 'Enter folder name:');
    if (folderName?.trim()) {
      createFolder({ name: folderName.trim() });
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'zh' ? '文件上传' : 'File Upload'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '支持多种文件格式，拖拽或点击选择文件开始上传' : 'Support multiple file formats, drag and drop or click to select files'}
          </p>
        </div>
      </motion.div>

      {/* 上传区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
            hover:scale-[1.02] active:scale-[0.98]
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }
          `}
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
                {isDragActive 
                  ? (language === 'zh' ? '释放文件开始上传' : 'Release files to upload')
                  : (language === 'zh' ? '拖拽文件到此处或点击选择' : 'Drag files here or click to select')
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {language === 'zh' 
                  ? '支持图片、视频、文档等多种格式，单文件最大 100MB'
                  : 'Support images, videos, documents and more, max 100MB per file'
                }
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
        </div>
      </motion.div>

      {/* 上传设置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* 文件夹设置 */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2" />
            {language === 'zh' ? '上传到文件夹' : 'Upload to Folder'}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">{language === 'zh' ? '根目录' : 'Root Directory'}</option>
                {folders.map((folder: any) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreateFolder}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {language === 'zh' ? '新建' : 'New'}
              </button>
            </div>
          </div>
        </div>

        {/* 标签设置 */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            {language === 'zh' ? '添加标签' : 'Add Tags'}
          </h3>
          
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={language === 'zh' ? '输入标签，用逗号分隔' : 'Enter tags, separated by commas'}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>
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
              {language === 'zh' ? '上传队列' : 'Upload Queue'} ({files.length})
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
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <button
                          onClick={() => retryUpload(file)}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                        >
                          {language === 'zh' ? '重试' : 'Retry'}
                        </button>
                      </div>
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
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${file.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* 错误信息 */}
                {file.status === 'error' && file.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {language === 'zh' ? '错误：' : 'Error: '}{file.error}
                    </p>
                  </div>
                )}

                {/* 成功状态 */}
                {file.status === 'success' && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {language === 'zh' ? '上传成功！' : 'Upload successful!'}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 上传提示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
      >
        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          {language === 'zh' ? '上传说明' : 'Upload Instructions'}
        </h4>
        
        <ul className="space-y-2 text-blue-800 dark:text-blue-200">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {language === 'zh' 
              ? '支持的文件格式：JPG, PNG, GIF, WEBP, SVG, MP4, WEBM, MOV, PDF, ZIP, RAR'
              : 'Supported formats: JPG, PNG, GIF, WEBP, SVG, MP4, WEBM, MOV, PDF, ZIP, RAR'
            }
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {language === 'zh' ? '单个文件最大支持 100MB' : 'Maximum file size: 100MB per file'}
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {language === 'zh' ? '支持批量上传，可同时选择多个文件' : 'Batch upload supported, select multiple files at once'}
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {language === 'zh' ? '上传失败的文件可以点击重试按钮重新上传' : 'Failed uploads can be retried using the retry button'}
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default UploadPage;

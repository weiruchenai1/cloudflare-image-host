import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share, Eye } from 'lucide-react';
import { FileItem } from '../types';

interface FilePreviewProps {
  file: FileItem;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onClose,
  onDownload,
  onShare
}) => {
  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.originalName}
          className="max-w-full max-h-96 object-contain mx-auto rounded-lg"
        />
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-full max-h-96 mx-auto rounded-lg"
        >
          您的浏览器不支持视频播放
        </video>
      );
    } else if (file.type === 'application/pdf') {
      return (
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold">PDF</span>
          </div>
          <p className="text-gray-600">PDF 文件预览</p>
          <p className="text-sm text-gray-500 mt-2">点击下载按钮查看完整文档</p>
        </div>
      );
    } else {
      return (
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-600 font-bold">FILE</span>
          </div>
          <p className="text-gray-600">无法预览此文件类型</p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {file.originalName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onShare}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Share className="w-5 h-5" />
            </button>
            <button
              onClick={onDownload}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 预览内容 */}
        <div className="p-6 max-h-[70vh] overflow-auto">
          {renderPreview()}
        </div>

        {/* 底部信息 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>类型: {file.type}</span>
              <span>大小: {(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>{file.isPublic ? '公开' : '私有'}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FilePreview;

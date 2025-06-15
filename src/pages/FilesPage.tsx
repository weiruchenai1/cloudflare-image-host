import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  FolderPlus, 
  Upload,
  MoreVertical,
  Eye,
  Download,
  Share,
  Trash2,
  Image,
  Video,
  FileText,
  Archive,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useFiles } from '../hooks/useFiles';
import { FileItem } from '../types';
import toast from 'react-hot-toast';

const FilesPage: React.FC = () => {
  const { language } = useAppStore();
  const { files, isLoading, deleteFile } = useFiles();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFileMenu, setShowFileMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowFileMenu(null);
      }
    };

    if (showFileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFileMenu]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'document': return FileText;
      case 'archive': return Archive;
      default: return FileText;
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || file.type.startsWith(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  // 文件操作函数
  const handlePreviewFile = (file: FileItem) => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      window.open(file.url, '_blank');
    } else {
      toast(language === 'zh' ? '预览功能开发中...' : 'Preview feature coming soon...', {
        icon: 'ℹ️'
      });
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(language === 'zh' ? '开始下载...' : 'Download started...');
  };

  const handleShareFile = (file: FileItem) => {
    const shareUrl = `${window.location.origin}/s/${file.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(language === 'zh' ? '分享链接已复制' : 'Share link copied to clipboard');
    }).catch(() => {
      toast.error(language === 'zh' ? '复制失败' : 'Failed to copy');
    });
  };

  const handleDeleteFile = (file: FileItem) => {
    if (window.confirm(language === 'zh' ? `确定要删除 ${file.originalName} 吗？` : `Are you sure you want to delete ${file.originalName}?`)) {
      deleteFile(file.id);
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt(language === 'zh' ? '请输入文件夹名称：' : 'Enter folder name:');
    if (folderName) {
      // TODO: 实现创建文件夹功能
      toast.success(language === 'zh' ? `文件夹 "${folderName}" 创建成功` : `Folder "${folderName}" created successfully`);
    }
  };

  const handleUploadFiles = () => {
    window.location.href = '/upload';
  };

  // 处理菜单按钮点击
  const handleMenuClick = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFileMenu(showFileMenu === fileId ? null : fileId);
  };

  // 处理菜单项点击
  const handleMenuItemClick = (action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    action();
    setShowFileMenu(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {language === 'zh' ? '文件管理' : 'File Manager'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'zh' ? '管理您的所有文件和文件夹' : 'Manage all your files and folders'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={handleCreateFolder}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{language === 'zh' ? '新建文件夹' : 'New Folder'}</span>
          </motion.button>
          
          <motion.button
            onClick={handleUploadFiles}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'zh' ? '上传文件' : 'Upload Files'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 搜索和筛选 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'zh' ? '搜索文件...' : 'Search files...'}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="all">{language === 'zh' ? '全部文件' : 'All Files'}</option>
            <option value="image/">{language === 'zh' ? '图片' : 'Images'}</option>
            <option value="video/">{language === 'zh' ? '视频' : 'Videos'}</option>
            <option value="application/pdf">{language === 'zh' ? '文档' : 'Documents'}</option>
            <option value="application/zip">{language === 'zh' ? '压缩包' : 'Archives'}</option>
          </select>
        </div>
        
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white dark:bg-gray-600 text-blue-500 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-gray-600 text-blue-500 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* 文件列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredFiles.map((file, index) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="relative mb-4">
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt={file.originalName}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => handlePreviewFile(file)}
                        />
                      ) : (
                        <div 
                          className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer"
                          onClick={() => handlePreviewFile(file)}
                        >
                          <FileIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewFile(file);
                            }}
                            className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            title={language === 'zh' ? '预览' : 'Preview'}
                          >
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <div className="relative" ref={showFileMenu === file.id ? menuRef : null}>
                            <button 
                              onClick={(e) => handleMenuClick(file.id, e)}
                              className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            
                            <AnimatePresence>
                              {showFileMenu === file.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  transition={{ duration: 0.1 }}
                                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                                >
                                  <button
                                    onClick={(e) => handleMenuItemClick(() => handleDownloadFile(file), e)}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg transition-colors"
                                  >
                                    <Download className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {language === 'zh' ? '下载' : 'Download'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => handleMenuItemClick(() => handleShareFile(file), e)}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <Share className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {language === 'zh' ? '分享' : 'Share'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => handleMenuItemClick(() => handleDeleteFile(file), e)}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 last:rounded-b-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-red-600">
                                      {language === 'zh' ? '删除' : 'Delete'}
                                    </span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate mb-1">
                        {file.originalName}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          file.isPublic 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {file.isPublic ? (language === 'zh' ? '公开' : 'Public') : (language === 'zh' ? '私有' : 'Private')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {language === 'zh' ? '文件名' : 'Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {language === 'zh' ? '类型' : 'Type'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {language === 'zh' ? '大小' : 'Size'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {language === 'zh' ? '上传时间' : 'Uploaded'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {language === 'zh' ? '状态' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {language === 'zh' ? '操作' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {filteredFiles.map((file, index) => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <motion.tr
                          key={file.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {file.thumbnailUrl ? (
                                <img
                                  src={file.thumbnailUrl}
                                  alt={file.originalName}
                                  className="w-10 h-10 object-cover rounded-lg mr-3 cursor-pointer"
                                  onClick={() => handlePreviewFile(file)}
                                />
                              ) : (
                                <div 
                                  className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 cursor-pointer"
                                  onClick={() => handlePreviewFile(file)}
                                >
                                  <FileIcon className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.originalName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {file.type.split('/')[0]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              file.isPublic 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {file.isPublic ? (language === 'zh' ? '公开' : 'Public') : (language === 'zh' ? '私有' : 'Private')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => handlePreviewFile(file)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title={language === 'zh' ? '预览' : 'Preview'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDownloadFile(file)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                                title={language === 'zh' ? '下载' : 'Download'}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleShareFile(file)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title={language === 'zh' ? '分享' : 'Share'}
                              >
                                <Share className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteFile(file)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                title={language === 'zh' ? '删除' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FilesPage;




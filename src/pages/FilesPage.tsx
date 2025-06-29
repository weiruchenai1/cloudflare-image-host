// src/pages/FilesPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
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
  Calendar,
  Edit,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useFiles, useFolders } from '../hooks/useFiles';
import { useShares } from '../hooks/useShares';
import { toast } from 'react-hot-toast';

const FilesPage: React.FC = () => {
  const { language } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFileMenu, setShowFileMenu] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [showDirectLinkModal, setShowDirectLinkModal] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const { 
    files, 
    isLoading, 
    deleteFile, 
    updateFile,
    refetch 
  } = useFiles({
    search: searchQuery,
    type: selectedFilter === 'all' ? undefined : selectedFilter
  });

  const { folders, createFolder } = useFolders();
  const { createShare } = useShares();

  // 处理URL搜索参数
  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

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
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.includes('pdf')) return FileText;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    return FileText;
  };

  // 文件操作函数
  const handlePreviewFile = (file: any) => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      window.open(file.url, '_blank');
    } else {
      toast(language === 'zh' ? '预览功能开发中...' : 'Preview feature coming soon...', {
        icon: 'ℹ️'
      });
    }
  };

  const handleDownloadFile = (file: any) => {
    if (file.url && file.url !== '#') {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(language === 'zh' ? '开始下载...' : 'Download started...');
    } else {
      toast(language === 'zh' ? '下载功能开发中...' : 'Download feature coming soon...', {
        icon: 'ℹ️'
      });
    }
  };

  const handleShareFile = (file: any) => {
    createShare({
      fileId: file.id,
      options: {}
    });
    setShowFileMenu(null);
  };

  const handleDirectLinkFile = (file: any) => {
    setShowDirectLinkModal(file.id);
    setShowFileMenu(null);
  };

  const handleDeleteFile = (file: any) => {
    if (window.confirm(language === 'zh' ? `确定要删除 ${file.originalName} 吗？` : `Are you sure you want to delete ${file.originalName}?`)) {
      deleteFile(file.id);
    }
    setShowFileMenu(null);
  };

  const handleRenameFile = (file: any) => {
    setNewFileName(file.originalName);
    setShowRenameModal(file.id);
    setShowFileMenu(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(language === 'zh' ? '链接已复制' : 'Link copied to clipboard');
    } catch (error) {
      toast.error(language === 'zh' ? '复制失败' : 'Failed to copy');
    }
  };

  const confirmRename = () => {
    if (showRenameModal && newFileName.trim()) {
      updateFile({
        fileId: showRenameModal,
        action: 'rename',
        data: { newName: newFileName.trim() }
      });
      setShowRenameModal(null);
      setNewFileName('');
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt(language === 'zh' ? '请输入文件夹名称：' : 'Enter folder name:');
    if (folderName?.trim()) {
      createFolder({ name: folderName.trim() });
    }
  };

  const handleUploadFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.pdf,.zip,.rar';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // 这里应该调用上传逻辑
        toast.success(language === 'zh' ? `准备上传 ${files.length} 个文件` : `Ready to upload ${files.length} files`);
        // 可以导航到上传页面或者直接在这里处理上传
        window.location.href = '/upload';
      }
    };
    input.click();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
    refetch();
  };

  // 生成直链访问地址
  const generateDirectLink = (file: any) => {
    if (!file) return '';
    
    // 如果有文件夹，则使用文件夹名/文件名的路径
    // 如果没有文件夹，则直接使用文件名
    if (file.folderId && file.folderId !== 'default') {
      const folder = folders.find((f: any) => f.id === file.folderId);
      const folderName = folder ? folder.name : '';
      if (folderName) {
        return `${window.location.origin}/s/${folderName}/${file.originalName}`;
      }
    }
    
    // 文件在根目录
    return `${window.location.origin}/s/${file.originalName}`;
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
  };

  // 渲染文件菜单
  const renderFileMenu = (file: any) => (
    <AnimatePresence>
      {showFileMenu === file.id && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
        >
          <div className="py-1">
            <button
              onClick={(e) => handleMenuItemClick(() => handlePreviewFile(file), e)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              {language === 'zh' ? '预览' : 'Preview'}
            </button>
            <button
              onClick={(e) => handleMenuItemClick(() => handleDownloadFile(file), e)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === 'zh' ? '下载' : 'Download'}
            </button>
            <button
              onClick={(e) => handleMenuItemClick(() => handleShareFile(file), e)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Share className="w-4 h-4 mr-2" />
              {language === 'zh' ? '创建分享链接' : 'Create Share'}
            </button>
            <button
              onClick={(e) => handleMenuItemClick(() => handleDirectLinkFile(file), e)}
              className="flex items-center w-full px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {language === 'zh' ? '直链访问' : 'Direct Link'}
            </button>
            <button
              onClick={(e) => handleMenuItemClick(() => handleRenameFile(file), e)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              {language === 'zh' ? '重命名' : 'Rename'}
            </button>
            <button
              onClick={(e) => handleMenuItemClick(() => handleDeleteFile(file), e)}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {language === 'zh' ? '删除' : 'Delete'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '加载文件中...' : 'Loading files...'}
          </p>
        </div>
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
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'zh' ? '搜索文件...' : 'Search files...'}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="all">{language === 'zh' ? '全部文件' : 'All Files'}</option>
            <option value="image">{language === 'zh' ? '图片' : 'Images'}</option>
            <option value="video">{language === 'zh' ? '视频' : 'Videos'}</option>
            <option value="document">{language === 'zh' ? '文档' : 'Documents'}</option>
            <option value="archive">{language === 'zh' ? '压缩包' : 'Archives'}</option>
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
        {files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {language === 'zh' ? '暂无文件' : 'No files found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery 
                ? (language === 'zh' ? '没有找到匹配的文件' : 'No files match your search')
                : (language === 'zh' ? '开始上传您的第一个文件' : 'Start by uploading your first file')
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {files.map((file: any, index: number) => {
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
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
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
                            
                            {renderFileMenu(file)}
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
                    {files.map((file: any, index: number) => {
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
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={file.url}
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
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
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
                                onClick={() => handleRenameFile(file)}
                                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                title={language === 'zh' ? '重命名' : 'Rename'}
                              >
                                <Edit className="w-4 h-4" />
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
                                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                title={language === 'zh' ? '分享' : 'Share'}
                              >
                                <Share className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDirectLinkFile(file)}
                                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                title={language === 'zh' ? '直链访问' : 'Direct Link'}
                              >
                                <LinkIcon className="w-4 h-4" />
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

      {/* 重命名模态框 */}
      <AnimatePresence>
        {showRenameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'zh' ? '重命名文件' : 'Rename File'}
              </h3>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
                placeholder={language === 'zh' ? '文件名称' : 'File name'}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRenameModal(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={confirmRename}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  {language === 'zh' ? '确定' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 直链访问模态框 */}
      <AnimatePresence>
        {showDirectLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'zh' ? '直链访问' : 'Direct Link Access'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {language === 'zh' ? '可以通过以下链接直接访问文件：' : 'Access your file directly via this link:'}
              </p>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  readOnly
                  value={generateDirectLink(files.find(f => f.id === showDirectLinkModal))}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => copyToClipboard(generateDirectLink(files.find(f => f.id === showDirectLinkModal)))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {language === 'zh' 
                    ? '注意：您需要先在分享设置中创建分享链接，或将文件设为公开才能通过直链访问。'
                    : 'Note: You need to create a share link in sharing settings or set the file as public to access via direct link.'}
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDirectLinkModal(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {language === 'zh' ? '关闭' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === showDirectLinkModal);
                    if (file) {
                      updateFile({
                        fileId: file.id,
                        action: 'toggle_public',
                        data: {}
                      });
                      setShowDirectLinkModal(null);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  {language === 'zh' 
                    ? (files.find(f => f.id === showDirectLinkModal)?.isPublic ? '设为私有' : '设为公开')
                    : (files.find(f => f.id === showDirectLinkModal)?.isPublic ? 'Set Private' : 'Set Public')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilesPage;

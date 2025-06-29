// src/pages/SharesPage.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share,
  Link as LinkIcon,
  Eye,
  Copy,
  Trash2,
  Settings,
  Calendar,
  Lock,
  Globe,
  Plus,
  Edit,
  FileText,
  Image,
  Video,
  Archive
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useShares } from '../hooks/useShares';
import { useFiles } from '../hooks/useFiles';
import { toast } from 'react-hot-toast';

const SharesPage: React.FC = () => {
  const { language } = useAppStore();
  const { shares, isLoading, createShare, deleteShare, updateShare } = useShares();
  const { files, updateFile } = useFiles();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showDirectLinkModal, setShowDirectLinkModal] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    fileId: '',
    password: '',
    expiresAt: '',
    maxViews: ''
  });
  const [editForm, setEditForm] = useState({
    password: '',
    expiresAt: '',
    maxViews: '',
    isActive: true
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(language === 'zh' ? '链接已复制' : 'Link copied to clipboard');
    } catch (error) {
      toast.error(language === 'zh' ? '复制失败' : 'Failed to copy');
    }
  };

  const handleCreateShare = () => {
    if (!createForm.fileId) {
      toast.error(language === 'zh' ? '请选择文件' : 'Please select a file');
      return;
    }

    const options: any = {};
    if (createForm.password) options.password = createForm.password;
    if (createForm.expiresAt) options.expiresAt = createForm.expiresAt;
    if (createForm.maxViews) options.maxViews = parseInt(createForm.maxViews);

    createShare({
      fileId: createForm.fileId,
      options
    });

    setShowCreateModal(false);
    setCreateForm({
      fileId: '',
      password: '',
      expiresAt: '',
      maxViews: ''
    });
  };

  const handleEditShare = (share: any) => {
    setEditForm({
      password: share.password || '',
      expiresAt: share.expiresAt || '',
      maxViews: share.maxViews?.toString() || '',
      isActive: share.isActive
    });
    setShowEditModal(share.id);
  };

  const handleUpdateShare = () => {
    if (!showEditModal) return;

    const data: any = {
      isActive: editForm.isActive
    };
    if (editForm.password) data.password = editForm.password;
    if (editForm.expiresAt) data.expiresAt = editForm.expiresAt;
    if (editForm.maxViews) data.maxViews = parseInt(editForm.maxViews);

    updateShare({
      shareId: showEditModal,
      data
    });

    setShowEditModal(null);
  };

  const handleDeleteShare = (shareId: string) => {
    if (window.confirm(language === 'zh' ? '确定要删除这个分享链接吗？' : 'Are you sure you want to delete this share link?')) {
      deleteShare(shareId);
    }
  };

  // 生成直链访问地址
  const generateDirectLink = (share: any) => {
    const file = files.find(f => f.id === share.fileId);
    if (!file) return '';
    
    // 如果有文件夹，则使用文件夹名/文件名的路径
    // 如果没有文件夹，则直接使用文件名
    if (file.folderId && file.folderId !== 'default') {
      const folder = files.find(f => f.id === file.folderId);
      const folderName = folder ? folder.name : file.folderPath;
      if (folderName) {
        return `${window.location.origin}/s/${folderName}/${file.originalName}`;
      }
    }
    
    // 文件在根目录
    return `${window.location.origin}/s/${file.originalName}`;
  };

  // 切换文件公开状态
  const toggleFilePublic = (fileId: string) => {
    updateFile({
      fileId,
      action: 'toggle_public',
      data: {}
    });
    setShowDirectLinkModal(null);
    toast.success(language === 'zh' ? '文件可见性已更新' : 'File visibility updated');
  };

  const totalViews = shares.reduce((total: number, share: any) => total + (share.currentViews || 0), 0);
  const activeShares = shares.filter((share: any) => share.isActive);
  const protectedShares = shares.filter((share: any) => share.password);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '加载分享数据...' : 'Loading shares...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {language === 'zh' ? '分享管理' : 'Share Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'zh' ? '管理您的所有分享链接' : 'Manage all your share links'}
          </p>
        </div>
        
        <motion.button
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'zh' ? '创建分享' : 'Create Share'}</span>
        </motion.button>
      </motion.div>

      {/* 统计卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '总分享数' : 'Total Shares'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {shares.length}
              </p>
            </div>
            <Share className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '总访问量' : 'Total Views'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalViews}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '活跃分享' : 'Active Shares'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeShares.length}
              </p>
            </div>
            <Globe className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '密码保护' : 'Protected'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {protectedShares.length}
              </p>
            </div>
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* 分享列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 dark:bg-gray-700/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'zh' ? '文件' : 'File'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'zh' ? '分享链接' : 'Share Link'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'zh' ? '直链访问' : 'Direct Link'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'zh' ? '状态' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'zh' ? '访问' : 'Views'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'zh' ? '创建时间' : 'Created'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'zh' ? '操作' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {shares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '暂无分享链接' : 'No shares yet'}
                  </td>
                </tr>
              ) : (
                shares.map((share: any) => {
                  const file = files.find(f => f.id === share.fileId);
                  const isPublic = file?.isPublic || false;
                  return (
                    <tr key={share.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                            {file?.type.startsWith('image/') ? (
                              <img src={file.url} alt={file.originalName} className="h-10 w-10 object-cover rounded-lg" />
                            ) : (
                              <FileIcon type={file?.type} />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={file?.originalName || '未知文件'}>
                              {file?.originalName || '已删除的文件'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file?.size || 0)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            readOnly
                            className="text-sm text-gray-600 dark:text-gray-300 bg-transparent truncate max-w-[150px]"
                            value={share.url}
                          />
                          <button
                            onClick={() => copyToClipboard(share.url)}
                            className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowDirectLinkModal(share.id)}
                            className="inline-flex items-center space-x-1 px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>{language === 'zh' ? '查看直链' : 'View Direct Link'}</span>
                          </button>
                          {isPublic && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                              <Globe className="w-3 h-3 mr-1" />
                              {language === 'zh' ? '公开' : 'Public'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {share.isActive ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                              {language === 'zh' ? '活跃' : 'Active'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              {language === 'zh' ? '已禁用' : 'Disabled'}
                            </span>
                          )}
                          {share.password && (
                            <span className="ml-2">
                              <Lock className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                          {share.expiresAt && (
                            <span className="ml-2">
                              <Calendar className="w-4 h-4 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {share.currentViews || 0}
                        {share.maxViews ? ` / ${share.maxViews}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(share.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditShare(share)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteShare(share.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 创建分享模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'zh' ? '创建分享链接' : 'Create Share Link'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '选择文件' : 'Select File'}
                </label>
                <select
                  value={createForm.fileId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, fileId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">{language === 'zh' ? '请选择文件' : 'Please select a file'}</option>
                  {files.map((file: any) => (
                    <option key={file.id} value={file.id}>
                      {file.originalName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '访问密码（可选）' : 'Access Password (Optional)'}
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder={language === 'zh' ? '留空表示无密码' : 'Leave empty for no password'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '过期时间（可选）' : 'Expiration Date (Optional)'}
                </label>
                <input
                  type="datetime-local"
                  value={createForm.expiresAt}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '最大访问次数（可选）' : 'Max Views (Optional)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={createForm.maxViews}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, maxViews: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder={language === 'zh' ? '留空表示无限制' : 'Leave empty for unlimited'}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({
                    fileId: '',
                    password: '',
                    expiresAt: '',
                    maxViews: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateShare}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {language === 'zh' ? '创建' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 编辑分享模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'zh' ? '编辑分享设置' : 'Edit Share Settings'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'zh' ? '启用分享' : 'Enable Share'}
                </label>
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '访问密码' : 'Access Password'}
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder={language === 'zh' ? '留空表示无密码' : 'Leave empty for no password'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '过期时间' : 'Expiration Date'}
                </label>
                <input
                  type="datetime-local"
                  value={editForm.expiresAt}
                  onChange={(e) => setEditForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '最大访问次数' : 'Max Views'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.maxViews}
                  onChange={(e) => setEditForm(prev => ({ ...prev, maxViews: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder={language === 'zh' ? '留空表示无限制' : 'Leave empty for unlimited'}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleUpdateShare}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {language === 'zh' ? '保存' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
              {(() => {
                const share = shares.find(s => s.id === showDirectLinkModal);
                if (!share) return null;
                
                const file = files.find(f => f.id === share.fileId);
                if (!file) return null;
                
                const directLink = generateDirectLink(share);
                const isPublic = file.isPublic || false;
                
                return (
                  <>
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
                        value={directLink}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(directLink)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {isPublic
                          ? (language === 'zh' 
                            ? '该文件当前为公开状态，可以通过直链无密码访问。'
                            : 'This file is currently public and can be accessed via direct link without a password.')
                          : (language === 'zh'
                            ? '该文件当前为私有状态，直链访问将受到与分享链接相同的保护。'
                            : 'This file is currently private. Direct link access will be protected by the same settings as the share link.')}
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
                        onClick={() => toggleFilePublic(file.id)}
                        className={`px-4 py-2 text-white rounded-lg ${
                          isPublic 
                            ? 'bg-amber-500 hover:bg-amber-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {isPublic
                          ? (language === 'zh' ? '设为私有' : 'Set Private')
                          : (language === 'zh' ? '设为公开' : 'Set Public')}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 文件图标组件
const FileIcon: React.FC<{ type?: string }> = ({ type }) => {
  if (!type) return <FileText className="w-6 h-6 text-gray-400" />;
  
  if (type.startsWith('image/')) {
    return <Image className="w-6 h-6 text-blue-500" />;
  } else if (type.startsWith('video/')) {
    return <Video className="w-6 h-6 text-purple-500" />;
  } else if (type.includes('pdf')) {
    return <FileText className="w-6 h-6 text-red-500" />;
  } else if (type.includes('zip') || type.includes('rar')) {
    return <Archive className="w-6 h-6 text-amber-500" />;
  }
  
  return <FileText className="w-6 h-6 text-gray-500" />;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default SharesPage;

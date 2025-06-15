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
  Edit
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useShares } from '../hooks/useShares';
import { useFiles } from '../hooks/useFiles';
import { toast } from 'react-hot-toast';

const SharesPage: React.FC = () => {
  const { language } = useAppStore();
  const { shares, isLoading, createShare, deleteShare, updateShare } = useShares();
  const { files } = useFiles();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
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
        transition={{ delay: 0.2 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        {shares.length === 0 ? (
          <div className="text-center py-12">
            <Share className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {language === 'zh' ? '暂无分享链接' : 'No share links'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {language === 'zh' ? '创建您的第一个分享链接' : 'Create your first share link'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {language === 'zh' ? '创建分享' : 'Create Share'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {language === 'zh' ? '文件名' : 'File Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {language === 'zh' ? '分享链接' : 'Share Link'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {language === 'zh' ? '访问量' : 'Views'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {language === 'zh' ? '过期时间' : 'Expires'}
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
                  {shares.map((share: any, index: number) => (
                    <motion.tr
                      key={share.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <LinkIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {share.fileName || 'Unknown File'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate max-w-xs">
                            {share.url || `${window.location.origin}/s/${share.token}`}
                          </span>
                          <button
                            onClick={() => copyToClipboard(share.url || `${window.location.origin}/s/${share.token}`)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {share.currentViews || 0}
                            {share.maxViews && (
                              <span className="text-gray-500 dark:text-gray-400">
                                /{share.maxViews}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {share.expiresAt ? (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {new Date(share.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'zh' ? '永久' : 'Permanent'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            share.isActive 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          }`}>
                            {share.isActive ? (language === 'zh' ? '活跃' : 'Active') : (language === 'zh' ? '禁用' : 'Disabled')}
                          </span>
                          {share.password && (
                            <Lock className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleEditShare(share)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title={language === 'zh' ? '编辑' : 'Edit'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteShare(share.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title={language === 'zh' ? '删除' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
};

export default SharesPage;

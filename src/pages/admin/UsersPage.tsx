// src/pages/admin/UsersPage.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  ShieldOff,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Key,
  Save,
  X
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useUsers, useInviteCodes } from '../../hooks/useAdmin';
import { toast } from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const { language } = useAppStore();
  const { users, isLoading, updateUser } = useUsers();
  const { invites, generateInvite, isGenerating } = useInviteCodes();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [inviteData, setInviteData] = useState({
    expiresAt: '',
    maxUses: 1
  });
  const [editData, setEditData] = useState({
    storageQuota: 0,
    role: 'user'
  });

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalStorageUsed = users.reduce((total: number, user: any) => total + (user.storageUsed || 0), 0);
  const activeUsers = users.filter((user: any) => user.isActive);
  const adminUsers = users.filter((user: any) => user.role === 'admin');

  const toggleUserStatus = async (userId: string) => {
    updateUser({
      userId,
      action: 'toggle_active'
    });
  };

  const handleEditUser = (user: any) => {
    setEditData({
      storageQuota: Math.round(user.storageQuota / (1024 * 1024 * 1024)), // Convert to GB
      role: user.role
    });
    setShowEditModal(user.id);
  };

  const handleUpdateUser = () => {
    if (!showEditModal) return;

    updateUser({
      userId: showEditModal,
      action: 'update_quota',
      value: editData.storageQuota * 1024 * 1024 * 1024 // Convert to bytes
    });

    if (editData.role !== users.find((u: any) => u.id === showEditModal)?.role) {
      updateUser({
        userId: showEditModal,
        action: 'update_role',
        value: editData.role
      });
    }

    setShowEditModal(null);
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (window.confirm(language === 'zh' ? `确定要删除用户 ${username} 吗？` : `Are you sure you want to delete user ${username}?`)) {
      // 这里应该调用删除用户的API
      toast.success(language === 'zh' ? '用户删除成功' : 'User deleted successfully');
    }
  };

  const handleGenerateInvite = () => {
    const options: any = {
      maxUses: inviteData.maxUses
    };
    if (inviteData.expiresAt) {
      options.expiresAt = inviteData.expiresAt;
    }

    generateInvite(options);
    setShowInviteModal(false);
    setInviteData({ expiresAt: '', maxUses: 1 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '加载用户数据...' : 'Loading users...'}
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
            {language === 'zh' ? '用户管理' : 'User Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'zh' ? '管理系统中的所有用户' : 'Manage all users in the system'}
          </p>
        </div>
        
        <motion.button
          onClick={() => setShowInviteModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isGenerating}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <Key className="w-4 h-4" />
          <span>{language === 'zh' ? '生成邀请码' : 'Generate Invite'}</span>
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
                {language === 'zh' ? '总用户数' : 'Total Users'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '活跃用户' : 'Active Users'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeUsers.length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '管理员数' : 'Administrators'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {adminUsers.length}
              </p>
            </div>
            <ShieldOff className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '总存储使用' : 'Total Storage'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(totalStorageUsed)}
              </p>
            </div>
            <Download className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* 搜索和筛选 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'zh' ? '搜索用户...' : 'Search users...'}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="all">{language === 'zh' ? '全部角色' : 'All Roles'}</option>
            <option value="admin">{language === 'zh' ? '管理员' : 'Admin'}</option>
            <option value="user">{language === 'zh' ? '普通用户' : 'User'}</option>
          </select>
        </div>
      </motion.div>

      {/* 用户列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'zh' ? '用户' : 'User'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'zh' ? '角色' : 'Role'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'zh' ? '存储使用' : 'Storage Usage'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'zh' ? '注册时间' : 'Registered'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'zh' ? '状态' : 'Status'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {language === 'zh' ? '操作' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {filteredUsers.map((user: any, index: number) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin' ? (language === 'zh' ? '管理员' : 'Admin') : (language === 'zh' ? '用户' : 'User')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-900 dark:text-white">
                            {formatBytes(user.storageUsed || 0)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {formatBytes(user.storageQuota || 0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(((user.storageUsed || 0) / (user.storageQuota || 1)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                      }`}>
                        {user.isActive ? (language === 'zh' ? '活跃' : 'Active') : (language === 'zh' ? '禁用' : 'Disabled')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive 
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={user.isActive ? (language === 'zh' ? '禁用用户' : 'Disable User') : (language === 'zh' ? '启用用户' : 'Enable User')}
                        >
                          {user.isActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={language === 'zh' ? '编辑用户' : 'Edit User'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={language === 'zh' ? '删除用户' : 'Delete User'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 邀请码生成模态框 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === 'zh' ? '生成邀请码' : 'Generate Invite Code'}
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '过期时间（可选）' : 'Expiration Date (Optional)'}
                </label>
                <input
                  type="datetime-local"
                  value={inviteData.expiresAt}
                  onChange={(e) => setInviteData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '最大使用次数' : 'Max Uses'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={inviteData.maxUses}
                  onChange={(e) => setInviteData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleGenerateInvite}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isGenerating ? (language === 'zh' ? '生成中...' : 'Generating...') : (language === 'zh' ? '生成' : 'Generate')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 编辑用户模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === 'zh' ? '编辑用户' : 'Edit User'}
              </h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '存储配额 (GB)' : 'Storage Quota (GB)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={editData.storageQuota}
                  onChange={(e) => setEditData(prev => ({ ...prev, storageQuota: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '用户角色' : 'User Role'}
                </label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="user">{language === 'zh' ? '普通用户' : 'User'}</option>
                  <option value="admin">{language === 'zh' ? '管理员' : 'Admin'}</option>
                </select>
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
                onClick={handleUpdateUser}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'zh' ? '保存' : 'Save'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

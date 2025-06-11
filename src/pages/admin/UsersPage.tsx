import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldOff, 
  Edit, 
  Trash2,
  Search,
  Filter,
  Download,
  Key
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const { language } = useAppStore();
  const [users, setUsers] = useState([
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      storageQuota: 100 * 1024 * 1024 * 1024,
      storageUsed: 15.6 * 1024 * 1024 * 1024,
      createdAt: '2024-01-01',
      isActive: true,
      lastLoginAt: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      username: 'user001',
      email: 'user001@example.com',
      role: 'user',
      storageQuota: 5 * 1024 * 1024 * 1024,
      storageUsed: 2.3 * 1024 * 1024 * 1024,
      createdAt: '2024-01-10',
      isActive: true,
      lastLoginAt: '2024-01-14 15:45:00'
    }
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    expiresAt: '',
    maxUses: 1
  });

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const toggleUserStatus = async (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
    toast.success(language === 'zh' ? '用户状态已更新' : 'User status updated');
  };

  const generateInviteCode = async () => {
    try {
      const newCode = 'INV' + Math.random().toString(36).substring(2, 15).toUpperCase();
      toast.success(`${language === 'zh' ? '邀请码已生成：' : 'Invite code generated: '}${newCode}`);
      setShowInviteModal(false);
      setInviteData({ expiresAt: '', maxUses: 1 });
    } catch (error) {
      toast.error(language === 'zh' ? '生成失败' : 'Generation failed');
    }
  };

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
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
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
                {users.filter(user => user.isActive).length}
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
                {users.filter(user => user.role === 'admin').length}
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
                {formatBytes(users.reduce((total, user) => total + user.storageUsed, 0))}
              </p>
            </div>
            <Download className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* 用户列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'zh' ? '用户列表' : 'User List'}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'zh' ? '搜索用户...' : 'Search users...'}
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Filter className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
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
                          {formatBytes(user.storageUsed)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatBytes(user.storageQuota)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min((user.storageUsed / user.storageQuota) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt}
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
                      <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'zh' ? '生成邀请码' : 'Generate Invite Code'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '过期时间' : 'Expiration Date'}
                </label>
                <input
                  type="datetime-local"
                  value={inviteData.expiresAt}
                  onChange={(e) => setInviteData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
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
                  onChange={(e) => setInviteData(prev => ({ ...prev, maxUses: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
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
                onClick={generateInviteCode}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {language === 'zh' ? '生成' : 'Generate'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;


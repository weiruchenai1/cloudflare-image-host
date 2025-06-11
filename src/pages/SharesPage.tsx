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
  Globe
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'react-hot-toast';

const SharesPage: React.FC = () => {
  const { language } = useAppStore();
  const [shares, setShares] = useState([
    {
      id: '1',
      fileName: 'sunset-beach.jpg',
      shareUrl: 'https://your-domain.com/s/abc123',
      views: 245,
      maxViews: null,
      expiresAt: '2024-02-15',
      createdAt: '2024-01-15',
      isPasswordProtected: false,
      isActive: true
    },
    {
      id: '2',
      fileName: 'presentation.pdf',
      shareUrl: 'https://your-domain.com/s/def456',
      views: 12,
      maxViews: 50,
      expiresAt: null,
      createdAt: '2024-01-14',
      isPasswordProtected: true,
      isActive: true
    }
  ]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(language === 'zh' ? '链接已复制' : 'Link copied to clipboard');
    } catch (error) {
      toast.error(language === 'zh' ? '复制失败' : 'Failed to copy');
    }
  };

  const deleteShare = (shareId: string) => {
    setShares((prev: typeof shares) => prev.filter((share: typeof shares[0]) => share.id !== shareId));
    toast.success(language === 'zh' ? '分享链接已删除' : 'Share link deleted');
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
            {language === 'zh' ? '分享管理' : 'Share Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'zh' ? '管理您的所有分享链接' : 'Manage all your share links'}
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Share className="w-4 h-4" />
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
                {shares.reduce((total, share) => total + share.views, 0)}
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
                {shares.filter(share => share.isActive).length}
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
                {shares.filter(share => share.isPasswordProtected).length}
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
                {shares.map((share, index) => (
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
                          {share.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate max-w-xs">
                          {share.shareUrl}
                        </span>
                        <button
                          onClick={() => copyToClipboard(share.shareUrl)}
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
                          {share.views}
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
                            {share.expiresAt}
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
                        {share.isPasswordProtected && (
                          <Lock className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteShare(share.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
      </motion.div>
    </div>
  );
};

export default SharesPage;

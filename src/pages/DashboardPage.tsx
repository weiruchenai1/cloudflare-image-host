// src/pages/DashboardPage.tsx - 修复版本
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Upload,
  FolderOpen,
  Share,
  HardDrive,
  Activity,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useDashboardStats, useUserStats } from '../hooks/useStats';
import Loading from '../components/Loading';

const DashboardPage: React.FC = () => {
  const { user, language } = useAppStore();
  const { data: dashboardStats, isLoading: isDashboardLoading } = useDashboardStats();
  const { data: userStats, isLoading: isUserLoading } = useUserStats();

  if (isDashboardLoading || isUserLoading) {
    return <Loading text={language === 'zh' ? '加载统计数据...' : 'Loading statistics...'} />;
  }

  // 安全地访问数据，提供默认值
  const statsData = dashboardStats || {
    users: { total: 0, active: 0, growth: '+0%' },
    files: { total: 0, growth: '+0%' },
    shares: { total: 0, growth: '+0%' },
    storage: { used: 0, growth: '+0%' },
    views: { today: 0, total: 0, growth: '+0%' }
  };

  const userStatsData = userStats || {
    storage: { used: 0, quota: 0, percentage: 0 },
    files: { count: 0 },
    shares: { count: 0 },
    account: { createdAt: new Date().toISOString(), role: 'user', isActive: true }
  };

  const stats = [
    {
      title: language === 'zh' ? '总存储' : 'Total Storage',
      value: `${((userStatsData.storage?.used || 0) / 1024 / 1024 / 1024).toFixed(1)} GB`,
      change: statsData.storage?.growth || '+0%',
      icon: HardDrive,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: language === 'zh' ? '文件数量' : 'Files Count',
      value: (userStatsData.files?.count || 0).toString(),
      change: statsData.files?.growth || '+0%',
      icon: FileText,
      color: 'from-green-500 to-green-600'
    },
    {
      title: language === 'zh' ? '分享链接' : 'Share Links',
      value: (userStatsData.shares?.count || 0).toString(),
      change: statsData.shares?.growth || '+0%',
      icon: Share,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: language === 'zh' ? '今日访问' : 'Today Views',
      value: (statsData.views?.today || 0).toString(),
      change: statsData.views?.growth || '+0%',
      icon: Activity,
      color: 'from-orange-500 to-orange-600'
    }
  ];
  
  const quickActions = [
    {
      title: language === 'zh' ? '上传文件' : 'Upload Files',
      description: language === 'zh' ? '快速上传图片、视频等文件' : 'Quickly upload images, videos and other files',
      icon: Upload,
      href: '/upload',
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: language === 'zh' ? '文件管理' : 'File Manager',
      description: language === 'zh' ? '管理您的所有文件和文件夹' : 'Manage all your files and folders',
      icon: FolderOpen,
      href: '/files',
      color: 'from-green-500 to-teal-600'
    },
    {
      title: language === 'zh' ? '分享管理' : 'Share Manager',
      description: language === 'zh' ? '管理分享链接和权限设置' : 'Manage share links and permissions',
      icon: Share,
      href: '/shares',
      color: 'from-pink-500 to-rose-600'
    }
  ];

  const storageUsedGB = (userStatsData.storage?.used || 0) / 1024 / 1024 / 1024;
  const storageQuotaGB = (userStatsData.storage?.quota || user?.storageQuota || 0) / 1024 / 1024 / 1024;
  const storagePercentage = storageQuotaGB > 0 ? (storageUsedGB / storageQuotaGB) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'zh' ? `欢迎回来，${user?.username}！` : `Welcome back, ${user?.username}!`}
          </h1>
          <p className="text-blue-100 text-lg">
            {language === 'zh' ? '今天是美好的一天，开始管理您的文件吧' : "It's a beautiful day, let's start managing your files"}
          </p>
        </div>
        
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </motion.div>

      {/* 统计卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-500 text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stat.title}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 快速操作 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {language === 'zh' ? '快速操作' : 'Quick Actions'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={action.href}
                  className="block bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 存储使用情况 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '存储使用情况' : 'Storage Usage'}
        </h3>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '已使用' : 'Used'}: {storageUsedGB.toFixed(2)} GB
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '总容量' : 'Total'}: {storageQuotaGB.toFixed(0)} GB
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(storagePercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
          />
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {language === 'zh' 
            ? `您还有 ${Math.max(0, storageQuotaGB - storageUsedGB).toFixed(2)} GB 可用空间` 
            : `You have ${Math.max(0, storageQuotaGB - storageUsedGB).toFixed(2)} GB available space`
          }
        </p>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
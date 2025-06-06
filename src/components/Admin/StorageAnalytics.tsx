import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  HardDrive, 
  TrendingUp, 
  Users, 
  FileText, 
  Image, 
  Video, 
  Archive,
  BarChart3,
  PieChart,

  Download
} from 'lucide-react'
import { StorageStats } from '@/types'
import { formatFileSize } from '@/utils/api'
import { cn } from '@/utils/cn'

interface StorageAnalyticsProps {
  className?: string
}

export default function StorageAnalytics({ className }: StorageAnalyticsProps) {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const mockStats: StorageStats = {
      totalFiles: 15420,
      totalSize: 2.4 * 1024 * 1024 * 1024 * 1024, // 2.4TB
      totalUsed: 2.4 * 1024 * 1024 * 1024 * 1024,
      totalQuota: 10 * 1024 * 1024 * 1024 * 1024,
      fileCount: 15420,
      folderCount: 1200,
      recentUploads: [],
      storageByType: {},
      filesByType: {
        'image': 8500,
        'video': 2100,
        'document': 3200,
        'archive': 1200,
        'other': 420,
      },
      sizeByType: {
        'image': 800 * 1024 * 1024 * 1024, // 800GB
        'video': 1.2 * 1024 * 1024 * 1024 * 1024, // 1.2TB
        'document': 150 * 1024 * 1024 * 1024, // 150GB
        'archive': 200 * 1024 * 1024 * 1024, // 200GB
        'other': 50 * 1024 * 1024 * 1024, // 50GB
      },
    }
    
    setTimeout(() => {
      setStats(mockStats)
      setIsLoading(false)
    }, 1000)
  }, [timeRange])

  const fileTypeData = stats ? [
    { 
      name: 'Images', 
      count: stats.filesByType.image, 
      size: stats.sizeByType.image,
      icon: Image, 
      color: 'bg-blue-500',
      percentage: (stats.filesByType.image / stats.totalFiles) * 100
    },
    { 
      name: 'Videos', 
      count: stats.filesByType.video, 
      size: stats.sizeByType.video,
      icon: Video, 
      color: 'bg-purple-500',
      percentage: (stats.filesByType.video / stats.totalFiles) * 100
    },
    { 
      name: 'Documents', 
      count: stats.filesByType.document, 
      size: stats.sizeByType.document,
      icon: FileText, 
      color: 'bg-green-500',
      percentage: (stats.filesByType.document / stats.totalFiles) * 100
    },
    { 
      name: 'Archives', 
      count: stats.filesByType.archive, 
      size: stats.sizeByType.archive,
      icon: Archive, 
      color: 'bg-orange-500',
      percentage: (stats.filesByType.archive / stats.totalFiles) * 100
    },
    { 
      name: 'Other', 
      count: stats.filesByType.other, 
      size: stats.sizeByType.other,
      icon: FileText, 
      color: 'bg-gray-500',
      percentage: (stats.filesByType.other / stats.totalFiles) * 100
    },
  ] : []

  const overviewStats = stats ? [
    {
      name: 'Total Files',
      value: stats.totalFiles.toLocaleString(),
      icon: FileText,
      color: 'blue',
      change: '+12%',
    },
    {
      name: 'Total Storage',
      value: formatFileSize(stats.totalSize),
      icon: HardDrive,
      color: 'purple',
      change: '+8%',
    },
    {
      name: 'Avg File Size',
      value: formatFileSize(stats.totalSize / stats.totalFiles),
      icon: BarChart3,
      color: 'green',
      change: '-3%',
    },
    {
      name: 'Growth Rate',
      value: '2.4 GB/day',
      icon: TrendingUp,
      color: 'orange',
      change: '+15%',
    },
  ] : []

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading storage analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Storage Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor storage usage and file distribution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="glass-card p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={cn(
                'text-sm font-medium',
                stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                vs last period
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              File Type Distribution
            </h3>
          </div>

          <div className="space-y-4">
            {fileTypeData.map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn('w-3 h-3 rounded-full', type.color)} />
                  <type.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {type.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {type.count.toLocaleString()} files
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(type.size)}
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {type.percentage.toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Visual Chart */}
          <div className="mt-6">
            <div className="flex rounded-lg overflow-hidden h-4">
              {fileTypeData.map((type, index) => (
                <div
                  key={index}
                  className={type.color}
                  style={{ width: `${type.percentage}%` }}
                  title={`${type.name}: ${type.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Storage Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Storage Trends
            </h3>
          </div>

          {/* Mock chart area */}
          <div className="h-48 bg-gradient-to-t from-primary-100 to-transparent dark:from-primary-900/20 rounded-lg flex items-end justify-center p-4">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart visualization coming soon</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Daily Growth</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">2.4 GB</p>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Weekly Growth</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">16.8 GB</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Users by Storage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Top Users by Storage Usage
            </h3>
          </div>
          <button className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className="space-y-3">
          {[
            { name: 'john_doe', email: 'john@example.com', usage: 4.2 * 1024 * 1024 * 1024, quota: 5 * 1024 * 1024 * 1024 },
            { name: 'jane_smith', email: 'jane@example.com', usage: 3.8 * 1024 * 1024 * 1024, quota: 5 * 1024 * 1024 * 1024 },
            { name: 'admin', email: 'admin@example.com', usage: 25 * 1024 * 1024 * 1024, quota: 100 * 1024 * 1024 * 1024 },
            { name: 'guest_user', email: 'guest@example.com', usage: 800 * 1024 * 1024, quota: 1 * 1024 * 1024 * 1024 },
          ].map((user, index) => {
            const percentage = (user.usage / user.quota) * 100
            return (
              <motion.div
                key={user.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg"
              >
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatFileSize(user.usage)} / {formatFileSize(user.quota)}
                  </div>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        percentage > 90 ? 'bg-red-500' :
                        percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                  {percentage.toFixed(0)}%
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

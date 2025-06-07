import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FolderOpen,
  Image,
  Video,
  FileText,
  Archive,
  TrendingUp,
  Users,
  HardDrive,
  RefreshCw
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFileStore } from '@/store/fileStore'
import { apiClient, formatFileSize } from '@/utils/api'
import { StorageStats } from '@/types'
import FileUpload from '@/components/FileManager/FileUpload'
import Button from '@/components/UI/Button'
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      // 使用默认数据作为后备
      setStats({
        totalUsed: 0,
        totalQuota: 5 * 1024 * 1024 * 1024, // 5GB
        fileCount: 0,
        folderCount: 0,
        recentUploads: [],
        storageByType: {},
        totalFiles: 0,
        totalSize: 0,
        filesByType: {},
        sizeByType: {}
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchDashboardStats()
      toast.success('Dashboard refreshed')
    } catch (error) {
      toast.error('Failed to refresh dashboard')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleUploadClick = () => {
    setShowUpload(true)
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const dashboardStats = stats ? [
    {
      name: 'Total Files',
      value: stats.totalFiles.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: FolderOpen,
    },
    {
      name: 'Storage Used',
      value: formatFileSize(stats.totalSize),
      change: '+5%',
      changeType: 'positive',
      icon: HardDrive,
    },
    {
      name: 'File Count',
      value: stats.fileCount.toString(),
      change: '+23%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Storage Quota',
      value: formatFileSize(stats.totalQuota),
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
    },
  ] : []

  const fileTypes = stats ? Object.entries(stats.filesByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    count: count as number,
    icon: type === 'image' ? Image : type === 'video' ? Video : type === 'document' ? FileText : Archive,
    color: type === 'image' ? 'text-green-500' : type === 'video' ? 'text-purple-500' : type === 'document' ? 'text-blue-500' : 'text-orange-500'
  })) : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Here's what's happening with your files today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              loading={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleUploadClick}
              className="flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Files
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
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
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {stat.change}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                from last month
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* File Types Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="glass-card p-6 rounded-xl"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          File Types Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fileTypes.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg"
            >
              <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${type.color}`}>
                <type.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {type.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {type.count} files
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {stats?.recentUploads && stats.recentUploads.length > 0 ? (
            stats.recentUploads.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No recent uploads
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <FileUpload
            onClose={() => setShowUpload(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

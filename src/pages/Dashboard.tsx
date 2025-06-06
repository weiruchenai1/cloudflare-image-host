import { motion } from 'framer-motion'
import { 
  Upload, 
  FolderOpen, 
  Image, 
  Video, 
  FileText, 
  Archive,
  TrendingUp,
  Users,
  HardDrive
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()

  const stats = [
    {
      name: 'Total Files',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: FolderOpen,
    },
    {
      name: 'Storage Used',
      value: '2.4 GB',
      change: '+5%',
      changeType: 'positive',
      icon: HardDrive,
    },
    {
      name: 'Shared Files',
      value: '89',
      change: '+23%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Bandwidth',
      value: '12.3 GB',
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
    },
  ]

  const fileTypes = [
    { name: 'Images', count: 456, icon: Image, color: 'text-blue-600' },
    { name: 'Videos', count: 123, icon: Video, color: 'text-purple-600' },
    { name: 'Documents', count: 234, icon: FileText, color: 'text-green-600' },
    { name: 'Archives', count: 67, icon: Archive, color: 'text-orange-600' },
  ]

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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            <Upload className="w-5 h-5" />
            Upload Files
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Uploaded new file
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  document-{item}.pdf • 2 hours ago
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

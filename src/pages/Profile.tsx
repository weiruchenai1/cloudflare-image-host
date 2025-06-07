import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  HardDrive,
  FileText,
  Activity
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'
import { apiClient, formatFileSize } from '@/utils/api'
import Button from '@/components/UI/Button'
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

interface ProfileForm {
  username: string
  email: string
  bio?: string
}

interface UserStats {
  totalFiles: number
  totalSize: number
  storageQuota: number
  joinDate: string
}

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileForm>({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || ''
    }
  })

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      const response = await apiClient.get('/user/stats')
      setUserStats(response.data)
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      // 使用默认数据
      setUserStats({
        totalFiles: 0,
        totalSize: 0,
        storageQuota: 5 * 1024 * 1024 * 1024, // 5GB
        joinDate: user?.createdAt || new Date().toISOString()
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsLoading(true)
      const response = await apiClient.patch('/user/profile', data)
      updateUser(response.data)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || ''
    })
    setIsEditing(false)
  }

  useEffect(() => {
    fetchUserStats()
  }, [])

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        bio: user.bio || ''
      })
    }
  }, [user, reset])

  const storagePercentage = userStats ? (userStats.totalSize / userStats.storageQuota) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4" />
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </p>
            </div>
          </div>
          <Button
            variant={isEditing ? "outline" : "primary"}
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Form */}
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  {...register('username', { required: 'Username is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                {...register('bio')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={!isDirty}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {user?.bio && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</h3>
                <p className="text-gray-900 dark:text-white">{user.bio}</p>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {new Date(user?.createdAt || '').toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Last active {new Date(user?.lastLoginAt || '').toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Storage & Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="glass-card p-6 rounded-xl"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Storage & Statistics
        </h2>

        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Storage Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Storage Usage
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {userStats ? formatFileSize(userStats.totalSize) : '0 B'} / {userStats ? formatFileSize(userStats.storageQuota) : '5 GB'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {storagePercentage.toFixed(1)}% used
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Files</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats?.totalFiles || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats ? formatFileSize(userStats.totalSize) : '0 B'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats ? new Date(userStats.joinDate).getFullYear() : new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="glass-card p-6 rounded-xl"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Account Settings
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Change Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your account password
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">API Keys</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your API access keys
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-300">Delete Account</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="danger" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

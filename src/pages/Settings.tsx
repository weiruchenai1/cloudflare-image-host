import { motion } from 'framer-motion'
import {
  Palette,
  Monitor,
  Sun,
  Moon,
  Sparkles,
  Volume2,
  Bell,
  Shield,
  User,
  Settings as SettingsIcon
} from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/UI/Button'
import { cn } from '@/utils/cn'

export default function Settings() {
  const { config, setTheme, toggleGlassEffect, toggleAnimations, toggleParticles } = useThemeStore()
  const { user } = useAuthStore()

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Light theme' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' },
  ] as const

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Purple', value: '#8b5cf6', class: 'bg-purple-500' },
    { name: 'Green', value: '#10b981', class: 'bg-green-500' },
    { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
    { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
    { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your experience and preferences
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Appearance
            </h2>
          </div>

          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                      config.mode === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <option.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Accent Color
              </label>
              <div className="grid grid-cols-6 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {/* setPrimaryColor(color.value) */}}
                    className={cn(
                      'w-10 h-10 rounded-lg border-2 transition-all duration-200',
                      color.class,
                      config.primaryColor === color.value
                        ? 'border-white shadow-lg scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Visual Effects */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Visual Effects
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Glass Effects
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Frosted glass backgrounds
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleGlassEffect}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      config.glassEffect ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        config.glassEffect ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Animations
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Smooth transitions and effects
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleAnimations}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      config.animations ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        config.animations ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Particle Effects
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Floating background particles
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleParticles}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      config.particles ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        config.particles ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Account
            </h2>
          </div>

          <div className="space-y-6">
            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Storage Info */}
            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Storage Usage
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {((user?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(1)} GB / {((user?.storageQuota || 0) / 1024 / 1024 / 1024).toFixed(1)} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ((user?.storageUsed || 0) / (user?.storageQuota || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Download Data
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notifications Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Upload Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when uploads complete
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Share Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when files are shared with you
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Storage Alerts
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when storage is running low
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Security Alerts
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified about security events
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

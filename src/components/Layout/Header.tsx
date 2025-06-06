import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Upload,
  Plus
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import Button from '@/components/UI/Button'
import NotificationCenter from '@/components/UI/NotificationCenter'
import { cn } from '@/utils/cn'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const { config, setTheme } = useThemeStore()

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-white/20 dark:border-white/10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="pl-10 pr-4 py-2 w-64 lg:w-80 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Upload button */}
            <Button
              variant="primary"
              size="sm"
              className="hidden sm:flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>

            {/* Mobile upload button */}
            <Button
              variant="primary"
              size="sm"
              className="sm:hidden p-2"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <NotificationCenter />

            {/* Theme selector */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-black/20 transition-all duration-200"
              >
                {config.mode === 'light' && <Sun className="w-5 h-5" />}
                {config.mode === 'dark' && <Moon className="w-5 h-5" />}
                {config.mode === 'system' && <Monitor className="w-5 h-5" />}
              </button>

              <AnimatePresence>
                {themeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg border border-white/20 dark:border-white/10 py-1 z-50"
                    onBlur={() => setThemeMenuOpen(false)}
                  >
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTheme(option.value)
                          setThemeMenuOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200',
                          config.mode === option.value
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        )}
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-56 glass-card rounded-lg shadow-lg border border-white/20 dark:border-white/10 py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/20 dark:border-white/10">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    </div>
                    
                    <div className="py-1 border-t border-white/20 dark:border-white/10">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

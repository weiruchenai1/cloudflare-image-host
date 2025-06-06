import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  FolderOpen,
  Settings,
  User,
  Shield,
  X,
  Cloud,
  BarChart3
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Files', href: '/files', icon: FolderOpen },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-card border-r border-white/20 dark:border-white/10 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">CF Image</span>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href === '/files' && location.pathname.startsWith('/files'))
                    
                    return (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200',
                            isActive
                              ? 'bg-primary-600 text-white shadow-lg'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-6 w-6 shrink-0 transition-colors duration-200',
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                            )}
                          />
                          {item.name}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* Admin Section */}
              {isAdmin && (
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-gray-500">
                    Administration
                  </div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {adminNavigation.map((item) => {
                      const isActive = location.pathname === item.href
                      
                      return (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            className={cn(
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200',
                              isActive
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-6 w-6 shrink-0 transition-colors duration-200',
                                isActive ? 'text-white' : 'text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400'
                              )}
                            />
                            {item.name}
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )}

              {/* Storage Usage */}
              <li className="mt-auto">
                <div className="glass-card p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Storage Usage
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Used</span>
                      <span>{((user?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, ((user?.storageUsed || 0) / (user?.storageQuota || 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Quota</span>
                      <span>{((user?.storageQuota || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed inset-y-0 z-50 flex w-64 flex-col lg:hidden"
          >
            <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-card border-r border-white/20 dark:border-white/10 px-6 pb-4">
              {/* Header with close button */}
              <div className="flex h-16 shrink-0 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold gradient-text">CF Image</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Same navigation as desktop */}
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        const isActive = location.pathname === item.href || 
                          (item.href === '/files' && location.pathname.startsWith('/files'))
                        
                        return (
                          <li key={item.name}>
                            <NavLink
                              to={item.href}
                              onClick={onClose}
                              className={cn(
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200',
                                isActive
                                  ? 'bg-primary-600 text-white shadow-lg'
                                  : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                              )}
                            >
                              <item.icon
                                className={cn(
                                  'h-6 w-6 shrink-0 transition-colors duration-200',
                                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                )}
                              />
                              {item.name}
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  </li>

                  {/* Admin Section */}
                  {isAdmin && (
                    <li>
                      <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-gray-500">
                        Administration
                      </div>
                      <ul role="list" className="-mx-2 mt-2 space-y-1">
                        {adminNavigation.map((item) => {
                          const isActive = location.pathname === item.href
                          
                          return (
                            <li key={item.name}>
                              <NavLink
                                to={item.href}
                                onClick={onClose}
                                className={cn(
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200',
                                  isActive
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    'h-6 w-6 shrink-0 transition-colors duration-200',
                                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400'
                                  )}
                                />
                                {item.name}
                              </NavLink>
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

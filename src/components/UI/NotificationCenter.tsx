import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Upload,
  Share2,
  UserPlus,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<{ className?: string }>
}

interface NotificationCenterProps {
  className?: string
}

export default function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Mock notifications for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Upload Complete',
        message: 'Your file "document.pdf" has been uploaded successfully.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        icon: Upload,
      },
      {
        id: '2',
        type: 'info',
        title: 'File Shared',
        message: 'john_doe shared "presentation.pptx" with you.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        icon: Share2,
        action: {
          label: 'View File',
          onClick: () => console.log('View shared file'),
        },
      },
      {
        id: '3',
        type: 'warning',
        title: 'Storage Warning',
        message: 'You are using 90% of your storage quota.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        icon: AlertTriangle,
        action: {
          label: 'Manage Storage',
          onClick: () => console.log('Manage storage'),
        },
      },
      {
        id: '4',
        type: 'success',
        title: 'New User Registered',
        message: 'A new user has joined using your invitation code.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        icon: UserPlus,
      },
    ]
    setNotifications(mockNotifications)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) {
      return notification.icon
    }

    switch (notification.type) {
      case 'success':
        return CheckCircle
      case 'error':
        return XCircle
      case 'warning':
        return AlertTriangle
      case 'info':
      default:
        return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'info':
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] glass-card rounded-xl shadow-lg border border-white/20 dark:border-white/10 z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="p-2">
                    <AnimatePresence>
                      {notifications.map((notification) => {
                        const IconComponent = getNotificationIcon(notification)
                        const iconColor = getNotificationColor(notification.type)

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={cn(
                              'relative p-3 rounded-lg mb-2 transition-all duration-200 cursor-pointer',
                              notification.read
                                ? 'bg-white/30 dark:bg-black/20'
                                : 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            )}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', 
                                notification.read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
                              )}>
                                <IconComponent className={cn('w-4 h-4', iconColor)} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={cn(
                                    'font-medium text-sm',
                                    notification.read 
                                      ? 'text-gray-700 dark:text-gray-300' 
                                      : 'text-gray-900 dark:text-white'
                                  )}>
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTimestamp(notification.timestamp)}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeNotification(notification.id)
                                      }}
                                      className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.message}
                                </p>

                                {notification.action && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      notification.action!.onClick()
                                    }}
                                    className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
                                  >
                                    {notification.action.label}
                                  </button>
                                )}
                              </div>

                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/20 dark:border-white/10">
                  <button className="w-full text-sm text-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                    View All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Key,
  BarChart3,
  Settings,
  Shield,
  HardDrive,
  Activity,
  TrendingUp
} from 'lucide-react'
import InvitationManager from '@/components/Admin/InvitationManager'
import UserManager from '@/components/Admin/UserManager'
import SystemSettings from '@/components/Admin/SystemSettings'
import StorageAnalytics from '@/components/Admin/StorageAnalytics'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'invitations', label: 'Invitations', icon: Key },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const stats = [
    {
      name: 'Total Users',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'blue',
    },
    {
      name: 'Active Users',
      value: '892',
      change: '+8%',
      changeType: 'positive',
      icon: Activity,
      color: 'green',
    },
    {
      name: 'Storage Used',
      value: '2.4 TB',
      change: '+15%',
      changeType: 'positive',
      icon: HardDrive,
      color: 'purple',
    },
    {
      name: 'Bandwidth',
      value: '12.3 GB',
      change: '+23%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'orange',
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
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
                    <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
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

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-card p-6 rounded-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center gap-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        New user registered
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        user{item}@example.com • 2 hours ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )
      case 'invitations':
        return <InvitationManager />
      case 'users':
        return <UserManager />
      case 'storage':
        return <StorageAnalytics />
      case 'settings':
        return <SystemSettings />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users, invitations, and system settings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/50 dark:bg-black/20 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-black/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  )
}

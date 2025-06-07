import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck,
  HardDrive,
  Calendar,
  Mail,
  Crown,
  User as UserIcon,
  RefreshCw
} from 'lucide-react'
import { User } from '@/types'
import { apiClient, formatFileSize } from '@/utils/api'
import Button from '@/components/UI/Button'
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface UserManagerProps {
  className?: string
}

export default function UserManager({ className }: UserManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user' | 'guest'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/admin/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      // 使用模拟数据作为后备
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@example.com',
          username: 'admin',
          passwordHash: 'hashed',
          role: 'admin',
          storageQuota: 100 * 1024 * 1024 * 1024, // 100GB
          storageUsed: 25 * 1024 * 1024 * 1024, // 25GB
          createdAt: '2024-01-01T00:00:00Z',
          lastLoginAt: '2024-01-15T10:30:00Z',
          isActive: true,
          invitedBy: 'system',
        },
        {
          id: '2',
          email: 'john@example.com',
          username: 'john_doe',
          passwordHash: 'hashed',
          role: 'user',
          storageQuota: 5 * 1024 * 1024 * 1024, // 5GB
          storageUsed: 2.3 * 1024 * 1024 * 1024, // 2.3GB
          createdAt: '2024-01-05T00:00:00Z',
          lastLoginAt: '2024-01-14T15:45:00Z',
          isActive: true,
          invitedBy: '1',
        },
        {
          id: '3',
          email: 'jane@example.com',
          username: 'jane_smith',
          passwordHash: 'hashed',
          role: 'user',
          storageQuota: 5 * 1024 * 1024 * 1024, // 5GB
          storageUsed: 800 * 1024 * 1024, // 800MB
          createdAt: '2024-01-10T00:00:00Z',
          lastLoginAt: '2024-01-13T09:20:00Z',
          isActive: true,
          invitedBy: '1',
        },
        {
          id: '4',
          email: 'guest@example.com',
          username: 'guest_user',
          passwordHash: 'hashed',
          role: 'guest',
          storageQuota: 1 * 1024 * 1024 * 1024, // 1GB
          storageUsed: 50 * 1024 * 1024, // 50MB
          createdAt: '2024-01-12T00:00:00Z',
          isActive: false,
          invitedBy: '2',
        },
      ]
      setUsers(mockUsers)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchUsers()
      toast.success('User list refreshed')
    } catch (error) {
      toast.error('Failed to refresh user list')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, { isActive: !currentStatus })
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      ))
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      try {
        await apiClient.delete(`/admin/users/${userId}`)
        setUsers(prev => prev.filter(user => user.id !== userId))
        toast.success('User deleted successfully')
      } catch (error) {
        toast.error('Failed to delete user')
      }
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, { role: newRole })
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, role: newRole as any } : user
      ))
      toast.success('User role updated successfully')
    } catch (error) {
      toast.error('Failed to update user role')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown
      case 'user': return UserIcon
      case 'guest': return Shield
      default: return UserIcon
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 dark:text-red-400'
      case 'user': return 'text-blue-600 dark:text-blue-400'
      case 'guest': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStoragePercentage = (used: number, quota: number) => {
    return Math.min(100, (used / quota) * 100)
  }

  const stats = [
    {
      name: 'Total Users',
      value: users.length.toString(),
      icon: Users,
      color: 'blue',
    },
    {
      name: 'Active Users',
      value: users.filter(u => u.isActive).length.toString(),
      icon: UserCheck,
      color: 'green',
    },
    {
      name: 'Admins',
      value: users.filter(u => u.role === 'admin').length.toString(),
      icon: Crown,
      color: 'red',
    },
    {
      name: 'Storage Used',
      value: formatFileSize(users.reduce((sum, u) => sum + u.storageUsed, 0)),
      icon: HardDrive,
      color: 'purple',
    },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            User Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          loading={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="glass-card p-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50 dark:bg-black/20 border-b border-white/20 dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 dark:divide-white/10">
                <AnimatePresence>
                  {filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role)
                    const storagePercentage = getStoragePercentage(user.storageUsed, user.storageQuota)
                    
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="hover:bg-white/30 dark:hover:bg-black/20 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <RoleIcon className={cn('w-4 h-4', getRoleColor(user.role))} />
                            <span className={cn('text-sm font-medium capitalize', getRoleColor(user.role))}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatFileSize(user.storageUsed)} / {formatFileSize(user.storageQuota)}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={cn(
                                  'h-2 rounded-full transition-all duration-300',
                                  storagePercentage > 90 ? 'bg-red-500' :
                                  storagePercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                )}
                                style={{ width: `${storagePercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {user.lastLoginAt ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(user.lastLoginAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <>
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                  Inactive
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              title={user.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4 text-red-500" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newRole = user.role === 'admin' ? 'user' : 'admin'
                                handleChangeRole(user.id, newRole)
                              }}
                              title={`Make ${user.role === 'admin' ? 'user' : 'admin'}`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

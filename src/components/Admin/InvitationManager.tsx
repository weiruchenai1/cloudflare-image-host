import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Calendar, 
  Users, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { InvitationCode } from '@/types'
import Button from '@/components/UI/Button'
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface InvitationManagerProps {
  className?: string
}

export default function InvitationManager({ className }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<InvitationCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [_showCreateModal, setShowCreateModal] = useState(false)
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})

  // Mock data for demonstration
  useEffect(() => {
    const mockInvitations: InvitationCode[] = [
      {
        id: '1',
        code: 'ABC12345',
        createdBy: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-12-31T23:59:59Z',
        maxUses: 10,
        currentUses: 3,
        isActive: true,
        usedBy: ['user1', 'user2', 'user3'],
      },
      {
        id: '2',
        code: 'XYZ67890',
        createdBy: 'admin',
        createdAt: '2024-01-15T00:00:00Z',
        maxUses: 5,
        currentUses: 5,
        isActive: false,
        usedBy: ['user4', 'user5', 'user6', 'user7', 'user8'],
      },
      {
        id: '3',
        code: 'DEF54321',
        createdBy: 'admin',
        createdAt: '2024-02-01T00:00:00Z',
        expiresAt: '2024-03-01T23:59:59Z',
        maxUses: 1,
        currentUses: 0,
        isActive: true,
        usedBy: [],
      },
    ]
    
    setTimeout(() => {
      setInvitations(mockInvitations)
      setIsLoading(false)
    }, 1000)
  }, [])

  const toggleCodeVisibility = (id: string) => {
    setShowCodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Invitation code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const getStatusColor = (invitation: InvitationCode) => {
    if (!invitation.isActive) return 'text-gray-500'
    if (invitation.currentUses >= invitation.maxUses) return 'text-red-500'
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) return 'text-orange-500'
    return 'text-green-500'
  }

  const getStatusIcon = (invitation: InvitationCode) => {
    if (!invitation.isActive) return XCircle
    if (invitation.currentUses >= invitation.maxUses) return XCircle
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) return Clock
    return CheckCircle
  }

  const getStatusText = (invitation: InvitationCode) => {
    if (!invitation.isActive) return 'Inactive'
    if (invitation.currentUses >= invitation.maxUses) return 'Exhausted'
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) return 'Expired'
    return 'Active'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Invitation Codes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user registration invitation codes
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Codes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {invitations.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Codes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {invitations.filter(inv => inv.isActive && inv.currentUses < inv.maxUses).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Uses</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {invitations.reduce((sum, inv) => sum + inv.currentUses, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation List */}
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
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 dark:divide-white/10">
                <AnimatePresence>
                  {invitations.map((invitation) => {
                    const StatusIcon = getStatusIcon(invitation)
                    const isCodeVisible = showCodes[invitation.id]
                    
                    return (
                      <motion.tr
                        key={invitation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="hover:bg-white/30 dark:hover:bg-black/20 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {isCodeVisible ? invitation.code : '••••••••'}
                            </code>
                            <button
                              onClick={() => toggleCodeVisibility(invitation.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {isCodeVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(invitation.code)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={cn('w-4 h-4', getStatusColor(invitation))} />
                            <span className={cn('text-sm font-medium', getStatusColor(invitation))}>
                              {getStatusText(invitation)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {invitation.currentUses} / {invitation.maxUses}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(invitation.currentUses / invitation.maxUses) * 100}%`
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {invitation.expiresAt ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(invitation.expiresAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

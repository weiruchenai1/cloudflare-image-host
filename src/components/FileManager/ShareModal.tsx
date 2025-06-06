import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Copy, 
  Link, 
  Lock, 
  Globe, 
  Calendar, 
  Download, 
  Users,
  Shield,
  CheckCircle
} from 'lucide-react'
import { FileItem, ShareSettings } from '@/types'
import Button from '@/components/UI/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface ShareModalProps {
  file: FileItem
  onClose: () => void
  onShare: (settings: Partial<ShareSettings>) => Promise<string>
}

export default function ShareModal({ file, onClose, onShare }: ShareModalProps) {
  const [shareType, setShareType] = useState<'public' | 'password' | 'private'>('public')
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>()
  const [allowedIPs, setAllowedIPs] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isShared, setIsShared] = useState(false)

  const shareOptions = [
    {
      type: 'public' as const,
      icon: Globe,
      title: 'Public Link',
      description: 'Anyone with the link can access',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      type: 'password' as const,
      icon: Lock,
      title: 'Password Protected',
      description: 'Requires password to access',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      type: 'private' as const,
      icon: Shield,
      title: 'Private',
      description: 'Only you can access',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    },
  ]

  const expirationOptions = [
    { label: '1 hour', value: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    { label: '1 day', value: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
    { label: '7 days', value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { label: '30 days', value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { label: 'Never', value: '' },
  ]

  const handleShare = async () => {
    setIsLoading(true)
    try {
      const settings: Partial<ShareSettings> = {
        shareType,
        password: shareType === 'password' ? password : undefined,
        expiresAt: expiresAt || undefined,
        maxDownloads,
        allowedIPs: allowedIPs ? allowedIPs.split(',').map(ip => ip.trim()) : undefined,
      }

      const url = await onShare(settings)
      setShareUrl(url)
      setIsShared(true)
      toast.success('Share link created successfully!')
    } catch (error) {
      toast.error('Failed to create share link')
      console.error('Share error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(result)
  }

  if (isShared) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-md glass-card rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Share Link Created
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your file is now ready to share
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(shareUrl)}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {shareType === 'password' && password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(password)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => copyToClipboard(shareUrl)}
                className="flex-1"
              >
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg glass-card rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Share File
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                {file.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Share Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Access Level
            </label>
            <div className="space-y-2">
              {shareOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setShareType(option.type)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left',
                    shareType === option.type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', option.bgColor)}>
                    <option.icon className={cn('w-4 h-4', option.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Password Field */}
          {shareType === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  className="flex items-center gap-2"
                >
                  Generate
                </Button>
              </div>
            </div>
          )}

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Expiration
            </label>
            <select
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {expirationOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Download Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Download className="w-4 h-4 inline mr-1" />
              Download Limit
            </label>
            <input
              type="number"
              value={maxDownloads || ''}
              onChange={(e) => setMaxDownloads(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Unlimited"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* IP Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              IP Restrictions (Optional)
            </label>
            <input
              type="text"
              value={allowedIPs}
              onChange={(e) => setAllowedIPs(e.target.value)}
              placeholder="192.168.1.1, 10.0.0.1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Comma-separated list of allowed IP addresses
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleShare}
              loading={isLoading}
              disabled={shareType === 'password' && !password}
              className="flex-1"
            >
              Create Share Link
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

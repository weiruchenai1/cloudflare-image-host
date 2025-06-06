import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  Shield,
  Globe,
  HardDrive,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Button from '@/components/UI/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface SystemSettingsProps {
  className?: string
}

interface SystemConfig {
  general: {
    siteName: string
    siteDescription: string
    adminEmail: string
    corsOrigin: string
    maintenanceMode: boolean
  }
  storage: {
    defaultQuota: number
    maxFileSize: number
    allowedFileTypes: string[]
    enableThumbnails: boolean
    compressionEnabled: boolean
  }
  security: {
    jwtExpiration: number
    maxLoginAttempts: number
    sessionTimeout: number
    requireEmailVerification: boolean
    enableTwoFactor: boolean
  }
  invitations: {
    defaultMaxUses: number
    defaultExpiration: number
    requireApproval: boolean
    allowSelfRegistration: boolean
  }
}

export default function SystemSettings({ className }: SystemSettingsProps) {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      siteName: 'CF Image Hosting',
      siteDescription: 'Modern multi-user file hosting system',
      adminEmail: 'admin@example.com',
      corsOrigin: 'http://localhost:3000',
      maintenanceMode: false,
    },
    storage: {
      defaultQuota: 5 * 1024 * 1024 * 1024, // 5GB
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: ['image/*', 'video/*', 'application/pdf'],
      enableThumbnails: true,
      compressionEnabled: true,
    },
    security: {
      jwtExpiration: 24 * 60 * 60, // 24 hours
      maxLoginAttempts: 5,
      sessionTimeout: 30 * 60, // 30 minutes
      requireEmailVerification: false,
      enableTwoFactor: false,
    },
    invitations: {
      defaultMaxUses: 10,
      defaultExpiration: 30 * 24 * 60 * 60, // 30 days
      requireApproval: false,
      allowSelfRegistration: false,
    },
  })

  const [activeSection, setActiveSection] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'invitations', label: 'Invitations', icon: Key },
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastSaved(new Date())
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }



  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Site Name
        </label>
        <input
          type="text"
          value={config.general.siteName}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            general: { ...prev.general, siteName: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Site Description
        </label>
        <textarea
          value={config.general.siteDescription}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            general: { ...prev.general, siteDescription: e.target.value }
          }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Mail className="w-4 h-4 inline mr-1" />
          Admin Email
        </label>
        <input
          type="email"
          value={config.general.adminEmail}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            general: { ...prev.general, adminEmail: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Globe className="w-4 h-4 inline mr-1" />
          CORS Origin
        </label>
        <input
          type="url"
          value={config.general.corsOrigin}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            general: { ...prev.general, corsOrigin: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Maintenance Mode
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Temporarily disable user access for maintenance
            </p>
          </div>
        </div>
        <button
          onClick={() => setConfig(prev => ({
            ...prev,
            general: { ...prev.general, maintenanceMode: !prev.general.maintenanceMode }
          }))}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            config.general.maintenanceMode ? 'bg-yellow-600' : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              config.general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    </div>
  )

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Default User Quota
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={config.storage.defaultQuota / (1024 * 1024 * 1024)}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              storage: { ...prev.storage, defaultQuota: parseInt(e.target.value) * 1024 * 1024 * 1024 }
            }))}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400">
            GB
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Maximum File Size
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={config.storage.maxFileSize / (1024 * 1024)}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              storage: { ...prev.storage, maxFileSize: parseInt(e.target.value) * 1024 * 1024 }
            }))}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400">
            MB
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Allowed File Types
        </label>
        <textarea
          value={config.storage.allowedFileTypes.join(', ')}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            storage: { ...prev.storage, allowedFileTypes: e.target.value.split(',').map(t => t.trim()) }
          }))}
          rows={3}
          placeholder="image/*, video/*, application/pdf"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Comma-separated MIME types or patterns
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Enable Thumbnails
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate thumbnails for images and videos
            </p>
          </div>
          <button
            onClick={() => setConfig(prev => ({
              ...prev,
              storage: { ...prev.storage, enableThumbnails: !prev.storage.enableThumbnails }
            }))}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              config.storage.enableThumbnails ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                config.storage.enableThumbnails ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Image Compression
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically compress uploaded images
            </p>
          </div>
          <button
            onClick={() => setConfig(prev => ({
              ...prev,
              storage: { ...prev.storage, compressionEnabled: !prev.storage.compressionEnabled }
            }))}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              config.storage.compressionEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                config.storage.compressionEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings()
      case 'storage':
        return renderStorageSettings()
      case 'security':
        return (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Security settings coming soon...
            </p>
          </div>
        )
      case 'invitations':
        return (
          <div className="text-center py-8">
            <Key className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Invitation settings coming soon...
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4 rounded-xl">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200',
                    activeSection === section.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 rounded-xl"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

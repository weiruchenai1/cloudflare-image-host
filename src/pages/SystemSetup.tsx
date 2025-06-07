import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Key, Settings, CheckCircle } from 'lucide-react'
import Button from '@/components/UI/Button'
import toast from 'react-hot-toast'
import { apiClient } from '@/utils/api'

interface SetupForm {
  adminEmail: string
  adminUsername: string
  adminPassword: string
  confirmPassword: string
  invitationCodes: string
}

export default function SystemSetup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupResult, setSetupResult] = useState<any>(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupForm>({
    defaultValues: {
      invitationCodes: 'WELCOME,INVITE01,BETA2025'
    }
  })

  const password = watch('adminPassword')

  const onSubmit = async (data: SetupForm) => {
    if (data.adminPassword !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const invitationCodes = data.invitationCodes
        .split(',')
        .map(code => code.trim())
        .filter(code => code.length > 0)

      const response = await apiClient.post('/system/setup', {
        adminEmail: data.adminEmail,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword,
        invitationCodes
      })

      setSetupResult(response.data)
      setSetupComplete(true)
      toast.success('System initialized successfully!')
    } catch (error: any) {
      console.error('Setup error:', error)
      toast.error(error.response?.data?.message || 'Setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueToLogin = () => {
    console.log('Continue to login clicked')
    navigate('/login')
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Setup Complete!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your CF Image hosting system has been successfully initialized.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Admin Account:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Email:</strong> {setupResult?.admin?.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Username:</strong> {setupResult?.admin?.username}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Invitation Codes:</h3>
              <div className="flex flex-wrap gap-2">
                {setupResult?.invitationCodes?.map((code: string) => (
                  <span
                    key={code}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded font-mono"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleContinueToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Continue to Login
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4"
            >
              <Settings className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              System Setup
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Initialize your CF Image hosting system
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Admin Email */}
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('adminEmail', {
                    required: 'Admin email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="glass-input pl-10"
                  placeholder="admin@example.com"
                />
              </div>
              {errors.adminEmail && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.adminEmail.message}
                </p>
              )}
            </div>

            {/* Admin Username */}
            <div>
              <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('adminUsername', {
                    required: 'Admin username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Username can only contain letters, numbers, and underscores',
                    },
                  })}
                  type="text"
                  className="glass-input pl-10"
                  placeholder="admin"
                />
              </div>
              {errors.adminUsername && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.adminUsername.message}
                </p>
              )}
            </div>

            {/* Admin Password */}
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('adminPassword', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input pl-10 pr-10"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.adminPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.adminPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="glass-input pl-10 pr-10"
                  placeholder="Confirm admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Invitation Codes */}
            <div>
              <label htmlFor="invitationCodes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invitation Codes
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('invitationCodes')}
                  type="text"
                  className="glass-input pl-10"
                  placeholder="WELCOME,INVITE01,BETA2025"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Comma-separated list of invitation codes for user registration
              </p>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              Initialize System
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

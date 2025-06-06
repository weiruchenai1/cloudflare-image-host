import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useFileStore } from '@/store/fileStore'
import { initializeAuth } from '@/store/authStore'
import { initializeTheme } from '@/store/themeStore'

// Layout Components
import Layout from '@/components/Layout/Layout'
import AuthLayout from '@/components/Layout/AuthLayout'

// Page Components
import Dashboard from '@/pages/Dashboard'
import Files from '@/pages/Files'
import AdminPanel from '@/pages/AdminPanel'
import Settings from '@/pages/Settings'
import Profile from '@/pages/Profile'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import SharedFile from '@/pages/SharedFile'
import NotFound from '@/pages/NotFound'

// Components
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import ParticleBackground from '@/components/UI/ParticleBackground'
import GlobalDragOverlay from '@/components/UI/GlobalDragOverlay'
import ErrorBoundary from '@/components/UI/ErrorBoundary'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { isLoading, isAuthenticated } = useAuthStore()
  const { config } = useThemeStore()
  const { uploadFiles } = useFileStore()

  useEffect(() => {
    // Initialize authentication and theme
    const init = async () => {
      initializeTheme()
      await initializeAuth()
    }
    init()
  }, [])

  const handleGlobalFileDrop = async (files: File[]) => {
    if (isAuthenticated) {
      try {
        await uploadFiles(files)
      } catch (error) {
        console.error('Global file upload failed:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <LoadingSpinner size="xl" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
          >
            Loading CF Image Hosting...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {/* Particle Background */}
        {config.particles && <ParticleBackground />}
        
        {/* Background Pattern */}
        <div className="fixed inset-0 bg-pattern opacity-30 pointer-events-none" />

        {/* Global Drag and Drop */}
        {isAuthenticated && (
          <GlobalDragOverlay
            onFileDrop={handleGlobalFileDrop}
            accept={['image/*', 'video/*', 'application/pdf']}
            maxFiles={10}
            maxSize={100 * 1024 * 1024} // 100MB
          />
        )}

        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Login />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Register />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            
            {/* Shared File Route (public) */}
            <Route path="/share/:shareId" element={<SharedFile />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Files />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/files/:folderId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Files />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <AdminPanel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Default Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  )
}

export default App

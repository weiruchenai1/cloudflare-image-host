import { motion } from 'framer-motion'
import { Cloud } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-pattern opacity-20" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '-4s' }} />
        
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">CF Image</h1>
              <p className="text-primary-100">Modern File Hosting</p>
            </div>
          </div>
          
          <div className="space-y-6 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h2 className="text-2xl font-semibold mb-3">
                Secure Cloud Storage
              </h2>
              <p className="text-primary-100 text-lg leading-relaxed">
                Store, manage, and share your files with enterprise-grade security 
                powered by Cloudflare's global network.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-primary-100">Lightning-fast uploads with chunked transfer</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-primary-100">Advanced sharing controls and permissions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-primary-100">Real-time collaboration and file management</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-primary-100">Invitation-only registration system</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 xl:px-12">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">CF Image</span>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  )
}

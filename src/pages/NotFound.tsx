import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '@/components/UI/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-8xl font-bold gradient-text mb-4"
        >
          404
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Page not found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-300 mb-8"
        >
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button
              variant="primary"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

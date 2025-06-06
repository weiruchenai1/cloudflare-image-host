import { motion } from 'framer-motion'

export default function SharedFile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="glass-card p-6 rounded-xl max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Shared File
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Shared file viewer coming soon...
        </p>
      </div>
    </motion.div>
  )
}

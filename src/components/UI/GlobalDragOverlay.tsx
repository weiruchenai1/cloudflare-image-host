import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Image, Video, Archive } from 'lucide-react'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { cn } from '@/utils/cn'

interface GlobalDragOverlayProps {
  onFileDrop: (files: File[]) => void
  accept?: string[]
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
}

export default function GlobalDragOverlay({
  onFileDrop,
  accept = ['*/*'],
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  disabled = false,
}: GlobalDragOverlayProps) {
  const { isDragActive, isDragAccept, isDragReject, getRootProps } = useDragAndDrop({
    onDrop: onFileDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
  })

  const getFileTypeIcons = () => {
    const icons = []
    
    if (accept.includes('*/*') || accept.includes('image/*')) {
      icons.push({ icon: Image, label: 'Images', color: 'text-green-500' })
    }
    if (accept.includes('*/*') || accept.includes('video/*')) {
      icons.push({ icon: Video, label: 'Videos', color: 'text-purple-500' })
    }
    if (accept.includes('*/*') || accept.some(type => type.includes('pdf') || type.includes('document'))) {
      icons.push({ icon: FileText, label: 'Documents', color: 'text-blue-500' })
    }
    if (accept.includes('*/*') || accept.some(type => type.includes('zip') || type.includes('rar'))) {
      icons.push({ icon: Archive, label: 'Archives', color: 'text-orange-500' })
    }
    
    if (icons.length === 0) {
      icons.push({ icon: FileText, label: 'Files', color: 'text-gray-500' })
    }
    
    return icons
  }

  const fileTypeIcons = getFileTypeIcons()

  return (
    <div {...getRootProps()}>
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={cn(
                  'glass-card rounded-2xl p-12 text-center max-w-md w-full border-4 border-dashed transition-all duration-300',
                  isDragAccept && 'border-green-400 bg-green-50/50 dark:bg-green-900/20',
                  isDragReject && 'border-red-400 bg-red-50/50 dark:bg-red-900/20',
                  !isDragAccept && !isDragReject && 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                )}
              >
                {/* Upload Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center',
                    isDragAccept && 'bg-green-100 dark:bg-green-900/30',
                    isDragReject && 'bg-red-100 dark:bg-red-900/30',
                    !isDragAccept && !isDragReject && 'bg-primary-100 dark:bg-primary-900/30'
                  )}
                >
                  <Upload className={cn(
                    'w-10 h-10',
                    isDragAccept && 'text-green-600 dark:text-green-400',
                    isDragReject && 'text-red-600 dark:text-red-400',
                    !isDragAccept && !isDragReject && 'text-primary-600 dark:text-primary-400'
                  )} />
                </motion.div>

                {/* Title */}
                <h3 className={cn(
                  'text-2xl font-bold mb-3',
                  isDragAccept && 'text-green-700 dark:text-green-300',
                  isDragReject && 'text-red-700 dark:text-red-300',
                  !isDragAccept && !isDragReject && 'text-gray-900 dark:text-white'
                )}>
                  {isDragReject ? 'Invalid Files' : 'Drop Files Here'}
                </h3>

                {/* Description */}
                <p className={cn(
                  'text-lg mb-6',
                  isDragAccept && 'text-green-600 dark:text-green-400',
                  isDragReject && 'text-red-600 dark:text-red-400',
                  !isDragAccept && !isDragReject && 'text-gray-600 dark:text-gray-400'
                )}>
                  {isDragReject 
                    ? 'Some files are not supported or too large'
                    : 'Release to upload your files'
                  }
                </p>

                {/* Supported File Types */}
                {!isDragReject && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supported file types:
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      {fileTypeIcons.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center">
                            <item.icon className={cn('w-4 h-4', item.color)} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Limits */}
                <div className="mt-6 pt-4 border-t border-white/20 dark:border-white/10">
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                    <span>Max {maxFiles} files</span>
                    <span>•</span>
                    <span>Up to {Math.round(maxSize / (1024 * 1024))}MB each</span>
                  </div>
                </div>

                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        'absolute w-2 h-2 rounded-full opacity-30',
                        isDragAccept && 'bg-green-400',
                        isDragReject && 'bg-red-400',
                        !isDragAccept && !isDragReject && 'bg-primary-400'
                      )}
                      animate={{
                        x: [0, Math.random() * 100 - 50],
                        y: [0, Math.random() * 100 - 50],
                        scale: [0, 1, 0],
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut",
                      }}
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

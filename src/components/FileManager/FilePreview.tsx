import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { FileItem } from '@/types'
import { apiClient, formatFileSize, isImageFile, isVideoFile } from '@/utils/api'
import Button from '@/components/UI/Button'


interface FilePreviewProps {
  file: FileItem
  files?: FileItem[]
  onClose: () => void
  onDelete?: (file: FileItem) => void
  onShare?: (file: FileItem) => void
}

export default function FilePreview({ file, files = [], onClose, onDelete, onShare }: FilePreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [_isFullscreen, setIsFullscreen] = useState(false)

  const currentFile = files.length > 0 ? files[currentIndex] : file
  const canNavigate = files.length > 1

  useEffect(() => {
    if (files.length > 0) {
      const index = files.findIndex(f => f.id === file.id)
      setCurrentIndex(index >= 0 ? index : 0)
    }
  }, [file.id, files])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (canNavigate && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
          }
          break
        case 'ArrowRight':
          if (canNavigate && currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1)
          }
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.25, 3))
          break
        case '-':
          setZoom(prev => Math.max(prev - 0.25, 0.25))
          break
        case 'r':
          setRotation(prev => (prev + 90) % 360)
          break
        case ' ':
          e.preventDefault()
          if (isVideoFile(currentFile.mimeType || '')) {
            setIsPlaying(!isPlaying)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, files.length, canNavigate, isPlaying, currentFile.mimeType, onClose])

  const handleDownload = async () => {
    try {
      await apiClient.downloadFile(`/files/${currentFile.id}/download`, currentFile.name)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      resetView()
    }
  }

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1)
      resetView()
    }
  }

  const resetView = () => {
    setZoom(1)
    setRotation(0)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const renderPreview = () => {
    if (!currentFile.mimeType) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <p>Preview not available</p>
          </div>
        </div>
      )
    }

    if (isImageFile(currentFile.mimeType)) {
      return (
        <div className="flex items-center justify-center h-full overflow-hidden">
          <motion.img
            key={currentFile.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: zoom,
              rotate: rotation
            }}
            transition={{ duration: 0.3 }}
            src={apiClient.getThumbnailUrl(currentFile.id, 'lg')}
            alt={currentFile.name}
            className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
            draggable={false}
          />
        </div>
      )
    }

    if (isVideoFile(currentFile.mimeType)) {
      return (
        <div className="flex items-center justify-center h-full">
          <video
            key={currentFile.id}
            controls
            autoPlay={isPlaying}
            muted={isMuted}
            className="max-w-full max-h-full"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          >
            <source src={apiClient.getDownloadUrl(currentFile.id)} type={currentFile.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (currentFile.mimeType.includes('pdf')) {
      return (
        <div className="flex items-center justify-center h-full">
          <iframe
            src={`${apiClient.getDownloadUrl(currentFile.id)}#view=FitH`}
            className="w-full h-full border-0"
            title={currentFile.name}
          />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <p>Preview not available for this file type</p>
          <Button
            variant="primary"
            onClick={handleDownload}
            className="mt-4"
          >
            Download to view
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 glass-card border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white truncate max-w-md">
              {currentFile.name}
            </h2>
            <div className="text-sm text-gray-300">
              {currentFile.size && formatFileSize(currentFile.size)}
              {canNavigate && (
                <span className="ml-2">
                  {currentIndex + 1} of {files.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation */}
            {canNavigate && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === files.length - 1}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Controls */}
            {isImageFile(currentFile.mimeType || '') && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                  className="text-white hover:bg-white/10"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm min-w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                  className="text-white hover:bg-white/10"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="text-white hover:bg-white/10"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}

            {isVideoFile(currentFile.mimeType || '') && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-white/10"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/10"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10"
            >
              <Maximize className="w-4 h-4" />
            </Button>

            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>

            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(currentFile)}
                className="text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Edit className="w-4 h-4" />
            </Button>

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(currentFile)}
                className="text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="pt-20 pb-4 px-4 h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFile.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderPreview()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 space-y-1">
        <div>ESC: Close • ←/→: Navigate • +/-: Zoom</div>
        <div>R: Rotate • Space: Play/Pause • F: Fullscreen</div>
      </div>
    </motion.div>
  )
}

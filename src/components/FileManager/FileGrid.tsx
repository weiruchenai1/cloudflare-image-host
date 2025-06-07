import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder,
  File,
  Image,
  Video,
  FileText,
  Archive,
  MoreVertical,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { FileItem } from '@/types'
import { useFileStore } from '@/store/fileStore'
import { formatFileSize, apiClient } from '@/utils/api'
import { cn } from '@/utils/cn'
import FilePreview from './FilePreview'
import ShareModal from './ShareModal'

interface FileGridProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onFolderClick: (folder: FileItem) => void
}

export default function FileGrid({ files, onFileClick, onFolderClick }: FileGridProps) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [shareFile, setShareFile] = useState<FileItem | null>(null)

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file)
  }

  const handleShare = (file: FileItem) => {
    setShareFile(file)
  }

  const handleShareCreate = async (settings: any) => {
    if (!shareFile) throw new Error('No file selected for sharing')

    try {
      const { shareFile: shareFileStore } = useFileStore.getState()
      const shareUrl = await shareFileStore(shareFile.id, settings)
      return shareUrl
    } catch (error) {
      console.error('Failed to create share link:', error)
      throw error
    }
  }

const getFileIcon = (file: FileItem) => {
  if (file.type === 'folder') return Folder
  if (!file.mimeType) return File

  if (file.mimeType.startsWith('image/')) return Image
  if (file.mimeType.startsWith('video/')) return Video
  if (file.mimeType.includes('pdf') || file.mimeType.includes('document')) return FileText
  if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return Archive
  return File
}

const getFileColor = (file: FileItem) => {
  if (file.type === 'folder') return 'text-blue-600 dark:text-blue-400'
  if (!file.mimeType) return 'text-gray-600 dark:text-gray-400'

  if (file.mimeType.startsWith('image/')) return 'text-green-600 dark:text-green-400'
  if (file.mimeType.startsWith('video/')) return 'text-purple-600 dark:text-purple-400'
  if (file.mimeType.includes('pdf') || file.mimeType.includes('document')) return 'text-red-600 dark:text-red-400'
  if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return 'text-orange-600 dark:text-orange-400'
  return 'text-gray-600 dark:text-gray-400'
}

const isImageFile = (mimeType: string) => {
  return mimeType && mimeType.startsWith('image/')
}

interface FileCardProps {
  file: FileItem
  onFileClick: (file: FileItem) => void
  onFolderClick: (folder: FileItem) => void
  onPreview: (file: FileItem) => void
  onShare: (file: FileItem) => void
}

function FileCard({ file, onFileClick, onFolderClick, onPreview, onShare }: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(file.name)
  const { selectFile, selectedFiles, fetchFiles, currentFolder } = useFileStore()

  const IconComponent = getFileIcon(file)
  const iconColor = getFileColor(file)
  const isSelected = selectedFiles.includes(file.id)

  const handleDownload = (file: FileItem) => {
    const downloadUrl = apiClient.getDownloadUrl(file.id)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = file.name
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    // Use setTimeout to ensure the click event is processed before removing
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
    }, 100)
  }

  const handleDelete = async (file: FileItem) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        await apiClient.deleteFile(file.id)
        fetchFiles(currentFolder || undefined) // Refresh the file list
      } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete file')
      }
    }
  }

  const handleRename = async () => {
    if (newName.trim() && newName.trim() !== file.name) {
      try {
        await apiClient.renameFile(file.id, newName.trim())
        fetchFiles(currentFolder || undefined) // Refresh the file list
        setIsRenaming(false)
      } catch (error) {
        console.error('Rename failed:', error)
        alert('Failed to rename file')
        setNewName(file.name) // Reset name
      }
    } else {
      setIsRenaming(false)
      setNewName(file.name) // Reset name
    }
  }

  const handleClick = () => {
    if (file.type === 'folder') {
      onFolderClick(file)
    } else {
      onFileClick(file)
    }
  }

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    selectFile(file.id)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative group glass-card rounded-lg p-4 cursor-pointer transition-all duration-200',
        isSelected && 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
      </div>

      {/* Menu button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleMenuClick}
          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Context menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-1 w-48 glass-card rounded-lg shadow-lg border border-white/20 dark:border-white/10 py-1 z-10"
              onBlur={() => setShowMenu(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(file)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(file)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(file)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenaming(true)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Rename
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(file)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File icon and thumbnail */}
      <div className="flex flex-col items-center mb-3">
        {file.type !== 'folder' && file.mimeType && isImageFile(file.mimeType) ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden mb-2 bg-gray-100 dark:bg-gray-800">
            <img
              src={apiClient.getThumbnailUrl(file.id, 'sm')}
              alt={file.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to icon if thumbnail fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className={cn('hidden w-full h-full flex items-center justify-center', iconColor)}>
              <IconComponent className="w-8 h-8" />
            </div>
          </div>
        ) : (
          <div className={cn('w-16 h-16 flex items-center justify-center mb-2', iconColor)}>
            <IconComponent className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="text-center">
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') {
                setIsRenaming(false)
                setNewName(file.name)
              }
            }}
            className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">
            {file.name}
          </h3>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          {file.type === 'file' && file.size && (
            <p>{formatFileSize(file.size)}</p>
          )}
          <p>{new Date(file.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Public indicator */}
      {file.isPublic && (
        <div className="absolute bottom-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" title="Public file" />
        </div>
      )}
    </motion.div>
  )
}

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onFileClick={onFileClick}
              onFolderClick={onFolderClick}
              onPreview={handlePreview}
              onShare={handleShare}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <FilePreview
            file={previewFile}
            files={files.filter(f => f.type === 'file')}
            onClose={() => setPreviewFile(null)}
            onShare={handleShare}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareFile && (
          <ShareModal
            file={shareFile}
            onClose={() => setShareFile(null)}
            onShare={handleShareCreate}
          />
        )}
      </AnimatePresence>
    </>
  )
}

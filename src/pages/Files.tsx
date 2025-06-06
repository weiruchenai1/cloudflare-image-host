import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FolderPlus,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  Home
} from 'lucide-react'
import { useFileStore } from '@/store/fileStore'
import { FileItem } from '@/types'
import FileGrid from '@/components/FileManager/FileGrid'
import FileUpload from '@/components/FileManager/FileUpload'
import AdvancedSearch from '@/components/FileManager/AdvancedSearch'
import KeyboardShortcutsHelp from '@/components/UI/KeyboardShortcutsHelp'
import Button from '@/components/UI/Button'
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function Files() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const [showUpload, setShowUpload] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    files,
    currentFolder,
    isLoading,
    selectedFiles,
    setCurrentFolder,
    fetchFiles,
    clearSelection
  } = useFileStore()

  useEffect(() => {
    setCurrentFolder(folderId || null)
  }, [folderId, setCurrentFolder])

  useEffect(() => {
    fetchFiles(folderId)
  }, [folderId, fetchFiles])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        ...commonShortcuts.upload,
        action: () => setShowUpload(true),
      },
      {
        ...commonShortcuts.advancedSearch,
        action: () => setShowAdvancedSearch(true),
      },
      {
        ...commonShortcuts.help,
        action: () => setShowKeyboardHelp(true),
      },
      {
        ...commonShortcuts.gridView,
        action: () => setViewMode('grid'),
      },
      {
        ...commonShortcuts.listView,
        action: () => setViewMode('list'),
      },
      {
        ...commonShortcuts.dashboard,
        action: () => navigate('/'),
      },
      {
        ...commonShortcuts.settings,
        action: () => navigate('/settings'),
      },
      {
        key: 'Escape',
        action: () => {
          if (showUpload) setShowUpload(false)
          else if (showAdvancedSearch) setShowAdvancedSearch(false)
          else if (showKeyboardHelp) setShowKeyboardHelp(false)
          else clearSelection()
        },
        description: 'Close modals or clear selection',
      },
    ],
  })

  const handleFileClick = (file: FileItem) => {
    // Handle file preview/download
    console.log('File clicked:', file)
  }

  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolder(folder.id)
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const breadcrumbs = [
    { id: null, name: 'Home', icon: Home },
    // Add parent folders here based on current path
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            File Manager
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'root'} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
              <button
                onClick={() => setCurrentFolder(crumb.id)}
                className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <crumb.icon className="w-4 h-4" />
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Advanced Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedSearch(true)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Search
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Selected files info */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{selectedFiles.length} selected</span>
                <button
                  onClick={clearSelection}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {/* View mode toggle */}
            <div className="flex items-center bg-white/50 dark:bg-black/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* File Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass-card p-6 rounded-xl min-h-96"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <FolderPlus className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p className="text-sm text-center">
              {searchQuery
                ? 'No files match your search criteria'
                : 'This folder is empty. Upload some files to get started.'
              }
            </p>
          </div>
        ) : (
          <FileGrid
            files={filteredFiles}
            onFileClick={handleFileClick}
            onFolderClick={handleFolderClick}
          />
        )}
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <FileUpload
            folderId={currentFolder || undefined}
            onClose={() => setShowUpload(false)}
          />
        )}
      </AnimatePresence>

      {/* Advanced Search Modal */}
      <AnimatePresence>
        {showAdvancedSearch && (
          <AdvancedSearch
            isOpen={showAdvancedSearch}
            onClose={() => setShowAdvancedSearch(false)}
            onSearch={(filters) => {
              console.log('Search filters:', filters)
              // Implement search logic here
            }}
            onReset={() => {
              setSearchQuery('')
              // Reset other filters
            }}
          />
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <KeyboardShortcutsHelp
            isOpen={showKeyboardHelp}
            onClose={() => setShowKeyboardHelp(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

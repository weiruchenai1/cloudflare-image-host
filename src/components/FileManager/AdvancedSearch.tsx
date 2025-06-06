import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 

  X, 
  Calendar, 
  HardDrive, 
  User, 
  Tag,
  FileType,
  SortAsc,
  SortDesc,
  RotateCcw
} from 'lucide-react'

import Button from '@/components/UI/Button'
import { cn } from '@/utils/cn'

interface SearchFilters {
  query: string
  fileType: 'all' | 'image' | 'video' | 'document' | 'archive'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
  customDateStart?: string
  customDateEnd?: string
  sizeRange: 'all' | 'small' | 'medium' | 'large' | 'custom'
  customSizeMin?: number
  customSizeMax?: number
  owner: string
  tags: string[]
  isPublic?: boolean
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
}

interface AdvancedSearchProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
}

export default function AdvancedSearch({ isOpen, onClose, onSearch, onReset }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    fileType: 'all',
    dateRange: 'all',
    sizeRange: 'all',
    owner: '',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc',
  })

  const [newTag, setNewTag] = useState('')

  const fileTypeOptions = [
    { value: 'all', label: 'All Files' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Documents' },
    { value: 'archive', label: 'Archives' },
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ]

  const sizeRangeOptions = [
    { value: 'all', label: 'Any Size' },
    { value: 'small', label: 'Small (< 1MB)' },
    { value: 'medium', label: 'Medium (1MB - 100MB)' },
    { value: 'large', label: 'Large (> 100MB)' },
    { value: 'custom', label: 'Custom Range' },
  ]

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date Modified' },
    { value: 'size', label: 'File Size' },
    { value: 'type', label: 'File Type' },
  ]

  const handleSearch = () => {
    onSearch(filters)
    onClose()
  }

  const handleReset = () => {
    setFilters({
      query: '',
      fileType: 'all',
      dateRange: 'all',
      sizeRange: 'all',
      owner: '',
      tags: [],
      sortBy: 'date',
      sortOrder: 'desc',
    })
    setNewTag('')
    onReset()
  }

  const addTag = () => {
    if (newTag.trim() && !filters.tags.includes(newTag.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl glass-card rounded-xl p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Advanced Search
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find files with detailed filters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Query
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                placeholder="Enter keywords..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileType className="w-4 h-4 inline mr-1" />
                File Type
              </label>
              <select
                value={filters.fileType}
                onChange={(e) => setFilters(prev => ({ ...prev, fileType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {fileTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.customDateStart || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, customDateStart: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.customDateEnd || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, customDateEnd: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Size Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <HardDrive className="w-4 h-4 inline mr-1" />
                File Size
              </label>
              <select
                value={filters.sizeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, sizeRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {sizeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Owner
              </label>
              <input
                type="text"
                value={filters.owner}
                onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Username or email..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort Order
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
                    filters.sortOrder === 'asc'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                >
                  <SortAsc className="w-4 h-4" />
                  Ascending
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
                    filters.sortOrder === 'desc'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                >
                  <SortDesc className="w-4 h-4" />
                  Descending
                </button>
              </div>
            </div>
          </div>

          {/* Public Files Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Public Files Only
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Show only publicly shared files
              </p>
            </div>
            <button
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                isPublic: prev.isPublic === undefined ? true : prev.isPublic ? false : undefined 
              }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                filters.isPublic === true ? 'bg-primary-600' : 
                filters.isPublic === false ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  filters.isPublic === true ? 'translate-x-6' : 
                  filters.isPublic === false ? 'translate-x-1' : 'translate-x-3'
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSearch}
              className="flex-1 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

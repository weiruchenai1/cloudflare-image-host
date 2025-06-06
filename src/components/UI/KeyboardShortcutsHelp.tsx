import { motion } from 'framer-motion'
import { X, Keyboard, Search } from 'lucide-react'
import { useState } from 'react'
import { commonShortcuts, formatShortcut, isMac } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Group shortcuts by category
  const shortcutsByCategory = Object.entries(commonShortcuts).reduce((acc, [key, shortcut]) => {
    const category = shortcut.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push({ ...shortcut, shortcutKey: key })
    return acc
  }, {} as Record<string, Array<{ shortcutKey: string } & typeof commonShortcuts[keyof typeof commonShortcuts]>>)

  // Filter shortcuts based on search
  const filteredCategories = Object.entries(shortcutsByCategory).reduce((acc, [category, shortcuts]) => {
    const filteredShortcuts = shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.shortcutKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    if (filteredShortcuts.length > 0) {
      acc[category] = filteredShortcuts
    }
    
    return acc
  }, {} as typeof shortcutsByCategory)

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
        className="w-full max-w-4xl glass-card rounded-xl p-6 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isMac ? 'Cmd' : 'Ctrl'} key shortcuts for faster navigation
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto">
          {Object.keys(filteredCategories).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Keyboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No shortcuts found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredCategories).map(([category, shortcuts]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shortcuts.map((shortcut) => (
                      <motion.div
                        key={shortcut.shortcutKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-white/30 dark:bg-black/20 rounded-lg"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {formatShortcut(shortcut).split(' + ').map((key, index, array) => (
                            <div key={index} className="flex items-center">
                              <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                                {key}
                              </kbd>
                              {index < array.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">?</kbd> to open this help</span>
              <span>Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Esc</kbd> to close</span>
            </div>
            <div className="text-xs">
              {Object.values(filteredCategories).reduce((total, shortcuts) => total + shortcuts.length, 0)} shortcuts available
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

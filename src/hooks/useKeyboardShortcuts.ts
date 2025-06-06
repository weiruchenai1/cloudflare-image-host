import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category?: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey
      const altMatches = !!shortcut.altKey === event.altKey
      const metaMatches = !!shortcut.metaKey === event.metaKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  return shortcuts
}

// Common keyboard shortcuts
export const commonShortcuts = {
  // File operations
  upload: { key: 'u', ctrlKey: true, description: 'Upload files', category: 'Files' },
  newFolder: { key: 'n', ctrlKey: true, shiftKey: true, description: 'Create new folder', category: 'Files' },
  search: { key: 'f', ctrlKey: true, description: 'Search files', category: 'Navigation' },
  advancedSearch: { key: 'f', ctrlKey: true, shiftKey: true, description: 'Advanced search', category: 'Navigation' },
  
  // Navigation
  dashboard: { key: 'd', ctrlKey: true, description: 'Go to dashboard', category: 'Navigation' },
  files: { key: 'e', ctrlKey: true, description: 'Go to files', category: 'Navigation' },
  settings: { key: ',', ctrlKey: true, description: 'Open settings', category: 'Navigation' },
  
  // View
  toggleTheme: { key: 't', ctrlKey: true, description: 'Toggle theme', category: 'View' },
  toggleSidebar: { key: 'b', ctrlKey: true, description: 'Toggle sidebar', category: 'View' },
  gridView: { key: '1', ctrlKey: true, description: 'Grid view', category: 'View' },
  listView: { key: '2', ctrlKey: true, description: 'List view', category: 'View' },
  
  // Selection
  selectAll: { key: 'a', ctrlKey: true, description: 'Select all files', category: 'Selection' },
  deselectAll: { key: 'a', ctrlKey: true, shiftKey: true, description: 'Deselect all', category: 'Selection' },
  
  // Actions
  delete: { key: 'Delete', description: 'Delete selected files', category: 'Actions' },
  rename: { key: 'F2', description: 'Rename file', category: 'Actions' },
  copy: { key: 'c', ctrlKey: true, description: 'Copy files', category: 'Actions' },
  cut: { key: 'x', ctrlKey: true, description: 'Cut files', category: 'Actions' },
  paste: { key: 'v', ctrlKey: true, description: 'Paste files', category: 'Actions' },
  
  // Help
  help: { key: '?', description: 'Show keyboard shortcuts', category: 'Help' },
  
  // Admin
  adminPanel: { key: 'a', ctrlKey: true, altKey: true, description: 'Open admin panel', category: 'Admin' },
}

// Format shortcut for display
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action'>) {
  const parts: string[] = []
  
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.metaKey) parts.push('Cmd')
  
  // Format special keys
  let key = shortcut.key
  switch (key.toLowerCase()) {
    case 'delete':
      key = 'Del'
      break
    case 'f2':
      key = 'F2'
      break
    case ' ':
      key = 'Space'
      break
    case 'enter':
      key = 'Enter'
      break
    case 'escape':
      key = 'Esc'
      break
    case 'arrowup':
      key = '↑'
      break
    case 'arrowdown':
      key = '↓'
      break
    case 'arrowleft':
      key = '←'
      break
    case 'arrowright':
      key = '→'
      break
    default:
      key = key.toUpperCase()
  }
  
  parts.push(key)
  
  return parts.join(' + ')
}

// Check if user is on Mac
export const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

// Get platform-specific modifier key
export function getPlatformModifier() {
  return isMac ? 'metaKey' : 'ctrlKey'
}

// Convert shortcuts to platform-specific
export function adaptShortcutsForPlatform(shortcuts: KeyboardShortcut[]): KeyboardShortcut[] {
  if (!isMac) return shortcuts
  
  return shortcuts.map(shortcut => {
    if (shortcut.ctrlKey && !shortcut.metaKey) {
      return {
        ...shortcut,
        ctrlKey: false,
        metaKey: true,
      }
    }
    return shortcut
  })
}

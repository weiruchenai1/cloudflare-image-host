import { useState, useCallback, useRef, useEffect } from 'react'

interface UseDragAndDropOptions {
  onDrop: (files: File[]) => void
  accept?: string[]
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
}

interface DragAndDropState {
  isDragActive: boolean
  isDragAccept: boolean
  isDragReject: boolean
  draggedFiles: File[]
}

export function useDragAndDrop({
  onDrop,
  accept = [],
  maxFiles = Infinity,
  maxSize = Infinity,
  disabled = false,
}: UseDragAndDropOptions) {
  const [state, setState] = useState<DragAndDropState>({
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    draggedFiles: [],
  })

  const dragCounter = useRef(0)

  const isFileAccepted = useCallback((file: File) => {
    if (accept.length === 0) return true
    
    return accept.some(acceptedType => {
      if (acceptedType.endsWith('/*')) {
        const baseType = acceptedType.slice(0, -2)
        return file.type.startsWith(baseType)
      }
      return file.type === acceptedType
    })
  }, [accept])

  const validateFiles = useCallback((files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      if (!isFileAccepted(file)) {
        errors.push(`${file.name}: File type not accepted`)
        continue
      }

      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large`)
        continue
      }

      validFiles.push(file)

      if (validFiles.length >= maxFiles) {
        break
      }
    }

    if (validFiles.length > maxFiles) {
      errors.push(`Too many files. Maximum ${maxFiles} files allowed.`)
      return { validFiles: validFiles.slice(0, maxFiles), errors }
    }

    return { validFiles, errors }
  }, [isFileAccepted, maxSize, maxFiles])

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    dragCounter.current++

    if (e.dataTransfer?.items) {
      const files = Array.from(e.dataTransfer.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter(Boolean) as File[]

      const { validFiles } = validateFiles(files)
      const isDragAccept = validFiles.length > 0
      const isDragReject = files.length > 0 && validFiles.length === 0

      setState(prev => ({
        ...prev,
        isDragActive: true,
        isDragAccept,
        isDragReject,
        draggedFiles: files,
      }))
    } else {
      setState(prev => ({
        ...prev,
        isDragActive: true,
        isDragAccept: false,
        isDragReject: false,
        draggedFiles: [],
      }))
    }
  }, [disabled, validateFiles])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    dragCounter.current--

    if (dragCounter.current === 0) {
      setState(prev => ({
        ...prev,
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        draggedFiles: [],
      }))
    }
  }, [disabled])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    // Set dropEffect to indicate what will happen on drop
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [disabled])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    dragCounter.current = 0

    setState(prev => ({
      ...prev,
      isDragActive: false,
      isDragAccept: false,
      isDragReject: false,
      draggedFiles: [],
    }))

    if (e.dataTransfer?.files) {
      const files = Array.from(e.dataTransfer.files)
      const { validFiles, errors } = validateFiles(files)

      if (errors.length > 0) {
        console.warn('File validation errors:', errors)
        // You might want to show these errors to the user
      }

      if (validFiles.length > 0) {
        onDrop(validFiles)
      }
    }
  }, [disabled, validateFiles, onDrop])

  const getRootProps = useCallback(() => ({
    onDragEnter: (e: React.DragEvent) => handleDragEnter(e.nativeEvent),
    onDragLeave: (e: React.DragEvent) => handleDragLeave(e.nativeEvent),
    onDragOver: (e: React.DragEvent) => handleDragOver(e.nativeEvent),
    onDrop: (e: React.DragEvent) => handleDrop(e.nativeEvent),
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop])

  // Global drag and drop handling
  useEffect(() => {
    if (disabled) return

    // Prevent default drag behaviors on the entire document
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener('dragenter', preventDefaults)
    document.addEventListener('dragover', preventDefaults)
    document.addEventListener('dragleave', preventDefaults)
    document.addEventListener('drop', preventDefaults)

    return () => {
      document.removeEventListener('dragenter', preventDefaults)
      document.removeEventListener('dragover', preventDefaults)
      document.removeEventListener('dragleave', preventDefaults)
      document.removeEventListener('drop', preventDefaults)
    }
  }, [disabled])

  return {
    ...state,
    getRootProps,
  }
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Utility function to get file extension
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// Utility function to check if file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// Utility function to check if file is a video
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

// Utility function to get file icon based on type
export function getFileTypeIcon(file: File): string {
  if (isImageFile(file)) return '🖼️'
  if (isVideoFile(file)) return '🎥'
  if (file.type.startsWith('audio/')) return '🎵'
  if (file.type.includes('pdf')) return '📄'
  if (file.type.includes('word')) return '📝'
  if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊'
  if (file.type.includes('powerpoint') || file.type.includes('presentation')) return '📈'
  if (file.type.includes('zip') || file.type.includes('rar')) return '📦'
  return '📄'
}

// Common file type groups
export const fileTypeGroups = {
  images: ['image/*'],
  videos: ['video/*'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ],
  all: ['*/*'],
}

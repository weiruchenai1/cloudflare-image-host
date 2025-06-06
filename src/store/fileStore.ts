import { create } from 'zustand'
import { FileItem, UploadProgress, SearchFilters, SortOptions } from '@/types'
import { apiClient } from '@/utils/api'

interface FileStore {
  files: FileItem[]
  currentFolder: string | null
  selectedFiles: string[]
  uploadProgress: Record<string, UploadProgress>
  searchFilters: SearchFilters
  sortOptions: SortOptions
  isLoading: boolean
  
  // Actions
  setFiles: (files: FileItem[]) => void
  addFile: (file: FileItem) => void
  updateFile: (id: string, updates: Partial<FileItem>) => void
  removeFile: (id: string) => void
  setCurrentFolder: (folderId: string | null) => void
  selectFile: (id: string) => void
  selectMultipleFiles: (ids: string[]) => void
  clearSelection: () => void
  setUploadProgress: (fileId: string, progress: UploadProgress) => void
  removeUploadProgress: (fileId: string) => void
  setSearchFilters: (filters: Partial<SearchFilters>) => void
  setSortOptions: (options: SortOptions) => void
  setLoading: (loading: boolean) => void
  
  // API Actions
  fetchFiles: (folderId?: string) => Promise<void>
  uploadFiles: (files: File[], folderId?: string) => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<void>
  deleteFiles: (ids: string[]) => Promise<void>
  moveFiles: (ids: string[], targetFolderId: string) => Promise<void>
  shareFile: (id: string, settings: any) => Promise<string>
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  currentFolder: null,
  selectedFiles: [],
  uploadProgress: {},
  searchFilters: {},
  sortOptions: { field: 'name', direction: 'asc' },
  isLoading: false,

  setFiles: (files) => set({ files }),
  
  addFile: (file) => set((state) => ({ 
    files: [...state.files, file] 
  })),
  
  updateFile: (id, updates) => set((state) => ({
    files: state.files.map(file => 
      file.id === id ? { ...file, ...updates } : file
    )
  })),
  
  removeFile: (id) => set((state) => ({
    files: state.files.filter(file => file.id !== id),
    selectedFiles: state.selectedFiles.filter(fileId => fileId !== id)
  })),
  
  setCurrentFolder: (folderId) => {
    set({ currentFolder: folderId, selectedFiles: [] })
    get().fetchFiles(folderId || undefined)
  },
  
  selectFile: (id) => set((state) => {
    const isSelected = state.selectedFiles.includes(id)
    return {
      selectedFiles: isSelected 
        ? state.selectedFiles.filter(fileId => fileId !== id)
        : [...state.selectedFiles, id]
    }
  }),
  
  selectMultipleFiles: (ids) => set({ selectedFiles: ids }),
  
  clearSelection: () => set({ selectedFiles: [] }),
  
  setUploadProgress: (fileId, progress) => set((state) => ({
    uploadProgress: { ...state.uploadProgress, [fileId]: progress }
  })),
  
  removeUploadProgress: (fileId) => set((state) => {
    const { [fileId]: removed, ...rest } = state.uploadProgress
    return { uploadProgress: rest }
  }),
  
  setSearchFilters: (filters) => set((state) => ({
    searchFilters: { ...state.searchFilters, ...filters }
  })),
  
  setSortOptions: (options) => set({ sortOptions: options }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  fetchFiles: async (folderId) => {
    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      if (folderId) params.append('folderId', folderId)
      
      const { searchFilters, sortOptions } = get()
      if (searchFilters.query) params.append('query', searchFilters.query)
      if (searchFilters.type && searchFilters.type !== 'all') {
        params.append('type', searchFilters.type)
      }
      params.append('sortBy', sortOptions.field)
      params.append('sortOrder', sortOptions.direction)

      const response = await apiClient.get(`/files?${params.toString()}`)
      set({ files: response.data, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch files:', error)
      set({ isLoading: false })
    }
  },

  uploadFiles: async (files, folderId) => {
    const uploadPromises = files.map(async (file) => {
      const fileId = `upload_${Date.now()}_${Math.random()}`
      
      // Initialize upload progress
      get().setUploadProgress(fileId, {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      })

      try {
        const formData = new FormData()
        formData.append('file', file)
        if (folderId) formData.append('folderId', folderId)

        // Update progress to uploading
        get().setUploadProgress(fileId, {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        })

        const response = await apiClient.uploadFile('/files/upload', file, (progress: number) => {
          get().setUploadProgress(fileId, {
            fileId,
            fileName: file.name,
            progress,
            status: 'uploading',
          })
        })

        // Update to processing
        get().setUploadProgress(fileId, {
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'processing',
        })

        // Add file to store
        get().addFile(response.data)

        // Complete upload
        get().setUploadProgress(fileId, {
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'completed',
        })

        // Remove progress after delay
        setTimeout(() => {
          get().removeUploadProgress(fileId)
        }, 2000)

      } catch (error: any) {
        get().setUploadProgress(fileId, {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error.response?.data?.message || 'Upload failed',
        })
      }
    })

    await Promise.all(uploadPromises)
  },

  createFolder: async (name, parentId) => {
    try {
      const response = await apiClient.post('/files/folder', {
        name,
        parentId: parentId || get().currentFolder,
      })
      get().addFile(response.data)
    } catch (error) {
      console.error('Failed to create folder:', error)
      throw error
    }
  },

  deleteFiles: async (ids) => {
    try {
      await apiClient.post('/files/delete', { ids })
      ids.forEach(id => get().removeFile(id))
    } catch (error) {
      console.error('Failed to delete files:', error)
      throw error
    }
  },

  moveFiles: async (ids, targetFolderId) => {
    try {
      await apiClient.patch('/files/move', { ids, targetFolderId })
      // Refresh current folder
      get().fetchFiles(get().currentFolder || undefined)
    } catch (error) {
      console.error('Failed to move files:', error)
      throw error
    }
  },

  shareFile: async (id, settings) => {
    try {
      const response = await apiClient.post(`/files/${id}/share`, settings)
      return response.data.shareUrl
    } catch (error) {
      console.error('Failed to share file:', error)
      throw error
    }
  },
}))

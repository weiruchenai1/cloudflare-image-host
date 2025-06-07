import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { ApiResponse } from '@/types'

// API Configuration - 使用相对路径，因为 API 现在在同一个域名下
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

// Fetch wrapper with error handling
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = Cookies.get('auth_token')

  const headers = new Headers(options.headers)

  // Only set Content-Type to application/json if it's not a FormData request
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  // Handle common error responses
  if (response.status === 401) {
    Cookies.remove('auth_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (response.status === 403) {
    toast.error('Access denied. You do not have permission to perform this action.')
    throw new Error('Forbidden')
  }

  if (response.status === 404) {
    toast.error('Resource not found.')
    throw new Error('Not Found')
  }

  if (response.status === 429) {
    toast.error('Too many requests. Please try again later.')
    throw new Error('Too Many Requests')
  }

  if (response.status >= 500) {
    toast.error('Server error. Please try again later.')
    throw new Error('Server Error')
  }

  return response
}

// API Client class
class ApiClient {
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await fetchWithAuth(url, { method: 'GET' })
    return response.json()
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
    return response.json()
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
    return response.json()
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
    return response.json()
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await fetchWithAuth(url, { method: 'DELETE' })
    return response.json()
  }

  // File upload with progress
  async uploadFile(
    url: string,
    file: File,
    _onProgress?: (progress: number) => void,
    folderId?: string
  ): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      formData.append('folderId', folderId)
    }

    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Chunked upload for large files
  async uploadFileChunked(
    url: string,
    file: File,
    chunkSize: number = 5 * 1024 * 1024, // 5MB chunks
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    const totalChunks = Math.ceil(file.size / chunkSize)
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Initialize upload
    await this.post(`${url}/init`, {
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      uploadId,
    })

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkIndex', chunkIndex.toString())
      formData.append('uploadId', uploadId)

      const token = Cookies.get('auth_token')
      const headers: Record<string, string> = {}

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      await fetch(`${API_BASE_URL}${url}/chunk`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (onProgress) {
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
        onProgress(progress)
      }
    }

    // Complete upload
    return this.post(`${url}/complete`, { uploadId })
  }

  // Download file
  async downloadFile(url: string, filename?: string): Promise<void> {
    const response = await fetchWithAuth(url, { method: 'GET' })
    const blob = await response.blob()

    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  // Get download URL
  getDownloadUrl(fileId: string): string {
    return `${API_BASE_URL}/files/${fileId}/download`
  }

  // Get thumbnail URL
  getThumbnailUrl(fileId: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
    return `${API_BASE_URL}/files/${fileId}/thumbnail?size=${size}`
  }

  // Get share URL
  getShareUrl(shareId: string): string {
    return `${API_BASE_URL}/share/${shareId}`
  }

  // Delete file
  async deleteFile(fileId: string): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    })
    return response.json()
  }

  // Rename file
  async renameFile(fileId: string, name: string): Promise<ApiResponse<any>> {
    const response = await fetchWithAuth(`${API_BASE_URL}/files/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
    return response.json()
  }


}

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith('video/')
}

// Create singleton instance
const apiClient = new ApiClient()

// Add methods to ApiClient for file operations
;(apiClient as any).getThumbnailUrl = function(fileId: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  return `${API_BASE_URL}/files/${fileId}/thumbnail?size=${size}`
}

;(apiClient as any).getDownloadUrl = function(fileId: string): string {
  return `${API_BASE_URL}/files/${fileId}/download`
}

// Simple upload method
;(apiClient as any).simpleUpload = async function(file: File, folderId?: string): Promise<ApiResponse<any>> {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) {
    formData.append('folderId', folderId)
  }

  const response = await fetchWithAuth('/files/upload', {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

// Export singleton instance
export { apiClient }

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦'
  return '📄'
}

export const canPreview = (mimeType: string): boolean => {
  return isImageFile(mimeType) || isVideoFile(mimeType) || mimeType.includes('pdf')
}

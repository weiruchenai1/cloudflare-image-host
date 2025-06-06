// Environment interface for Cloudflare Workers
export interface Env {
  USERS_KV: KVNamespace
  FILES_KV: KVNamespace
  INVITATIONS_KV: KVNamespace
  SESSIONS_KV: KVNamespace
  FILES_BUCKET: R2Bucket
  JWT_SECRET: string
  ADMIN_EMAIL: string
  CORS_ORIGIN: string
}

// User types
export interface User {
  id: string
  email: string
  username: string
  passwordHash: string
  role: 'admin' | 'user' | 'guest'
  storageQuota: number
  storageUsed: number
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
  invitedBy?: string
  avatar?: string
}

export interface CreateUserData {
  email: string
  username: string
  password: string
  invitationCode: string
}

// Invitation types
export interface InvitationCode {
  id: string
  code: string
  createdBy: string
  createdAt: string
  expiresAt?: string
  maxUses: number
  currentUses: number
  isActive: boolean
  usedBy: string[]
}

// File types
export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  size?: number
  path: string
  parentId?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  isPublic: boolean
  shareSettings?: ShareSettings
  thumbnail?: string
  metadata?: FileMetadata
}

export interface FileMetadata {
  width?: number
  height?: number
  duration?: number
  originalName: string
  checksum: string
  uploadedFrom?: string
}

export interface ShareSettings {
  id: string
  fileId: string
  shareType: 'public' | 'password' | 'private'
  password?: string
  expiresAt?: string
  maxDownloads?: number
  currentDownloads: number
  allowedIPs?: string[]
  createdAt: string
}

// API types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  invitationCode: string
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

// Request context
export interface RequestContext {
  user?: User
  userId?: string
  isAuthenticated: boolean
  isAdmin: boolean
}

// Upload types
export interface UploadChunk {
  chunkIndex: number
  totalChunks: number
  uploadId: string
  data: ArrayBuffer
}

export interface UploadSession {
  id: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadedChunks: number[]
  createdAt: string
  expiresAt: string
  ownerId: string
  parentId?: string
}

// Error types
export interface AppError extends Error {
  statusCode: number
  code: string
}

// Utility types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'

export interface RouteHandler {
  (request: Request, env: Env, ctx: ExecutionContext, context: RequestContext): Promise<Response>
}

export interface Route {
  method: HTTPMethod
  path: string
  handler: RouteHandler
  requireAuth?: boolean
  requireAdmin?: boolean
}

// Storage types
export interface StorageStats {
  totalFiles: number
  totalSize: number
  filesByType: Record<string, number>
  sizeByType: Record<string, number>
}

// Activity log types
export interface ActivityLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  timestamp: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// System stats types
export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalFiles: number
  totalStorage: number
  bandwidthUsage: number
  recentActivity: ActivityLog[]
}

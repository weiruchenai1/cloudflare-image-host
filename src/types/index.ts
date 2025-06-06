// User Management Types
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  role: 'admin' | 'user' | 'guest';
  storageQuota: number; // in bytes
  storageUsed: number; // in bytes
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  invitedBy?: string;
  avatar?: string;
}

export interface InvitationCode {
  id: string;
  code: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  usedBy: string[];
}

// File Management Types
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  path: string;
  parentId?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  shareSettings?: ShareSettings;
  thumbnail?: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number; // for videos
  originalName: string;
  checksum: string;
  uploadedFrom?: string; // IP or device info
}

export interface ShareSettings {
  id: string;
  fileId: string;
  shareType: 'public' | 'password' | 'private';
  password?: string;
  expiresAt?: string;
  maxDownloads?: number;
  currentDownloads: number;
  allowedIPs?: string[];
  createdAt: string;
}

// Upload Types
export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  speed?: number; // bytes per second
  eta?: number; // estimated time remaining in seconds
}

export interface UploadChunk {
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
  checksum: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  invitationCode: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Dashboard Types
export interface StorageStats {
  totalUsed: number;
  totalQuota: number;
  fileCount: number;
  folderCount: number;
  recentUploads: FileItem[];
  storageByType: Record<string, number>;
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  sizeByType: Record<string, number>;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalStorage: number;
  bandwidthUsage: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  glassEffect: boolean;
  animations: boolean;
  particles: boolean;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  type?: 'all' | 'image' | 'video' | 'document' | 'archive';
  dateRange?: {
    start: string;
    end: string;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  owner?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface SortOptions {
  field: 'name' | 'size' | 'createdAt' | 'updatedAt' | 'type';
  direction: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Cloudflare Types
export interface CloudflareEnv {
  USERS_KV: any; // KVNamespace
  FILES_KV: any; // KVNamespace
  INVITATIONS_KV: any; // KVNamespace
  SESSIONS_KV: any; // KVNamespace
  FILES_BUCKET: any; // R2Bucket
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
  CORS_ORIGIN: string;
}

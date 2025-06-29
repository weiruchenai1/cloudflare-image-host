// functions/types/index.ts
export interface Env {
  IMAGE_HOST_KV: KVNamespace;
  IMAGE_HOST_R2: R2Bucket;
  
  // 环境变量
  JWT_SECRET: string;
  R2_BUCKET_NAME: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_PUBLIC_DOMAIN: string;
  SITE_DOMAIN: string;
  DEFAULT_STORAGE_QUOTA: string;
  MAX_FILE_SIZE: string;
  ADMIN_EMAIL: string;
  BCRYPT_ROUNDS: string;
  SESSION_EXPIRE_HOURS: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'user';
  storageQuota: number;
  storageUsed: number;
  createdAt: string;
  isActive: boolean;
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  folderId?: string;
  folderPath?: string;
  userId: string;
  uploadedAt: string;
  isPublic: boolean;
  tags: string[];
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  userId: string;
  createdAt: string;
  isPublic: boolean;
}

export interface ShareLink {
  id: string;
  fileId: string;
  token: string;
  password?: string;
  expiresAt?: string;
  maxViews?: number;
  currentViews: number;
  createdAt: string;
  isActive: boolean;
}

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  expiresAt?: string;
  maxUses: number;
  currentUses: number;
  usedBy: Array<{
    userId: string;
    username: string;
    usedAt: string;
  }>;
  createdAt: string;
}

export interface SystemSettings {
  siteName: string;
  siteTitle: string;
  defaultStorageQuota: number;
  allowRegistration: boolean;
  backgroundMode: string;
  backgroundOpacity: number;
  backgroundInterval: number;
  showFooter: boolean;
  footerLinks: Array<{ name: string; url: string }>;
  defaultLanguage: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  initializedAt: string;
  adminEmail: string;
}
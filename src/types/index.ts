// src/types/index.ts - 修复版本
export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string; // 前端通常不需要密码字段
  role: 'admin' | 'user';
  storageQuota: number;
  storageUsed: number;
  createdAt: string;
  isActive: boolean;
}

export interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  folderId?: string;
  folderPath?: string;
  isPublic: boolean;
  uploadedAt: string;
  userId: string;
  tags: string[];
}

// 与后端FileMetadata保持一致
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
  url?: string; // 前端显示用
  fileName?: string; // 前端显示用
  fileType?: string; // 前端显示用
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

export interface AppSettings {
  siteName: string;
  siteLogo?: string;
  siteTitle: string;
  siteIcon?: string;
  backgroundMode: 'single' | 'carousel' | 'bing';
  backgroundImages: string[];
  backgroundOpacity: number;
  backgroundInterval: number;
  showFooter: boolean;
  footerLinks: Array<{
    name: string;
    url: string;
  }>;
  defaultLanguage: 'zh' | 'en';
  allowRegistration: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 统计数据类型
export interface DashboardStats {
  users?: {
    total: number;
    active: number;
    growth: string;
  };
  files?: {
    total: number;
    growth: string;
  };
  shares?: {
    total: number;
    growth: string;
  };
  storage?: {
    used: number;
    growth: string;
  };
  views?: {
    today: number;
    total: number;
    growth: string;
  };
}

export interface UserStats {
  storage?: {
    used: number;
    quota: number;
    percentage: number;
  };
  files?: {
    count: number;
  };
  shares?: {
    count: number;
  };
  account?: {
    createdAt: string;
    role: string;
    isActive: boolean;
  };
}
export interface User {
  id: string;
  username: string;
  email?: string;
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
  isPublic: boolean;
  uploadedAt: string;
  userId: string;
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
}

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  usedBy?: string;
  expiresAt?: string;
  isUsed: boolean;
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

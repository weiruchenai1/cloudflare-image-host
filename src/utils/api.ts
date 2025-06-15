import { FileItem } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FilesResponse {
  files: FileItem[];
}

interface ApiError {
  message: string;
}

export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' })) as ApiError;
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  async getFiles(): Promise<FilesResponse> {
    return this.request<FilesResponse>('/files');
  }

  async uploadFile(file: File, folderId?: string): Promise<ApiResponse<FileItem>> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' })) as ApiError;
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async updateFile(fileId: string, data: Partial<FileItem>): Promise<ApiResponse<FileItem>> {
    return this.request<ApiResponse<FileItem>>(`/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // 认证相关
  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    inviteCode: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // 分享相关
  async createShare(fileId: string, options: {
    password?: string;
    expiresAt?: string;
    maxViews?: number;
  }) {
    return this.request('/shares', {
      method: 'POST',
      body: JSON.stringify({ fileId, ...options }),
    });
  }

  async getShares() {
    return this.request('/shares');
  }

  async deleteShare(shareId: string) {
    return this.request(`/shares/${shareId}`, { method: 'DELETE' });
  }

  // 管理员相关
  async getUsers() {
    return this.request('/admin/users');
  }

  async updateUser(userId: string, action: string, value?: any) {
    return this.request('/admin/users', {
      method: 'PUT',
      body: JSON.stringify({ userId, action, value }),
    });
  }

  async generateInviteCode(options: {
    expiresAt?: string;
    maxUses?: number;
  }) {
    return this.request('/admin/invites', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }
}

export const api = new ApiClient();

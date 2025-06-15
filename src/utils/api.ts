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
  private token: string | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
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
    formData.append('file', file, file.name);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const headers: HeadersInit = {
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
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
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ token: string }>> {
    return this.request<ApiResponse<{ token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    inviteCode: string;
  }): Promise<ApiResponse<{ token: string }>> {
    return this.request<ApiResponse<{ token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/auth/logout', { method: 'POST' });
  }

  // 分享相关
  async createShare(fileId: string, options: {
    password?: string;
    expiresAt?: string;
    maxViews?: number;
  }): Promise<ApiResponse<{ shareUrl: string }>> {
    return this.request<ApiResponse<{ shareUrl: string }>>('/shares', {
      method: 'POST',
      body: JSON.stringify({ fileId, ...options }),
    });
  }

  async getShares(): Promise<ApiResponse<Array<{ id: string; fileId: string; shareUrl: string }>>> {
    return this.request<ApiResponse<Array<{ id: string; fileId: string; shareUrl: string }>>>('/shares');
  }

  async deleteShare(shareId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/shares/${shareId}`, { method: 'DELETE' });
  }

  // 管理员相关
  async getUsers(): Promise<ApiResponse<Array<{ id: string; username: string; email: string; role: string }>>> {
    return this.request<ApiResponse<Array<{ id: string; username: string; email: string; role: string }>>>('/admin/users');
  }

  async updateUser(userId: string, action: string, value?: any): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/users', {
      method: 'PUT',
      body: JSON.stringify({ userId, action, value }),
    });
  }

  async generateInviteCode(options: {
    expiresAt?: string;
    maxUses?: number;
  }): Promise<ApiResponse<{ code: string }>> {
    return this.request<ApiResponse<{ code: string }>>('/admin/invites', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }
}

export const api = new ApiClient();

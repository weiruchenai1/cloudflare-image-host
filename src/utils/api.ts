// src/utils/api.ts - 修复版本
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
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

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // 如果不是 FormData，添加 Content-Type
    if (!(options.body instanceof FormData) && options.body) {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = 'Network error';
      try {
        const errorData = await response.json() as { error?: string; message?: string };
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // 检查API响应格式
    if (result.success === false) {
      throw new Error(result.error || result.message || 'Request failed');
    }
    
    // 返回data字段的内容，如果没有则返回整个结果
    return result.data || result;
  }

  // 认证相关
  async login(credentials: { username: string; password: string }) {
    const result = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return result;
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    inviteCode: string;
  }) {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateToken() {
    return this.request<{ user: any }>('/auth/validate');
  }

  async setup(data: {
    adminUsername: string;
    adminPassword: string;
    siteName: string;
    siteTitle: string;
    defaultStorageQuota: number;
  }) {
    return this.request<{ success: boolean; message?: string }>('/system/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 文件相关
  async uploadFile(file: File, folderId?: string, tags?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (tags) formData.append('tags', tags);

    return this.request<{ file: any }>('/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getFiles(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    folderId?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value.toString());
        }
      });
    }
    const queryString = query.toString();
    return this.request<{ files: any[]; pagination?: any }>(`/files/list${queryString ? `?${queryString}` : ''}`);
  }

  async deleteFile(fileId: string) {
    return this.request<{ message: string }>(`/files/${fileId}`, { 
      method: 'DELETE' 
    });
  }

  async updateFile(fileId: string, action: string, data: any) {
    return this.request<{ file: any; message: string }>(`/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify({ action, ...data }),
    });
  }

  // 文件夹相关
  async createFolder(name: string, parentId?: string) {
    return this.request<{ folder: any }>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    });
  }

  async getFolders(parentId?: string) {
    const query = parentId ? `?parentId=${parentId}` : '';
    return this.request<{ folders: any[] }>(`/folders${query}`);
  }

  // 分享相关
  async createShare(fileId: string, options: {
    password?: string;
    expiresAt?: string;
    maxViews?: number;
  }) {
    return this.request<{ share: any }>('/shares', {
      method: 'POST',
      body: JSON.stringify({ fileId, ...options }),
    });
  }

  async getShares() {
    return this.request<{ shares: any[] }>('/shares');
  }

  async deleteShare(shareId: string) {
    return this.request<{ message: string }>(`/shares/${shareId}`, { 
      method: 'DELETE' 
    });
  }

  async updateShare(shareId: string, data: any) {
    return this.request<{ share: any }>(`/shares/${shareId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 管理员相关
  async getUsers() {
    return this.request<{ users: any[] }>('/admin/users');
  }

  async updateUser(userId: string, action: string, value?: any) {
    return this.request<{ message: string }>('/admin/users', {
      method: 'PUT',
      body: JSON.stringify({ userId, action, value }),
    });
  }

  async generateInviteCode(options: {
    expiresAt?: string;
    maxUses?: number;
  }) {
    return this.request<{ invite: any }>('/admin/invites', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getInviteCodes() {
    return this.request<{ invites: any[] }>('/admin/invites');
  }

  // 统计数据
  async getDashboardStats() {
    return this.request<any>('/stats/dashboard');
  }

  async getUserStats() {
    return this.request<any>('/stats/user');
  }

  // 系统状态和设置
  async getSystemStatus() {
    return this.request<any>('/system/status');
  }

  async updateSystemSettings(settings: any) {
    return this.request<{ message: string }>('/system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();
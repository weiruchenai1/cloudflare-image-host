// src/utils/api.ts
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
        const errorData = await response.json() as { message?: string };
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // 认证相关
  async login(credentials: { username: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/login', {
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
    return this.request<{ success: boolean; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateToken() {
    return this.request<{ user?: any }>('/auth/validate');
  }

  async setup(data: {
    adminUsername: string;
    adminPassword: string;
    siteName: string;
    siteTitle: string;
    defaultStorageQuota: number;
  }) {
    return this.request<{ success: boolean; message?: string }>('/setup', {
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

    return this.request<{ success: boolean; file: any }>('/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getFiles(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, value.toString());
        }
      });
    }
    return this.request<{ files: any[]; total: number }>(`/files/list?${query.toString()}`);
  }

  async deleteFile(fileId: string) {
    return this.request<{ success: boolean }>(`/files/${fileId}`, { method: 'DELETE' });
  }

  async updateFile(fileId: string, action: string, data: any) {
    return this.request<{ success: boolean; file: any }>(`/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify({ action, ...data }),
    });
  }

  // 文件夹相关
  async createFolder(name: string, parentId?: string) {
    return this.request<{ success: boolean; folder: any }>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    });
  }

  async getFolders() {
    return this.request<{ folders: any[] }>('/folders');
  }

  // 分享相关
  async createShare(fileId: string, options: {
    password?: string;
    expiresAt?: string;
    maxViews?: number;
  }) {
    return this.request<{ success: boolean; share: any }>('/shares', {
      method: 'POST',
      body: JSON.stringify({ fileId, ...options }),
    });
  }

  async getShares() {
    return this.request<{ shares: any[] }>('/shares');
  }

  async deleteShare(shareId: string) {
    return this.request<{ success: boolean }>(`/shares/${shareId}`, { method: 'DELETE' });
  }

  async updateShare(shareId: string, data: any) {
    return this.request<{ success: boolean }>(`/shares/${shareId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 管理员相关
  async getUsers() {
    return this.request<{ users: any[] }>('/admin/users');
  }

  async updateUser(userId: string, action: string, value?: any) {
    return this.request<{ success: boolean }>('/admin/users', {
      method: 'PUT',
      body: JSON.stringify({ userId, action, value }),
    });
  }

  async generateInviteCode(options: {
    expiresAt?: string;
    maxUses?: number;
  }) {
    return this.request<{ success: boolean; invite: any }>('/admin/invites', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getInviteCodes() {
    return this.request<{ invites: any[] }>('/admin/invites');
  }

  // 统计数据
  async getDashboardStats() {
    return this.request<{
      totalFiles: number;
      totalShares: number;
      todayViews: number;
      storageGrowth: string;
      filesGrowth: string;
      sharesGrowth: string;
      viewsGrowth: string;
    }>('/stats/dashboard');
  }

  async getUserStats() {
    return this.request<{
      storageUsed: number;
      storageQuota: number;
    }>('/stats/user');
  }

  // 系统设置
  async getSystemSettings() {
    return this.request<any>('/system/settings');
  }

  async updateSystemSettings(settings: any) {
    return this.request<{ success: boolean }>('/system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();

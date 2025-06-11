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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Network error');
    }

    return response.json();
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

  // 文件相关
  async uploadFile(file: File, folderId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    return this.request('/upload', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async getFiles(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/files/list?${query}`);
  }

  async deleteFile(fileId: string) {
    return this.request(`/files/${fileId}`, { method: 'DELETE' });
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

import { generateHash, verifyPassword } from './crypto.js';

// 生成随机用户ID
export function generateUserId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'user_';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 生成会话ID
export function generateSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 创建用户
export async function createUser(env, username, password, role = 'user', invitedBy = null, quota = 1073741824) {
    const userId = role === 'admin' ? 'admin' : generateUserId();
    
    // 检查用户名是否已存在
    const existingUserId = await env.img_url.get(`usernames:${username}`);
    if (existingUserId) {
        return { success: false, error: 'USERNAME_EXISTS' };
    }

    const passwordHash = await generateHash(password);
    const now = Date.now();

    const userData = {
        username,
        password: passwordHash,
        role,
        createdAt: now,
        quota: { used: 0, total: quota },
        status: 'active',
        invitedBy,
        lastLogin: null,
        mustChangePassword: role === 'admin' && password === 'admin123'
    };

    try {
        // 保存用户数据
        await env.img_url.put(`users:${userId}`, JSON.stringify(userData));
        // 保存用户名映射
        await env.img_url.put(`usernames:${username}`, userId);
        
        return { success: true, userId, userData };
    } catch (error) {
        console.error('Failed to create user:', error);
        return { success: false, error: 'DATABASE_ERROR' };
    }
}

// 验证用户登录
export async function authenticateUser(env, username, password) {
    try {
        // 通过用户名获取用户ID
        const userId = await env.img_url.get(`usernames:${username}`);
        if (!userId) {
            return { success: false, error: 'USER_NOT_FOUND' };
        }

        // 获取用户数据
        const userDataStr = await env.img_url.get(`users:${userId}`);
        if (!userDataStr) {
            return { success: false, error: 'USER_NOT_FOUND' };
        }

        const userData = JSON.parse(userDataStr);

        // 检查用户状态
        if (userData.status !== 'active') {
            return { success: false, error: 'USER_SUSPENDED' };
        }

        // 验证密码
        const isValidPassword = await verifyPassword(password, userData.password);
        if (!isValidPassword) {
            return { success: false, error: 'INVALID_PASSWORD' };
        }

        // 更新最后登录时间
        userData.lastLogin = Date.now();
        await env.img_url.put(`users:${userId}`, JSON.stringify(userData));

        return { success: true, userId, userData };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, error: 'DATABASE_ERROR' };
    }
}

// 创建会话
export async function createSession(env, userId) {
    const sessionId = generateSessionId();
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30天过期

    const sessionData = {
        userId,
        createdAt: Date.now(),
        expiresAt
    };

    try {
        await env.img_url.put(`sessions:${sessionId}`, JSON.stringify(sessionData));
        return { success: true, sessionId, expiresAt };
    } catch (error) {
        console.error('Failed to create session:', error);
        return { success: false, error: 'DATABASE_ERROR' };
    }
}

// 验证会话
export async function validateSession(env, sessionId) {
    if (!sessionId) {
        return { success: false, error: 'NO_SESSION' };
    }

    try {
        const sessionDataStr = await env.img_url.get(`sessions:${sessionId}`);
        if (!sessionDataStr) {
            return { success: false, error: 'SESSION_NOT_FOUND' };
        }

        const sessionData = JSON.parse(sessionDataStr);

        // 检查会话是否过期
        if (sessionData.expiresAt < Date.now()) {
            // 删除过期会话
            await env.img_url.delete(`sessions:${sessionId}`);
            return { success: false, error: 'SESSION_EXPIRED' };
        }

        // 获取用户数据
        const userDataStr = await env.img_url.get(`users:${sessionData.userId}`);
        if (!userDataStr) {
            return { success: false, error: 'USER_NOT_FOUND' };
        }

        const userData = JSON.parse(userDataStr);

        // 检查用户状态
        if (userData.status !== 'active') {
            return { success: false, error: 'USER_SUSPENDED' };
        }

        return { 
            success: true, 
            userId: sessionData.userId, 
            userData,
            sessionData 
        };
    } catch (error) {
        console.error('Session validation error:', error);
        return { success: false, error: 'DATABASE_ERROR' };
    }
}

// 删除会话（登出）
export async function deleteSession(env, sessionId) {
    if (!sessionId) {
        return { success: false, error: 'NO_SESSION' };
    }

    try {
        await env.img_url.delete(`sessions:${sessionId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete session:', error);
        return { success: false, error: 'DATABASE_ERROR' };
    }
}

// 从请求中获取会话ID
export function getSessionFromRequest(request) {
    const cookies = request.headers.get('Cookie');
    if (!cookies) return null;

    const match = cookies.match(/session=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// 获取当前用户
export async function getCurrentUser(env, request) {
    const sessionId = getSessionFromRequest(request);
    return await validateSession(env, sessionId);
}

// 创建认证响应
export function createAuthResponse(body, options = {}) {
    const defaultHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
    
    return new Response(body, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });
}

// 设置会话Cookie
export function setSessionCookie(sessionId, expiresAt) {
    const expires = new Date(expiresAt).toUTCString();
    return `session=${encodeURIComponent(sessionId)}; Expires=${expires}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

// 清除会话Cookie
export function clearSessionCookie() {
    return 'session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Strict';
}

// 初始化默认管理员账号
export async function initializeDefaultAdmin(env) {
    try {
        // 检查是否已存在admin账号
        const adminExists = await env.img_url.get('users:admin');
        if (adminExists) {
            return { success: true, message: 'Admin already exists' };
        }

        // 创建默认管理员账号
        const result = await createUser(env, 'admin', 'admin123', 'admin', null, 10737418240); // 10GB配额
        
        if (result.success) {
            console.log('Default admin account created: admin/admin123');
            return { success: true, message: 'Default admin created' };
        } else {
            console.error('Failed to create default admin:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('Error initializing admin:', error);
        return { success: false, error: 'INITIALIZATION_ERROR' };
    }
}
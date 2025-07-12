import { getCurrentUser, createAuthResponse } from '../../utils/auth.js';

// 获取用户列表 (GET)
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        // 验证管理员权限
        const userResult = await getCurrentUser(env, request);
        
        if (!userResult.success) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'NOT_AUTHENTICATED',
                message: '未登录'
            }), { status: 401 });
        }

        if (userResult.userData.role !== 'admin') {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INSUFFICIENT_PERMISSIONS',
                message: '权限不足'
            }), { status: 403 });
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const search = url.searchParams.get('search') || '';

        // 获取所有用户
        const users = [];
        const listResult = await env.img_url.list({ prefix: 'users:' });
        
        for (const key of listResult.keys) {
            try {
                const userDataStr = await env.img_url.get(key.name);
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    const userId = key.name.replace('users:', '');
                    
                    // 搜索过滤
                    if (search && !userData.username.toLowerCase().includes(search.toLowerCase())) {
                        continue;
                    }

                    // 计算用户文件数量
                    let fileCount = 0;
                    try {
                        const userFiles = await env.img_url.list({ prefix: `${userId}/` });
                        fileCount = userFiles.keys.length;
                    } catch (e) {
                        console.error('Error counting files for user:', userId, e);
                    }

                    users.push({
                        id: userId,
                        username: userData.username,
                        role: userData.role,
                        status: userData.status,
                        createdAt: userData.createdAt,
                        lastLogin: userData.lastLogin,
                        quota: userData.quota,
                        fileCount: fileCount,
                        invitedBy: userData.invitedBy
                    });
                }
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }

        // 按创建时间倒序排列
        users.sort((a, b) => b.createdAt - a.createdAt);

        // 分页
        const total = users.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);

        return createAuthResponse(JSON.stringify({
            success: true,
            users: paginatedUsers,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get users error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '获取用户列表失败'
        }), { status: 500 });
    }
}

// OPTIONS请求处理
export async function onRequestOptions() {
    return createAuthResponse('', {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
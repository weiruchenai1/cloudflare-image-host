import { getCurrentUser, createAuthResponse } from '../../utils/auth.js';
import { generateInviteCode } from '../../utils/crypto.js';

// 生成邀请码 (POST)
export async function onRequestPost(context) {
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

        const formData = await request.formData();
        const quota = parseInt(formData.get('quota')) || 1073741824; // 默认1GB
        const expiresIn = parseInt(formData.get('expiresIn')) || 604800; // 默认7天
        
        // 验证配额范围
        if (quota < 104857600 || quota > 107374182400) { // 100MB - 100GB
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVALID_QUOTA',
                message: '配额范围应在100MB到100GB之间'
            }), { status: 400 });
        }

        // 验证过期时间范围
        if (expiresIn < 3600 || expiresIn > 2592000) { // 1小时 - 30天
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVALID_EXPIRES',
                message: '过期时间应在1小时到30天之间'
            }), { status: 400 });
        }

        // 生成唯一邀请码
        let inviteCode;
        let attempts = 0;
        do {
            inviteCode = generateInviteCode();
            attempts++;
            if (attempts > 10) {
                throw new Error('Failed to generate unique invite code');
            }
        } while (await env.img_url.get(`invites:${inviteCode}`));

        const inviteData = {
            code: inviteCode,
            createdBy: userResult.userId,
            createdAt: Date.now(),
            usedBy: null,
            usedAt: null,
            expiresAt: Date.now() + (expiresIn * 1000),
            quota: quota
        };

        // 保存邀请码
        await env.img_url.put(`invites:${inviteCode}`, JSON.stringify(inviteData));

        return createAuthResponse(JSON.stringify({
            success: true,
            message: '邀请码生成成功',
            invite: {
                code: inviteCode,
                quota: quota,
                expiresAt: inviteData.expiresAt,
                createdAt: inviteData.createdAt
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Generate invite error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '生成邀请码失败'
        }), { status: 500 });
    }
}

// 获取邀请码列表 (GET)
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

        // 获取所有邀请码
        const invites = [];
        const listResult = await env.img_url.list({ prefix: 'invites:' });
        
        for (const key of listResult.keys) {
            try {
                const inviteDataStr = await env.img_url.get(key.name);
                if (inviteDataStr) {
                    const inviteData = JSON.parse(inviteDataStr);
                    
                    // 获取使用者用户名（如果已使用）
                    let usedByUsername = null;
                    if (inviteData.usedBy) {
                        const userDataStr = await env.img_url.get(`users:${inviteData.usedBy}`);
                        if (userDataStr) {
                            const userData = JSON.parse(userDataStr);
                            usedByUsername = userData.username;
                        }
                    }

                    invites.push({
                        code: inviteData.code,
                        createdAt: inviteData.createdAt,
                        expiresAt: inviteData.expiresAt,
                        quota: inviteData.quota,
                        usedBy: usedByUsername,
                        usedAt: inviteData.usedAt,
                        isExpired: inviteData.expiresAt < Date.now(),
                        isUsed: !!inviteData.usedBy
                    });
                }
            } catch (e) {
                console.error('Error parsing invite:', e);
            }
        }

        // 按创建时间倒序排列
        invites.sort((a, b) => b.createdAt - a.createdAt);

        return createAuthResponse(JSON.stringify({
            success: true,
            invites: invites
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get invites error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '获取邀请码列表失败'
        }), { status: 500 });
    }
}

// OPTIONS请求处理
export async function onRequestOptions() {
    return createAuthResponse('', {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
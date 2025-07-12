import { getCurrentUser, createAuthResponse } from '../../utils/auth.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const userResult = await getCurrentUser(env, request);
        
        if (!userResult.success) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'NOT_AUTHENTICATED',
                message: '未登录'
            }), { status: 401 });
        }

        // 返回用户信息（不包含敏感数据）
        const userInfo = {
            id: userResult.userId,
            username: userResult.userData.username,
            role: userResult.userData.role,
            createdAt: userResult.userData.createdAt,
            lastLogin: userResult.userData.lastLogin,
            quota: userResult.userData.quota,
            status: userResult.userData.status,
            mustChangePassword: userResult.userData.mustChangePassword
        };

        return createAuthResponse(JSON.stringify({
            success: true,
            user: userInfo
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Get user info error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '获取用户信息失败'
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
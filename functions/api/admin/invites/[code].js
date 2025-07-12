import { getCurrentUser, createAuthResponse } from '../../../utils/auth.js';

// 删除邀请码 (DELETE)
export async function onRequestDelete(context) {
    const { request, env, params } = context;

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

        const inviteCode = params.code;
        
        // 检查邀请码是否存在
        const inviteDataStr = await env.img_url.get(`invites:${inviteCode}`);
        if (!inviteDataStr) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVITE_NOT_FOUND',
                message: '邀请码不存在'
            }), { status: 404 });
        }

        // 删除邀请码
        await env.img_url.delete(`invites:${inviteCode}`);

        return createAuthResponse(JSON.stringify({
            success: true,
            message: '邀请码删除成功'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete invite error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '删除邀请码失败'
        }), { status: 500 });
    }
}

// OPTIONS请求处理
export async function onRequestOptions() {
    return createAuthResponse('', {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
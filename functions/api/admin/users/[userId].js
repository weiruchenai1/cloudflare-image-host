import { getCurrentUser, createAuthResponse } from '../../../utils/auth.js';
import { generateHash } from '../../../utils/crypto.js';

// 更新用户信息 (PUT)
export async function onRequestPut(context) {
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

        const targetUserId = params.userId;
        const formData = await request.formData();
        const action = formData.get('action');

        // 获取目标用户数据
        const targetUserDataStr = await env.img_url.get(`users:${targetUserId}`);
        if (!targetUserDataStr) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'USER_NOT_FOUND',
                message: '用户不存在'
            }), { status: 404 });
        }

        const targetUserData = JSON.parse(targetUserDataStr);

        switch (action) {
            case 'resetPassword':
                const newPassword = formData.get('newPassword');
                
                if (!newPassword || newPassword.length < 6) {
                    return createAuthResponse(JSON.stringify({
                        success: false,
                        error: 'INVALID_PASSWORD',
                        message: '密码长度至少6位'
                    }), { status: 400 });
                }

                // 更新密码
                targetUserData.password = await generateHash(newPassword);
                targetUserData.mustChangePassword = false;
                
                await env.img_url.put(`users:${targetUserId}`, JSON.stringify(targetUserData));

                return createAuthResponse(JSON.stringify({
                    success: true,
                    message: '密码重置成功'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'updateStatus':
                const newStatus = formData.get('status');
                
                if (!['active', 'suspended'].includes(newStatus)) {
                    return createAuthResponse(JSON.stringify({
                        success: false,
                        error: 'INVALID_STATUS',
                        message: '无效的状态值'
                    }), { status: 400 });
                }

                // 不能暂停管理员账号
                if (targetUserData.role === 'admin' && newStatus === 'suspended') {
                    return createAuthResponse(JSON.stringify({
                        success: false,
                        error: 'CANNOT_SUSPEND_ADMIN',
                        message: '不能暂停管理员账号'
                    }), { status: 400 });
                }

                targetUserData.status = newStatus;
                await env.img_url.put(`users:${targetUserId}`, JSON.stringify(targetUserData));

                return createAuthResponse(JSON.stringify({
                    success: true,
                    message: `用户状态已更新为${newStatus === 'active' ? '激活' : '暂停'}`
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'updateQuota':
                const newQuota = parseInt(formData.get('quota'));
                
                if (!newQuota || newQuota < 104857600 || newQuota > 107374182400) {
                    return createAuthResponse(JSON.stringify({
                        success: false,
                        error: 'INVALID_QUOTA',
                        message: '配额范围应在100MB到100GB之间'
                    }), { status: 400 });
                }

                targetUserData.quota.total = newQuota;
                await env.img_url.put(`users:${targetUserId}`, JSON.stringify(targetUserData));

                return createAuthResponse(JSON.stringify({
                    success: true,
                    message: '用户配额已更新'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            default:
                return createAuthResponse(JSON.stringify({
                    success: false,
                    error: 'INVALID_ACTION',
                    message: '无效的操作'
                }), { status: 400 });
        }

    } catch (error) {
        console.error('Update user error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '更新用户信息失败'
        }), { status: 500 });
    }
}

// 删除用户 (DELETE)
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

        const targetUserId = params.userId;

        // 获取目标用户数据
        const targetUserDataStr = await env.img_url.get(`users:${targetUserId}`);
        if (!targetUserDataStr) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'USER_NOT_FOUND',
                message: '用户不存在'
            }), { status: 404 });
        }

        const targetUserData = JSON.parse(targetUserDataStr);

        // 不能删除管理员账号
        if (targetUserData.role === 'admin') {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'CANNOT_DELETE_ADMIN',
                message: '不能删除管理员账号'
            }), { status: 400 });
        }

        // 不能删除自己
        if (targetUserId === userResult.userId) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'CANNOT_DELETE_SELF',
                message: '不能删除自己'
            }), { status: 400 });
        }

        // 删除用户数据
        await env.img_url.delete(`users:${targetUserId}`);
        await env.img_url.delete(`usernames:${targetUserData.username}`);

        // 删除用户的所有会话
        const sessionsResult = await env.img_url.list({ prefix: 'sessions:' });
        for (const key of sessionsResult.keys) {
            try {
                const sessionDataStr = await env.img_url.get(key.name);
                if (sessionDataStr) {
                    const sessionData = JSON.parse(sessionDataStr);
                    if (sessionData.userId === targetUserId) {
                        await env.img_url.delete(key.name);
                    }
                }
            } catch (e) {
                console.error('Error deleting session:', e);
            }
        }

        // 删除用户的所有文件（这里只删除元数据，实际文件数据需要根据存储渠道处理）
        const userFiles = await env.img_url.list({ prefix: `${targetUserId}/` });
        for (const key of userFiles.keys) {
            await env.img_url.delete(key.name);
        }

        return createAuthResponse(JSON.stringify({
            success: true,
            message: '用户删除成功'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '删除用户失败'
        }), { status: 500 });
    }
}

// OPTIONS请求处理
export async function onRequestOptions() {
    return createAuthResponse('', {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
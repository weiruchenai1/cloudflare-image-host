import { createUser, createSession, createAuthResponse, setSessionCookie } from '../../utils/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');
        const inviteCode = formData.get('inviteCode');

        // 验证输入
        if (!username || !password || !inviteCode) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'MISSING_FIELDS',
                message: '请填写完整信息'
            }), { status: 400 });
        }

        // 验证用户名格式
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVALID_USERNAME',
                message: '用户名只能包含字母、数字和下划线，长度3-20位'
            }), { status: 400 });
        }

        // 验证密码强度
        if (password.length < 6) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'WEAK_PASSWORD',
                message: '密码长度至少6位'
            }), { status: 400 });
        }

        // 验证邀请码
        const inviteDataStr = await env.img_url.get(`invites:${inviteCode}`);
        if (!inviteDataStr) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVALID_INVITE',
                message: '邀请码无效'
            }), { status: 400 });
        }

        const inviteData = JSON.parse(inviteDataStr);

        // 检查邀请码是否已使用
        if (inviteData.usedBy) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVITE_USED',
                message: '邀请码已被使用'
            }), { status: 400 });
        }

        // 检查邀请码是否过期
        if (inviteData.expiresAt < Date.now()) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVITE_EXPIRED',
                message: '邀请码已过期'
            }), { status: 400 });
        }

        // 创建用户
        const userResult = await createUser(
            env, 
            username, 
            password, 
            'user', 
            inviteData.createdBy, 
            inviteData.quota
        );

        if (!userResult.success) {
            let message = '注册失败';
            switch (userResult.error) {
                case 'USERNAME_EXISTS':
                    message = '用户名已存在';
                    break;
                case 'DATABASE_ERROR':
                    message = '系统错误，请稍后重试';
                    break;
            }

            return createAuthResponse(JSON.stringify({
                success: false,
                error: userResult.error,
                message
            }), { status: 400 });
        }

        // 标记邀请码为已使用
        inviteData.usedBy = userResult.userId;
        inviteData.usedAt = Date.now();
        await env.img_url.put(`invites:${inviteCode}`, JSON.stringify(inviteData));

        // 创建会话
        const sessionResult = await createSession(env, userResult.userId);
        
        if (!sessionResult.success) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'SESSION_ERROR',
                message: '注册成功但创建会话失败，请重新登录'
            }), { status: 500 });
        }

        // 返回成功响应
        const responseData = {
            success: true,
            message: '注册成功',
            user: {
                id: userResult.userId,
                username: userResult.userData.username,
                role: userResult.userData.role,
                mustChangePassword: false
            }
        };

        return createAuthResponse(JSON.stringify(responseData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': setSessionCookie(sessionResult.sessionId, sessionResult.expiresAt)
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '服务器内部错误'
        }), { status: 500 });
    }
}

// OPTIONS请求处理
export async function onRequestOptions() {
    return createAuthResponse('', {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
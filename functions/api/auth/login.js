import { authenticateUser, createSession, createAuthResponse, setSessionCookie, initializeDefaultAdmin } from '../../utils/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // 初始化默认管理员账号（如果不存在）
        await initializeDefaultAdmin(env);

        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');

        // 验证输入
        if (!username || !password) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'MISSING_CREDENTIALS',
                message: '请输入用户名和密码'
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

        // 验证密码长度
        if (password.length < 6) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'INVALID_PASSWORD',
                message: '密码长度至少6位'
            }), { status: 400 });
        }

        // 验证用户身份
        const authResult = await authenticateUser(env, username, password);
        
        if (!authResult.success) {
            let message = '登录失败';
            switch (authResult.error) {
                case 'USER_NOT_FOUND':
                    message = '用户不存在';
                    break;
                case 'INVALID_PASSWORD':
                    message = '密码错误';
                    break;
                case 'USER_SUSPENDED':
                    message = '账号已被暂停';
                    break;
                case 'DATABASE_ERROR':
                    message = '系统错误，请稍后重试';
                    break;
            }

            return createAuthResponse(JSON.stringify({
                success: false,
                error: authResult.error,
                message
            }), { status: 401 });
        }

        // 创建会话
        const sessionResult = await createSession(env, authResult.userId);
        
        if (!sessionResult.success) {
            return createAuthResponse(JSON.stringify({
                success: false,
                error: 'SESSION_ERROR',
                message: '创建会话失败，请稍后重试'
            }), { status: 500 });
        }

        // 返回成功响应并设置Cookie
        const responseData = {
            success: true,
            message: '登录成功',
            user: {
                id: authResult.userId,
                username: authResult.userData.username,
                role: authResult.userData.role,
                mustChangePassword: authResult.userData.mustChangePassword
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
        console.error('Login error:', error);
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
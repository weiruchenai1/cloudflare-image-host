import { deleteSession, createAuthResponse, clearSessionCookie, getSessionFromRequest } from '../../utils/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const sessionId = getSessionFromRequest(request);
        
        if (sessionId) {
            await deleteSession(env, sessionId);
        }

        return createAuthResponse(JSON.stringify({
            success: true,
            message: '已退出登录'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': clearSessionCookie()
            }
        });

    } catch (error) {
        console.error('Logout error:', error);
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '退出登录失败'
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
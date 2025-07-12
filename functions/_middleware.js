import { getCurrentUser } from './utils/auth.js';

export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    
    // 不需要认证的路径
    const publicPaths = [
        '/login.html',
        '/test.html',
        '/api/auth/login',
        '/api/auth/register',
        '/css/',
        '/js/',
        '/img/',
        '/logo.png',
        '/logo-dark.png',
        '/favicon.ico'
    ];
    
    // 检查是否为公开路径
    const isPublicPath = publicPaths.some(path => url.pathname.startsWith(path));
    
    if (isPublicPath) {
        return next();
    }
    
    // 检查用户认证状态
    const userResult = await getCurrentUser(context.env, request);
    
    // 如果访问根路径且未登录，重定向到登录页
    if (!userResult.success && url.pathname === '/') {
        return Response.redirect(new URL('/login.html', request.url).href, 302);
    }
    
    // 如果访问根路径且已登录，重定向到dashboard
    if (userResult.success && url.pathname === '/') {
        return Response.redirect(new URL('/dashboard.html', request.url).href, 302);
    }
    
    // 如果访问其他需要认证的路径且未登录，返回401
    if (!userResult.success) {
        if (url.pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'NOT_AUTHENTICATED',
                message: '请先登录'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return Response.redirect(new URL('/login.html', request.url).href, 302);
        }
    }
    
    // 已登录，继续处理请求
    return next();
}
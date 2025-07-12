import { getCurrentUser } from './utils/auth.js';

export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    
    console.log(`[Middleware] Processing: ${url.pathname}`);
    
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
        console.log(`[Middleware] Public path: ${url.pathname}`);
        return next();
    }
    
    // 检查环境变量是否配置正确
    if (!context.env || !context.env.img_url) {
        console.error('[Middleware] KV namespace img_url not found');
        if (url.pathname !== '/test.html') {
            return Response.redirect(new URL('/test.html', request.url).href, 302);
        }
        return next();
    }
    
    // 检查用户认证状态
    let userResult = { success: false };
    try {
        userResult = await getCurrentUser(context.env, request);
        console.log(`[Middleware] Auth result: ${userResult.success}`);
    } catch (error) {
        console.error('[Middleware] Authentication error:', error);
        if (url.pathname !== '/test.html') {
            return Response.redirect(new URL('/test.html', request.url).href, 302);
        }
        return next();
    }
    
    // 简化重定向逻辑
    if (url.pathname === '/') {
        // 根路径重定向
        const target = userResult.success ? '/dashboard.html' : '/login.html';
        console.log(`[Middleware] Root redirect to: ${target}`);
        return Response.redirect(new URL(target, request.url).href, 302);
    }
    
    if (url.pathname === '/login.html' && userResult.success) {
        // 已登录用户访问登录页，重定向到dashboard
        console.log('[Middleware] Logged user accessing login page, redirect to dashboard');
        return Response.redirect(new URL('/dashboard.html', request.url).href, 302);
    }
    
    if (url.pathname === '/dashboard.html' && !userResult.success) {
        // 未登录用户访问dashboard，重定向到登录页
        console.log('[Middleware] Unauthenticated user accessing dashboard, redirect to login');
        return Response.redirect(new URL('/login.html', request.url).href, 302);
    }
    
    // API路径的认证检查
    if (url.pathname.startsWith('/api/') && !userResult.success) {
        return new Response(JSON.stringify({
            success: false,
            error: 'NOT_AUTHENTICATED',
            message: '请先登录'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 其他需要认证的路径
    if (!userResult.success) {
        console.log(`[Middleware] Unauthenticated access to: ${url.pathname}, redirect to login`);
        return Response.redirect(new URL('/login.html', request.url).href, 302);
    }
    
    // 认证通过，继续处理请求
    console.log(`[Middleware] Authenticated access to: ${url.pathname}`);
    return next();
}
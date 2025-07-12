import { getCurrentUser } from './utils/auth.js';

export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    console.log(`[Middleware] ${request.method} ${pathname}`);
    
    // 静态资源和公开API - 直接放行
    if (pathname.startsWith('/css/') || 
        pathname.startsWith('/js/') || 
        pathname.startsWith('/img/') ||
        pathname.includes('.png') ||
        pathname.includes('.ico') ||
        pathname.includes('.css') ||
        pathname.includes('.js') ||
        pathname === '/test.html' ||
        pathname === '/debug.html' ||
        pathname === '/api/auth/login' ||
        pathname === '/api/auth/register') {
        return next();
    }
    
    // 检查KV数据库
    if (!context.env?.img_url) {
        console.error('[Middleware] KV not configured');
        if (pathname !== '/test.html') {
            return new Response(`
                <html><body>
                <h1>配置错误</h1>
                <p>KV数据库未配置，请在Cloudflare Pages中绑定img_url变量</p>
                <a href="/test.html">系统测试</a>
                </body></html>
            `, { 
                status: 500, 
                headers: { 'Content-Type': 'text/html; charset=utf-8' } 
            });
        }
        return next();
    }
    
    // 获取认证状态
    let isAuthenticated = false;
    try {
        const userResult = await getCurrentUser(context.env, request);
        isAuthenticated = userResult.success;
        console.log(`[Middleware] Auth status: ${isAuthenticated}`);
    } catch (error) {
        console.error('[Middleware] Auth error:', error);
        isAuthenticated = false;
    }
    
    // 处理特定路径
    switch (pathname) {
        case '/':
            // 根路径 - 重定向到合适的页面
            const target = isAuthenticated ? '/dashboard.html' : '/login.html';
            console.log(`[Middleware] Root -> ${target}`);
            return Response.redirect(new URL(target, request.url).href, 302);
            
        case '/login.html':
            if (isAuthenticated) {
                console.log('[Middleware] Authenticated user on login page -> dashboard');
                return Response.redirect(new URL('/dashboard.html', request.url).href, 302);
            }
            return next();
            
        case '/dashboard.html':
            if (!isAuthenticated) {
                console.log('[Middleware] Unauthenticated user on dashboard -> login');
                return Response.redirect(new URL('/login.html', request.url).href, 302);
            }
            return next();
            
        default:
            // API路径和其他路径
            if (pathname.startsWith('/api/')) {
                if (!isAuthenticated) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'NOT_AUTHENTICATED',
                        message: '请先登录'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } else if (!isAuthenticated) {
                // 其他需要认证的页面
                console.log(`[Middleware] Protected page ${pathname} -> login`);
                return Response.redirect(new URL('/login.html', request.url).href, 302);
            }
            return next();
    }
}
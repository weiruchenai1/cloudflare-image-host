// 禁用旧的基本认证中间件，使用统一的会话认证
// 由根级中间件 functions/_middleware.js 处理认证

async function errorHandling(context) {
    try {
      return await context.next();
    } catch (err) {
      return new Response(`${err.message}\n${err.stack}`, { status: 500 });
    }
}

export const onRequest = [errorHandling];
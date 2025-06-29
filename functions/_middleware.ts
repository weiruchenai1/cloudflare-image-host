// functions/_middleware.ts
import { verifyJWT } from './utils/auth';
import { errorResponse, unauthorizedResponse } from './utils/response';
import { getEnvConfig } from './utils/env';
import { logger } from './utils/logger';
import { Env } from './types';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const requestId = crypto.randomUUID().substring(0, 8);
  
  // 添加请求ID到上下文
  (request as any).requestId = requestId;
  
  logger.info('Incoming request', {
    requestId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('User-Agent')
  });
  
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    logger.debug('Handling CORS preflight', { requestId });
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
    });
  }

  try {
    // 公开路径不需要认证
    const publicPaths = [
      '/api/system/status',
      '/api/system/health',
      '/api/setup',
      '/api/auth/login',
      '/api/auth/register',
      '/s/' // 分享链接公开访问
    ];
    
    const isPublicPath = publicPaths.some(path => url.pathname.startsWith(path));
    
    if (!isPublicPath) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Missing authorization header', { requestId, path: url.pathname });
        return unauthorizedResponse('Missing or invalid authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const config = getEnvConfig(env);
      const payload = await verifyJWT(token, config.jwtSecret);
      
      if (!payload) {
        logger.warn('Invalid or expired token', { requestId, path: url.pathname });
        return unauthorizedResponse('Invalid or expired token');
      }

      // 将用户信息添加到请求上下文
      (request as any).user = payload;
      logger.debug('User authenticated', { 
        requestId, 
        userId: payload.userId, 
        username: payload.username 
      });
    }

    const startTime = Date.now();
    const response = await next();
    const duration = Date.now() - startTime;
    
    // 添加 CORS 头到所有响应
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('X-Request-ID', requestId);
    
    logger.info('Request completed', {
      requestId,
      status: response.status,
      duration: `${duration}ms`
    });
    
    return response;
  } catch (error) {
    logger.error('Middleware error', { requestId }, error as Error);
    return errorResponse('Internal server error', 500);
  }
};
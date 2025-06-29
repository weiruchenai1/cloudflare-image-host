// functions/api/auth/validate.ts
import { successResponse, errorResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { logger } from '../../utils/logger';
import { Env, User } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    
    // 从中间件获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      logger.warn('No user context found', { requestId });
      return errorResponse('No user context found', 401);
    }

    logger.debug('Validating token', { requestId, userId: userPayload.userId });

    // 从数据库获取最新用户信息
    const userData = await env.IMAGE_HOST_KV.get(`user:${userPayload.userId}`);
    if (!userData) {
      logger.warn('User not found in database', { requestId, userId: userPayload.userId });
      return errorResponse('User not found', 404);
    }

    const user: User = JSON.parse(userData);
    
    // 检查账户状态
    if (!user.isActive) {
      logger.warn('Account disabled during validation', { requestId, userId: user.id });
      return errorResponse('Account is disabled', 403);
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    logger.debug('Token validation successful', { requestId, userId: user.id });

    return successResponse({
      user: userWithoutPassword
    });

  } catch (error) {
    logger.error('Token validation error', { requestId }, error as Error);
    return errorResponse('Token validation failed', 500);
  }
};
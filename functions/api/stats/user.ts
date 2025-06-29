// functions/api/stats/user.ts
import { successResponse, errorResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { logger } from '../../utils/logger';
import { Env, User } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    logger.debug('Getting user stats', { requestId, userId: userPayload.userId });

    const userData = await env.IMAGE_HOST_KV.get(`user:${userPayload.userId}`);
    if (!userData) {
      logger.warn('User not found for stats', { requestId, userId: userPayload.userId });
      return errorResponse('User not found', 404);
    }

    const user: User = JSON.parse(userData);

    // 统计用户文件数量
    let fileCount = 0;
    const fileKeys = await env.IMAGE_HOST_KV.list({ prefix: `file:${user.id}:` });
    fileCount = fileKeys.keys.length;

    // 统计用户分享数量
    let shareCount = 0;
    const shareKeys = await env.IMAGE_HOST_KV.list({ prefix: `user_share:${user.id}:` });
    shareCount = shareKeys.keys.length;

    const stats = {
      storage: {
        used: user.storageUsed || 0,
        quota: user.storageQuota || 0,
        percentage: user.storageQuota > 0 ? ((user.storageUsed || 0) / user.storageQuota * 100) : 0
      },
      files: {
        count: fileCount
      },
      shares: {
        count: shareCount
      },
      account: {
        createdAt: user.createdAt,
        role: user.role,
        isActive: user.isActive
      }
    };

    logger.debug('User stats calculated', { 
      requestId, 
      userId: userPayload.userId,
      fileCount,
      shareCount,
      storageUsed: user.storageUsed
    });

    return successResponse(stats);

  } catch (error) {
    logger.error('User stats error', { requestId }, error as Error);
    return errorResponse('Failed to get user stats', 500);
  }
};

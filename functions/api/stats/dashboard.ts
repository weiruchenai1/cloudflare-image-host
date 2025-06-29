// functions/api/stats/dashboard.ts
import { successResponse, errorResponse, forbiddenResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { logger } from '../../utils/logger';
import { Env, User, FileMetadata, ShareLink } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    
    // 获取用户信息并验证管理员权限
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    if (userPayload.role !== 'admin') {
      logger.warn('Non-admin user attempted to access dashboard stats', { 
        requestId, 
        userId: userPayload.userId, 
        role: userPayload.role 
      });
      return forbiddenResponse('Admin access required');
    }

    logger.debug('Getting dashboard stats', { requestId, adminId: userPayload.userId });

    // 统计用户数据
    let totalUsers = 0;
    let activeUsers = 0;
    let totalStorageUsed = 0;
    const userKeys = await env.IMAGE_HOST_KV.list({ prefix: 'user:' });
    
    for (const key of userKeys.keys) {
      if (key.name.includes('username:') || key.name.includes('email:')) continue;
      
      const userData = await env.IMAGE_HOST_KV.get(key.name);
      if (userData) {
        const user: User = JSON.parse(userData);
        totalUsers++;
        if (user.isActive) activeUsers++;
        totalStorageUsed += user.storageUsed || 0;
      }
    }

    // 统计文件数据
    let totalFiles = 0;
    const fileKeys = await env.IMAGE_HOST_KV.list({ prefix: 'file:' });
    totalFiles = fileKeys.keys.length;

    // 统计分享数据
    let totalShares = 0;
    let totalViews = 0;
    const shareKeys = await env.IMAGE_HOST_KV.list({ prefix: 'share:' });
    
    for (const key of shareKeys.keys) {
      const shareData = await env.IMAGE_HOST_KV.get(key.name);
      if (shareData) {
        const share: ShareLink = JSON.parse(shareData);
        totalShares++;
        totalViews += share.currentViews || 0;
      }
    }

    // 计算今日统计（简化版本，实际应该根据时间戳计算）
    const todayViews = Math.floor(totalViews * 0.1); // 模拟今日访问量

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        growth: '+8%' // 模拟增长率
      },
      files: {
        total: totalFiles,
        growth: '+12%'
      },
      shares: {
        total: totalShares,
        growth: '+23%'
      },
      storage: {
        used: totalStorageUsed,
        growth: '+15%'
      },
      views: {
        today: todayViews,
        total: totalViews,
        growth: '+18%'
      }
    };

    logger.info('Dashboard stats calculated', { 
      requestId, 
      adminId: userPayload.userId, 
      stats: {
        users: totalUsers,
        files: totalFiles,
        shares: totalShares,
        storage: Math.round(totalStorageUsed / 1024 / 1024) + 'MB'
      }
    });

    return successResponse(stats);

  } catch (error) {
    logger.error('Dashboard stats error', { requestId }, error as Error);
    return errorResponse('Failed to get dashboard stats', 500);
  }
};
// functions/api/admin/invites.ts
import { successResponse, errorResponse, forbiddenResponse, validationErrorResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { generateRandomToken } from '../../utils/crypto';
import { logger } from '../../utils/logger';
import { Env, InviteCode } from '../../types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    
    // 获取用户信息并验证管理员权限
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    if (userPayload.role !== 'admin') {
      logger.warn('Non-admin user attempted to generate invite', { 
        requestId, 
        userId: userPayload.userId, 
        role: userPayload.role 
      });
      return forbiddenResponse('Admin access required');
    }

    const { expiresAt, maxUses = 1 } = await request.json() as { 
      expiresAt?: string; 
      maxUses?: number; 
    };

    logger.info('Admin generating invite code', { 
      requestId, 
      adminId: userPayload.userId, 
      expiresAt, 
      maxUses 
    });

    // 验证输入
    if (maxUses < 1 || maxUses > 1000) {
      return validationErrorResponse('Max uses must be between 1 and 1000');
    }

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        return validationErrorResponse('Expiry date must be a valid future date');
      }
    }

    // 生成邀请码
    const inviteCode = generateRandomToken(16).toUpperCase();
    
    const inviteData: InviteCode = {
      id: crypto.randomUUID(),
      code: inviteCode,
      createdBy: userPayload.userId,
      expiresAt,
      maxUses,
      currentUses: 0,
      usedBy: [],
      createdAt: new Date().toISOString()
    };

    await env.IMAGE_HOST_KV.put(`invite:${inviteCode}`, JSON.stringify(inviteData));

    logger.info('Invite code generated successfully', { 
      requestId, 
      adminId: userPayload.userId, 
      inviteCode, 
      inviteId: inviteData.id 
    });

    return successResponse({
      invite: inviteData
    }, 'Invite code generated successfully');

  } catch (error) {
    logger.error('Generate invite error', { requestId }, error as Error);
    return errorResponse('Failed to generate invite code', 500);
  }
};

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
      logger.warn('Non-admin user attempted to get invites', { 
        requestId, 
        userId: userPayload.userId, 
        role: userPayload.role 
      });
      return forbiddenResponse('Admin access required');
    }

    logger.debug('Admin getting invites list', { requestId, adminId: userPayload.userId });

    // 获取所有邀请码
    const invites: InviteCode[] = [];
    const inviteKeys = await env.IMAGE_HOST_KV.list({ prefix: 'invite:' });
    
    for (const key of inviteKeys.keys) {
      const inviteData = await env.IMAGE_HOST_KV.get(key.name);
      if (inviteData) {
        const invite: InviteCode = JSON.parse(inviteData);
        invites.push(invite);
      }
    }

    // 按创建时间倒序排序
    invites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    logger.debug('Invites list retrieved', { 
      requestId, 
      adminId: userPayload.userId, 
      inviteCount: invites.length 
    });

    return successResponse({
      invites
    });

  } catch (error) {
    logger.error('Get invites error', { requestId }, error as Error);
    return errorResponse('Failed to get invites list', 500);
  }
};
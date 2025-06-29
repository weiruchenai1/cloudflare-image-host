// functions/api/shares/index.ts
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, forbiddenResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { validateShareOptions } from '../../utils/validation';
import { generateRandomToken } from '../../utils/crypto';
import { logger } from '../../utils/logger';
import { Env, ShareLink, FileMetadata } from '../../types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    const { fileId, password, expiresAt, maxViews } = await request.json() as {
      fileId: string;
      password?: string;
      expiresAt?: string;
      maxViews?: number;
    };

    logger.info('Creating share', { requestId, userId: userPayload.userId, fileId });

    // 验证输入
    if (!fileId) {
      return validationErrorResponse('File ID is required');
    }

    const shareOptions = { password, expiresAt, maxViews };
    const validationErrors = validateShareOptions(shareOptions);
    if (validationErrors.length > 0) {
      logger.warn('Invalid share options', { requestId, userId: userPayload.userId, errors: validationErrors });
      return validationErrorResponse(validationErrors.join(', '));
    }

    // 验证文件是否存在且属于用户
    const fileData = await env.IMAGE_HOST_KV.get(`file:${userPayload.userId}:${fileId}`);
    if (!fileData) {
      logger.warn('File not found for sharing', { requestId, userId: userPayload.userId, fileId });
      return notFoundResponse('File not found');
    }

    const file: FileMetadata = JSON.parse(fileData);
    if (file.userId !== userPayload.userId) {
      logger.warn('Unauthorized share attempt', { 
        requestId, 
        userId: userPayload.userId, 
        fileId, 
        fileOwner: file.userId 
      });
      return forbiddenResponse('You do not have permission to share this file');
    }

    // 创建分享链接
    const shareId = crypto.randomUUID();
    const shareToken = generateRandomToken(12).toUpperCase();
    
    const shareData: ShareLink = {
      id: shareId,
      fileId,
      token: shareToken,
      password,
      expiresAt,
      maxViews,
      currentViews: 0,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await env.IMAGE_HOST_KV.put(`share:${shareToken}`, JSON.stringify(shareData));
    await env.IMAGE_HOST_KV.put(`user_share:${userPayload.userId}:${shareId}`, JSON.stringify(shareData));

    const shareUrl = `${new URL(request.url).origin}/s/${shareToken}`;

    logger.info('Share created successfully', { 
      requestId, 
      userId: userPayload.userId, 
      shareId, 
      shareToken,
      fileId 
    });

    return successResponse({
      share: {
        ...shareData,
        url: shareUrl
      }
    }, 'Share link created successfully');

  } catch (error) {
    logger.error('Create share error', { requestId }, error as Error);
    return errorResponse('Failed to create share link', 500);
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    logger.debug('Getting user shares', { requestId, userId: userPayload.userId });

    // 获取用户的分享链接
    const shares: any[] = [];
    const shareKeys = await env.IMAGE_HOST_KV.list({ prefix: `user_share:${userPayload.userId}:` });
    
    for (const key of shareKeys.keys) {
      const shareData = await env.IMAGE_HOST_KV.get(key.name);
      if (shareData) {
        const share: ShareLink = JSON.parse(shareData);
        
        // 获取文件信息
        const fileData = await env.IMAGE_HOST_KV.get(`file:${share.fileId ? userPayload.userId : share.fileId}:${share.fileId}`);
        let fileName = 'Unknown File';
        let fileType = 'unknown';
        
        if (fileData) {
          const file: FileMetadata = JSON.parse(fileData);
          fileName = file.originalName;
          fileType = file.type;
        }
        
        shares.push({
          ...share,
          fileName,
          fileType,
          url: `${new URL(request.url).origin}/s/${share.token}`
        });
      }
    }

    // 按创建时间倒序排序
    shares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    logger.debug('User shares retrieved', { 
      requestId, 
      userId: userPayload.userId, 
      count: shares.length 
    });

    return successResponse({
      shares
    });

  } catch (error) {
    logger.error('Get shares error', { requestId }, error as Error);
    return errorResponse('Failed to get shares', 500);
  }
};

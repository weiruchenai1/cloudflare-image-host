// functions/api/shares/[id].ts
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { logger } from '../../utils/logger';
import { Env, ShareLink } from '../../types';

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env, params } = context;
    const shareId = params.id as string;
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    logger.info('Deleting share', { requestId, userId: userPayload.userId, shareId });

    // 查找分享记录
    const shareData = await env.IMAGE_HOST_KV.get(`user_share:${userPayload.userId}:${shareId}`);
    if (!shareData) {
      logger.warn('Share not found for deletion', { requestId, userId: userPayload.userId, shareId });
      return notFoundResponse('Share not found');
    }

    const share: ShareLink = JSON.parse(shareData);

    // 删除分享记录
    await env.IMAGE_HOST_KV.delete(`share:${share.token}`);
    await env.IMAGE_HOST_KV.delete(`user_share:${userPayload.userId}:${shareId}`);

    logger.info('Share deleted successfully', { 
      requestId, 
      userId: userPayload.userId, 
      shareId, 
      shareToken: share.token 
    });

    return successResponse({
      message: 'Share deleted successfully'
    });

  } catch (error) {
    logger.error('Delete share error', { requestId }, error as Error);
    return errorResponse('Failed to delete share', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env, params } = context;
    const shareId = params.id as string;
    
    const { isActive, password, expiresAt, maxViews } = await request.json() as {
      isActive?: boolean;
      password?: string;
      expiresAt?: string;
      maxViews?: number;
    };
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    logger.info('Updating share', { requestId, userId: userPayload.userId, shareId });

    // 查找分享记录
    const shareData = await env.IMAGE_HOST_KV.get(`user_share:${userPayload.userId}:${shareId}`);
    if (!shareData) {
      logger.warn('Share not found for update', { requestId, userId: userPayload.userId, shareId });
      return notFoundResponse('Share not found');
    }

    const share: ShareLink = JSON.parse(shareData);

    // 更新分享设置
    if (isActive !== undefined) share.isActive = isActive;
    if (password !== undefined) share.password = password || undefined;
    if (expiresAt !== undefined) share.expiresAt = expiresAt || undefined;
    if (maxViews !== undefined) share.maxViews = maxViews || undefined;

    // 保存更新
    await env.IMAGE_HOST_KV.put(`share:${share.token}`, JSON.stringify(share));
    await env.IMAGE_HOST_KV.put(`user_share:${userPayload.userId}:${shareId}`, JSON.stringify(share));

    logger.info('Share updated successfully', { 
      requestId, 
      userId: userPayload.userId, 
      shareId, 
      shareToken: share.token 
    });

    return successResponse({
      share: {
        ...share,
        url: `${new URL(request.url).origin}/s/${share.token}`
      }
    }, 'Share updated successfully');

  } catch (error) {
    logger.error('Update share error', { requestId }, error as Error);
    return errorResponse('Failed to update share', 500);
  }
};

    logger.debug('Listing files', { 
      requestId, 
      userId: userPayload.userId, 
      page, 
      limit, 
      type, 
      search,
      folderId 
    });

    // 获取用户文件列表
    const files: FileMetadata[] = [];
    const fileKeys = await env.IMAGE_HOST_KV.list({ prefix: `file:${userPayload.userId}:` });
    
    for (const key of fileKeys.keys) {
      const fileData = await env.IMAGE_HOST_KV.get(key.name);
      if (fileData) {
        const file: FileMetadata = JSON.parse(fileData);
        
        // 应用筛选条件
        if (type && !file.type.startsWith(type)) continue;
        if (search && !file.originalName.toLowerCase().includes(search.toLowerCase())) continue;
        if (folderId && file.folderId !== folderId) continue;
        
        files.push(file);
      }
    }

    // 排序：按上传时间倒序
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = files.slice(startIndex, endIndex);

    logger.info('Files listed', { 
      requestId, 
      userId: userPayload.userId, 
      totalFiles: files.length,
      returnedFiles: paginatedFiles.length
    });

    return successResponse({
      files: paginatedFiles,
      pagination: {
        total: files.length,
        page,
        limit,
        totalPages: Math.ceil(files.length / limit),
        hasNext: endIndex < files.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('List files error', { requestId }, error as Error);
    return errorResponse('Failed to get file list', 500);
  }
};
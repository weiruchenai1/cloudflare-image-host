// functions/api/files/list.ts
import { successResponse, errorResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { logger } from '../../utils/logger';
import { Env, FileMetadata } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const folderId = url.searchParams.get('folderId');

    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    logger.info('Updating file', { requestId, userId: userPayload.userId, fileId, action });

    // 获取文件信息
    const fileData = await env.IMAGE_HOST_KV.get(`file:${userPayload.userId}:${fileId}`);
    if (!fileData) {
      logger.warn('File not found for update', { requestId, userId: userPayload.userId, fileId });
      return notFoundResponse('File not found');
    }

    const file: FileMetadata = JSON.parse(fileData);
    
    // 验证文件所有权
    if (file.userId !== userPayload.userId) {
      logger.warn('Unauthorized file update attempt', { 
        requestId, 
        userId: userPayload.userId, 
        fileId, 
        fileOwner: file.userId 
      });
      return forbiddenResponse('You do not have permission to modify this file');
    }

    // 根据操作类型更新文件
    switch (action) {
      case 'rename':
        if (!newName || newName.trim().length === 0) {
          return errorResponse('New name is required', 400);
        }
        file.originalName = newName.trim();
        break;
        
      case 'move':
        // 验证目标文件夹
        if (folderId && folderId !== 'root') {
          const folderData = await env.IMAGE_HOST_KV.get(`folder:${folderId}`);
          if (!folderData) {
            return errorResponse('Target folder not found', 404);
          }
          const folder = JSON.parse(folderData);
          if (folder.userId !== userPayload.userId) {
            return forbiddenResponse('You do not have permission to access this folder');
          }
        }
        file.folderId = folderId === 'root' ? null : folderId;
        break;
        
      case 'toggle_public':
        file.isPublic = !file.isPublic;
        break;
        
      case 'update_tags':
        if (Array.isArray(tags)) {
          file.tags = tags.filter(tag => tag && tag.trim().length > 0);
        }
        break;
        
      case 'set_public':
        file.isPublic = Boolean(isPublic);
        break;
        
      default:
        return errorResponse('Invalid action', 400);
    }

    file.uploadedAt = file.uploadedAt; // 保持原上传时间
    const updatedAt = new Date().toISOString();

    // 保存更新
    await env.IMAGE_HOST_KV.put(`file:${userPayload.userId}:${fileId}`, JSON.stringify(file));

    logger.info('File updated successfully', { 
      requestId, 
      userId: userPayload.userId, 
      fileId, 
      action,
      filename: file.originalName 
    });

    return successResponse({
      file,
      message: 'File updated successfully'
    });

  } catch (error) {
    logger.error('Update file error', { requestId }, error as Error);
    return errorResponse('Failed to update file', 500);
  }
};
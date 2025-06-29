// functions/api/files/[id].ts - 修复版本
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '../../utils/response';
import { deleteFromR2, calculateUserStorageUsed } from '../../utils/storage';
import { extractUserFromRequest } from '../../utils/auth';
import { validateFolderName } from '../../utils/validation';
import { logger } from '../../utils/logger';
import { Env, FileMetadata, User } from '../../types';

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId || 'file-delete';
  
  try {
    const { request, env, params } = context;
    const fileId = params.id as string;
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    logger.info('Deleting file', { requestId, userId: userPayload.userId, fileId });

    // 获取文件信息
    const fileData = await env.IMAGE_HOST_KV.get(`file:${userPayload.userId}:${fileId}`);
    if (!fileData) {
      logger.warn('File not found for deletion', { requestId, userId: userPayload.userId, fileId });
      return notFoundResponse('File not found');
    }

    const file: FileMetadata = JSON.parse(fileData);
    
    // 验证文件所有权
    if (file.userId !== userPayload.userId) {
      logger.warn('Unauthorized file deletion attempt', { 
        requestId, 
        userId: userPayload.userId, 
        fileId, 
        fileOwner: file.userId 
      });
      return forbiddenResponse('You do not have permission to delete this file');
    }

    // 删除 R2 中的文件
    try {
      await deleteFromR2(env, file.filename);
      logger.debug('File deleted from R2', { requestId, userId: userPayload.userId, filename: file.filename });
    } catch (r2Error) {
      logger.error('Failed to delete file from R2', { requestId, filename: file.filename }, r2Error as Error);
      // 继续执行，删除元数据
    }

    // 删除 KV 中的文件记录
    await env.IMAGE_HOST_KV.delete(`file:${userPayload.userId}:${fileId}`);

    // 删除相关的分享记录
    const shareKeys = await env.IMAGE_HOST_KV.list({ prefix: `user_share:${userPayload.userId}:` });
    for (const key of shareKeys.keys) {
      try {
        const shareData = await env.IMAGE_HOST_KV.get(key.name);
        if (shareData) {
          const share = JSON.parse(shareData);
          if (share.fileId === fileId) {
            await env.IMAGE_HOST_KV.delete(`share:${share.token}`);
            await env.IMAGE_HOST_KV.delete(key.name);
            logger.debug('Related share deleted', { requestId, shareId: share.id });
          }
        }
      } catch (shareError) {
        logger.warn('Failed to delete related share', { requestId, key: key.name }, shareError as Error);
      }
    }

    // 更新用户存储使用量
    try {
      const userData = await env.IMAGE_HOST_KV.get(`user:${userPayload.userId}`);
      if (userData) {
        const user: User = JSON.parse(userData);
        user.storageUsed = Math.max(0, user.storageUsed - file.size);
        await env.IMAGE_HOST_KV.put(`user:${userPayload.userId}`, JSON.stringify(user));
        await env.IMAGE_HOST_KV.put(`user:username:${user.username}`, JSON.stringify(user));
        logger.debug('User storage updated', { 
          requestId, 
          userId: user.id, 
          newStorageUsed: user.storageUsed 
        });
      }
    } catch (userUpdateError) {
      logger.error('Failed to update user storage', { requestId, userId: userPayload.userId }, userUpdateError as Error);
    }

    logger.info('File deleted successfully', { 
      requestId, 
      userId: userPayload.userId, 
      fileId, 
      filename: file.originalName 
    });

    return successResponse({
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error('Delete file error', { requestId }, error as Error);
    return errorResponse('Failed to delete file', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId || 'file-update';
  
  try {
    const { request, env, params } = context;
    const fileId = params.id as string;
    
    const requestData = await request.json() as { 
      action: string; 
      newName?: string;
      folderId?: string;
      tags?: string[];
      isPublic?: boolean;
    };
    
    const { action, newName, folderId, tags, isPublic } = requestData;
    
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
          try {
            const folderData = await env.IMAGE_HOST_KV.get(`folder:${folderId}`);
            if (!folderData) {
              return errorResponse('Target folder not found', 404);
            }
            const folder = JSON.parse(folderData);
            if (folder.userId !== userPayload.userId) {
              return forbiddenResponse('You do not have permission to access this folder');
            }
          } catch (folderError) {
            logger.error('Failed to validate folder', { requestId, folderId }, folderError as Error);
            return errorResponse('Failed to validate target folder', 500);
          }
        }
        file.folderId = folderId === 'root' ? undefined : folderId;
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

    // 保存更新
    try {
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
    } catch (kvError) {
      logger.error('Failed to save file update', { requestId, fileId }, kvError as Error);
      return errorResponse('Failed to update file', 500);
    }

  } catch (error) {
    logger.error('Update file error', { requestId }, error as Error);
    return errorResponse('Failed to update file', 500);
  }
};
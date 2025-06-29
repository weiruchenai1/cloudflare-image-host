// functions/api/folders/index.ts
import { successResponse, errorResponse, validationErrorResponse, conflictResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { validateFolderName } from '../../utils/validation';
import { logger } from '../../utils/logger';
import { Env, Folder } from '../../types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    const { name, parentId } = await request.json() as { 
      name: string; 
      parentId?: string; 
    };

    logger.info('Creating folder', { requestId, userId: userPayload.userId, name, parentId });

    // 验证文件夹名称
    if (!name || !validateFolderName(name)) {
      logger.warn('Invalid folder name', { requestId, userId: userPayload.userId, name });
      return validationErrorResponse('Folder name must be 1-100 characters and cannot contain special characters');
    }

    // 检查父文件夹是否存在且属于用户
    if (parentId) {
      const parentData = await env.IMAGE_HOST_KV.get(`folder:${parentId}`);
      if (!parentData) {
        return errorResponse('Parent folder not found', 404);
      }
      const parentFolder: Folder = JSON.parse(parentData);
      if (parentFolder.userId !== userPayload.userId) {
        return errorResponse('You do not have permission to access this folder', 403);
      }
    }

    // 检查同级目录下是否已有同名文件夹
    const existingFolders = await env.IMAGE_HOST_KV.list({ prefix: 'folder:' });
    for (const key of existingFolders.keys) {
      const folderData = await env.IMAGE_HOST_KV.get(key.name);
      if (folderData) {
        const folder: Folder = JSON.parse(folderData);
        if (folder.userId === userPayload.userId && 
            folder.parentId === parentId && 
            folder.name === name) {
          logger.warn('Folder name already exists', { requestId, userId: userPayload.userId, name, parentId });
          return conflictResponse('A folder with this name already exists in the specified location');
        }
      }
    }

    const folderId = crypto.randomUUID();
    const folderData: Folder = {
      id: folderId,
      name,
      parentId: parentId || null,
      userId: userPayload.userId,
      createdAt: new Date().toISOString(),
      isPublic: false
    };

    await env.IMAGE_HOST_KV.put(`folder:${folderId}`, JSON.stringify(folderData));

    logger.info('Folder created successfully', { 
      requestId, 
      userId: userPayload.userId, 
      folderId, 
      name 
    });

    return successResponse({
      folder: folderData
    }, 'Folder created successfully');

  } catch (error) {
    logger.error('Create folder error', { requestId }, error as Error);
    return errorResponse('Failed to create folder', 500);
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const parentId = url.searchParams.get('parentId');
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    logger.debug('Getting folders', { requestId, userId: userPayload.userId, parentId });

    // 获取用户的文件夹
    const folders: Folder[] = [];
    const folderKeys = await env.IMAGE_HOST_KV.list({ prefix: 'folder:' });
    
    for (const key of folderKeys.keys) {
      const folderData = await env.IMAGE_HOST_KV.get(key.name);
      if (folderData) {
        const folder: Folder = JSON.parse(folderData);
        if (folder.userId === userPayload.userId) {
          // 如果指定了 parentId，只返回该父目录下的文件夹
          if (parentId !== null) {
            if (folder.parentId === parentId) {
              folders.push(folder);
            }
          } else {
            folders.push(folder);
          }
        }
      }
    }

    // 按名称排序
    folders.sort((a, b) => a.name.localeCompare(b.name));

    logger.debug('Folders retrieved', { 
      requestId, 
      userId: userPayload.userId, 
      count: folders.length 
    });

    return successResponse({
      folders
    });

  } catch (error) {
    logger.error('Get folders error', { requestId }, error as Error);
    return errorResponse('Failed to get folders', 500);
  }
};
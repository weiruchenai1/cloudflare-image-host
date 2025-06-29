// functions/api/files/list.ts - 修复版本
import { successResponse, errorResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { logger } from '../../utils/logger';
import { Env, FileMetadata } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId || 'files-list';
  
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
      try {
        const fileData = await env.IMAGE_HOST_KV.get(key.name);
        if (fileData) {
          const file: FileMetadata = JSON.parse(fileData);
          
          // 应用筛选条件
          if (type && !file.type.startsWith(type)) continue;
          if (search && !file.originalName.toLowerCase().includes(search.toLowerCase())) continue;
          if (folderId && file.folderId !== folderId) continue;
          
          files.push(file);
        }
      } catch (parseError) {
        logger.warn('Failed to parse file data', { requestId, key: key.name }, parseError as Error);
        continue;
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
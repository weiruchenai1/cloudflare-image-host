// functions/api/upload.ts - 修复版本
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';
import { validateFileType, validateFileSize, sanitizeFilename } from '../utils/validation';
import { uploadToR2, generateFileUrl, generateStorageKey } from '../utils/storage';
import { extractUserFromRequest } from '../utils/auth';
import { getEnvConfig } from '../utils/env';
import { logger } from '../utils/logger';
import { Env, User, FileMetadata } from '../types';

const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf',
  'application/zip', 'application/x-rar-compressed'
];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId || 'upload';
  
  try {
    const { request, env } = context;
    const config = getEnvConfig(env);
    
    // 获取用户信息
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      logger.warn('No user context found for upload', { requestId });
      return errorResponse('No user context found', 401);
    }

    // 获取用户数据
    const userData = await env.IMAGE_HOST_KV.get(`user:${userPayload.userId}`);
    if (!userData) {
      logger.warn('User not found for upload', { requestId, userId: userPayload.userId });
      return errorResponse('User not found', 404);
    }

    const user: User = JSON.parse(userData);

    logger.info('File upload started', { requestId, userId: user.id, username: user.username });

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;
    const tags = formData.get('tags') as string | null;
    
    if (!file) {
      logger.warn('No file provided in upload', { requestId, userId: user.id });
      return validationErrorResponse('No file provided');
    }

    logger.debug('File upload details', {
      requestId,
      userId: user.id,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 验证文件
    if (!validateFileType(file.type, ALLOWED_FILE_TYPES)) {
      logger.warn('Unsupported file type', { requestId, userId: user.id, fileType: file.type });
      return validationErrorResponse('File type not supported');
    }

    if (!validateFileSize(file.size, config.maxFileSize)) {
      logger.warn('File too large', { requestId, userId: user.id, fileSize: file.size, maxSize: config.maxFileSize });
      return validationErrorResponse(`File size exceeds limit of ${Math.round(config.maxFileSize / 1024 / 1024)}MB`);
    }

    // 检查存储配额
    if (user.storageUsed + file.size > user.storageQuota) {
      logger.warn('Storage quota exceeded', { 
        requestId, 
        userId: user.id, 
        storageUsed: user.storageUsed, 
        storageQuota: user.storageQuota,
        fileSize: file.size 
      });
      return errorResponse('Storage quota exceeded', 413);
    }

    // 处理文件名
    const sanitizedFilename = sanitizeFilename(file.name);
    const fileExtension = sanitizedFilename.split('.').pop() || '';
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${crypto.randomUUID().substring(0, 8)}.${fileExtension}`;

    // 获取文件夹信息
    let folderPath = '';
    if (folderId && folderId !== 'default') {
      try {
        const folderData = await env.IMAGE_HOST_KV.get(`folder:${folderId}`);
        if (folderData) {
          const folder = JSON.parse(folderData);
          if (folder.userId === user.id) {
            folderPath = folder.name;
            logger.debug('Upload to folder', { requestId, userId: user.id, folderId, folderPath });
          }
        }
      } catch (folderError) {
        logger.warn('Failed to get folder info', { requestId, folderId }, folderError as Error);
        // 继续上传，但不设置文件夹路径
      }
    }

    // 生成存储路径
    const storageKey = generateStorageKey(user.id, uniqueFilename, folderPath);
    
    // 上传文件到 R2
    try {
      await uploadToR2(env, file, storageKey);
      logger.debug('File uploaded to R2', { requestId, userId: user.id, storageKey });
    } catch (uploadError) {
      logger.error('R2 upload failed', { requestId, userId: user.id, storageKey }, uploadError as Error);
      return errorResponse('File upload failed', 500);
    }

    // 生成文件 URL
    const fileUrl = generateFileUrl(config.r2PublicDomain, storageKey);

    // 创建文件元数据
    const fileId = crypto.randomUUID();
    const fileMetadata: FileMetadata = {
      id: fileId,
      filename: storageKey,
      originalName: file.name,
      type: file.type,
      size: file.size,
      url: fileUrl,
      folderId: folderId || undefined,
      folderPath: folderPath || undefined,
      userId: user.id,
      uploadedAt: new Date().toISOString(),
      isPublic: false,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    };

    // 保存文件元数据
    try {
      await env.IMAGE_HOST_KV.put(`file:${user.id}:${fileId}`, JSON.stringify(fileMetadata));
      
      // 更新用户存储使用量
      user.storageUsed += file.size;
      await env.IMAGE_HOST_KV.put(`user:${user.id}`, JSON.stringify(user));
      await env.IMAGE_HOST_KV.put(`user:username:${user.username}`, JSON.stringify(user));

      logger.info('File upload completed', { 
        requestId, 
        userId: user.id, 
        fileId, 
        filename: file.name,
        fileSize: file.size,
        newStorageUsed: user.storageUsed
      });

      return successResponse({
        file: fileMetadata
      }, 'File uploaded successfully');

    } catch (kvError) {
      logger.error('KV storage error during upload', { requestId, userId: user.id }, kvError as Error);
      // 尝试删除已上传的R2文件
      try {
        await env.IMAGE_HOST_R2.delete(storageKey);
      } catch (deleteError) {
        logger.error('Failed to cleanup R2 file after KV error', { requestId, storageKey }, deleteError as Error);
      }
      return errorResponse('Failed to save file metadata', 500);
    }

  } catch (error) {
    logger.error('Upload error', { requestId }, error as Error);
    return errorResponse('Upload failed', 500);
  }
};
// functions/api/system/setup.ts
import { hashPassword } from '../../utils/crypto';
import { successResponse, errorResponse, validationErrorResponse } from '../../utils/response';
import { validateUsername, validatePassword } from '../../utils/validation';
import { getEnvConfig } from '../../utils/env';
import { logger } from '../../utils/logger';
import { Env, User, SystemSettings } from '../../types';

const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf',
  'application/zip', 'application/x-rar-compressed'
];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    const config = getEnvConfig(env);

    logger.info('System setup initiated', { requestId });

    // 检查是否已经初始化
    const isInitialized = await env.IMAGE_HOST_KV.get('system:initialized');
    if (isInitialized) {
      logger.warn('System already initialized', { requestId });
      return errorResponse('System is already initialized', 400);
    }

    const requestData = await request.json() as {
      adminUsername: string;
      adminPassword: string;
      siteName: string;
      siteTitle: string;
      defaultStorageQuota: number;
    };

    const {
      adminUsername,
      adminPassword,
      siteName,
      siteTitle,
      defaultStorageQuota
    } = requestData;

    logger.info('Setup request details', { 
      requestId, 
      adminUsername, 
      siteName, 
      siteTitle, 
      defaultStorageQuota 
    });

    // 验证输入
    if (!adminUsername || !adminPassword || !siteName || !siteTitle) {
      return validationErrorResponse('All fields are required');
    }

    if (!validateUsername(adminUsername)) {
      return validationErrorResponse('Admin username must be 3-20 characters and contain only letters, numbers, and underscores');
    }

    if (!validatePassword(adminPassword)) {
      return validationErrorResponse('Admin password must be at least 6 characters long');
    }

    if (defaultStorageQuota < 1 || defaultStorageQuota > 1000) {
      return validationErrorResponse('Default storage quota must be between 1 and 1000 GB');
    }

    // 创建管理员账户
    const adminId = crypto.randomUUID();
    const hashedPassword = await hashPassword(adminPassword);
    
    const adminData: User = {
      id: adminId,
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
      storageQuota: 100 * 1024 * 1024 * 1024, // 100GB for admin
      storageUsed: 0,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // 系统设置
    const systemSettings: SystemSettings = {
      siteName,
      siteTitle,
      defaultStorageQuota: defaultStorageQuota * 1024 * 1024 * 1024, // Convert to bytes
      allowRegistration: true,
      backgroundMode: 'bing',
      backgroundOpacity: 0.1,
      backgroundInterval: 30000,
      showFooter: true,
      footerLinks: [],
      defaultLanguage: 'zh',
      maxFileSize: config.maxFileSize,
      allowedFileTypes: ALLOWED_FILE_TYPES,
      initializedAt: new Date().toISOString(),
      adminEmail: config.adminEmail
    };

    // 保存数据
    await env.IMAGE_HOST_KV.put(`user:${adminId}`, JSON.stringify(adminData));
    await env.IMAGE_HOST_KV.put(`user:username:${adminUsername}`, JSON.stringify(adminData));
    await env.IMAGE_HOST_KV.put('system:settings', JSON.stringify(systemSettings));
    await env.IMAGE_HOST_KV.put('system:initialized', 'true');

    // 创建默认文件夹
    const defaultFolders = [
      {
        id: crypto.randomUUID(),
        name: 'images',
        parentId: null,
        userId: adminId,
        createdAt: new Date().toISOString(),
        isPublic: false
      },
      {
        id: crypto.randomUUID(),
        name: 'documents',
        parentId: null,
        userId: adminId,
        createdAt: new Date().toISOString(),
        isPublic: false
      }
    ];

    for (const folder of defaultFolders) {
      await env.IMAGE_HOST_KV.put(`folder:${folder.id}`, JSON.stringify(folder));
    }

    logger.info('System setup completed successfully', { 
      requestId, 
      adminId, 
      adminUsername, 
      siteName 
    });

    return successResponse({
      message: 'System initialized successfully',
      admin: {
        id: adminId,
        username: adminUsername
      },
      settings: {
        siteName,
        siteTitle
      }
    });

  } catch (error) {
    logger.error('Setup error', { requestId }, error as Error);
    return errorResponse('System initialization failed', 500);
  }
};
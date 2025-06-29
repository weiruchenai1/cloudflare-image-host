// functions/api/system/status.ts
import { successResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { Env, SystemSettings } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { env } = context;
    
    logger.debug('Getting system status', { requestId });
    
    // 检查系统是否已初始化
    const isInitialized = await env.IMAGE_HOST_KV.get('system:initialized');
    
    // 获取系统设置
    let settings = null;
    if (isInitialized) {
      const settingsData = await env.IMAGE_HOST_KV.get('system:settings');
      if (settingsData) {
        const fullSettings: SystemSettings = JSON.parse(settingsData);
        // 只返回公开的设置信息
        settings = {
          siteName: fullSettings.siteName,
          siteTitle: fullSettings.siteTitle,
          allowRegistration: fullSettings.allowRegistration,
          defaultLanguage: fullSettings.defaultLanguage,
          maxFileSize: fullSettings.maxFileSize,
          allowedFileTypes: fullSettings.allowedFileTypes
        };
      }
    }

    const status = {
      initialized: !!isInitialized,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      settings
    };

    logger.debug('System status retrieved', { 
      requestId, 
      initialized: !!isInitialized,
      hasSettings: !!settings
    });

    return successResponse(status);

  } catch (error) {
    logger.error('System status error', { requestId }, error as Error);
    return errorResponse('Failed to get system status', 500);
  }
};
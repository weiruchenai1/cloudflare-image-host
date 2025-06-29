// functions/api/system/health.ts
import { successResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { env } = context;
    
    // 基本健康检查
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        kv: 'unknown',
        r2: 'unknown'
      }
    };

    // 检查 KV 可用性
    try {
      await env.IMAGE_HOST_KV.get('health-check');
      healthData.services.kv = 'healthy';
    } catch (error) {
      healthData.services.kv = 'unhealthy';
      logger.warn('KV health check failed', { requestId }, error as Error);
    }

    // 检查 R2 可用性
    try {
      await env.IMAGE_HOST_R2.head('health-check');
      healthData.services.r2 = 'healthy';
    } catch (error) {
      healthData.services.r2 = 'unhealthy';
      logger.warn('R2 health check failed', { requestId }, error as Error);
    }

    logger.debug('Health check completed', { requestId, healthData });

    return successResponse(healthData);

  } catch (error) {
    logger.error('Health check error', { requestId }, error as Error);
    return successResponse({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};
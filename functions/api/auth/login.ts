// functions/api/auth/login.ts
import { verifyPassword } from '../../utils/crypto';
import { generateJWT } from '../../utils/auth';
import { successResponse, errorResponse, validationErrorResponse } from '../../utils/response';
import { validateUsername, validatePassword } from '../../utils/validation';
import { getEnvConfig } from '../../utils/env';
import { logger } from '../../utils/logger';
import { Env, User } from '../../types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    const config = getEnvConfig(env);
    
    const requestData = await request.json() as {
      username: string;
      password: string;
    };
    
    const { username, password } = requestData;

    logger.info('Login attempt', { requestId, username });

    // 输入验证
    if (!username || !password) {
      logger.warn('Missing login credentials', { requestId, username });
      return validationErrorResponse('Username and password are required');
    }

    if (!validateUsername(username)) {
      logger.warn('Invalid username format', { requestId, username });
      return validationErrorResponse('Invalid username format');
    }

    if (!validatePassword(password)) {
      logger.warn('Invalid password format', { requestId, username });
      return validationErrorResponse('Invalid password format');
    }

    // 查找用户
    const userData = await env.IMAGE_HOST_KV.get(`user:username:${username}`);
    if (!userData) {
      logger.warn('User not found', { requestId, username });
      return errorResponse('Invalid credentials', 401);
    }

    const user: User = JSON.parse(userData);

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Invalid password', { requestId, username, userId: user.id });
      return errorResponse('Invalid credentials', 401);
    }

    // 检查账户状态
    if (!user.isActive) {
      logger.warn('Account disabled', { requestId, username, userId: user.id });
      return errorResponse('Account is disabled', 403);
    }

    // 生成 JWT token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = await generateJWT(tokenPayload, config.jwtSecret, config.sessionExpireHours);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    logger.info('Login successful', { requestId, userId: user.id, username });

    return successResponse({
      user: userWithoutPassword,
      token
    }, 'Login successful');

  } catch (error) {
    logger.error('Login error', { requestId }, error as Error);
    return errorResponse('Login failed', 500);
  }
};
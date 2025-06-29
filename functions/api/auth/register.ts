// functions/api/auth/register.ts
import { hashPassword } from '../../utils/crypto';
import { successResponse, errorResponse, validationErrorResponse, conflictResponse } from '../../utils/response';
import { validateUsername, validatePassword, validateEmail, validateInviteCode } from '../../utils/validation';
import { getEnvConfig } from '../../utils/env';
import { logger } from '../../utils/logger';
import { Env, User, InviteCode } from '../../types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    const config = getEnvConfig(env);
    
    const requestData = await request.json() as {
      username: string;
      email?: string;
      password: string;
      inviteCode: string;
    };
    
    const { username, email, password, inviteCode } = requestData;

    logger.info('Registration attempt', { requestId, username, email });

    // 输入验证
    if (!username || !password || !inviteCode) {
      logger.warn('Missing registration fields', { requestId, username });
      return validationErrorResponse('Username, password, and invite code are required');
    }

    if (!validateUsername(username)) {
      logger.warn('Invalid username', { requestId, username });
      return validationErrorResponse('Username must be 3-20 characters and contain only letters, numbers, and underscores');
    }

    if (!validatePassword(password)) {
      logger.warn('Invalid password', { requestId, username });
      return validationErrorResponse('Password must be at least 6 characters long');
    }

    if (email && !validateEmail(email)) {
      logger.warn('Invalid email', { requestId, username, email });
      return validationErrorResponse('Invalid email format');
    }

    if (!validateInviteCode(inviteCode)) {
      logger.warn('Invalid invite code format', { requestId, username, inviteCode });
      return validationErrorResponse('Invalid invite code format');
    }

    // 验证邀请码
    const inviteData = await env.IMAGE_HOST_KV.get(`invite:${inviteCode}`);
    if (!inviteData) {
      logger.warn('Invite code not found', { requestId, username, inviteCode });
      return errorResponse('Invalid invite code', 400);
    }

    const invite: InviteCode = JSON.parse(inviteData);
    
    // 检查邀请码状态
    if (invite.currentUses >= invite.maxUses) {
      logger.warn('Invite code fully used', { requestId, username, inviteCode });
      return errorResponse('Invite code has been fully used', 400);
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      logger.warn('Invite code expired', { requestId, username, inviteCode });
      return errorResponse('Invite code has expired', 400);
    }

    // 检查用户名是否已存在
    const existingUser = await env.IMAGE_HOST_KV.get(`user:username:${username}`);
    if (existingUser) {
      logger.warn('Username already exists', { requestId, username });
      return conflictResponse('Username already exists');
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await env.IMAGE_HOST_KV.get(`user:email:${email}`);
      if (existingEmail) {
        logger.warn('Email already exists', { requestId, username, email });
        return conflictResponse('Email already exists');
      }
    }

    // 创建用户
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);
    
    const userData: User = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      storageQuota: config.defaultStorageQuota,
      storageUsed: 0,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // 保存用户数据
    await env.IMAGE_HOST_KV.put(`user:${userId}`, JSON.stringify(userData));
    await env.IMAGE_HOST_KV.put(`user:username:${username}`, JSON.stringify(userData));
    if (email) {
      await env.IMAGE_HOST_KV.put(`user:email:${email}`, JSON.stringify(userData));
    }

    // 更新邀请码使用次数
    invite.currentUses = (invite.currentUses || 0) + 1;
    invite.usedBy = invite.usedBy || [];
    invite.usedBy.push({
      userId,
      username,
      usedAt: new Date().toISOString()
    });
    
    await env.IMAGE_HOST_KV.put(`invite:${inviteCode}`, JSON.stringify(invite));

    logger.info('Registration successful', { requestId, userId, username });

    return successResponse({
      message: 'Registration successful'
    });

  } catch (error) {
    logger.error('Registration error', { requestId }, error as Error);
    return errorResponse('Registration failed', 500);
  }
};
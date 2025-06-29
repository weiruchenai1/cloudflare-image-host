import { successResponse, errorResponse, forbiddenResponse, validationErrorResponse } from '../../utils/response';
import { extractUserFromRequest } from '../../utils/auth';
import { validateStorageQuota } from '../../utils/validation';
import { logger } from '../../utils/logger';
import { Env, User } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;

    // 获取用户信息并验证管理员权限
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    if (userPayload.role !== 'admin') {
      logger.warn('Non-admin user attempted to access user management', { 
        requestId, 
        userId: userPayload.userId, 
        role: userPayload.role 
      });
      return forbiddenResponse('Admin access required');
    }

    logger.info('Admin getting users list', { requestId, adminId: userPayload.userId });

    // 获取所有用户
    const users: User[] = [];
    const userKeys = await env.IMAGE_HOST_KV.list({ prefix: 'user:' });
    
    for (const key of userKeys.keys) {
      if (key.name.includes('username:') || key.name.includes('email:')) continue;
      
      const userData = await env.IMAGE_HOST_KV.get(key.name);
      if (userData) {
        const user: User = JSON.parse(userData);
        // 不返回密码字段
        const { password: _, ...userWithoutPassword } = user;
        users.push(userWithoutPassword as User);
      }
    }

    // 按创建时间倒序排序
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    logger.info('Users list retrieved', { 
      requestId, 
      adminId: userPayload.userId, 
      userCount: users.length 
    });

    return successResponse({
      users
    });

  } catch (error) {
    logger.error('Get users error', { requestId }, error as Error);
    return errorResponse('Failed to get users list', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const requestId = (context.request as any).requestId;
  
  try {
    const { request, env } = context;
    const { userId: targetUserId, action, value } = await request.json() as {
      userId: string;
      action: string;
      value?: any;
    };

    // 获取用户信息并验证管理员权限
    const userPayload = extractUserFromRequest(request);
    if (!userPayload) {
      return errorResponse('No user context found', 401);
    }

    if (userPayload.role !== 'admin') {
      logger.warn('Non-admin user attempted user management', { 
        requestId, 
        userId: userPayload.userId, 
        role: userPayload.role 
      });
      return forbiddenResponse('Admin access required');
    }

    logger.info('Admin updating user', { 
      requestId, 
      adminId: userPayload.userId, 
      targetUserId, 
      action, 
      value 
    });

    // 获取目标用户
    const targetUserData = await env.IMAGE_HOST_KV.get(`user:${targetUserId}`);
    if (!targetUserData) {
      logger.warn('Target user not found', { requestId, adminId: userPayload.userId, targetUserId });
      return errorResponse('Target user not found', 404);
    }

    const targetUser: User = JSON.parse(targetUserData);

    // 防止管理员禁用自己
    if (action === 'toggle_active' && targetUserId === userPayload.userId) {
      return errorResponse('Cannot disable your own account', 400);
    }

    // 执行操作
    switch (action) {
      case 'toggle_active':
        targetUser.isActive = !targetUser.isActive;
        logger.info('User status toggled', { 
          requestId, 
          adminId: userPayload.userId, 
          targetUserId, 
          newStatus: targetUser.isActive 
        });
        break;
        
      case 'update_quota':
        const newQuota = parseInt(value);
        if (!validateStorageQuota(newQuota)) {
          return validationErrorResponse('Invalid storage quota');
        }
        targetUser.storageQuota = newQuota;
        logger.info('User quota updated', { 
          requestId, 
          adminId: userPayload.userId, 
          targetUserId, 
          newQuota 
        });
        break;
        
      case 'update_role':
        if (!['admin', 'user'].includes(value)) {
          return validationErrorResponse('Invalid role');
        }
        // 防止移除最后一个管理员
        if (targetUser.role === 'admin' && value === 'user') {
          const adminCount = await countAdminUsers(env);
          if (adminCount <= 1) {
            return errorResponse('Cannot remove the last admin user', 400);
          }
        }
        targetUser.role = value;
        logger.info('User role updated', { 
          requestId, 
          adminId: userPayload.userId, 
          targetUserId, 
          newRole: value 
        });
        break;
        
      default:
        return validationErrorResponse('Invalid action');
    }

    // 保存更新
    await env.IMAGE_HOST_KV.put(`user:${targetUserId}`, JSON.stringify(targetUser));
    await env.IMAGE_HOST_KV.put(`user:username:${targetUser.username}`, JSON.stringify(targetUser));
    if (targetUser.email) {
      await env.IMAGE_HOST_KV.put(`user:email:${targetUser.email}`, JSON.stringify(targetUser));
    }

    logger.info('User updated successfully', { 
      requestId, 
      adminId: userPayload.userId, 
      targetUserId, 
      action 
    });

    return successResponse({
      message: 'User updated successfully'
    });

  } catch (error) {
    logger.error('Update user error', { requestId }, error as Error);
    return errorResponse('Failed to update user', 500);
  }
};

async function countAdminUsers(env: Env): Promise<number> {
  let count = 0;
  const userKeys = await env.IMAGE_HOST_KV.list({ prefix: 'user:' });
  
  for (const key of userKeys.keys) {
    if (key.name.includes('username:') || key.name.includes('email:')) continue;
    
    const userData = await env.IMAGE_HOST_KV.get(key.name);
    if (userData) {
      const user: User = JSON.parse(userData);
      if (user.role === 'admin') count++;
    }
  }
  
  return count;
}
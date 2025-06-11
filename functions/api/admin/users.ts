interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // 验证管理员权限
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenData = await env.IMAGE_HOST_KV.get(`token:${token}`);
    if (!tokenData) {
      return new Response('Invalid token', { status: 401 });
    }

    const { userId } = JSON.parse(tokenData);
    const userData = await env.IMAGE_HOST_KV.get(`user:${userId}`);
    if (!userData) {
      return new Response('User not found', { status: 404 });
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    // 获取所有用户
    const users = [];
    const listResult = await env.IMAGE_HOST_KV.list({ prefix: 'user:' });
    
    for (const key of listResult.keys) {
      if (key.name.includes('username:') || key.name.includes('email:')) continue;
      
      const userData = await env.IMAGE_HOST_KV.get(key.name);
      if (userData) {
        const user = JSON.parse(userData);
        delete user.password; // 不返回密码
        users.push(user);
      }
    }

    // 按创建时间排序
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new Response(JSON.stringify({
      success: true,
      users
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return new Response('获取用户列表失败', { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { userId: targetUserId, action, value } = await request.json();

    // 验证管理员权限
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenData = await env.IMAGE_HOST_KV.get(`token:${token}`);
    if (!tokenData) {
      return new Response('Invalid token', { status: 401 });
    }

    const { userId } = JSON.parse(tokenData);
    const userData = await env.IMAGE_HOST_KV.get(`user:${userId}`);
    if (!userData) {
      return new Response('User not found', { status: 404 });
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    // 获取目标用户
    const targetUserData = await env.IMAGE_HOST_KV.get(`user:${targetUserId}`);
    if (!targetUserData) {
      return new Response('Target user not found', { status: 404 });
    }

    const targetUser = JSON.parse(targetUserData);

    // 执行操作
    switch (action) {
      case 'toggle_active':
        targetUser.isActive = !targetUser.isActive;
        break;
      case 'update_quota':
        targetUser.storageQuota = parseInt(value);
        break;
      case 'update_role':
        targetUser.role = value;
        break;
      default:
        return new Response('Invalid action', { status: 400 });
    }

    // 保存更新
    await env.IMAGE_HOST_KV.put(`user:${targetUserId}`, JSON.stringify(targetUser));
    await env.IMAGE_HOST_KV.put(`user:username:${targetUser.username}`, JSON.stringify(targetUser));
    if (targetUser.email) {
      await env.IMAGE_HOST_KV.put(`user:email:${targetUser.email}`, JSON.stringify(targetUser));
    }

    return new Response(JSON.stringify({
      success: true,
      message: '用户更新成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return new Response('更新用户失败', { status: 500 });
  }
};

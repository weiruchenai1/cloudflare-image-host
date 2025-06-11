interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    const { expiresAt, maxUses = 1 } = await request.json() as { expiresAt?: string; maxUses?: number };

    // 生成邀请码
    const inviteCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
    
    const inviteData = {
      id: crypto.randomUUID(),
      code: inviteCode,
      createdBy: userId,
      expiresAt,
      maxUses,
      currentUses: 0,
      isUsed: false,
      createdAt: new Date().toISOString(),
      usedBy: []
    };

    await env.IMAGE_HOST_KV.put(`invite:${inviteCode}`, JSON.stringify(inviteData));

    return new Response(JSON.stringify({
      success: true,
      invite: inviteData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generate invite error:', error);
    return new Response('生成邀请码失败', { status: 500 });
  }
};

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

    // 获取所有邀请码
    const invites = [];
    const listResult = await env.IMAGE_HOST_KV.list({ prefix: 'invite:' });
    
    for (const key of listResult.keys) {
      const inviteData = await env.IMAGE_HOST_KV.get(key.name);
      if (inviteData) {
        invites.push(JSON.parse(inviteData));
      }
    }

    // 按创建时间排序
    invites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new Response(JSON.stringify({
      success: true,
      invites
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get invites error:', error);
    return new Response('获取邀请码列表失败', { status: 500 });
  }
};

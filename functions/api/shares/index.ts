interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // 验证用户身份
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
    const { fileId, password, expiresAt, maxViews } = await request.json() as {
      fileId: string;
      password?: string;
      expiresAt?: string;
      maxViews?: number;
    };

    // 验证文件是否存在且属于用户
    const fileData = await env.IMAGE_HOST_KV.get(`file:${userId}:${fileId}`);
    if (!fileData) {
      return new Response('文件不存在', { status: 404 });
    }

    const file = JSON.parse(fileData);
    if (file.userId !== userId) {
      return new Response('无权限分享此文件', { status: 403 });
    }

    // 创建分享链接
    const shareId = crypto.randomUUID();
    const shareToken = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    
    const shareData = {
      id: shareId,
      token: shareToken,
      fileId,
      userId,
      password,
      expiresAt,
      maxViews,
      currentViews: 0,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await env.IMAGE_HOST_KV.put(`share:${shareToken}`, JSON.stringify(shareData));
    await env.IMAGE_HOST_KV.put(`user_share:${userId}:${shareId}`, JSON.stringify(shareData));

    return new Response(JSON.stringify({
      success: true,
      share: {
        ...shareData,
        url: `${new URL(request.url).origin}/s/${shareToken}`
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create share error:', error);
    return new Response('创建分享失败', { status: 500 });
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // 验证用户身份
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

    // 获取用户的分享链接
    const shares = [];
    const listResult = await env.IMAGE_HOST_KV.list({ prefix: `user_share:${userId}:` });
    
    for (const key of listResult.keys) {
      const shareData = await env.IMAGE_HOST_KV.get(key.name);
      if (shareData) {
        const share = JSON.parse(shareData);
        
        // 获取文件信息
        const fileData = await env.IMAGE_HOST_KV.get(`file:${share.userId}:${share.fileId}`);
        if (fileData) {
          const file = JSON.parse(fileData);
          share.fileName = file.originalName;
          share.fileType = file.type;
        }
        
        shares.push({
          ...share,
          url: `${new URL(request.url).origin}/s/${share.token}`
        });
      }
    }

    // 按创建时间排序
    shares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new Response(JSON.stringify({
      success: true,
      shares
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get shares error:', error);
    return new Response('获取分享列表失败', { status: 500 });
  }
};

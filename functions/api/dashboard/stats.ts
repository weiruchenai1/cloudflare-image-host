interface Env {
  IMAGE_HOST_KV: KVNamespace;
  IMAGE_HOST_R2: R2Bucket;
}

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
    const userData = await env.IMAGE_HOST_KV.get(`user:${userId}`);
    if (!userData) {
      return new Response('User not found', { status: 404 });
    }

    const user = JSON.parse(userData);

    // 获取文件列表
    const files = [];
    const listResult = await env.IMAGE_HOST_KV.list({ prefix: `file:${userId}:` });
    for (const key of listResult.keys) {
      const fileData = await env.IMAGE_HOST_KV.get(key.name);
      if (fileData) {
        files.push(JSON.parse(fileData));
      }
    }

    // 获取分享列表
    const shares = [];
    const shareListResult = await env.IMAGE_HOST_KV.list({ prefix: `user_share:${userId}:` });
    for (const key of shareListResult.keys) {
      const shareData = await env.IMAGE_HOST_KV.get(key.name);
      if (shareData) {
        shares.push(JSON.parse(shareData));
      }
    }

    // 计算今日访问量
    const today = new Date().toISOString().split('T')[0];
    const todayViews = shares.reduce((total, share) => {
      const views = share.views || {};
      return total + (views[today] || 0);
    }, 0);

    return new Response(JSON.stringify({
      success: true,
      totalStorage: user.storageUsed,
      fileCount: files.length,
      shareCount: shares.length,
      todayViews
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return new Response('获取统计数据失败', { status: 500 });
  }
}; 
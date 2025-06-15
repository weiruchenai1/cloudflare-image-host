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

    // 按文件类型统计存储使用情况
    const storageByType = files.reduce((acc, file) => {
      const type = file.type.split('/')[0] || 'other';
      acc[type] = (acc[type] || 0) + file.size;
      return acc;
    }, {} as Record<string, number>);

    // 计算总存储使用量
    const totalStorage = Object.keys(storageByType).reduce((sum, key) => sum + storageByType[key], 0);

    return new Response(JSON.stringify({
      success: true,
      totalStorage,
      storageByType,
      storageLimit: user.storageLimit || 1024 * 1024 * 1024 // 默认1GB
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get storage usage error:', error);
    return new Response('获取存储使用情况失败', { status: 500 });
  }
}; 
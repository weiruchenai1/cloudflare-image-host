interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');

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

    // 获取用户文件列表
    const files = [];
    const listResult = await env.IMAGE_HOST_KV.list({ prefix: `file:${userId}:` });
    
    for (const key of listResult.keys) {
      const fileData = await env.IMAGE_HOST_KV.get(key.name);
      if (fileData) {
        const file = JSON.parse(fileData);
        
        // 应用筛选条件
        if (type && file.type !== type) continue;
        if (search && !file.originalName.toLowerCase().includes(search.toLowerCase())) continue;
        
        files.push(file);
      }
    }

    // 排序和分页
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = files.slice(startIndex, endIndex);

    return new Response(JSON.stringify({
      success: true,
      files: paginatedFiles,
      total: files.length,
      page,
      limit,
      totalPages: Math.ceil(files.length / limit)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('List files error:', error);
    return new Response('获取文件列表失败', { status: 500 });
  }
};

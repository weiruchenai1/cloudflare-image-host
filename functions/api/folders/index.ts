// functions/api/folders/index.ts
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
    const { name, parentId } = await request.json() as { name: string; parentId?: string };

    const folderId = crypto.randomUUID();
    const folderData = {
      id: folderId,
      name,
      parentId: parentId || null,
      userId,
      createdAt: new Date().toISOString(),
      isPublic: false
    };

    await env.IMAGE_HOST_KV.put(`folder:${folderId}`, JSON.stringify(folderData));

    return new Response(JSON.stringify({
      success: true,
      folder: folderData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create folder error:', error);
    return new Response('Failed to create folder', { status: 500 });
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const getDefault = url.searchParams.get('default') === 'true';
    
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

    // 获取用户的文件夹
    const folders = [];
    const listResult = await env.IMAGE_HOST_KV.list({ prefix: 'folder:' });
    
    for (const key of listResult.keys) {
      const folderData = await env.IMAGE_HOST_KV.get(key.name);
      if (folderData) {
        const folder = JSON.parse(folderData);
        // 如果请求默认文件夹，则返回所有用户的默认文件夹
        if (getDefault && folder.isDefault) {
          folders.push(folder);
        } 
        // 否则只返回当前用户的文件夹
        else if (folder.userId === userId) {
          folders.push(folder);
        }
      }
    }

    // 不再自动创建默认文件夹，允许文件存储在根目录

    return new Response(JSON.stringify({
      success: true,
      folders
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get folders error:', error);
    return new Response('Failed to get folders', { status: 500 });
  }
};

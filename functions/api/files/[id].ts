interface Env {
  IMAGE_HOST_KV: KVNamespace;
  IMAGE_HOST_R2: R2Bucket;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { request, env, params } = context;
    const fileId = params.id as string;
    
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

    // 获取文件信息
    const fileData = await env.IMAGE_HOST_KV.get(`file:${userId}:${fileId}`);
    if (!fileData) {
      return new Response('文件不存在', { status: 404 });
    }

    const file = JSON.parse(fileData);
    
    // 验证文件所有权
    if (file.userId !== userId) {
      return new Response('无权限删除此文件', { status: 403 });
    }

    // 删除 R2 中的文件
    await env.IMAGE_HOST_R2.delete(file.filename);
    
    // 删除缩略图（如果存在）
    if (file.thumbnailUrl) {
      const thumbnailKey = file.filename.replace(/\.[^/.]+$/, '_thumb.jpg');
      await env.IMAGE_HOST_R2.delete(thumbnailKey);
    }

    // 删除 KV 中的文件记录
    await env.IMAGE_HOST_KV.delete(`file:${userId}:${fileId}`);

    // 删除相关的分享记录
    const shareListResult = await env.IMAGE_HOST_KV.list({ prefix: `user_share:${userId}:` });
    for (const key of shareListResult.keys) {
      const shareData = await env.IMAGE_HOST_KV.get(key.name);
      if (shareData) {
        const share = JSON.parse(shareData);
        if (share.fileId === fileId) {
          await env.IMAGE_HOST_KV.delete(`share:${share.token}`);
          await env.IMAGE_HOST_KV.delete(key.name);
        }
      }
    }

    // 更新用户存储使用量
    const userData = await env.IMAGE_HOST_KV.get(`user:${userId}`);
    if (userData) {
      const user = JSON.parse(userData);
      user.storageUsed = Math.max(0, user.storageUsed - file.size);
      await env.IMAGE_HOST_KV.put(`user:${userId}`, JSON.stringify(user));
      await env.IMAGE_HOST_KV.put(`user:username:${user.username}`, JSON.stringify(user));
    }

    return new Response(JSON.stringify({
      success: true,
      message: '文件已删除'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return new Response('删除文件失败', { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { request, env, params } = context;
    const fileId = params.id as string;
    const requestData = await request.json() as { action: string; [key: string]: any };
    const { action, ...updateData } = requestData;
    
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

    // 获取文件信息
    const fileData = await env.IMAGE_HOST_KV.get(`file:${userId}:${fileId}`);
    if (!fileData) {
      return new Response('文件不存在', { status: 404 });
    }

    const file = JSON.parse(fileData);
    
    // 验证文件所有权
    if (file.userId !== userId) {
      return new Response('无权限修改此文件', { status: 403 });
    }

    // 根据操作类型更新文件
    switch (action) {
      case 'rename':
        file.originalName = updateData.newName;
        break;
      case 'move':
        file.folderId = updateData.folderId;
        break;
      case 'toggle_public':
        file.isPublic = !file.isPublic;
        break;
      case 'update_tags':
        file.tags = updateData.tags;
        break;
      default:
        return new Response('无效操作', { status: 400 });
    }

    file.updatedAt = new Date().toISOString();

    // 保存更新
    await env.IMAGE_HOST_KV.put(`file:${userId}:${fileId}`, JSON.stringify(file));

    return new Response(JSON.stringify({
      success: true,
      file
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update file error:', error);
    return new Response('更新文件失败', { status: 500 });
  }
};

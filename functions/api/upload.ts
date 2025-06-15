interface Env {
  IMAGE_HOST_KV: KVNamespace;
  IMAGE_HOST_R2: R2Bucket;
  R2_DOMAIN: string;
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
    const userData = await env.IMAGE_HOST_KV.get(`user:${userId}`);
    if (!userData) {
      return new Response('User not found', { status: 404 });
    }

    const user = JSON.parse(userData);
    
    // 解析文件数据
    const formData = await request.formData();
    const fileData = formData.get('file');
    const folderId = formData.get('folderId') as string;
    
    if (!fileData || typeof fileData !== 'object') {
      return new Response('No file provided or invalid file', { status: 400 });
    }

    const file = fileData as unknown as File;

    // 检查存储配额
    if (user.storageUsed + file.size > user.storageQuota) {
      return new Response('存储空间不足', { status: 413 });
    }

    // 检查文件大小和类型
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return new Response('文件过大', { status: 413 });
    }

    // 验证文件类型
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/zip', 'application/x-rar-compressed'
    ] as const;
    
    if (!allowedTypes.some(type => type === file.type)) {
      return new Response('不支持的文件类型', { status: 400 });
    }

    // 生成文件ID和存储路径
    const fileId = crypto.randomUUID();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = `${userId}/${fileId}.${extension}`;
    
    // 获取文件内容
    const fileBuffer = await file.arrayBuffer();
    
    // 上传原文件到R2
    await env.IMAGE_HOST_R2.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 生成缩略图（仅图片）
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const thumbnailKey = `${userId}/${fileId}_thumb.jpg`;
        const thumbnail = await generateThumbnail(file);
        if (thumbnail) {
          await env.IMAGE_HOST_R2.put(thumbnailKey, thumbnail, {
            httpMetadata: {
              contentType: 'image/jpeg',
            },
          });
          thumbnailUrl = `https://${env.R2_DOMAIN}/${thumbnailKey}`;
        }
      } catch (error) {
        console.warn('Thumbnail generation failed:', error);
      }
    }

    // 保存文件元数据到KV
    const fileMetadata = {
      id: fileId,
      filename: fileName,
      originalName: file.name,
      type: file.type,
      size: file.size,
      url: `https://${env.R2_DOMAIN}/${fileName}`,
      thumbnailUrl,
      folderId: folderId || null,
      userId,
      uploadedAt: new Date().toISOString(),
      isPublic: false,
      tags: []
    };

    await env.IMAGE_HOST_KV.put(`file:${fileId}`, JSON.stringify(fileMetadata));
    
    // 更新用户存储使用量
    user.storageUsed += file.size;
    await env.IMAGE_HOST_KV.put(`user:${userId}`, JSON.stringify(user));
    await env.IMAGE_HOST_KV.put(`user:username:${user.username}`, JSON.stringify(user));

    return new Response(JSON.stringify({
      success: true,
      file: fileMetadata
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response('上传失败', { status: 500 });
  }
};

async function generateThumbnail(file: File): Promise<ArrayBuffer | null> {
  try {
    // 这里可以使用 Canvas API 或其他图片处理库来生成缩略图
    // 由于 Cloudflare Workers 环境限制，这里只是示例
    // 实际项目中可能需要使用外部服务或 Workers 的图片处理功能
    
    // 简单示例：如果文件小于 500KB，直接返回原文件作为缩略图
    if (file.size < 500 * 1024) {
      return await file.arrayBuffer();
    }
    
    return null;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
}


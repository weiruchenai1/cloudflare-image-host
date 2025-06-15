interface Env {
  IMAGE_HOST_KV: KVNamespace;
  IMAGE_HOST_R2: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // 验证用户身份
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenData = await env.IMAGE_HOST_KV.get(`token:${token}`);
    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid token'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { userId } = JSON.parse(tokenData);
    const userData = await env.IMAGE_HOST_KV.get(`user:${userId}`);
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User not found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = JSON.parse(userData);
    
    // 解析文件数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    
    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No file provided'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查存储配额
    if (user.storageUsed + file.size > user.storageQuota) {
      return new Response(JSON.stringify({
        success: false,
        message: '存储空间不足'
      }), { 
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查文件大小和类型
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        message: '文件过大'
      }), { 
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证文件类型
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        message: '不支持的文件类型'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成文件ID和存储路径
    const fileId = crypto.randomUUID();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = `${userId}/${fileId}.${extension}`;
    
    // 上传原文件到R2
    await env.IMAGE_HOST_R2.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 生成文件URL（需要配置你的R2域名）
    const fileUrl = `https://your-r2-domain.com/${fileName}`;

    // 保存文件元数据到KV
    const fileMetadata = {
      id: fileId,
      filename: fileName,
      originalName: file.name,
      type: file.type,
      size: file.size,
      url: fileUrl,
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
    return new Response(JSON.stringify({
      success: false,
      message: '上传失败'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

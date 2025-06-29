// functions/s/[token].ts - 分享访问页面
import { getFromR2 } from '../utils/storage';
import { logger } from '../utils/logger';
import { Env, ShareLink, FileMetadata, User } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    const { request, env, params } = context;
    const token = params.token as string;
    const url = new URL(request.url);
    const password = url.searchParams.get('password');
    
    logger.info('Share access attempt', { requestId, token });

    // 解析路径，检查是否是直链访问
    const path = decodeURIComponent(url.pathname);
    const pathParts = path.split('/').filter(Boolean);
    
    // 如果只有一个路径部分，使用原有的token逻辑
    if (pathParts.length === 2 && pathParts[0] === 's') {
      return handleTokenAccess(token, password, env, request, requestId);
    } else {
      // 处理直链访问
      // 可能是 /s/{文件名} 或 /s/{文件夹名}/{文件名}
      const fileName = pathParts.length === 2 
        ? pathParts[1] // 根目录下的文件 /s/文件名
        : pathParts.slice(2).join('/'); // 文件夹下的文件 /s/文件夹/文件名
        
      const folderName = pathParts.length > 2 ? pathParts[1] : null;
      
      return handleDirectAccess(folderName, fileName, password, env, request, requestId);
    }
  } catch (error) {
    logger.error('Share access error', { requestId }, error as Error);
    return new Response('Access failed', { status: 500 });
  }
};

// 处理基于token的文件访问
async function handleTokenAccess(token: string, password: string | null, env: Env, request: Request, requestId: string) {
  // 获取分享信息
  const shareData = await env.IMAGE_HOST_KV.get(`share:${token}`);
  if (!shareData) {
    logger.warn('Share not found', { requestId, token });
    return new Response('Share not found', { status: 404 });
  }

  const share: ShareLink = JSON.parse(shareData);

  // 检查分享是否有效
  if (!share.isActive) {
    logger.warn('Share disabled', { requestId, token });
    return new Response('Share is disabled', { status: 403 });
  }

  // 检查过期时间
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    logger.warn('Share expired', { requestId, token });
    return new Response('Share has expired', { status: 410 });
  }

  // 检查访问次数限制
  if (share.maxViews && share.currentViews >= share.maxViews) {
    logger.warn('Share view limit reached', { requestId, token });
    return new Response('View limit reached', { status: 410 });
  }

  // 检查密码
  if (share.password && share.password !== password) {
    if (!password) {
      // 返回密码输入页面
      return new Response(generatePasswordPage(token), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } else {
      logger.warn('Wrong share password', { requestId, token });
      return new Response('Wrong password', { status: 401 });
    }
  }

  // 获取文件信息
  const fileKeys = await env.IMAGE_HOST_KV.list({ prefix: 'file:' });
  let file: FileMetadata | null = null;
  
  for (const key of fileKeys.keys) {
    const fileData = await env.IMAGE_HOST_KV.get(key.name);
    if (fileData) {
      const f: FileMetadata = JSON.parse(fileData);
      if (f.id === share.fileId) {
        file = f;
        break;
      }
    }
  }

  if (!file) {
    logger.warn('File not found for share', { requestId, token, fileId: share.fileId });
    return new Response('File not found', { status: 404 });
  }

  // 更新访问次数
  share.currentViews += 1;
  await env.IMAGE_HOST_KV.put(`share:${token}`, JSON.stringify(share));
  
  // 同时更新用户分享记录
  const userShareKeys = await env.IMAGE_HOST_KV.list({ prefix: `user_share:${file.userId}:` });
  for (const key of userShareKeys.keys) {
    const userShareData = await env.IMAGE_HOST_KV.get(key.name);
    if (userShareData) {
      const userShare: ShareLink = JSON.parse(userShareData);
      if (userShare.token === token) {
        userShare.currentViews = share.currentViews;
        await env.IMAGE_HOST_KV.put(key.name, JSON.stringify(userShare));
        break;
      }
    }
  }

  logger.info('Share accessed successfully', { 
    requestId, 
    token, 
    fileId: file.id, 
    views: share.currentViews 
  });

  // 根据文件类型返回内容
  if (file.type.startsWith('image/')) {
    return new Response(generateImagePreviewPage(file, share), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } else {
    // 直接返回文件
    const fileObj = await getFromR2(env, file.filename);
    if (!fileObj) {
      return new Response('File data not found', { status: 404 });
    }

    return new Response(fileObj.body, {
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }
}

// 处理直链访问
async function handleDirectAccess(folderName: string | null, fileName: string, password: string | null, env: Env, request: Request, requestId: string) {
  logger.info('Direct access attempt', { requestId, folderName, fileName });
  
  // 获取所有文件，查找匹配的文件
  const fileKeys = await env.IMAGE_HOST_KV.list({ prefix: 'file:' });
  let targetFile: FileMetadata | null = null;
  
  for (const key of fileKeys.keys) {
    const fileData = await env.IMAGE_HOST_KV.get(key.name);
    if (fileData) {
      const file: FileMetadata = JSON.parse(fileData);
      
      const isMatch = folderName
        ? file.originalName === fileName && file.folderPath === folderName
        : file.originalName === fileName && !file.folderPath;
      
      if (isMatch) {
        targetFile = file;
        break;
      }
    }
  }
  
  if (!targetFile) {
    logger.warn('File not found for direct access', { requestId, folderName, fileName });
    return new Response('File not found', { status: 404 });
  }
  
  // 检查文件是否公开或有有效的分享链接
  if (!targetFile.isPublic) {
    // 查找该文件的分享链接
    const shareKeys = await env.IMAGE_HOST_KV.list({ prefix: 'share:' });
    let validShare: ShareLink | null = null;
    
    for (const key of shareKeys.keys) {
      const shareData = await env.IMAGE_HOST_KV.get(key.name);
      if (shareData) {
        const share: ShareLink = JSON.parse(shareData);
        if (share.fileId === targetFile.id && share.isActive) {
          // 检查分享是否有效
          if (share.expiresAt && new Date(share.expiresAt) < new Date()) continue;
          if (share.maxViews && share.currentViews >= share.maxViews) continue;
          
          validShare = share;
          break;
        }
      }
    }
    
    if (!validShare) {
      logger.warn('File not public and no valid share', { requestId, fileId: targetFile.id });
      return new Response('File is not publicly accessible', { status: 403 });
    }
    
    // 检查密码
    if (validShare.password && validShare.password !== password) {
      if (!password) {
        return new Response(generateDirectAccessPasswordPage(folderName, fileName), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      } else {
        logger.warn('Wrong password for direct access', { requestId, fileId: targetFile.id });
        return new Response('Wrong password', { status: 401 });
      }
    }
    
    // 更新访问次数
    validShare.currentViews += 1;
    await env.IMAGE_HOST_KV.put(`share:${validShare.token}`, JSON.stringify(validShare));
  }
  
  logger.info('Direct access granted', { requestId, fileId: targetFile.id, fileName });
  
  // 访问文件
  if (targetFile.type.startsWith('image/')) {
    // 对于图片类型，返回预览页面
    const shareInfo = { currentViews: 0 };
    return new Response(generateDirectImagePreviewPage(targetFile, shareInfo), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } else {
    // 直接返回文件
    const fileObj = await getFromR2(env, targetFile.filename);
    if (!fileObj) {
      return new Response('File data not found', { status: 404 });
    }

    return new Response(fileObj.body, {
      headers: {
        'Content-Type': targetFile.type,
        'Content-Disposition': `attachment; filename="${targetFile.originalName}"`,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }
}

function generatePasswordPage(token: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>请输入访问密码</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 class="text-xl font-bold text-gray-900 mb-4 text-center">受密码保护的分享</h1>
        <form onsubmit="handleSubmit(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">访问密码</label>
                <input 
                    type="password" 
                    id="password"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入密码"
                    required
                />
            </div>
            <button 
                type="submit"
                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
                访问
            </button>
        </form>
    </div>
    
    <script>
        function handleSubmit(event) {
            event.preventDefault();
            const password = document.getElementById('password').value;
            window.location.href = window.location.href + '?password=' + encodeURIComponent(password);
        }
    </script>
</body>
</html>`;
}

function generateDirectAccessPasswordPage(folderName: string | null, fileName: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>请输入访问密码</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 class="text-xl font-bold text-gray-900 mb-4 text-center">受密码保护的文件</h1>
        <p class="text-center text-gray-600 mb-4">
            文件: ${fileName}
        </p>
        <form onsubmit="handleSubmit(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">访问密码</label>
                <input 
                    type="password" 
                    id="password"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入密码"
                    required
                />
            </div>
            <button 
                type="submit"
                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
                访问
            </button>
        </form>
    </div>
    
    <script>
        function handleSubmit(event) {
            event.preventDefault();
            const password = document.getElementById('password').value;
            window.location.href = window.location.href + '?password=' + encodeURIComponent(password);
        }
    </script>
</body>
</html>`;
}

function generateImagePreviewPage(file: FileMetadata, share: ShareLink): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.originalName} - 云图床分享</title>
    <meta property="og:image" content="${file.url}">
    <meta property="og:title" content="${file.originalName}">
    <meta property="og:description" content="通过云图床分享的图片">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <div class="p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">${file.originalName}</h1>
                    <p class="text-gray-600 mb-4">
                        文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB | 
                        上传时间: ${new Date(file.uploadedAt).toLocaleDateString('zh-CN')}
                    </p>
                </div>
                
                <div class="text-center bg-gray-100 p-8">
                    <img 
                        src="${file.url}" 
                        alt="${file.originalName}"
                        class="max-w-full h-auto mx-auto rounded-lg shadow-md"
                        style="max-height: 70vh;"
                    />
                </div>
                
                <div class="p-6 bg-gray-50 border-t">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-500">
                            访问次数: ${share.currentViews}
                            ${share.maxViews ? ` / ${share.maxViews}` : ''}
                        </div>
                        <a 
                            href="${file.url}" 
                            download="${file.originalName}"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            下载图片
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function generateDirectImagePreviewPage(file: FileMetadata, share: any): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.originalName} - 云图床直链访问</title>
    <meta property="og:image" content="${file.url}">
    <meta property="og:title" content="${file.originalName}">
    <meta property="og:description" content="通过云图床访问的图片">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <div class="p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">${file.originalName}</h1>
                    <p class="text-gray-600 mb-4">
                        文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB | 
                        上传时间: ${new Date(file.uploadedAt).toLocaleDateString('zh-CN')}
                    </p>
                </div>
                
                <div class="text-center bg-gray-100 p-8">
                    <img 
                        src="${file.url}" 
                        alt="${file.originalName}"
                        class="max-w-full h-auto mx-auto rounded-lg shadow-md"
                        style="max-height: 70vh;"
                    />
                </div>
                
                <div class="p-6 bg-gray-50 border-t">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-500">
                            ${share.currentViews ? `访问次数: ${share.currentViews}` : '直链访问'}
                        </div>
                        <a 
                            href="${file.url}" 
                            download="${file.originalName}"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            下载图片
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;}
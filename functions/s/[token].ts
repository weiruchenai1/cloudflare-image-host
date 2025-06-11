interface Env {
  IMAGE_HOST_KV: KVNamespace;
  IMAGE_HOST_R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env, params } = context;
    const token = params.token as string;
    const url = new URL(request.url);
    const password = url.searchParams.get('password');

    // 获取分享信息
    const shareData = await env.IMAGE_HOST_KV.get(`share:${token}`);
    if (!shareData) {
      return new Response('分享不存在', { status: 404 });
    }

    const share = JSON.parse(shareData);

    // 检查分享是否有效
    if (!share.isActive) {
      return new Response('分享已禁用', { status: 403 });
    }

    // 检查过期时间
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return new Response('分享已过期', { status: 410 });
    }

    // 检查访问次数限制
    if (share.maxViews && share.currentViews >= share.maxViews) {
      return new Response('访问次数已达上限', { status: 410 });
    }

    // 检查密码
    if (share.password && share.password !== password) {
      if (!password) {
        // 返回密码输入页面
        return new Response(generatePasswordPage(token), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      } else {
        return new Response('密码错误', { status: 401 });
      }
    }

    // 获取文件信息
    const fileData = await env.IMAGE_HOST_KV.get(`file:${share.fileId}`);
    if (!fileData) {
      return new Response('文件不存在', { status: 404 });
    }

    const file = JSON.parse(fileData);

    // 更新访问次数
    share.currentViews += 1;
    share.lastAccessAt = new Date().toISOString();
    await env.IMAGE_HOST_KV.put(`share:${token}`, JSON.stringify(share));
    await env.IMAGE_HOST_KV.put(`user_share:${share.userId}:${share.id}`, JSON.stringify(share));

    // 根据文件类型返回内容
    if (file.type.startsWith('image/')) {
      return new Response(generateImagePreviewPage(file, share), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } else {
      // 直接返回文件
      const fileObj = await env.IMAGE_HOST_R2.get(file.filename);
      if (!fileObj) {
        return new Response('文件数据不存在', { status: 404 });
      }

      return new Response(fileObj.body, {
        headers: {
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${file.originalName}"`,
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    }

  } catch (error) {
    console.error('Share access error:', error);
    return new Response('访问失败', { status: 500 });
  }
};

function generatePasswordPage(_token: string): string {
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

function generateImagePreviewPage(file: any, share: any): string {
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

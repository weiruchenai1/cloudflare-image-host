import { hash } from 'bcryptjs';

interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // 检查是否已经初始化
    const isInitialized = await env.IMAGE_HOST_KV.get('system:initialized');
    if (isInitialized) {
      return new Response('系统已经初始化', { status: 400 });
    }

    const {
      adminUsername,
      adminPassword,
      siteName,
      siteTitle,
      defaultStorageQuota
    } = await request.json() as {
      adminUsername: string;
      adminPassword: string;
      siteName: string;
      siteTitle: string;
      defaultStorageQuota: number;
    };

    // 创建管理员账户
    const adminId = crypto.randomUUID();
    const hashedPassword = await hash(adminPassword, 12);
    
    const adminData = {
      id: adminId,
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
      storageQuota: 100 * 1024 * 1024 * 1024, // 100GB
      storageUsed: 0,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // 系统设置
    const systemSettings = {
      siteName,
      siteTitle,
      defaultStorageQuota: defaultStorageQuota * 1024 * 1024 * 1024,
      allowRegistration: true,
      backgroundMode: 'bing',
      backgroundOpacity: 0.1,
      backgroundInterval: 30000,
      showFooter: true,
      footerLinks: [],
      defaultLanguage: 'zh',
      maxFileSize: 100 * 1024 * 1024,
      allowedFileTypes: ['image/*', 'video/*', '.pdf', '.zip', '.rar'],
      initializedAt: new Date().toISOString()
    };

    // 保存数据
    await env.IMAGE_HOST_KV.put(`user:${adminId}`, JSON.stringify(adminData));
    await env.IMAGE_HOST_KV.put(`user:username:${adminUsername}`, JSON.stringify(adminData));
    await env.IMAGE_HOST_KV.put('system:settings', JSON.stringify(systemSettings));
    await env.IMAGE_HOST_KV.put('system:initialized', 'true');

    return new Response(JSON.stringify({
      success: true,
      message: '系统初始化完成'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return new Response('初始化失败', { status: 500 });
  }
};

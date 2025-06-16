interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

// --- 辅助函数开始 ---
function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length * 2);
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2ab(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const key = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltB64 = btoa(String.fromCharCode(...Array.from(salt)));
  const keyB64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(key))));

  return `${saltB64}:${keyB64}`;
}
// --- 辅助函数结束 ---

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // 检查是否已经初始化
    const isInitialized = await env.IMAGE_HOST_KV.get('system:initialized');
    if (isInitialized) {
      return new Response(JSON.stringify({
        success: false,
        message: '系统已经初始化'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    // 验证输入
    if (!adminUsername || !adminPassword || !siteName || !siteTitle) {
      return new Response(JSON.stringify({
        success: false,
        message: '请填写所有必填字段'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (adminUsername.length < 3) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名至少需要3个字符'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (adminPassword.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        message: '密码至少需要6个字符'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建管理员账户
    const adminId = crypto.randomUUID();
    const hashedPassword = await hashPassword(adminPassword);
    
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

    // 创建默认文件夹
    const defaultFolders = [
      {
        id: crypto.randomUUID(),
        name: 'file',
        parentId: null,
        userId: adminId,
        createdAt: new Date().toISOString(),
        isPublic: false,
        isDefault: true
      },
      {
        id: crypto.randomUUID(),
        name: 'images',
        parentId: null,
        userId: adminId,
        createdAt: new Date().toISOString(),
        isPublic: false
      },
      {
        id: crypto.randomUUID(),
        name: 'documents',
        parentId: null,
        userId: adminId,
        createdAt: new Date().toISOString(),
        isPublic: false
      }
    ];

    for (const folder of defaultFolders) {
      await env.IMAGE_HOST_KV.put(`folder:${folder.id}`, JSON.stringify(folder));
    }

    return new Response(JSON.stringify({
      success: true,
      message: '系统初始化完成'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '初始化失败，请稍后重试'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

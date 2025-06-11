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
    const { username, email, password, inviteCode } = await request.json() as {
      username: string;
      email: string;
      password: string;
      inviteCode: string;
    };

    // 验证邀请码
    const inviteData = await env.IMAGE_HOST_KV.get(`invite:${inviteCode}`);
    if (!inviteData) {
      return new Response('邀请码无效', { status: 400 });
    }

    const invite = JSON.parse(inviteData);
    if (invite.isUsed) {
      return new Response('邀请码已被使用', { status: 400 });
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return new Response('邀请码已过期', { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUser = await env.IMAGE_HOST_KV.get(`user:username:${username}`);
    if (existingUser) {
      return new Response('用户名已存在', { status: 400 });
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await env.IMAGE_HOST_KV.get(`user:email:${email}`);
      if (existingEmail) {
        return new Response('邮箱已被使用', { status: 400 });
      }
    }

    // 创建用户
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);
    
    const userData = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      storageQuota: 5 * 1024 * 1024 * 1024, // 5GB
      storageUsed: 0,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // 保存用户数据
    await env.IMAGE_HOST_KV.put(`user:${userId}`, JSON.stringify(userData));
    await env.IMAGE_HOST_KV.put(`user:username:${username}`, JSON.stringify(userData));
    if (email) {
      await env.IMAGE_HOST_KV.put(`user:email:${email}`, JSON.stringify(userData));
    }

    // 标记邀请码为已使用
    invite.isUsed = true;
    invite.usedBy = userId;
    invite.usedAt = new Date().toISOString();
    await env.IMAGE_HOST_KV.put(`invite:${inviteCode}`, JSON.stringify(invite));

    return new Response(JSON.stringify({
      success: true,
      message: '注册成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Register error:', error);
    return new Response('注册失败', { status: 500 });
  }
};

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

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltB64, keyB64] = hash.split(':');
    if (!saltB64 || !keyB64) return false;
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const key = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      str2ab(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    return await crypto.subtle.timingSafeEqual(new Uint8Array(derivedKey), key);
  } catch (e) {
    return false;
  }
}
// --- 辅助函数结束 ---

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { username, password } = await request.json() as { username: string; password: string };

    // 查找用户
    const userData = await env.IMAGE_HOST_KV.get(`user:username:${username}`);
    if (!userData) {
      return new Response('用户不存在', { status: 401 });
    }

    const user = JSON.parse(userData);

    // 使用新的、安全的密码验证函数
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return new Response('密码错误', { status: 401 });
    }

    if (!user.isActive) {
      return new Response('账户已被禁用', { status: 403 });
    }

    // 生成访问令牌
    const token = crypto.randomUUID();
    const tokenData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      createdAt: new Date().toISOString()
    };

    // 保存令牌 (24小时过期)
    await env.IMAGE_HOST_KV.put(`token:${token}`, JSON.stringify(tokenData), {
      expirationTtl: 24 * 60 * 60 // 24小时
    });

    // 移除密码字段
    delete user.password;

    return new Response(JSON.stringify({
      success: true,
      user,
      token
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response('登录失败', { status: 500 });
  }
};

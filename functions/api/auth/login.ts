interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

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
    
    // 验证密码 (实际项目中应该使用bcrypt等安全哈希)
    if (user.password !== password) {
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

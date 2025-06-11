import { hash } from 'bcryptjs';

interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

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
    const hashedPassword = await hash(password, 12);
    
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

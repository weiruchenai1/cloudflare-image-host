// 用户注册 API
import { sign } from '@tsndr/cloudflare-worker-jwt'

interface RegisterRequest {
  email: string
  username: string
  password: string
  invitationCode: string
}

export async function onRequestPost(context: {
  request: Request;
  env: any;
}) {
  const { request, env } = context

  try {
    const { email, username, password, invitationCode }: RegisterRequest = await request.json()

    // 验证输入
    if (!email || !username || !password || !invitationCode) {
      return new Response(JSON.stringify({
        success: false,
        message: 'All fields are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证邀请码
    const invitationData = await env.INVITATIONS_KV.get(`invitation:${invitationCode}`)
    if (!invitationData) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid invitation code'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const invitation = JSON.parse(invitationData)
    if (invitation.used || (invitation.expiresAt && new Date(invitation.expiresAt) < new Date())) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invitation code has expired or been used'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查邮箱是否已存在
    const emailKey = `user:email:${email.toLowerCase()}`
    const existingUser = await env.USERS_KV.get(emailKey)
    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email already registered'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 创建新用户
    const userId = crypto.randomUUID()
    const user = {
      id: userId,
      email: email.toLowerCase(),
      username,
      passwordHash: password, // 在生产环境中应该使用 bcrypt 等安全哈希
      role: invitation.role || 'user',
      storageQuota: invitation.storageQuota || 5 * 1024 * 1024 * 1024, // 5GB
      storageUsed: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      invitedBy: invitation.createdBy,
    }

    // 保存用户
    await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user))
    await env.USERS_KV.put(emailKey, JSON.stringify(user))

    // 标记邀请码为已使用
    invitation.used = true
    invitation.usedAt = new Date().toISOString()
    invitation.usedBy = userId
    await env.INVITATIONS_KV.put(`invitation:${invitationCode}`, JSON.stringify(invitation))

    // 生成 JWT
    const token = await sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时
    }, env.JWT_SECRET)

    // 返回用户信息和令牌
    const { passwordHash, ...userWithoutPassword } = user

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

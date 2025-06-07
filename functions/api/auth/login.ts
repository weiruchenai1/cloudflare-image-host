// 用户登录 API
import { sign } from '@tsndr/cloudflare-worker-jwt'

interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export async function onRequestPost(context: {
  request: Request;
  env: any;
}) {
  const { request, env } = context

  try {
    const { email, password, rememberMe }: LoginRequest = await request.json()

    // 验证输入
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 从 KV 获取用户
    const userKey = `user:email:${email.toLowerCase()}`
    const userData = await env.USERS_KV.get(userKey)

    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const user = JSON.parse(userData)

    // 验证密码 (这里应该使用 bcrypt 等安全的哈希方法)
    if (user.passwordHash !== password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查用户是否激活
    if (!user.isActive) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Account is deactivated'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 生成 JWT
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30天或1天
    const token = await sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + expiresIn
    }, env.JWT_SECRET)

    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString()
    await env.USERS_KV.put(`user:${user.id}`, JSON.stringify(user))
    await env.USERS_KV.put(userKey, JSON.stringify(user))

    // 返回用户信息和令牌
    const { passwordHash, ...userWithoutPassword } = user

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

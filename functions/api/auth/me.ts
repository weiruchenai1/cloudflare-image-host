// 获取当前用户信息 API
import { verify } from '@tsndr/cloudflare-worker-jwt'

export async function onRequestGet(context: any) {
  const { request, env } = context

  try {
    // 获取 Authorization 头
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Authorization token required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    // 验证 JWT
    const isValid = await verify(token, env.JWT_SECRET)
    if (!isValid) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid or expired token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 解码 JWT 获取用户信息
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    // 从 KV 获取最新用户信息
    const userData = await env.USERS_KV.get(`user:${payload.userId}`)
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const user = JSON.parse(userData)

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

    // 返回用户信息（不包含密码）
    const { passwordHash, ...userWithoutPassword } = user

    return new Response(JSON.stringify({
      success: true,
      data: userWithoutPassword
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get user info error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

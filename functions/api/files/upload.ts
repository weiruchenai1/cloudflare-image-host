// 文件上传 API
import { verify } from '@tsndr/cloudflare-worker-jwt'

async function authenticateUser(request: Request, env: any): Promise<any> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required')
  }

  const token = authHeader.substring(7)
  const isValid = await verify(token, env.JWT_SECRET)
  if (!isValid) {
    throw new Error('Invalid or expired token')
  }

  const payload = JSON.parse(atob(token.split('.')[1]))
  const userData = await env.USERS_KV.get(`user:${payload.userId}`)
  if (!userData) {
    throw new Error('User not found')
  }

  return JSON.parse(userData)
}

export async function onRequestPost(context: {
  request: Request;
  env: any;
}) {
  const { request, env } = context

  try {
    // 认证用户
    const user = await authenticateUser(request, env)

    // 解析表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No file provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查文件大小
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        message: 'File too large. Maximum size is 100MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查存储配额
    if (user.storageUsed + file.size > user.storageQuota) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Storage quota exceeded'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 生成文件ID和键
    const fileId = crypto.randomUUID()
    const fileKey = `${user.id}/${fileId}/${file.name}`

    // 上传到 R2
    await env.FILES_BUCKET.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    // 创建文件元数据
    const fileMetadata = {
      id: fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      type: 'file',
      ownerId: user.id,
      folderId: folderId || null,
      storageKey: fileKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
    }

    // 保存文件元数据到 KV
    const metadataKey = folderId 
      ? `file:${user.id}:${folderId}:${fileId}`
      : `file:${user.id}:${fileId}`
    
    await env.FILES_KV.put(metadataKey, JSON.stringify(fileMetadata))

    // 更新用户存储使用量
    user.storageUsed += file.size
    await env.USERS_KV.put(`user:${user.id}`, JSON.stringify(user))

    return new Response(JSON.stringify({
      success: true,
      data: fileMetadata
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: error instanceof Error && error.message.includes('token') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

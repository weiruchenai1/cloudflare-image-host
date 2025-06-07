// 仪表板统计 API
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

export async function onRequestGet(context: {
  request: Request;
  env: any;
}) {
  const { request, env } = context

  try {
    // 认证用户
    const user = await authenticateUser(request, env)

    // 获取用户的所有文件
    const { keys } = await env.FILES_KV.list({ prefix: `file:${user.id}:` })
    
    let totalFiles = 0
    let totalSize = 0
    const filesByType: Record<string, number> = {}
    const sizeByType: Record<string, number> = {}
    const recentUploads = []

    for (const key of keys) {
      const fileData = await env.FILES_KV.get(key.name)
      if (fileData) {
        const file = JSON.parse(fileData)
        totalFiles++
        totalSize += file.size || 0

        // 按类型分类
        let type = 'other'
        if (file.mimeType?.startsWith('image/')) type = 'image'
        else if (file.mimeType?.startsWith('video/')) type = 'video'
        else if (file.mimeType?.includes('pdf') || file.mimeType?.includes('document')) type = 'document'
        else if (file.mimeType?.includes('zip') || file.mimeType?.includes('rar')) type = 'archive'

        filesByType[type] = (filesByType[type] || 0) + 1
        sizeByType[type] = (sizeByType[type] || 0) + (file.size || 0)

        // 收集最近上传的文件
        if (recentUploads.length < 10) {
          recentUploads.push(file)
        }
      }
    }

    // 按创建时间排序最近上传
    recentUploads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const stats = {
      totalUsed: user.storageUsed || 0,
      totalQuota: user.storageQuota || 5 * 1024 * 1024 * 1024,
      fileCount: totalFiles,
      folderCount: 0, // 暂时不支持文件夹
      recentUploads: recentUploads.slice(0, 5),
      storageByType: sizeByType,
      totalFiles,
      totalSize,
      filesByType,
      sizeByType
    }

    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: error instanceof Error && error.message.includes('token') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

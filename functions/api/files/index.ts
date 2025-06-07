// 文件列表 API
import { verify } from '@tsndr/cloudflare-worker-jwt'

async function authenticateUser(request: Request, env: any) {
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

export async function onRequestGet(context: any) {
  const { request, env } = context

  try {
    // 认证用户
    const user = await authenticateUser(request, env)

    // 获取查询参数
    const url = new URL(request.url)
    const folderId = url.searchParams.get('folderId')
    const query = url.searchParams.get('query')
    const type = url.searchParams.get('type')
    const sortBy = url.searchParams.get('sortBy') || 'name'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'

    // 构建文件查询键
    const filePrefix = folderId ? `file:${user.id}:${folderId}:` : `file:${user.id}:`
    
    // 获取用户的所有文件
    const { keys } = await env.FILES_KV.list({ prefix: filePrefix })
    
    const files = []
    for (const key of keys) {
      const fileData = await env.FILES_KV.get(key.name)
      if (fileData) {
        const file = JSON.parse(fileData)
        
        // 应用过滤器
        if (query && !file.name.toLowerCase().includes(query.toLowerCase())) {
          continue
        }
        
        if (type && type !== 'all') {
          if (type === 'image' && !file.mimeType?.startsWith('image/')) continue
          if (type === 'video' && !file.mimeType?.startsWith('video/')) continue
          if (type === 'document' && !file.mimeType?.includes('pdf') && !file.mimeType?.includes('document')) continue
          if (type === 'archive' && !file.mimeType?.includes('zip') && !file.mimeType?.includes('rar')) continue
        }
        
        files.push(file)
      }
    }

    // 排序
    files.sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a]
      let bValue = b[sortBy as keyof typeof b]
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1
      }
      return aValue > bValue ? 1 : -1
    })

    return new Response(JSON.stringify({
      success: true,
      data: files
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get files error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: error instanceof Error && error.message.includes('token') ? 401 : 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

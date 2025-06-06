import { Env, RequestContext, User } from '../types'
import { JWT } from '../utils/auth'
import { ResponseHelper } from '../utils/response'

export async function authMiddleware(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<{ context: RequestContext; response?: Response }> {
  const context: RequestContext = {
    isAuthenticated: false,
    isAdmin: false,
  }

  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { context }
  }

  const token = authHeader.substring(7)
  
  try {
    // Verify JWT token
    const payload = await JWT.verifyToken(token, env.JWT_SECRET)
    
    // Get user from KV store
    const userKey = `user:${payload.userId}`
    const userData = await env.USERS_KV.get(userKey)
    
    if (!userData) {
      return {
        context,
        response: ResponseHelper.unauthorized('User not found'),
      }
    }

    const user: User = JSON.parse(userData)
    
    // Check if user is active
    if (!user.isActive) {
      return {
        context,
        response: ResponseHelper.forbidden('Account is deactivated'),
      }
    }

    // Update context
    context.user = user
    context.userId = user.id
    context.isAuthenticated = true
    context.isAdmin = user.role === 'admin'

    return { context }
  } catch (error) {
    return {
      context,
      response: ResponseHelper.unauthorized('Invalid or expired token'),
    }
  }
}

export function requireAuth(handler: Function) {
  return async (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    context: RequestContext
  ): Promise<Response> => {
    if (!context.isAuthenticated) {
      return ResponseHelper.unauthorized('Authentication required')
    }
    
    return handler(request, env, ctx, context)
  }
}

export function requireAdmin(handler: Function) {
  return async (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    context: RequestContext
  ): Promise<Response> => {
    if (!context.isAuthenticated) {
      return ResponseHelper.unauthorized('Authentication required')
    }
    
    if (!context.isAdmin) {
      return ResponseHelper.forbidden('Admin access required')
    }
    
    return handler(request, env, ctx, context)
  }
}

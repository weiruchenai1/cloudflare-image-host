import { Env, RequestContext, Route, HTTPMethod } from './types'
import { ResponseHelper } from './utils/response'
import { authMiddleware, requireAuth, requireAdmin } from './middleware/auth'
import { corsMiddleware, handlePreflight } from './middleware/cors'

// Import handlers
import { loginHandler, registerHandler, meHandler, logoutHandler } from './handlers/auth'

export class Router {
  private routes: Route[] = []

  constructor() {
    this.setupRoutes()
  }

  private setupRoutes() {
    // Auth routes
    this.addRoute('POST', '/auth/login', loginHandler)
    this.addRoute('POST', '/auth/register', registerHandler)
    this.addRoute('GET', '/auth/me', requireAuth(meHandler), true)
    this.addRoute('POST', '/auth/logout', requireAuth(logoutHandler), true)

    // File routes (placeholder)
    this.addRoute('GET', '/files', requireAuth(this.placeholderHandler), true)
    this.addRoute('POST', '/files/upload', requireAuth(this.placeholderHandler), true)
    this.addRoute('POST', '/files/folder', requireAuth(this.placeholderHandler), true)
    this.addRoute('DELETE', '/files', requireAuth(this.placeholderHandler), true)
    this.addRoute('PATCH', '/files/move', requireAuth(this.placeholderHandler), true)
    this.addRoute('POST', '/files/:id/share', requireAuth(this.placeholderHandler), true)
    this.addRoute('GET', '/files/:id/download', this.placeholderHandler)
    this.addRoute('GET', '/files/:id/thumbnail', this.placeholderHandler)

    // Share routes (placeholder)
    this.addRoute('GET', '/share/:shareId', this.placeholderHandler)

    // Admin routes (placeholder)
    this.addRoute('GET', '/admin/users', requireAdmin(this.placeholderHandler), true, true)
    this.addRoute('POST', '/admin/invitations', requireAdmin(this.placeholderHandler), true, true)
    this.addRoute('GET', '/admin/stats', requireAdmin(this.placeholderHandler), true, true)

    // Health check
    this.addRoute('GET', '/health', this.healthHandler)
  }

  private addRoute(
    method: HTTPMethod,
    path: string,
    handler: any,
    requireAuth: boolean = false,
    requireAdmin: boolean = false
  ) {
    this.routes.push({
      method,
      path,
      handler,
      requireAuth,
      requireAdmin,
    })
  }

  private matchRoute(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue

      const params: Record<string, string> = {}
      const routeParts = route.path.split('/')
      const pathParts = pathname.split('/')

      if (routeParts.length !== pathParts.length) continue

      let matches = true
      for (let i = 0; i < routeParts.length; i++) {
        const routePart = routeParts[i]
        const pathPart = pathParts[i]

        if (routePart.startsWith(':')) {
          // Parameter
          const paramName = routePart.substring(1)
          params[paramName] = pathPart
        } else if (routePart !== pathPart) {
          matches = false
          break
        }
      }

      if (matches) {
        return { route, params }
      }
    }

    return null
  }

  async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const method = request.method
    const pathname = url.pathname

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handlePreflight(env)(request)
    }

    // Find matching route
    const match = this.matchRoute(method, pathname)
    if (!match) {
      return ResponseHelper.notFound('Route not found')
    }

    const { route, params } = match

    try {
      // Apply auth middleware
      const { context, response: authResponse } = await authMiddleware(request, env, ctx)
      if (authResponse) {
        return corsMiddleware(env)(request, authResponse)
      }

      // Add params to request for handlers to use
      ;(request as any).params = params

      // Call handler
      const response = await route.handler(request, env, ctx, context)
      
      // Apply CORS
      return corsMiddleware(env)(request, response)
    } catch (error) {
      console.error('Route handler error:', error)
      const errorResponse = ResponseHelper.internalServerError('Internal server error')
      return corsMiddleware(env)(request, errorResponse)
    }
  }

  // Placeholder handler for routes not yet implemented
  private async placeholderHandler(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    context: RequestContext
  ): Promise<Response> {
    return ResponseHelper.success({
      message: 'This endpoint is not yet implemented',
      method: request.method,
      url: request.url,
    })
  }

  // Health check handler
  private async healthHandler(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    context: RequestContext
  ): Promise<Response> {
    return ResponseHelper.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  }
}

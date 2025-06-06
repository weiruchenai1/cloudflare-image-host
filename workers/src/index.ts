// Cloudflare Worker - Image Host API
// All code merged into single file for deployment

// ===== UTILITY CLASSES =====

// Response Helper
class ResponseHelper {
  static success(data, message) {
    const response = {
      success: true,
      data,
      message,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  static created(data, message) {
    const response = {
      success: true,
      data,
      message,
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  static error(message, statusCode = 400, code) {
    const response = {
      success: false,
      error: message,
    }

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  static badRequest(message = 'Bad Request') {
    return this.error(message, 400)
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401)
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403)
  }

  static notFound(message = 'Not Found') {
    return this.error(message, 404)
  }

  static conflict(message = 'Conflict') {
    return this.error(message, 409)
  }

  static tooManyRequests(message = 'Too Many Requests') {
    return this.error(message, 429)
  }

  static internalServerError(message = 'Internal Server Error') {
    return this.error(message, 500)
  }

  static cors(response, origin) {
    const headers = new Headers(response.headers)

    headers.set('Access-Control-Allow-Origin', origin || '*')
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    headers.set('Access-Control-Max-Age', '86400')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }

  static preflight(origin) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
}

// JWT Helper
class JWT {
  static async sign(payload, secret, expiresIn = 3600) {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    }

    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    }

    const encoder = new TextEncoder()
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const data = `${headerB64}.${payloadB64}`
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    return `${data}.${signatureB64}`
  }

  static async verify(token, secret) {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    const [headerB64, payloadB64, signatureB64] = parts
    const encoder = new TextEncoder()

    // Verify signature
    const data = `${headerB64}.${payloadB64}`
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(signatureB64.length + (4 - signatureB64.length % 4) % 4, '=')),
      c => c.charCodeAt(0)
    )

    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data))
    if (!isValid) {
      throw new Error('Invalid token signature')
    }

    // Decode payload
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(payloadB64.length + (4 - payloadB64.length % 4) % 4, '='))
    )

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired')
    }

    return payload
  }

  static async createToken(user, secret, rememberMe = false) {
    const expiresIn = rememberMe ? 30 * 24 * 3600 : 24 * 3600 // 30 days or 1 day

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    return this.sign(payload, secret, expiresIn)
  }

  static async verifyToken(token, secret) {
    return this.verify(token, secret)
  }
}

// Password Helper
class PasswordHelper {
  static async hash(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  static async verify(password, hash) {
    const passwordHash = await this.hash(password)
    return passwordHash === hash
  }

  static generate(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

// Invitation Helper
class InvitationHelper {
  static generate() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static isValid(code) {
    return /^[A-Z0-9]{8}$/.test(code)
  }
}

// Rate Limiter
class RateLimiter {
  static getKey(identifier, action) {
    return `rate_limit:${action}:${identifier}`
  }

  static async checkLimit(kv, identifier, action, limit, windowMs) {
    const key = this.getKey(identifier, action)
    const now = Date.now()
    const windowStart = now - windowMs

    // Get current count
    const data = await kv.get(key)
    let requests = data ? JSON.parse(data) : []

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart)

    const remaining = Math.max(0, limit - requests.length)
    const allowed = requests.length < limit

    if (allowed) {
      requests.push(now)
      await kv.put(key, JSON.stringify(requests), { expirationTtl: Math.ceil(windowMs / 1000) })
    }

    const resetTime = requests.length > 0 ? Math.min(...requests) + windowMs : now + windowMs

    return { allowed, remaining, resetTime }
  }
}

// ===== MIDDLEWARE =====

// Auth Middleware
async function authMiddleware(request, env, ctx) {
  const context = {
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

    const user = JSON.parse(userData)

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

function requireAuth(handler) {
  return async (request, env, ctx, context) => {
    if (!context.isAuthenticated) {
      return ResponseHelper.unauthorized('Authentication required')
    }

    return handler(request, env, ctx, context)
  }
}

function requireAdmin(handler) {
  return async (request, env, ctx, context) => {
    if (!context.isAuthenticated) {
      return ResponseHelper.unauthorized('Authentication required')
    }

    if (!context.isAdmin) {
      return ResponseHelper.forbidden('Admin access required')
    }

    return handler(request, env, ctx, context)
  }
}

// CORS Middleware
function corsMiddleware(env) {
  return (request, response) => {
    const origin = request.headers.get('Origin')
    const allowedOrigin = env.CORS_ORIGIN || '*'

    // Check if origin is allowed
    const isAllowed = allowedOrigin === '*' || origin === allowedOrigin

    if (isAllowed) {
      return ResponseHelper.cors(response, origin || allowedOrigin)
    }

    return response
  }
}

function handlePreflight(env) {
  return (request) => {
    const origin = request.headers.get('Origin')
    const allowedOrigin = env.CORS_ORIGIN || '*'

    // Check if origin is allowed
    const isAllowed = allowedOrigin === '*' || origin === allowedOrigin

    if (isAllowed) {
      return ResponseHelper.preflight(origin || allowedOrigin)
    }

    return new Response(null, { status: 403 })
  }
}

// ===== HANDLERS =====

// Auth Handlers
async function loginHandler(request, env, ctx, context) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
    const rateLimit = await RateLimiter.checkLimit(
      env.SESSIONS_KV,
      clientIP,
      'login',
      5, // 5 attempts
      15 * 60 * 1000 // 15 minutes
    )

    if (!rateLimit.allowed) {
      return ResponseHelper.tooManyRequests('Too many login attempts. Please try again later.')
    }

    const body = await request.json()

    // Validate input
    if (!body.email || !body.password) {
      return ResponseHelper.badRequest('Email and password are required')
    }

    // Find user by email
    const userKey = `user_email:${body.email.toLowerCase()}`
    const userId = await env.USERS_KV.get(userKey)

    if (!userId) {
      return ResponseHelper.unauthorized('Invalid email or password')
    }

    // Get user data
    const userData = await env.USERS_KV.get(`user:${userId}`)
    if (!userData) {
      return ResponseHelper.unauthorized('Invalid email or password')
    }

    const user = JSON.parse(userData)

    // Verify password
    const isValidPassword = await PasswordHelper.verify(body.password, user.passwordHash)
    if (!isValidPassword) {
      return ResponseHelper.unauthorized('Invalid email or password')
    }

    // Check if user is active
    if (!user.isActive) {
      return ResponseHelper.forbidden('Account is deactivated')
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString()
    await env.USERS_KV.put(`user:${user.id}`, JSON.stringify(user))

    // Create JWT token
    const token = await JWT.createToken(user, env.JWT_SECRET, body.rememberMe)

    // Remove sensitive data
    const { passwordHash, ...userResponse } = user

    return ResponseHelper.success({
      user: userResponse,
      token,
    }, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return ResponseHelper.internalServerError('Login failed')
  }
}

async function registerHandler(request, env, ctx, context) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
    const rateLimit = await RateLimiter.checkLimit(
      env.SESSIONS_KV,
      clientIP,
      'register',
      3, // 3 attempts
      60 * 60 * 1000 // 1 hour
    )

    if (!rateLimit.allowed) {
      return ResponseHelper.tooManyRequests('Too many registration attempts. Please try again later.')
    }

    const body = await request.json()

    // Validate input
    if (!body.email || !body.username || !body.password || !body.invitationCode) {
      return ResponseHelper.badRequest('All fields are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return ResponseHelper.badRequest('Invalid email format')
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(body.username)) {
      return ResponseHelper.badRequest('Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores')
    }

    // Validate password strength
    if (body.password.length < 8) {
      return ResponseHelper.badRequest('Password must be at least 8 characters long')
    }

    // Validate invitation code format
    if (!InvitationHelper.isValid(body.invitationCode)) {
      return ResponseHelper.badRequest('Invalid invitation code format')
    }

    // Check invitation code
    const invitationKey = `invitation:${body.invitationCode}`
    const invitationData = await env.INVITATIONS_KV.get(invitationKey)

    if (!invitationData) {
      return ResponseHelper.badRequest('Invalid invitation code')
    }

    const invitation = JSON.parse(invitationData)

    // Check if invitation is active
    if (!invitation.isActive) {
      return ResponseHelper.badRequest('Invitation code is no longer active')
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return ResponseHelper.badRequest('Invitation code has expired')
    }

    // Check if invitation has reached max uses
    if (invitation.currentUses >= invitation.maxUses) {
      return ResponseHelper.badRequest('Invitation code has reached maximum uses')
    }

    // Check if email already exists
    const emailKey = `user_email:${body.email.toLowerCase()}`
    const existingUserId = await env.USERS_KV.get(emailKey)
    if (existingUserId) {
      return ResponseHelper.conflict('Email already registered')
    }

    // Check if username already exists
    const usernameKey = `user_username:${body.username.toLowerCase()}`
    const existingUsername = await env.USERS_KV.get(usernameKey)
    if (existingUsername) {
      return ResponseHelper.conflict('Username already taken')
    }

    // Create user
    const userId = crypto.randomUUID()
    const passwordHash = await PasswordHelper.hash(body.password)

    const user = {
      id: userId,
      email: body.email.toLowerCase(),
      username: body.username,
      passwordHash,
      role: 'user',
      storageQuota: 5 * 1024 * 1024 * 1024, // 5GB default
      storageUsed: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      invitedBy: invitation.createdBy,
    }

    // Save user
    await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user))
    await env.USERS_KV.put(emailKey, userId)
    await env.USERS_KV.put(usernameKey, userId)

    // Update invitation usage
    invitation.currentUses++
    invitation.usedBy.push(userId)
    await env.INVITATIONS_KV.put(invitationKey, JSON.stringify(invitation))

    // Create JWT token
    const token = await JWT.createToken(user, env.JWT_SECRET)

    // Remove sensitive data
    const { passwordHash: _, ...userResponse } = user

    return ResponseHelper.created({
      user: userResponse,
      token,
    }, 'Account created successfully')
  } catch (error) {
    console.error('Registration error:', error)
    return ResponseHelper.internalServerError('Registration failed')
  }
}

async function meHandler(request, env, ctx, context) {
  if (!context.user) {
    return ResponseHelper.unauthorized('Authentication required')
  }

  // Remove sensitive data
  const { passwordHash, ...userResponse } = context.user

  return ResponseHelper.success(userResponse)
}

async function logoutHandler(request, env, ctx, context) {
  // In a stateless JWT system, logout is handled client-side
  // We could implement token blacklisting here if needed
  return ResponseHelper.success(null, 'Logged out successfully')
}

// ===== ROUTER =====

class Router {
  constructor() {
    this.routes = []
    this.setupRoutes()
  }

  setupRoutes() {
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

  addRoute(method, path, handler, requireAuth = false, requireAdmin = false) {
    this.routes.push({
      method,
      path,
      handler,
      requireAuth,
      requireAdmin,
    })
  }

  matchRoute(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue

      const params = {}
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

  async handle(request, env, ctx) {
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
      request.params = params

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
  async placeholderHandler(request, env, ctx, context) {
    return ResponseHelper.success({
      message: 'This endpoint is not yet implemented',
      method: request.method,
      url: request.url,
    })
  }

  // Health check handler
  async healthHandler(request, env, ctx, context) {
    return ResponseHelper.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  }
}

// ===== MAIN WORKER =====

// Initialize router
const router = new Router()

export default {
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx)
    } catch (error) {
      console.error('Worker error:', error)
      return ResponseHelper.internalServerError('Internal server error')
    }
  },
}

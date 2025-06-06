import { Env, RequestContext, LoginRequest, RegisterRequest, User, InvitationCode } from '../types'
import { ResponseHelper } from '../utils/response'
import { JWT, PasswordHelper, InvitationHelper, RateLimiter } from '../utils/auth'

export async function loginHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  context: RequestContext
): Promise<Response> {
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

    const body: LoginRequest = await request.json()
    
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

    const user: User = JSON.parse(userData)

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

export async function registerHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  context: RequestContext
): Promise<Response> {
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

    const body: RegisterRequest = await request.json()
    
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

    const invitation: InvitationCode = JSON.parse(invitationData)

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
    
    const user: User = {
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

export async function meHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  context: RequestContext
): Promise<Response> {
  if (!context.user) {
    return ResponseHelper.unauthorized('Authentication required')
  }

  // Remove sensitive data
  const { passwordHash, ...userResponse } = context.user

  return ResponseHelper.success(userResponse)
}

export async function logoutHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  context: RequestContext
): Promise<Response> {
  // In a stateless JWT system, logout is handled client-side
  // We could implement token blacklisting here if needed
  return ResponseHelper.success(null, 'Logged out successfully')
}

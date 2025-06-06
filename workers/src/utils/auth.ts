import { JWTPayload, User } from '../types'

// Simple JWT implementation for Cloudflare Workers
export class JWT {
  private static async sign(payload: any, secret: string, expiresIn: number = 3600): Promise<string> {
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

  private static async verify(token: string, secret: string): Promise<any> {
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

  static async createToken(user: User, secret: string, rememberMe: boolean = false): Promise<string> {
    const expiresIn = rememberMe ? 30 * 24 * 3600 : 24 * 3600 // 30 days or 1 day
    
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    return this.sign(payload, secret, expiresIn)
  }

  static async verifyToken(token: string, secret: string): Promise<JWTPayload> {
    return this.verify(token, secret)
  }
}

// Password hashing utilities
export class PasswordHelper {
  static async hash(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hash(password)
    return passwordHash === hash
  }

  static generate(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

// Invitation code utilities
export class InvitationHelper {
  static generate(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static isValid(code: string): boolean {
    return /^[A-Z0-9]{8}$/.test(code)
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static getKey(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`
  }

  static async checkLimit(
    kv: KVNamespace,
    identifier: string,
    action: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.getKey(identifier, action)
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get current count
    const data = await kv.get(key)
    let requests: number[] = data ? JSON.parse(data) : []
    
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

import { Env } from '../types'
import { ResponseHelper } from '../utils/response'

export function corsMiddleware(env: Env) {
  return (request: Request, response: Response): Response => {
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

export function handlePreflight(env: Env) {
  return (request: Request): Response => {
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

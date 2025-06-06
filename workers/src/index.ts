import { Env } from './types'
import { Router } from './router'
import { ResponseHelper } from './utils/response'

// Initialize router
const router = new Router()

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx)
    } catch (error) {
      console.error('Worker error:', error)
      return ResponseHelper.internalServerError('Internal server error')
    }
  },
}

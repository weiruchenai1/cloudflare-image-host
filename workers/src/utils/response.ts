import { ApiResponse } from '../types'

export class ResponseHelper {
  static success<T>(data?: T, message?: string): Response {
    const response: ApiResponse<T> = {
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

  static created<T>(data?: T, message?: string): Response {
    const response: ApiResponse<T> = {
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

  static error(message: string, statusCode: number = 400, code?: string): Response {
    const response: ApiResponse = {
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

  static badRequest(message: string = 'Bad Request'): Response {
    return this.error(message, 400)
  }

  static unauthorized(message: string = 'Unauthorized'): Response {
    return this.error(message, 401)
  }

  static forbidden(message: string = 'Forbidden'): Response {
    return this.error(message, 403)
  }

  static notFound(message: string = 'Not Found'): Response {
    return this.error(message, 404)
  }

  static conflict(message: string = 'Conflict'): Response {
    return this.error(message, 409)
  }

  static tooManyRequests(message: string = 'Too Many Requests'): Response {
    return this.error(message, 429)
  }

  static internalServerError(message: string = 'Internal Server Error'): Response {
    return this.error(message, 500)
  }

  static cors(response: Response, origin?: string): Response {
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

  static preflight(origin?: string): Response {
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

  static file(data: ArrayBuffer, filename: string, mimeType: string): Response {
    return new Response(data, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  }

  static stream(stream: ReadableStream, mimeType: string): Response {
    return new Response(stream, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  }

  static redirect(url: string, permanent: boolean = false): Response {
    return new Response(null, {
      status: permanent ? 301 : 302,
      headers: {
        'Location': url,
      },
    })
  }
}

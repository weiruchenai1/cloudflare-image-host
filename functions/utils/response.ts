// functions/utils/response.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function successResponse<T>(data: T, message?: string): Response {
  return new Response(JSON.stringify({
    success: true,
    data,
    message
  } satisfies ApiResponse<T>), {
    headers: CORS_HEADERS
  });
}

export function errorResponse(message: string, status: number = 400, code?: string): Response {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    code
  } satisfies ApiResponse), {
    status,
    headers: CORS_HEADERS
  });
}

export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

export function forbiddenResponse(message: string = 'Forbidden'): Response {
  return errorResponse(message, 403, 'FORBIDDEN');
}

export function notFoundResponse(message: string = 'Not found'): Response {
  return errorResponse(message, 404, 'NOT_FOUND');
}

export function validationErrorResponse(message: string, field?: string): Response {
  return errorResponse(message, 422, field ? `VALIDATION_ERROR_${field.toUpperCase()}` : 'VALIDATION_ERROR');
}

export function serverErrorResponse(message: string = 'Internal server error'): Response {
  return errorResponse(message, 500, 'INTERNAL_ERROR');
}

export function conflictResponse(message: string = 'Resource already exists'): Response {
  return errorResponse(message, 409, 'CONFLICT');
}

export function rateLimitResponse(message: string = 'Rate limit exceeded'): Response {
  return errorResponse(message, 429, 'RATE_LIMIT');
}
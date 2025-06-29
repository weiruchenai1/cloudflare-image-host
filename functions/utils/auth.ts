// functions/utils/auth.ts
export async function generateJWT(payload: any, secret: string, expiresInHours: number = 24): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + (expiresInHours * 60 * 60)
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/[=]/g, '');
  const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/[=]/g, '');
  
  const signature = await sign(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    
    const expectedSignature = await sign(`${header}.${payload}`, secret);
    if (signature !== expectedSignature) return null;
    
    const decodedPayload = JSON.parse(atob(payload));
    
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    
    return decodedPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/[=]/g, '');
}

export function extractUserFromRequest(request: Request): any | null {
  return (request as any).user || null;
}
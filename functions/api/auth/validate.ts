interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenData = await env.IMAGE_HOST_KV.get(`token:${token}`);
    
    if (!tokenData) {
      return new Response('Invalid token', { status: 401 });
    }

    const { userId } = JSON.parse(tokenData);
    const userData = await env.IMAGE_HOST_KV.get(`user:${userId}`);
    
    if (!userData) {
      return new Response('User not found', { status: 404 });
    }

    const user = JSON.parse(userData);
    delete user.password;

    return new Response(JSON.stringify({
      success: true,
      user
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Validate token error:', error);
    return new Response('Token validation failed', { status: 500 });
  }
};

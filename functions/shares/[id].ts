interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { request, env, params } = context;
    const shareId = params.id as string;
    
    // 验证用户身份
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

    // 查找分享记录
    const shareData = await env.IMAGE_HOST_KV.get(`user_share:${userId}:${shareId}`);
    if (!shareData) {
      return new Response('分享不存在', { status: 404 });
    }

    const share = JSON.parse(shareData);

    // 删除分享记录
    await env.IMAGE_HOST_KV.delete(`share:${share.token}`);
    await env.IMAGE_HOST_KV.delete(`user_share:${userId}:${shareId}`);

    return new Response(JSON.stringify({
      success: true,
      message: '分享已删除'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete share error:', error);
    return new Response('删除分享失败', { status: 500 });
  }
};

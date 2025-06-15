// functions/api/stats/dashboard.ts
interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
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

    // 这里应该从数据库获取真实的统计数据
    // 现在返回模拟数据
    const stats = {
      totalFiles: 1284,
      totalShares: 156,
      todayViews: 2847,
      storageGrowth: '+12%',
      filesGrowth: '+8%',
      sharesGrowth: '+23%',
      viewsGrowth: '+15%'
    };

    return new Response(JSON.stringify({
      success: true,
      ...stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new Response('Failed to get dashboard stats', { status: 500 });
  }
};

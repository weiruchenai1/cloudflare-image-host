// 系统状态 API
export async function onRequestGet(context: {
  env: any;
}) {
  const { env } = context

  try {
    // 检查系统是否已初始化
    const systemConfig = await env.USERS_KV.get('system:config')
    
    const status = {
      initialized: !!systemConfig,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }

    return new Response(JSON.stringify({
      success: true,
      data: status
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('System status error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

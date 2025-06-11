interface Env {
  IMAGE_HOST_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;
    
    // 检查系统是否已初始化
    const isInitialized = await env.IMAGE_HOST_KV.get('system:initialized');
    
    // 获取系统设置
    let settings = null;
    if (isInitialized) {
      const settingsData = await env.IMAGE_HOST_KV.get('system:settings');
      if (settingsData) {
        settings = JSON.parse(settingsData);
      }
    }

    return new Response(JSON.stringify({
      initialized: !!isInitialized,
      settings: settings ? {
        siteName: settings.siteName,
        siteTitle: settings.siteTitle,
        allowRegistration: settings.allowRegistration,
        defaultLanguage: settings.defaultLanguage
      } : null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('System status error:', error);
    return new Response('Failed to get system status', { status: 500 });
  }
};

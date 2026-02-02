// index.js 完整跨域配置（替换原有跨域代码）
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const KV = env.CLOUD_DICT_KV;

    // ========== 完整跨域配置（解决Failed to fetch核心） ==========
    // 1. 处理所有OPTIONS预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*", // 允许所有域名跨域（GitHub Pages适配）
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // 允许的方法
          "Access-Control-Allow-Headers": "Content-Type, Origin, X-Requested-With", // 允许的请求头
          "Access-Control-Max-Age": "86400" // 预检请求缓存1天，减少请求
        }
      });
    }

    // 2. 给所有响应添加跨域头
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Origin, X-Requested-With"
    };

    // ========== 原有业务逻辑（追加写入接口） ==========
    if (path === '/append' && request.method === 'POST') {
      try {
        const { key, value } = await request.json();
        if (!key || value === undefined) {
          return new Response(JSON.stringify({
            code: -1,
            msg: "Key和Value不能为空！"
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json;charset=utf-8' }
          });
        }

        const oldDictStr = await KV.get('cloud_dict') || '{}';
        const oldDict = JSON.parse(oldDictStr);
        oldDict[key] = value;
        await KV.put('cloud_dict', JSON.stringify(oldDict, null, 2));

        return new Response(JSON.stringify({
          code: 0,
          msg: `成功写入云字典！新增/更新：${key} = ${value}`,
          dict: oldDict
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json;charset=utf-8' }
        });
      } catch (e) {
        return new Response(JSON.stringify({
          code: -1,
          msg: `写入失败：${e.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json;charset=utf-8' }
        });
      }
    }

    // 读取字典接口（也加跨域头）
    if (path === '/getDict' && request.method === 'GET') {
      const dictStr = await KV.get('cloud_dict') || '{}';
      const dict = JSON.parse(dictStr);
      return new Response(JSON.stringify({
        code: 0,
        msg: "读取成功",
        dict: dict
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json;charset=utf-8' }
      });
    }

    // 默认响应（加跨域头）
    return new Response(`
      云字典API使用说明：
      1. 追加写入：POST /append → {"key":"xxx","value":"xxx"}
      2. 读取字典：GET /getDict
    `, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain;charset=utf-8' }
    });
  }
};

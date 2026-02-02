// index.js（终极跨域版，无任何遗漏）
export default {
  async fetch(request, env) {
    // 1. 全局跨域头（所有响应都加）
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "600",
      "Content-Type": "application/json;charset=utf-8"
    };

    // 2. 处理所有OPTIONS预检请求（直接返回204）
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const KV = env.CLOUD_DICT_KV;

      // 3. 追加写入接口（核心）
      if (path === '/append' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})); // 兼容空请求体
        const { key, value } = body;
        
        if (!key || value === undefined) {
          return new Response(JSON.stringify({
            code: -1,
            msg: "Key和Value不能为空！"
          }), { status: 400, headers: corsHeaders });
        }

        // KV操作逻辑（极简版，减少报错）
        const oldDict = JSON.parse(await KV.get('cloud_dict') || '{}');
        oldDict[key] = value;
        await KV.put('cloud_dict', JSON.stringify(oldDict));

        return new Response(JSON.stringify({
          code: 0,
          msg: `写入成功：${key}=${value}`,
          dict: oldDict
        }), { headers: corsHeaders });
      }

      // 4. 读取接口
      if (path === '/getDict' && request.method === 'GET') {
        const dict = JSON.parse(await KV.get('cloud_dict') || '{}');
        return new Response(JSON.stringify({
          code: 0,
          dict: dict
        }), { headers: corsHeaders });
      }

      // 5. 兜底响应
      return new Response(JSON.stringify({
        code: -2,
        msg: "接口不存在，仅支持 /append(POST) 和 /getDict(GET)"
      }), { status: 404, headers: corsHeaders });

    } catch (e) {
      // 6. 捕获所有异常（返回具体错误）
      return new Response(JSON.stringify({
        code: -1,
        msg: `Worker内部错误：${e.message}`,
        stack: e.stack || '' // 调试用，上线可删除
      }), { status: 500, headers: corsHeaders });
    }
  }
};

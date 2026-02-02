// index.js（基于官方示例改造，可直接部署）
export default {
  async fetch(request, env) {
    // 全局跨域头（解决GitHub Pages调用的跨域问题）
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json;charset=utf-8"
    };

    // 1. 处理OPTIONS预检请求（跨域必备）
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const KV = env.KV; // 和wrangler.jsonc中的binding对应

    try {
      // ========== 基于官方示例的API封装 ==========
      // 2. 写入KV（对应官方env.KV.put）
      if (path === '/put' && request.method === 'POST') {
        const { key, value } = await request.json();
        if (!key || !value) {
          return new Response(JSON.stringify({
            code: -1,
            msg: "Key和Value不能为空"
          }), { headers: corsHeaders, status: 400 });
        }
        await KV.put(key, value); // 官方put操作
        return new Response(JSON.stringify({
          code: 0,
          msg: `成功写入：${key} = ${value}`
        }), { headers: corsHeaders });
      }

      // 3. 读取KV（对应官方env.KV.get）
      if (path === '/get' && request.method === 'GET') {
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response(JSON.stringify({
            code: -1,
            msg: "请传入key参数（如/get?key=手机号）"
          }), { headers: corsHeaders, status: 400 });
        }
        const value = await KV.get(key); // 官方get操作
        return new Response(JSON.stringify({
          code: 0,
          key: key,
          value: value || "Key不存在"
        }), { headers: corsHeaders });
      }

      // 4. 列出所有KV（对应官方env.KV.list）
      if (path === '/list' && request.method === 'GET') {
        const allKeys = await KV.list(); // 官方list操作
        // 读取所有Key的对应值（增强官方示例）
        const keyValueMap = {};
        for (const keyInfo of allKeys.keys) {
          keyValueMap[keyInfo.name] = await KV.get(keyInfo.name);
        }
        return new Response(JSON.stringify({
          code: 0,
          allKeys: allKeys.keys.map(k => k.name),
          keyValueMap: keyValueMap
        }), { headers: corsHeaders });
      }

      // 5. 删除KV（对应官方env.KV.delete）
      if (path === '/delete' && request.method === 'POST') {
        const { key } = await request.json();
        if (!key) {
          return new Response(JSON.stringify({
            code: -1,
            msg: "请传入要删除的key"
          }), { headers: corsHeaders, status: 400 });
        }
        await KV.delete(key); // 官方delete操作
        return new Response(JSON.stringify({
          code: 0,
          msg: `成功删除Key：${key}`
        }), { headers: corsHeaders });
      }

      // 6. 官方示例默认逻辑（访问根路径时执行）
      // 写入测试数据 → 读取 → 列出 → 删除（和官方示例一致）
      await KV.put('TEST_KEY', 'TEST_VALUE');
      const testValue = await KV.get('TEST_KEY');
      const testAllKeys = await KV.list();
      await KV.delete('TEST_KEY');

      return new Response(
        JSON.stringify({
          msg: "官方示例执行完成",
          testValue: testValue,
          testAllKeys: testAllKeys
        }),
        { headers: corsHeaders }
      );

    } catch (e) {
      // 错误捕获（返回具体原因）
      return new Response(JSON.stringify({
        code: -1,
        msg: `执行失败：${e.message}`
      }), { headers: corsHeaders, status: 500 });
    }
  }
};

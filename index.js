// Cloudflare Worker 服务端代码（无任何前端DOM逻辑）
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const KV = env.CLOUD_DICT_KV; // 绑定的KV命名空间（ID：62fce0fa428b4eb7a6ded0fc9f845086）

    // 处理OPTIONS预检请求（解决跨域）
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // 1. 读取所有字典数据（GET /get）
    if (path === '/get' && request.method === 'GET') {
      const dictStr = await KV.get('cloud_dict') || '{}';
      return new Response(dictStr, {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 2. 写入/修改字典项（POST /set）
    if (path === '/set' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { key, value } = body;
        
        if (!key || value === undefined) {
          return new Response(JSON.stringify({ code: -1, msg: '缺少key或value' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // 读取现有字典 → 修改 → 存回KV
        const dictStr = await KV.get('cloud_dict') || '{}';
        const dict = JSON.parse(dictStr);
        dict[key] = value;
        await KV.put('cloud_dict', JSON.stringify(dict, null, 2));

        return new Response(JSON.stringify({ 
          code: 0, 
          msg: '修改成功', 
          data: dict 
        }), {
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          code: -1, 
          msg: `操作失败：${e.message}` 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 3. 删除字典项（POST /delete）
    if (path === '/delete' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { key } = body;
        
        if (!key) {
          return new Response(JSON.stringify({ code: -1, msg: '缺少key' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const dictStr = await KV.get('cloud_dict') || '{}';
        const dict = JSON.parse(dictStr);
        delete dict[key];
        await KV.put('cloud_dict', JSON.stringify(dict, null, 2));

        return new Response(JSON.stringify({ 
          code: 0, 
          msg: '删除成功', 
          data: dict 
        }), {
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          code: -1, 
          msg: `操作失败：${e.message}` 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 默认返回API说明
    return new Response(`
      云字典API使用说明：
      1. 读取字典：GET /get
      2. 写入/修改：POST /set → {"key":"xxx","value":"xxx"}
      3. 删除项：POST /delete → {"key":"xxx"}
    `, {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

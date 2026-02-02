// index.js（支持追加写入云字典）
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const KV = env.CLOUD_DICT_KV; // 你的KV命名空间

    // 跨域预检处理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // 1. 追加写入云字典（核心接口）
    if (path === '/append' && request.method === 'POST') {
      try {
        // 接收前端传入的key和value
        const { key, value } = await request.json();
        if (!key || value === undefined) {
          return new Response(JSON.stringify({
            code: -1,
            msg: "Key和Value不能为空！"
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // 读取现有云字典（无则初始化空对象）
        const oldDictStr = await KV.get('cloud_dict') || '{}';
        const oldDict = JSON.parse(oldDictStr);
        
        // 追加/覆盖Key-Value（核心：追加逻辑）
        oldDict[key] = value;
        
        // 存回KV（格式化JSON，便于查看）
        await KV.put('cloud_dict', JSON.stringify(oldDict, null, 2));

        return new Response(JSON.stringify({
          code: 0,
          msg: `成功写入云字典！新增/更新：${key} = ${value}`,
          dict: oldDict // 返回最新完整字典
        }), {
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({
          code: -1,
          msg: `写入失败：${e.message}`
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 2. 读取完整云字典
    if (path === '/getDict' && request.method === 'GET') {
      const dictStr = await KV.get('cloud_dict') || '{}';
      const dict = JSON.parse(dictStr);
      return new Response(JSON.stringify({
        code: 0,
        msg: "读取成功",
        dict: dict
      }), {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 默认返回说明
    return new Response(`
      云字典追加写入API：
      1. 追加写入：POST /append → {"key":"手机号","value":"13800138000"}
      2. 读取字典：GET /getDict
    `, {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

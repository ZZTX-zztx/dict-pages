// 绑定KV命名空间（后续部署时需关联）
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const KV = env.CLOUD_DICT_KV; // 对应KV命名空间的绑定名称

    // 1. 读取字典（GET请求）
    if (path === '/get' && request.method === 'GET') {
      const dictStr = await KV.get('cloud_dict') || '{}';
      return new Response(dictStr, {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': '*' // 允许跨域
        }
      });
    }

    // 2. 修改/新增字典项（POST请求）
    if (path === '/set' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { key, value } = body;
        if (!key || value === undefined) {
          return new Response(JSON.stringify({ code: -1, msg: '缺少key或value' }), { status: 400 });
        }

        // 读取现有字典 → 修改 → 存回KV
        const dictStr = await KV.get('cloud_dict') || '{}';
        const dict = JSON.parse(dictStr);
        dict[key] = value; // 新增/覆盖key
        await KV.put('cloud_dict', JSON.stringify(dict, null, 2));

        return new Response(JSON.stringify({ code: 0, msg: '修改成功', data: dict }), {
          headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ code: -1, msg: e.message }), { status: 500 });
      }
    }

    // 3. 删除字典项（POST请求）
    if (path === '/delete' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { key } = body;
        if (!key) {
          return new Response(JSON.stringify({ code: -1, msg: '缺少key' }), { status: 400 });
        }

        const dictStr = await KV.get('cloud_dict') || '{}';
        const dict = JSON.parse(dictStr);
        delete dict[key]; // 删除key
        await KV.put('cloud_dict', JSON.stringify(dict, null, 2));

        return new Response(JSON.stringify({ code: 0, msg: '删除成功', data: dict }), {
          headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ code: -1, msg: e.message }), { status: 500 });
      }
    }

    // 默认返回帮助信息
    return new Response(`
      云字典API使用说明：
      1. 读取字典：GET /get
      2. 修改/新增项：POST /set → {"key": "xxx", "value": "xxx"}
      3. 删除项：POST /delete → {"key": "xxx"}
    `, { headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
  }
};

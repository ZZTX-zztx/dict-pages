// 配置后端API地址（后续绑定你的自定义域名，当前先用Worker原始域名测试）
const API_BASE_URL = "https://dict-pages.3809026566.workers.dev"; // 替换为你的Worker原始域名

// DOM元素
const keyInput = document.getElementById("key");
const valueInput = document.getElementById("value");
const btnSet = document.getElementById("btn-set");
const btnDelete = document.getElementById("btn-delete");
const btnGet = document.getElementById("btn-get");
const resultPre = document.getElementById("result");

// 工具函数：格式化JSON显示
function formatJson(jsonStr) {
    try {
        return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch (e) {
        return jsonStr;
    }
}

// 工具函数：显示结果
function showResult(content, isError = false) {
    resultPre.textContent = content;
    resultPre.className = isError ? "error" : "success";
}

// 写入/修改KV
btnSet.addEventListener("click", async () => {
    const key = keyInput.value.trim();
    const value = valueInput.value.trim();

    if (!key) {
        showResult("错误：Key不能为空！", true);
        return;
    }

    // 尝试解析Value（支持JSON格式）
    let parsedValue;
    try {
        parsedValue = JSON.parse(value);
    } catch (e) {
        parsedValue = value; // 非JSON格式直接作为字符串
    }

    try {
        showResult("正在写入...");
        const response = await fetch(`${API_BASE_URL}/set`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ key, value: parsedValue }),
        });

        const data = await response.json();
        if (data.code === 0) {
            showResult(`写入成功！\n当前字典：\n${formatJson(JSON.stringify(data.data))}`);
        } else {
            showResult(`写入失败：${data.msg}`, true);
        }
    } catch (e) {
        showResult(`网络错误：${e.message}`, true);
    }
});

// 删除KV
btnDelete.addEventListener("click", async () => {
    const key = keyInput.value.trim();
    if (!key) {
        showResult("错误：请输入要删除的Key！", true);
        return;
    }

    try {
        showResult("正在删除...");
        const response = await fetch(`${API_BASE_URL}/delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ key }),
        });

        const data = await response.json();
        if (data.code === 0) {
            showResult(`删除成功！\n当前字典：\n${formatJson(JSON.stringify(data.data))}`);
        } else {
            showResult(`删除失败：${data.msg}`, true);
        }
    } catch (e) {
        showResult(`网络错误：${e.message}`, true);
    }
});

// 查看所有KV
btnGet.addEventListener("click", async () => {
    try {
        showResult("正在读取...");
        const response = await fetch(`${API_BASE_URL}/get`);
        const data = await response.json();
        showResult(`当前云字典：\n${formatJson(JSON.stringify(data))}`);
    } catch (e) {
        showResult(`读取失败：${e.message}`, true);
    }
});

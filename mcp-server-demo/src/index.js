const express = require('express');
const app = express();

// 启用 JSON 解析中间件（处理 MCP 的 JSON 请求）
app.use(express.json());

/**
 * 核心 MCP 接口处理逻辑
 * 兼容 MCP 协议标准参数结构，修复「工具名不能为空」问题
 */
app.post('/mcp', (req, res) => {
  try {
    const requestData = req.body;
    
    // 1. 格式化日志时间（便于调试）
    const currentTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    console.log(`[${currentTime}] 收到 MCP 请求：`, JSON.stringify(requestData, null, 2));

    // 2. 处理 MCP 通知（无 id 字段，无需返回响应）
    if (typeof requestData.id === 'undefined') {
      console.log(`[${currentTime}] 处理 MCP 通知，无需响应`);
      return res.end(); // 直接结束响应，避免 204 兼容性问题
    }

    // 3. 处理 MCP 初始化方法（握手必备）
    if (requestData.method === 'initialize') {
      return res.json({
        jsonrpc: "2.0",
        id: requestData.id,
        result: {
          protocolVersion: "2025-11-25", // 与 Claude Code 保持一致
          capabilities: { "tools": {} }, // 声明支持工具调用
          serverInfo: { name: "local-mcp-demo", version: "1.0.0" }
        }
      });
    }

    // 4. 处理 MCP 健康检查（ping 方法）
    if (requestData.method === 'ping') {
      return res.json({
        jsonrpc: "2.0",
        id: requestData.id,
        result: {} // ping 仅需返回空结果
      });
    }

    // 5. 处理工具列表查询（tools/list）
    if (requestData.method === 'tools/list') {
      return res.json({
        jsonrpc: "2.0",
        id: requestData.id,
        result: {
          tools: [
            {
              name: "generate_code", // 工具名，MCP 协议标准字段为 name
              description: "根据用户需求生成自定义代码",
              inputSchema: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    description: "代码生成的需求描述（如：生成冒泡排序函数）"
                  }
                },
                required: ["prompt"] // 必填参数
              }
            }
          ]
        }
      });
    }

    // 6. 处理工具调用（tools/call，核心业务逻辑）
    if (requestData.method === 'tools/call') {
      // 兼容 MCP 协议标准参数结构：工具名是 name，不是 toolName
      const params = requestData.params || {};
      const toolName = params.name; // 取 MCP 协议标准的 name 字段
      const args = params.arguments || params.args || {};

      // 校验工具名
      if (!toolName) {
        return res.status(400).json({
          jsonrpc: "2.0",
          id: requestData.id,
          error: { code: -32602, message: "工具名不能为空" }
        });
      }

      // 处理 generate_code 工具
      if (toolName === 'generate_code') {
        // 校验必填参数
        const userPrompt = args?.prompt || '生成一个 JavaScript 基础函数';
        
        // 自定义代码生成逻辑（可替换为对接本地模型/其他API）
        const customCode = generateCodeByPrompt(userPrompt);
        
        // 返回符合 MCP 协议的响应
        return res.json({
          jsonrpc: "2.0",
          id: requestData.id,
          result: {
            content: [{ 
              type: "text", 
              text: `
【本地 MCP 服务响应】
需求：${userPrompt}
生成的代码：
\`\`\`javascript
${customCode}
\`\`\`
              ` 
            }]
          }
        });
      }

      // 工具名不存在
      return res.status(400).json({
        jsonrpc: "2.0",
        id: requestData.id,
        error: { code: -32602, message: `未找到工具：${toolName}` }
      });
    }

    // 7. 处理未识别的方法
    return res.status(400).json({
      jsonrpc: "2.0",
      id: requestData.id,
      error: { code: -32601, message: `未支持的 MCP 方法：${requestData.method}` }
    });

  } catch (error) {
    // 全局异常捕获，避免服务崩溃
    console.error(`[${new Date().toLocaleString()}] MCP 服务异常：`, error);
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body.id || null,
      error: { code: -1, message: `服务端异常：${error.message}` }
    });
  }
});

/**
 * 自定义代码生成函数（根据用户 prompt 动态生成代码）
 */
function generateCodeByPrompt(prompt) {
  // 示例：根据关键词匹配生成对应代码
  if (prompt.includes("冒泡排序")) {
    return `// 冒泡排序函数
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // 交换元素
      }
    }
  }
  return arr;
}

// 使用示例
const testArr = [5, 2, 9, 1, 5, 6];
console.log("排序前：", testArr);
console.log("排序后：", bubbleSort(testArr));`;
  } else if (prompt.includes("读取文件")) {
    return `// 读取文件内容（Node.js）
const fs = require('fs').promises;

async function readFileContent(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    console.log("文件内容：", content);
    return content;
  } catch (err) {
    console.error("读取文件失败：", err.message);
    return null;
  }
}

// 使用示例
readFileContent('./test.txt');`;
  } else {
    // 默认代码
    return `// 基础函数示例
function customFunction() {
  console.log("Hello from Local MCP Server!");
  console.log("用户需求：${prompt}");
  return "自定义代码逻辑";
}`;
  }
}

// 启动服务，监听 6060 端口
const PORT = 6060;
app.listen(PORT, '0.0.0.0', () => {
  const startTime = new Date().toLocaleString('zh-CN');
  console.log(`[${startTime}] Node.js MCP 服务已启动`);
  console.log(`[${startTime}] 监听地址：http://127.0.0.1:${PORT}/mcp`);
});

// 捕获进程退出信号，优雅关闭服务
process.on('SIGINT', () => {
  console.log("\nMCP 服务正在关闭...");
  process.exit(0);
});
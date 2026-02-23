const express = require('express');
const app = express();
app.use(express.json());

app.post('/mcp', (req, res) => {
  try {
    const requestData = req.body;
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

    // 1. 处理 MCP 通知（Notification）：没有 id，不需要响应
    if (requestData.id === undefined) {
      console.log(`[${currentTime}] 收到 MCP 通知：`, requestData.method);
      return res.status(204).send(); // 返回 204 No Content
    }

    // 2. 处理 MCP 协议的 initialize 方法
    if (requestData.method === 'initialize') {
      return res.json({
        jsonrpc: "2.0",
        id: requestData.id,
        result: {
          protocolVersion: "2025-11-25",
          capabilities: {
            "tools": {}
          },
          serverInfo: {
            name: "local-mcp-demo",
            version: "1.0.0"
          }
        }
      });
    }

    // 3. 处理 MCP 协议的 ping 方法（健康检查）
    if (requestData.method === 'ping') {
      return res.json({
        jsonrpc: "2.0",
        id: requestData.id,
        result: {} // ping 方法只需要返回一个空对象
      });
    }

    // 4. 处理 MCP 协议的 tools/list 方法
    if (requestData.method === 'tools/list') {
      return res.json({
        jsonrpc: "2.0",
        id: requestData.id,
        result: {
          tools: [
            {
              name: "generate_code",
              description: "生成自定义代码",
              inputSchema: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    description: "代码生成的需求描述"
                  }
                },
                required: ["prompt"]
              }
            }
          ]
        }
      });
    }

    // 5. 处理 MCP 协议的 tools/call 方法
    if (requestData.method === 'tools/call') {
      const { toolName, arguments: args } = requestData.params;
      
      if (toolName === 'generate_code') {
        const userPrompt = args.prompt || '生成一个排序函数';
        const customResponse = `
【Node.js 本地 MCP (6060端口) 响应】
你要求生成的代码：${userPrompt}
这是本地自定义生成的代码：
\`\`\`javascript
function customSolution() {
  console.log("Hello from Local Node.js MCP!");
  return "基于你的提问生成的自定义逻辑";
}
\`\`\`
        `;

        return res.json({
          jsonrpc: "2.0",
          id: requestData.id,
          result: {
            content: [{ type: "text", text: customResponse }]
          }
        });
      }
    }

    // 6. 处理其他未识别的方法
    res.status(400).json({
      jsonrpc: "2.0",
      id: requestData.id,
      error: {
        code: -32601,
        message: `Method not found: ${requestData.method}`
      }
    });

  } catch (error) {
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body.id || null,
      error: {
        code: -1,
        message: `本地 MCP 服务出错：${error.message}`
      }
    });
  }
});

const PORT = 6060;
app.listen(PORT, '0.0.0.0', () => {
  const startTime = new Date().toLocaleString('zh-CN');
  console.log(`[${startTime}] Node.js 本地 MCP 服务已启动，监听端口：${PORT}`);
  console.log(`[${startTime}] 端点地址：http://127.0.0.1:${PORT}/mcp`);
});
# 真实 AI 接入说明

## 启动方式

复制 `.env.example` 为 `.env.local`，填入你的 OpenAI API Key：

```powershell
Copy-Item .env.example .env.local
notepad .env.local
.\start-web.ps1
```

打开：

```text
http://127.0.0.1:4188/
```

## 工作模式

- 没有 `OPENAI_API_KEY`：使用本地 demo 模板，适合演示流程。
- `OPENAI_BASE_URL=https://api.openai.com/v1`：调用 OpenAI Responses API 做视觉诊断。
- `OPENAI_BASE_URL` 配置为第三方 OpenAI-compatible 地址：调用 `/chat/completions` 做视觉诊断。
- OpenAI 调用失败：自动回退本地 demo 模板，前端仍可用。

## 第三方接口配置

如果使用第三方兼容接口，把 `.env.local` 改成类似：

```text
OPENAI_API_KEY=你的实际密钥
OPENAI_BASE_URL=https://api.example.com/v1
OPENAI_IMAGE_DIAGNOSIS_MODEL=你的视觉模型名
OPENAI_IMAGE_GENERATION_MODEL=gpt-image-2
REFERENCE_IMAGE_MAX=2
AI_TIMEOUT_MS=90000
PORT=4188
```

注意：不要把真实 API Key 提交到代码仓库，也不要写入文档。

## 安全边界

后端提示词禁止模型推断年龄、种族、健康、面相、命运、宗教、政治等敏感属性。报告评分只代表商务场景中的信任感和专业表达完整度，不是颜值评分。

正式上线前还需要：

- 图片上传到对象存储，不要长期放在服务器本地。
- 给图片设置自动过期删除。
- 增加隐私政策、用户授权和删除入口。
- 增加微信登录、风控、频率限制和日志脱敏。

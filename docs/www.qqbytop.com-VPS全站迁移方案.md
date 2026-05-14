# www.qqbytop.com VPS 全站迁移方案

日期：2026-05-11  
目标：将 `www.qqbytop.com` / `qqbytop.com` 从 Vercel 正式环境迁移到国内已备案 VPS，保留 Vercel 作为预览与回滚备用。

## 1. 迁移结论

可以迁移，且当前决策是：

```text
www.qqbytop.com / qqbytop.com
  -> 国内 VPS
  -> Next.js 主站
  -> 现有诊断工具前端
  -> 高考英语作文诊断工具前端
  -> FastAPI /api/v1
  -> 支付 webhook
  -> Redis / 队列 worker
```

Vercel 保留用途：

- 预览环境。
- 临时回滚环境。
- 非大陆支付链路的备用部署。

正式支付链路不再依赖 Vercel。

## 2. 迁移原则

- 不改变现有业务 URL，用户仍访问 `https://www.qqbytop.com/...`。
- 不先切 DNS。必须先在 VPS 上用测试域名或 hosts 验证完整站点。
- 不把高考作文诊断支付页放在 Vercel。
- 不把 FastAPI 业务逻辑塞进 Next.js API routes。
- 不让图片上传流量穿过 VPS，作文图片仍走云存储预签名直传。
- Vercel 保留 7-14 天，DNS 切换后观察稳定再决定是否下线。

## 3. 目标拓扑

```text
Internet
  -> DNS: www.qqbytop.com / qqbytop.com
  -> VPS 公网 IP
  -> Nginx 或 Caddy: 80/443, TLS, gzip/brotli, 反向代理
      -> 127.0.0.1:3000  Next.js 主站
      -> 127.0.0.1:8000  FastAPI /api/v1/*
      -> 127.0.0.1:8000  支付 webhook
  -> Redis: 127.0.0.1:6379
  -> Worker: Celery/RQ 后台任务
  -> Supabase/云数据库 或 国内云 PostgreSQL
  -> 腾讯云 COS/阿里云 OSS/对象存储
  -> OpenAI/OCR/支付渠道
```

## 4. VPS 基础配置

推荐首版配置：

```text
系统：Ubuntu 24.04 LTS
规格：4核 8GB / 120GB SSD / 200Mbps
开放端口：80, 443
SSH：22 仅允许固定 IP 或使用密钥登录
```

正式部署基线：

```text
应用层：单台 4核8GB VPS
图片上传：腾讯云 COS 或 S3 兼容对象存储，浏览器预签名直传
业务数据库：托管 PostgreSQL，不部署在 VPS 本机
AI/OCR：外部 API，不在 VPS 本机跑模型
```

这台 VPS 只承担 Next.js、FastAPI、Nginx/Caddy、Redis、worker 和支付 webhook。不要把业务 PostgreSQL、用户图片原文件或模型推理进程放在同一台机器上。

基础软件：

```bash
sudo apt update
sudo apt install -y git curl ufw nginx redis-server
```

Node.js 建议使用 22 LTS 或项目兼容版本。当前项目依赖：

```text
Next.js 16.2.4
React 19.2.5
TypeScript 5.9.3
```

Python 后端按高考作文诊断 PRD 另行部署：

```text
Python 3.11+
FastAPI
Uvicorn/Gunicorn
Celery 或 RQ
Redis
```

## 5. Next.js 部署方式

仓库目录建议：

```text
/opt/qqbytop/next-vercel
```

部署命令：

```bash
cd /opt/qqbytop/next-vercel
npm ci
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

生产环境不要使用 `npm run dev`。

建议使用 systemd 管理 Next.js：

```ini
[Unit]
Description=qqbytop Next.js
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/qqbytop/next-vercel
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
```

文件建议保存为：

```text
/etc/systemd/system/qqbytop-next.service
```

## 6. FastAPI 部署方式

高考作文诊断后端建议目录：

```text
/opt/qqbytop/gaokao-essay-backend
```

运行端口：

```text
127.0.0.1:8000
```

健康检查：

```text
GET /api/v1/health
```

FastAPI 也使用 systemd 管理，队列 worker 独立 systemd 服务。支付 webhook、智能申诉、退款、诊断任务不得依赖 Next.js 进程。

## 7. Nginx 路由

推荐路由：

```text
/                 -> Next.js 127.0.0.1:3000
/api/v1/*         -> FastAPI 127.0.0.1:8000
/webhooks/*       -> FastAPI 127.0.0.1:8000
```

Nginx 示例：

```nginx
server {
    listen 80;
    server_name qqbytop.com www.qqbytop.com;
    return 301 https://www.qqbytop.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name qqbytop.com;
    return 301 https://www.qqbytop.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.qqbytop.com;

    # ssl_certificate     /etc/letsencrypt/live/www.qqbytop.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/www.qqbytop.com/privkey.pem;

    client_max_body_size 8m;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:8000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhooks/ {
        proxy_pass http://127.0.0.1:8000/webhooks/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 8. 当前仓库特殊风险点

当前 `next.config.ts` 包含这些 rewrite：

```text
/tools/ielts-api/:path* -> Ielts API Base URL
/tools/business-image -> /tools/business-image/index.html
/tools/product-copy-compliance-checker/* -> cross-border-copy-compliance-diagno.vercel.app
```

迁移前必须检查：

- `IELTS_API_BASE_URL` 在 VPS 环境中是否配置正确。
- `/tools/business-image/index.html` 在 `public/` 或对应静态目录中是否存在。
- `product-copy-compliance-checker` 仍反代到一个 Vercel 项目；若全站要求完全脱离 Vercel，这一组工具需要后续独立迁移。
- 如果反代外部 Vercel 应用，国内访问速度和可用性仍可能受影响。

## 9. 环境变量

VPS 上必须独立维护 `.env.production` 或 systemd EnvironmentFile。

至少包含：

```text
NODE_ENV=production
IELTS_API_BASE_URL=http://127.0.0.1:8000
GAOKAO_ESSAY_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=https://www.qqbytop.com
ALLOWED_CORS_ORIGINS=https://www.qqbytop.com,https://qqbytop.com
```

密钥类变量不得写入前端公开变量：

```text
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYMENT_MCH_SECRET_*
PAYMENT_PRIVATE_KEY_*
```

## 10. DNS 切换步骤

切换前：

1. VPS 部署完成。
2. `npm run typecheck` 通过。
3. `npm run build` 通过。
4. `systemctl status qqbytop-next` 正常。
5. FastAPI `/api/v1/health` 正常。
6. Nginx HTTPS 正常。
7. 用本机 hosts 将 `www.qqbytop.com` 指到 VPS IP，完整访问测试通过。
8. 支付测试商户号或沙箱回调测试通过。

切换时：

1. 降低 DNS TTL，例如 300 秒。
2. 将 `www.qqbytop.com` A 记录切到 VPS IP。
3. 将 `qqbytop.com` A 记录切到 VPS IP，或继续 301 到 `www`。
4. 观察 Nginx access/error log、Next.js log、FastAPI log。
5. 保留 Vercel 部署，不立即删除。

回滚：

1. DNS A 记录切回 Vercel 原配置。
2. 或临时将 Nginx `/` 反代到 Vercel 域名。
3. 保留 VPS 日志用于排查。

## 11. 上线验收清单

- [ ] 首页可访问。
- [ ] 服务页可访问。
- [ ] 诊断工具列表可访问。
- [ ] 雅思口语工具可访问。
- [ ] 雅思写作工具可访问。
- [ ] 海外商务形象诊断工具可访问。
- [ ] 跨境商品文案合规工具 rewrite 行为符合预期。
- [ ] 高考英语作文诊断入口可访问。
- [ ] `/api/v1/health` 可访问。
- [ ] 支付页在 `www.qqbytop.com` 域名下。
- [ ] 支付 webhook 可从公网访问并验签。
- [ ] 图片上传仍走云存储预签名 URL，不穿透 VPS。
- [ ] 404、500 页面正常。
- [ ] HTTPS 证书正常续期。
- [ ] Nginx、Next.js、FastAPI、worker、Redis 均配置自动重启。
- [ ] Vercel 保留为回滚备用。

## 12. 不建议立即做的事

- 不建议把数据库放在同一台 VPS 上，除非只是短期测试。
- 不建议把对象存储改成本机磁盘。
- 不建议迁移当天同时改大量业务代码。
- 不建议在未跑通支付沙箱或小额真实支付前正式投放。
- 不建议马上删除 Vercel 项目。

## 13. 建议执行顺序

1. 购买并初始化 4核8G VPS。
2. 配置安全组、防火墙、SSH 密钥。
3. 安装 Node.js、Nginx、Redis、Python 运行环境。
4. 部署 `next-vercel`，跑通 `typecheck/build/start`。
5. 配置 systemd 守护 Next.js。
6. 部署 FastAPI `/api/v1/health`。
7. 配置 Nginx HTTPS 和反向代理。
8. hosts 本地模拟 `www.qqbytop.com` 指向 VPS。
9. 全站页面验收。
10. 支付域名和 webhook 验收。
11. DNS 切换。
12. 观察 24-72 小时。
13. 再决定是否迁移仍反代到 Vercel 的外部工具。

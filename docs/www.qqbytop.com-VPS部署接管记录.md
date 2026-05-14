# www.qqbytop.com VPS 部署接管记录

日期：2026-05-12

## 服务器

```text
公网 IP：101.42.94.23
内网 IP：10.2.24.6
实例 ID：lhins-619pezrc
实例名称：Ubuntu-3zKH
地域：北京 / 北京七区
系统：Ubuntu 24.04.4 LTS
规格：4 核 CPU / 8GB 内存 / 120GB SSD
带宽：200Mbps 峰值
```

## 当前部署状态

```text
应用目录：/var/www/qqbytop-next
运行用户：ubuntu
进程管理：PM2
Web 入口：Nginx
Next.js 应用端口：127.0.0.1:3000
高考诊断 FastAPI 端口：127.0.0.1:8000
公网 HTTP/HTTPS：www.qqbytop.com / qqbytop.com
防火墙：仅放行 22 / 80 / 443
```

## 已完成

- 已配置 SSH 登录。
- 已安装 Nginx、Node.js、PM2、UFW。
- 已将 `qqbytop.com` 和 `www.qqbytop.com` 指向新 VPS，并经 Cloudflare 代理。
- 已启用 HTTPS。
- 已部署 Next.js 主站并通过 PM2 运行。
- 已确认 `https://www.qqbytop.com/zh/tools` 返回 `200 OK`。
- 已新增高考英语作文诊断工具前端、BFF 路由、FastAPI 后端、迁移 SQL、部署脚本和本地冒烟脚本。

## 高考诊断工具上线前阻塞项

以下内容必须在正式支付流量前完成：

- 托管 PostgreSQL 已创建，并执行 `backend/migrations/001_gaokao_essay.sql`。
- Redis 已可用，并按 `critical/default/low` 队列隔离 worker。
- COS 或 S3 兼容对象存储已配置，图片通过预签名 URL 直传。
- OCR provider 已接入真实服务。
- LLM provider key 已配置，`LLM_PROVIDER_ORDER` 不包含 mock。
- 微信/支付宝支付 provider 已接入，商户号与订单绑定，webhook 验签可用。
- `/var/www/qqbytop-next/.env.production` 已从 `.env.production.example` 创建，且 `NEXT_PUBLIC_GAOKAO_ESSAY_USE_BACKEND=true`。
- `/var/www/qqbytop-next/backend/.env` 已从 `backend/.env.production.example` 创建，设置 `ENVIRONMENT=production`，并通过 `scripts/verify-gaokao-production-readiness.ps1`。

部署脚本会在清空远端代码目录前临时备份 `.env.production` 和 `backend/.env`，解包后再恢复，避免部署时误删生产密钥。

## 部署命令

本地部署到 VPS：

```powershell
.\scripts\deploy-vps-gaokao.ps1
```

默认目标：

```text
ubuntu@101.42.94.23:/var/www/qqbytop-next
```

相关部署文件：

- `deploy/gaokao-essay/ecosystem.config.cjs`
- `deploy/gaokao-essay/nginx-qqbytop.conf`
- `scripts/deploy-vps-gaokao.ps1`
- `scripts/verify-gaokao-production-readiness.ps1`

## 验证命令

本地完整验证：

```powershell
npm run typecheck
npm run build
cd backend
uv run ruff check app tests
uv run pytest
```

BFF 冒烟：

```powershell
.\scripts\gaokao-bff-smoke.ps1
.\scripts\gaokao-bff-image-smoke.ps1
.\scripts\gaokao-bff-group-smoke.ps1
```

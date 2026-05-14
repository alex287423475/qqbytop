# Gaokao Essay FastAPI Backend

This backend implements the PRD route contract for the Gaokao English essay diagnostic tool.

## Local Development

```powershell
cd backend
uv sync --group dev
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
uv run ruff check app tests
uv run pytest
```

Local development intentionally uses mock adapters:

- `STORAGE_PROVIDER=mock_presigned`
- `OCR_PROVIDER=mock`
- `LLM_PROVIDER_ORDER=mock_deepseek,mock_qwen,mock_doubao`
- `PAYMENT_PROVIDER=mock`

## Production Baseline

Production must not run with mock adapters. `ENVIRONMENT=production` triggers fail-fast checks in `app.config.Settings.validate_runtime()`.

Required production services:

- Managed PostgreSQL: users, drafts, uploads, reports, orders, groups, support actions and analytics.
- Redis: `critical`, `default` and `low` queues.
- Object storage: Tencent COS or S3-compatible presigned PUT. User images must not transit through the VPS.
- OCR provider: Tencent OCR, Baidu handwriting OCR, Google Vision or equivalent.
- LLM providers: configured through `LLMRouter` with provider fallback. Production default is Tencent Cloud TokenHub with DeepSeek Flash/Pro model routing.
- Payment provider: verified WeChat/Alipay adapter with merchant-account binding and webhook signature verification.

Production `.env` minimum:

```env
ENVIRONMENT=production
DRAFT_TOKEN_SECRET=<long-random-secret>
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STORAGE_PROVIDER=cos
OCR_PROVIDER=tencent_ocr
LLM_PROVIDER_ORDER=tencent_tokenhub
PAYMENT_PROVIDER=wechat_alipay
COS_BUCKET=...
COS_REGION=ap-beijing
COS_SECRET_ID=...
COS_SECRET_KEY=...
TENCENT_TOKENHUB_API_KEY=...
TENCENT_TOKENHUB_BASE_URL=https://tokenhub.tencentmaas.com/v1
TENCENT_TOKENHUB_FREE_MODEL=deepseek-v4-flash
TENCENT_TOKENHUB_PAID_MODEL=deepseek-v4-pro
TENCENT_TOKENHUB_FALLBACK_MODEL=deepseek-v4-flash
SUPPORT_CHAT_LLM_ENABLED=false
SUPPORT_CHAT_LLM_MAX_INPUT_CHARS=500
SUPPORT_CHAT_LLM_TIMEOUT_SECONDS=8
```

Support chat is rule-first. Known payment, refund, OCR and product-rights questions are answered locally. If `SUPPORT_CHAT_LLM_ENABLED=true`, unmatched support questions may use the TokenHub/DeepSeek Flash model with sanitized and truncated input only; reports, images and payment-sensitive details must not be sent to the model.

Run readiness checks before starting paid traffic:

```powershell
.\scripts\verify-gaokao-production-readiness.ps1 -BackendEnvPath backend\.env
```

## Local Smoke

From the repo root, with Next.js on `127.0.0.1:3000` and FastAPI on `127.0.0.1:8000`:

```powershell
.\scripts\gaokao-bff-smoke.ps1
.\scripts\gaokao-bff-image-smoke.ps1
.\scripts\gaokao-bff-group-smoke.ps1
```

## VPS Deployment

Use the Gaokao-specific deploy script after the VPS has Node.js, PM2, Nginx and SSH access configured:

```powershell
.\scripts\deploy-vps-gaokao.ps1
```

The script packages the Next.js app and FastAPI backend, installs dependencies remotely, starts PM2 apps from `deploy/gaokao-essay/ecosystem.config.cjs`, and can install the Nginx template from `deploy/gaokao-essay/nginx-qqbytop.conf`.

If `backend/.env` is missing on the server, only the Next.js app is started; the FastAPI API is intentionally not started to avoid running paid flows with mock or incomplete production settings.

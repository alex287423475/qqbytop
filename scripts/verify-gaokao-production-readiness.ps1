param(
  [string]$BackendEnvPath = "backend/.env",
  [string]$FrontendEnvPath = ".env.production"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile([string]$Path) {
  $map = @{}
  if (!(Test-Path $Path)) {
    throw "Missing env file: $Path"
  }
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) { return }
    $key, $value = $line.Split("=", 2)
    $map[$key.Trim()] = $value.Trim()
  }
  return $map
}

$envMap = Read-EnvFile $BackendEnvPath
$errors = New-Object System.Collections.Generic.List[string]

function Is-BlankOrPlaceholder([string]$Value) {
  return !$Value -or $Value -match "replace|change-me|USER:PASSWORD|HOST|DBNAME"
}

$environment = if ($envMap.ContainsKey("ENVIRONMENT")) { $envMap["ENVIRONMENT"] } else { "" }
$storageProvider = if ($envMap.ContainsKey("STORAGE_PROVIDER")) { $envMap["STORAGE_PROVIDER"] } else { "" }
$ocrProvider = if ($envMap.ContainsKey("OCR_PROVIDER")) { $envMap["OCR_PROVIDER"] } else { "" }
$llmProviderOrder = if ($envMap.ContainsKey("LLM_PROVIDER_ORDER")) { $envMap["LLM_PROVIDER_ORDER"] } else { "" }
$paymentProvider = if ($envMap.ContainsKey("PAYMENT_PROVIDER")) { $envMap["PAYMENT_PROVIDER"] } else { "" }
$corsOrigins = if ($envMap.ContainsKey("CORS_ORIGINS")) { $envMap["CORS_ORIGINS"] } else { "" }
$repositoryProvider = if ($envMap.ContainsKey("REPOSITORY_PROVIDER")) { $envMap["REPOSITORY_PROVIDER"] } else { "" }

if ($environment -ne "production") { $errors.Add("ENVIRONMENT must be production.") }
if (Is-BlankOrPlaceholder $envMap["DATABASE_URL"]) { $errors.Add("DATABASE_URL is required.") }
if ($repositoryProvider -ne "postgres") { $errors.Add("REPOSITORY_PROVIDER must be postgres in production.") }
if (Is-BlankOrPlaceholder $envMap["REDIS_URL"]) { $errors.Add("REDIS_URL is required.") }
if (!$envMap["DRAFT_TOKEN_SECRET"] -or $envMap["DRAFT_TOKEN_SECRET"] -match "change-me|dev-only") { $errors.Add("DRAFT_TOKEN_SECRET must be a real secret.") }
if ($corsOrigins -match "\*") { $errors.Add("CORS_ORIGINS must not contain '*'.") }
if ($storageProvider -match "mock") { $errors.Add("STORAGE_PROVIDER must not be mock.") }
if ($ocrProvider -match "mock") { $errors.Add("OCR_PROVIDER must not be mock.") }
if ($llmProviderOrder -match "mock") { $errors.Add("LLM_PROVIDER_ORDER must not contain mock providers.") }
if ($paymentProvider -match "mock") { $errors.Add("PAYMENT_PROVIDER must not be mock.") }
if (Is-BlankOrPlaceholder $envMap["ADMIN_API_TOKEN"]) { $errors.Add("ADMIN_API_TOKEN must be a real secret.") }
if ($storageProvider -match "cos" -and ((Is-BlankOrPlaceholder $envMap["COS_BUCKET"]) -or (Is-BlankOrPlaceholder $envMap["COS_REGION"]) -or (Is-BlankOrPlaceholder $envMap["COS_SECRET_ID"]) -or (Is-BlankOrPlaceholder $envMap["COS_SECRET_KEY"]))) {
  $errors.Add("COS_BUCKET/COS_REGION/COS_SECRET_ID/COS_SECRET_KEY are required for COS.")
}
if ($ocrProvider -eq "tencent_ocr" -and ((Is-BlankOrPlaceholder $envMap["TENCENT_SECRET_ID"]) -or (Is-BlankOrPlaceholder $envMap["TENCENT_SECRET_KEY"]))) {
  $errors.Add("TENCENT_SECRET_ID/TENCENT_SECRET_KEY are required for Tencent OCR.")
}
if ($ocrProvider -eq "baidu_ocr" -and ((Is-BlankOrPlaceholder $envMap["BAIDU_OCR_API_KEY"]) -or (Is-BlankOrPlaceholder $envMap["BAIDU_OCR_SECRET_KEY"]))) {
  $errors.Add("BAIDU_OCR_API_KEY and BAIDU_OCR_SECRET_KEY are required for Baidu OCR.")
}
if ($llmProviderOrder -match "tencent_tokenhub" -and ((Is-BlankOrPlaceholder $envMap["TENCENT_TOKENHUB_API_KEY"]) -or (Is-BlankOrPlaceholder $envMap["TENCENT_TOKENHUB_BASE_URL"]) -or (Is-BlankOrPlaceholder $envMap["TENCENT_TOKENHUB_FREE_MODEL"]) -or (Is-BlankOrPlaceholder $envMap["TENCENT_TOKENHUB_PAID_MODEL"]) -or (Is-BlankOrPlaceholder $envMap["TENCENT_TOKENHUB_FALLBACK_MODEL"]))) {
  $errors.Add("TENCENT_TOKENHUB_API_KEY/BASE_URL/FREE_MODEL/PAID_MODEL/FALLBACK_MODEL are required when tencent_tokenhub is enabled.")
}
if ($llmProviderOrder -match "deepseek" -and (Is-BlankOrPlaceholder $envMap["DEEPSEEK_API_KEY"])) { $errors.Add("DEEPSEEK_API_KEY is required.") }
if ($llmProviderOrder -match "qwen" -and (Is-BlankOrPlaceholder $envMap["QWEN_API_KEY"])) { $errors.Add("QWEN_API_KEY is required.") }
if ($llmProviderOrder -match "doubao" -and ((Is-BlankOrPlaceholder $envMap["DOUBAO_API_KEY"]) -or (Is-BlankOrPlaceholder $envMap["DOUBAO_BASE_URL"]))) {
  $errors.Add("DOUBAO_API_KEY and DOUBAO_BASE_URL are required when doubao is enabled.")
}
if ($paymentProvider -eq "wechat_alipay" -and ((Is-BlankOrPlaceholder $envMap["PAYMENT_MERCHANT_CODES"]) -or (Is-BlankOrPlaceholder $envMap["PAYMENT_NOTIFY_URL"]))) {
  $errors.Add("PAYMENT_MERCHANT_CODES and PAYMENT_NOTIFY_URL are required for payment provider.")
}

if (Test-Path $FrontendEnvPath) {
  $frontendEnv = Read-EnvFile $FrontendEnvPath
  if ($frontendEnv["NEXT_PUBLIC_GAOKAO_ESSAY_USE_BACKEND"] -ne "true") {
    $errors.Add("NEXT_PUBLIC_GAOKAO_ESSAY_USE_BACKEND must be true in frontend production env.")
  }
  if ((Is-BlankOrPlaceholder $frontendEnv["ADMIN_PASSWORD"]) -or $frontendEnv["ADMIN_PASSWORD"] -match "password|123456") {
    $errors.Add("ADMIN_PASSWORD must be changed in frontend production env.")
  }
  if (Is-BlankOrPlaceholder $frontendEnv["ADMIN_SESSION_TOKEN"]) {
    $errors.Add("ADMIN_SESSION_TOKEN must be a real secret in frontend production env.")
  }
} else {
  Write-Host "Frontend env file not found: $FrontendEnvPath. Skipping frontend production checks." -ForegroundColor Yellow
}

if ($errors.Count -gt 0) {
  Write-Host "Production readiness failed:" -ForegroundColor Red
  $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Production env readiness checks passed." -ForegroundColor Green

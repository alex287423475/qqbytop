param(
  [string]$BffBase = "http://127.0.0.1:3000/api/tools/gaokao-english-essay-diagnosis"
)

$ErrorActionPreference = "Stop"

$essay = "Dear editor, Recently our school has started a campaign about green life. I think it is meaningful because small habits can make a real difference. First, students can bring reusable bottles instead of buying plastic ones every day. Second, we should turn off the lights when we leave the classroom. However, some students believe one person cannot change much. In my opinion, if everyone takes one step, the whole school will become cleaner."

function Invoke-JsonPost {
  param([string]$Url, [hashtable]$Body, [hashtable]$Headers = @{})
  Invoke-RestMethod -Method Post -Uri $Url -Headers $Headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
}

$smokeHeaders = @{ "x-forwarded-for" = "198.51.100.$(Get-Random -Minimum 1 -Maximum 220)" }
$draft = Invoke-JsonPost "$BffBase/drafts" @{ source_type = "text"; raw_input_text = $essay } $smokeHeaders
if (-not $draft.draft_id) { throw "BFF draft creation failed" }
$authHeaders = @{ Authorization = "Bearer $($draft.draft_token)" }

$report = Invoke-RestMethod -Method Post -Uri "$BffBase/reports" -Headers $authHeaders -ContentType "application/json" -Body (@{ draft_id = $draft.draft_id } | ConvertTo-Json -Depth 10)
if (-not $report.report_id) { throw "BFF report creation failed" }

$locked = Invoke-RestMethod -Uri "$BffBase/reports/$($report.report_id)"
if ($null -ne $locked.full_report) { throw "BFF locked report leaked full_report" }

$order = Invoke-JsonPost "$BffBase/orders" @{ report_id = $report.report_id; product_type = "essay_credit_pack_20"; payer_contact = "student@example.com" }
if ($order.amount_cents -ne 9900) { throw "BFF order amount mismatch" }

$synced = Invoke-JsonPost "$BffBase/orders/$($order.order_id)/sync" @{}
if ($synced.status -ne "PAID") { throw "BFF order sync did not mark PAID" }

$unlocked = Invoke-RestMethod -Uri "$BffBase/reports/$($report.report_id)"
if ($null -eq $unlocked.full_report) { throw "BFF unlocked report did not return full_report" }

[pscustomobject]@{
  ok = $true
  draft_id = $draft.draft_id
  report_id = $report.report_id
  order_id = $order.order_id
  merchant_code = $order.merchant_code
} | ConvertTo-Json

param(
  [string]$ApiBase = "http://127.0.0.1:8000/api/v1"
)

$ErrorActionPreference = "Stop"

$essay = "Dear editor, Recently our school has started a campaign about green life. I think it is meaningful because small habits can make a real difference. First, students can bring reusable bottles instead of buying plastic ones every day. Second, we should turn off the lights when we leave the classroom. However, some students believe one person cannot change much. In my opinion, if everyone takes one step, the whole school will become cleaner."

function Invoke-JsonPost {
  param([string]$Url, [hashtable]$Body)
  Invoke-RestMethod -Method Post -Uri $Url -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
}

$health = Invoke-RestMethod -Uri "$ApiBase/health"
if ($health.status -ne "ok") { throw "Health check failed" }

$draft = Invoke-JsonPost "$ApiBase/drafts" @{ source_type = "text"; raw_input_text = $essay }
if (-not $draft.draft_id) { throw "Draft creation failed" }
$authHeaders = @{ Authorization = "Bearer $($draft.draft_token)" }

$report = Invoke-RestMethod -Method Post -Uri "$ApiBase/reports" -Headers $authHeaders -ContentType "application/json" -Body (@{ draft_id = $draft.draft_id } | ConvertTo-Json -Depth 10)
if (-not $report.report_id) { throw "Report creation failed" }

$locked = Invoke-RestMethod -Uri "$ApiBase/reports/$($report.report_id)"
if ($null -ne $locked.full_report) { throw "Locked report leaked full_report" }

$order = Invoke-JsonPost "$ApiBase/orders" @{ report_id = $report.report_id; product_type = "essay_credit_pack_20"; payer_contact = "student@example.com" }
if ($order.amount_cents -ne 9900) { throw "Unexpected order amount" }

$synced = Invoke-JsonPost "$ApiBase/orders/$($order.order_id)/sync" @{}
if ($synced.status -ne "PAID") { throw "Order sync did not mark PAID" }

$unlocked = Invoke-RestMethod -Uri "$ApiBase/reports/$($report.report_id)"
if ($null -eq $unlocked.full_report) { throw "Unlocked report did not return full_report" }

[pscustomobject]@{
  ok = $true
  draft_id = $draft.draft_id
  report_id = $report.report_id
  order_id = $order.order_id
  merchant_code = $order.merchant_code
} | ConvertTo-Json

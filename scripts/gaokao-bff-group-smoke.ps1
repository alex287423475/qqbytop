$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:3000/api/tools/gaokao-english-essay-diagnosis"
$essay = "Dear editor, Recently our school has started a campaign about green life. I think it is meaningful because small habits can make a real difference. First, students can bring reusable bottles instead of buying plastic ones every day. Second, we should turn off the lights when we leave the classroom. However, some students believe one person cannot change much. In my opinion, if everyone takes one step, the whole school will become cleaner."

function New-Report {
  $draft = Invoke-RestMethod -Method Post -Uri "$base/drafts" -Headers @{ "x-forwarded-for" = "198.51.100.$(Get-Random -Minimum 1 -Maximum 220)" } -ContentType "application/json" -Body (@{
    source_type = "text"
    raw_input_text = $essay
  } | ConvertTo-Json)

  $headers = @{ Authorization = "Bearer $($draft.draft_token)" }
  $report = Invoke-RestMethod -Method Post -Uri "$base/reports" -Headers $headers -ContentType "application/json" -Body (@{
    draft_id = $draft.draft_id
  } | ConvertTo-Json)

  return $report.report_id
}

$report1 = New-Report
$order1 = Invoke-RestMethod -Method Post -Uri "$base/orders" -ContentType "application/json" -Body (@{
  report_id = $report1
  product_type = "group_essay_credit_pack_20_member"
  payer_contact = "student1@example.com"
} | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri "$base/orders/$($order1.order_id)/sync" -ContentType "application/json" -Body "{}" | Out-Null

$report2 = New-Report
$order2 = Invoke-RestMethod -Method Post -Uri "$base/orders" -ContentType "application/json" -Body (@{
  report_id = $report2
  product_type = "group_essay_credit_pack_20_member"
  group_buy_id = $order1.group_buy_id
  payer_contact = "student2@example.com"
} | ConvertTo-Json)

Invoke-RestMethod -Method Post -Uri "$base/orders/$($order2.order_id)/sync" -ContentType "application/json" -Body "{}" | Out-Null
$assist = Invoke-RestMethod -Method Post -Uri "$base/groups/$($order1.group_buy_id)/official-assist" -ContentType "application/json" -Body "{}"
$final1 = Invoke-RestMethod -Method Get -Uri "$base/reports/$report1"
$final2 = Invoke-RestMethod -Method Get -Uri "$base/reports/$report2"

if ($assist.status -ne "SUCCESS" -or -not $assist.official_assist_used -or -not $final1.is_unlocked -or -not $final2.is_unlocked) {
  throw "BFF group smoke failed."
}

[pscustomobject]@{
  ok = $true
  group_id = $order1.group_buy_id
  status = $assist.status
  official_assist_used = $assist.official_assist_used
  report1_unlocked = $final1.is_unlocked
  report2_unlocked = $final2.is_unlocked
} | ConvertTo-Json

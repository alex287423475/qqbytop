param(
  [string]$BffBase = "http://127.0.0.1:3000/api/tools/gaokao-english-essay-diagnosis"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonPost {
  param([string]$Url, [hashtable]$Body, [hashtable]$Headers = @{})
  Invoke-RestMethod -Method Post -Uri $Url -Headers $Headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
}

$smokeHeaders = @{ "x-forwarded-for" = "198.51.100.$(Get-Random -Minimum 1 -Maximum 220)" }
$draft = Invoke-JsonPost "$BffBase/drafts" @{ source_type = "image" } $smokeHeaders
if (-not $draft.draft_id -or -not $draft.draft_token) { throw "BFF image draft creation failed" }

$authHeaders = @{ Authorization = "Bearer $($draft.draft_token)" }
$upload = Invoke-JsonPost "$BffBase/uploads/intents" @{
  draft_id = $draft.draft_id
  file_name = "essay.jpg"
  mime_type = "image/jpeg"
  size_bytes = 1024
} $authHeaders
if (-not $upload.upload_intent_id) { throw "BFF upload intent failed" }

$complete = Invoke-JsonPost "$BffBase/uploads/$($upload.upload_intent_id)/complete" @{
  bucket = $upload.bucket
  object_key = $upload.object_key
  mime_type = "image/jpeg"
  size_bytes = 1024
} $authHeaders
if ($complete.recognition_status -ne "COMPLETED") { throw "BFF upload completion did not trigger OCR" }

$recognition = Invoke-RestMethod -Uri "$BffBase/drafts/$($draft.draft_id)/recognition" -Headers $authHeaders
if (-not $recognition.ocr_result.transcribed_text) { throw "BFF recognition missing transcribed text" }

$confirm = Invoke-JsonPost "$BffBase/drafts/$($draft.draft_id)/confirm" @{ confirmed_text = $recognition.ocr_result.transcribed_text } $authHeaders
if (-not $confirm.confirmed) { throw "BFF confirm text failed" }

$report = Invoke-JsonPost "$BffBase/reports" @{ draft_id = $draft.draft_id } $authHeaders
if (-not $report.report_id) { throw "BFF report creation from image draft failed" }

[pscustomobject]@{
  ok = $true
  draft_id = $draft.draft_id
  upload_intent_id = $upload.upload_intent_id
  recognition_status = $complete.recognition_status
  word_count = $confirm.word_count
  report_id = $report.report_id
} | ConvertTo-Json

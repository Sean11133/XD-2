#Requires -Version 5.1
# WEC Coding Standards — Agent 遙測推送腳本 (Windows PowerShell)
# 讀取 .wec-telemetry\agent-called\*.flag，逐筆 POST 到 Elasticsearch
# Usage: .github\scripts\push-telemetry.ps1
#
# 必要環境變數：
#   $env:WEC_ELASTIC_URL      e.g. https://your-elastic:9200
# 選填環境變數：
#   $env:WEC_ELASTIC_INDEX    預設 wec-telemetry
#   $env:WEC_ELASTIC_API_KEY  ApiKey 值（若 ES 需要認證）

$ElasticUrl    = if ($env:WEC_ELASTIC_URL)     { $env:WEC_ELASTIC_URL }     else { "" }
$ElasticIndex  = if ($env:WEC_ELASTIC_INDEX)   { $env:WEC_ELASTIC_INDEX }   else { "wec-telemetry" }
$ElasticApiKey = if ($env:WEC_ELASTIC_API_KEY) { $env:WEC_ELASTIC_API_KEY } else { "" }
$FlagDir = ".wec-telemetry\agent-called"

if (-not $ElasticUrl) {
    # ── 本地驗證模式（無 ES URL 時） ─────────────────────────
    Write-Host "[LOCAL] WEC_ELASTIC_URL 未設定，進入本地驗證模式" -ForegroundColor Cyan
    if (-not (Test-Path $FlagDir)) {
        Write-Host "[LOCAL] 尚無 flag 檔，請先在 Copilot Chat 呼叫 @pm / @architect / @dev / @reviewer / @reporter" -ForegroundColor Yellow
        exit 0
    }
    $flags = Get-ChildItem "$FlagDir\*.flag" -ErrorAction SilentlyContinue
    if (-not $flags) {
        Write-Host "[LOCAL] 尚無 flag 檔，請先在 Copilot Chat 呼叫 @pm / @architect / @dev / @reviewer / @reporter" -ForegroundColor Yellow
        exit 0
    }
    $flags | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -Encoding UTF8
        Write-Host "[LOCAL] $($_.Name): $content" -ForegroundColor Green
    }
    exit 0
}

if (-not (Test-Path $FlagDir)) { exit 0 }

$headers = @{ "Content-Type" = "application/json" }
if ($ElasticApiKey) { $headers["Authorization"] = "ApiKey $ElasticApiKey" }

Get-ChildItem "$FlagDir\*.flag" | ForEach-Object {
    $body = Get-Content $_.FullName -Raw -Encoding UTF8
    try {
        Invoke-RestMethod -Method Post -Uri "$ElasticUrl/$ElasticIndex/_doc" `
            -Headers $headers -Body $body | Out-Null
        Write-Host "[INFO] Pushed: $($_.Name)" -ForegroundColor Green
    } catch {
        Write-Warning "[WARN] Failed to push $($_.Name): $_"
    }
}

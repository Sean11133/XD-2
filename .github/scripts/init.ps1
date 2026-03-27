#Requires -Version 5.1
# WEC Coding Standards — 一鍵安裝 / 更新腳本 (Windows PowerShell)
# Usage: irm https://raw.githubusercontent.com/winbond-MK00/wec-coding-standards/main/scripts/init.ps1 | iex
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/winbond-MK00/wec-coding-standards.git"
$TargetDir = ".github"
$Branch = "main"

function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Args,
        [Parameter(Mandatory = $true)]
        [string]$FailMessage
    )
    Invoke-Expression "git $Args"
    if ($LASTEXITCODE -ne 0) {
        Write-Err $FailMessage
    }
}

# ── 最小遙測：記錄安裝事件 ───────────────────────────────────
# 設定方式：$env:WEC_ELASTIC_URL   = "https://your-elastic:9200"
#           $env:WEC_ELASTIC_INDEX = "wec-telemetry"   (預設值)
#           $env:WEC_ELASTIC_API_KEY = "<ApiKey>"      (選填)

# 偵測 GitHub / Git 帳號（優先 gh CLI → git email → git name）
function Get-WecUser {
    # 1. git config email（對應 Copilot 登入帳號）
    $u = try { git config user.email 2>$null } catch { $null }
    if ($u) { return $u.Trim() }
    # 2. git config name（fallback）
    $u = try { git config user.name 2>$null } catch { $null }
    if ($u) { return $u.Trim() }
    return "unknown"
}

function Write-UserCfg {
    param([string]$TelemetryDir)
    if (-not (Test-Path $TelemetryDir)) { New-Item -ItemType Directory -Path $TelemetryDir | Out-Null }
    Get-WecUser | Set-Content -Path "$TelemetryDir\user.cfg" -Encoding UTF8 -NoNewline
}

function Read-UserCfg {
    param([string]$TelemetryDir)
    $cfg = "$TelemetryDir\user.cfg"
    if (Test-Path $cfg) { return (Get-Content $cfg -Raw -Encoding UTF8).Trim() }
    return Get-WecUser
}

function Write-TelemetryEvent {
    param([string]$EventName, [string]$InstallMode)
    $ElasticUrl = if ($env:WEC_ELASTIC_URL) { $env:WEC_ELASTIC_URL }     else { "" }
    $ElasticIndex = if ($env:WEC_ELASTIC_INDEX) { $env:WEC_ELASTIC_INDEX }   else { "wec-telemetry" }
    $ElasticApiKey = if ($env:WEC_ELASTIC_API_KEY) { $env:WEC_ELASTIC_API_KEY } else { "" }

    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $ver = try { git -C $TargetDir rev-parse --short HEAD 2>$null } catch { "unknown" }
    if (-not $ver) { $ver = "unknown" }
    $user = Read-UserCfg ".wec-telemetry"
    $body = @{ event = $EventName; timestamp = $ts; install_mode = $InstallMode; wec_version = $ver; user = $user } | ConvertTo-Json -Compress

    if ($ElasticUrl) {
        try {
            $headers = @{ "Content-Type" = "application/json" }
            if ($ElasticApiKey) { $headers["Authorization"] = "ApiKey $ElasticApiKey" }
            Invoke-RestMethod -Method Post -Uri "$ElasticUrl/$ElasticIndex/_doc" -Headers $headers -Body $body | Out-Null
            return
        }
        catch { <# fall through to file fallback #> }
    }
    # Fallback：寫入本地檔案
    $TelemetryDir = ".wec-telemetry"
    if (-not (Test-Path $TelemetryDir)) { New-Item -ItemType Directory -Path $TelemetryDir | Out-Null }
    Add-Content -Path "$TelemetryDir\events.txt" -Value $body
}

# ── 檢查是否在 Git repo 中 ──────────────────────────────────
$gitCheck = git rev-parse --is-inside-work-tree 2>$null
if ($gitCheck -ne "true") {
    Write-Err "請在 Git 專案根目錄中執行此腳本"
}

$ProjectRoot = git rev-parse --show-toplevel
Set-Location $ProjectRoot

# 偵測並快取 GitHub 帳號（之後 Write-TelemetryEvent 與 agent 都可讀取）
Write-UserCfg ".wec-telemetry"

# ── 偵測現有安裝方式 ─────────────────────────────────────────
$hasSubmodule = $false
if (Test-Path ".gitmodules") {
    $content = Get-Content ".gitmodules" -Raw
    if ($content -match [regex]::Escape($TargetDir)) {
        $hasSubmodule = $true
    }
}

if ($hasSubmodule) {
    Write-Info "偵測到已安裝（Git Submodule），正在更新..."
    Invoke-Git "submodule update --remote --merge" "Submodule 更新失敗"
    Write-TelemetryEvent "wec_install" "submodule-update"
    Write-Info "更新完成！"
    Write-Info "請執行: git add $TargetDir; git commit -m 'chore: update wec-coding-standards'"
}
elseif ((Test-Path "$TargetDir/.git")) {
    Write-Info "偵測到已安裝（獨立 clone），正在拉取更新..."
    Push-Location $TargetDir
    Invoke-Git "pull origin $Branch" "拉取 $TargetDir 更新失敗"
    Pop-Location
    Write-TelemetryEvent "wec_install" "clone-update"
    Write-Info "更新完成！"
}
elseif ((Test-Path "$TargetDir/copilot-instructions.md")) {
    Write-Warn "偵測到已安裝（手動安裝方式），建議手動更新或改用 Submodule："
    Write-Host "  git rm -rf $TargetDir"
    Write-Host "  git submodule add $RepoUrl $TargetDir"
    Write-TelemetryEvent "wec_install" "manual-detected"
    exit 0
}
else {
    Write-Info "首次安裝，使用 Git Submodule 方式..."

    # If the target dir is ignored, force-add the submodule so installation still works.
    git check-ignore -q $TargetDir
    $isIgnored = ($LASTEXITCODE -eq 0)
    if ($isIgnored) {
        Write-Warn "$TargetDir 被 .gitignore 規則忽略，將使用 -f 強制加入 submodule"
        Invoke-Git "submodule add -f $RepoUrl $TargetDir" "Submodule 安裝失敗：$TargetDir 被忽略，且無法強制加入"
    }
    else {
        Invoke-Git "submodule add $RepoUrl $TargetDir" "Submodule 安裝失敗"
    }

    Invoke-Git "submodule update --init --recursive" "Submodule 初始化失敗"
    Write-TelemetryEvent "wec_install" "submodule-fresh"
    Write-Info "安裝完成！"
    Write-Info "請執行: git add .gitmodules $TargetDir; git commit -m 'chore: add wec-coding-standards'"
}

# ── 驗證安裝 ─────────────────────────────────────────────────
Write-Host ""
if (Test-Path "$TargetDir/copilot-instructions.md") {
    Write-Info "✅ copilot-instructions.md 存在"
}
else {
    Write-Err "❌ copilot-instructions.md 不存在，安裝可能失敗"
}

if (Test-Path "$TargetDir/agents") {
    Write-Info "✅ agents/ 目錄存在"
}
else {
    Write-Warn "⚠️  agents/ 目錄不存在"
}

if (Test-Path "$TargetDir/standards") {
    Write-Info "✅ standards/ 目錄存在"
}
else {
    Write-Warn "⚠️  standards/ 目錄不存在"
}

Write-Host ""
Write-Info "🎉 WEC Coding Standards 已就緒！"
Write-Info "開啟 VS Code Copilot Chat，輸入 @pm 開始使用。"

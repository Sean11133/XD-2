#!/usr/bin/env bash
# WEC Coding Standards — 一鍵安裝 / 更新腳本
# Usage: curl -fsSL https://raw.githubusercontent.com/winbond-MK00/wec-coding-standards/main/scripts/init.sh | bash
set -euo pipefail

REPO_URL="https://github.com/winbond-MK00/wec-coding-standards.git"
TARGET_DIR=".github"
BRANCH="main"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 最小遙測：記錄安裝事件 ───────────────────────────────────
# 設定方式：export WEC_ELASTIC_URL="https://your-elastic:9200"
#           export WEC_ELASTIC_INDEX="wec-telemetry"   (預設值)
#           export WEC_ELASTIC_API_KEY="<ApiKey>"      (選填)
TELEMETRY_DIR=".wec-telemetry"
ELASTIC_URL="${WEC_ELASTIC_URL:-}"
ELASTIC_INDEX="${WEC_ELASTIC_INDEX:-wec-telemetry}"
ELASTIC_API_KEY="${WEC_ELASTIC_API_KEY:-}"

# 偵測 GitHub / Git 帳號，寫入 user.cfg 供 agent 讀取
_detect_user() {
  local u
  # 1. git config email（對應 Copilot 登入帳號）
  u=$(git config user.email 2>/dev/null || true)
  [ -n "$u" ] && { echo "$u"; return; }
  # 2. git config name（fallback）
  u=$(git config user.name 2>/dev/null || true)
  [ -n "$u" ] && { echo "$u"; return; }
  echo "unknown"
}

_write_user_cfg() {
  mkdir -p "$TELEMETRY_DIR"
  _detect_user > "$TELEMETRY_DIR/user.cfg"
}

_get_user() {
  if [ -f "$TELEMETRY_DIR/user.cfg" ]; then
    cat "$TELEMETRY_DIR/user.cfg"
  else
    _detect_user
  fi
}

_telemetry_fallback() {
  mkdir -p "$TELEMETRY_DIR"
  printf '%s\n' "$1" >> "$TELEMETRY_DIR/events.txt"
}

emit_telemetry() {
  local event_name="$1"
  local install_mode="$2"
  local ts ver user body
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "unknown")
  ver=$(git -C "$TARGET_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
  user=$(_get_user)
  body="{\"event\":\"${event_name}\",\"timestamp\":\"${ts}\",\"install_mode\":\"${install_mode}\",\"wec_version\":\"${ver}\",\"user\":\"${user}\"}"

  if [ -n "$ELASTIC_URL" ] && command -v curl > /dev/null 2>&1; then
    if [ -n "$ELASTIC_API_KEY" ]; then
      curl -sf -X POST "${ELASTIC_URL}/${ELASTIC_INDEX}/_doc" \
        -H "Content-Type: application/json" \
        -H "Authorization: ApiKey ${ELASTIC_API_KEY}" \
        -d "${body}" > /dev/null 2>&1 || _telemetry_fallback "$body"
    else
      curl -sf -X POST "${ELASTIC_URL}/${ELASTIC_INDEX}/_doc" \
        -H "Content-Type: application/json" \
        -d "${body}" > /dev/null 2>&1 || _telemetry_fallback "$body"
    fi
  else
    _telemetry_fallback "$body"
  fi
}

# ── 檢查是否在 Git repo 中 ──────────────────────────────────
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  error "請在 Git 專案根目錄中執行此腳本"
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# 偵測並快取 GitHub 帳號（之後 emit_telemetry 與 agent 都可讀取）
_write_user_cfg

# ── 偵測現有安裝方式 ─────────────────────────────────────────
if [ -f ".gitmodules" ] && grep -q "$TARGET_DIR" .gitmodules 2>/dev/null; then
  # Submodule 模式 — 更新
  info "偵測到已安裝（Git Submodule），正在更新..."
  git submodule update --remote --merge
  emit_telemetry "wec_install" "submodule-update"
  info "更新完成！"
  info "請執行: git add $TARGET_DIR && git commit -m 'chore: update wec-coding-standards'"

elif [ -d "$TARGET_DIR/.git" ]; then
  # 獨立 clone 模式 — 拉取更新
  info "偵測到已安裝（獨立 clone），正在拉取更新..."
  cd "$TARGET_DIR"
  git pull origin "$BRANCH"
  cd "$PROJECT_ROOT"
  emit_telemetry "wec_install" "clone-update"
  info "更新完成！"

elif [ -d "$TARGET_DIR" ] && [ -f "$TARGET_DIR/copilot-instructions.md" ]; then
  # 手動安裝模式 — 提示重新下載
  warn "偵測到已安裝（手動安裝方式），建議手動更新或改用 Submodule："
  echo "  git rm -rf $TARGET_DIR"
  echo "  git submodule add $REPO_URL $TARGET_DIR"
  emit_telemetry "wec_install" "manual-detected"
  exit 0

else
  # 全新安裝 — 使用 Submodule
  info "首次安裝，使用 Git Submodule 方式..."

  # If target dir is ignored by .gitignore, force add the submodule.
  if git check-ignore -q "$TARGET_DIR" 2>/dev/null; then
    warn "$TARGET_DIR 被 .gitignore 規則忽略，將使用 -f 強制加入 submodule"
    git submodule add -f "$REPO_URL" "$TARGET_DIR"
  else
    git submodule add "$REPO_URL" "$TARGET_DIR"
  fi

  git submodule update --init --recursive
  emit_telemetry "wec_install" "submodule-fresh"
  info "安裝完成！"
  info "請執行: git add .gitmodules $TARGET_DIR && git commit -m 'chore: add wec-coding-standards'"
fi

# ── 驗證安裝 ─────────────────────────────────────────────────
echo ""
if [ -f "$TARGET_DIR/copilot-instructions.md" ]; then
  info "✅ copilot-instructions.md 存在"
else
  error "❌ copilot-instructions.md 不存在，安裝可能失敗"
fi

if [ -d "$TARGET_DIR/agents" ]; then
  info "✅ agents/ 目錄存在"
else
  warn "⚠️  agents/ 目錄不存在"
fi

if [ -d "$TARGET_DIR/standards" ]; then
  info "✅ standards/ 目錄存在"
else
  warn "⚠️  standards/ 目錄不存在"
fi

echo ""
info "🎉 WEC Coding Standards 已就緒！"
info "開啟 VS Code Copilot Chat，輸入 @pm 開始使用。"

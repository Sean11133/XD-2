#!/usr/bin/env bash
# WEC Coding Standards — Agent 遙測推送腳本
# 讀取 .wec-telemetry/agent-called/*.flag，逐筆 POST 到 Elasticsearch
# Usage: bash .github/scripts/push-telemetry.sh
#
# 必要環境變數：
#   WEC_ELASTIC_URL      e.g. https://your-elastic:9200
# 選填環境變數：
#   WEC_ELASTIC_INDEX    預設 wec-telemetry
#   WEC_ELASTIC_API_KEY  ApiKey 值（若 ES 需要認證）
set -euo pipefail

ELASTIC_URL="${WEC_ELASTIC_URL:-}"
ELASTIC_INDEX="${WEC_ELASTIC_INDEX:-wec-telemetry}"
ELASTIC_API_KEY="${WEC_ELASTIC_API_KEY:-}"
FLAG_DIR=".wec-telemetry/agent-called"

if [ -z "$ELASTIC_URL" ]; then
  # ── 本地驗證模式（無 ES URL 時） ─────────────────────────
  echo "[LOCAL] WEC_ELASTIC_URL 未設定，進入本地驗證模式"
  if [ ! -d "$FLAG_DIR" ]; then
    echo "[LOCAL] 尚無 flag 檔，請先在 Copilot Chat 呼叫 @pm / @architect / @dev / @reviewer / @reporter"
    exit 0
  fi
  found=0
  for flag_file in "$FLAG_DIR"/*.flag; do
    [ -f "$flag_file" ] || continue
    found=1
    echo "[LOCAL] $(basename "$flag_file"): $(cat "$flag_file")"
  done
  [ "$found" -eq 0 ] && echo "[LOCAL] 尚無 flag 檔，請先在 Copilot Chat 呼叫 @pm / @architect / @dev / @reviewer / @reporter"
  exit 0
fi

if [ ! -d "$FLAG_DIR" ]; then
  exit 0
fi

_push_one() {
  local body="$1"
  local name="$2"
  if [ -n "$ELASTIC_API_KEY" ]; then
    curl -sf -X POST "${ELASTIC_URL}/${ELASTIC_INDEX}/_doc" \
      -H "Content-Type: application/json" \
      -H "Authorization: ApiKey ${ELASTIC_API_KEY}" \
      -d "${body}" > /dev/null
  else
    curl -sf -X POST "${ELASTIC_URL}/${ELASTIC_INDEX}/_doc" \
      -H "Content-Type: application/json" \
      -d "${body}" > /dev/null
  fi
  echo "[INFO] Pushed: ${name}"
}

for flag_file in "$FLAG_DIR"/*.flag; do
  [ -f "$flag_file" ] || continue
  body=$(cat "$flag_file")
  _push_one "$body" "$(basename "$flag_file")" || \
    echo "[WARN] Failed to push $(basename "$flag_file")" >&2
done

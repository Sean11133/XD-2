---
description: Tester Phase — Fast-Fail Lint→Build→Test 閉環，自動解析錯誤並 Heal，輸出 LoopState
---

# AI Tester Phase

> 本 Prompt 由 `ai-loop.prompt.md` 的 Inner Loop 呼叫，也可獨立使用。
> 原自 `3c-test-heal.prompt.md` 重構，加入 Adapter-driven 指令 + 統一 error_id 追蹤。

## 角色

你是自動化測試與錯誤修復專家，負責 Fast-Fail lint→build→test 三道門，並在失敗時分析錯誤、執行 Heal。

## 執行前置

```
1. 確認當前 LoopState（phase: developer, result: PASS）
2. 載入 ai-loop/adapters/{framework}/commands.yaml（取得指令）
3. 載入 ai-loop/adapters/{framework}/error-parser.md（取得解析規則）
4. 載入 ai-loop/core/escape-hatch.md（確認 Escape 條件）
```

## Fast-Fail 三道門

```
門 1（Lint）
  執行：adapter.getLintCommand()
  FAIL → 立即返回 Developer Phase（不執行門 2、3）
  PASS → 繼續

門 2（Build / TypeCheck）
  執行：adapter.getBuildCommand()
  若 build = null（如 Python）→ 跳過此門
  FAIL → 立即返回 Developer Phase（不執行門 3）
  PASS → 繼續

門 3（Test + Heal Loop）
  執行：adapter.getTestCommand()
  FAIL → Heal（最多 3 次）
  仍 FAIL → 返回 Developer Phase
  PASS → Tester Phase 完成
```

## 閉環流程圖

```
┌──────────────────────────────────────────────┐
│           Tester Phase 閉環                   │
│                                               │
│  Lint ──FAIL──→ 返回 Developer                │
│    │                                          │
│   PASS                                        │
│    │                                          │
│  Build ──FAIL──→ 返回 Developer               │
│    │                                          │
│   PASS                                        │
│    │                                          │
│  Test ──FAIL──→ Heal（最多 3 次）──→ Test     │
│    │                    仍 FAIL ──→ 返回 Dev  │
│   PASS                                        │
│    │                                          │
│  輸出 LoopState（result: PASS）               │
└──────────────────────────────────────────────┘
```

## 錯誤分析與 Heal 流程

### Step 1：解析錯誤輸出

依據 `adapter.parseErrorOutput()` 的規則：

1. 將原始工具輸出轉為 `ParsedError[]` 格式
2. 生成 `error_id`（格式：`{tool}-{rule}-{filename_slug}-lineN`）
3. 分類嚴重度：`BLOCK`（阻斷）或 `WARN`（繼續）

### Step 2：震盪偵測

每個 error_id 出現前，查詢 LoopState 的 `resolved_errors` 和 `oscillation_flags`：

- 若此 error_id 已在 `resolved_errors` 中出現 → 記錄到 `oscillation_flags`
- 若 `oscillation_flags.length >= 1` → 觸發 Escape Hatch

### Step 3：Heal 策略

依據 `instructions/ai-loop-error-taxonomy.instructions.md` 的 Heal Matrix：

| 錯誤類型 | Heal 策略 |
|---------|----------|
| COMPILE_ERROR | 修正語法/型別/import（最小範圍）|
| LINT_BLOCK | 修正格式（可用 heal_commands.lint_fix）|
| TEST_FAIL | 優先修改實作，僅測試邏輯明確有誤時才修測試 |
| BUILD_FAIL | 修正型別錯誤、缺少依賴 |

**最小修改原則**：每次 Heal 只修改導致此 error_id 的最小程式碼範圍。

### Step 4：套用修正並重新測試

1. 套用 Heal 修正
2. 將修正的 error_id 加入 `resolved_errors`
3. 重新執行失敗的測試工具
4. 最多 Heal 3 次后仍 FAIL → 輸出 `result: FAIL` 的 LoopState

## LoopState 輸出（PASS）

```yaml
---LOOP-STATE---
round: {N}
phase: tester
result: PASS
framework: {framework}
spec_hash: "{spec_hash}"
cumulative_changes:
  - action: created
    file: {path}
  # 包含 Developer Phase 的所有變更（累積）
errors: []
warnings:
  - error_id: "{warn_id}"
    severity: WARN
    tool: "{tool}"
    message: "{msg}"
resolved_errors:
  - "{resolved_error_id}"
oscillation_flags: []
context_budget:
  tokens_used: {n}
  budget_pct: "{pct}%"
---END-LOOP-STATE---
```

## LoopState 輸出（FAIL）

```yaml
---LOOP-STATE---
round: {N}
phase: tester
result: FAIL
framework: {framework}
spec_hash: "{spec_hash}"
cumulative_changes:
  - action: modified
    file: {path}
errors:
  - error_id: "{error_id}"
    severity: BLOCK
    tool: "{tool}"
    message: "{message}"
    file: "{file}"
    line: {line}
oscillation_flags: []
context_budget:
  tokens_used: {n}
  budget_pct: "{pct}%"
---END-LOOP-STATE---
```

---
applyTo: ".github/ai-loop/**"
---

# Inner Auto Loop — 協議快速檢查清單

> 📌 **完整協議定義**：`ai-loop/core/loop-orchestrator.md`（Loop 執行骨架）+ `ai-loop/core/loop-state.schema.yaml`（LoopState 結構）
>
> 本檔為執行時的**快速提醒清單**，確保每個 Phase 輸出符合協議。

## LoopState 輸出必要欄位（每個 Phase 結束必須輸出）

- [ ] `round`：當前輪次（從 1 開始）
- [ ] `phase`：`developer` | `tester` | `reviewer`
- [ ] `result`：`PASS` | `FAIL` | `ESCAPED` | `HUMAN_REQUIRED`
- [ ] `framework`：`angular-wec` | `dotnet` | `python`
- [ ] `spec_hash`：`"{title}|{AC1前3詞},{AC2前3詞}"`（每個 Phase 必須驗證與初始一致）
- [ ] `cumulative_changes`：本 Phase 所有 created / modified / deleted 的檔案清單
- [ ] `errors`：當前輪次的錯誤列表（格式 `{tool}-{code}-{slug}-line{N}`）
- [ ] `oscillation_flags`：已標記震盪的 error_id 列表
- [ ] `context_budget.budget_pct`：Token 使用率

## Fast-Fail 規則提醒

- Lint FAIL → 跳過 Test 和 Build（`SKIPPED`）
- Build FAIL → 跳過 Test 執行
- Test FAIL → 進入 Heal 階段（最多 5 次）
- 任何 Phase 偵測到 `SECURITY_RISK` → 立即停止（`ESCAPED`）

## Human Intervention Gate 觸發提醒

| 觸發時機                                                | gate_type                |
| ------------------------------------------------------- | ------------------------ |
| `initialization_required: true`（project-profile.yaml） | `FRAMEWORK_INIT`         |
| 使用者未選擇框架                                        | `ARCHITECTURE_DECISION`  |
| Reviewer 偵測 🔴 Security 問題                          | `SECURITY_REVIEW`        |
| 即將執行不可逆高風險操作                                | `AUTHORIZATION_REQUIRED` |

## Token 預算警示

| 使用率 | 動作                          |
| ------ | ----------------------------- |
| < 60%  | 正常執行                      |
| 60–80% | ⚠️ 壓縮 Loop State 輸出       |
| 80–90% | 🔴 停止載入非必要 context     |
| > 90%  | 觸發 Escape Hatch（預算耗盡） |

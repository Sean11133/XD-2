---
applyTo: ".github/ai-loop/**"
---

# Inner Auto Loop — 核心協議

> 此 Instructions 檔案供 AI Agent 在 ai-loop 執行期間自動載入，定義狀態協議與通訊格式。

## Loop State Protocol

每個 Agent（Developer / Tester / Reviewer）完成工作後，**必須**輸出以下 YAML 區塊：

```yaml
---LOOP-STATE---
round: 1                          # 當前迴圈輪次（從 1 開始）
phase: developer                  # developer | tester | reviewer
result: PASS                      # PASS | FAIL | ESCAPED
framework: angular-wec            # angular-wec | dotnet | python
spec_hash: "title|AC1-first-3-words,AC2-first-3-words"
cumulative_changes:
  - action: created               # created | modified | deleted
    file: src/app/feature/component.ts
  - action: created
    file: src/app/feature/component.spec.ts
errors: []                        # 當前輪次的錯誤（格式見下方）
warnings: []
resolved_errors:                  # 本輪解決的歷史錯誤 ID
  - "eslint-no-any-usercard-line42"
oscillation_flags: []             # 重複出現的 error_id
context_budget:
  tokens_used: 8500
  budget_pct: "23%"
---END-LOOP-STATE---
```

## spec_hash 計算規則

```
spec_hash = "{spec.title}|{AC1 前 3 個詞},{AC2 前 3 個詞},{AC3 前 3 個詞}"
```

**用途**：每個 Agent 必須驗證 spec_hash 與初始一致，防止 Spec 在 Loop 中被修改（D0 審查維度）。

## error_id 格式

```
{tool}-{code-or-category}-{message-slug}-line{N}
```

範例：

- `eslint-no-any-usercard-line42`
- `dotnet-CS0246-missing-type-line15`
- `pytest-assertion-order-not-found-line88`
- `ruff-E501-line-too-long-line120`

**用途**：跨 Round 追蹤同一錯誤，供震盪偵測演算法使用。

## Fast-Fail 策略

```
Lint FAIL → 跳過 Test 和 Build（SKIPPED）
Build FAIL → 跳過 Test 執行
Test FAIL → 進入 Heal 階段（最多 5 次）
```

## 狀態轉移規則

```
round N, phase developer, result FAIL
  → round N, phase tester（繼續）

round N, phase tester, result FAIL
  → Heal → round N, phase developer（重新開發）

round N, phase tester, result PASS
  → round N, phase reviewer

round N, phase reviewer, result FAIL
  → round N+1, phase developer

round N, phase reviewer, result PASS
  → 跳出 ROUND LOOP → Phase D: integration-tester

Phase D, integration-tester, result PASS
  → 通知 @reporter（傳遞 LoopState + IntegrationTestState）

Phase D, integration-tester, result PARTIAL（類型 B ― 業務邏輯缺失）
  → 返回 Inner Loop（round N+1, phase developer）
  → Inner Loop 完成後重新執行 Phase D

Phase D, integration-tester, result PARTIAL（類型 A/C ― 測試程式碼/環境問題）
  → 通知 @reporter（傳遞 LoopState + IntegrationTestState，含失敗記錄）
  → 不觸發 Escape Hatch，PARTIAL 為可接受交付狀態

任何 phase, result ESCAPED
  → 停止，輸出診斷報告（diagnostic-report.md 格式）
  → ⛔ 等待 @dev resume（使用者手動修復後）或 @dev restart

任何 phase, result HUMAN_REQUIRED
  → 停止，輸出人工介入閘道宣告（escape-hatch.md 中的 Human Intervention Gate 格式）
  → ⛔ 等待 @dev resume（使用者完成指定操作後）
  → ✅ 這是合法暫停，不代表失敗，恢復後從原中斷點繼續
```

## Human Intervention Gate 快速判斷

| 觸發時機    | gate_type                | 產生原因                                                  |
| ----------- | ------------------------ | --------------------------------------------------------- |
| Step 0.5 後 | `FRAMEWORK_INIT`         | project-profile.yaml 顯示 `initialization_required: true` |
| Step 1 後   | `ARCHITECTURE_DECISION`  | 需使用者選擇框架（Python API / .NET 版本）                |
| Phase C 中  | `SECURITY_REVIEW`        | 偵測到 🔴 Security 問題（OWASP Top 10）                   |
| 任何 Phase  | `AUTHORIZATION_REQUIRED` | 即將執行不可逆高風險操作                                  |

## Token 預算警示

| 使用率 | 動作                                |
| ------ | ----------------------------------- |
| < 60%  | 正常執行                            |
| 60–80% | ⚠️ 警告，壓縮 Loop State 輸出       |
| 80–90% | 🔴 緊急壓縮，停止載入非必要 context |
| > 90%  | 觸發 Escape Hatch（預算耗盡）       |

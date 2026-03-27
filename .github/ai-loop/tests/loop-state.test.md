# Loop State Protocol — 引擎測試案例

> TC-LS-01 ~ TC-LS-10 | 參考：core/loop-state.schema.yaml、instructions/ai-loop-protocols.instructions.md

---

## TC-LS-01：初始狀態正確性

**目標**：驗證 Loop 啟動後 LoopState 初始值符合 Schema。

**前置條件**：使用者透過 `@dev` 觸發新 Loop，spec 已提供。

**預期輸出**：

```yaml
---LOOP-STATE---
round: 1
phase: init
result: PASS
framework: <detected>
spec_hash: "<title>|<AC1前3詞>,<AC2前3詞>"
cumulative_changes: []
errors: []
warnings: []
resolved_errors: []
oscillation_flags: []
context_budget:
  tokens_used: 0
  budget_pct: "0%"
---END-LOOP-STATE---
```

**驗證項目**：

- [ ] `round` = 1
- [ ] `phase` = `init`
- [ ] `result` = `PASS`
- [ ] `spec_hash` 格式符合 `{title}|{AC1前3詞},{AC2前3詞}`
- [ ] `cumulative_changes` 為空陣列
- [ ] `errors` 為空陣列
- [ ] `context_budget.budget_pct` = `"0%"`

---

## TC-LS-02：Phase 轉換正確性（Developer → Tester）

**目標**：驗證 Developer Phase PASS 後 LoopState 正確轉換至 Tester Phase。

**前置條件**：Developer Phase 成功完成，產出程式碼與單元測試。

**預期行為**：

1. Developer 輸出 `=== PHASE A COMPLETE | round: 1 | result: PASS ===`
2. 輸出更新後的 LoopState（`phase: developer`, `result: PASS`）
3. 輸出 `>>> ENTERING PHASE B (Tester) <<<`
4. Tester Phase 開始執行

**驗證項目**：

- [ ] `phase` 從 `init` 更新為 `developer`
- [ ] `result` = `PASS`
- [ ] `cumulative_changes` 包含 Developer 建立的檔案
- [ ] Transition Checkpoint 訊息完整輸出
- [ ] Tester 讀取 `prompts/ai-loop-test.prompt.md`

---

## TC-LS-03：Phase 轉換正確性（Tester → Reviewer）

**目標**：驗證 Tester Phase PASS 後 LoopState 正確轉換至 Reviewer Phase。

**前置條件**：Tester Phase 執行 Lint / Build / Test 全部通過。

**預期行為**：

1. Tester 輸出 `=== PHASE B COMPLETE | round: 1 | result: PASS ===`
2. 輸出更新後的 LoopState（`phase: tester`, `result: PASS`）
3. 輸出 `>>> ENTERING PHASE C (Reviewer) <<<`
4. Reviewer Phase 開始執行

**驗證項目**：

- [ ] `phase` 從 `developer` 更新為 `tester`
- [ ] `result` = `PASS`
- [ ] `errors` 為空陣列（或僅含 WARN 級別）
- [ ] Transition Checkpoint 訊息完整輸出
- [ ] Reviewer 讀取 `prompts/ai-loop-review.prompt.md`

---

## TC-LS-04：FAIL 狀態回退（Tester FAIL → Developer）

**目標**：驗證 Tester Phase FAIL 後 LoopState 正確回退至 Developer Phase。

**前置條件**：Tester Phase 的 Lint 或 Test 失敗，且 Heal 達到上限仍無法修復。

**預期行為**：

1. Tester 輸出 LoopState（`phase: tester`, `result: FAIL`）
2. `round` 遞增（round + 1）
3. Loop 回到 Phase A（Developer）重新執行

**預期輸出（FAIL 狀態）**：

```yaml
---LOOP-STATE---
round: 1
phase: tester
result: FAIL
framework: dotnet
spec_hash: "CachedUserRepository|執行緒安全,快取命中,過期清除"
cumulative_changes:
  - action: created
    file: src/Infrastructure/Repositories/CachedUserRepository.cs
errors:
  - error_id: "dotnet-test-fail-cacheduser-line58"
    severity: BLOCK
    tool: dotnet-test
    message: "Assert.Equal failed: Expected 1, Actual 0"
    file: tests/CachedUserRepositoryTests.cs
    line: 58
warnings: []
resolved_errors: []
oscillation_flags: []
context_budget:
  tokens_used: 8500
  budget_pct: "23%"
---END-LOOP-STATE---
```

**驗證項目**：

- [ ] `result` = `FAIL`
- [ ] `errors` 包含至少一個 `severity: BLOCK` 項目
- [ ] `error_id` 格式符合 `{tool}-{rule}-{slug}-line{N}`
- [ ] 下一輪 `round` 值 = 當前 round + 1
- [ ] 回到 Phase A 時 Developer 重新載入 instructions

---

## TC-LS-05：Fast-Fail 機制（Lint FAIL → 跳過 Build/Test）

**目標**：驗證 Lint 失敗時 Build 與 Test 被正確跳過。

**前置條件**：Tester Phase 執行 Lint 指令返回錯誤。

**預期行為**：

1. Lint FAIL → `result: FAIL`
2. Build 不執行（或標記 SKIPPED）
3. Test 不執行（或標記 SKIPPED）
4. 直接返回 Phase A

**驗證項目**：

- [ ] Lint 錯誤被解析並記入 `errors`
- [ ] Build/Test 未執行
- [ ] `result` = `FAIL`
- [ ] Phase 立即回退至 Developer，不經過 Reviewer

---

## TC-LS-06：spec_hash 完整性驗證

**目標**：驗證 spec_hash 在整個 Loop 生命週期中保持一致。

**前置條件**：Loop 執行到 Reviewer Phase（Phase C）。

**預期行為**：

1. init 階段計算 spec_hash
2. Developer / Tester Phase 的 LoopState 攜帶相同 spec_hash
3. Reviewer Phase D0 維度驗證 spec_hash 與初始值一致

**驗證項目**：

- [ ] spec_hash 格式：`{title}|{AC1前3詞},{AC2前3詞}`
- [ ] 所有 Phase 的 LoopState 中 spec_hash 值完全相同
- [ ] Reviewer D0 驗證 PASS 時不產生錯誤
- [ ] spec_hash 不匹配時觸發 Escape Hatch

---

## TC-LS-07：cumulative_changes 累積性

**目標**：驗證 `cumulative_changes` 是跨 Phase 累積的，而非僅記錄當前 Phase。

**前置條件**：Developer 建立 2 個檔案，Tester 修改 1 個檔案（Heal）。

**預期輸出（Tester Phase 完成後）**：

```yaml
cumulative_changes:
  - action: created
    file: src/UserService.cs
  - action: created
    file: tests/UserServiceTests.cs
  - action: modified
    file: src/UserService.cs
```

**驗證項目**：

- [ ] Tester Phase 的 `cumulative_changes` 包含 Developer Phase 的所有變更
- [ ] 新增的 Heal 修改追加在列表末尾
- [ ] `action` 值為 `created` / `modified` / `deleted` 之一
- [ ] `file` 為相對於專案根目錄的路徑

---

## TC-LS-08：oscillation_flags 偵測

**目標**：驗證相同 error_id 出現 3 次以上時觸發振盪標記。

**前置條件**：同一個 `error_id`（如 `eslint-no-any-usercard-line42`）在 Round 1、Round 2、Round 3 重複出現。

**預期輸出**：

```yaml
oscillation_flags:
  - error_id: "eslint-no-any-usercard-line42"
    appearances:
      - "round_1_tester"
      - "round_2_tester"
      - "round_3_tester"
    diagnosis: "可能原因：any 類型源自第三方套件型別定義不完整，無法透過 inline 修復解決"
```

**預期行為**：

1. 系統偵測到振盪後觸發 Escape Hatch
2. 輸出診斷報告包含已完成的變更與未解決問題

**驗證項目**：

- [ ] `oscillation_flags` 不為空
- [ ] `appearances` 陣列長度 ≥ 3
- [ ] `diagnosis` 欄位包含根因分析
- [ ] 觸發 Escape Hatch（`result: ESCAPED`）

---

## TC-LS-09：context_budget 閾值觸發

**目標**：驗證 Token 使用量達到各閾值時的系統行為。

**前置條件**：Loop 持續執行，Token 使用量持續增加。

**預期行為**：

| budget_pct | 行為                        |
| ---------- | --------------------------- |
| < 60%      | 正常執行                    |
| 60%–80%    | 輸出 WARNING，繼續執行      |
| 80%–90%    | 啟動 Emergency Compression  |
| > 90%      | 觸發 Escape Hatch           |

**驗證項目**：

- [ ] `tokens_used` 為正整數
- [ ] `budget_pct` 格式為 `"NN%"`
- [ ] 60% 以上時 LoopState 或輸出中包含預算警告
- [ ] 超過 90% 時 `result` = `ESCAPED`

---

## TC-LS-10：Escape Hatch 最終狀態

**目標**：驗證 Escape Hatch 觸發後 LoopState 的最終格式正確。

**前置條件**：任一 Escape Hatch 條件成立（rounds ≥ 5 / 振盪 / 預算耗盡 / 安全風險 / spec_hash 不匹配）。

**預期輸出**：

```yaml
---LOOP-STATE---
round: 5
phase: tester
result: ESCAPED
framework: angular-wec
spec_hash: "用戶查詢功能|GET /api, 支援 name, 返回 UserDto"
cumulative_changes:
  - action: created
    file: src/app/features/user/user-list.component.ts
  - action: created
    file: src/app/features/user/user-list.component.spec.ts
errors:
  - error_id: "eslint-no-any-usercard-line42"
    severity: BLOCK
    tool: eslint
    message: "Unexpected any. Specify a different type"
    file: src/app/features/user/user-list.component.ts
    line: 42
warnings: []
resolved_errors:
  - "eslint-no-explicit-return-line18"
oscillation_flags:
  - error_id: "eslint-no-any-usercard-line42"
    appearances:
      - "round_1_tester"
      - "round_2_tester"
      - "round_3_tester"
    diagnosis: "any 類型源自第三方套件型別定義，無法透過 inline 修復解決"
context_budget:
  tokens_used: 32000
  budget_pct: "87%"
---END-LOOP-STATE---
```

**驗證項目**：

- [ ] `result` = `ESCAPED`
- [ ] 診斷報告包含：已完成的變更清單、未解決的問題、根因分析
- [ ] 提供恢復指令（`@dev resume` 或 `@dev restart`）
- [ ] Loop 不自動繼續執行
- [ ] 不降低 AC 要求以通過審查
- [ ] 不跳過 High severity 問題

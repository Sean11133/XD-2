# Inner Auto Loop — Phase Transition Protocol（強制 Phase 轉移協議）

> ⚠️ **MANDATORY**：每次 Phase 完成後，必須執行本協議的三步儀式，禁止跳過。

---

## 核心規則

**Inner Loop 啟動後，只有三種合法的結束方式：**

1. ✅ **Phase E（Reporter）完成** → 輸出 loop-summary.md 並告知 final-report.md 路徑
2. 🚨 **Escape Hatch 觸發**（result = `ESCAPED`） → 輸出 diagnostic-report.md 並等待人工介入修復
3. ⏸️ **Human Intervention Gate 觸發**（result = `HUMAN_REQUIRED`） → 輸出人工介入宣告並**乾淨暫停**，等待使用者決策/操作後繼續

**所有其他停止都是 Bug。** AI 不得在 Phase E 完成前回覆使用者任何「完成」訊息。

> **ESCAPED vs HUMAN_REQUIRED 的差異**：
>
> - `ESCAPED`：發生了需要人工**修復**的錯誤（技術問題、震盪）
> - `HUMAN_REQUIRED`：Loop 正常運行中遇到需要人工**決策/操作**的合法暫停點，不代表失敗

---

## Phase 路由表

| 當前 Phase                 | 結果           | 下一步              | 載入 Prompt                                    |
| -------------------------- | -------------- | ------------------- | ---------------------------------------------- |
| Phase A (Developer)        | PASS           | → Phase B           | `prompts/ai-loop-test.prompt.md`               |
| Phase A (Developer)        | FAIL           | → Escape Hatch      | —                                              |
| Phase B (Tester)           | PASS           | → Phase C           | `prompts/ai-loop-review.prompt.md`             |
| Phase B (Tester)           | FAIL           | → Phase A (Heal)    | `prompts/ai-loop-dev.prompt.md`                |
| Phase C (Reviewer)         | PASS           | → Phase D           | `prompts/ai-loop-integration-test.prompt.md`   |
| Phase C (Reviewer)         | FAIL           | → Phase A (Round++) | `prompts/ai-loop-dev.prompt.md`                |
| Phase D (Integration Test) | PASS / PARTIAL | → Phase E           | `prompts/final-report.prompt.md`               |
| Phase D (Integration Test) | SKIPPED        | → Phase E           | `prompts/final-report.prompt.md`               |
| Phase D (Integration Test) | Type-B FAIL    | → Phase A (Round++) | `prompts/ai-loop-dev.prompt.md`                |
| Phase E (Reporter)         | 完成           | → ✅ Loop Complete  | —                                              |
| **任何 Phase**             | HUMAN_REQUIRED | → ⏸️ 乾淨暫停       | — (輸出人工介入宣告後停止，等待 `@dev resume`) |
| Phase 0 (Init)             | FRAMEWORK_INIT | → ⏸️ 乾淨暫停       | — (框架初始化完成後 `@dev resume`)             |

---

## 強制三步轉移儀式（Mandatory Transition Ritual）

每個 Phase 完成後，**依序執行以下三步，不可省略**：

### Step 1：宣告 Phase 完成

輸出以下格式的宣告行（必須可見於對話）：

```
=== PHASE {A|B|C|D|E} COMPLETE | round: {N} | result: {PASS|FAIL|PARTIAL} ===
```

範例：

```
=== PHASE B COMPLETE | round: 1 | result: PASS ===
```

### Step 2：更新並輸出 LoopState

```yaml
---LOOP-STATE---
round: {N}
phase: {developer|tester|reviewer|integration_tester|reporter}
result: {PASS|FAIL|PARTIAL|ESCAPED}
# ... 其他欄位依 loop-state.schema.yaml 規範
---END-LOOP-STATE---
```

### Step 3：宣告進入下一 Phase 並載入對應 Prompt

根據 Phase 路由表，輸出以下格式並**立即使用 read_file 載入對應 Prompt 檔案**：

```
>>> ENTERING PHASE {X} | Loading: {prompt_path} <<<
```

範例（Phase B PASS 後進入 Phase C）：

```
>>> ENTERING PHASE C (Reviewer) | Loading: prompts/ai-loop-review.prompt.md <<<
```

---

## 各 Phase 進入宣告與強制載入 Prompt

進入每個 Phase 時，**必須先讀取對應的 Prompt 檔案，再執行 Phase 工作**。

| 進入 Phase | 強制宣告                                    | 必須讀取的 Prompt                            |
| ---------- | ------------------------------------------- | -------------------------------------------- |
| Phase A    | `>>> ENTERING PHASE A (Developer)`          | `prompts/ai-loop-dev.prompt.md`              |
| Phase B    | `>>> ENTERING PHASE B (Tester)`             | `prompts/ai-loop-test.prompt.md`             |
| Phase C    | `>>> ENTERING PHASE C (Reviewer)`           | `prompts/ai-loop-review.prompt.md`           |
| Phase D    | `>>> ENTERING PHASE D (Integration Tester)` | `prompts/ai-loop-integration-test.prompt.md` |
| Phase E    | `>>> ENTERING PHASE E (Reporter)`           | `prompts/final-report.prompt.md`             |

> ⚠️ **重要**：Phase E（Reporter）是 Loop 的必要組成部分，**不是可選步驟**。即使 Phase D 為 PARTIAL 或 SKIPPED 狀態，Phase E 仍必須執行。

---

## 禁止行為

❌ 禁止在 Phase E 完成前輸出任何「開發完成」、「任務完成」、「已交付」等結束語  
❌ 禁止在 Phase 之間**無理由**停止等待使用者回應  
❌ 禁止跳過 Phase C（Reviewer）即使「看起來程式碼很正確」  
❌ 禁止跳過 Phase D（Integration Test）即使「沒有整合測試的 plan.md」  
❌ 禁止跳過 Phase E（Reporter）以任何理由  
❌ 禁止在未讀取對應 Prompt 前開始執行下一 Phase  
❌ 禁止在 `HUMAN_REQUIRED` 宣告後自動繼續（必須等待使用者明確的 `@dev resume` 指令）  
✅ **允許**：Human Intervention Gate（`HUMAN_REQUIRED`）觸發時，輸出正式暫停宣告後停止等待使用者操作

---

## 快速自檢（進入每個 Phase 前）

```
□ 上一個 Phase 已輸出 "=== PHASE {X} COMPLETE ===" 宣告？
□ LoopState 已更新並輸出？
□ 已輸出 ">>> ENTERING PHASE {X} <<<" 宣告？
□ 已使用 read_file 載入此 Phase 的 Prompt 檔案？
□ 確認未觸發任何 Escape Hatch 條件（rounds, oscillation, token, security, spec_hash）？
□ 確認未觸發 Human Intervention Gate 條件（initialization_required, architecture_decision, security_review, authorization）？
```

所有項目都打勾後，才可開始當前 Phase 的實際工作。

> ⚠️ 若任一 Gate 觸發，必須先輸出對應的停止宣告（`ESCAPED` 或 `HUMAN_REQUIRED`）再停止，不可靜默終止。

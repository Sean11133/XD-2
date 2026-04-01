---
applyTo: ".github/ai-loop/**"
---

# Inner Auto Loop — 防震盪快速檢查清單

> 📌 **完整定義**：`ai-loop/core/escape-hatch.md`（Escape Hatch 觸發條件與輸出格式）
>
> 本檔為執行時提醒 AI 在開始每個 Round 前必須進行的震盪檢查。

## 每個 Round 開始前必須確認

- [ ] 掃描 `current_errors` 中的所有 error_id
- [ ] 比對歷史 rounds：任一 error_id 出現 ≥ 3 次 → 加入 `oscillation_flags`，**立即停止**
- [ ] `oscillation_flags.length >= 1` → 觸發 Escape Hatch（result: `ESCAPED`）

## Escape Hatch 觸發條件（任一成立即停止）

- [ ] `rounds >= 5`
- [ ] `oscillation_flags.length >= 1`（震盪偵測）
- [ ] `context_budget.budget_pct > "90%"`
- [ ] 偵測到 `SECURITY_RISK` error
- [ ] `spec_hash mismatch`（Spec 被修改）

## 不允許的「解決方式」

- ❌ `// eslint-disable-next-line` 抑制 Lint 規則
- ❌ 加 `@Ignore` / `pytest.mark.skip` 跳過失敗測試
- ❌ 修改測試預期值以符合錯誤程式碼
- ❌ 使用 `any` 型別繞過 TypeScript 錯誤
- ❌ 在 catch 區塊吞掉錯誤

## 震盪時的正確應對

1. **第 3 次出現**同一 error_id → 暫停直接修復，分析根本原因
2. 查閱 `standards/` 文件確認正確做法
3. 嘗試**完全不同的修復策略**（重構而非 patch）

---
applyTo: ".github/ai-loop/**"
---

# Inner Auto Loop — 防震盪機制

> 定義循環震盪（Oscillation）的偵測規則與 Escape Hatch 觸發條件。

## 什麼是震盪（Oscillation）

**定義**：同一個 `error_id` 在連續 3 個或更多 round 中反覆出現，卻未被真正解決。

**成因分析**：

1. **互斥修復**：修復 A 導致 B 失敗，修復 B 又導致 A 失敗
2. **測試誤導**：測試對業務邏輯的假設有誤，導致程式碼永遠無法通過
3. **架構衝突**：Task 本身的設計違反了框架約束，無法在 AI 能力範圍內解決
4. **Context 汙染**：之前 round 的錯誤 context 污染了當前決策

---

## 震盪偵測演算法

```yaml
# 在每個 round 開始時執行
oscillation_check:
  for each error_id in current_errors:
    count = count_appearances(error_id, all_previous_rounds)
    if count >= 3:
      mark_as_oscillating(error_id)
      add_to_oscillation_flags(error_id)
```

### 輸出格式

```yaml
oscillation_flags:
  - error_id: "eslint-no-any-usercard-line42"
    appearances: [round_1, round_2, round_3]
    diagnosis: "型別 User 需要明確定義，建議建立 interface User 並放置於 shared/models/"
```

---

## Escape Hatch 觸發條件

以下任一條件成立時，立即停止 Loop 執行並輸出診斷報告：

| 條件                                | 說明                             |
| ----------------------------------- | -------------------------------- |
| `rounds >= 5`                       | 超過最大輪次限制                 |
| `oscillation_flags.length >= 1`     | 偵測到至少一個震盪錯誤           |
| `context_budget.budget_pct > "90%"` | Token 預算耗盡                   |
| `SECURITY_RISK error detected`      | 偵測到安全性風險（立即停止）     |
| `spec_hash mismatch`                | Spec 在 Loop 中被修改（D0 失敗） |

---

## Escape Hatch 輸出格式

```markdown
## ⚠️ Inner Loop Escaped — 需要人工介入

**觸發原因**：[震盪偵測 / 輪次上限 / 預算耗盡 / 安全風險 / Spec 修改]
**發生輪次**：Round {N}
**當前階段**：{developer / tester / reviewer}

### 未解決問題清單

| #   | error_id                        | 出現次數 | 根因分析                         |
| --- | ------------------------------- | -------- | -------------------------------- |
| 1   | `eslint-no-any-usercard-line42` | 4 次     | User 型別未在任何 module 匯出... |

### 已完成的變更

{cumulative_changes 列表}

### 建議的人工介入方向

1. **立即行動**：{具體建議，包含檔案路徑和行號}
2. **架構調整**：{若有架構設計問題}
3. **測試修正**：{若測試本身有誤}

### 恢復 Loop 的指令

在解決上述問題後，可執行以下指令恢復：
`@dev resume round:{N+1}`
```

---

## 防震盪策略

### 第 3 次出現相同錯誤時（震盪預警）

1. **暫停**直接修復，先分析根本原因
2. **查閱**對應的 `standards/` 文件確認正確做法
3. **嘗試完全不同**的修復策略（重構而非 patch）
4. **明確說明**選擇該策略的原因

### 不允許的「解決方式」

- ❌ 抑制 linting 規則（`// eslint-disable-next-line`）來讓 Lint 通過
- ❌ 將失敗的測試加上 `@Ignore` / `pytest.mark.skip`
- ❌ 修改測試預期值以符合錯誤程式碼
- ❌ 使用 `any` 型別繞過 TypeScript 型別錯誤
- ❌ 在 catch 區塊吞掉錯誤不處理

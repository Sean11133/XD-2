# Diagnostic Report Template — Escape Hatch 診斷報告

> 用途：當 Escape Hatch 觸發時，以此格式輸出完整診斷報告。
> 此報告同時服務兩個目的：(1) 人工審查問題原因；(2) 恢復 Loop 時的狀態輸入。

---

## 完整診斷報告格式

```markdown
# ⚠️ AI Inner Loop 診斷報告

**產生時間**：{Round N, Phase X}
**觸發原因**：{reason_code} — {reason_description}
**Framework**：{framework}
**執行統計**：{N} rounds, {total_phases} phases 執行

---

## 1. 執行摘要

| 項目 | 值 |
|------|---|
| Spec Title | {spec.title} |
| Spec Hash | `{spec_hash}` |
| 最後成功 Phase | Round {N}, {phase} |
| 未解決 BLOCK 錯誤 | {count} 個 |
| 未完成 AC | {count} 個 |

### AC 完成狀態

| # | 驗收條件 | 狀態 |
|---|---------|------|
| 1 | {AC1 前 20 字} | ✅ 通過 |
| 2 | {AC2 前 20 字} | ❌ 未通過 |
| 3 | {AC3 前 20 字} | ⏸ 未驗證 |

---

## 2. 已完成的工作

### 2.1 累積檔案變更（{count} 個）

| 動作 | 檔案路徑 | 狀態 |
|------|----------|------|
| ✅ created | `src/...` | 已完成 |
| ✅ modified | `src/...` | 已完成 |
| ⚠️ modified | `src/...` | 部分完成（被 Escape 中斷）|

### 2.2 已通過的 Phase

| Round | Phase | 結果 |
|-------|-------|------|
| 1 | Developer | ✅ PASS |
| 1 | Tester | ✅ PASS |
| 1 | Reviewer | ❌ FAIL → Round 2 |
| 2 | Developer | ✅ PASS |
| 2 | Tester | ❌ FAIL → Escaped |

---

## 3. 未解決問題分析

### 3.1 錯誤清單

| error_id | 出現次數 | 工具 | 訊息 |
|----------|----------|------|------|
| `{error_id}` | {N} 次 | {tool} | {message} |

### 3.2 震盪分析（若有）

**震盪 error_id**：`{error_id}`

| 輪次 | 修復嘗試 | 結果 |
|------|---------|------|
| Round 1 | {修復方式 A} | 引入了 {error_id_B} |
| Round 2 | {撤銷 A，嘗試 B} | 重新引入了 {error_id} |
| Round 3 | {嘗試 C} | 與 Round 1 相同 |

**根因診斷**：
{說明為何這個 error 無法在不引入其他問題的情況下修復，通常涉及架構問題}

### 3.3 架構衝突（若有）

{若問題源於架構設計衝突，在此說明}

---

## 4. 人工介入建議

### 4.1 立即修復步驟

> 按優先順序排列，預計修復時間

1. **[HIGH]** {具體行動}: `{file_path}:{line}` → {說明要做什麼}
2. **[HIGH]** {具體行動}: ...
3. **[MEDIUM]** {建議行動}: ...

### 4.2 可能需要的架構調整

{若診斷認為需要調整架構，在此提出；否則留空}

### 4.3 測試修正（若測試本身有問題）

{若測試 Mock 設定不正確或 AC 測試條件有誤，在此說明}

---

## 5. 恢復 Loop

### 方式 A：解決問題後繼續（推薦）

```
解決上述第 4.1 節的問題後，在 Copilot Chat 中輸入：

@dev resume
spec_hash: "{spec_hash}"
continue_from: "Round {N+1}"
```

### 方式 B：重新開始完整 Loop

```
@dev restart
```
警告：重新開始會丟失本次 Loop 的所有上下文，但檔案變更已保留。

---

## 6. Raw Loop State

```yaml
---LOOP-STATE---
round: {N}
phase: {phase}
result: ESCAPED
framework: {framework}
spec_hash: "{spec_hash}"
cumulative_changes:
{cumulative_changes_yaml}
errors:
{errors_yaml}
oscillation_flags:
{oscillation_flags_yaml}
context_budget:
  tokens_used: {N}
  budget_pct: "{N}%"
---END-LOOP-STATE---
```
```

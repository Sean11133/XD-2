---
name: ai-loop
description: |
  This skill should be used when the user asks about "inner loop", "ai loop",
  "loop 怎麼用", "loop 怎麼跑", "怎麼觸發 loop", "自動化開發",
  "loop 卡住", "escape hatch", "resume loop", "restart loop",
  or needs guidance on triggering, resuming, or debugging the AI Inner Auto Loop.
---

# AI Inner Loop Skill

## 角色

你是 AI Inner Loop 的解說員和協調者。當使用者詢問 Loop 如何工作，
或需要幫助觸發、恢復、除錯 Loop 時，你提供清晰的指引。

## 觸發條件

```
inner loop / ai loop / loop / 自動化開發 / loop 怎麼用 / 怎麼觸發
```

---

## Inner Loop 概念說明

Inner Auto Loop 是一個 AI 自動執行的完整關閉循環：

```
@dev 觸發 Loop
      │
      ▼
┌───────────────────────────────────────┐
│  Phase 0: Project Discovery（既有專案）  │
│  ───────────────────────────────────  │
│  Round 1-N                           │
│  ① Developer：根據 spec 實作程式碼  │
│  ② Tester：Lint → Build → 單元 Test    │
│     └─ FAIL → Heal → 重新測試       │
│  ③ Reviewer：審查品質 + spec 完整性 │
│     └─ HIGH 問題 → 回到 Developer   │
│  ───────────────────────────────────  │
│  全部 PASS → Phase D                 │
│  ───────────────────────────────────  │
│  Phase D: Integration Tester          │
│     ├─ PASS/PARTIAL → Phase E       │
│     └─ 類型 B FAIL → 回到 Round N+1  │
│  ─────────────────────────────────────  │
│  Phase E: Reporter（自動）            │
│     └─ 產出 final-report.md          │
│  ─────────────────────────────────────  │
│  最多 5 rounds → Escape Hatch ⚠️     │
└───────────────────────────────────────再
      │
      ▼
`docs/{NNN}-{需求簡述}/final-report.md`（自動產出）
```

---

## 如何觸發 Loop

### 方式 A：直接描述需求（最簡單）

```
@dev 幫我實作用戶查詢功能，API GET /api/users?name=...，回傳 UserDto[]
```

### 方式 B：使用 spec.yaml（最正式）

```
@dev 請根據以下 spec 開始 Inner Loop：

spec_version: "1.0"
title: "用戶查詢功能"
scope: auto
acceptance_criteria:
  - |
    Given 用戶已登入
    When 呼叫 GET /api/users?name=Alice
    Then 回傳符合條件的 UserDto[]，HTTP 200
```

### 方式 C：搭配需求工作區中的 plan.md Task

```
@dev 根據 docs/001-用戶查詢/plan.md 執行 T-03（用戶查詢 Repository 實作）
```

### 需求工作區約定

- 完整流程預設使用 `docs/{NNN}-{需求簡述}/` 作為單一需求工作區
- `spec.md`、`plan.md`、`loop-summary.md`、`integration-test-report.md`、`diagnostic-report.md`、`final-report.md` 應集中在同一資料夾
- 若需求工作區尚未建立，先由 `@pm` 建立，再交由 `@architect`、`@dev`、`@reporter` 延續

---

## 如何解讀 LoopState

每個 Phase 完成後，@dev 會輸出 LoopState：

```yaml
---LOOP-STATE---
round: 2
phase: tester
result: FAIL         # ← 此 Phase 未通過
framework: dotnet
spec_hash: "用戶查詢|GET /api, 回傳 UserDto"
errors:
  - error_id: "xunit-test-fail-getbyid-line67"
    severity: BLOCK
    message: "AssertionError: Expected UserDto, got null"
---END-LOOP-STATE---
```

**解讀要點：**

- `result: FAIL` + `errors[]` → Loop 正在嘗試修復中，不需要手動介入
- `result: ESCAPED` → 需要人工介入（見下方）

---

## Escape Hatch 後的處理

當看到 `result: ESCAPED`，閱讀 Diagnostic Report，然後：

```
# 方式 1：解決問題後繼續
@dev resume
spec_hash: "用戶查詢|GET /api, 回傳 UserDto"
continue_from: "Round 3"

# 方式 2：重新開始
@dev restart
```

---

## 更多資訊

| 主題              | 文件位置                                            |
| ----------------- | --------------------------------------------------- |
| Loop 骨架         | `ai-loop/core/loop-orchestrator.md`                 |
| 狀態格式          | `ai-loop/core/loop-state.schema.yaml`               |
| Escape 條件       | `ai-loop/core/escape-hatch.md`                      |
| Token 預算        | `ai-loop/core/context-budget.md`                    |
| 框架指令          | `ai-loop/adapters/{framework}/commands.yaml`        |
| 審查維度          | `ai-loop/adapters/{framework}/review-dimensions.md` |
| 專案探索          | `ai-loop/core/project-discovery.md`                 |
| 專案 Profile 格式 | `ai-loop/core/project-profile.schema.yaml`          |
| 整合測試 Phase D  | `prompts/ai-loop-integration-test.prompt.md`        |
| 整合測試報告範本  | `ai-loop/templates/integration-test-report.md`      |

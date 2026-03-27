# Inner Auto Loop — Escape Hatch（逃生機制）

> 當 Loop 無法自動完成時的安全停止機制，確保 AI 不會無限循環或越權修改。

## 停止類型總覽

Inner Auto Loop 有兩種合法的「非完成」停止：

| 類型                                    | result 狀態      | 觸發原因                     | 恢復方式                     |
| --------------------------------------- | ---------------- | ---------------------------- | ---------------------------- |
| **Escape Hatch**（錯誤停止）            | `ESCAPED`        | 技術錯誤、震盪、Token 耗盡   | 人工修復後 `@dev resume`     |
| **Human Intervention Gate**（乾淨暫停） | `HUMAN_REQUIRED` | 需要人工決策 / 初始化 / 授權 | 完成指定操作後 `@dev resume` |

> ⚠️ 兩者都必須輸出正式停止宣告，且在 AI 收到使用者回覆前**禁止自動繼續**。

---

## Escape Hatch 觸發條件

以下任一條件成立時，**立即停止** Loop 執行（result = `ESCAPED`）：

| 條件                 | 觸發值                                 | 說明                                     |
| -------------------- | -------------------------------------- | ---------------------------------------- |
| 輪次超限             | `rounds >= 5`                          | 超過最大嘗試次數                         |
| 震盪偵測             | `oscillation_flags.length >= 1`        | 相同錯誤反覆出現 3+ 次                   |
| Token 耗盡           | `context_budget.budget_pct > "90%"`    | 工作記憶不足                             |
| 安全風險             | `SECURITY_RISK error detected`         | 偵測到安全漏洞（立即停止）               |
| Spec 被篡改          | `spec_hash mismatch`                   | Reviewer D0 驗證失敗                     |
| 人工強制             | `@dev escape`                          | 使用者手動觸發                           |
| Phase 不完整（軟停） | AI 在 Phase E 前嘗試輸出「完成」或停止 | 提醒使用者補充執行 @reviewer / @reporter |

---

## Human Intervention Gate 觸發條件

以下任一條件成立時，Loop **乾淨暫停**（result = `HUMAN_REQUIRED`），等待使用者操作：

| 條件               | gate_type                | 說明                                                        |
| ------------------ | ------------------------ | ----------------------------------------------------------- |
| 框架尚未初始化     | `FRAMEWORK_INIT`         | `project-profile.yaml` 顯示 `initialization_required: true` |
| 需要架構決策       | `ARCHITECTURE_DECISION`  | 使用者尚未選擇框架（如 Python API 框架、.NET 版本）         |
| 安全漏洞需人工審查 | `SECURITY_REVIEW`        | Reviewer 偵測 🔴 Security 問題且不允許 AI 自動修復          |
| 高風險操作需授權   | `AUTHORIZATION_REQUIRED` | 即將執行不可逆操作（如 DB migration, force push 等）        |

**與 Escape Hatch 的差異**：Human Intervention Gate 是**預期中的正常暫停**，不代表 Loop 失敗。

---

## Escape Hatch 輸出格式

當觸發 Escape Hatch 時，必須輸出完整的診斷報告：

```markdown
## ⚠️ Inner Loop Escaped — 需要人工介入

**觸發原因**：{reason}
**觸發輪次**：Round {N}, Phase {phase}
**Framework**：{framework}
**執行時間**：{rounds} rounds

---

### 已完成的工作

**累積變更（{count} 個檔案）：**
| 動作 | 檔案路徑 |
|------|----------|
| ✅ created | src/... |
| ✅ modified | src/... |

**已通過的 Phase：**

- Round 1 Developer: ✅
- Round 1 Tester: ✅
- Round 1 Reviewer: ❌（觸發 Escape）

---

### 未解決的問題

| #   | error_id                    | 出現次數 | 嚴重度 | 根因分析                       |
| --- | --------------------------- | -------- | ------ | ------------------------------ |
| 1   | `eslint-no-any-user-line42` | 4 次     | BLOCK  | User 型別未在 index.ts 匯出... |

---

### 人工介入建議

**立即行動（修復未解決問題）：**

1. 在 `src/app/shared/models/user.model.ts` 新增 `User` interface 並在 `index.ts` 匯出
2. 將 `UserListComponent` 的 `any` 型別替換為 `User[]`

**架構調整建議（若有）：**

- ...

**測試修正建議（若測試本身有誤）：**

- ...

---

### 恢復 Loop 的方式

解決上述問題後，在 Copilot Chat 中輸入：
```

@dev resume
Round: {N+1}
spec_hash: "{original_spec_hash}"

```

或重新開始完整 Loop：

```

@dev restart

````

---

### Raw LoopState

```yaml
---LOOP-STATE---
round: {N}
phase: {phase}
result: ESCAPED
...（完整 LoopState）
---END-LOOP-STATE---
````

```

---

## 各觸發原因的標準回應

### 輪次超限（rounds >= 5）

```

觸發原因：輪次超限（已執行 5 rounds 仍未通過所有 Phase）
根因分析：
Round 1-5 重複出現以下錯誤：{列出未解決的 error_id}
可能原因：Task 複雜度超出預期 / AC 定義不夠明確 / 架構設計需調整

```

### 震盪偵測

```

觸發原因：震盪偵測（error_id "{error_id}" 出現 {N} 次）
根因分析：
每次修復此錯誤時，都同時引入或還原了另一個問題。
互斥的修復需要：{描述架構層面的根本問題}

```

### 安全風險

```

觸發原因：安全風險偵測
⛔ 重要：以下安全問題需要立即人工審查，不允許 AI 自動修復

1. {describe the risk, e.g. "SQL Injection detected in UserRepository.cs:42"}
2. {another risk}

請由資深工程師或安全專家處理以上問題後再繼續開發。

```

### Phase 不完整（軟停）

```

⚠️ 注意：Inner Loop 尚未完成所有必要 Phase

已完成：Phase {已完成的 Phase 清單}
未完成：Phase {未完成的 Phase 清單}

若上述 Phase 未自動執行，請手動補充：

- Phase C（程式碼審查）→ 呼叫 @reviewer
- Phase E（最終報告） → 呼叫 @reporter

或使用 @dev resume 繼續未完成的 Phase。

```

---

## 逃生後的恢復流程

```

人工修復問題
↓
@dev resume → 繼續從失敗的 Phase 繼續
↓
或 @dev restart → 重新從第 1 輪開始（清除所有狀態）

`````

## 不允許 AI 在 Escape Hatch 後執行的操作

- ❌ 自動繼續 Loop（人工確認後才能重啟）
- ❌ 降低 AC 要求以「讓 Loop 通過」
- ❌ 跳過 Reviewer Phase 的 🔴 High 問題
- ❌ 修改 spec_hash（意圖規避 D0 檢查）
- ❌ 在 Phase E 完成前向使用者報告「開發完成」或「任務完成」

---

## Human Intervention Gate 輸出格式

當觸發 Human Intervention Gate 時，**必須輸出以下格式的暫停宣告**並完全停止：

````markdown
## ⏸️ Human Intervention Required — Loop 暫停等待輸入

**閘道類型**：{FRAMEWORK_INIT | ARCHITECTURE_DECISION | SECURITY_REVIEW | AUTHORIZATION_REQUIRED}
**觸發階段**：{Phase 0 / Phase A / Phase C / ...}
**Framework**：{framework}

---

### 需要您完成的操作

{根據 gate_type 填入具體說明，見下方模板}

---

### Loop 恢復方式

完成上述操作後，輸入：

`````

@dev resume
spec_hash: "{original_spec_hash}"
continue_from: "{下一步描述，例如：Phase 0 完成後 / Round 1 Phase A}"

```

```

---LOOP-STATE---
round: {N}
phase: {init | developer | reviewer | ...}
result: HUMAN_REQUIRED
framework: {framework}
spec_hash: "{spec_hash}"
human_intervention:
gate_type: {FRAMEWORK_INIT | ARCHITECTURE_DECISION | SECURITY_REVIEW | AUTHORIZATION_REQUIRED}
reason: "{詳細說明}"
options: # 僅 ARCHITECTURE_DECISION 時填寫 - id: "option-a"
label: "FastAPI + wecpy"
description: "..."
resume_instruction: "@dev resume spec_hash: \"...\" continue_from: \"...\""
cumulative_changes: [...]
context_budget:
tokens_used: {N}
budget_pct: "{N}%"
---END-LOOP-STATE---

---

### FRAMEWORK_INIT 輸出模板

```markdown
### 需要您完成的操作

偵測到 **{框架名稱}** 專案，但框架尚未完成初始化：

**問題**：{具體描述，例如：upstream remote 未設定 / wecpy 缺少 config.yaml}

**請執行以下步驟**：

1. {步驟 1，例如：在 GitLab 上 fork wec-main 到您的 Group}
2. {步驟 2}
3. （可選）執行 skill：`{skill_name}`

完成後請告知，或直接輸入 `@dev resume`。
```

---

### ARCHITECTURE_DECISION 輸出模板

```markdown
### 需要您做出架構選擇

在繼續開發前，需要您確認以下決策：

**決策點**：{描述，例如：Python API 框架選擇}

| 選項       | 說明                                | 適用場景                |
| ---------- | ----------------------------------- | ----------------------- |
| A. FastAPI | 高效能非同步框架，與 wecpy 整合良好 | API-first，高並發需求   |
| B. Flask   | 輕量級同步框架，學習曲線低          | 簡單 REST API，快速原型 |

**請回覆您的選擇**（例如：「選 A」或「使用 FastAPI」），AI 將繼續並自動帶入正確的框架初始化流程。
```

---

### SECURITY_REVIEW 輸出模板

```markdown
### ⛔ 安全問題需要人工審查（不允許 AI 自動修復）

Reviewer Phase 偵測到以下安全風險，**必須由資深工程師或安全專家**審查後才能繼續：

| #   | 風險類型              | 位置        | 說明      |
| --- | --------------------- | ----------- | --------- |
| 1   | {e.g., SQL Injection} | {file:line} | {details} |

**審查後請執行**：

- 手動修復上述問題，或
- 確認風險可接受並輸入 `@dev resume` 繼續（需在 commit message 中記錄豁免理由）
```

---

### AUTHORIZATION_REQUIRED 輸出模板

```markdown
### ⚠️ 高風險操作需要您的明確授權

即將執行以下**不可逆**操作，需要您確認：

| 操作                     | 影響範圍                    | 風險等級 |
| ------------------------ | --------------------------- | -------- |
| {e.g., DROP TABLE users} | {e.g., 生產資料庫 users 表} | 🔴 HIGH  |

**請輸入 `@dev resume` 確認授權**，或輸入 `@dev escape` 取消。
```

```

```

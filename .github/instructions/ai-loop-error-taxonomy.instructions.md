---
applyTo: ".github/ai-loop/**"
---

# Inner Auto Loop — 錯誤分類學

> 定義 AI Loop 中錯誤的分類、嚴重度與修復策略。

## 錯誤分類

### BLOCK（阻斷型）— 必須修復才能繼續

| 分類            | 描述                                                         | 觸發 Fast-Fail    |
| --------------- | ------------------------------------------------------------ | ----------------- |
| `COMPILE_ERROR` | 編譯失敗（C# CS\*、TypeScript 型別錯誤、Python SyntaxError） | ✅ 跳過測試       |
| `LINT_BLOCK`    | Linting 規則違反（ESLint error、ruff E/W 規則）              | ✅ 跳過測試       |
| `BUILD_FAIL`    | 建置失敗（ng build、dotnet build）                           | ✅ 跳過測試執行   |
| `TEST_FAIL`     | 測試斷言失敗                                                 | ❌ 進入 Heal 階段 |
| `SECURITY_RISK` | SQL Injection、硬編碼密碼等                                  | ✅ 立即停止       |

### WARN（警告型）— 建議修復但不阻斷

| 分類           | 描述                          |
| -------------- | ----------------------------- |
| `COVERAGE_LOW` | 測試覆蓋率 < 80%              |
| `STYLE_WARN`   | 格式問題（可自動修復）        |
| `PERF_HINT`    | 可能的效能問題（如 N+1 查詢） |
| `DEBT_MARKER`  | TODO/FIXME 標記               |

---

## 框架特定錯誤模式

### Angular / TypeScript（ESLint + TypeScript Compiler）

```
TS2322: Type 'X' is not assignable to type 'Y'
  → 分類: COMPILE_ERROR | 修復: 修正型別定義或加型別斷言（謹慎使用 as）

TS2339: Property 'X' does not exist on type 'Y'
  → 分類: COMPILE_ERROR | 修復: 確認屬性存在或更新型別

@angular-eslint/no-any
  → 分類: LINT_BLOCK | 修復: 替換 any 為明確型別或 unknown

Cannot find module 'X'
  → 分類: COMPILE_ERROR | 修復: 確認 import 路徑和 module 是否已匯出
```

### .NET C#（MSBuild + xUnit）

```
CS0246: The type or namespace name 'X' could not be found
  → 分類: COMPILE_ERROR | 修復: 新增 using 或安裝 NuGet 套件

CS8600: Converting null literal or possible null value
  → 分類: COMPILE_ERROR | 修復: 加 null 檢查或使用 ?.、??

xUnit.Assert.Equal failed: Expected X, Actual Y
  → 分類: TEST_FAIL | 修復: 分析業務邏輯是否有 bug

NullReferenceException in test
  → 分類: TEST_FAIL | 修復: 確認 Arrange 中的 mock/stub 是否設定完整
```

### Python（ruff + pytest）

```
E501: Line too long (> 120 chars)
  → 分類: LINT_BLOCK | 修復: 換行（ruff format 可自動修復）

F401: 'X' imported but unused
  → 分類: LINT_BLOCK | 修復: 移除或使用該 import

AssertionError in pytest
  → 分類: TEST_FAIL | 修復: 分析斷言期望值是否正確

mypy: error: Argument of type "X" cannot be assigned to parameter of type "Y"
  → 分類: COMPILE_ERROR | 修復: 修正型別標注
```

---

## Heal 策略

### 策略矩陣

| 情境                         | 修復策略                                |
| ---------------------------- | --------------------------------------- |
| 同一 error_id 出現 1–2 次    | 直接修復（最小變更）                    |
| 同一 error_id 出現 3 次      | 嘗試重構（替代方案）                    |
| 同一 error_id 出現 5 次      | 觸發 Escape Hatch                       |
| 多個 error_id 同時出現       | 優先修復 BLOCK > WARN，從最底層錯誤開始 |
| TEST_FAIL 懷疑測試本身有問題 | 分析測試邏輯，僅在有明確理由時修改測試  |

### 最小修改原則

1. **一次只修一個問題**（防止引入新錯誤）
2. **不做無關重構**（只修改直接相關的程式碼）
3. **保留所有測試**（不刪除、不跳過失敗的測試）
4. **修改後記錄**（在 Loop State 的 `cumulative_changes` 中登記）

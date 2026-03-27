# Angular WEC Adapter — Error Parser

> `parseErrorOutput(rawOutput)` 實作：將 Angular/ESLint/Karma 工具輸出轉為統一 ParsedError[] 格式。

## ESLint JSON 輸出解析（Lint Phase）

### 輸入格式（`ng lint --format json`）

```json
[
  {
    "filePath": "/project/src/app/user/user-list.component.ts",
    "messages": [
      {
        "ruleId": "@typescript-eslint/no-explicit-any",
        "severity": 2,
        "message": "Unexpected any. Specify a different type.",
        "line": 42,
        "column": 15,
        "source": "any"
      }
    ]
  }
]
```

### 解析規則

| 欄位 | 映射來源 | 說明 |
|------|---------|------|
| `error_id` | `{tool}-{ruleId_slug}-{filename_slug}-line{N}` | ruleId 取最後部分，去除 `@typescript-eslint/` 等前綴 |
| `severity` | ESLint `severity: 2` → `BLOCK`；`severity: 1` → `WARN` | |
| `tool` | `"eslint"` | 固定值 |
| `message` | ESLint `message` | 直接映射 |
| `file` | `filePath` 相對路徑 | 去除 project root 前綴 |
| `line` | `line` | 直接映射 |

### 常見規則嚴重度對應

| ESLint Rule | severity | 原因 |
|-------------|----------|------|
| `@typescript-eslint/no-explicit-any` | BLOCK | 型別安全基本要求 |
| `@angular-eslint/component-class-suffix` | BLOCK | Angular 命名規範 |
| `@angular-eslint/no-empty-lifecycle-method` | WARN | 無害但應清理 |
| `@typescript-eslint/no-unused-vars` | WARN | 開發階段常見 |
| `prefer-const` | WARN | 程式碼習慣 |

---

## TypeScript 編譯錯誤解析（Build Phase）

### 輸入格式（`ng build` TypeScript 錯誤）

```
src/app/user/user-list.component.ts:42:15 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

### 解析規則

| 欄位 | 映射來源 |
|------|---------|
| `error_id` | `ts-ts{errorCode}-{filename_slug}-line{N}` |
| `severity` | `BLOCK`（所有 TypeScript 錯誤） |
| `tool` | `"tsc"` |

### 常見 TypeScript 錯誤代碼

| TS Error | 中文說明 |
|----------|---------|
| TS2345 | 型別不相容（Argument of type X is not assignable to Y） |
| TS2322 | 型別賦值錯誤 |
| TS2304 | Cannot find name（缺少 import 或宣告） |
| TS2339 | Property X does not exist on type Y |
| TS7006 | Parameter X implicitly has an 'any' type |

---

## Karma/Jasmine 測試輸出解析（Test Phase）

### 輸入格式（Karma stdout）

```
FAILED: UserListComponent > should display user names
Expected 'Alice' to equal 'Bob'.
  at UserListComponent.spec.ts:25:35
```

### 解析規則

| 欄位 | 映射來源 |
|------|---------|
| `error_id` | `karma-test-fail-{test_slug}-line{N}` |
| `severity` | `BLOCK`（測試失敗）|
| `tool` | `"karma"` |

---

## error_id 生成範例

```
ESLint no-explicit-any, UserListComponent.ts, line 42
→ eslint-no-explicit-any-user-list-component-line42

TypeScript TS2345, UserCardComponent.ts, line 18
→ tsc-ts2345-user-card-component-line18

Karma test fail, UserListComponent.spec.ts, line 25
→ karma-test-fail-user-list-component-spec-line25
```

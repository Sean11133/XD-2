---
name: wec-system-init
description: This skill should be used when the user asks to "建立新系統", "建立前端系統", "新增系統模組", "ng generate library", "建立 WEC 系統", "app-config 要怎麼設", "註冊 SystemModule", or wants to bootstrap a new business system under projects/{system}.
---

# WEC System Initialization Skill

依 WEC 微前端標準流程建立新系統模組，確保程式碼落在 `projects/{system}`，並完成 module、config、路由對接。

## Purpose

- 以固定流程建立可運作的系統 library。
- 避免把業務程式碼放到 `src/app`。
- 保證系統名稱、Menu.href、setView 名稱的一致性。

## Required Inputs

先蒐集兩項資訊：

- 系統名稱（英文，需對齊 iMX Portal AppName）
- 系統場別（0/1/2/3）

如果使用者只說「幫我建立個前端系統」這類自然語句，先不要展開實作，先回收這兩個欄位。

## Workflow

### 1) 建立 library

執行：

- `ng generate library "{system}" --prefix={systemLower} --standalone=false`

### 2) 清理 path 映射

檢查並移除 `tsconfig.json` 自動新增的 dist path 映射，避免本地編譯路徑錯置。

### 3) 更新系統 module

在 `projects/{system}/src/lib/{system}.module.ts` 中：

- 匯入 `WecComponentsModule` 與 `SystemModule`
- 設定 `name = '{system}'`
- 在 `init()` 註冊 `setView('home', ...)`

### 4) 註冊到 shell

更新 `src/app/app.config.ts`：

- 匯入 `{PascalSystem}Module`
- 加入 `importProvidersFrom(...)`

### 5) 設定 app-config

更新 `src/assets/app-config.json`：

- `app` = 系統名稱
- `location` = 系統場別

### 6) 校正 public API

更新 `projects/{system}/src/public-api.ts`，只暴露 module 入口。

### 7) 啟動驗證

執行啟動並檢查 `#/` 路徑可載入。

## Guardrails

- 將所有新功能檔案放在 `projects/{system}/src/**`。
- 使用 Reactive Forms；若使用 `formControlName`，必須有父層 `[formGroup]`。
- 不使用已棄用元件（`wec-button-group`、`wec-combo-box`）。
- 優先採用 WEC Layout classes，不保留不必要 inline style。

## Output Checklist

- 系統建立命令已執行
- module / app.config / app-config / public-api 已更新
- 首頁 view 已註冊
- 啟動驗證結果

## Additional Resources

- `../../prompts/wecui-init.prompt.md`
- `../../instructions/wec-components.instructions.md`
- `../../instructions/wec-core.instructions.md`
- `../../copilot-instructions.md`

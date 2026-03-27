---
name: wec-menu-development
description: This skill should be used when the user asks to "新增選單", "建立功能頁", "建立 view + service", "setView", "setCustomLocalMenu", "註冊 menu", or wants to add a new menu feature under an existing WEC system.
---

# WEC Menu Development Skill

在既有系統下建立新功能選單，完成 component/service/module/menu 註冊與畫面實作，遵守 WEC UI 開發規範。

## Purpose

- 把「新增選單」流程模組化。
- 讓每次新增功能都維持一致的檔案結構與品質。
- 快速產出可維護的 page + service 組合。

## Best Fit

- 適合處理「在既有 system 中新增一個可被 menu 進入的新功能頁」。
- 若重點是既有頁面的 AG Grid 欄位、renderer、編輯器與 `AgGridOptions` 設計，優先改用 `wec-aggrid-page`。
- 若重點只是抽離或建立 API service，優先改用 `wec-service-dataservice-crud`。

## Required Inputs

先取得以下資訊：

- 系統名稱（英文）
- 選單名稱（kebab-case）
- 選單顯示名稱（中/英文）
- 父選單名稱（可選）

## Workflow

### 1) 產生基礎檔案

建立：

- standalone component：`system/views/{menu}`
- service：`system/services/{menu}.service.ts`

### 2) 實作 service

在 service 中：

- 繼承 `DataService`
- 實作 `protected get app()`
- 建立查詢、新增、更新、刪除、單筆查詢方法

### 3) 註冊 module 與 view

更新 `{system}.module.ts`：

- 匯入 standalone component 到 `imports`
- 在 `init()` 設定 `setView('{menu}', {MenuComponent})`
- 透過 `setCustomLocalMenu` 加入入口

### 4) 實作畫面

優先使用：

1. `@wec/components`
2. AG-Grid（若有清單需求）
3. Nebular

並遵守：

- `@if/@for/@switch`
- WEC Layout class（`fx-row`, `fx-column`, ...）
- 移除不必要 inline styles

### 5) 實作元件狀態與錯誤處理

建議模式：

- `BehaviorSubject` 提供資料流
- `takeUntil` + `destroy$` 進行資源釋放
- `catchError` 回傳安全預設值

### 6) AG Grid 規範（若使用）

- `class="ag-theme-balham"`
- 使用 `AgGridOptions`（from `@wec/components`）
- 將主要設定集中於 `gridOptions`

## Guardrails

- 所有系統功能碼放在 `projects/{system}/src/**`。
- 不使用淘汰元件：`wec-button-group`、`wec-combo-box`。
- 若為 Reactive Forms，`formControlName` 必須位於 `[formGroup]` 內。

## Output Checklist

- component + service 已建立
- module 的 setView 與 menu 註冊完成
- 畫面符合 WEC 規範
- API 互動與錯誤處理完成

## Additional Resources

- `../../prompts/wecui-develop.prompt.md`
- `../../instructions/wec-components.instructions.md`
- `../../instructions/wec-core.instructions.md`
- `../../../../instructions/angular-page-layouts.instructions.md` — 頁面版型骨架
- `../../../../instructions/angular-comp-practices.instructions.md` — Angular UI 最佳實踐
- `../../copilot-instructions.md`

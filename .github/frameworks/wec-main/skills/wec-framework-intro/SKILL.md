---
name: wec-framework-intro
description: This skill should be used when the user asks to "介紹 WEC Framework", "WEC 是什麼", "如何快速上手 WEC", "介紹微前端架構", "WEC 開發規範", or mentions onboarding to WEC Angular microfrontend.
---

# WEC Framework Introduction Skill

提供 WEC Framework 的標準化介紹與上手導引，讓開發者在短時間理解架構、技術邊界與開發規範。

## Purpose

- 說明 WEC Framework 在企業內部的定位。
- 統整 Angular / Native Federation / WEC libraries 的關係。
- 提供可立即執行的開發與建置指令。
- 引導使用正確的 UI 與 Service 模式。

## Trigger Intent

在以下情境啟用此 skill：

- 使用者詢問 WEC 架構、特色、與技術選型。
- 使用者想知道從哪裡開始學習 WEC 開發。
- 使用者需要內部 framework 的一致化介紹模板。

## Workflow

### 1) 識別使用者目標

先判斷使用者屬於哪一類需求：

- 新人導覽：需要概念圖與關鍵術語。
- 開發啟動：需要命令與專案結構。
- 規範對齊：需要 coding conventions 與禁用清單。

### 2) 輸出四段式介紹

依序輸出：

1. 框架定位（WEC main/core/components + Native Federation）
2. 技術標準（Angular 17+、TS strict、控制流語法、WEC Layout）
3. 開發模式（DataService、UserContext、AuthGuard、AppConfig）
4. 實務落地（建立系統/選單的下一步）

### 3) 提供最小可行起手式

提供最小清單：

- 啟動：`ng serve`
- 建置：`npm run build:pilot` / `npm run build:prod`
- 系統建立：導向 `wec-system-init` skill
- 選單開發：導向 `wec-menu-development` skill

### 4) 明確限制與禁用項

必須提醒：

- 禁用 `*ngIf/*ngFor/*ngSwitch`（改用 `@if/@for/@switch`）
- 避免使用 `wec-button-group`、`wec-combo-box`（已規劃淘汰）
- 優先使用 `@wec/components` 與 `@wec/core`

## Output Format

使用繁體中文，建議以下段落順序：

1. 一句話總結
2. 三層架構與模組責任
3. 開發規範清單（Do / Don’t）
4. 下一步建議（安裝、建系統、建選單）

## Additional Resources

- `../../prompts/wecui-intro.prompt.md`
- `../../copilot-instructions.md`
- `../../instructions/wec-components.instructions.md`
- `../../instructions/wec-core.instructions.md`

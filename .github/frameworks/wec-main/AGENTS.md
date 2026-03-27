# WEC Angular Framework AI 入口指引 (Entry Point)

> **[IMPORTANT]** 本文件為使用 WEC Angular Framework (wec-main) 開發前端系統的 AI 入口指引。
>
> **路徑說明**：本文件位於 `frameworks/wec-main/`，掛載為 `.github/` submodule 後
> 完整路徑為 `.github/frameworks/wec-main/`。

---

## 核心上下文 (SSoT)

請 AI 助手優先遵循下列文件：

1. **[contributing.md](contributing.md)**：核心事實來源 (SSoT)，框架規範與程式碼習慣。
2. **[instructions/wecui.instructions.md](instructions/wecui.instructions.md)**：全域 WEC 開發規範（`applyTo: **/*.ts,**/*.html` 自動載入）。
3. **[instructions/wec-components.instructions.md](instructions/wec-components.instructions.md)**：WEC 元件庫使用指引。
4. **[instructions/wec-core.instructions.md](instructions/wec-core.instructions.md)**：DataService / AuthService 等核心服務。
5. **[instructions/wec-component-selection.instructions.md](instructions/wec-component-selection.instructions.md)**：元件選型指南（快查表 + 決策樹）。
6. **[instructions/wec-styling-system.instructions.md](instructions/wec-styling-system.instructions.md)**：樣式系統（Layout / Nebular 外觀 / 文字 / 表單 / Icon）。
7. **[skills/](skills/)**：分域 Skill，依任務類型挑選。

---

## 角色定位

您是 **WEC Angular Framework 專家**，協助開發者以正確的架構模式、元件規範與服務模式開發企業級微前端系統。
您熟悉 Angular 17+ 的獨立元件、Native Federation 微前端架構、WEC DataService 模式、AG Grid 整合。

---

## 核心行為準則

- 禁止使用已廢棄的 `*ngIf`、`*ngFor`、`*ngSwitch`，一律改用 `@if`、`@for`、`@switch`。
- 禁止使用已廢棄的 `wec-button-group`、`wec-combo-box`（2027 年移除）。
- 所有 Service 必須繼承 `DataService`。
- 所有表單必須使用 Reactive Forms，禁止 Template-driven Forms。
- AG Grid 主題固定使用 `ag-theme-balham`。
- 語言通用規範請同步參考 `instructions/angular.instructions.md`（由 wec-coding-standards 提供）。

---

## Copilot Skills 索引

| Skill                               | 路徑                                                                      | 涵蓋範圍                                     |
| ----------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| wec-framework-intro                 | `frameworks/wec-main/skills/wec-framework-intro/SKILL.md`                 | 框架介紹、架構總覽、上手導引                 |
| wec-framework-install               | `frameworks/wec-main/skills/wec-framework-install/SKILL.md`               | 環境初始化、fork/clone、submodule vs npm     |
| wec-system-init                     | `frameworks/wec-main/skills/wec-system-init/SKILL.md`                     | 建立新系統 library、SystemModule 註冊        |
| wec-menu-development                | `frameworks/wec-main/skills/wec-menu-development/SKILL.md`                | 新增功能選單、view + service 建立            |
| wec-aggrid-page                     | `frameworks/wec-main/skills/wec-aggrid-page/SKILL.md`                     | AG Grid 清單頁、renderer/editor              |
| wec-reactive-form-pattern           | `frameworks/wec-main/skills/wec-reactive-form-pattern/SKILL.md`           | Reactive Form、NG01050、驗證規則             |
| wec-service-dataservice-crud        | `frameworks/wec-main/skills/wec-service-dataservice-crud/SKILL.md`        | DataService CRUD 封裝、API 串接              |
| wec-migration-deprecated-components | `frameworks/wec-main/skills/wec-migration-deprecated-components/SKILL.md` | 批次遷移廢棄元件                             |
| wec-page-scaffold                   | `frameworks/wec-main/skills/wec-page-scaffold/SKILL.md`                   | 前端頁面骨架生成（選版型 → 建骨架 → 填元件） |
| wec-dialog-pattern                  | `frameworks/wec-main/skills/wec-dialog-pattern/SKILL.md`                  | Dialog 元件開發（表單/確認/訊息三種型別）    |

---

## 快速任務入口

| 任務          | 使用方式                               |
| ------------- | -------------------------------------- |
| 了解框架      | 觸發 prompt `wecui-intro`              |
| 初始化環境    | 觸發 prompt `wecui-install`            |
| 建立新系統    | 觸發 prompt `wecui-init`               |
| 新增功能頁    | 觸發 prompt `wecui-develop`            |
| AG Grid 頁面  | 觸發 skill `wec-aggrid-page`           |
| Reactive Form | 觸發 skill `wec-reactive-form-pattern` |
| 新頁面骨架    | 觸發 skill `wec-page-scaffold`         |
| Dialog 開發   | 觸發 skill `wec-dialog-pattern`        |

---

## 技術棧

- **前端框架**: Angular 17++
- **架構**: Native Federation 微前端
- **UI 庫**: @wec/components → Nebular → 原生 HTML（優先順序）
- **State**: BehaviorSubject + RxJS（Angular 19+ 可改用 Signals）
- **表單**: Reactive Forms（必須）
- **Grid**: AG Grid + ag-theme-balham

---

## 溝通規範

- 語言: 繁體中文解釋，英文程式碼
- Commit 訊息: Conventional Commits（英文）
- 命名: kebab-case 選單/檔案；PascalCase 元件/服務

---

**AGENTS.md 版本**: 1.0.0 (wec-coding-standards edition)
**框架版本**: WEC Angular Framework v1.11.1+

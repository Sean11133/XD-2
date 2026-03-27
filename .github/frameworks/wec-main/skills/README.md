# WEC Skills 快速索引

此文件整理 WEC 專案目前新增的 10 個技能，提供觸發詞與可直接使用的 prompt 範例。

## 1) wec-framework-intro

- 路徑: `wec-framework-intro/SKILL.md`
- 何時用: 框架介紹、上手導覽、技術規範總覽
- 常見觸發詞:
  - 介紹 WEC Framework
  - WEC 是什麼
  - 如何快速上手 WEC
  - 介紹微前端架構
  - WEC 開發規範
- 建議 prompt:
  - 請用新人成本最低的方式介紹 WEC Framework，包含三層架構、開發規範與第一個實作步驟。

## 2) wec-framework-install

- 路徑: `wec-framework-install/SKILL.md`
- 何時用: 初始化環境、fork/clone、submodule 或 npm 決策
- 常見觸發詞:
  - 安裝 WEC
  - 初始化 WEC UI
  - 開始 WEC UI 初始化
  - clone wec-main
  - 設定 submodule
  - 選擇 submodule 或 npm
- 建議 prompt:
  - 幫我檢查環境並帶我完成 WEC 初始化，最後給我 submodule 與 npm 的選擇建議。

## 3) wec-system-init

- 路徑: `wec-system-init/SKILL.md`
- 何時用: 建立新系統 library、註冊 SystemModule、配置 app-config
- 常見觸發詞:
  - 幫我建立個前端系統
  - 建立前端系統
  - 建立新系統
  - 新增系統模組
  - ng generate library
  - 建立 WEC 系統
  - app-config 要怎麼設
  - 註冊 SystemModule
- 建議 prompt:
  - 幫我建立新系統，系統名稱是 cim-quality，場別是 1，請完成 module、app.config 與 app-config.json 設定。

## 4) wec-menu-development

- 路徑: `wec-menu-development/SKILL.md`
- 何時用: 新增功能選單、建立 view + service、setView / setCustomLocalMenu
- 常見觸發詞:
  - 新增選單
  - 建立功能頁
  - 建立 view + service
  - setView
  - setCustomLocalMenu
  - 註冊 menu
- 邊界提醒:
  - 如果重點是「把新頁面掛進既有 system 與 menu」，用這個 skill。
  - 如果重點只是做資料表格本身，不要先用這個，改走 `wec-aggrid-page`。
- 建議 prompt:
  - 在 cim-quality 下新增選單 equipment-list，顯示名稱為設備清單，請建立頁面、service 並註冊 menu。

## 5) wec-aggrid-page

- 路徑: `wec-aggrid-page/SKILL.md`
- 何時用: 標準資料清單頁、AgGridOptions、actionRenderer/linkRenderer
- 常見觸發詞:
  - 建立 AG Grid 頁面
  - 做資料清單頁
  - ag-theme-balham
  - AgGridOptions 怎麼寫
  - 加上 actionRenderer
- 邊界提醒:
  - 如果任務核心是 grid 欄位、renderer、editor、selection、append row，用這個 skill。
  - 如果還要一起建立 menu 入口與 setView，通常要搭配 `wec-menu-development`。
- 建議 prompt:
  - 幫我做一個符合 WEC 規範的 AG Grid 清單頁，使用 ag-theme-balham 與 actionRenderer。

## 6) wec-reactive-form-pattern

- 路徑: `wec-reactive-form-pattern/SKILL.md`
- 何時用: 建立 Reactive Form、修正 NG01050、驗證規則
- 常見觸發詞:
  - 做 Reactive Form
  - formControlName 錯誤
  - NG01050
  - 表單驗證
  - 建立查詢條件表單
- 建議 prompt:
  - 幫我把這個頁面改成 Reactive Form，避免 NG01050，並補上必填與 email 驗證訊息。

## 7) wec-service-dataservice-crud

- 路徑: `wec-service-dataservice-crud/SKILL.md`
- 何時用: 建立 DataService CRUD 封裝、API 串接標準化
- 常見觸發詞:
  - 建立 DataService service
  - DataService CRUD
  - 串接 API
  - WEC service pattern
  - post/get 怎麼封裝
  - 抽離 API 呼叫到 service
- 邊界提醒:
  - 這個 skill 專注在 service 封裝，不負責 menu 註冊。
  - 若使用者其實是在問整頁功能建立，通常要改用 `wec-menu-development` 或和它搭配。
- 建議 prompt:
  - 幫我建立一個繼承 DataService 的 service，包含 load/create/update/delete/getById 五個方法並整合到頁面。

## 8) wec-migration-deprecated-components

- 路徑: `wec-migration-deprecated-components/SKILL.md`
- 何時用: 遷移淘汰元件、批次替換規劃與回歸
- 常見觸發詞:
  - 遷移舊元件
  - wec-button-group 改什麼
  - wec-combo-box 替代
  - 2027 移除元件
  - deprecated component migration
- 建議 prompt:
  - 幫我掃描專案中 wec-combo-box 的使用點，提出分批遷移計畫與替代元件建議。

## 9) wec-page-scaffold

- 路徑: `wec-page-scaffold/SKILL.md`
- 何時用: 前端新頁面開發、依版型快速生成骨架 HTML
- 常見觸發詞:
  - 建立新頁面
  - 頁面骨架
  - 選版型
  - scaffold 頁面
  - 依 plan.md 建頁面
  - 版型 A/B/C/D/E
- 邊界提醒:
  - 這個 skill 專注在「選版型 → 生成骨架 HTML → 填元件」的初始化步驟。
  - 若需接 API/DataService，搭配 `wec-service-dataservice-crud`。
  - 若需 AG Grid，搭配 `wec-aggrid-page`。
- 建議 prompt:
  - 幫我根據 plan.md 的設備清單頁建立版型 A 骨架，填入查詢條件和 AG Grid。

## 10) wec-dialog-pattern

- 路徑: `wec-dialog-pattern/SKILL.md`
- 何時用: Dialog 元件建立（表單/確認/訊息三種類型）
- 常見觸發詞:
  - 建立 Dialog
  - 做彈窗
  - Modal 怎麼寫
  - dialogAnimation 怎麼用
  - cdkDrag 拖曳
  - 確認框
  - 表單 Dialog
- 邊界提醒:
  - 這個 skill 專注在 Dialog 元件結構與三種類型的骨架。
  - 父元件的呼叫方式（NbDialogService）也包含在 skill 中。
- 建議 prompt:
  - 幫我建立一個表單型 Dialog，支援拖曳與 cdkDragBoundary，含儲存/取消按鈕。

---

## 使用建議

- 先用 wec-framework-intro 對齊團隊共識，再進入實作型技能。
- 新系統建置建議流程: wec-framework-install → wec-system-init → wec-menu-development。
- 清單頁通常搭配: wec-page-scaffold（版型 A）+ wec-aggrid-page + wec-service-dataservice-crud。
- 表單頁通常搭配: wec-page-scaffold（版型 B）+ wec-reactive-form-pattern + wec-service-dataservice-crud。
- Dialog 開發: 依需求選 wec-dialog-pattern（表單/確認/訊息三種骨架）。
- 舊案重整可直接走: wec-migration-deprecated-components。

## 選用判斷

- 要新增 system: 用 `wec-system-init`。
- 要把新功能掛進既有 system/menu: 用 `wec-menu-development`。
- 要建立頁面骨架（選版型）: 用 `wec-page-scaffold`。
- 要把既有頁面做成標準 AG Grid: 用 `wec-aggrid-page`。
- 要建立 Dialog（表單/確認/訊息）: 用 `wec-dialog-pattern`。
- 要把表單改成 Reactive Forms 或修 NG01050: 用 `wec-reactive-form-pattern`。
- 要抽離 API 呼叫並封裝 CRUD service: 用 `wec-service-dataservice-crud`。
- 要掃描並替換淘汰元件: 用 `wec-migration-deprecated-components`。

---

## 團隊導入版工作流

### A. 新人上手（1~2 天）

- 目標: 先建立共同語言與框架邊界，避免一開始就踩規範雷。
- 推薦順序:
  1. wec-framework-intro
  2. wec-framework-install
  3. wec-system-init（建立一個 demo 系統）
- 建議提問:
  - 以新人視角帶我完成 WEC 上手，最後幫我建立一個可啟動的 demo 系統。

### B. 功能開發（頁面交付）

- 目標: 在既有系統快速交付「查詢 + 清單 + 編輯」功能。
- 推薦順序:
  1. wec-menu-development
  2. wec-reactive-form-pattern
  3. wec-aggrid-page
  4. wec-service-dataservice-crud
- 建議提問:
  - 在 {system} 新增 {menu} 功能頁，含查詢表單、AG Grid 清單與 CRUD service，請依 WEC 規範一次完成。

### C. 重構與維運（舊案整理）

- 目標: 在不破壞現有流程下，逐步移除技術債與淘汰元件。
- 推薦順序:
  1. wec-migration-deprecated-components
  2. wec-reactive-form-pattern（補齊 NG01050 與驗證一致性）
  3. wec-service-dataservice-crud（抽離散落 API）
- 建議提問:
  - 請先盤點淘汰元件使用點並分批遷移，再補齊 Reactive Form 與 DataService 封裝。

## 導入節奏建議

- Sprint 1: 完成新人上手路線與一個示範系統。
- Sprint 2: 把新功能交付路線固化成 team checklist。
- Sprint 3: 啟動舊案遷移，採批次 PR 漸進替換。

---

## Done Criteria（驗收清單）

### A. 新人上手（對應 wec-framework-intro / install / system-init）

- 已能口頭說明 `wec-main / wec-core / wec-components` 三層責任。
- 本機環境檢查完成（Node/Git/npm/CLI）且可正常啟動專案。
- 可在 `projects/{system}` 下成功建立一個 demo 系統並完成註冊。
- `src/app/app.config.ts` 與 `src/assets/app-config.json` 已完成必要配置。
- 可成功啟動並從 `#/` 進入系統首頁。

### B. 功能開發（對應 menu / reactive-form / aggrid / dataservice-crud）

- 新增功能已完成 `view + service + setView + local menu` 註冊。
- 表單使用 Reactive Forms，`formControlName` 均位於 `[formGroup]` 內。
- 清單頁使用 `ag-theme-balham` 與 `AgGridOptions`，設定集中於 `gridOptions`。
- Service 繼承 `DataService` 並包含至少 `load/create/update/delete/getById`。
- API 錯誤處理、資料重整流程、基本操作（查詢/編輯/儲存）可驗證。

### C. 重構與維運（對應 deprecated migration / reactive-form / dataservice-crud）

- 已產出淘汰元件使用點清單與替換映射（頁面/系統維度）。
- 每批遷移均有獨立 PR 與可回滾策略，未混入無關重構。
- `wec-button-group`、`wec-combo-box` 已按批次替換為建議方案。
- 表單與資料存取層已補齊一致性（Reactive Forms + DataService 封裝）。
- 批次回歸驗證完成（預設值、事件、payload、權限情境）。

---
name: wec-aggrid-page
description: This skill should be used when the user asks to "建立 AG Grid 頁面", "做資料清單頁", "ag-theme-balham", "AgGridOptions 怎麼寫", "加上 actionRenderer", or wants WEC-standard grid page implementation.
---

# WEC AG Grid Page Skill

建立符合 WEC Framework 規範的 AG Grid 頁面，統一主題、欄位定義、互動行為與資料流。

## Purpose

- 以 `@wec/components` 的 `AgGridOptions` 建立一致的 grid 結構。
- 避免散落式配置，提升可維護性。
- 內建常見欄位類型、編輯器、renderers 的實作模式。

## Trigger Intent

在以下情境使用：

- 使用者要做查詢清單頁或維護頁。
- 使用者需要 row selection、bulk 操作、append row。
- 使用者要導入 `actionRenderer`、`linkRenderer`。

## Workflow

### 1) 建立頁面骨架

建立或調整頁面 component，確保 grid 容器使用：

- `class="ag-theme-balham"`
- `[gridOptions]="gridOptions"`
- `[rowData]="rowData"`

### 2) 實作統一 gridOptions

使用 `new AgGridOptions(baseOptions, wecExtensions)`：

- `columnDefs` 集中定義
- `rowSelection`、`popupParent`、`domLayout` 集中管理
- WEC 擴充選項：`allowAppendRow`、`autoSizeAllColumns`、`suppressExport`

### 3) 套用 WEC 欄位能力

優先使用：

- 編輯器：`textEditor`、`selectEditor`、`booleanEditor`
- 渲染器：`linkRenderer`、`actionRenderer`
- 類型：`NUMBER`、`DATE`

### 4) 串接資料服務

使用 service 載入 rowData，搭配錯誤處理與 loading 管理。

### 5) 驗證互動

至少檢查：

- 欄位編輯是否回寫
- actionRenderer click callback 是否正確觸發
- 篩選、排序、選取是否正常

## Guardrails

- 不使用其他 ag-grid theme；固定 `ag-theme-balham`。
- 不將設定拆到過多 input bindings；集中在 `gridOptions`。
- 優先 WEC renderer/editor，不先自製。

## Output Checklist

- Grid 畫面可顯示資料
- `AgGridOptions` 結構完整
- WEC renderer/editor 至少一種落地
- 錯誤處理與 reload 流程完成

## Additional Resources

- `references/aggrid-page-template.md`
- `../../instructions/wec-components.instructions.md`
- `../../../../instructions/angular-page-layouts.instructions.md` — 版型 A：Master-Detail 列表頁
- `../../copilot-instructions.md`

---
name: wec-page-scaffold
description: This skill should be used when the user asks to "建立新頁面", "前端頁面骨架", "選版型", "版型 A/B/C/D/E", "scaffold 頁面", "依 plan.md 建頁面", or wants to start a new Angular frontend page using WEC standard layouts.
---

# WEC Page Scaffold Skill

依據 `plan.md` Section 6.5 或需求描述，選取正確的標準版型，快速生成符合 WEC 規範的頁面骨架。

## Purpose

- 確保每個前端頁面都從標準版型出發，避免隨意拼裝。
- 統一版面結構，節省設計討論時間。
- 骨架生成後直接填入業務元件，降低摩擦。

## Trigger Intent

在以下情境使用：

- 使用者要建立一個新的前端頁面（任何類型）。
- 使用者要根據 plan.md 的某個功能頁實作 HTML 骨架。
- 使用者說「給我一個版型」、「建頁面結構」。

## Workflow

### 1) 讀取版型定義

讀取 `../../../../instructions/angular-page-layouts.instructions.md`，確認 5 種版型的骨架結構。

### 2) 確認採用版型

優先從 `plan.md` Section 6.5 查詢目標頁面的指定版型；若無，根據需求判斷：

| 情境                    | 版型  |
| ----------------------- | ----- |
| 查詢列表 / CRUD 清單頁  | **A** |
| 新增 / 編輯表單頁       | **B** |
| 列表 + 右側明細（雙欄） | **C** |
| 系統設定 / 多段落 Tab   | **D** |
| Dashboard / KPI 概覽    | **E** |

### 3) 生成頁面骨架 HTML

複製版型對應的骨架（來自 angular-page-layouts.instructions.md），依業務命名替換佔位符：

- `<nb-card-header>` → 填入頁面標題
- 查詢條件 → 填入真實欄位（`wec-form-item` + `nb-select` / `wec-datetime` 等）
- 操作列 → 填入 CRUD 按鈕（查詢/新增/匯出等）
- 主體內容區 → 填入業務元件（AG Grid / 明細表單 / Tab 等）
- 按鈕操作 → 連結 Component Class 方法

### 4) 套用 UI 最佳實踐

遵守 `../../../../instructions/angular-comp-practices.instructions.md`：

- 元件選型優先：`@wec/components` → Nebular → 原生 HTML
- WEC Layout classes 管理間距，禁止 inline style
- 新控制流語法：`@if`、`@for`、`@switch`

### 5) 建立對應 Component Class

```typescript
@Component({
  selector: 'app-[feature-name]',
  standalone: true,
  imports: [/* wec-components, nebular */],
  templateUrl: './[feature-name].component.html',
  animations: [] // 若有 Dialog，加入 dialogAnimation
})
export class [FeatureName]Component {
  // 查詢表單 (若版型 A/C)
  query = new [FeatureName]QueryForm();

  // AG Grid (若版型 A/C)
  gridOptions = new AgGridOptions({ columnDefs: [] });
  rowData: any[] = [];

  onQuery() { /* 查詢邏輯 */ }
  onAdd() { /* 新增邏輯 */ }
}
```

## Checklist

- [ ] plan.md Section 6.5 版型對應正確
- [ ] 頁面骨架 HTML 使用標準版型結構
- [ ] WEC spacing classes（不含 inline margin）
- [ ] 元件選型符合優先順序（wec-components → Nebular → 原生）
- [ ] 新控制流 `@if/@for/@switch` 已套用

## Additional Resources

- `../../../../instructions/angular-page-layouts.instructions.md` — 5 種標準版型骨架
- `../../../../instructions/angular-comp-practices.instructions.md` — Angular UI 最佳實踐
- `../../instructions/wec-component-selection.instructions.md` — 元件選型決策樹
- `../../instructions/wec-styling-system.instructions.md` — Layout / 樣式系統

---
name: wec-reactive-form-pattern
description: This skill should be used when the user asks to "做 Reactive Form", "formControlName 錯誤", "NG01050", "表單驗證", "建立查詢條件表單", or wants WEC-standard form architecture.
---

# WEC Reactive Form Pattern Skill

建立符合 WEC 規範的 Reactive Forms 架構，避免常見錯誤（尤其 NG01050），並統一驗證與錯誤訊息顯示模式。

## Purpose

- 讓表單結構一致、可測試、可擴充。
- 強化 `formGroup` / `formControlName` 正確使用。
- 提供 WEC + Nebular 的標準欄位寫法。

## Trigger Intent

在以下情境使用：

- 使用者要新增查詢或編輯表單。
- 使用者遇到 `formControlName must be used with a parent formGroup`。
- 使用者需要驗證規則與錯誤訊息樣板。

## Workflow

### 1) 建立 FormGroup

在 component class 中定義：

- `formGroup = this.fb.group({...})`
- 明確 validators（required、pattern、custom）

### 2) 套用模板結構

模板必須以父層包住：

- `<form [formGroup]="formGroup"> ... </form>`
- 所有 `formControlName` 皆位於其內

### 3) 使用 WEC / Nebular 表單元件

優先：

- `<wec-form-item>` 包裝欄位
- `nbInput`, `nb-select` 作為基礎輸入元件

### 4) 統一錯誤顯示

搭配 `@if` 顯示錯誤：

- touched + invalid 條件
- 錯誤訊息文字一致化

### 5) 建立提交與重置流程

至少包含：

- `onSubmit()`：先 `markAllAsTouched()` 再檢查 valid
- `onReset()`：重置表單與狀態

## Guardrails

- 禁止使用 `*ngIf/*ngFor`，改用 `@if/@for`。
- Template-driven 方案僅限簡單欄位，預設使用 Reactive Forms。
- 若使用 `[(ngModel)]`，必須加 `name`。

## Output Checklist

- FormGroup 完整、型別清楚
- 模板無 NG01050 風險
- 驗證與錯誤顯示可運作
- 提交/重置流程可驗證

## Additional Resources

- `references/reactive-form-template.md`
- `../../../../instructions/angular-page-layouts.instructions.md` — 版型 B：表單頁（新增/編輯）
- `../../copilot-instructions.md`

---
applyTo: "**/*.ts,**/*.html,**/*.scss"
---

# Angular 17 編碼標準（快速參考）

> 📌 **完整標準**：`standards/coding-standard-angular.md`（元件規範、Smart/Dumb 分離、RxJS、Template 語法、Service 設計、測試等全部規範）
>
> 📌 Angular 為前端可選框架之一，非強制。前端基礎規範請參閱 `standards/coding-standard-frontend.md`。
>
> 本檔僅列出**自動載入時的提醒重點**，詳細規範與範例請查閱完整標準文件。

## 關鍵提醒

- **Standalone + OnPush**：所有新元件強制 `standalone: true` + `ChangeDetectionStrategy.OnPush`
- **Smart / Dumb 分離**：Container 處理資料，Presentational 只接受 `@Input` / 發送 `@Output`
- **RxJS**：`BehaviorSubject` + `async` pipe 管理狀態；`takeUntilDestroyed(destroyRef)` 管理訂閱
- **Template**：使用 `@if` / `@for`（Angular 17 新式），禁止 `*ngIf` / `*ngFor`（新專案）
- **Service**：使用 `inject()` 函式注入；元件禁止直接注入 `HttpClient`
- **禁止**：`any` 型別、`NgModule`（新元件）、Template 內複雜邏輯
- **測試**：Jest + TestBed，最低覆蓋率 80%

## 前端頁面開發前置步驟

開發 Angular 頁面前，先查閱 `instructions/angular-page-layouts.instructions.md` 取得頁面佈局模板，再開始元件設計。

## ng generate 常用指令

```bash
ng generate library "{system}"           # 建立系統 library
ng generate component views/{page-name} --project={system}  # 建立頁面元件
ng generate service services/{name}     --project={system}  # 建立服務
```

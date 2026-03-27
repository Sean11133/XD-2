# Angular WEC Adapter — Review Dimensions

> `getReviewDimensions()` 實作：Angular + WEC Component Library 專有審查維度 D1–D5。
> D0（spec_hash）由 Orchestrator 統一處理；A–E 通用維度由 Reviewer 統一執行。

## D1：WEC Component Library 使用合規性

**severity_if_violated**：HIGH

**目的**：確保元件使用 WEC Component Library 的標準元件，而非自行實作。

**Checklist**：

- [ ] 所有按鈕是否使用 `<wec-button>` 而非 `<button>`？
- [ ] 所有輸入欄位是否使用 `<wec-input>` 而非 `<input>`？
- [ ] 所有 Modal/Dialog 是否使用 WEC Dialog 元件？
- [ ] 所有 Table 是否使用 WEC Table 元件而非自訂 `<table>`？
- [ ] 是否有重複實作 WEC 已提供的功能？
- [ ] WEC 元件的 Props 是否使用正確型別（非 `any`）？

---

## D2：狀態管理方式

**severity_if_violated**：INFO

**目的**：確認專案採用的狀態管理方式一致，允許 RxJS BehaviorSubject / @Input mutation，Signal API 為可選。

**Checklist**：

- [ ] 同一元件是否混用 Signal 和 BehaviorSubject 管理相同類型的狀態（應保持一致）？
- [ ] 若使用 Signal：是否在 Template 中正確呼叫（`count()` 而非 `count`）？
- [ ] 若使用 BehaviorSubject：是否搭配 `async pipe` 或在 `subscribe()` 中使用 `takeUntilDestroyed()` 防止洩漏？
- [ ] 是否有直接對 `@Input` 屬性做 mutation（建議透過 `@Output` EventEmitter 通知父層）？

---

## D3：OnPush Change Detection

**severity_if_violated**：HIGH

**目的**：確保所有元件使用 `ChangeDetectionStrategy.OnPush`。

**Checklist**：

- [ ] 每個 `@Component` 是否都有 `changeDetection: ChangeDetectionStrategy.OnPush`？
- [ ] OnPush 元件是否正確使用 Immutable Objects 或 Observable（非 reference mutation）？
- [ ] 是否有在 OnPush 元件中手動呼叫 `markForCheck()`（應避免）？
- [ ] 是否有在 OnPush 元件中使用 `async pipe`？（允許，搭配 BehaviorSubject 是常見作法）

---

## D4：Smart/Dumb 元件分離

**severity_if_violated**：MEDIUM

**目的**：確保 Container（Smart）和 Presentational（Dumb）元件職責分離。

**Checklist**：

- [ ] Presentational 元件是否只接受 `@Input()` 並發出 `@Output()`（無服務注入）？
- [ ] Container 元件是否負責所有服務呼叫和狀態管理？
- [ ] 是否有 Presentational 元件直接注入 HttpClient 或業務 Service？
- [ ] 元件層次是否超過 3 層（Container > Feature > Presentational）？

---

## D5：RxJS 資源管理

**severity_if_violated**：MEDIUM

**目的**：防止 Observable 訂閱洩漏。

**Checklist**：

- [ ] 所有 `subscribe()` 是否使用 `takeUntilDestroyed()` 管理？
- [ ] 是否有無法自動取消訂閱的裸 `subscribe()`（無 takeUntil / 不在 async pipe 中）？
- [ ] 是否使用 `inject(DestroyRef)` 搭配 `takeUntilDestroyed()` 而非舊式 ngOnDestroy？
- [ ] HTTP 呼叫（單次）是否使用 `firstValueFrom()` 取代 subscribe？

---

## D6：UI 版面品質（UI Layout Quality）

**severity_if_violated**：MEDIUM

**目的**：確保前端頁面遵循標準版型骨架，版面一致且專業。

**參考標準**：`instructions/angular-page-layouts.instructions.md`、`instructions/angular-comp-practices.instructions.md`

**Checklist**：

- [ ] 頁面是否採用了標準版型骨架（A-E 之一）？若 plan.md 有 Section 6.5 須與之一致
- [ ] 查詢條件區是否用 `wec-field-group` 包裹且條件橫向排列（`fxLayout="row"`）？
- [ ] AG-Grid 是否使用 `fx-fill` 撐滿可用高度？
- [ ] 表單 `labelWidth` 是否在同一 field-group 內統一設定？
- [ ] 按鈕區是否靠右對齊（`fx-row end`）？取消在前、確認在後？
- [ ] 間距是否由父容器統一控制（WEC spacing classes），而非子元素各自 `margin`？
- [ ] 是否有不必要的 inline style？應改用 WEC utility class 或 Nebular 屬性
- [ ] KPI/Dashboard 卡片是否使用 `nb-card` + `fx-fill` 均分？
- [ ] 空資料狀態是否有處理（引導文案 + 下一步操作）？

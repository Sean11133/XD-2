# .NET 8 Adapter — Review Dimensions

> `getReviewDimensions()` 實作：.NET 8 + Clean Architecture 專有審查維度 D1–D5。
> D0（spec_hash）由 Orchestrator 統一處理；A–E 通用維度由 Reviewer 統一執行。

## D1：Clean Architecture 層依賴方向

**severity_if_violated**：HIGH

**目的**：確保依賴方向由外層指向內層（Infrastructure → Application → Domain），Domain 不依賴任何其他層。

**Checklist**：

- [ ] Domain 層（Entities, Value Objects, Interfaces）是否不包含任何 EF Core、ASP.NET 等 infrastructure 的 `using`？
- [ ] Application 層是否只依賴 Domain（不直接依賴 Infrastructure 具體類別）？
- [ ] Infrastructure 層是否通過介面（IRepository, IService）實作，而非 Domain 層直接呼叫具體類別？
- [ ] Presentation 層（Controller, API）是否只呼叫 Application 層的 Command/Query Handler？
- [ ] 是否有 `new ConcreteRepository()` 在 Domain 或 Application 層（違反 DIP）？

---

## D2：EF Core 使用合規性

**severity_if_violated**：MEDIUM

**目的**：確保 EF Core 正確使用，避免 N+1 查詢和效能問題。

**Checklist**：

- [ ] 是否有未包含 `AsNoTracking()` 的唯讀查詢（如 List、Dashboard）？
- [ ] 是否有 `Include()` 後還在迴圈中訪問相關 Entity（N+1 問題）？
- [ ] Repository 是否通過 `IUnitOfWork` / `SaveChangesAsync()` 統一管理事務？
- [ ] 是否有在 Domain Service 中直接注入 DbContext（違反 Clean Architecture）？
- [ ] 查詢方法是否都有 `cancellationToken` 參數並正確傳遞？

---

## D3：Async/Await 正確使用

**severity_if_violated**：HIGH

**目的**：確保非同步程式碼正確，防止 deadlock 和效能問題。

**Checklist**：

- [ ] 是否有 `.Result` 或 `.Wait()` 的同步阻塞呼叫（async 方法中）？
- [ ] 是否有 `async void` 方法（Event Handler 除外）？
- [ ] 所有 async 方法是否都有 `Async` 後綴命名？
- [ ] 是否有未 `await` 的 Task（忽略回傳值可能導致例外被吞掉）？
- [ ] `CancellationToken` 是否從外層正確傳遞到底層？

---

## D4：相依性注入（DI）設計

**severity_if_violated**：MEDIUM

**目的**：確保正確使用 .NET DI 容器，遵循 DIP 原則。

**Checklist**：

- [ ] 是否使用 Primary Constructor（C# 12）注入依賴，而非私有欄位 + 建構函式？
- [ ] Service 是否通過介面注入（`IUserRepository`），而非具體類別（`UserRepository`）？
- [ ] Singleton Service 是否誤注入了 Scoped Service（會導致 ObjectDisposedException）？
- [ ] 是否有手動呼叫 `new` 建立有依賴的 Service（應交由 DI Container）？
- [ ] Test 中 mock 是否針對介面而非具體類別？

---

## D5：執行緒安全與並發

**severity_if_violated**：HIGH

**目的**：確保共享狀態是執行緒安全的。

**Checklist**：

- [ ] Singleton Service 是否有非執行緒安全的可變狀態（如 `List<T>` 應改用 `ConcurrentBag<T>`）？
- [ ] 快取實作是否考慮 Double-Check Locking 或使用 `IMemoryCache`？
- [ ] 是否有多個 Task 同時寫入同一個共享資源而未加鎖？
- [ ] `IHttpContextAccessor` 是否在 Singleton 中正確使用（注意 context 生命週期）？

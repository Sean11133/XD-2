# Python 3.10+ Adapter — Review Dimensions

> `getReviewDimensions()` 實作：Python 3.10+ + Domain Driven Design 專有審查維度 D1–D4。
> （Python 專案審查維度為 4 個，相對 .NET/Angular 的 5 個，因 Python 無編譯步驟）
> D0（spec_hash）由 Orchestrator 統一處理；A–E 通用維度由 Reviewer 統一執行。

## D1：型別標注完整性

**severity_if_violated**：HIGH

**目的**：確保所有 public API 和 Domain 物件都有完整的型別標注，啟用 Static Analysis。

**Checklist**：

- [ ] 所有函式參數是否都有型別標注（包含 `self` 除外）？
- [ ] 所有函式是否都有回傳型別標注（`-> None` 也需要明確標注）？
- [ ] 是否使用了 Python 3.10+ 的 union 語法（`str | None` 而非 `Optional[str]`）？
- [ ] `dataclass` Entity 是否有完整欄位型別（`id: int`，而非 `id`）？
- [ ] 是否有不必要的 `Any` 使用（只在真正動態情境中使用）？

---

## D2：Result Pattern 使用

**severity_if_violated**：MEDIUM

**目的**：確保業務規則錯誤通過 Result Pattern 回傳，而非 raise Exception。

**Checklist**：

- [ ] Domain Service 和 Application 層的錯誤是否通過 `Result[T, E]` 回傳（非 `raise`）？
- [ ] `raise` 是否只用於確實「例外」的情境（如：IO 錯誤、配置錯誤），而非業務邏輯分支？
- [ ] 呼叫端是否正確處理 `Result`（.is_ok() / .is_err() 判斷）而非直接 `.unwrap()`？
- [ ] 一致使用 `result` 型別（如 `returns` 套件的 `Result`、自定義 `Either`）？
- [ ] Error 型別是否明確定義（如 `UserNotFoundError`）而非使用字串？

---

## D3：嚴禁 print，使用 logging

**severity_if_violated**：HIGH

**目的**：確保所有輸出都通過 Python logging 模組，支援生產環境的 log 管理。

**Checklist**：

- [ ] 是否有任何 `print()` 使用（除 Streamlit 的 `st.write()` 外）？
- [ ] logging 是否使用 `__name__` 作為 logger 名稱（`logger = logging.getLogger(__name__)`）？
- [ ] 是否有在 `except` 區塊中使用 `logging.error(str(e))` 而非 `logging.exception(e)`（後者自動包含 traceback）？
- [ ] 是否有在 Domain 層設定 `logging.basicConfig()`（應在應用程式進入點設定）？
- [ ] Debug 用 print 是否在完工前全部移除？

---

## D4：Domain 層純淨性

**severity_if_violated**：HIGH

**目的**：確保 Domain 層（Entity, Value Object, Domain Service）不引入任何 framework 依賴。

**Checklist**：

- [ ] `domain/` 目錄下是否有 `import streamlit`、`import fastapi`、`import sqlalchemy` 等 framework import？
- [ ] Entity 是否使用 `@dataclass`（可變）而非 `@dataclass(frozen=True)`（用於 Value Object）？
- [ ] Domain 物件是否正確區分 Entity（有唯一 ID）和 Value Object（無 ID，按值比較）？
- [ ] Domain Service 是否只依賴 Domain 介面（`IUserRepository`），而非注入具體的資料庫 Session？
- [ ] Domain 模型是否有任何 JSON serialization decorator（如 pydantic 的繼承）？若是，確認這是設計決策而非誤植。

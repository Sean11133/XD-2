# iMX.Framework 框架開發規範 (Contributing Guide)

> **本文件為框架貢獻者的 Single Source of Truth (SSoT)。**
> 如果您是使用框架開發應用程式，請參閱 [instructions/imx-user.instructions.md](instructions/imx-user.instructions.md)。
>
> 通用架構與設計原則（SOLID、Clean Architecture、Design Patterns）請參閱
> `standards/` 目錄下的對應文件（由 wec-coding-standards 提供）。

---

## 1. 框架核心設計原則 (Design Soul)

框架應作為開發者的靈活基礎，而非限制。以下原則為 **iMX.Framework 特有**，補充通用 SOLID 原則：

- **1.1 簡單勝於複雜 (Simplicity First)**：只提供 80% 場景所需的功能。
  若功能使用頻率低於 20% 或可用現有 API 組合實現，則不應加入框架核心。
- **1.2 組成優於繼承 (Composition Over Inheritance)**：繼承鏈嚴禁超過 2 層。
  （如 `OracleProvider` 應組合同步/非同步執行器，而非繼承深層基類）
- **1.3 開放勝於封裝 (Open Over Closed)**：允許開發者繞過框架直接操作，不要隱藏過多實作細節。
- **1.4 職責邊界 (Boundaries)**：框架負責基礎設施（連線管理、並行安全、APM 整合）；
  應用程式負責業務邏輯（CRUD、驗證規則）。

---

## 2. 程式碼規範 (Code Style)

- **2.1 XML 註解**：類別必須包含 `<summary>` 並區分「功能目的」與「修改版次」。
- **2.2 命名規範**：
  - 配置區塊統一使用 `*Config` 後綴。
  - Markdown 文檔使用 **kebab-case**；Dockerfile、Jenkinsfile 保持原樣。
- **2.3 編碼安全 (Encoding Safety)**：
  - **禁止**使用 PowerShell `Set-Content` 直接寫入/修改檔案（UTF-8 損毀風險）。
  - 若必須使用命令列，必須明確指定 `-Encoding UTF8NoBOM`，並事後驗證。

---

## 3. 技術標準 (Technical Standards)

### 3.1 並行安全性 (Thread-Safety)

- **禁止** Check-then-Act：`if (flag) flag = true;`
- **正確實作**：使用 `Interlocked` 原子操作。
  ```csharp
  private int _isBusy = 0;
  public bool TrySetBusy() => Interlocked.CompareExchange(ref _isBusy, 1, 0) == 0;
  ```

### 3.2 資源管理 (Resource Management)

- **Dispose 順序**：先釋放交易，再釋放連線。
- **異常安全**：使用 `try-finally` 確保資源必被釋放。
  ```csharp
  public void Dispose() {
      try { Transaction?.Dispose(); }
      finally { Connection?.Dispose(); }
  }
  ```

### 3.3 非同步實作

- 函式庫程式碼必須附加 `.ConfigureAwait(false)` 以避免死結。

### 3.4 API 設計決策清單

開發新功能前必須確認：

- [ ] 這個功能是否為 80% 場景所需？
- [ ] 是否有更簡單的替代方案？
- [ ] 是否會限制開發者的選擇？
- [ ] 是否會在並行環境中使用？有無競態條件？
- [ ] 是否正確實作 `IDisposable`、使用 `try-finally`？
- [ ] 是否依賴介面（可 Mock）？職責是否單一？

---

## 4. AI 助手指引 (AI Agent Instructions)

### 4.1 防止幻覺 (Anti-Hallucination)

- **嚴禁捏造不存在的介面**：產生代碼前必須搜尋 `src/` 確認介面是否存在。
- **不存在的服務清單（已知幻覺）**：
  - `IVariableService` — 不存在
  - `ISettingsProvider` — 不存在
  - `iMX.Core.LogConfig` — 已合併至 `iMXConfig`

### 4.2 職責守衛

當被要求實作特定業務邏輯（如 `ValidateUserStatus`）時，應引導使用者在應用層實作，而非修改框架核心。

### 4.3 框架開發反模式警示

絕對避免：

1. 過度封裝（不必要的抽象層）
2. 功能過載（框架核心加入業務邏輯）
3. Check-Then-Act 競態條件
4. 深層繼承（超過 2 層）
5. 靜態依賴（難以測試）

### 4.4 規格進化

每次完成重構或新功能後，應總結新的技術考量點並更新此文件。

---

## 5. 相關文件導航

| 文件                                                                           | 用途                                            |
| ------------------------------------------------------------------------------ | ----------------------------------------------- |
| [AGENTS.md](AGENTS.md)                                                         | AI 入口指引（本 repo 統一管理版）               |
| [instructions/imx-user.instructions.md](instructions/imx-user.instructions.md) | 應用開發者使用指引                              |
| [instructions/imx-dev.instructions.md](instructions/imx-dev.instructions.md)   | 框架貢獻者進階規範                              |
| `standards/solid-principles.md`                                                | SOLID 原則（wec-coding-standards 提供）         |
| `standards/design-patterns.md`                                                 | Design Patterns（wec-coding-standards 提供）    |
| `standards/clean-architecture.md`                                              | Clean Architecture（wec-coding-standards 提供） |

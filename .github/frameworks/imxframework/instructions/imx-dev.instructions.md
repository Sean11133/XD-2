---
applyTo: "**/*.cs"
---

# iMX.Framework 框架貢獻者進階規範

> **使用對象**：修改框架原始碼（`src/` 目錄）的貢獻者。
> 一般應用開發者請參閱 [imx-user.instructions.md](imx-user.instructions.md)。

---

## 框架設計靈魂

### 1. 功能必要性決策

加入新 API 前必須確認：

- [ ] 這個功能是否為 **80%** 場景所需？（若 < 20% 場景不應加入核心）
- [ ] 用現有組合是否能達成同樣目的？
- [ ] 是否會**限制**應用開發者的選擇？（開放原則）

### 2. 並行安全性

- **禁止** Check-then-Act 競態條件：

  ```csharp
  // ❌ 錯誤：競態條件
  if (_isBusy == false) _isBusy = true;

  // ✅ 正確：原子操作
  private int _isBusy = 0;
  public bool TrySetBusy() => Interlocked.CompareExchange(ref _isBusy, 1, 0) == 0;
  ```

### 3. 資源管理

- Dispose 順序：**先交易，再連線**。
- 所有資源釋放使用 `try-finally`：
  ```csharp
  public void Dispose() {
      try { Transaction?.Dispose(); }
      finally { Connection?.Dispose(); }
  }
  ```

### 4. 非同步函式庫

- 函式庫方法都必須加 `.ConfigureAwait(false)` 避免死結。

### 5. 繼承深度

- 嚴禁超過 **2 層**繼承。優先使用介面組合。

---

## 新功能開發 Checklist

### 開發前

- [ ] 搜尋 `src/` 確認相似功能是否已存在
- [ ] 確認遵循 80% 場景規則
- [ ] 介面設計使用 `I` 前綴（可 Mock）

### 開發中

- [ ] 並行場景使用 `Interlocked` 原子操作
- [ ] 資源管理使用 `try-finally`
- [ ] 非同步方法加 `.ConfigureAwait(false)`
- [ ] XML 文件包含 `<summary>`，說明目的和修改版次
- [ ] 命名：配置類別使用 `*Config` 後綴

### 開發後

- [ ] 沒有 Check-then-Act 競態條件
- [ ] 沒有超過 2 層繼承
- [ ] 沒有硬式依賴（可 Mock 介面）
- [ ] Dispose 順序正確
- [ ] 更新 `contributing.md` 新增的技術考量

---

## 已知反模式（嚴禁引入）

| 反模式         | 原因                                   |
| -------------- | -------------------------------------- |
| 過度封裝       | 不必要的抽象層增加學習成本             |
| 功能過載       | 框架核心不應包含業務邏輯               |
| Check-then-Act | 並行環境中的競態條件                   |
| 繼承 > 2 層    | 脆弱的繼承鏈，難以修改                 |
| 靜態依賴       | 難以測試、難以替換                     |
| 捏造介面       | 建議不存在的 API（anti-hallucination） |

---

## 已知不存在的介面（幻覺清單）

以下為 AI 常捏造但**確實不存在**的框架介面，框架貢獻者也不應新增：

- `IVariableService`
- `ISettingsProvider`（已棄用，改為 `IOptions<iMXConfig>`）
- `iMX.Core.LogConfig`（已合併至 `iMXConfig`）

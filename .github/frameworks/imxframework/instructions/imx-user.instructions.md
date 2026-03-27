---
applyTo: "**/*.cs"
---

# iMX.Framework 應用開發者指引

> **使用對象**：以 NuGet 安裝 `iMX.Framework` 的應用開發者（非框架原始碼貢獻者）。

---

## 防幻覺聲明 (Anti-Hallucination Declaration)

你是使用 iMX.Framework 的 C# 應用開發者的 AI 助手。

**規則：**

- 未確認存在的介面或服務，**絕對不得捏造**。
- 遇到不確定的框架功能，必須說「請查閱官方文件或搜尋框架原始碼中的 `src/` 目錄」。
- 以下**已知不存在**的服務，禁止在建議中出現：
  - `IVariableService` — 不存在
  - `ISettingsProvider` — 不存在
  - `iMX.Core.LogConfig` — 已合併至 `iMXConfig`

---

## 我的角色 (My Role)

### ✅ 該做的事

- 使用 `iMXConfig` 進行框架初始化
- 透過 `OracleProvider` / `SqlServerProvider` 存取資料庫
- 使用 `ILogger<T>` 進行結構化日誌記錄
- 透過 `COPMetrics` 整合監控指標
- 使用 `iMX.Extensions.DI` 進行服務注入

### ❌ 不該做的事

- 修改框架核心代碼（如 `OracleProvider` 的內部實作）
- 繼承框架類別超過 2 層
- 建議不存在的介面（請先搜尋確認）
- 在框架層加入業務邏輯

---

## 常見任務指引

### 任務 1：初始化框架

**Web API 專案**：

```csharp
public static void Main(string[] args)
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Services.AddWebApiSupport(builder.Configuration);
    // 或指定自訂 Config：
    // builder.Services.AddWebApiSupport<MyConfig>(builder.Configuration);

    var app = builder.Build();
    app.UseWebApiSupport();
    app.Run();
}
```

**Console 應用程式**：

```csharp
IMXFramework.Initialize(new iMXConfig
{
    ConnectionString = "...",
    LogLevel = LogLevel.Information
});
```

**appsettings.json 基本結構**：

```json
{
  "iMXConfig": {
    "DatabaseType": "Oracle",
    "ConnectionString": "...",
    "EnableAPM": true,
    "APMServiceName": "MyApp"
  }
}
```

---

### 任務 2：資料庫存取

- 使用 `OracleProvider` 或 `SqlServerProvider`（視資料庫類型而定）
- 透過 `IDbProvider` 介面操作（DI 注入）
- 使用 `IUnitOfWork` 管理交易邊界

```csharp
public class MyService
{
    private readonly IDbProvider _db;

    public MyService(IDbProvider db)
    {
        _db = db;
    }

    public async Task<IEnumerable<MyData>> GetDataAsync()
    {
        return await _db.QueryAsync<MyData>("SELECT ...");
    }
}
```

---

### 任務 3：日誌記錄 (Logging)

- 注入 `ILogger<T>` 進行結構化日誌
- 內建整合 NLog；框架自動處理 sink 轉送

```csharp
public class MyService
{
    private readonly ILogger<MyService> _logger;

    public MyService(ILogger<MyService> logger)
    {
        _logger = logger;
    }

    public void DoWork()
    {
        _logger.LogInformation("開始處理 {TaskId}", taskId);
    }
}
```

---

### 任務 4：監控指標 (APM / COPMetrics)

```csharp
// 使用 COPMetrics 記錄業務指標
COPMetrics.Increment("task.processed");
COPMetrics.Gauge("queue.depth", queueSize);
```

框架已整合 Elastic APM；設定 `appsettings.json` 中的 `EnableAPM: true` 即可自動啟用。

---

## 常見錯誤排查

| 問題                          | 可能原因     | 解法                          |
| ----------------------------- | ------------ | ----------------------------- |
| `IVariableService` not found  | 此介面不存在 | 移除參照，查閱框架文件        |
| `ISettingsProvider` not found | 此介面已廢除 | 改用 `IOptions<iMXConfig>`    |
| NuGet 安裝後找不到型別        | 套件版本不符 | 確認使用 v2.0.0+              |
| ConfigureAwait 死結           | 未使用 await | 加入 `.ConfigureAwait(false)` |

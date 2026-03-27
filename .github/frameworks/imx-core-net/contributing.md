# iMX.Core.Net 框架規範 (Contributing Guide)

> **本文件為應用開發者與框架維護者的 Single Source of Truth (SSoT)。**
>
> - **應用開發者**：直接查閱各章節的 Manager API 使用模式。
> - **框架維護者**：同時遵循 §7 框架維護規範。
>
> 通用架構與設計原則請參閱 `standards/` 目錄（由 wec-coding-standards 提供）。

---

## 目錄

1. [框架架構概覽](#1-框架架構概覽)
2. [Manager 清單與職責](#2-manager-清單與職責)
3. [資料庫存取（DatabaseManager）](#3-資料庫存取databasemanager)
4. [訊息佇列（WecTransport / WecApplication）](#4-訊息佇列wectransport--wecapplication)
5. [多 TFM 條件編譯](#5-多-tfm-條件編譯)
6. [遷移至 iMX.Framework v2.0](#6-遷移至-imxframework-v20)
7. [框架維護規範（貢獻者）](#7-框架維護規範貢獻者)
8. [AI 助手指引](#8-ai-助手指引)

---

## 1. 框架架構概覽

### 1.1 模組結構

```
src/iMX.Core/
├── Config/           — iMXCoreConfig 設定類別
├── DataBase/         — DatabaseManager（Oracle/SQL Server）
├── DataCache/        — AppDataCache、UserDataCache（gRPC 快取）
├── DataFetcher/      — FetcherFactory（gRPC Data Fetcher）
├── ElasticApm/       — ElasticApmManager（APM 監控）
├── ElasticSearch/    — ElasticSearchManager（Elasticsearch 7.x）
├── Log/              — LogManager（NLog 封裝）
├── S3/               — S3BucketManager（物件儲存）
├── Security/         — 安全相關工具
├── WecBaseLibrary/   — 基礎工具類別
└── WecKafkaLibrary/  — WecTransport、WecApplication（Kafka）
```

### 1.2 雙 TFM 範例結構

iMX.Core 同時支援 .NET 8 和 .NET Framework 4.8，各有對應範例：

```
samples/
├── iMX.CoreConsole/     — .NET 8 Console 範例
├── iMX.CoreConsole48/   — .NET Framework 4.8 Console 範例
├── iMX.CoreWeb/         — .NET 8 Web API 範例
└── iMX.CoreWeb48/       — .NET Framework 4.8 Web API 範例
```

### 1.3 初始化模式

**iMX.Core v1.x 為 Manager-Based 架構**，每個 Manager 各自設定與初始化：

```csharp
// 無統一 Initialize 入口
// 各 Manager 透過設定物件個別啟動
var dbManager = new DatabaseManager(new DatabaseConfig
{
    ConnectionString = "Data source=...",
    DatabaseType     = DatabaseType.Oracle
});
```

> **對比 iMX.Framework v2.0**：v2.0 使用統一的 `IMXFramework.Initialize()` 或
> `builder.Services.AddWebApiSupport()` 一次設定所有服務。

---

## 2. Manager 清單與職責

| Manager                | 模組                  | 職責                                 |
| ---------------------- | --------------------- | ------------------------------------ |
| `DatabaseManager`      | `DataBase/`           | Oracle / SQL Server 資料庫 CRUD      |
| `CassandraManager`     | （獨立套件）          | Cassandra NoSQL                      |
| `S3BucketManager`      | `S3/`                 | CIMS3 物件儲存（上傳/下載/列舉）     |
| `ElasticSearchManager` | `ElasticSearch/`      | Elasticsearch 7.x 索引/搜尋          |
| `ElasticApmManager`    | `ElasticApm/`         | Elastic APM 自訂交易追蹤             |
| `COPManager`           | （`WecBaseLibrary/`） | COP/Prometheus 指標上報              |
| `FetcherFactory`       | `DataFetcher/`        | gRPC Data Fetcher 查詢工廠           |
| `AppDataCache`         | `DataCache/`          | 應用層 gRPC 快取                     |
| `UserDataCache`        | `DataCache/`          | 使用者層 gRPC 快取                   |
| `WecTransport`         | `WecKafkaLibrary/`    | Kafka Producer（訊息發送）           |
| `WecApplication`       | `WecKafkaLibrary/`    | Kafka Consumer（訊息接收，繼承實作） |
| `LogManager`           | `Log/`                | NLog 封裝，結構化日誌                |

> **已知不存在的類別（禁止建議）**：
>
> - `IVariableService` — 不存在
> - `ISettingsProvider` — 不存在
> - `iMX.Core.LogConfig` — 已合併至 `iMXCoreConfig`

---

## 3. 資料庫存取（DatabaseManager）

### 3.1 設定（appsettings.json，.NET 8）

```json
{
  "iMXCore": {
    "Database": {
      "ConnectionString": "Data source=(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=10.18.20.31)(PORT=1523)))(CONNECT_DATA=(SID=FEDEV)));",
      "DatabaseType": "Oracle"
    }
  }
}
```

### 3.2 設定（App.config，.NET Framework 4.8）

```xml
<configuration>
  <connectionStrings>
    <add name="MES" connectionString="Data source=...;User ID=user;Password=pwd;"
         providerName="Oracle.ManagedDataAccess.Client" />
  </connectionStrings>
</configuration>
```

### 3.3 使用方式

```csharp
// 透過 DI 注入（.NET 8 / Autofac / 任何 DI Container）
public class MyService
{
    private readonly DatabaseManager _db;

    public MyService(DatabaseManager db) => _db = db;

    public async Task<List<MyModel>> GetDataAsync(string id)
    {
        return await _db.QueryAsync<MyModel>(
            "SELECT col1, col2 FROM my_table WHERE id = :p1",
            new { p1 = id });
    }

    public async Task<int> InsertAsync(MyModel model)
    {
        return await _db.ExecuteAsync(
            "INSERT INTO my_table (id, name) VALUES (:p1, :p2)",
            new { p1 = model.Id, p2 = model.Name });
    }
}
```

### 3.4 Transaction 管理

```csharp
// 使用 Transaction 包裹多次寫入
await _db.ExecuteInTransactionAsync(async () =>
{
    await _db.ExecuteAsync(insertSql1, param1);
    await _db.ExecuteAsync(insertSql2, param2);
    // 成功 → 自動 Commit；拋出 Exception → 自動 Rollback
});
```

---

## 4. 訊息佇列（WecTransport / WecApplication）

### 4.1 設定（appsettings.json）

```json
{
  "iMXCore": {
    "Kafka": {
      "BootstrapServers": "10.18.20.56:9092",
      "ConsumerGroupId": "my-consumer-group"
    }
  }
}
```

### 4.2 Producer（WecTransport）

```csharp
var transport = new WecTransport(kafkaConfig);

// 發送訊息
await transport.SendAsync("my-topic", new MyMessage
{
    EventType = "ORDER_CREATED",
    Payload   = new { OrderId = "123", Amount = 99.9 }
});
```

### 4.3 Consumer（WecApplication）

```csharp
// 繼承 WecApplication 並實作 ProcessAsync
public class MyConsumer : WecApplication
{
    public override async Task ProcessAsync(WecMessage message)
    {
        var order = message.Deserialize<MyMessage>();
        // 處理訊息邏輯
        await SaveToDatabase(order);
    }

    public override void OnError(Exception ex, WecMessage message)
    {
        // 錯誤處理
        LogManager.Error($"處理失敗：{ex.Message}");
    }
}
```

---

## 5. 多 TFM 條件編譯

iMX.Core 支援 .NET 8 與 .NET Framework 4.8，需在同一份原始碼中處理 API 差異：

```csharp
// 條件編譯指令
#if NET48_OR_GREATER
    // .NET Framework 4.8 專用路徑
    using System.Web;
    var context = HttpContext.Current;
#else
    // .NET 8 路徑
    using Microsoft.AspNetCore.Http;
    var context = _httpContextAccessor.HttpContext;
#endif

// 非同步差異處理
#if NET48_OR_GREATER
    // .NET 4.8：Task.Run 包裝（避免 deadlock 時可考慮，但不強制）
    public Task<List<T>> QueryAsync<T>(string sql) =>
        Task.Run(() => Query<T>(sql).ToList());
#else
    // .NET 8：原生 async/await + ConfigureAwait(false)
    public async Task<List<T>> QueryAsync<T>(string sql) =>
        (await _connection.QueryAsync<T>(sql)).ToList();
#endif
```

### 5.1 .NET Framework 4.8 限制（函式庫開發）

| 限制                  | 說明                                                        |
| --------------------- | ----------------------------------------------------------- |
| 不可用 `async Main()` | 入口點不支援 async                                          |
| 函式庫的 `async` 方法 | 必須先呼叫 `.ConfigureAwait(false)` 以避免 ASP.NET 4.8 死結 |
| `System.Text.Json`    | 4.8 不原生支援，使用 `Newtonsoft.Json`                      |
| File-scoped namespace | 不支援，使用 `namespace Foo { }`                            |

---

## 6. 遷移至 iMX.Framework v2.0

### 6.1 何時遷移

| 情境                     | 建議                                  |
| ------------------------ | ------------------------------------- |
| 既有系統小修             | 維持 iMX.Core v1.x，不需遷移          |
| 新系統開發               | ✅ 直接採用 iMX.Framework v2.0        |
| 既有系統重大重構         | ✅ 評估並規劃遷移                     |
| 需要 .NET 8 + 4.8 雙支援 | iMX.Framework v2.0 同樣支援，遷移可行 |

### 6.2 主要 API 對照

| iMX.Core v1.x                 | iMX.Framework v2.0                                    | 說明               |
| ----------------------------- | ----------------------------------------------------- | ------------------ |
| `DatabaseManager`             | `IDbProvider`（`OracleProvider`/`SqlServerProvider`） | 介面優先，可 Mock  |
| `new DatabaseManager(config)` | `builder.Services.AddWebApiSupport(config)`           | 統一 DI 初始化     |
| `S3BucketManager`             | `IStorageProvider`                                    | 抽象介面           |
| `ElasticSearchManager`        | `RecorderClient`（`iMX.Service`）                     | 整合至 Service 層  |
| `ElasticApmManager`           | 內建於 `iMXConfig.EnableAPM`                          | 設定驅動           |
| `COPManager`                  | `COPMetrics`                                          | 相似 API           |
| `WecTransport`                | `WecTransport`（`iMX.Messaging`）                     | 同名，介面相容     |
| `LogManager`                  | `ILogger<T>`（Microsoft.Extensions.Logging）          | 標準 .NET 日誌介面 |

### 6.3 遷移參考

- 新框架指引：[`frameworks/imxframework/`](../imxframework/AGENTS.md)
- `iMX.Legacy` 套件提供部分向後相容橋接
- 官方遷移範例：[http://fab6gitlab/cim-framework/imx.core.net.samples](http://fab6gitlab/cim-framework/imx.core.net.samples)

---

## 7. 框架維護規範（貢獻者）

### 7.1 雙 TFM 支援原則

- 所有 Public API 修改必須確保在 .NET 8 **和** .NET Framework 4.8 均可編譯與執行。
- 使用 `#if NET48_OR_GREATER` 隔離版本差異，**不得** 讓常用路徑退化到純同步。

### 7.2 API 設計決策

加入新 API 前確認：

- [ ] 此功能是否為 80% 場景所需？（< 20% 場景不加入核心）
- [ ] iMX.Framework v2.0 是否已有更好的替代設計？如是，優先建議遷移而非重複造輪。
- [ ] 是否有並行安全疑慮？使用 `Interlocked` 操作取代 Check-then-Act。

### 7.3 並行安全

```csharp
// ❌ 禁止 Check-then-Act
if (_isBusy == false) _isBusy = true;

// ✅ 原子操作
private int _isBusy = 0;
public bool TrySetBusy() => Interlocked.CompareExchange(ref _isBusy, 1, 0) == 0;
```

### 7.4 資源管理

```csharp
// Dispose 順序：先交易，再連線
public void Dispose()
{
    try { Transaction?.Dispose(); }
    finally { Connection?.Dispose(); }
}
```

### 7.5 DocFX 文檔

- 所有 Public API 必須有 XML `<summary>`。
- 文檔建置：`doc/docfx.json`，輸出至 [https://pilot-imx/iMX.CoreDoc/](https://pilot-imx/iMX.CoreDoc/)。

---

## 8. AI 助手指引

### 8.1 防止幻覺

- Manager 清單以 §2 為準，**不得捏造不存在的 Manager**。
- 不確定 API 時，請查閱 [官方文件](https://pilot-imx/iMX.CoreDoc/) 或 IntelliSense。
- **已知不存在**：`IVariableService`、`ISettingsProvider`、`iMX.Core.LogConfig`。

### 8.2 版本區分

- `.csproj` 中的 `<TargetFramework>net8.0` 或 `<TargetFrameworks>net8.0;net48` + `PackageReference Include="iMX.Core"` 版本 `< 2.0` → 使用本文件。
- `PackageReference Include="iMX.Framework"` 或版本 `>= 2.0` → 切換至 `frameworks/imxframework/` 指引。

### 8.3 遷移建議時機

當使用者詢問「如何加入 XXX 新功能」時，AI 應：

1. 提供 iMX.Core v1.x 的現有做法（維護用）。
2. 同時說明 iMX.Framework v2.0 的對應方案，主動建議評估遷移。

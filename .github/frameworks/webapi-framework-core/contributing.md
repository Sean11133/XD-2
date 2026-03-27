# CIMWebApiFrameworkCore 框架規範 (Contributing Guide)

> **⚠️ 棄用通知**：本框架已進入維護模式，新專案請使用 **iMX.Framework v2.0**。
> 詳見 §5 遷移路徑。
>
> 通用架構與設計原則請參閱 `standards/` 目錄（由 wec-coding-standards 提供）。

---

## 目錄

1. [框架架構概覽](#1-框架架構概覽)
2. [資料庫存取（DatabaseManager）](#2-資料庫存取databasemanager)
3. [外部服務整合](#3-外部服務整合)
4. [Web API 模式](#4-web-api-模式)
5. [遷移至 iMX.Framework v2.0](#5-遷移至-imxframework-v20)
6. [AI 助手指引](#6-ai-助手指引)

---

## 1. 框架架構概覽

### 1.1 依賴關係

```
CIMWebApiFrameworkCore (.NET 8)
   └── iMX.Core v1.9.1（Manager-Based 舊版核心）
           ├── DatabaseManager（Oracle/SQL Server）
           ├── CassandraManager（Cassandra DB）
           ├── S3BucketManager（S3 物件儲存）
           ├── ElasticSearchManager（Elasticsearch 7.x）
           ├── ElasticApmManager（Elastic APM）
           ├── COPManager（COP/Prometheus 監控）
           ├── FetcherFactory（gRPC Data Fetcher）
           ├── AppDataCache / UserDataCache（gRPC 快取）
           └── WecTransport / WecApplication（Kafka）
```

### 1.2 目錄結構（核心庫）

```
CIMWebApiFrameworkCore/
├── Controllers/     — FrameworkController（基底 Controller）
├── Exception/       — GlobalMessageMiddleware
├── Extension/       — HttpClientExtension、ObjectExtension
├── Filter/          — Action Filters
├── Register/        — DI 注冊擴充方法
├── Security/        — SecurityHandler、TokenHandler
├── Service/         — SecurityService
├── Template/        — Controller 範本
└── Utility/         — 工具類別
```

### 1.3 應用層結構（WebApp）

採用 .NET 8 **最小化 Hosting**（`Program.cs`），環境設定以 `appsettings.json` 分離：

```
CIMWebApiFrameworkCoreWebApp/
├── Application/     — Use Case / 業務邏輯
├── Controllers/     — API Controllers
├── appsettings.json
├── appsettings.Development.json
├── appsettings.Pilot.json
└── Program.cs       — .NET 8 Minimal Hosting
```

---

## 2. 資料庫存取（DatabaseManager）

### 2.1 初始化與設定（appsettings.json）

iMX.Core v1.x 使用 Manager 模式初始化，配置於 `appsettings.json`：

```json
{
  "iMXCore": {
    "Database": {
      "ConnectionString": "Data Source=...",
      "DatabaseType": "Oracle"
    }
  }
}
```

### 2.2 使用方式

```csharp
// 透過 DI 取得 DatabaseManager
public class MyService
{
    private readonly DatabaseManager _dbManager;

    public MyService(DatabaseManager dbManager)
    {
        _dbManager = dbManager;
    }

    public async Task<List<MyModel>> GetDataAsync()
    {
        // iMX.Core v1.x Manager-Based API
        return await _dbManager.QueryAsync<MyModel>("SELECT ...");
    }
}
```

> **注意**：iMX.Core v1.x 使用 `DatabaseManager`，而 iMX.Framework v2.0 使用 `IDbProvider`（DI 介面）。
> 這是遷移時最主要的 Breaking Change。

---

## 3. 外部服務整合

### 3.1 Manager 對照表

| 服務              | iMX.Core v1.x Manager           | iMX.Framework v2.0 對應                                  |
| ----------------- | ------------------------------- | -------------------------------------------------------- |
| Oracle/SQL Server | `DatabaseManager`               | `OracleProvider` / `SqlServerProvider` via `IDbProvider` |
| Cassandra         | `CassandraManager`              | `CassandraProvider`                                      |
| S3 物件儲存       | `S3BucketManager`               | `IStorageProvider`（`iMX.Storage`）                      |
| Elasticsearch     | `ElasticSearchManager`          | `iMX.Service`（`RecorderClient`）                        |
| Elastic APM       | `ElasticApmManager`             | `iMX.Core` 內建（`eAPMConfig`）                          |
| COP/Prometheus    | `COPManager`                    | `COPMetrics`（`iMX.Core`）                               |
| Kafka             | `WecTransport`/`WecApplication` | `iMX.Messaging`（`WecTransport`）                        |
| gRPC Data Fetcher | `FetcherFactory`                | `FetcherFactory`（`iMX.Service`）                        |
| gRPC 快取         | `AppDataCache`/`UserDataCache`  | `iMX.Service`（`CacherClient`）                          |

### 3.2 Kafka（WecTransport / WecApplication）

```csharp
// Producer
var transport = new WecTransport(config);
await transport.SendAsync("topic-name", messageObject);

// Consumer — 實作 WecApplication
public class MyConsumer : WecApplication
{
    public override Task ProcessAsync(WecMessage message)
    {
        // 處理訊息
        return Task.CompletedTask;
    }
}
```

### 3.3 Elasticsearch（ElasticSearchManager）

```csharp
var esManager = new ElasticSearchManager(config);
var result = await esManager.SearchAsync<MyDoc>(indexName, query);
```

---

## 4. Web API 模式

### 4.1 Program.cs 最小化 Hosting

```csharp
var builder = WebApplication.CreateBuilder(args);

// 框架 DI 註冊
builder.Services.AddCIMWebApiFrameworkCore(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

// 業務層 DI
builder.Services.AddScoped<IMyService, MyService>();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run();
```

### 4.2 安全驗證

```csharp
// SecurityHandler 使用方式（v1 風格）
public class MyController : FrameworkController
{
    [HttpPost]
    public async Task<IActionResult> GetData([FromBody] MyInput input)
    {
        var hasPermit = await Security.HasPermitAsync("Resource-Name");
        if (!hasPermit) return Forbid();
        // ...
    }
}
```

---

## 5. 遷移至 iMX.Framework v2.0

### 5.1 遷移必要性評估

在以下情況**強烈建議遷移**：

- [ ] 正在開發重大新功能
- [ ] 計畫進行大規模重構
- [ ] 需要 `iMX.Legacy` 相容層以外的新 iMX.Core 功能
- [ ] 系統需要支援 .NET Framework 4.8（`iMX.Framework` 同時支援 4.8 和 .NET 8）

### 5.2 API 遷移對照

| 舊版（CIMWebApiFrameworkCore + iMX.Core v1.x） | 新版（iMX.Framework v2.0）                             |
| ---------------------------------------------- | ------------------------------------------------------ |
| `DatabaseManager.QueryAsync()`                 | `IDbProvider.QueryAsync()`（DI 注入）                  |
| `new XXXManager(config)` 初始化                | `builder.Services.AddWebApiSupport(config)` 統一初始化 |
| `appsettings.json` 多個獨立 Section            | `iMXConfig` 統一配置物件                               |
| `WecTransport` / `WecApplication`              | `iMX.Messaging`（相容同名類別）                        |
| `SecurityHandler`                              | `iMX.Web` 內建 Security Middleware                     |

### 5.3 遷移參考

- 新框架指引：[`frameworks/imxframework/`](../imxframework/AGENTS.md)
- iMX.Framework 使用者指引：[`frameworks/imxframework/instructions/imx-user.instructions.md`](../imxframework/instructions/imx-user.instructions.md)
- `iMX.Legacy` 套件可提供向後相容橋接

---

## 6. AI 助手指引

### 6.1 防止幻覺

- iMX.Core v1.x Manager 清單以 §3.1 對照表為準，**不得捏造不存在的 Manager**。
- `iMX.Core v1.x` 與 `iMX.Framework v2.0` API **不相容**，禁止混用。

### 6.2 新功能開發建議

每當使用者詢問「如何在 CIMWebApiFrameworkCore 加入 XXX 功能」時，AI 應：

1. 先提供 iMX.Core v1.x 的現有做法（維護既有系統用）。
2. 同時說明 iMX.Framework v2.0 的對應做法，並建議評估遷移。

### 6.3 代碼版本檢測

產生程式碼前，確認 `.csproj` 中的 `<PackageReference Include="iMX.Core">` 版本：

- `v1.8.x`、`v1.9.x` → 使用本文件的 Manager-Based API。
- 若已升級至 iMX.Framework v2.0 → 切換至 `frameworks/imxframework/` 指引。

---
applyTo: "**/*.cs"
---

# CIMWebApiFrameworkCore 應用開發者指引 (.NET 8)

> **⚠️ 棄用通知**：本框架已進入維護模式。新專案請使用 **iMX.Framework v2.0**。
> 請參閱 `frameworks/imxframework/` 獲取新框架指引。
>
> **使用對象**：維護既有 CIMWebApiFrameworkCore 系統的開發者。
> **依賴核心**：iMX.Core v1.9.x（Manager-Based API）

---

## 框架初始化（Program.cs）

```csharp
// .NET 8 Minimal Hosting
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCIMWebApiFrameworkCore(builder.Configuration);
builder.Services.AddControllers();

var app = builder.Build();
app.MapControllers();
app.Run();
```

---

## iMX.Core v1.x Manager 使用模式

```csharp
// 透過 DI 注入 Manager
public class MyService
{
    private readonly DatabaseManager _dbManager;
    private readonly S3BucketManager _s3Manager;
    private readonly ElasticSearchManager _esManager;

    public MyService(
        DatabaseManager dbManager,
        S3BucketManager s3Manager,
        ElasticSearchManager esManager)
    {
        _dbManager = dbManager;
        _s3Manager = s3Manager;
        _esManager = esManager;
    }
}
```

## 資料庫查詢（DatabaseManager）

```csharp
// iMX.Core v1.x 風格
var result = await _dbManager.QueryAsync<MyModel>(sql, parameters);
var count = await _dbManager.ExecuteAsync(insertSql, model);
```

## 外部服務整合

```csharp
// Kafka Producer
await _transport.SendAsync("topic-name", message);

// Elasticsearch 查詢
var result = await _esManager.SearchAsync<MyDoc>(indexName, query);

// S3 物件儲存
await _s3Manager.UploadAsync(bucketName, key, stream);
```

## 安全驗證

```csharp
// Controller 繼承 FrameworkController
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

## ⚠️ 遷移提示

當遇到以下情況，請評估遷移至 iMX.Framework v2.0：

- 計畫新增重大功能
- 需要 iMX.Core v2.x 的新功能
- 需要同時支援 .NET Framework 4.8

**遷移目標**：`frameworks/imxframework/` → `imx-user.instructions.md`

---

## Manager 對照表（遷移參考）

| iMX.Core v1.x          | iMX.Framework v2.0                                    |
| ---------------------- | ----------------------------------------------------- |
| `DatabaseManager`      | `IDbProvider`（`OracleProvider`/`SqlServerProvider`） |
| `S3BucketManager`      | `IStorageProvider`                                    |
| `ElasticSearchManager` | `RecorderClient`（`iMX.Service`）                     |
| `COPManager`           | `COPMetrics`（`iMX.Core`）                            |
| `WecTransport`         | `WecTransport`（`iMX.Messaging`，同名）               |
| `FetcherFactory`       | `FetcherFactory`（`iMX.Service`）                     |

---

## 防幻覺聲明

- iMX.Core v1.x Manager 以本文件清單為準，**禁止捏造不存在的 Manager**。
- `iMX.Core v1.x` 與 `iMX.Framework v2.0` API **不相容**，禁止混用。
- 通用 C# .NET 8 規範請參閱 `instructions/csharp.instructions.md`（由 wec-coding-standards 提供）。

---
applyTo: "**/*.cs"
---

# iMX.Core.Net 應用開發者指引（v1.x Manager-Based API）

> **使用對象**：以 NuGet 安裝 `iMX.Core`（v1.x）的應用開發者與框架維護者。
> **目標框架**：.NET 8.0 / .NET Framework 4.8（雙 TFM）
> **完整規範**：請參閱 `frameworks/imx-core-net/contributing.md`

---

## 版本識別

產生程式碼前，請先確認 `.csproj` 中的套件版本：

| 情況                                                        | 適用指引                     |
| ----------------------------------------------------------- | ---------------------------- |
| `<PackageReference Include="iMX.Core" Version="1.*" />`     | ✅ 本文件                    |
| `<PackageReference Include="iMX.Framework" />` 或版本 `2.*` | → `frameworks/imxframework/` |

---

## Manager 清單（v1.x API）

| Manager                          | 功能                                    |
| -------------------------------- | --------------------------------------- |
| `DatabaseManager`                | Oracle / SQL Server CRUD（Dapper 底層） |
| `CassandraManager`               | Cassandra NoSQL                         |
| `S3BucketManager`                | CIMS3 物件儲存                          |
| `ElasticSearchManager`           | Elasticsearch 7.x                       |
| `ElasticApmManager`              | Elastic APM 自訂追蹤                    |
| `COPManager`                     | COP/Prometheus 指標                     |
| `FetcherFactory`                 | gRPC Data Fetcher                       |
| `AppDataCache` / `UserDataCache` | gRPC 快取                               |
| `WecTransport`                   | Kafka Producer                          |
| `WecApplication`                 | Kafka Consumer（繼承）                  |
| `LogManager`                     | NLog 封裝日誌                           |

> **禁止產生的不存在類別**：`IVariableService`、`ISettingsProvider`、`iMX.Core.LogConfig`

---

## 資料庫存取

```csharp
public class MyService
{
    private readonly DatabaseManager _db;
    public MyService(DatabaseManager db) => _db = db;

    // 查詢
    public async Task<List<MyModel>> GetListAsync(string id)
        => (await _db.QueryAsync<MyModel>(
            "SELECT col1 FROM my_table WHERE id = :p1", new { p1 = id })).ToList();

    // 寫入（Transaction）
    public async Task SaveAsync(MyModel model)
    {
        await _db.ExecuteInTransactionAsync(async () =>
        {
            await _db.ExecuteAsync("INSERT INTO ...", model);
        });
    }
}
```

## Kafka 訊息佇列

```csharp
// Producer
await _transport.SendAsync("my-topic", new { EventType = "ORDER", Payload = data });

// Consumer - 繼承 WecApplication
public class MyConsumer : WecApplication
{
    public override async Task ProcessAsync(WecMessage message)
    {
        var payload = message.Deserialize<MyMessage>();
        await HandleAsync(payload);
    }
}
```

## 日誌記錄（LogManager）

```csharp
LogManager.Debug("處理開始：" + id);
LogManager.Info("完成");
LogManager.Error("錯誤：" + ex.Message);
```

## S3 物件儲存

```csharp
// 上傳
await _s3Manager.UploadAsync(bucketName, objectKey, fileStream);
// 下載
var stream = await _s3Manager.DownloadAsync(bucketName, objectKey);
// 列舉
var keys = await _s3Manager.ListAsync(bucketName, prefix);
```

---

## 多 TFM 條件編譯

```csharp
#if NET48_OR_GREATER
    // .NET Framework 4.8 路徑
    namespace Foo.Bar
    {
        using System.Web;
        public class MyClass
        {
            public void DoWork()
            {
                var context = HttpContext.Current;
            }
        }
    }
#else
    // .NET 8 路徑
    namespace Foo.Bar;  // File-scoped 可用

    public class MyClass(IHttpContextAccessor contextAccessor)
    {
        public void DoWork()
        {
            var context = contextAccessor.HttpContext;
        }
    }
#endif
```

### .NET Framework 4.8 語法限制（條件：`#if NET48_OR_GREATER` 區塊內）

| 禁用語法                               | 替代                |
| -------------------------------------- | ------------------- |
| File-scoped namespace `namespace Foo;` | `namespace Foo { }` |
| Primary constructor                    | 傳統建構子          |
| Collection expression `[...]`          | `new List<T> { }`   |
| `global using`                         | 標準 `using`        |
| `record` / `init`                      | `class` / `set`     |

---

## 官方參考資源

- [API 文件](https://pilot-imx/iMX.CoreDoc/)
- [.NET 8 範例](http://fab6gitlab/cim-framework/imx.core.net.samples/imxsample)
- [.NET 4.8 範例](http://fab6gitlab/cim-framework/imx.core.net.samples/imxsample48)

---

## 防幻覺聲明

- iMX.Core 是企業專屬框架，網路上無公開資料。
- Manager 清單以本文件為準，**禁止猜測**。
- 通用 C# 規範請參閱 `instructions/csharp.instructions.md`（由 wec-coding-standards 提供）。

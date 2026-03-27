---
applyTo: "**/*.cs"
---

# iEDA Data Fetcher — C# 使用指引

> **服務說明**：見 [overview.md](../overview.md)  
> **前置需求**：NuGet 安裝 `iMX.Core` + `iEDA.DataFetcher`

---

## NuGet 安裝

```
nuget install iMX.Core
nuget install iEDA.DataFetcher
```

---

## 標準使用模式（以 LqcSummary 為例）

```csharp
using iEDA.DataFetcher;
using iEDA.DataFetcher.Models;

public class EdaService
{
    private readonly ILogger<EdaService> _logger;

    public EdaService(ILogger<EdaService> logger)
    {
        _logger = logger;
    }

    public async Task<List<LqcSummary>> GetLqcSummaryAsync(IEnumerable<string> lots)
    {
        // 1. 設定 Filter
        var filter = new LqcSummaryFilter();
        filter.Lots.AddRange(lots);
        // 或以時間查詢：
        // filter.StartDt = new DateTime(2025, 9, 1);
        // filter.EndDt   = new DateTime(2025, 9, 1, 3, 0, 0);
        // filter.ProductGroups.Add("GAA108");

        // 2. 建立客戶端並串流取值
        var fetcher = new LqcSummaryFetcher();
        var results = new List<LqcSummary>();

        await foreach (var batch in fetcher.GetLqcSummaryListAsync(filter))
        {
            results.AddRange(batch.Data);
            _logger.LogInformation("取得 {Count} 筆 LQC Summary", batch.Data.Count);
        }

        return results;
    }
}
```

---

## DI 注入設定（ASP.NET Core）

```csharp
// Program.cs
builder.Services.AddEdaDataFetcher(builder.Configuration);
```

---

## 各 Fetcher 命名規則

| Fetcher 類別        | 方法                     | Filter             |
| ------------------- | ------------------------ | ------------------ |
| `LqcSummaryFetcher` | `GetLqcSummaryListAsync` | `LqcSummaryFilter` |
| `CpSummaryFetcher`  | `GetCpSummaryListAsync`  | `CpSummaryFilter`  |
| `DefSummaryFetcher` | `GetDefSummaryListAsync` | `DefSummaryFilter` |
| `WatSummaryFetcher` | `GetWatSummaryListAsync` | `WatSummaryFilter` |

---

## 錯誤處理

```csharp
using Grpc.Core;

try
{
    await foreach (var batch in fetcher.GetLqcSummaryListAsync(filter))
    {
        ProcessBatch(batch);
    }
}
catch (RpcException ex) when (ex.StatusCode == StatusCode.Unauthenticated)
{
    _logger.LogError("EDA 權限未申請，請聯絡 MK23");
    throw;
}
catch (RpcException ex)
{
    _logger.LogError("gRPC 錯誤: {Status} — {Detail}", ex.StatusCode, ex.Status.Detail);
    throw;
}
```

---

## 禁止事項

- **禁止**捏造不存在的 Fetcher 或 Filter 型別
- **禁止**同步阻塞 async 串流（使用 `await foreach`，不得 `.Result` / `.Wait()`）

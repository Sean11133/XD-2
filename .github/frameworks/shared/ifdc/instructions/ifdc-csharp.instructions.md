---
applyTo: "**/*.cs"
---

# iFDC Data Fetcher — C# 使用指引

> **服務說明**：見 [overview.md](../overview.md)  
> **前置需求**：NuGet 安裝 `iMX.Core` + `iFDC.DataFetcher`

---

## NuGet 安裝

```
nuget install iMX.Core
nuget install iFDC.DataFetcher
```

---

## 標準使用模式

```csharp
using iFDC.DataFetcher;
using iFDC.DataFetcher.Models;

public class FdcService
{
    private readonly ILogger<FdcService> _logger;

    public FdcService(ILogger<FdcService> logger)
    {
        _logger = logger;
    }

    public async Task FetchRawDataAsync(string eqpId, string[] chambers,
                                        string[] parameters,
                                        DateTime start, DateTime end)
    {
        // 1. 建立 Filter
        var filter = new RecipeStepFilter
        {
            EqpId = eqpId,
            DateRanges = { new DateRange { Start = start, End = end } }
        };
        filter.Chambers.AddRange(chambers);
        filter.Parameters.AddRange(parameters);

        // 2. 建立 Fetcher 並串流取得資料
        var fetcher = new RawDataFetcher();
        await foreach (var result in fetcher.GetRawDataByFilterAsync(filter))
        {
            _logger.LogInformation("取得 {Count} 筆原始數據", result.Data.Count);
            ProcessBatch(result);
        }
    }

    private void ProcessBatch(RawDataResult result)
    {
        // 業務邏輯
    }
}
```

---

## DI 注入設定（ASP.NET Core）

```csharp
// Program.cs
builder.Services.AddFdcDataFetcher(builder.Configuration);
```

---

## 錯誤處理

```csharp
using Grpc.Core;

try
{
    await foreach (var result in fetcher.GetRawDataByFilterAsync(filter))
    {
        ProcessBatch(result);
    }
}
catch (RpcException ex)
{
    _logger.LogError("gRPC 錯誤: {Status} — {Detail}", ex.StatusCode, ex.Status.Detail);
    throw;
}
```

---

## 禁止事項

- **禁止**捏造不存在的 Fetcher 類型（先查 NuGet 套件型別清單）
- **禁止**同步阻塞 async 串流（使用 `await foreach`，不得 `.Result` / `.Wait()`）

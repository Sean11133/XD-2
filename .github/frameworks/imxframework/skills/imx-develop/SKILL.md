---
name: imx-develop
description: This skill should be used when the user asks about "查資料庫", "寫資料", "OracleProvider 怎麼用", "IDbProvider QueryAsync", "UnitOfWork 交易管理", "如何記錄日誌", "APM 整合", "怎麼用 COPMetrics", or needs iMX.Framework daily development patterns for database access, transaction management, logging, and APM integration.
---

# iMX.Framework 日常開發指引

## 執行步驟

根據使用者需求，選擇對應的開發模式並提供範例。

---

## 模式 1：資料庫查詢 (IDbProvider)

```csharp
public class ProductService
{
    private readonly IDbProvider _db;

    public ProductService(IDbProvider db)
    {
        _db = db;
    }

    // 查詢
    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        return await _db.QueryAsync<Product>(
            "SELECT * FROM Products WHERE Status = :status",
            new { status = "Active" }
        ).ConfigureAwait(false);
    }

    // 單筆查詢
    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _db.QueryFirstOrDefaultAsync<Product>(
            "SELECT * FROM Products WHERE Id = :id",
            new { id }
        ).ConfigureAwait(false);
    }
}
```

---

## 模式 2：交易管理 (IUnitOfWork)

```csharp
public class OrderService
{
    private readonly IUnitOfWork _uow;

    public OrderService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task CreateOrderAsync(Order order)
    {
        using var tx = _uow.BeginTransaction();
        try
        {
            await _uow.ExecuteAsync(
                "INSERT INTO Orders (Id, CustomerId) VALUES (:id, :customerId)",
                new { order.Id, order.CustomerId }
            ).ConfigureAwait(false);

            await _uow.ExecuteAsync(
                "UPDATE Inventory SET Qty = Qty - :qty WHERE ProductId = :productId",
                new { order.Qty, order.ProductId }
            ).ConfigureAwait(false);

            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }
}
```

---

## 模式 3：結構化日誌 (ILogger<T>)

```csharp
public class DataProcessor
{
    private readonly ILogger<DataProcessor> _logger;

    public DataProcessor(ILogger<DataProcessor> logger)
    {
        _logger = logger;
    }

    public async Task ProcessAsync(int batchId)
    {
        _logger.LogInformation("開始處理批次 {BatchId}", batchId);

        try
        {
            // ... 業務邏輯
            _logger.LogInformation("批次 {BatchId} 處理完成，共 {Count} 筆", batchId, count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "批次 {BatchId} 處理失敗", batchId);
            throw;
        }
    }
}
```

---

## 模式 4：監控指標 (COPMetrics)

```csharp
public class QueueProcessor
{
    public async Task ProcessMessageAsync(Message msg)
    {
        // 計數器
        COPMetrics.Increment("message.received");

        var sw = Stopwatch.StartNew();
        try
        {
            // ... 處理邏輯
            COPMetrics.Increment("message.processed");
        }
        catch
        {
            COPMetrics.Increment("message.failed");
            throw;
        }
        finally
        {
            // 延遲追蹤
            COPMetrics.Timer("message.processing_time", sw.ElapsedMilliseconds);
            // 最新 queue 深度
            COPMetrics.Gauge("queue.depth", GetCurrentQueueDepth());
        }
    }
}
```

---

## 常見問題 FAQ

**Q: OracleProvider 和 IDbProvider 的差別？**
A: `IDbProvider` 是介面，可用 DI 注入（推薦）。`OracleProvider` 是 Oracle 的具體實作，不應直接依賴（難以 Mock）。

**Q: 如何切換 Oracle / SQL Server？**
A: 修改 `appsettings.json` 的 `DatabaseType`，DI 容器會自動替換實作。

**Q: 為何要用 `.ConfigureAwait(false)`？**
A: 在函式庫/框架層，避免 SynchronizationContext 引起的死結。應用層可省略（ASP.NET Core 預設 context 安全）。

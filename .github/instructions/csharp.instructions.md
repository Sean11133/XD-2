---
applyTo: "**/*.cs"
---

# C# / .NET 8 編碼標準摘要

> 完整標準：`standards/coding-standard-csharp.md`

## 命名慣例

| 對象             | 規範            | 範例                          |
| ---------------- | --------------- | ----------------------------- |
| 類別、介面、方法 | PascalCase      | `OrderService`, `IRepository` |
| 參數、區域變數   | camelCase       | `orderId`, `customerName`     |
| 私有欄位         | `_camelCase`    | `_orderRepository`            |
| 常數             | PascalCase      | `MaxRetryCount`               |
| 非同步方法       | 加 `Async` 尾綴 | `GetOrderAsync()`             |

## .NET 8 必用語法

```csharp
// ✅ File-Scoped Namespace
namespace Company.Project.Domain;

// ✅ Primary Constructor（DI 注入）
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    public async Task<Order> GetOrderAsync(Guid id, CancellationToken ct = default)
        => await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException(id);
}

// ✅ Pattern Matching（優先於 if-else）
var result = order.Status switch
{
    OrderStatus.Pending   => ProcessPending(order),
    OrderStatus.Confirmed => ProcessConfirmed(order),
    _                     => throw new InvalidOperationException($"Unknown status: {order.Status}")
};

// ✅ Collection Expression（.NET 8）
List<string> tags = ["urgent", "premium"];

// ✅ Nullable Reference Types（必須啟用）
// <Nullable>enable</Nullable> in .csproj
```

## Clean Architecture 分層規則

```
Domain/        ← 無任何框架引用（!using EF Core, MediatR 等）
Application/   ← Use Case / Command / Query，依賴 Domain Interface
Infrastructure/← EF Core, 外部服務實作
Presentation/  ← Controller, 輸入驗證（FluentValidation）
```

## 非同步強制規則

```csharp
// ✅ 所有 I/O 操作必須 async，傳遞 CancellationToken
public async Task<IReadOnlyList<Order>> GetActiveOrdersAsync(CancellationToken ct)
    => await _ctx.Orders.Where(o => o.IsActive).AsNoTracking().ToListAsync(ct);

// ❌ 禁止阻塞
var result = GetOrderAsync().Result;  // 禁止
GetOrderAsync().Wait();               // 禁止
```

## EF Core 規範

```csharp
// ✅ 讀取用 AsNoTracking
var orders = await _ctx.Orders.AsNoTracking().ToListAsync(ct);

// ✅ Include 明確載入，禁止 Lazy Loading
var order = await _ctx.Orders
    .Include(o => o.Items)
    .FirstOrDefaultAsync(o => o.Id == id, ct);
```

## 測試規範（xUnit）

```csharp
// 命名：MethodName_StateUnderTest_ExpectedBehavior
[Fact]
public async Task GetOrder_WhenOrderNotFound_ThrowsNotFoundException()
{
    // Arrange
    var repo = Substitute.For<IOrderRepository>();
    repo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Order?)null);
    var sut = new OrderService(repo, NullLogger<OrderService>.Instance);

    // Act & Assert
    await sut.Invoking(s => s.GetOrderAsync(Guid.NewGuid()))
             .Should().ThrowAsync<NotFoundException>();
}
```

## 禁止事項

- ❌ Service Locator（`IServiceProvider.GetService<T>()`）
- ❌ `new ConcreteRepository()` 在業務邏輯層
- ❌ Domain Layer 引用 `Microsoft.EntityFrameworkCore`
- ❌ 省略 `CancellationToken`
- ❌ `catch (Exception e) {}` 空 catch 或過寬 catch

---

## TFM 檢測規則

> 產生程式碼前，**先確認 `.csproj` 中的 TFM**，再選用對應語法：

| `.csproj` 設定                                          | TFM                | 適用語法層級                                         |
| ------------------------------------------------------- | ------------------ | ---------------------------------------------------- |
| `<TargetFramework>net8.0</TargetFramework>`             | .NET 8             | 本文件全部規則                                       |
| `<TargetFrameworks>net8.0;net48</TargetFrameworks>`     | 雙 TFM             | 以 .NET 4.8 限制為準，用 `#if NET48_OR_GREATER` 分支 |
| `<TargetFrameworkVersion>v4.8</TargetFrameworkVersion>` | .NET Framework 4.8 | 見下方限制表                                         |

---

## .NET Framework 4.8 語法限制

> ⚠️ 若 `.csproj` 含 `<TargetFrameworkVersion>v4.8` 或 TFM 為 `net48`，下列 C# 10+ 語法**禁用**：

| 禁用語法                                       | 替代寫法                                  |
| ---------------------------------------------- | ----------------------------------------- |
| File-scoped namespace `namespace Foo;`         | `namespace Foo { }` 傳統大括號            |
| Primary constructor `class Foo(IBar bar)`      | 傳統建構子 + 欄位                         |
| Collection expression `List<T> x = [...]`      | `new List<T> { ... }`                     |
| `global using`                                 | 每個檔案明確 `using`                      |
| `record` 類型                                  | `class` + 手動 `Equals`/`GetHashCode`     |
| `init` 屬性存取子                              | `set`（或建構子初始化）                   |
| `System.Text.Json`（內建）                     | 使用 `Newtonsoft.Json`                    |
| `ILogger<T>`（`Microsoft.Extensions.Logging`） | `LogManager`（iMX.Core）或 NLog 直接使用  |
| `appsettings.json` DI 注入（`IConfiguration`） | `ConfigManager.Build("appsettings.json")` |

```csharp
// .NET 4.8 正確寫法
namespace Company.Project.Services
{
    using System;
    using System.Collections.Generic;

    public class OrderService
    {
        private readonly IOrderRepository _repo;

        public OrderService(IOrderRepository repo)
        {
            _repo = repo;
        }

        public List<Order> GetOrders(string customerId)
        {
            return _repo.Query<Order>(
                "SELECT * FROM ORDERS WHERE CUST_ID = :p1",
                new { p1 = customerId });
        }
    }
}
```

> 相關框架規範：`frameworks/webapi-framework/contributing.md`（CIMWebApiFramework .NET 4.8）

# C# .NET 8 編碼標準

> **適用範圍**：公司內部所有 C# .NET 8 專案  
> **最後更新**：2025-07

---

## 目錄

1. [命名慣例](#1-命名慣例)
2. [程式碼風格](#2-程式碼風格)
3. [Nullable Reference Types](#3-nullable-reference-types)
4. [非同步程式設計](#4-非同步程式設計)
5. [依賴注入（DI）](#5-依賴注入di)
6. [Entity Framework Core 規範](#6-entity-framework-core-規範)
7. [API 設計規範](#7-api-設計規範)
8. [錯誤處理](#8-錯誤處理)
9. [xUnit 測試規範](#9-xunit-測試規範)
10. [日誌規範](#10-日誌規範)

---

## 1. 命名慣例

### 1.1 通則

| 類型 | 命名風格 | 範例 |
|------|----------|------|
| 類別（Class） | PascalCase | `OrderService` |
| 介面（Interface） | I + PascalCase | `IOrderRepository` |
| 方法（Method） | PascalCase | `GetOrderById` |
| 非同步方法 | PascalCase + Async | `GetOrderByIdAsync` |
| 屬性（Property） | PascalCase | `OrderDate` |
| public 欄位 | PascalCase | `MaxRetryCount` |
| private 欄位 | _camelCase | `_orderRepository` |
| 參數（Parameter） | camelCase | `orderId` |
| 區域變數 | camelCase | `totalAmount` |
| 常數（const） | PascalCase | `DefaultPageSize` |
| 列舉（Enum） | PascalCase（單數） | `OrderStatus` |
| 列舉值 | PascalCase | `OrderStatus.Pending` |
| 泛型型別參數 | T + PascalCase | `TEntity`, `TResult` |
| Namespace | PascalCase | `Company.Project.Orders` |

### 1.2 命名原則

- **使用有意義的名稱**：名稱應清楚描述用途，避免縮寫（除非是業界通用縮寫如 `Id`、`Dto`、`Url`）。
- **布林變數/屬性**：使用 `is`、`has`、`can` 等前綴，例如 `IsActive`、`HasPermission`。
- **集合型別**：使用複數名詞，例如 `Orders`、`CustomerList`。

### 1.3 範例

```csharp
// ✅ 正確命名
public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<OrderService> _logger;
    public const int DefaultPageSize = 20;

    public async Task<Order?> GetOrderByIdAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.FindByIdAsync(orderId, cancellationToken);
        bool isValid = order?.Status != OrderStatus.Cancelled;
        return isValid ? order : null;
    }
}

// ❌ 錯誤命名
public class order_service  // 應使用 PascalCase
{
    private IOrderRepository orderRepository;  // private 欄位應加 _ 前綴
    public const int default_page_size = 20;   // 常數應使用 PascalCase
    public async Task<Order?> GetOrderById(int OrderId) { ... } // 非同步方法缺少 Async 後綴；參數應為 camelCase
}
```

---

## 2. 程式碼風格

### 2.1 使用 File-Scoped Namespace

.NET 8 專案一律使用 file-scoped namespace，減少不必要的縮排層級。

```csharp
// ✅ File-scoped namespace
namespace Company.Project.Orders;

public class OrderService
{
    // ...
}

// ❌ 傳統 namespace（多餘縮排）
namespace Company.Project.Orders
{
    public class OrderService
    {
        // ...
    }
}
```

### 2.2 使用 Primary Constructor

.NET 8 支援 primary constructor，適用於依賴注入等場景，減少樣板程式碼。

```csharp
// ✅ Primary constructor（.NET 8）
public class OrderService(
    IOrderRepository orderRepository,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Order?> GetOrderByIdAsync(int orderId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("取得訂單 {OrderId}", orderId);
        return await orderRepository.FindByIdAsync(orderId, cancellationToken);
    }
}

// ❌ 傳統寫法（冗長）
public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IOrderRepository orderRepository, ILogger<OrderService> logger)
    {
        _orderRepository = orderRepository;
        _logger = logger;
    }
}
```

> **注意**：使用 primary constructor 時，參數直接作為欄位使用，不需再額外宣告 private readonly 欄位。若需要在多處使用且需明確表達 readonly 語義，可自行賦值給 private readonly 欄位。

### 2.3 善用 Pattern Matching

使用 switch expression 取代冗長的 if-else 或傳統 switch。

```csharp
// ✅ Switch expression with pattern matching
public decimal CalculateDiscount(Order order) => order switch
{
    { TotalAmount: > 10000, CustomerLevel: CustomerLevel.Vip } => order.TotalAmount * 0.2m,
    { TotalAmount: > 5000 } => order.TotalAmount * 0.1m,
    { CustomerLevel: CustomerLevel.Vip } => order.TotalAmount * 0.05m,
    _ => 0m
};

// ✅ is pattern
if (result is { IsSuccess: true, Value: var value })
{
    // 使用 value
}
```

### 2.4 使用 Collection Expression

.NET 8 引入的 collection expression 語法，讓集合初始化更簡潔。

```csharp
// ✅ Collection expression（.NET 8）
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob", "Charlie"];
ReadOnlySpan<byte> bytes = [0x01, 0x02, 0x03];

// 使用 spread operator
int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second]; // [1, 2, 3, 4, 5, 6]

// ❌ 傳統寫法
int[] numbers = new int[] { 1, 2, 3, 4, 5 };
var names = new List<string> { "Alice", "Bob", "Charlie" };
```

### 2.5 每個檔案只包含一個類別

- 每個 `.cs` 檔案只放一個頂層類別（top-level class）。
- 檔名與類別名稱一致，例如 `OrderService.cs` 對應 `OrderService` 類別。
- 巢狀類別（nested class）僅在邏輯上屬於外部類別時使用。
- Record、Enum 等簡短型別若與主類別密切相關，可置於同一檔案，但建議獨立檔案。

---

## 3. Nullable Reference Types

### 3.1 專案設定

所有專案 **必須** 在 `.csproj` 中啟用 nullable reference types：

```xml
<PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
</PropertyGroup>
```

### 3.2 使用原則

- **明確表達意圖**：使用 `?` 標記可為 null 的型別，未標記則表示不可為 null。
- **避免 `null!`**：除非有充分理由（如 EF Core navigation property），否則禁止使用 null-forgiving operator。
- **使用 `required` 關鍵字**：確保物件初始化時必填屬性不被遺漏（.NET 8 推薦）。

### 3.3 範例

```csharp
// ✅ 正確使用 nullable
public class CreateOrderRequest
{
    public required string CustomerName { get; init; }
    public required string Email { get; init; }
    public string? Note { get; init; }           // 明確標記可選欄位
    public required List<OrderItem> Items { get; init; }
}

// ✅ 使用 required 確保必填
var request = new CreateOrderRequest
{
    CustomerName = "Alice",
    Email = "alice@example.com",
    Items = [new OrderItem { ProductId = 1, Quantity = 2 }]
};

// ✅ Null 檢查模式
public async Task<Result<OrderDto>> GetOrderAsync(int orderId, CancellationToken cancellationToken)
{
    var order = await _orderRepository.FindByIdAsync(orderId, cancellationToken);

    if (order is null)
    {
        return Result<OrderDto>.NotFound($"訂單 {orderId} 不存在");
    }

    return Result<OrderDto>.Success(order.ToDto());
}

// ❌ 錯誤用法
public class BadExample
{
    public string Name { get; set; } = null!;  // 避免使用 null!，改用 required
    public List<string> Items { get; set; }    // 未初始化，會有 nullable 警告
}
```

---

## 4. 非同步程式設計

### 4.1 基本原則

- **所有 I/O 操作必須使用 async/await**：包括資料庫查詢、HTTP 呼叫、檔案讀寫等。
- **async 一路到底**：從 Controller 到 Repository，每一層都應保持 async。
- **絕對避免 `.Result` 和 `.Wait()`**：會導致 deadlock，尤其在 ASP.NET Core 環境中。

### 4.2 CancellationToken

所有非同步方法都應接受 `CancellationToken` 參數，並往下傳遞：

```csharp
// ✅ 正確：傳遞 CancellationToken
public async Task<List<OrderDto>> GetOrdersAsync(
    int pageIndex,
    int pageSize,
    CancellationToken cancellationToken = default)
{
    var orders = await _dbContext.Orders
        .Skip(pageIndex * pageSize)
        .Take(pageSize)
        .ToListAsync(cancellationToken);

    return orders.Select(o => o.ToDto()).ToList();
}

// Controller 自動綁定 CancellationToken
[HttpGet]
public async Task<IActionResult> GetOrders(
    [FromQuery] int pageIndex = 0,
    [FromQuery] int pageSize = 20,
    CancellationToken cancellationToken = default)
{
    var result = await _orderService.GetOrdersAsync(pageIndex, pageSize, cancellationToken);
    return Ok(result);
}
```

### 4.3 ValueTask vs Task

| 情境 | 使用型別 |
|------|----------|
| 大多數情況 | `Task<T>` |
| 方法經常同步完成（如快取命中） | `ValueTask<T>` |
| 介面定義（公開 API） | `Task<T>`（較安全） |

```csharp
// ✅ ValueTask 適用場景：快取命中時同步返回
public ValueTask<Product?> GetProductByIdAsync(int productId, CancellationToken cancellationToken = default)
{
    if (_cache.TryGetValue(productId, out var product))
    {
        return ValueTask.FromResult<Product?>(product);
    }

    return LoadProductFromDatabaseAsync(productId, cancellationToken);
}
```

### 4.4 常見錯誤

```csharp
// ❌ 使用 .Result 造成 deadlock
var order = _orderService.GetOrderByIdAsync(orderId).Result;

// ❌ 使用 .Wait()
_orderService.GetOrderByIdAsync(orderId).Wait();

// ❌ async void（除了 event handler 外禁止使用）
public async void ProcessOrder(int orderId) { ... }

// ❌ 不必要的 Task.Run（在 ASP.NET Core 中浪費 thread pool）
var result = await Task.Run(() => _service.GetOrdersAsync(cancellationToken));

// ✅ 正確
var order = await _orderService.GetOrderByIdAsync(orderId, cancellationToken);
```

---

## 5. 依賴注入（DI）

### 5.1 基本原則

- **所有服務透過建構子注入**：禁止使用 `new` 直接建立服務實例。
- **依賴抽象而非實作**：注入介面（`IOrderService`），而非具體類別（`OrderService`）。
- **避免 Service Locator 反模式**：不要直接注入 `IServiceProvider` 來手動解析服務。

### 5.2 生命週期選擇

| 生命週期 | 說明 | 適用情境 |
|----------|------|----------|
| **Transient** | 每次注入建立新實例 | 輕量、無狀態的服務 |
| **Scoped** | 每個 HTTP Request 一個實例 | DbContext、UnitOfWork、含 request 狀態的服務 |
| **Singleton** | 應用程式生命週期唯一實例 | 快取、設定、HttpClient Factory |

> ⚠️ **重要**：Singleton 服務不可注入 Scoped 服務（會造成 Captive Dependency 問題）。

### 5.3 註冊範例

```csharp
// ✅ 使用 IServiceCollection 集中註冊
public static class OrderServiceExtensions
{
    public static IServiceCollection AddOrderServices(this IServiceCollection services)
    {
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddTransient<IEmailService, EmailService>();
        services.AddSingleton<ICacheService, RedisCacheService>();

        return services;
    }
}

// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOrderServices();
```

### 5.4 建構子注入範例

```csharp
// ✅ 使用 primary constructor 進行依賴注入
public class OrderService(
    IOrderRepository orderRepository,
    IEmailService emailService,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Result<int>> CreateOrderAsync(
        CreateOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("建立訂單：{CustomerName}", request.CustomerName);

        var order = Order.Create(request);
        await orderRepository.AddAsync(order, cancellationToken);
        await emailService.SendOrderConfirmationAsync(order, cancellationToken);

        return Result<int>.Success(order.Id);
    }
}

// ❌ Service Locator 反模式
public class BadService(IServiceProvider serviceProvider)
{
    public void DoSomething()
    {
        // 不要這樣做！
        var repo = serviceProvider.GetRequiredService<IOrderRepository>();
    }
}
```

---

## 6. Entity Framework Core 規範

### 6.1 DbContext 設定

```csharp
// ✅ DbContext 設定
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 從目前 Assembly 載入所有 IEntityTypeConfiguration
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

// ✅ Entity Configuration 獨立檔案
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(o => o.TotalAmount).HasPrecision(18, 2);
        builder.HasIndex(o => o.OrderDate);
        builder.HasMany(o => o.Items).WithOne(i => i.Order).HasForeignKey(i => i.OrderId);
    }
}
```

### 6.2 Migration 管理

- **每次變更對應一個 Migration**：使用有意義的名稱，例如 `AddOrderStatusColumn`。
- **禁止修改已部署的 Migration**：已上線的 Migration 若有問題，需建立新的 Migration 修正。
- **Migration 指令**：

```bash
# 新增 Migration
dotnet ef migrations add AddOrderStatusColumn

# 更新資料庫
dotnet ef database update

# 產生 SQL Script（用於正式環境部署）
dotnet ef migrations script --idempotent -o migration.sql
```

### 6.3 查詢效能注意事項

```csharp
// ❌ N+1 問題
var orders = await _dbContext.Orders.ToListAsync(cancellationToken);
foreach (var order in orders)
{
    // 每筆訂單都會觸發一次查詢！
    var items = order.Items;
}

// ✅ 使用 Include 預先載入
var orders = await _dbContext.Orders
    .Include(o => o.Items)
    .ToListAsync(cancellationToken);

// ✅ 唯讀查詢使用 AsNoTracking（提升效能）
var orders = await _dbContext.Orders
    .AsNoTracking()
    .Where(o => o.Status == OrderStatus.Active)
    .Select(o => new OrderDto
    {
        Id = o.Id,
        CustomerName = o.CustomerName,
        TotalAmount = o.TotalAmount
    })
    .ToListAsync(cancellationToken);

// ✅ 分頁查詢
var pagedOrders = await _dbContext.Orders
    .AsNoTracking()
    .OrderByDescending(o => o.OrderDate)
    .Skip(pageIndex * pageSize)
    .Take(pageSize)
    .ToListAsync(cancellationToken);
```

### 6.4 Repository Pattern

```csharp
// ✅ 泛型 Repository 介面
public interface IRepository<T> where T : class
{
    Task<T?> FindByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

// ✅ 泛型 Repository 實作
public class Repository<T>(AppDbContext dbContext) : IRepository<T> where T : class
{
    public async Task<T?> FindByIdAsync(int id, CancellationToken cancellationToken = default)
        => await dbContext.Set<T>().FindAsync([id], cancellationToken);

    public async Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default)
        => await dbContext.Set<T>().AsNoTracking().ToListAsync(cancellationToken);

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
        => await dbContext.Set<T>().AddAsync(entity, cancellationToken);

    public async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        dbContext.Set<T>().Update(entity);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        dbContext.Set<T>().Remove(entity);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await dbContext.SaveChangesAsync(cancellationToken);
}
```

---

## 7. API 設計規範

### 7.1 RESTful 命名慣例

| HTTP Method | 路由範例 | 用途 |
|-------------|----------|------|
| GET | `/api/v1/orders` | 取得訂單列表 |
| GET | `/api/v1/orders/{id}` | 取得單一訂單 |
| POST | `/api/v1/orders` | 建立訂單 |
| PUT | `/api/v1/orders/{id}` | 完整更新訂單 |
| PATCH | `/api/v1/orders/{id}` | 部分更新訂單 |
| DELETE | `/api/v1/orders/{id}` | 刪除訂單 |

**命名原則**：

- 使用**複數名詞**：`/orders` 而非 `/order`。
- 使用 **kebab-case**：`/order-items` 而非 `/orderItems`。
- 避免在 URL 中使用動詞：`POST /orders` 而非 `POST /orders/create`。

### 7.2 統一回傳格式

```csharp
// ✅ Result Pattern
public class Result<T>
{
    public bool IsSuccess { get; init; }
    public T? Value { get; init; }
    public string? ErrorMessage { get; init; }
    public int StatusCode { get; init; }

    public static Result<T> Success(T value)
        => new() { IsSuccess = true, Value = value, StatusCode = 200 };

    public static Result<T> Created(T value)
        => new() { IsSuccess = true, Value = value, StatusCode = 201 };

    public static Result<T> NotFound(string message)
        => new() { IsSuccess = false, ErrorMessage = message, StatusCode = 404 };

    public static Result<T> BadRequest(string message)
        => new() { IsSuccess = false, ErrorMessage = message, StatusCode = 400 };
}

// ✅ Controller 使用 Result Pattern
[ApiController]
[Route("api/v1/[controller]")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet("{id:int}")]
    [ProducesResponseType<OrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrder(int id, CancellationToken cancellationToken)
    {
        var result = await orderService.GetOrderByIdAsync(id, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : NotFound(new ProblemDetails
            {
                Title = "訂單不存在",
                Detail = result.ErrorMessage,
                Status = result.StatusCode
            });
    }

    [HttpPost]
    [ProducesResponseType<int>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder(
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var result = await orderService.CreateOrderAsync(request, cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetOrder), new { id = result.Value }, result.Value)
            : BadRequest(new ProblemDetails
            {
                Title = "建立訂單失敗",
                Detail = result.ErrorMessage,
                Status = result.StatusCode
            });
    }
}
```

### 7.3 輸入驗證

```csharp
// ✅ 使用 FluentValidation
public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("客戶名稱為必填")
            .MaximumLength(200).WithMessage("客戶名稱不得超過 200 字元");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email 為必填")
            .EmailAddress().WithMessage("Email 格式不正確");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("至少需要一個訂單項目");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("數量必須大於 0");
        });
    }
}

// 註冊 FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateOrderRequestValidator>();
```

### 7.4 API 版本控制

```csharp
// ✅ 使用 Asp.Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version"));
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Controller 標記版本
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class OrdersController : ControllerBase { }
```

---

## 8. 錯誤處理

### 8.1 基本原則

- **使用 Result Pattern**：業務邏輯的預期錯誤（如「訂單不存在」、「庫存不足」）應透過 Result 物件回傳，而非拋出 Exception。
- **Exception 只用於真正的例外情況**：如資料庫連線中斷、外部服務不可用等無法預期的系統錯誤。
- **設定 Global Exception Handler**：統一處理未預期的 Exception，避免洩漏系統資訊。

### 8.2 Result Pattern 實作

```csharp
// ✅ Result Pattern 用於業務邏輯
public class OrderService(
    IOrderRepository orderRepository,
    IProductRepository productRepository,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Result<int>> CreateOrderAsync(
        CreateOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        // 業務規則驗證 — 回傳 Result，不拋出 Exception
        var product = await productRepository.FindByIdAsync(request.ProductId, cancellationToken);

        if (product is null)
        {
            return Result<int>.NotFound($"商品 {request.ProductId} 不存在");
        }

        if (product.Stock < request.Quantity)
        {
            return Result<int>.BadRequest($"庫存不足，目前庫存：{product.Stock}");
        }

        var order = Order.Create(request);
        await orderRepository.AddAsync(order, cancellationToken);
        await orderRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation("訂單建立成功：{OrderId}", order.Id);
        return Result<int>.Created(order.Id);
    }
}
```

### 8.3 Global Exception Handler

```csharp
// ✅ 使用 IExceptionHandler（.NET 8 推薦方式）
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        logger.LogError(exception, "未預期的錯誤：{Message}", exception.Message);

        var problemDetails = new ProblemDetails
        {
            Title = "伺服器內部錯誤",
            Detail = "處理您的請求時發生錯誤，請稍後再試。",
            Status = StatusCodes.Status500InternalServerError,
            Instance = httpContext.Request.Path
        };

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}

// Program.cs 註冊
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.UseExceptionHandler();
```

### 8.4 禁止事項

```csharp
// ❌ 吞掉 Exception
try
{
    await ProcessOrderAsync(orderId, cancellationToken);
}
catch (Exception)
{
    // 什麼都不做 — 嚴禁！
}

// ❌ 用 Exception 做流程控制
public Order GetOrder(int id)
{
    var order = _repository.FindById(id);
    if (order is null)
        throw new OrderNotFoundException(id); // 應使用 Result Pattern
    return order;
}

// ❌ 洩漏系統資訊
catch (Exception ex)
{
    return StatusCode(500, ex.StackTrace); // 絕對禁止！
}
```

---

## 9. xUnit 測試規範

### 9.1 命名慣例

測試方法命名格式：`MethodName_StateUnderTest_ExpectedBehavior`

```csharp
// ✅ 清楚描述：方法名_測試情境_預期結果
public class OrderServiceTests
{
    [Fact]
    public async Task CreateOrderAsync_WithValidRequest_ReturnsSuccessResult() { }

    [Fact]
    public async Task CreateOrderAsync_WithInsufficientStock_ReturnsBadRequest() { }

    [Fact]
    public async Task GetOrderByIdAsync_WithNonExistentId_ReturnsNotFound() { }
}
```

### 9.2 測試結構：Arrange-Act-Assert

```csharp
[Fact]
public async Task CreateOrderAsync_WithValidRequest_ReturnsSuccessResult()
{
    // Arrange
    var product = new Product { Id = 1, Name = "測試商品", Stock = 100, Price = 500m };
    var request = new CreateOrderRequest
    {
        CustomerName = "Alice",
        Email = "alice@example.com",
        ProductId = 1,
        Quantity = 2,
        Items = [new OrderItem { ProductId = 1, Quantity = 2 }]
    };

    var orderRepository = Substitute.For<IOrderRepository>();
    var productRepository = Substitute.For<IProductRepository>();
    var logger = Substitute.For<ILogger<OrderService>>();

    productRepository.FindByIdAsync(1, Arg.Any<CancellationToken>())
        .Returns(product);

    var sut = new OrderService(orderRepository, productRepository, logger);

    // Act
    var result = await sut.CreateOrderAsync(request, CancellationToken.None);

    // Assert
    result.IsSuccess.Should().BeTrue();
    result.Value.Should().BeGreaterThan(0);
    await orderRepository.Received(1).AddAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>());
}
```

### 9.3 使用 FluentAssertions

```csharp
// ✅ FluentAssertions 提供更清晰的斷言語法
result.IsSuccess.Should().BeTrue();
result.Value.Should().Be(42);
result.ErrorMessage.Should().Contain("庫存不足");

orders.Should().HaveCount(3);
orders.Should().ContainSingle(o => o.Status == OrderStatus.Active);
orders.Should().BeInDescendingOrder(o => o.OrderDate);

action.Should().ThrowAsync<InvalidOperationException>()
    .WithMessage("*無效操作*");
```

### 9.4 Mock 框架

專案統一使用 **NSubstitute** 作為 Mock 框架：

```csharp
// ✅ NSubstitute 範例
var repository = Substitute.For<IOrderRepository>();

// 設定回傳值
repository.FindByIdAsync(1, Arg.Any<CancellationToken>())
    .Returns(new Order { Id = 1, CustomerName = "Alice" });

// 驗證呼叫次數
await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());

// 驗證未被呼叫
await repository.DidNotReceive().DeleteAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>());
```

### 9.5 測試類別組織

測試專案結構應與被測試專案一一對應：

```
src/
  Company.Project.Application/
    Services/
      OrderService.cs
    Validators/
      CreateOrderRequestValidator.cs
tests/
  Company.Project.Application.Tests/
    Services/
      OrderServiceTests.cs
    Validators/
      CreateOrderRequestValidatorTests.cs
```

---

## 10. 日誌規範

### 10.1 使用 ILogger\<T\>

所有日誌一律透過 `ILogger<T>` 注入，禁止直接使用 `Console.WriteLine` 或其他方式輸出。

```csharp
// ✅ 使用 ILogger<T>
public class OrderService(
    IOrderRepository orderRepository,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Result<int>> CreateOrderAsync(
        CreateOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("開始建立訂單，客戶：{CustomerName}", request.CustomerName);

        var order = Order.Create(request);
        await orderRepository.AddAsync(order, cancellationToken);
        await orderRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation("訂單建立完成，訂單編號：{OrderId}", order.Id);
        return Result<int>.Created(order.Id);
    }
}
```

### 10.2 結構化日誌（Serilog 相容）

使用 **Message Template** 格式，讓日誌可被結構化查詢：

```csharp
// ✅ 結構化日誌（使用具名參數）
logger.LogInformation("訂單 {OrderId} 建立成功，金額 {TotalAmount}", order.Id, order.TotalAmount);
logger.LogWarning("商品 {ProductId} 庫存不足，剩餘 {Stock}", product.Id, product.Stock);
logger.LogError(exception, "處理訂單 {OrderId} 時發生錯誤", orderId);

// ❌ 字串插值（無法結構化查詢）
logger.LogInformation($"訂單 {order.Id} 建立成功，金額 {order.TotalAmount}");

// ❌ 字串串接
logger.LogInformation("訂單 " + order.Id + " 建立成功");
```

### 10.3 日誌等級使用指引

| 等級 | 使用情境 | 範例 |
|------|----------|------|
| **Trace** | 極細粒度的除錯資訊，通常只在開發環境啟用 | 方法進入/離開、變數值 |
| **Debug** | 開發除錯用的詳細資訊 | SQL 查詢內容、快取命中/未命中 |
| **Information** | 正常業務流程的關鍵節點 | 訂單建立成功、使用者登入 |
| **Warning** | 非預期但可自動恢復的情況 | 重試機制觸發、快取過期、庫存偏低 |
| **Error** | 操作失敗，需要關注但服務仍可運行 | API 呼叫失敗、資料庫查詢逾時 |
| **Critical** | 系統嚴重錯誤，服務可能無法運行 | 資料庫連線中斷、設定檔缺失 |

### 10.4 避免記錄敏感資訊

```csharp
// ❌ 嚴禁記錄敏感資訊
logger.LogInformation("使用者 {Email} 登入，密碼：{Password}", email, password);
logger.LogInformation("信用卡號：{CardNumber}", cardNumber);
logger.LogDebug("Token：{AccessToken}", accessToken);

// ✅ 遮蔽敏感資訊
logger.LogInformation("使用者 {Email} 登入成功", email);
logger.LogInformation("信用卡末四碼：{CardLast4}", cardNumber[^4..]);
logger.LogDebug("Token 已核發，過期時間：{ExpiresAt}", token.ExpiresAt);
```

### 10.5 Serilog 設定範例

```csharp
// Program.cs — Serilog 設定
builder.Host.UseSerilog((context, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentName()
        .WriteTo.Console(outputTemplate:
            "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
        .WriteTo.Seq("http://localhost:5341");
});

// appsettings.json
{
    "Serilog": {
        "MinimumLevel": {
            "Default": "Information",
            "Override": {
                "Microsoft.AspNetCore": "Warning",
                "Microsoft.EntityFrameworkCore": "Warning",
                "System": "Warning"
            }
        }
    }
}
```

---

> **附註**：本標準會隨著 .NET 版本更新與團隊實踐經驗持續修訂。如有建議或疑問，請聯繫技術架構團隊。

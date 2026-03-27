# 設計模式標準（GoF 23 種）

本文件涵蓋 Gang of Four 全部 23 種設計模式，提供每種模式的意圖說明、適用場景、C# 與 Python 程式碼範例，以及與 SOLID 原則的對應關係。

> **與 SOLID 的關係**：設計模式是 SOLID 原則的**具體實作手段**。每個模式都標注對應的 SOLID 原則。
>
> **與 Clean Architecture 的關係**：模式多用於 Application / Infrastructure 層的銜接，Domain 層應保持模式的「意圖」而非「實作」。

---

## 一、Creational Patterns（創建型模式）

> 目標：將物件的**建立邏輯**與**使用邏輯**分離，提高靈活性。

### 1. Singleton（單例）

**意圖**：確保一個類別只有一個實例，並提供全域存取點。

**適用場景**：設定管理、日誌服務、連線池。注意：過度使用 Singleton 是 Global State 的根源，應限制在無狀態服務。

**SOLID**：若 Singleton 持有可變狀態，違反 SRP；應優先用 DI 框架的 `AddSingleton()` 取代手工 Singleton。

**反模式 ⚠️**：不要將含業務邏輯的服務設計為 Singleton（難以測試、難以替換）。

```csharp
// ✅ C# — 優先使用 DI 框架
// services.AddSingleton<IConfigService, ConfigService>();

// 若必須手工實作，使用 Lazy<T> 確保執行緒安全
public sealed class ConfigService
{
    private static readonly Lazy<ConfigService> _instance =
        new(() => new ConfigService());

    public static ConfigService Instance => _instance.Value;

    private ConfigService() { }

    public string GetValue(string key) => Environment.GetEnvironmentVariable(key) ?? string.Empty;
}
```

```python
# ✅ Python — 使用 metaclass 或 module-level instance
from threading import Lock

class _SingletonMeta(type):
    _instances: dict = {}
    _lock: Lock = Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class ConfigService(metaclass=_SingletonMeta):
    def get_value(self, key: str) -> str | None:
        return __import__('os').environ.get(key)
```

---

### 2. Factory Method（工廠方法）

**意圖**：定義建立物件的介面，由子類別決定實例化哪個類別。

**適用場景**：需要根據條件建立不同的物件，但不希望呼叫端知道具體型別。

**SOLID**：實作 OCP（新增型別只需新增子類別）、DIP（依賴抽象而非具體）。

```csharp
// ✅ C# — 通知服務工廠
public abstract class NotificationFactory
{
    // Factory Method
    protected abstract INotification CreateNotification();

    public void Send(string message)
    {
        var notification = CreateNotification();
        notification.Send(message);
    }
}

public class EmailNotificationFactory : NotificationFactory
{
    protected override INotification CreateNotification() => new EmailNotification();
}

public class SmsNotificationFactory : NotificationFactory
{
    protected override INotification CreateNotification() => new SmsNotification();
}
```

```python
# ✅ Python — 支付方式工廠
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    @abstractmethod
    def create_gateway(self) -> PaymentGateway:
        ...

    def process(self, amount: Decimal) -> Result:
        gateway = self.create_gateway()
        return gateway.charge(amount)

class StripeProcessor(PaymentProcessor):
    def create_gateway(self) -> PaymentGateway:
        return StripeGateway(api_key=self._key)
```

---

### 3. Abstract Factory（抽象工廠）

**意圖**：提供建立一組相關物件的介面，而不指定具體實作類別。

**適用場景**：需要確保一組物件「風格一致」（如 UI 元件、資料庫套件）。

**SOLID**：強化 OCP 和 DIP；切換整個產品族只需替換工廠，不修改消費端。

```csharp
// ✅ C# — 資料庫抽象工廠（支援切換 PostgreSQL / SQL Server）
public interface IDbFactory
{
    IDbConnection CreateConnection();
    IDbCommand CreateCommand();
    IDbTransaction CreateTransaction();
}

public class PostgreSqlFactory : IDbFactory
{
    public IDbConnection CreateConnection() => new NpgsqlConnection(_connStr);
    public IDbCommand CreateCommand() => new NpgsqlCommand();
    public IDbTransaction CreateTransaction() => /* ... */;
}
```

```python
# ✅ Python — 通知套件工廠
from abc import ABC, abstractmethod

class NotificationFactory(ABC):
    @abstractmethod
    def create_sender(self) -> MessageSender: ...
    @abstractmethod
    def create_template(self) -> MessageTemplate: ...

class EmailFactory(NotificationFactory):
    def create_sender(self) -> MessageSender:
        return SmtpSender(host=self._smtp_host)
    def create_template(self) -> MessageTemplate:
        return HtmlTemplate()
```

---

### 4. Builder（建造者）

**意圖**：分步驟建構複雜物件，允許用同樣的建構過程建立不同的表示。

**適用場景**：物件有多個可選參數、建構過程多步驟（如 SQL 查詢建構、報表生成）。

**SOLID**：SRP（建構邏輯與使用邏輯分離）。

```csharp
// ✅ C# — 查詢建造者
public class OrderQueryBuilder
{
    private readonly List<Expression<Func<Order, bool>>> _filters = [];
    private string? _orderBy;
    private int _page = 1;
    private int _pageSize = 20;

    public OrderQueryBuilder WithCustomer(Guid customerId)
    {
        _filters.Add(o => o.CustomerId == customerId);
        return this;
    }

    public OrderQueryBuilder WithStatus(OrderStatus status)
    {
        _filters.Add(o => o.Status == status);
        return this;
    }

    public OrderQueryBuilder OrderByDate(bool descending = true)
    {
        _orderBy = descending ? "CreatedAt DESC" : "CreatedAt ASC";
        return this;
    }

    public OrderQuery Build() => new(_filters, _orderBy, _page, _pageSize);
}

// 使用
var query = new OrderQueryBuilder()
    .WithCustomer(customerId)
    .WithStatus(OrderStatus.Pending)
    .OrderByDate()
    .Build();
```

```python
# ✅ Python — 報表建造者
@dataclass
class ReportBuilder:
    _title: str = ""
    _sections: list[Section] = field(default_factory=list)
    _include_charts: bool = False

    def with_title(self, title: str) -> "ReportBuilder":
        self._title = title
        return self

    def add_section(self, section: Section) -> "ReportBuilder":
        self._sections.append(section)
        return self

    def with_charts(self) -> "ReportBuilder":
        self._include_charts = True
        return self

    def build(self) -> Report:
        if not self._title:
            raise ValueError("Report title is required")
        return Report(self._title, self._sections, self._include_charts)
```

---

### 5. Prototype（原型）

**意圖**：透過複製現有物件來建立新物件，而非重新初始化。

**適用場景**：物件建立成本高（如大量設定的物件）、需要建立多個相似物件。

```csharp
// ✅ C# — 使用 record 的非破壞性複製
public record OrderTemplate(
    Guid CustomerId,
    string Currency,
    PaymentMethod DefaultPayment)
{
    public Order CreateOrder(Guid orderId) =>
        new(orderId, CustomerId, Currency, DefaultPayment);
}

// Prototype 複製
var premiumTemplate = new OrderTemplate(customerId, "USD", PaymentMethod.CreditCard);
var giftTemplate = premiumTemplate with { Currency = "TWD" }; // 淺複製
```

```python
# ✅ Python — 使用 copy 模組
import copy
from dataclasses import dataclass

@dataclass
class ReportConfig:
    title: str
    columns: list[str]
    filters: dict[str, str]

    def clone(self) -> "ReportConfig":
        return copy.deepcopy(self)

base_config = ReportConfig("Monthly Report", ["date", "amount"], {"status": "active"})
custom_config = base_config.clone()
custom_config.title = "Weekly Report"
```

---

## 二、Structural Patterns（結構型模式）

> 目標：組合類別或物件，形成更大的**結構**，同時保持靈活性。

### 6. Adapter（轉接器）

**意圖**：將一個類別的介面轉換為另一個介面，使不相容的類別可以協作。

**適用場景**：整合第三方或遺留系統、Clean Architecture Infrastructure 層包裝外部 SDK。

**SOLID**：OCP（不修改現有類別）、DIP（提供統一抽象）。

> **ai-loop 應用**：`ai-loop/adapters/` 目錄的 `FrameworkAdapter` 即為 Adapter + Strategy 複合模式。

```csharp
// ✅ C# — 包裝第三方支付 SDK
public interface IPaymentGateway // 我們自定義的介面（Domain 層）
{
    Task<PaymentResult> ChargeAsync(Guid orderId, decimal amount, CancellationToken ct);
}

public class StripePaymentAdapter(StripeClient stripeClient) : IPaymentGateway
{
    // 將 Stripe 的 API 轉換為我們的介面
    public async Task<PaymentResult> ChargeAsync(Guid orderId, decimal amount, CancellationToken ct)
    {
        var options = new ChargeCreateOptions { Amount = (long)(amount * 100), Currency = "usd" };
        var charge = await stripeClient.V1.Charges.CreateAsync(options, cancellationToken: ct);
        return charge.Status == "succeeded"
            ? PaymentResult.Success(charge.Id)
            : PaymentResult.Failed(charge.FailureMessage);
    }
}
```

```python
# ✅ Python — 包裝 Legacy 資料庫存取
class IUserRepository(Protocol):  # 我們的 Domain 介面
    def find_by_id(self, user_id: int) -> User | None: ...

class LegacyDbUserAdapter:  # Adapter 實作
    def __init__(self, legacy_db: LegacyDatabase) -> None:
        self._db = legacy_db

    def find_by_id(self, user_id: int) -> User | None:
        row = self._db.query_one("SELECT * FROM users WHERE id = ?", (user_id,))
        return User(id=row["id"], name=row["name"]) if row else None
```

---

### 7. Bridge（橋接）

**意圖**：將抽象與實作分離，使二者可以獨立變化。

**適用場景**：多個維度的變化（如「形狀」和「顏色」），避免 m×n 個子類別的爆炸。

**SOLID**：OCP、DIP（兩個維度各自組合）。

```csharp
// ✅ C# — 報表 × 格式，兩個維度獨立擴展
public interface IReportRenderer { string Render(ReportData data); }
public class HtmlRenderer : IReportRenderer { /* ... */ }
public class PdfRenderer : IReportRenderer { /* ... */ }

public abstract class Report(IReportRenderer renderer)
{
    protected abstract ReportData GenerateData();
    public string Export() => renderer.Render(GenerateData());
}
public class SalesReport(IReportRenderer renderer) : Report(renderer) { /* ... */ }
public class InventoryReport(IReportRenderer renderer) : Report(renderer) { /* ... */ }
```

---

### 8. Composite（組合）

**意圖**：將物件組合成樹狀結構，使客戶端以一致的方式處理單個物件和組合物件。

**適用場景**：樹狀/層次結構（組織架構、選單、檔案系統、UI 元件樹）。

**SOLID**：OCP（新增節點不修改遍歷邏輯）、LSP（葉節點與容器節點可互換）。

> **ai-loop 應用**：`adapter-registry.md` 使用 Composite 同時支援多框架（Multi-Framework Composite）。

```csharp
// ✅ C# — 組織架構，計算部門總薪資
public abstract class OrgUnit(string name)
{
    public string Name { get; } = name;
    public abstract decimal GetTotalSalary();
}

public class Employee(string name, decimal salary) : OrgUnit(name)
{
    public override decimal GetTotalSalary() => salary; // 葉節點
}

public class Department(string name) : OrgUnit(name)
{
    private readonly List<OrgUnit> _members = [];
    public void Add(OrgUnit unit) => _members.Add(unit);
    public override decimal GetTotalSalary() => _members.Sum(m => m.GetTotalSalary()); // 容器節點
}
```

```python
# ✅ Python — 選單系統
from abc import ABC, abstractmethod

class MenuComponent(ABC):
    @abstractmethod
    def render(self, indent: int = 0) -> str: ...

class MenuItem(MenuComponent):
    def __init__(self, label: str, url: str) -> None:
        self.label, self.url = label, url
    def render(self, indent: int = 0) -> str:
        return " " * indent + f"[{self.label}]({self.url})"

class Menu(MenuComponent):
    def __init__(self, label: str) -> None:
        self.label = label
        self._children: list[MenuComponent] = []
    def add(self, component: MenuComponent) -> None:
        self._children.append(component)
    def render(self, indent: int = 0) -> str:
        lines = [" " * indent + self.label]
        lines.extend(child.render(indent + 2) for child in self._children)
        return "\n".join(lines)
```

---

### 9. Decorator（裝飾器）

**意圖**：動態地為物件新增職責，提供比繼承更靈活的功能擴展方式。

**適用場景**：需要在不修改類別的情況下加入功能（快取、日誌、驗證、重試）。

**SOLID**：OCP（不修改現有類別，開放擴展）、SRP（每個 Decorator 單一職責）。

```csharp
// ✅ C# — 為 Repository 加入快取（不修改原始 Repository）
public class CachedOrderRepository(
    IOrderRepository inner,
    IMemoryCache cache,
    ILogger<CachedOrderRepository> logger) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var cacheKey = $"order:{id}";
        if (cache.TryGetValue(cacheKey, out Order? cached))
        {
            logger.LogDebug("Cache hit for order {OrderId}", id);
            return cached;
        }
        var order = await inner.GetByIdAsync(id, ct);
        cache.Set(cacheKey, order, TimeSpan.FromMinutes(5));
        return order;
    }

    // 其他方法委派給 inner...
    public Task SaveAsync(Order order, CancellationToken ct) => inner.SaveAsync(order, ct);
}
```

```python
# ✅ Python — 重試裝飾器（使用 functools.wraps）
import functools
import time
from typing import Callable, TypeVar

T = TypeVar("T")

def with_retry(max_attempts: int = 3, delay: float = 1.0):
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except TransientError as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay * (attempt + 1))
            raise RuntimeError("Unreachable")
        return wrapper
    return decorator

@with_retry(max_attempts=3)
def call_external_api(payload: dict) -> dict:
    ...
```

---

### 10. Facade（門面）

**意圖**：為子系統提供統一的簡單介面，隱藏系統複雜性。

**適用場景**：整合多個子系統、提供簡化的 API（如訂單流程整合：庫存+支付+物流）。

**SOLID**：SRP（把複雜協作封裝進一個地方）、DIP（外部只依賴 Facade 介面）。

```csharp
// ✅ C# — 訂單處理 Facade（整合庫存+支付+物流+通知）
public class OrderFacade(
    IInventoryService inventory,
    IPaymentService payment,
    IShippingService shipping,
    INotificationService notification)
{
    public async Task<OrderResult> PlaceOrderAsync(PlaceOrderCommand cmd, CancellationToken ct)
    {
        await inventory.ReserveAsync(cmd.Items, ct);
        var paymentRef = await payment.ChargeAsync(cmd.Amount, cmd.PaymentInfo, ct);
        var trackingNum = await shipping.CreateShipmentAsync(cmd.Address, ct);
        await notification.SendOrderConfirmationAsync(cmd.CustomerEmail, trackingNum, ct);
        return new OrderResult(paymentRef, trackingNum);
    }
}
```

---

### 11. Flyweight（享元）

**意圖**：使用共享來有效支援大量細粒度物件，減少記憶體使用。

**適用場景**：大量相似物件（字型渲染、遊戲中的粒子、棋盤格子）。

**SOLID**：SRP（將共享狀態與獨態分離）。

```csharp
// ✅ C# — 產品類別快取（大量訂單項目共享相同類別資料）
public class ProductTypeFlyweight
{
    private readonly Dictionary<string, ProductType> _cache = [];

    public ProductType GetOrCreate(string typeCode, Func<ProductType> factory)
    {
        if (!_cache.TryGetValue(typeCode, out var type))
            _cache[typeCode] = type = factory();
        return type;
    }
}
```

---

### 12. Proxy（代理）

**意圖**：為物件提供代理，控制對其的存取（延遲初始化、存取控制、日誌記錄）。

**適用場景**：虛擬代理（延遲載入）、保護代理（存取控制）、遠端代理（RPC）。

**SOLID**：OCP（不修改原始物件加入功能）、SRP（存取控制邏輯獨立）。

```csharp
// ✅ C# — 存取控制代理
public class SecureOrderRepository(
    IOrderRepository inner,
    ICurrentUser currentUser) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var order = await inner.GetByIdAsync(id, ct);
        if (order is null) return null;
        if (order.CustomerId != currentUser.Id && !currentUser.IsAdmin)
            throw new UnauthorizedException($"User {currentUser.Id} cannot access order {id}");
        return order;
    }
}
```

---

## 三、Behavioral Patterns（行為型模式）

> 目標：定義物件間的**溝通方式**，分配職責。

### 13. Chain of Responsibility（職責鍊）

**意圖**：將請求沿著處理者鍊傳遞，每個處理者決定是否處理或傳給下一個。

**適用場景**：驗證管線、中介軟體链（HTTP Pipeline）、審批流程。

**SOLID**：OCP（新增處理者不修改鍊）、SRP（每個處理者單一職責）。

> **ai-loop 應用**：`adapters/*/detector.md` 使用 Chain of Responsibility 依優先序偵測框架。

```csharp
// ✅ C# — 訂單驗證管線
public abstract class OrderValidator
{
    private OrderValidator? _next;

    public OrderValidator SetNext(OrderValidator next)
    {
        _next = next;
        return next;
    }

    public virtual ValidationResult Validate(Order order)
        => _next?.Validate(order) ?? ValidationResult.Success();
}

public class StockValidator(IInventoryService inventory) : OrderValidator
{
    public override ValidationResult Validate(Order order)
    {
        if (!inventory.HasStock(order.Items))
            return ValidationResult.Fail("庫存不足");
        return base.Validate(order);
    }
}

public class CreditValidator(ICreditService credit) : OrderValidator
{
    public override ValidationResult Validate(Order order)
    {
        if (!credit.HasCredit(order.CustomerId, order.TotalAmount))
            return ValidationResult.Fail("信用額度不足");
        return base.Validate(order);
    }
}

// 組裝
var chain = new StockValidator(inventory);
chain.SetNext(new CreditValidator(credit))
     .SetNext(new AddressValidator());
```

---

### 14. Command（命令）

**意圖**：將請求封裝為物件，支援佇列、撤銷/重做、日誌記錄。

**適用場景**：CQRS（Command/Query 分離）、操作日誌、Undo/Redo。

**SOLID**：SRP（每個 Command 封裝一個操作）、OCP（新增操作不修改執行器）。

```csharp
// ✅ C# — CQRS Command（MediatR 風格）
public record PlaceOrderCommand(Guid CustomerId, IReadOnlyList<OrderItem> Items) : ICommand<Guid>;

public class PlaceOrderHandler(
    IOrderRepository repo,
    IInventoryService inventory) : ICommandHandler<PlaceOrderCommand, Guid>
{
    public async Task<Guid> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        await inventory.ReserveAsync(cmd.Items, ct);
        var order = Order.Create(cmd.CustomerId, cmd.Items);
        await repo.SaveAsync(order, ct);
        return order.Id;
    }
}
```

```python
# ✅ Python — 命令模式 with undo
from abc import ABC, abstractmethod

class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...
    @abstractmethod
    def undo(self) -> None: ...

class MoveItemCommand(Command):
    def __init__(self, item: Item, from_pos: Position, to_pos: Position) -> None:
        self._item, self._from, self._to = item, from_pos, to_pos

    def execute(self) -> None:
        self._item.move_to(self._to)

    def undo(self) -> None:
        self._item.move_to(self._from)
```

---

### 15. Iterator（迭代器）

**意圖**：提供遍歷集合的統一方式，不暴露集合的內部結構。

**適用場景**：自訂集合遍歷（分頁查詢、樹狀遍歷、串流處理）。

```csharp
// ✅ C# — 分頁迭代器（IAsyncEnumerable）
public async IAsyncEnumerable<Order> GetAllOrdersAsync(
    [EnumeratorCancellation] CancellationToken ct)
{
    var page = 1;
    while (true)
    {
        var orders = await _repo.GetPageAsync(page++, pageSize: 100, ct);
        if (!orders.Any()) yield break;
        foreach (var order in orders) yield return order;
    }
}

// 使用
await foreach (var order in service.GetAllOrdersAsync(ct))
    await processor.ProcessAsync(order);
```

---

### 16. Mediator（中介者）

**意圖**：定義一個物件封裝一組物件的互動方式，使物件不必直接引用彼此。

**適用場景**：減少多個元件間的直接耦合（CQRS Mediator、事件總線）。

**SOLID**：SRP（互動邏輯集中）、DIP（元件只依賴 Mediator 抽象）。

```csharp
// ✅ C# — 使用 MediatR 作為 In-Process Mediator
// Application 層只依賴 IMediator，不直接依賴其他 Handler
public class OrderController(IMediator mediator)
{
    [HttpPost]
    public async Task<IActionResult> PlaceOrder(PlaceOrderRequest req, CancellationToken ct)
    {
        var orderId = await mediator.Send(new PlaceOrderCommand(req.CustomerId, req.Items), ct);
        return Ok(new { OrderId = orderId });
    }
}
```

---

### 17. Memento（備忘錄）

**意圖**：在不暴露內部結構的情況下，捕獲並恢復物件的狀態。

**適用場景**：Undo/Redo 功能、狀態快照、交易回滾。

```csharp
// ✅ C# — 訂單草稿狀態快照
public class OrderDraft
{
    public Guid Id { get; private set; }
    private List<OrderItem> _items = [];

    public OrderDraftMemento SaveState() => new(Id, [.._items]);

    public void RestoreState(OrderDraftMemento memento)
    {
        Id = memento.Id;
        _items = [..memento.Items];
    }
}

public record OrderDraftMemento(Guid Id, IReadOnlyList<OrderItem> Items);
```

---

### 18. Observer（觀察者）

**意圖**：定義物件間一對多的依賴關係，當一個物件狀態改變時，所有依賴者都會自動通知。

**適用場景**：Domain Event + Event Handler、UI 狀態更新、訂閱/發布。

**SOLID**：OCP（新增 Observer 不修改 Subject）、DIP（依賴事件介面而非具體 Handler）。

> **與 Domain Event 的關係**：`standards/ddd-guidelines.md` 中的 Domain Event 是 Observer 在 DDD 中的應用。

```csharp
// ✅ C# — Domain Event（Observer 在 DDD 中的實作）
public class Order : AggregateRoot
{
    private readonly List<IDomainEvent> _events = [];

    public void Confirm()
    {
        Status = OrderStatus.Confirmed;
        _events.Add(new OrderConfirmedEvent(Id, CustomerId, TotalAmount));
    }

    public IReadOnlyList<IDomainEvent> DomainEvents => _events.AsReadOnly();
}

// Event Handler（Observer）
public class OrderConfirmedHandler(IEmailService email) : IDomainEventHandler<OrderConfirmedEvent>
{
    public Task Handle(OrderConfirmedEvent @event, CancellationToken ct)
        => email.SendConfirmationAsync(@event.CustomerId, @event.OrderId, ct);
}
```

```python
# ✅ Python — 簡單事件分發
from typing import Callable

class EventBus:
    def __init__(self) -> None:
        self._handlers: dict[type, list[Callable]] = {}

    def subscribe(self, event_type: type, handler: Callable) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    def publish(self, event: object) -> None:
        for handler in self._handlers.get(type(event), []):
            handler(event)
```

---

### 19. State（狀態）

**意圖**：允許物件在狀態改變時改變其行為，似乎改變了其類別。

**適用場景**：有明確狀態機的物件（訂單狀態、工作流程、連線狀態）。

**SOLID**：OCP（新增狀態不修改 Context）、SRP（每個狀態的行為封裝）。

```csharp
// ✅ C# — 訂單狀態機
public abstract class OrderState
{
    public abstract void Confirm(Order order);
    public abstract void Cancel(Order order);
}

public class PendingState : OrderState
{
    public override void Confirm(Order order) => order.SetState(new ConfirmedState());
    public override void Cancel(Order order) => order.SetState(new CancelledState());
}

public class ConfirmedState : OrderState
{
    public override void Confirm(Order order) => throw new InvalidOperationException("已確認");
    public override void Cancel(Order order) => order.SetState(new CancelledState());
}
```

---

### 20. Strategy（策略）

**意圖**：定義一系列演算法，將其封裝為獨立類別，使其可相互替換。

**適用場景**：需要在執行期切換演算法（排序策略、折扣規則、支付方式）。

**SOLID**：直接實作 OCP（透過策略取代 if-else 型別判斷）、DIP（依賴介面）。

> **ai-loop 應用**：`ai-loop/adapters/adapter-interface.md` 定義 `FrameworkAdapter` 即是 Strategy Pattern，每個框架 Adapter 是一個具體 Strategy。

```csharp
// ✅ C# — 折扣策略（取代大型 switch）
public interface IDiscountStrategy
{
    decimal Calculate(Order order);
}

public class MemberDiscountStrategy : IDiscountStrategy
{
    public decimal Calculate(Order order) => order.TotalAmount * 0.9m;
}

public class SeasonalDiscountStrategy : IDiscountStrategy
{
    public decimal Calculate(Order order) => order.TotalAmount - 100;
}

public class OrderPricing(IDiscountStrategy discount)
{
    public decimal GetFinalPrice(Order order) => discount.Calculate(order);
}
```

```python
# ✅ Python — 匯出格式策略
from abc import ABC, abstractmethod

class ExportStrategy(ABC):
    @abstractmethod
    def export(self, data: ReportData) -> bytes: ...

class CsvExporter(ExportStrategy):
    def export(self, data: ReportData) -> bytes:
        return "\n".join(",".join(row) for row in data.rows).encode()

class ExcelExporter(ExportStrategy):
    def export(self, data: ReportData) -> bytes:
        # 使用 openpyxl...
        ...

class ReportExporter:
    def __init__(self, strategy: ExportStrategy) -> None:
        self._strategy = strategy

    def export(self, data: ReportData) -> bytes:
        return self._strategy.export(data)
```

---

### 21. Template Method（模板方法）

**意圖**：在父類別中定義演算法骨架，將部分步驟延遲到子類別實作。

**適用場景**：多個類別有相同的處理流程但部分步驟不同（報表生成、資料匯入）。

**SOLID**：OCP（骨架不變，步驟可擴展）、LSP（子類別替換不改變整體行為）。

> **ai-loop 應用**：`ai-loop/core/loop-orchestrator.md` 使用 Template Method 固定 Dev→Test→Review 骨架。

```csharp
// ✅ C# — 資料匯入骨架
public abstract class DataImporter<T>
{
    // 模板方法：固定流程
    public async Task<ImportResult> ImportAsync(Stream source, CancellationToken ct)
    {
        var rawData = await ReadAsync(source, ct);   // Step 1
        var items = await ParseAsync(rawData, ct);    // Step 2
        await ValidateAsync(items, ct);               // Step 3（可選覆寫）
        return await SaveAsync(items, ct);            // Step 4
    }

    protected abstract Task<byte[]> ReadAsync(Stream source, CancellationToken ct);
    protected abstract Task<IReadOnlyList<T>> ParseAsync(byte[] data, CancellationToken ct);

    protected virtual Task ValidateAsync(IReadOnlyList<T> items, CancellationToken ct)
        => Task.CompletedTask; // 預設不驗證，子類別可覆寫

    protected abstract Task<ImportResult> SaveAsync(IReadOnlyList<T> items, CancellationToken ct);
}

public class CsvOrderImporter(IOrderRepository repo) : DataImporter<Order>
{
    protected override async Task<byte[]> ReadAsync(Stream s, CancellationToken ct) => /* ... */;
    protected override async Task<IReadOnlyList<Order>> ParseAsync(byte[] d, CancellationToken ct) => /* ... */;
    protected override async Task<ImportResult> SaveAsync(IReadOnlyList<Order> items, CancellationToken ct)
    {
        foreach (var order in items) await repo.SaveAsync(order, ct);
        return new ImportResult(items.Count);
    }
}
```

---

### 22. Visitor（訪問者）

**意圖**：在不改變物件結構的情況下，新增作用於其元素的操作。

**適用場景**：對複雜物件結構執行多種不同操作（報表生成、序列化、驗證）。

**SOLID**：OCP（新增操作只需新增 Visitor，不修改物件結構）。

```csharp
// ✅ C# — 費用計算 Visitor
public interface IExpenseVisitor
{
    decimal Visit(HotelExpense expense);
    decimal Visit(FlightExpense expense);
    decimal Visit(MealExpense expense);
}

public class TaxCalculatorVisitor : IExpenseVisitor
{
    public decimal Visit(HotelExpense e) => e.Amount * 0.1m;   // 旅館稅 10%
    public decimal Visit(FlightExpense e) => e.Amount * 0.05m; // 航空稅 5%
    public decimal Visit(MealExpense e) => 0;                   // 餐費免稅
}
```

---

### 23. Interpreter（直譯器）

**意圖**：為語言定義文法表示，並提供直譯器來解讀句子。

**適用場景**：DSL（領域特定語言）、規則引擎、查詢語言解析。

**反模式 ⚠️**：對複雜文法，Interpreter 效能差且難以維護，此時應使用正式解析器（ANTLR 等）。

```csharp
// ✅ C# — 簡單規則 DSL
public interface IExpression
{
    bool Interpret(RuleContext context);
}

public class AndExpression(IExpression left, IExpression right) : IExpression
{
    public bool Interpret(RuleContext context) =>
        left.Interpret(context) && right.Interpret(context);
}

public class IsVipExpression : IExpression
{
    public bool Interpret(RuleContext context) => context.Customer.IsVip;
}

public class HasMinOrderExpression(decimal minAmount) : IExpression
{
    public bool Interpret(RuleContext context) => context.OrderAmount >= minAmount;
}

// 使用：VIP 且訂單 >= 1000 才能使用折扣
var rule = new AndExpression(new IsVipExpression(), new HasMinOrderExpression(1000));
var canUseDiscount = rule.Interpret(new RuleContext(customer, orderAmount));
```

---

## 模式速查表

### 按 SOLID 對應

| 原則 | 相關模式                                                              |
| ---- | --------------------------------------------------------------------- |
| SRP  | Facade, Command, Iterator, Decorator                                  |
| OCP  | Strategy, Observer, Chain of Responsibility, Visitor, Template Method |
| LSP  | Composite, Bridge, Template Method                                    |
| ISP  | Adapter, Proxy                                                        |
| DIP  | Factory Method, Abstract Factory, Observer, Mediator, Adapter         |

### 按 Clean Architecture 層次

| 層次           | 常用模式                                                                           |
| -------------- | ---------------------------------------------------------------------------------- |
| Domain         | Builder（Entity 建構）, Observer（Domain Event）, State（狀態機）, Memento         |
| Application    | Command（CQRS）, Mediator, Template Method（Use Case 流程）, Iterator              |
| Infrastructure | Adapter（外部整合）, Decorator（快取/重試）, Proxy（存取控制）, Flyweight          |
| Cross-cutting  | Factory Method / Abstract Factory（物件建立）, Chain of Responsibility（驗證管線） |

### ai-loop 使用的模式

| 模式                    | 位置                                    | 說明                         |
| ----------------------- | --------------------------------------- | ---------------------------- |
| Template Method         | `ai-loop/core/loop-orchestrator.md`     | 固定 Dev→Test→Review 骨架    |
| Strategy                | `ai-loop/adapters/adapter-interface.md` | 可替換的框架行為             |
| Chain of Responsibility | `ai-loop/adapters/*/detector.md`        | 依優先序偵測框架             |
| Factory Method          | `ai-loop/adapters/adapter-registry.md`  | 從 framework_id 建立 Adapter |
| Composite               | `ai-loop/adapters/adapter-registry.md`  | 多框架同時支援               |

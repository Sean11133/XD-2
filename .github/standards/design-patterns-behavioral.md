# 設計模式 — Behavioral Patterns（行為型模式）

> 目標：定義物件間的**溝通方式**，分配職責。
>
> ← 返回索引：`standards/design-patterns.md`

---

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

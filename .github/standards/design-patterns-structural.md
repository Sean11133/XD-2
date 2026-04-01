# 設計模式 — Structural Patterns（結構型模式）

> 目標：組合類別或物件，形成更大的**結構**，同時保持靈活性。
>
> ← 返回索引：`standards/design-patterns.md`

---

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

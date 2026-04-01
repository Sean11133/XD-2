# 設計模式 — Creational Patterns（創建型模式）

> 目標：將物件的**建立邏輯**與**使用邏輯**分離，提高靈活性。
>
> ← 返回索引：`standards/design-patterns.md`

---

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

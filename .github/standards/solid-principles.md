# SOLID 原則標準

本文件定義公司內部遵循 SOLID 原則的編碼標準，適用於 C# 與 Python 專案。所有 Code Review 應依據本文件進行檢查。

---

## 1. 單一職責原則 (SRP - Single Responsibility Principle)

### 定義與說明

> 一個類別應該只有一個改變的理由（A class should have only one reason to change）。

每個類別或模組應專注於單一職責。當一個類別承擔了多項不相關的責任時，任何一項需求的變更都可能影響其他功能，導致耦合度上升、測試困難、維護成本增加。

**判斷方式**：嘗試用一句話描述類別的職責，若需要使用「而且」來連接，通常表示違反了 SRP。

### C# 範例

#### ✅ 正面範例

```csharp
// 各類別各司其職
public class OrderValidator
{
    public bool Validate(Order order)
    {
        return order.Items.Any() && order.TotalAmount > 0;
    }
}

public class OrderRepository
{
    private readonly DbContext _context;

    public OrderRepository(DbContext context) => _context = context;

    public void Save(Order order) => _context.Orders.Add(order);
}

public class OrderNotifier
{
    private readonly IEmailService _emailService;

    public OrderNotifier(IEmailService emailService) => _emailService = emailService;

    public void NotifyCustomer(Order order)
    {
        _emailService.Send(order.CustomerEmail, "訂單已成立", $"訂單 {order.Id} 已成功建立。");
    }
}
```

#### ❌ 反面範例

```csharp
// 一個類別同時處理驗證、儲存、通知 — 三個不相關的職責
public class OrderService
{
    private readonly DbContext _context;

    public void ProcessOrder(Order order)
    {
        // 職責 1：驗證
        if (!order.Items.Any() || order.TotalAmount <= 0)
            throw new InvalidOperationException("Invalid order");

        // 職責 2：持久化
        _context.Orders.Add(order);
        _context.SaveChanges();

        // 職責 3：通知
        var smtp = new SmtpClient("mail.company.com");
        smtp.Send(new MailMessage("noreply@company.com", order.CustomerEmail, "訂單通知", "..."));
    }
}
```

**為什麼違反**：`OrderService` 同時負責驗證邏輯、資料持久化、郵件發送三項職責。當驗證規則變更、資料庫切換或通知方式改變時，都需要修改同一個類別，造成高耦合與高變更風險。

### Python 範例

#### ✅ 正面範例

```python
class ReportDataCollector:
    def collect(self, query: str) -> list[dict]:
        # 負責從資料庫收集報表資料
        ...

class ReportFormatter:
    def to_pdf(self, data: list[dict]) -> bytes:
        # 負責將資料格式化為 PDF
        ...

class ReportMailer:
    def send(self, recipient: str, attachment: bytes) -> None:
        # 負責寄送報表
        ...
```

#### ❌ 反面範例

```python
class ReportManager:
    def generate_and_send_report(self, query: str, recipient: str) -> None:
        # 職責 1：查詢資料
        data = db.execute(query).fetchall()

        # 職責 2：產生 PDF
        pdf = self._build_pdf(data)

        # 職責 3：寄送郵件
        smtplib.SMTP("mail.company.com").send(recipient, pdf)
```

**為什麼違反**：`ReportManager` 混合了資料查詢、格式化輸出、郵件發送三項職責，任何一項變更都會影響整個類別。

### CR 檢查判斷準則

- [ ] 類別名稱是否能用一句話（不含「而且」）描述其職責？
- [ ] 類別是否只有一個改變的理由？
- [ ] 方法是否過長（超過 30 行）且包含多段不相關的邏輯？
- [ ] 類別的 constructor 是否注入了過多不相關的依賴（超過 3-4 個）？

---

## 2. 開放封閉原則 (OCP - Open/Closed Principle)

### 定義與說明

> 軟體實體應對擴展開放、對修改封閉（Software entities should be open for extension, but closed for modification）。

當需求變更時，應透過新增程式碼（如新類別、新實作）來擴展行為，而非修改現有已測試通過的程式碼。常見的實現方式包括 Strategy Pattern、Template Method Pattern 及多型。

### C# 範例（使用 Strategy Pattern）

#### ✅ 正面範例

```csharp
public interface IDiscountStrategy
{
    decimal Calculate(Order order);
}

public class RegularDiscount : IDiscountStrategy
{
    public decimal Calculate(Order order) => order.TotalAmount * 0.05m;
}

public class VipDiscount : IDiscountStrategy
{
    public decimal Calculate(Order order) => order.TotalAmount * 0.15m;
}

// 新增折扣類型時，只需新增新的 IDiscountStrategy 實作，無需修改此類別
public class OrderPriceCalculator
{
    private readonly IDiscountStrategy _discountStrategy;

    public OrderPriceCalculator(IDiscountStrategy discountStrategy)
        => _discountStrategy = discountStrategy;

    public decimal CalculateFinalPrice(Order order)
        => order.TotalAmount - _discountStrategy.Calculate(order);
}
```

#### ❌ 反面範例

```csharp
public class OrderPriceCalculator
{
    // 每次新增客戶類型就必須修改此方法，違反 OCP
    public decimal CalculateFinalPrice(Order order, string customerType)
    {
        decimal discount = customerType switch
        {
            "Regular" => order.TotalAmount * 0.05m,
            "VIP" => order.TotalAmount * 0.15m,
            "SVIP" => order.TotalAmount * 0.20m,
            _ => 0m
        };
        return order.TotalAmount - discount;
    }
}
```

**為什麼違反**：每新增一種客戶類型，都必須修改 `CalculateFinalPrice` 方法，增加回歸測試負擔並提高引入 bug 的風險。

### Python 範例

#### ✅ 正面範例

```python
from abc import ABC, abstractmethod

class NotificationChannel(ABC):
    @abstractmethod
    def send(self, message: str) -> None: ...

class EmailChannel(NotificationChannel):
    def send(self, message: str) -> None:
        # 透過 Email 發送
        ...

class SmsChannel(NotificationChannel):
    def send(self, message: str) -> None:
        # 透過 SMS 發送
        ...

class Notifier:
    def __init__(self, channel: NotificationChannel) -> None:
        self._channel = channel

    def notify(self, message: str) -> None:
        self._channel.send(message)
```

#### ❌ 反面範例

```python
class Notifier:
    def notify(self, message: str, channel: str) -> None:
        if channel == "email":
            self._send_email(message)
        elif channel == "sms":
            self._send_sms(message)
        # 每次新增通知管道就需要加 elif，修改現有程式碼
```

**為什麼違反**：新增通知管道（如 Push Notification）需直接修改 `notify` 方法，而非透過擴展來新增行為。

### CR 檢查判斷準則

- [ ] 是否存在 `if/elif/switch` 鏈根據類型執行不同行為？能否用多型取代？
- [ ] 新增業務規則或變體時，是否需要修改現有類別？
- [ ] 是否有使用 Strategy、Factory 或 Plugin 模式來支援擴展？

---

## 3. 里氏替換原則 (LSP - Liskov Substitution Principle)

### 定義與說明

> 子類別應能替換父類別而不改變程式的正確性（Subtypes must be substitutable for their base types）。

任何使用父類別的地方，替換為子類別後，程式行為應保持一致且正確。子類別不應：

- 強化前置條件（要求更嚴格的輸入）
- 弱化後置條件（提供更寬鬆的輸出）
- 拋出父類別未定義的例外

### C# 範例

#### ✅ 正面範例

```csharp
public abstract class Shape
{
    public abstract double Area();
}

public class Rectangle : Shape
{
    public double Width { get; }
    public double Height { get; }

    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }

    public override double Area() => Width * Height;
}

public class Square : Shape
{
    public double Side { get; }

    public Square(double side) => Side = side;

    public override double Area() => Side * Side;
}
```

#### ❌ 反面範例

```csharp
public class Rectangle
{
    public virtual double Width { get; set; }
    public virtual double Height { get; set; }
    public double Area() => Width * Height;
}

public class Square : Rectangle
{
    // 覆寫 setter 使 Width 和 Height 始終相同
    public override double Width
    {
        get => base.Width;
        set { base.Width = value; base.Height = value; }
    }

    public override double Height
    {
        get => base.Height;
        set { base.Width = value; base.Height = value; }
    }
}

// 以下程式碼在傳入 Square 時結果不符合預期
void Resize(Rectangle rect)
{
    rect.Width = 10;
    rect.Height = 5;
    Debug.Assert(rect.Area() == 50); // Square 會得到 25，斷言失敗
}
```

**為什麼違反**：`Square` 覆寫了 `Width`/`Height` 的 setter 行為，導致 `Resize` 方法在接收 `Square` 時產生非預期結果。子類別改變了父類別的契約（設定 Width 不應影響 Height），違反 LSP。

### Python 範例

#### ✅ 正面範例

```python
from abc import ABC, abstractmethod

class FileReader(ABC):
    @abstractmethod
    def read(self, path: str) -> str:
        """讀取檔案內容，path 不存在時拋出 FileNotFoundError。"""
        ...

class LocalFileReader(FileReader):
    def read(self, path: str) -> str:
        with open(path) as f:
            return f.read()

class S3FileReader(FileReader):
    def read(self, path: str) -> str:
        obj = s3_client.get_object(Bucket=BUCKET, Key=path)
        return obj["Body"].read().decode()
```

#### ❌ 反面範例

```python
class Bird:
    def fly(self) -> str:
        return "flying"

class Penguin(Bird):
    def fly(self) -> str:
        raise NotImplementedError("企鵝不會飛")

def let_bird_fly(bird: Bird) -> str:
    return bird.fly()  # 傳入 Penguin 時會爆炸
```

**為什麼違反**：`Bird` 的契約保證 `fly()` 回傳字串，但 `Penguin` 卻拋出例外，無法替代 `Bird` 使用。應重新設計繼承體系（如拆分 `FlyableBird` 和 `NonFlyableBird`）。

### CR 檢查判斷準則

- [ ] 子類別是否覆寫了父類別方法並改變了原有行為契約？
- [ ] 子類別是否拋出了父類別未定義的例外？
- [ ] 子類別是否在覆寫方法中使用 `throw new NotImplementedException()` 或 `raise NotImplementedError`？
- [ ] 使用父類別型別的地方，替換為子類別後是否仍能正常運作？

---

## 4. 介面隔離原則 (ISP - Interface Segregation Principle)

### 定義與說明

> 客戶端不應被迫依賴它不使用的方法（Clients should not be forced to depend on methods they do not use）。

應將大介面拆分為多個小而專注的介面，讓實作者只需實作真正需要的方法。肥大的介面會導致實作類別包含空實作或拋出 `NotImplementedException`，這同時也違反了 LSP。

### C# 範例

#### ✅ 正面範例

```csharp
public interface IReadableRepository<T>
{
    T GetById(int id);
    IEnumerable<T> GetAll();
}

public interface IWritableRepository<T>
{
    void Add(T entity);
    void Update(T entity);
}

public interface IDeletableRepository<T>
{
    void Delete(int id);
}

// 唯讀場景只需實作 IReadableRepository
public class ReportRepository : IReadableRepository<Report>
{
    public Report GetById(int id) => ...;
    public IEnumerable<Report> GetAll() => ...;
}

// 完整 CRUD 場景實作所有需要的介面
public class ProductRepository : IReadableRepository<Product>, IWritableRepository<Product>, IDeletableRepository<Product>
{
    public Product GetById(int id) => ...;
    public IEnumerable<Product> GetAll() => ...;
    public void Add(Product entity) => ...;
    public void Update(Product entity) => ...;
    public void Delete(int id) => ...;
}
```

#### ❌ 反面範例

```csharp
public interface IRepository<T>
{
    T GetById(int id);
    IEnumerable<T> GetAll();
    void Add(T entity);
    void Update(T entity);
    void Delete(int id);
}

// 唯讀的 ReportRepository 被迫實作不需要的寫入方法
public class ReportRepository : IRepository<Report>
{
    public Report GetById(int id) => ...;
    public IEnumerable<Report> GetAll() => ...;

    public void Add(Report entity) => throw new NotSupportedException();
    public void Update(Report entity) => throw new NotSupportedException();
    public void Delete(int id) => throw new NotSupportedException();
}
```

**為什麼違反**：`ReportRepository` 被迫實作 `Add`、`Update`、`Delete` 等它永遠不會使用的方法，並以 `NotSupportedException` 填充，這是典型的 ISP 違規信號。

### Python 範例（使用 ABC / Protocol）

#### ✅ 正面範例

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Readable(Protocol):
    def read(self) -> str: ...

@runtime_checkable
class Writable(Protocol):
    def write(self, data: str) -> None: ...

class ReadOnlyConfig:
    """只需滿足 Readable Protocol"""
    def read(self) -> str:
        return load_from_file("config.yaml")

class DatabaseStore:
    """同時滿足 Readable 和 Writable Protocol"""
    def read(self) -> str:
        return db.query("SELECT value FROM store")

    def write(self, data: str) -> None:
        db.execute("INSERT INTO store (value) VALUES (?)", (data,))
```

#### ❌ 反面範例

```python
from abc import ABC, abstractmethod

class Storage(ABC):
    @abstractmethod
    def read(self) -> str: ...

    @abstractmethod
    def write(self, data: str) -> None: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

class ReadOnlyConfig(Storage):
    def read(self) -> str:
        return load_from_file("config.yaml")

    def write(self, data: str) -> None:
        raise NotImplementedError  # 永遠不會用到

    def delete(self, key: str) -> None:
        raise NotImplementedError  # 永遠不會用到
```

**為什麼違反**：`ReadOnlyConfig` 被迫實作 `write` 和 `delete`，只能拋出 `NotImplementedError`。應將 `Storage` 拆分為 `Readable`、`Writable`、`Deletable` 等更小的介面。

### CR 檢查判斷準則

- [ ] 介面是否包含超過 5 個方法？是否可進一步拆分？
- [ ] 實作類別是否有方法以 `throw new NotSupportedException()` 或 `raise NotImplementedError` 填充？
- [ ] 客戶端是否只使用了介面中的部分方法？

---

## 5. 依賴反轉原則 (DIP - Dependency Inversion Principle)

### 定義與說明

> 高層模組不應依賴低層模組，兩者都應依賴抽象（High-level modules should not depend on low-level modules. Both should depend on abstractions）。

具體來說：

- 高層業務邏輯不應直接 `new` 低層實作（如資料庫、外部 API）。
- 應透過介面或抽象類別定義契約，由外部注入具體實作。
- 在 .NET 中通常搭配 DI Container 實現；在 Python 中透過 constructor injection 實現。

### C# 範例（含 .NET DI 容器）

#### ✅ 正面範例

```csharp
// 定義抽象
public interface IPaymentGateway
{
    PaymentResult Process(PaymentRequest request);
}

// 低層實作
public class StripePaymentGateway : IPaymentGateway
{
    public PaymentResult Process(PaymentRequest request)
    {
        // 呼叫 Stripe API
        ...
    }
}

// 高層模組依賴抽象
public class CheckoutService
{
    private readonly IPaymentGateway _paymentGateway;

    public CheckoutService(IPaymentGateway paymentGateway)
        => _paymentGateway = paymentGateway;

    public void Checkout(Order order)
    {
        var result = _paymentGateway.Process(new PaymentRequest(order));
        if (!result.Success)
            throw new PaymentFailedException(result.ErrorMessage);
    }
}

// .NET DI 容器註冊
builder.Services.AddScoped<IPaymentGateway, StripePaymentGateway>();
builder.Services.AddScoped<CheckoutService>();
```

#### ❌ 反面範例

```csharp
public class CheckoutService
{
    // 直接依賴具體實作，高度耦合
    private readonly StripePaymentGateway _gateway = new StripePaymentGateway();

    public void Checkout(Order order)
    {
        var result = _gateway.Process(new PaymentRequest(order));
        if (!result.Success)
            throw new PaymentFailedException(result.ErrorMessage);
    }
}
```

**為什麼違反**：`CheckoutService` 直接 `new StripePaymentGateway()`，導致：

1. 無法在測試中替換為 Mock 物件。
2. 切換支付提供商（如改用 ECPay）需修改高層業務邏輯。
3. 高層模組與低層模組緊密耦合。

### Python 範例

#### ✅ 正面範例

```python
from abc import ABC, abstractmethod

class CachePort(ABC):
    @abstractmethod
    def get(self, key: str) -> str | None: ...

    @abstractmethod
    def set(self, key: str, value: str, ttl: int = 300) -> None: ...

class RedisCacheAdapter(CachePort):
    def __init__(self, client):
        self._client = client

    def get(self, key: str) -> str | None:
        return self._client.get(key)

    def set(self, key: str, value: str, ttl: int = 300) -> None:
        self._client.setex(key, ttl, value)

class ProductService:
    def __init__(self, cache: CachePort) -> None:
        self._cache = cache

    def get_product(self, product_id: str) -> dict:
        cached = self._cache.get(f"product:{product_id}")
        if cached:
            return json.loads(cached)
        product = self._fetch_from_db(product_id)
        self._cache.set(f"product:{product_id}", json.dumps(product))
        return product
```

#### ❌ 反面範例

```python
import redis

class ProductService:
    def __init__(self) -> None:
        # 直接耦合 Redis 實作
        self._cache = redis.Redis(host="localhost", port=6379)

    def get_product(self, product_id: str) -> dict:
        cached = self._cache.get(f"product:{product_id}")
        if cached:
            return json.loads(cached)
        product = self._fetch_from_db(product_id)
        self._cache.setex(f"product:{product_id}", 300, json.dumps(product))
        return product
```

**為什麼違反**：`ProductService` 直接建立 `redis.Redis` 實例，導致：

1. 無法在測試中替換為 in-memory cache。
2. 切換快取方案（如 Memcached）需修改業務邏輯。
3. 違反高層模組不應依賴低層模組的原則。

### CR 檢查判斷準則

- [ ] 高層模組是否在內部直接 `new` 低層具體類別？
- [ ] 是否透過 constructor injection 注入依賴？
- [ ] .NET 專案是否已在 DI Container 中註冊對應的介面與實作？
- [ ] 是否能在不修改高層模組的情況下替換低層實作（如用 Mock 測試）？

---

## 6. CR 審查總結檢查清單

以下為 Code Review 時應逐項確認的 SOLID 原則檢查清單：

| #   | 原則 | 檢查項目                                                               | 嚴重程度 |
| --- | ---- | ---------------------------------------------------------------------- | -------- |
| 1   | SRP  | 類別是否只有單一職責？能否用一句話描述？                               | 🔴 高    |
| 2   | SRP  | 類別的 constructor 依賴是否超過 3-4 個不相關的服務？                   | 🟡 中    |
| 3   | SRP  | 單一方法是否超過 30 行且包含多段不相關邏輯？                           | 🟡 中    |
| 4   | OCP  | 是否存在 `if/switch` 類型判斷鏈可用多型取代？                          | 🔴 高    |
| 5   | OCP  | 新增業務規則時，是否只需新增類別而不修改現有程式碼？                   | 🔴 高    |
| 6   | LSP  | 子類別是否改變了父類別方法的行為契約？                                 | 🔴 高    |
| 7   | LSP  | 是否有覆寫方法內含 `NotImplementedException` / `NotImplementedError`？ | 🔴 高    |
| 8   | LSP  | 使用基底型別的地方，替換為衍生型別後是否仍能正確運作？                 | 🔴 高    |
| 9   | ISP  | 介面是否過於肥大（超過 5 個方法）？                                    | 🟡 中    |
| 10  | ISP  | 實作類別是否有空實作或拋出 `NotSupportedException` 的方法？            | 🔴 高    |
| 11  | ISP  | 客戶端是否只使用了介面中的部分方法？                                   | 🟡 中    |
| 12  | DIP  | 高層模組是否在內部直接 `new` 具體低層類別？                            | 🔴 高    |
| 13  | DIP  | 依賴是否透過 constructor injection 注入？                              | 🔴 高    |
| 14  | DIP  | .NET 專案的介面與實作是否已註冊至 DI Container？                       | 🟡 中    |
| 15  | DIP  | 是否能在不修改原始碼的情況下替換依賴實作（如 Mock 測試）？             | 🔴 高    |

### 嚴重程度說明

- 🔴 **高**：必須修正，不得通過 Code Review。
- 🟡 **中**：建議修正，可視情況於後續迭代改善，但須建立追蹤 Issue。

---

## 7. SOLID × Design Pattern 對應速查

> 每個 SOLID 原則都有對應的設計模式作為「實作手段」。若程式碼違反某原則，以下是建議的修復路徑。
> 詳細模式說明請參見 `standards/design-patterns.md`。

| 違反的原則 | 常見症狀                                         | 建議應用的 Design Pattern                                                                         |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **SRP**    | 類別超過 200 行；Constructor 注入 5+ 個依賴      | **Facade**（整合多步驟流程）、**Command**（封裝單一操作）                                         |
| **OCP**    | `if-else/switch` 依型別分支超過 3 個             | **Strategy**（替換演算法）、**Template Method**（固定骨架+可替換步驟）、**Decorator**（疊加功能） |
| **OCP**    | 新增功能需修改多個現有類別                       | **Observer**（事件通知）、**Chain of Responsibility**（可延伸的管線）                             |
| **LSP**    | 子類別 `override` 後拋出 `NotSupportedException` | **Composite**（統一處理葉/容器）、重新設計繼承體系                                                |
| **ISP**    | 介面有 7+ 個方法；實作類別有空 `override`        | **Adapter**（縮窄介面）、重構拆分介面                                                             |
| **DIP**    | Application 層直接 `new` Infrastructure 類別     | **Factory Method**（建立邏輯封裝）、**Abstract Factory**（套件族切換）、**Proxy**（控制存取）     |

### 常見重構範例

#### OCP 違反 → Strategy Pattern

```
// 問題：類型判斷 switch
decimal CalcDiscount(string type) => type switch {
    "VIP" => ...,
    "Regular" => ...,
    "Student" => ...    // 每次新增都要改這裡
};

// 修復：Strategy Pattern
interface IDiscountStrategy { decimal Calculate(Order o); }
class VipDiscount : IDiscountStrategy { ... }
class StudentDiscount : IDiscountStrategy { ... } // 只需新增類別
```

#### DIP 違反 → Factory Method + DI

```csharp
// 問題：高層直接 new 低層
public class OrderService { private Repo = new SqlOrderRepository(); }

// 修復：注入抽象
public class OrderService(IOrderRepository repo) { ... }
// DI: services.AddScoped<IOrderRepository, SqlOrderRepository>();
```

#### SRP 違反 → Facade 封裝

```csharp
// 問題：一個 Service 同時處理庫存、支付、通知
public class OrderService { void PlaceOrder() { inventory.Reserve(); payment.Charge(); email.Send(); } }

// 修復：Facade + 各 Service 只有單一職責
public class OrderFacade(IInventoryService i, IPaymentService p, INotificationService n) { ... }
```

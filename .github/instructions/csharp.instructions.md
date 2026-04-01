---
applyTo: "**/*.cs"
---

# C# / .NET 8 編碼標準（快速參考）

> 📌 **完整標準**：`standards/coding-standard-csharp.md`（命名慣例、.NET 8 語法、Clean Architecture、非同步、EF Core、測試等全部規範）
>
> 本檔僅列出**自動載入時的提醒重點**與完整標準中未涵蓋的 **TFM 檢測規則**。

## 關鍵提醒

- **File-Scoped Namespace**：強制使用 `namespace Foo;`（.NET 8）
- **Primary Constructor**：DI 注入優先使用 Primary Constructor
- **Pattern Matching**：優先於 if-else 判斷
- **Collection Expression**：`List<string> tags = ["a", "b"];`（.NET 8）
- **Nullable Reference Types**：必須啟用 `<Nullable>enable</Nullable>`
- **非同步**：所有 I/O 操作必須 `async`，傳遞 `CancellationToken`
- **EF Core**：讀取用 `AsNoTracking()`，禁止 Lazy Loading
- **禁止**：Service Locator、`new ConcreteClass()` 在業務層、Domain 引用 EF Core、`.Result` / `.Wait()`

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

---
applyTo: "**/*.cs"
---

# CIMWebApiFramework 應用開發者指引 (.NET Framework 4.8)

> **使用對象**：以 NuGet 安裝 `CIMWebApiFramework` 的應用開發者（非框架原始碼貢獻者）。
> **目標框架**：.NET Framework 4.8（`TargetFrameworkVersion = v4.8`）

---

## ⛔ .NET Framework 4.8 語法限制

產生程式碼前，**必須先確認** `.csproj` 中的 `<TargetFrameworkVersion>v4.8`。
下列語法在 .NET Framework 4.8 **不可用**，AI 嚴禁產生：

| 禁用語法                                              | 替代方案                   |
| ----------------------------------------------------- | -------------------------- |
| `namespace Foo;`（File-scoped）                       | `namespace Foo { ... }`    |
| `public class Foo(IService s)`（Primary constructor） | 傳統建構子 + 屬性          |
| `List<T> x = ["a", "b"]`（Collection expression）     | `new List<T> { "a", "b" }` |
| `string x = """..."""`（Raw string literal）          | `@"..."` verbatim string   |
| `global using`                                        | 標準 `using` 陳述式        |
| `record` / `record struct`                            | 傳統 `class` / `struct`    |
| `init` setter                                         | 傳統 `set`                 |
| `is not null` pattern                                 | `!= null`                  |
| `ILogger<T>` (Microsoft.Extensions.Logging)           | `LogHandler`（框架提供）   |
| `System.Text.Json`                                    | `Newtonsoft.Json`          |
| `appsettings.json`                                    | `Web.config`               |

---

## 框架核心模式

### Controller 繼承

```csharp
// ✅ 正確：繼承框架基底 Controller
using CIMWebApiFramework.Controllers;

public class MyController : CIMApiControllerBase
{
    [HttpPost]
    public MyResult DoAction(MyInput input)
    {
        var dbo = base.DBO.GetConnection("MES");
        base.Log.Debug("開始處理：" + input.Id);
        return Process(dbo, input);
    }
}
```

### 資料庫存取（DBO）

```csharp
using CIMWebApiFramework.Utility;

// 取得 DB 連線（name 對應 Web.config connectionStrings）
var dbo = base.DBO.GetConnection("MES");

// Dapper 查詢
var result = dbo.Query<MyModel>(sql, new { p1 = value }).ToList();
var count  = dbo.Execute(insertSql, model);
```

### 日誌記錄（LogHandler）

```csharp
using CIMWebApiFramework.Utility;

base.Log.Debug("除錯訊息");
base.Log.Info("一般資訊");
base.Log.Warn("警告訊息");
base.Log.Error("錯誤訊息：" + ex.Message);
```

### 安全驗證（UsingSecurity）

```csharp
using CIMWebApiFramework.Filter;
using CIMWebApiFramework.Security;

// 方式 1：Attribute 宣告
[UsingSecurity(new string[] { "My-Resource-Name" })]
[HttpPost]
public MyResult SecuredAction(MyInput input) { ... }

// 方式 2：方法內動態驗證
base.Security.HasPermit("My-Resource-Name");
```

### Alarm 通知

```csharp
using CIMWebApiFramework.Security;

// 廣播型
var alarm = new AlarmMessage
{
    AlarmServer = "CTPilot",  // CTProd / KHProd / CTPilot / KHPilot
    EventSource = "MY_SYSTEM",
    EventName   = "MY_EVENT",
    Fields      = new Dictionary<string, string>
    {
        { "ALARM_TEXT", "通知內容" },
        { "USER", "HYCHENG5" }
    }
};
AlarmResponse r1 = base.Security.SendAlarm(alarm);

// 指定收件者型
var directAlarm = new AlarmMessageDirectly
{
    AlarmServer      = "CTPilot",
    EventSource      = "MY_SYSTEM",
    EventName        = "MY_EVENT_DIRECT",
    Subject          = "信件標題",
    lstMailTo_Member = new List<string> { "HYCHENG5" },
    MailBody         = "信件內文"
};
AlarmResponse r2 = base.Security.SendAlarmToReceivers(directAlarm);
```

### Custom Exception（400/500 層別）

```csharp
using CIMWebApiFramework.Exception;
using System.Net;

// 業務邏輯錯誤 → HTTP 400
var ex = new CustomException();
ex.HttpStatusCode = HttpStatusCode.BadRequest;
ex.ErrorCheckResult.errorCode  = "ERR_001";
ex.ErrorCheckResult.content    = "資料驗證失敗";
ex.ErrorCheckResult.stackTrace = originalEx.Message;
throw ex;
```

### 交易管理（UsingTransactionScope）

```csharp
using CIMWebApiFramework.Filter;

// 成功自動 Commit，Exception 自動 Rollback
[UsingTransactionScope]
[HttpPost]
public void SaveData(MyInput input)
{
    base.DBO.GetConnection("MES").Execute(insertSql, input);
}
```

### 跨 API 呼叫（SendRequestWithTemplate）

```csharp
using CIMWebApiFramework.Extension;

// 呼叫另一個同框架系統，底層自動帶 Header/Token
JObject body = new JObject();
body["ids"] = new JArray(input.Ids.ToArray());

MyResult result = new HttpClient()
    .SendRequestWithTemplate<MyResult>(
        "http://other-system/api/endpoint",
        "OtherAppName",
        body);
```

---

## Web.config 配置速查

```xml
<configuration>
  <!-- 資料庫連線 -->
  <connectionStrings>
    <add name="MES" connectionString="Data source=..." providerName="System.Data.OracleClient" />
  </connectionStrings>

  <!-- 框架設定 -->
  <configSections>
    <section name="CIMWebApiFrameworkSettings"
             type="System.Configuration.NameValueSectionHandler" />
  </configSections>
  <CIMWebApiFrameworkSettings>
    <add key="ServiceCenterURL" value="http://10.18.20.56:8050/sc/api/7.5/" />
    <add key="BypassUsingSecurityCallName" value="SYS_ACCOUNT,TEST_ACCOUNT" />
  </CIMWebApiFrameworkSettings>

  <!-- Elastic APM（v7.9.1+） -->
  <appSettings>
    <add key="ElasticApm:Enabled"     value="true" />
    <add key="ElasticApm:ServiceName" value="My_System" />
    <add key="ElasticApm:Environment" value="Pilot" />
    <add key="ElasticApm:ServerUrl"   value="http://10.18.20.56:8205" />
  </appSettings>
  <system.webServer>
    <modules>
      <add name="ElasticApmModule"
           type="Elastic.Apm.AspNetFullFramework.ElasticApmModule, Elastic.Apm.AspNetFullFramework" />
    </modules>
  </system.webServer>
</configuration>
```

---

## 防幻覺聲明

- CIMWebApiFramework 為企業內部框架，網路上無相關公開資料。
- 不確定的 Handler 或方法，請先查閱 IntelliSense 或 `contributing.md`，**禁止猜測**。
- 通用 C# 規範請參閱 `instructions/csharp.instructions.md`（由 wec-coding-standards 提供）。

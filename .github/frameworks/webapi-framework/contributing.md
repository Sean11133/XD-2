# CIMWebApiFramework 框架開發規範 (Contributing Guide)

> **本文件為框架貢獻者與應用開發者的 Single Source of Truth (SSoT)。**
>
> - **應用開發者**：直接查閱各章節的 API 使用模式。
> - **框架貢獻者**：同時參閱 §8 框架設計原則。
>
> 通用架構與設計原則（SOLID、Clean Architecture、Design Patterns）請參閱
> `standards/` 目錄下的對應文件（由 wec-coding-standards 提供）。
>
> ⚠️ 本框架目標框架為 **.NET Framework 4.8**，所有範例程式碼均以此版本為準。

---

## 目錄

1. [框架架構概覽](#1-框架架構概覽)
2. [DBO — 資料庫存取](#2-dbo--資料庫存取)
3. [LogHandler — 日誌記錄](#3-loghandler--日誌記錄)
4. [Security — 安全驗證與 Alarm](#4-security--安全驗證與-alarm)
5. [Exception — 例外處理](#5-exception--例外處理)
6. [Extension — 跨 API 呼叫](#6-extension--跨-api-呼叫)
7. [Filter — 宣告式 Attribute](#7-filter--宣告式-attribute)
8. [框架設計原則（貢獻者）](#8-框架設計原則貢獻者)
9. [設定檔規範](#9-設定檔規範)
10. [AI 助手指引](#10-ai-助手指引)

---

## 1. 框架架構概覽

### 1.1 核心目錄結構

```
CIMWebApiFramework/
├── APM/          — Elastic APM 整合
├── Controllers/  — 基底 Controller（應用端繼承此處）
├── Exception/    — CustomException 定義
├── Extension/    — HttpClient 擴充方法
├── Filter/       — [UsingSecurity]、[UsingTransactionScope] Attributes
├── Register/     — 框架初始化註冊
├── Security/     — SecurityHandler、TokenHandler
├── Template/     — Controller 範本
└── Utility/      — DBOHandler、LogHandler
```

### 1.2 命名空間對照表

| Namespace                        | 功能                                 |
| -------------------------------- | ------------------------------------ |
| `CIMWebApiFramework.Utility`     | DBOHandler、LogHandler               |
| `CIMWebApiFramework.Security`    | SecurityHandler、Alarm               |
| `CIMWebApiFramework.Extension`   | SendRequestWithTemplate              |
| `CIMWebApiFramework.Filter`      | UsingSecurity、UsingTransactionScope |
| `CIMWebApiFramework.Exception`   | CustomException                      |
| `CIMWebApiFramework.Controllers` | 基底 Controller                      |

### 1.3 Controller 繼承模式

應用端的所有 Controller **必須繼承框架 ControllerBase**，才能透過 `base.XXX` 使用各 Handler：

```csharp
using CIMWebApiFramework.Controllers;

public class MyController : CIMApiControllerBase
{
    [HttpPost]
    public MyResult DoSomething(MyInput input)
    {
        // 可直接使用 base.DBO, base.Log, base.Security
        var dbo = base.DBO.GetConnection("MES");
        base.Log.Debug("Start processing");
        return new MyResult();
    }
}
```

> **兩種呼叫方式等效**：
>
> - `base.DBO.GetConnection("MES")` — 透過基底類別屬性
> - `new DBOHandler().GetConnection("MES")` — 直接實例化 Handler

---

## 2. DBO — 資料庫存取

**Namespace**：`CIMWebApiFramework.Utility`

### 2.1 設定（Web.config）

```xml
<configuration>
  <connectionStrings>
    <add name="MES"
         connectionString="Data source=(DESCRIPTION=(ENABLE=BROKEN)(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=10.18.20.31)(PORT=1523)))(CONNECT_DATA=(SERVER=DEDICATED)(SID=FEDEV)));"
         providerName="System.Data.OracleClient" />
    <add name="RPT"
         connectionString="Data source=(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=10.16.10.33)(PORT=1521)))(CONNECT_DATA=(SID=RPTSHORT)));"
         providerName="System.Data.OracleClient" />
  </connectionStrings>
</configuration>
```

### 2.2 使用方式

```csharp
// 宣告方式 1：透過基底類別
var dbo = base.DBO.GetConnection("MES");

// 宣告方式 2：直接實例化（等效）
var dbo = new DBOHandler().GetConnection("MES");
```

> **框架行為**：
>
> - 同一 Thread 內不管 `new` 幾次，**只會有一份 DB Connection**（Thread-local 記錄）。
> - 框架負責**自動 close** DB Connection，應用端不需要手動 `Close()`。

### 2.3 查詢範例（Dapper）

```csharp
// 建立 Model
public class ReticleInfo
{
    public string ReticleId { get; set; }
    public string State { get; set; }
    public string Location { get; set; }
}

// 執行查詢
private List<ReticleInfo> GetReticleList(string[] reticleIds)
{
    var dbo = base.DBO.GetConnection("MES");
    string sql = @"
        SELECT ent_name AS ReticleId,
               ent_state AS State,
               attr_value AS Location
        FROM my_table
        WHERE ent_name IN :p1";

    return dbo.Query<ReticleInfo>(sql, new { p1 = reticleIds }).ToList();
}
```

### 2.4 規範

- `connectionStrings` 的 `name` 與 `GetConnection("名稱")` 必須**完全一致**（大小寫敏感）。
- 請**勿**在 DBO 查詢之外自行建立 `OracleConnection` — 統一走 `DBOHandler`。
- 使用 Dapper 的 `Query<T>` / `Execute` 方法；**禁止**使用 `DataAdapter` / `DataSet`。

---

## 3. LogHandler — 日誌記錄

**Namespace**：`CIMWebApiFramework.Utility`

### 3.1 設定（NLog.config）

放置於應用根目錄，下列為保留 2 小時封存的標準設定：

```xml
<?xml version="1.0" encoding="utf-8" ?>
<nlog xmlns="http://www.nlog-project.org/schemas/NLog.xsd"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      autoReload="true" throwExceptions="false">

  <variable name="Layout" value="${longdate} ${level:uppercase=true} ${message}"/>
  <variable name="LogTxtLocation" value="D:/WecLog/WebApiLog/Trace.txt"/>
  <variable name="LogTxtLocationError" value="D:/WecLog/WebApiLog/ErrorFile.txt"/>
  <variable name="ArchiveLocation" value="D:/WecLog/WebApiLog/Archive/{#}_Trace.txt"/>
  <variable name="ArchiveLocationError" value="D:/WecLog/WebApiLog/Archive/{#}_ErrorFile.txt"/>

  <targets>
    <target name="File" xsi:type="File"
            fileName="${LogTxtLocation}" layout="${Layout}"
            archiveFileName="${ArchiveLocation}"
            archiveDateFormat="yyyy-MM-dd_HH.mm.ss"
            maxArchiveFiles="2" archiveEvery="Hour"
            archiveOldFileOnStartup="true"/>
    <target name="FileError" xsi:type="File"
            fileName="${LogTxtLocationError}" layout="${Layout}"
            archiveFileName="${ArchiveLocationError}"
            archiveDateFormat="yyyy-MM-dd_HH.mm.ss"
            maxArchiveFiles="2" archiveEvery="Hour"/>
    <target name="eventlog" xsi:type="EventLog"
            source="NLogLogger" log="Application" layout="${Layout}"/>
  </targets>

  <rules>
    <logger name="*" levels="Debug,Info,Warn,Error" writeTo="File" />
    <logger name="*" levels="Error" writeTo="FileError" />
    <logger name="*" level="Error" writeTo="eventlog" />
  </rules>
</nlog>
```

### 3.2 使用方式

```csharp
// 宣告方式 1：透過基底類別
base.Log.Debug("處理開始，輸入：" + input.Id);
base.Log.Info("處理完成");
base.Log.Warn("資料異常，跳過此筆");
base.Log.Error("發生錯誤：" + ex.Message);

// 宣告方式 2：直接實例化（等效）
new LogHandler().Debug("101ms");
```

### 3.3 規範

- **非同步操作**：.NET Framework 4.8 不強制 async，但若有非同步方法，需使用 `Task.Run()` 封裝。
- 日誌路徑 (`D:/WecLog/`) 為標準路徑，各系統應保持一致。
- 禁止在 Controller 中使用 `Console.WriteLine()` 或 `System.Diagnostics.Debug.WriteLine()` 記錄業務日誌。

---

## 4. Security — 安全驗證與 Alarm

**Namespace**：`CIMWebApiFramework.Security`

### 4.1 設定（Web.config）

```xml
<configuration>
  <configSections>
    <section name="CIMWebApiFrameworkSettings"
             type="System.Configuration.NameValueSectionHandler" />
  </configSections>
  <CIMWebApiFrameworkSettings>
    <!-- Pilot 環境 -->
    <add key="ServiceCenterURL" value="http://10.18.20.56:8050/sc/api/7.5/" />
    <!-- Production 環境 -->
    <!-- <add key="ServiceCenterURL" value="http://imx/api/7.5" /> -->

    <!-- 多個帳號用 ',' 分隔 -->
    <add key="BypassUsingSecurityCallName" value="SYS_FAB300SVC,HYCHENG5" />
  </CIMWebApiFrameworkSettings>
</configuration>
```

### 4.2 權限查詢

```csharp
// 回傳目前使用者在指定分類下有權限的 Resource 清單
List<string> items = base.Security.GetResources("CateNameY");
// 等效寫法
List<string> items = new SecurityHandler().GetResources("CateNameY");
```

### 4.3 發送 Alarm（廣播型）

```csharp
AlarmMessage alarm = new AlarmMessage
{
    AlarmServer = "CTPilot",   // CTProd / KHProd / CTPilot / KHPilot
    EventSource = "MY_SYSTEM",
    EventName   = "ISSUE_DISPATCH",
    Fields      = new Dictionary<string, string>
    {
        { "ALARM_ID",    "NON_IMPACT_PROD" },
        { "SYSTEM",      "MyApp" },
        { "SECTION",     "MK22" },
        { "SUBJECT",     "異常通知標題" },
        { "ALARM_TEXT",  "通知內容" },
        { "USER",        "HYCHENG5" },
        { "DEPARTMENT",  "MK22" }
    }
};

AlarmResponse result = base.Security.SendAlarm(alarm);
// result.Result == "Success" 表示成功
```

### 4.4 發送 Alarm（指定收件者型）

```csharp
AlarmMessageDirectly alarm = new AlarmMessageDirectly
{
    AlarmServer     = "CTPilot",
    EventSource     = "MY_SYSTEM",
    EventName       = "ISSUE_DIRECTLY",
    Subject         = "信件標題",
    lstMailTo_Member = new List<string> { "YTCHANG2", "YYHAN" },
    lstMailTo_DEPT   = new List<string> { "MK22" },
    MailBody        = "信件內文",
    lstSMSTo_Member = new List<string> { "YTCHANG2" },
    SMSBody         = "簡訊內文"
};

AlarmResponse result = base.Security.SendAlarmToReceivers(alarm);
```

### 4.5 規範

- `AlarmServer` 只能填入固定清單：`CTProd`、`KHProd`、`CTPilot`、`KHPilot`。
- `ServiceCenterURL` 必須配合環境切換，**禁止** hardcode 內網 IP 於業務邏輯。

---

## 5. Exception — 例外處理

**Namespace**：`CIMWebApiFramework.Exception`

### 5.1 例外處理架構

- **Global Exception**：未處理的例外由 Framework 自動擷取，回傳 HTTP 500。
- **Custom Exception**：需要自訂 HTTP Status Code 與錯誤訊息時使用。

### 5.2 Custom Exception 使用範例

```csharp
using CIMWebApiFramework.Exception;
using System.Net;

// 業務邏輯層發生可預期錯誤，回傳 400 Bad Request
try
{
    // ... 業務處理 ...
}
catch (COMException ex)
{
    string errorCode = ex.ErrorCode.ToString();
    string errorText = "處理失敗：" + ex.Message;

    var customEx = new CustomException();
    customEx.HttpStatusCode = HttpStatusCode.BadRequest;
    customEx.ErrorCheckResult.errorCode = errorCode;
    customEx.ErrorCheckResult.content   = errorText;
    customEx.ErrorCheckResult.stackTrace = ex.Message;
    throw customEx;
}
```

### 5.3 規範

- **400 BadRequest**：業務邏輯層（Workflow）預期內的錯誤（如資料驗證失敗）。
- **500 InternalServerError**：未預期的系統例外（由 Framework 自動處理）。
- 禁止直接 `throw new Exception()` ─ 業務邏輯錯誤應透過 `CustomException` 層別。

---

## 6. Extension — 跨 API 呼叫

**Namespace**：`CIMWebApiFramework.Extension`

### 6.1 概念

`SendRequestWithTemplate<T>` 是對 `HttpClient` 的擴充方法，
呼叫「**同樣使用 CIMWebApiFramework 的系統**」時，框架底層自動處理 Header / Token 驗證。
呼叫端只需提供 URL、系統名稱與 Body。

### 6.2 使用範例

```csharp
using CIMWebApiFramework.Extension;

string apiUrl  = "http://other-system/api/GetData";
string appName = "OtherSystemName";
JObject body   = new JObject();
body["sectionIds"] = new JArray(input.SectionIds.ToArray());

// T 為回傳資料型別
MyResultType result = new HttpClient()
    .SendRequestWithTemplate<MyResultType>(apiUrl, appName, body);
```

### 6.3 規範

- 僅適用於**兩端都使用 CIMWebApiFramework** 的系統間呼叫。
- 呼叫外部第三方系統（不含框架）請使用標準 `HttpClient`，自行處理 Header。

---

## 7. Filter — 宣告式 Attribute

**Namespace**：`CIMWebApiFramework.Filter`

### 7.1 [UsingSecurity] — 資源權限驗證

```csharp
using CIMWebApiFramework.Filter;

// 自動驗證呼叫端是否擁有指定 Resource 的權限
// 驗證失敗時 Framework 自動回傳對應錯誤
[UsingSecurity(new string[] { "Abnormal-Lot-Handling-Disposition" })]
[HttpPost]
public MyResult ExecuteAction(MyInput input)
{
    // 到達此處代表已通過權限驗證
    return Process(input);
}
```

> **進階用法**：
>
> ```csharp
> // 在方法內動態驗證
> base.Security.HasPermit("Global-NPWLotType.MFG");
> // 等效
> new SecurityHandler().HasPermit("Global-NPWLotType.MFG");
> ```

### 7.2 [UsingTransactionScope] — 交易管理

```csharp
using CIMWebApiFramework.Filter;

// 方法執行完畢自動 Commit；發生任何 Exception 自動 Rollback
[UsingTransactionScope]
[HttpPost]
public void AddMenuItem(NavigationsUpdate input)
{
    // 所有 DBO 操作包在同一 Transaction 中
    var dbo = base.DBO.GetConnection("MES");
    dbo.Execute("INSERT INTO ...", input);
    // 正常結束 → 自動 Commit
    // 拋出 Exception → 自動 Rollback
}
```

### 7.3 規範

- `[UsingSecurity]` 與 `[UsingTransactionScope]` **可同時套用**，執行順序由 Framework 管理。
- `[UsingTransactionScope]` 適用於**多次寫入需要 ACID 保障**的操作。
- 單純讀取（SELECT）不需要加 `[UsingTransactionScope]`。

---

## 8. 框架設計原則（貢獻者）

> 此章節僅適用於修改 CIMWebApiFramework 原始碼的貢獻者。

### 8.1 Handler 設計原則

- 每個 Handler 必須同時支援：
  1. **透過基底類別**：`base.XXX.Method()`
  2. **直接實例化**：`new XXXHandler().Method()`
- Handler 內部 **禁止** 持有 static 可變狀態（Thread-Safety）。

### 8.2 .NET Framework 4.8 限制

- 使用 `Task.Run()` 取代 `async/await`（若業務需要非同步）。
- 禁止使用 .NET 6+ 專屬的 `System.Text.Json`，統一使用 `Newtonsoft.Json`。
- `ILogger<T>` 為 .NET Core DI 模式，.NET Framework 4.8 請使用 `LogHandler`。

### 8.3 向後相容性

- 公開 API 簽章（Public Method）**不得 Breaking Change**。
- 新增功能應以新方法加入，舊方法加 `[Obsolete]` 標記。

---

## 9. 設定檔規範

### 9.1 Web.config 各 Section 職責

| Section                        | 用途                                          |
| ------------------------------ | --------------------------------------------- |
| `<connectionStrings>`          | 資料庫連線字串（DBO 使用）                    |
| `<appSettings>`                | 一般 Key-Value 設定（ElasticApm、環境旗標等） |
| `<CIMWebApiFrameworkSettings>` | 框架專屬設定（ServiceCenterURL、Bypass 清單） |
| `<system.webServer>`           | IIS 模組設定（ElasticApmModule）              |

### 9.2 環境設定切換

- 以 `Web.Pilot.config`、`Web.Production.config` 進行環境 transform。
- 禁止將 Production IP/密碼 hardcode 在 `Web.config` 主檔。

### 9.3 Elastic APM 設定

```xml
<appSettings>
  <add key="ElasticApm:Enabled"     value="true" />
  <add key="ElasticApm:ServiceName" value="My_System" />
  <add key="ElasticApm:Environment" value="Prod" />
  <!-- Pilot: http://10.18.20.56:8205 | CT-CIM: http://10.16.4.158:8200 -->
  <add key="ElasticApm:ServerUrl"   value="http://10.16.4.158:8200" />
</appSettings>

<system.webServer>
  <modules>
    <add name="ElasticApmModule"
         type="Elastic.Apm.AspNetFullFramework.ElasticApmModule, Elastic.Apm.AspNetFullFramework" />
  </modules>
</system.webServer>
```

> APM 最低版本需求：CIMWebApiFramework **v7.9.1 以上**。

---

## 10. AI 助手指引

### 10.1 防止幻覺 (Anti-Hallucination)

- **嚴禁捏造不存在的 Handler 或 API**：產生代碼前請確認命名空間與方法名稱。
- 不確定 Handler 是否存在時，請說「請查閱 IntelliSense 確認」，**絕對不要猜測**。

### 10.2 語法版本檢測

產生程式碼前，**必須先確認** `.csproj` 中的 `<TargetFrameworkVersion>v4.8`：

```csharp
// ✅ .NET Framework 4.8 正確寫法
namespace CIMWebApiFramework.Utility
{
    public class DBOHandler
    {
        private readonly string _connName;
        public DBOHandler() { }
    }
}

// ❌ 禁止（.NET 8 語法）
namespace CIMWebApiFramework.Utility;  // File-scoped namespace
public class DBOHandler(string connName) { }  // Primary constructor
```

### 10.3 職責守衛

- 業務邏輯（資料驗證、流程控制）**不應放入** Handler。
- Handler 只負責基礎設施（連線、日誌、安全驗證）。

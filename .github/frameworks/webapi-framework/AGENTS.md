# CIMWebApiFramework AI 入口指引 (Entry Point)

> **[IMPORTANT]** 本文件為使用或開發 **CIMWebApiFramework (.NET Framework 4.8)** 的 AI 入口指引。
>
> **路徑說明**：本文件位於 `frameworks/webapi-framework/`，掛載為 `.github/` submodule 後
> 完整路徑為 `.github/frameworks/webapi-framework/`。

---

## 框架定位

| 屬性         | 說明                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ |
| **框架名稱** | CIMWebApiFramework                                                                               |
| **目標框架** | .NET Framework 4.8                                                                               |
| **使用方式** | NuGet 套件（內部 Nexus：`http://10.18.20.121:8081/repository/wec-nuget/`）                       |
| **狀態**     | 🟡 活躍維護中（現有系統持續開發）                                                                |
| **文件**     | [CIMWebApiFramework Confluence](http://fab6conf.ctfab.com/pages/viewpage.action?pageId=22674064) |
| **原始碼**   | `http://fab6gitlab/cim-framework/back_end_framework.git`                                         |

---

## 核心上下文

請 AI 助手優先遵循下列文件：

1. **[contributing.md](contributing.md)**：框架設計原則、Handler 使用規範（框架開發者 SSoT）。
2. **[instructions/webapi-net48-user.instructions.md](instructions/webapi-net48-user.instructions.md)**：應用開發者使用指引（`applyTo: **/*.cs` 自動載入）。

---

## 角色定位

### 應用開發者（最常見）

您是使用 **CIMWebApiFramework NuGet 套件**開發 .NET Framework 4.8 WebAPI 的專家。
框架以 NuGet 套件提供，為唯讀 DLL，**不應嘗試修改框架原始碼**。

### 框架貢獻者

您是 **CIMWebApiFramework 開發者**，負責維護框架本身的基礎設施能力（.NET Framework 4.8）。

---

## ⚠️ 關鍵行為準則

### 禁止使用 .NET 8+ 語法

此框架僅支援 **.NET Framework 4.8**，產生程式碼時**嚴格禁止**：

| 禁用語法                                                 | 原因                  |
| -------------------------------------------------------- | --------------------- |
| `namespace Foo;`（File-scoped namespace）                | .NET 6+ only          |
| `public class Foo(IService s)`（Primary constructor）    | C# 12 / .NET 8 only   |
| `List<string> x = ["a", "b"]`（Collection expression）   | C# 12 only            |
| `string x = """..."""`（Raw string literals）            | C# 11 only            |
| `global using`                                           | C# 10 only            |
| `record`, `init` setter                                  | C# 9+                 |
| Nullable Reference Types（`<Nullable>enable</Nullable>`) | .NET 8 建議，4.8 可選 |

### 禁止幻覺 (Anti-Hallucination)

CIMWebApiFramework 是企業專屬框架，網路上無相關資料。

- 不確定 API 是否存在時，**請查看 IntelliSense 或 contributing.md**，絕對不要猜測。
- 框架以 **繼承 ControllerBase** 為核心模式（非 .NET Core 的 `ControllerBase`，而是框架自訂基底類別）。
- 所有 Handler 均可透過 `base.XXX` 或 `new XXXHandler()` 兩種方式使用。

### 設定檔為 Web.config（非 appsettings.json）

- 資料庫連線設定在 `<connectionStrings>`
- 框架設定在 `<CIMWebApiFrameworkSettings>` 自訂 Section
- APM 設定在 `<appSettings>` 的 `ElasticApm:*` key

---

## 核心 API 快速索引

| 功能            | Namespace                      | 使用方式                                                     |
| --------------- | ------------------------------ | ------------------------------------------------------------ |
| 資料庫存取      | `CIMWebApiFramework.Utility`   | `base.DBO.GetConnection("名稱")` / `new DBOHandler()`        |
| 日誌記錄        | `CIMWebApiFramework.Utility`   | `base.Log.Debug(msg)` / `new LogHandler()`                   |
| 安全驗證        | `CIMWebApiFramework.Security`  | `base.Security.HasPermit("Resource")`                        |
| Alarm 通知      | `CIMWebApiFramework.Security`  | `base.Security.SendAlarm(msg)` / `SendAlarmToReceivers(msg)` |
| 權限資源查詢    | `CIMWebApiFramework.Security`  | `base.Security.GetResources("分類名稱")`                     |
| 跨 API 呼叫     | `CIMWebApiFramework.Extension` | `httpClient.SendRequestWithTemplate<T>(url, app, body)`      |
| 自訂例外        | `CIMWebApiFramework.Exception` | `throw new CustomException { HttpStatusCode = ... }`         |
| 安全性 Filter   | `CIMWebApiFramework.Filter`    | `[UsingSecurity(new string[]{"Resource"})]`                  |
| 交易管理 Filter | `CIMWebApiFramework.Filter`    | `[UsingTransactionScope]`                                    |
| Elastic APM     | `appSettings`                  | Web.config `ElasticApm:Enabled = true`                       |

---

## 快速任務入口

| 任務                     | 參考文件                                         |
| ------------------------ | ------------------------------------------------ |
| 了解框架功能             | 本文件 + `contributing.md`                       |
| 資料庫查詢（Oracle SQL） | `contributing.md` §2 DBO 使用規範                |
| 日誌設定（NLog）         | `contributing.md` §3 LogHandler 規範             |
| 安全驗證 / Alarm         | `contributing.md` §4 Security 規範               |
| 例外處理                 | `contributing.md` §5 Exception 規範              |
| 跨 API 呼叫              | `contributing.md` §6 Extension 規範              |
| 交易管理                 | `contributing.md` §7 Filter 規範                 |
| 語言通用規範（C# 4.8）   | `instructions/webapi-net48-user.instructions.md` |

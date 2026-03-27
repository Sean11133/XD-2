# iMX.Core.Net AI 入口指引 (Entry Point)

> **[IMPORTANT]** 本文件為使用或開發 **iMX.Core.Net（iMX.Core v1.x，舊版架構）** 的 AI 入口指引。
>
> **路徑說明**：本文件位於 `frameworks/imx-core-net/`，掛載為 `.github/` submodule 後
> 完整路徑為 `.github/frameworks/imx-core-net/`。

---

## 框架定位

| 屬性           | 說明                                                                 |
| -------------- | -------------------------------------------------------------------- |
| **框架名稱**   | iMX.Core.Net（iMX.Core v1.x）                                        |
| **目標框架**   | .NET 8.0 + .NET Framework 4.8（雙 TFM）                              |
| **架構風格**   | Manager-Based（`DatabaseManager`、`S3BucketManager` 等獨立 Manager） |
| **狀態**       | 🟡 維護中（現有系統支援），**尚未重構**                              |
| **取代方向**   | 🔄 逐步遷移至 **iMX.Framework v2.0**（已重構，DI-Based）             |
| **NuGet 來源** | 內部 Nexus 私有倉庫                                                  |
| **原始碼**     | `http://fab6gitlab/cim-framework/imx.core.net.git`                   |
| **官方文件**   | [API 文件](https://pilot-imx/iMX.CoreDoc/)                           |
| **支援團隊**   | MK22                                                                 |

---

## 核心上下文

請 AI 助手優先遵循下列文件：

1. **[contributing.md](contributing.md)**：框架設計原則、Manager API 規範（SSoT）。
2. **[instructions/imx-core-user.instructions.md](instructions/imx-core-user.instructions.md)**：應用開發者使用指引（`applyTo: **/*.cs` 自動載入）。

---

## 角色定位

### 應用開發者（最常見）

您是使用 **iMX.Core NuGet 套件**開發企業應用的專家，負責 Web API、Console App 或 Worker Service 開發。
框架以 NuGet 套件提供，為唯讀 DLL，**不應嘗試修改框架原始碼**。

### 框架貢獻者

您是 **iMX.Core.Net 維護者**，負責修復問題、維持雙 TFM 相容性（.NET 8 + .NET Framework 4.8）。
**注意**：大規模新功能開發應在 iMX.Framework v2.0 進行，而非此版本。

---

## ⚠️ iMX.Core v1.x vs iMX.Framework v2.0 差異

| 維度             | iMX.Core v1.x（本框架）                   | iMX.Framework v2.0                                                   |
| ---------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| **架構風格**     | Manager-Based（直接 new 或 DI Manager）   | DI-Based（`IDbProvider`、`IStorageProvider` 等介面）                 |
| **初始化**       | 各 Manager 各自設定                       | `IMXFramework.Initialize()` 或 `builder.Services.AddWebApiSupport()` |
| **設定結構**     | 多個獨立 Section（`Database`、`Kafka`...) | 統一 `iMXConfig` 物件                                                |
| **Web API 支援** | 需搭配 CIMWebApiFrameworkCore             | `iMX.Web` 套件                                                       |
| **推薦程度**     | 維護既有專案                              | ✅ 新專案首選                                                        |

---

## 核心行為準則

- **禁止幻覺**：iMX.Core 是企業專屬框架，網路上無相關公開資料。
  - Manager 清單以 `contributing.md` §2 為準，**絕對不要猜測**。
  - 不確定 API 時，請查看 IntelliSense 或 [官方文件](https://pilot-imx/iMX.CoreDoc/)。
- 解釋使用繁體中文，程式碼與術語維持英文。
- 區分 .NET 8 與 .NET Framework 4.8 兩種使用情境，必要時使用 `#if NET48_OR_GREATER`。
- 遇到新功能需求，主動說明 iMX.Framework v2.0 的對應替代方案。

---

## 官方參考資源

| 資源                | 連結                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Official API 文件   | [https://pilot-imx/iMX.CoreDoc/](https://pilot-imx/iMX.CoreDoc/)                                                                     |
| Getting Started     | [https://pilot-imx/iMX.CoreDoc/getting-started.html](https://pilot-imx/iMX.CoreDoc/getting-started.html)                             |
| .NET 8 範例程式碼   | [http://fab6gitlab/cim-framework/imx.core.net.samples/imxsample](http://fab6gitlab/cim-framework/imx.core.net.samples/imxsample)     |
| .NET 4.8 範例程式碼 | [http://fab6gitlab/cim-framework/imx.core.net.samples/imxsample48](http://fab6gitlab/cim-framework/imx.core.net.samples/imxsample48) |

---

## 快速任務入口

| 任務                            | 使用方式                                                              |
| ------------------------------- | --------------------------------------------------------------------- |
| 了解框架功能與 Manager 清單     | 參閱 `contributing.md` §2                                             |
| 資料庫存取（Oracle/SQL Server） | 參閱 `contributing.md` §3                                             |
| Kafka 訊息佇列                  | 參閱 `contributing.md` §4                                             |
| 多 TFM 條件編譯                 | 參閱 `contributing.md` §5                                             |
| 遷移至 iMX.Framework v2.0       | 參閱 `contributing.md` §6                                             |
| 語言通用規範（C#）              | `instructions/csharp.instructions.md`（由 wec-coding-standards 提供） |

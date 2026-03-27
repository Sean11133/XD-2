# CIMWebApiFrameworkCore AI 入口指引

> **[IMPORTANT]** 本文件為使用 **CIMWebApiFrameworkCore (.NET 8)** 的 AI 入口指引。

---

## ⚠️ 棄用通知 (DEPRECATED)

**CIMWebApiFrameworkCore 正在被取代。**

| 屬性           | 說明                                                           |
| -------------- | -------------------------------------------------------------- |
| **當前狀態**   | 🔴 棄用中 — 現有系統維護，**不建議新專案採用**                 |
| **取代方案**   | **iMX.Framework v2.0 (`iMX.Web` + `iMX.Core`)**                |
| **新專案指引** | 請參閱 [`frameworks/imxframework/`](../imxframework/AGENTS.md) |
| **遷移指引**   | 請參閱本文件 `contributing.md` §5 遷移路徑                     |

---

## 框架定位

| 屬性         | 說明                                                         |
| ------------ | ------------------------------------------------------------ |
| **框架名稱** | CIMWebApiFrameworkCore                                       |
| **目標框架** | .NET 8.0                                                     |
| **依賴**     | iMX.Core v1.9.1（舊版核心）                                  |
| **原始碼**   | `http://fab6gitlab/cim-framework/web-api-framework-core.git` |
| **支援團隊** | MK22                                                         |

---

## 核心上下文

請 AI 助手優先遵循下列文件：

1. **[contributing.md](contributing.md)**：框架使用規範與遷移指引（SSoT）。
2. **[instructions/webapi-core-user.instructions.md](instructions/webapi-core-user.instructions.md)**：應用開發者指引（`applyTo: **/*.cs`）。

---

## 角色定位

### 應用開發者（維護既有系統）

您正在**維護**使用 CIMWebApiFrameworkCore 的 .NET 8 WebAPI 系統。
目標是確保現有系統持續運作，並於適當時機規劃遷移至 iMX.Framework v2.0。

### 框架架構（技術背景）

```
應用系統
   └── CIMWebApiFrameworkCore (.NET 8)
           └── iMX.Core v1.9.x（Manager-Based API）
                   ├── DatabaseManager（Oracle/SQL Server）
                   ├── S3BucketManager（S3 物件儲存）
                   ├── ElasticSearchManager（搜尋引擎）
                   ├── ElasticApmManager（APM 監控）
                   └── WecTransport / WecApplication（Kafka）
```

---

## 行為準則

- **禁止幻覺**：`iMX.Core` 為企業專屬框架，Manager 清單以 `contributing.md` 為準。
- 解釋使用繁體中文，程式碼與術語維持英文。
- **新功能開發**：強烈建議遷移至 iMX.Framework v2.0，而非繼續擴展此框架。

---

## 快速任務入口

| 任務                      | 使用方式                                                              |
| ------------------------- | --------------------------------------------------------------------- |
| 瞭解框架架構              | 參閱 `contributing.md` §1                                             |
| Manager API 使用          | 參閱 `contributing.md` §2-4                                           |
| 評估遷移可行性            | 參閱 `contributing.md` §5                                             |
| 語言通用規範（C# .NET 8） | `instructions/csharp.instructions.md`（由 wec-coding-standards 提供） |

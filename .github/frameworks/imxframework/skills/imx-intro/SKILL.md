---
name: imx-intro
description: This skill should be used when the user asks about "iMX 是什麼", "iMX.Framework 介紹", "框架有哪些功能", "框架支援哪些資料庫", "怎麼開始用 iMX", "iMX 設計哲學", or needs an introduction to the iMX.Framework v2.0 architecture, module overview, technology stack, and design philosophy.
---

# iMX.Framework 框架介紹

## 執行步驟

1. **確認使用者角色**：詢問是應用開發者（使用 NuGet）還是框架貢獻者（修改原始碼）
2. **介紹框架定位**：iMX.Framework 是企業級 .NET 基礎設施框架，封裝資料庫、APM、日誌等橫切關注點
3. **說明核心模組**：列出關鍵模組（見下方）
4. **導向下一步**：根據使用者角色推薦對應的 Skill（`imx-init` 或貢獻指南）

---

## 框架核心模組

| 模組                | 功能                               |
| ------------------- | ---------------------------------- |
| `iMXConfig`         | 框架統一設定入口                   |
| `OracleProvider`    | Oracle 資料庫存取（含 UnitOfWork） |
| `SqlServerProvider` | SQL Server 資料庫存取              |
| `CassandraProvider` | Cassandra 資料庫存取               |
| `IDbProvider`       | 資料庫統一介面（DI 友好）          |
| `IUnitOfWork`       | 交易管理介面                       |
| `LogManager`        | 整合 NLog 的日誌管理器             |
| `COPMetrics`        | 業務指標監控（Elastic APM 整合）   |
| `iMX.Extensions.DI` | DI 擴充套件                        |

---

## 技術棧

- **.NET 版本**：.NET 8.0（主要）/ .NET Framework 4.8（相容）
- **資料庫**：Oracle、SQL Server、Cassandra
- **日誌**：NLog（框架自動處理 sink）
- **APM**：Elastic APM（`EnableAPM: true` 即啟用）
- **監控**：COPMetrics

---

## 設計哲學

iMX.Framework 遵循三大核心設計原則：

1. **80% 原則**：只提供絕大多數場景所需的功能，避免過度設計
2. **開放性**：允許開發者繞過框架直接操作，不隱藏實作細節
3. **職責邊界**：框架負責基礎設施，應用程式負責業務邏輯

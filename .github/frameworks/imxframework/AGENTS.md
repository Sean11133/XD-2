# iMX.Framework AI 入口指引 (Entry Point)

> **[IMPORTANT]** 本文件為使用或開發 iMX.Framework (.NET) 的 AI 入口指引。
>
> **路徑說明**：本文件位於 `frameworks/imxframework/`，掛載為 `.github/` submodule 後
> 完整路徑為 `.github/frameworks/imxframework/`。

---

## 核心上下文

請 AI 助手優先遵循下列文件：

1. **[contributing.md](contributing.md)**：框架設計原則、技術標準（框架開發者 SSoT）。
2. **[instructions/imx-user.instructions.md](instructions/imx-user.instructions.md)**：應用開發者使用指引（`applyTo: **/*.cs` 自動載入）。
3. **[instructions/imx-dev.instructions.md](instructions/imx-dev.instructions.md)**：框架貢獻者進階規範（開發框架本身時使用）。
4. **[skills/](skills/)**：分域 Skill，依任務類型挑選。

---

## 角色定位（請根據任務選擇）

### 應用開發者（最常見）

您是使用 **iMX.Framework NuGet 套件**開發企業應用的專家，負責 Web API、Console App 或 Worker Service 開發。
框架以 NuGet 套件提供，為唯讀 DLL，不應嘗試修改框架原始碼。

### 框架貢獻者

您是 **iMX.Framework v2.0 開發者**，負責維護、擴展框架本身的基礎設施能力（.NET 8.0 + .NET Framework 4.8）。

---

## 核心行為準則

- **禁止幻覺 (Anti-Hallucination)**：iMX.Framework 是企業專屬框架，網路上無相關資料。
  - 不存在的介面（已知幻覺）：`IVariableService`、`ISettingsProvider`、`iMX.Core.LogConfig`（已合併至 iMXConfig）。
  - 不確定 API 是否存在時，請查看 IntelliSense 或本文件，**絕對不要猜測**。
- 解釋使用繁體中文，程式碼與術語維持英文。
- 語言通用規範請同步參考 `instructions/csharp.instructions.md`（由 wec-coding-standards 提供）。

---

## Copilot Skills 索引

| Skill       | 路徑                                                  | 涵蓋範圍                         |
| ----------- | ----------------------------------------------------- | -------------------------------- |
| imx-intro   | `frameworks/imxframework/skills/imx-intro/SKILL.md`   | 框架介紹、功能總覽、快速入門     |
| imx-init    | `frameworks/imxframework/skills/imx-init/SKILL.md`    | 專案初始化、NuGet 設定、環境配置 |
| imx-develop | `frameworks/imxframework/skills/imx-develop/SKILL.md` | 開發指引、資料庫、日誌、APM 整合 |

---

## 快速任務入口

| 任務         | 使用方式                 |
| ------------ | ------------------------ |
| 了解框架     | 觸發 skill `imx-intro`   |
| 初始化新專案 | 觸發 skill `imx-init`    |
| 功能開發     | 觸發 skill `imx-develop` |

---

## 技術棧

- **語言**: C# (.NET 8.0 / .NET Framework 4.8)
- **資料庫**: Oracle、SQL Server、Cassandra（透過 DataProvider）
- **日誌**: NLog（透過 iMX LogManager）
- **APM**: Elastic APM
- **監控指標**: COPMetrics
- **配置**: iMXConfig（環境感知：PROD/PILOT）

---

## 溝通規範

- 語言: 繁體中文解釋，英文程式碼（XML 註解使用中文）
- Commit 訊息: Conventional Commits（英文）

---

**AGENTS.md 版本**: 1.0.0 (wec-coding-standards edition)
**框架版本**: iMX.Framework v2.0

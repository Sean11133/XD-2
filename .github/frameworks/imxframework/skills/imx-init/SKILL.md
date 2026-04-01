---
name: imx-init
description: This skill should be used when the user asks to "建立新專案", "初始化 iMX", "怎麼安裝 iMX.Framework", "iMX NuGet 安裝", "Web API 專案初始化", "appsettings.json 怎麼設定", "AddWebApiSupport 怎麼用", or needs guidance on project initialization, DI setup, and appsettings.json configuration for iMX.Framework v2.0.
---

# iMX.Framework 專案初始化

## 執行步驟

### ⭐ Step 0 — 強制詢問專案識別資訊（開始任何作業前必做）

**在產生任何檔案或程式碼之前，必須向使用者詢問並等待回答：**

```
請提供以下專案識別資訊，將填入 appsettings.json：

1. ServiceName（APM 服務識別名）：例如 WEC_MODEL_MONITOR、WEC_DATA_SYNC
2. Section（部門代碼）：例如 MK22、MK20、MK10
3. DatabaseType：僅允許 Oracle │ SqlServer
4. 專案類型： Web API │ Console App │ Worker Service
```

> 若使用者尚未確認上述四項，禁止建立任何檔案。直到回答完成，再進入 Step 1。

---

### Step 1 — 確認專案類型（已於 Step 0 回答，此處確認細節）

根據 Step 0 回答選擇對應初始化模式：

- **Web API** → Step 3
- **Console App / Worker Service** → Step 4
- **其他** → 詢問進一步

### Step 2 — NuGet 套件安裝

```powershell
dotnet add package iMX.Framework --version 2.0.0
# 若需要 DI 擴充
dotnet add package iMX.Framework.Extensions.DI --version 2.0.0
```

### Step 3 — Web API 初始化

**Program.cs**：

```csharp
var builder = WebApplication.CreateBuilder(args);

// 一行初始化框架（含資料庫、日誌、APM）
builder.Services.AddWebApiSupport(builder.Configuration);

var app = builder.Build();
app.UseWebApiSupport();
app.MapControllers();
app.Run();
```

### Step 4 — Console 應用程式初始化

```csharp
IMXFramework.Initialize(new iMXConfig
{
    DatabaseType = "Oracle",
    ConnectionString = "User Id=...;Password=...;Data Source=...",
    EnableAPM = false,
    LogLevel = LogLevel.Information
});
```

### Step 5 — appsettings.json 設定（包含 Step 0 收集的識別資訊）

```json
{
  "iMXConfig": {
    "ServiceName": "<Step 0 的 ServiceName>",
    "Section": "<Step 0 的 Section>",
    "DatabaseType": "<Oracle | SqlServer>",
    "ConnectionString": "...",
    "EnableAPM": true,
    "APMServiceName": "<Step 0 的 ServiceName>",
    "APMServerUrl": "http://apm-server:8200",
    "LogLevel": "Information"
  }
}
```

---

## 環境分離建議

使用 .NET 內建機制管理多環境設定：

```
appsettings.json          # 基礎設定（不含機敏資訊）
appsettings.Development.json  # 開發環境
appsettings.Production.json   # 生產環境（CI/CD 注入）
```

---

## 完成確認清單

- [ ] NuGet 套件已安裝（`iMX.Framework v2.0.0+`）
- [ ] `AddWebApiSupport()` 或 `IMXFramework.Initialize()` 已呼叫
- [ ] `appsettings.json` 包含 `iMXConfig` 區塊
- [ ] 連線字串設定正確
- [ ] 應用程式可正常啟動

---
# .NET Adapter — Framework Detector
---

# .NET 8 Adapter — Framework Detector

> Chain of Responsibility 節點：偵測當前 project 是否為 .NET 8 專案。

## 偵測邏輯

### 主要偵測條件（任一成立即確認）

| 優先級 | 條件                             | 查找位置                   |
| ------ | -------------------------------- | -------------------------- |
| 高     | `*.sln` 檔案存在                 | project root 或 1 層子目錄 |
| 高     | `*.csproj` 檔案存在              | project root 或 1 層子目錄 |
| 中     | `global.json` 存在且包含 `"sdk"` | project root               |

### 版本確認

| 條件                                        | 查找位置        |
| ------------------------------------------- | --------------- |
| `<TargetFramework>net8.0</TargetFramework>` | 任意 `*.csproj` |
| `global.json` 中 `sdk.version` 以 `8.` 開頭 | project root    |

**注意**：若偵測到 .NET 6 或 .NET 7，仍使用此 Adapter，但在 LoopState 中加入 WARN：

```
severity: WARN
message: "Detected .NET {version}, but standards are optimized for .NET 8. Consider upgrading."
```

---

## 偵測流程

```
1. 在 project root 及 1 層子目錄搜尋 *.sln
   └─ 找到 → 確認為 .NET 專案，跳到步驟 3

2. 在 project root 及 1 層子目錄搜尋 *.csproj
   └─ 找到 → 確認為 .NET 專案，繼續步驟 3
   └─ 未找到 → return false（非 .NET 專案）

3. 嘗試讀取 TargetFramework 版本
   └─ 版本 >= 6.0 → return true（dotnet confirmed）
   └─ 無法確認版本 → return true（保守確認）
```

---

## 偵測結果

```yaml
# 偵測成功
detected: true
framework: dotnet
confidence: HIGH
dotnet_version: "8.0"
solution_file: "MyProject.sln"
project_files:
  - "src/MyProject.Api/MyProject.Api.csproj"
  - "src/MyProject.Domain/MyProject.Domain.csproj"
  - "tests/MyProject.Tests/MyProject.Tests.csproj"

# 偵測失敗
detected: false
reason: "No .sln or .csproj file found"
```

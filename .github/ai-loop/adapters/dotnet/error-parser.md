# .NET 8 Adapter — Error Parser

> `parseErrorOutput(rawOutput)` 實作：將 dotnet format / MSBuild / xUnit 工具輸出轉為統一 ParsedError[] 格式。

## dotnet format JSON 報告解析（Lint Phase）

### 輸入格式（`dotnet format --report dotnet-format-report.json`）

```json
[
  {
    "DocumentId": {
      "ProjectId": { "Id": "..." },
      "Id": "..."
    },
    "FileName": "src/Infrastructure/Repositories/UserRepository.cs",
    "FilePath": "/project/src/Infrastructure/Repositories/UserRepository.cs",
    "FileChanges": [
      {
        "LineNumber": 42,
        "CharNumber": 5,
        "DiagnosticId": "IDE0003",
        "FormatDescription": "Remove qualification"
      }
    ]
  }
]
```

### 解析規則

| 欄位       | 映射來源                                                     |
| ---------- | ------------------------------------------------------------ |
| `error_id` | `dotnet-format-{diagnosticId_lower}-{filename_slug}-line{N}` |
| `severity` | `BLOCK`（`dotnet format --verify-no-changes` 失敗）          |
| `tool`     | `"dotnet-format"`                                            |

### 常見 DiagnosticId 對應

| DiagnosticId | 中文說明                                      | severity |
| ------------ | --------------------------------------------- | -------- |
| `IDE0003`    | 移除不必要的 `this.` 限定符                   | WARN     |
| `IDE0055`    | 格式問題（縮排、換行）                        | BLOCK    |
| `CS8600`     | Nullable 警告：將 null 賦值給非 nullable 型別 | BLOCK    |
| `CS8602`     | 解引用可能為 null 的參考                      | BLOCK    |

---

## MSBuild / dotnet build 錯誤解析（Build Phase）

### 輸入格式（`dotnet build` stdout）

```
src/Infrastructure/Repositories/UserRepository.cs(42,15): error CS0246: The type or namespace name 'UserDto' could not be found [MyProject.Infrastructure.csproj]
src/Domain/Entities/User.cs(18,8): warning CS8618: Non-nullable property 'Name' must contain a non-null value [MyProject.Domain.csproj]
```

### 解析規則

| 欄位       | 映射來源                                        |
| ---------- | ----------------------------------------------- |
| `error_id` | `dotnet-{csCode_lower}-{filename_slug}-line{N}` |
| `severity` | `error` → `BLOCK`；`warning` → `WARN`           |
| `tool`     | `"msbuild"`                                     |

### 常見 C# 錯誤代碼

| CS Code | 說明                                            |
| ------- | ----------------------------------------------- |
| CS0246  | 找不到型別或命名空間（缺少 using 或 reference） |
| CS7036  | 沒有提供對應的 required 參數                    |
| CS8618  | Non-nullable 屬性未初始化（Nullable 違規）      |
| CS8602  | 取消引用可能為 null 的參考（需要 null check）   |
| CS0103  | 名稱 X 在當前 context 中不存在                  |

---

## xUnit / dotnet test 輸出解析（Test Phase）

### 輸入格式（TRX 或 stdout）

```
  Failed UserRepositoryTests.GetById_WhenUserExists_ReturnsUser [42 ms]
  Error Message:
   Assert.Equal() Failure
   Expected: User { Id = 1, Name = "Alice" }
   Actual: null
  Stack Trace:
   at UserRepositoryTests.cs:line 67
```

### 解析規則

| 欄位       | 映射來源                                     |
| ---------- | -------------------------------------------- |
| `error_id` | `xunit-test-fail-{test_method_slug}-line{N}` |
| `severity` | `BLOCK`（測試失敗）                          |
| `tool`     | `"xunit"`                                    |

### 測試覆蓋率（WARN 條件）

| 條件         | severity | message                                     |
| ------------ | -------- | ------------------------------------------- |
| 覆蓋率 < 80% | WARN     | "Coverage is {N}%, below the 80% threshold" |
| 覆蓋率 < 60% | BLOCK    | "Coverage is critically low at {N}%"        |

---

## error_id 生成範例

```
dotnet format IDE0055, UserRepository.cs, line 42
→ dotnet-format-ide0055-user-repository-line42

Build error CS0246, UserRepository.cs, line 42
→ dotnet-cs0246-user-repository-line42

xUnit test fail, UserRepositoryTests.cs, line 67
→ xunit-test-fail-user-repository-tests-line67
```

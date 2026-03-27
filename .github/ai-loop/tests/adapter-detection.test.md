# Adapter Detection — 引擎測試案例

> TC-DET-01 ~ TC-DET-10 | 參考：adapters/adapter-registry.md、adapters/\*/detector.md

---

## TC-DET-01：Angular + WEC 專案偵測

**目標**：驗證 angular-wec Adapter 正確偵測 Angular + WEC 專案。

**前置條件**：專案根目錄包含以下檔案：

```
package.json          # 含 @angular/core 17.x
angular.json          # Angular CLI 設定
node_modules/@wec/component-library/  # WEC 套件已安裝
```

**預期行為**：

1. Chain of Responsibility 優先嘗試 angular-wec（priority: 10）
2. 偵測到 `package.json` + `@angular/core` + `angular.json` → 通過基本偵測
3. 偵測到 `@wec/component-library` → 通過 WEC 特定偵測
4. 返回 angular-wec Adapter

**驗證項目**：

- [ ] `framework` = `"angular-wec"`
- [ ] 版本檢查通過（Angular ≥ 17.0.0, TypeScript ≥ 5.0.0, Node.js ≥ 18.0.0）
- [ ] 偵測優先級：angular-wec 優先於 dotnet 和 python
- [ ] 偵測結果寫入 LoopState 的 `framework` 欄位

---

## TC-DET-02：.NET 8 專案偵測

**目標**：驗證 dotnet Adapter 正確偵測 .NET 8 專案。

**前置條件**：專案根目錄包含以下檔案：

```
MyProject.sln
src/MyProject/MyProject.csproj    # 含 <TargetFramework>net8.0</TargetFramework>
```

**預期行為**：

1. angular-wec detector 嘗試偵測 → 失敗（無 package.json / angular.json）
2. dotnet detector 嘗試偵測（priority: 20）
3. 偵測到 `.sln` + `.csproj` → 通過基本偵測
4. 確認 `<TargetFramework>net8.0</TargetFramework>` → 版本通過
5. 返回 dotnet Adapter

**驗證項目**：

- [ ] `framework` = `"dotnet"`
- [ ] `.sln` 或 `.csproj` 偵測成功
- [ ] TargetFramework 包含 `net8.0`
- [ ] angular-wec detector 在 dotnet 專案中正確返回 false

---

## TC-DET-03：Python 3.10+ 專案偵測

**目標**：驗證 python Adapter 正確偵測 Python 專案。

**前置條件**：專案根目錄包含以下檔案：

```
pyproject.toml        # 含 python_requires = ">=3.10"
requirements.txt
src/main.py
tests/test_main.py
```

**預期行為**：

1. angular-wec detector → 失敗
2. dotnet detector → 失敗
3. python detector 嘗試偵測（priority: 30）
4. 偵測到 `pyproject.toml` + `requirements.txt` → 通過基本偵測
5. 確認 `python_requires = ">=3.10"` → 版本通過
6. 返回 python Adapter

**驗證項目**：

- [ ] `framework` = `"python"`
- [ ] `pyproject.toml` 或 `requirements.txt` 偵測成功
- [ ] Python 版本 ≥ 3.10 確認
- [ ] angular-wec 與 dotnet detector 在 Python 專案中正確返回 false

---

## TC-DET-04：未知框架 → Escape Hatch

**目標**：驗證所有 Adapter 偵測失敗時觸發 Escape Hatch。

**前置條件**：專案目錄不含任何已知框架的識別檔案（無 package.json、無 .sln/.csproj、無 pyproject.toml）。

**預期行為**：

1. angular-wec detector → 失敗
2. dotnet detector → 失敗
3. python detector → 失敗
4. 觸發 Escape Hatch（`reason: "framework_unknown"`）

**預期輸出**：

```yaml
---LOOP-STATE---
round: 1
phase: init
result: ESCAPED
framework: unknown
spec_hash: "..."
errors:
  - error_id: "engine-framework-unknown-line0"
    severity: BLOCK
    tool: adapter-registry
    message: "No framework adapter matched the project structure"
---END-LOOP-STATE---
```

**驗證項目**：

- [ ] `framework` = `"unknown"`
- [ ] `result` = `ESCAPED`
- [ ] 錯誤訊息明確說明無法偵測框架
- [ ] Loop 不繼續執行

---

## TC-DET-05：Chain of Responsibility 優先級順序

**目標**：驗證偵測鏈嚴格按照 priority 數值由小到大執行。

**前置條件**：使用包含多個框架特徵的 monorepo 專案。

**偵測順序**：

```
1. angular-wec  (priority: 10) → 最先嘗試
2. dotnet       (priority: 20) → 第二
3. python       (priority: 30) → 第三
4. fallback     → Escape Hatch
```

**驗證項目**：

- [ ] priority 數值越小，偵測順序越靠前
- [ ] 第一個偵測成功的 Adapter 立即返回，不繼續嘗試後續 Adapter
- [ ] priority 以 10 為間距，便於未來插入新 Adapter

---

## TC-DET-06：Composite Adapter 偵測（Multi-Framework）

**目標**：驗證 monorepo 中多個框架被正確偵測並組合為 Composite Adapter。

**前置條件**：專案結構：

```
frontend/
  package.json      # @angular/core + @wec/component-library
  angular.json
backend/
  pyproject.toml    # Python 3.10+
  requirements.txt
```

**預期行為**：

1. angular-wec detector 偵測到 `frontend/` 子目錄 → 成功
2. python detector 偵測到 `backend/` 子目錄 → 成功
3. 建立 Composite Adapter：primary = angular-wec, secondary = python

**預期輸出**：

```yaml
composite:
  primary: angular-wec
  secondary: python
  scope:
    angular-wec: "frontend/"
    python: "backend/"
```

**驗證項目**：

- [ ] `primary` 為 priority 最小的框架（angular-wec）
- [ ] `secondary` 為第二偵測到的框架
- [ ] `scope` 正確映射各框架的子目錄
- [ ] 各 Phase 依 scope 分別使用對應 Adapter

---

## TC-DET-07：.NET 版本降級警告

**目標**：驗證偵測到 .NET 6/7（非 .NET 8）時仍使用 dotnet Adapter 但產生 WARN。

**前置條件**：專案 `.csproj` 含 `<TargetFramework>net6.0</TargetFramework>`。

**預期行為**：

1. dotnet detector 偵測到 `.csproj` → 通過基本偵測
2. TargetFramework 為 `net6.0`（非 `net8.0`）→ 版本不完全匹配
3. 仍返回 dotnet Adapter，但 LoopState 增加 WARN

**預期輸出（warnings 區段）**：

```yaml
warnings:
  - error_id: "dotnet-version-mismatch-line0"
    severity: WARN
    tool: adapter-registry
    message: "Detected .NET 6.0, adapter optimized for .NET 8.0"
```

**驗證項目**：

- [ ] `framework` = `"dotnet"`（仍正確偵測）
- [ ] `warnings` 包含版本警告
- [ ] `severity` = `WARN`（不阻斷 Loop）
- [ ] Loop 正常繼續執行

---

## TC-DET-08：Angular WEC Fork 狀態偵測

**目標**：驗證 angular-wec detector 正確辨識 Fork 狀態與依賴模式。

**前置條件**：專案為 WEC Component Library 的 Fork，包含 `angular.json` 與 `@wec/component-library`。

**偵測維度**：

| 維度 | 可能值 | 說明 |
| --- | --- | --- |
| Fork 狀態 | CONFIGURED / NOT_CONFIGURED | 是否已完成 Fork 後的初始設定 |
| Fork 來源 | VALID / DIRECT_CLONE | 是否透過正確的 Fork 流程建立 |
| 依賴模式 | submodule / npm / NOT_INITIALIZED | WEC Library 的引入方式 |

**驗證項目**：

- [ ] Fork 狀態正確判斷（CONFIGURED vs NOT_CONFIGURED）
- [ ] Fork 來源正確判斷（VALID vs DIRECT_CLONE）
- [ ] 依賴模式正確判斷（submodule / npm / NOT_INITIALIZED）
- [ ] 不同組合狀態下 AI 行為正確調整

---

## TC-DET-09：Python wecpy 企業套件偵測

**目標**：驗證 python detector 正確辨識 wecpy 企業套件及其初始化狀態。

**前置條件**：專案含 `pyproject.toml`，dependencies 中含 `wecpy`。

**偵測維度**：

| 維度 | 可能值 | 說明 |
| --- | --- | --- |
| wecpy_detected | true / false | 是否偵測到 wecpy 套件 |
| wecpy_initialized | true / false | config.yaml 是否存在（PROD 或 PILOT） |

**預期行為**：

1. 基本 Python 偵測通過
2. 偵測到 `wecpy` 在 dependencies 中 → `wecpy_detected = true`
3. 檢查 `PROD/config.yaml` 或 `PILOT/config.yaml` 是否存在
4. 若存在 → `wecpy_initialized = true`
5. 自動載入 `wecpy.instructions.md`

**驗證項目**：

- [ ] `framework` = `"python"`
- [ ] `wecpy_detected` 旗標正確設定
- [ ] `wecpy_initialized` 旗標正確設定
- [ ] 偵測到 wecpy 時自動載入對應 instructions
- [ ] 未偵測到 wecpy 時不載入額外 instructions

---

## TC-DET-10：Adapter 介面完整性驗證

**目標**：驗證每個已註冊 Adapter 完整實作 `FrameworkAdapter` 介面的 9 個方法。

**前置條件**：三個 Adapter 目錄各含 4 個標準檔案。

**每個 Adapter 必須實作**：

| # | 方法 | 對應檔案 |
| --- | --- | --- |
| 1 | `getFrameworkName()` | detector.md |
| 2 | `getLintCommand()` | commands.yaml |
| 3 | `getTestCommand()` | commands.yaml |
| 4 | `getBuildCommand()` | commands.yaml |
| 5 | `getInstructionsPath()` | detector.md |
| 6 | `getReviewDimensions()` | review-dimensions.md |
| 7 | `parseErrorOutput()` | error-parser.md |
| 8 | `getIntegrationTestCommand()` | commands.yaml |
| 9 | `getIntegrationTestSetupCommand()` | commands.yaml |

**驗證項目**：

- [ ] angular-wec/：4 個檔案齊全（detector.md, commands.yaml, error-parser.md, review-dimensions.md）
- [ ] dotnet/：4 個檔案齊全
- [ ] python/：4 個檔案齊全
- [ ] 每個 commands.yaml 定義 lint / test / build / integration-test 指令
- [ ] 不支援的指令使用 NullCommand（`noop: true`）而非省略
- [ ] `getFrameworkName()` 返回值與 `loop-state.schema.yaml` 的 `framework` enum 一致

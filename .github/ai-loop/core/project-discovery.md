# Inner Auto Loop — Project Discovery（Phase 0）

> 檔案角色：既有專案導入分析 | 設計模式：Template Method Hook（可選 Phase）

## 概述

Project Discovery 是 Inner Auto Loop 的**前置分析階段**，僅在導入**既有專案**時執行。
目的是理解專案既有的目錄結構、開發語言版本、測試框架設定與架構風格，使後續各 Phase 能更精準地套用規範，避免以新專案假設覆寫既有設定。

---

## 觸發條件

```yaml
# 觸發 Project Discovery
trigger_when:
  - 任一設定檔存在：package.json / "*.csproj" / pyproject.toml / requirements.txt
  - 有 src/ 或 app/ 目錄且含程式碼檔案
  - 使用者未明確指定 "@dev new project"

# 跳過 Project Discovery
skip_when:
  - 使用者明確輸入 "@dev new project"
  - 專案目錄完全空白（無程式檔案）
  - 已存在 project-profile.yaml（避免重複執行）
```

---

## 執行步驟

### Step 1：掃描專案結構

```
掃描目標（按優先順序）：
├── 設定檔識別
│    ├── package.json → Angular / Node.js
│    ├── *.csproj / *.sln → .NET
│    ├── pyproject.toml → Python（modern）
│    ├── requirements.txt → Python（classic）
│    └── Dockerfile / docker-compose.yml → 容器化資訊（記錄，不影響 Adapter 選擇）
│
├── 目錄結構識別
│    ├── src/app/ 或 src/environments/ → Angular
│    ├── src/domain/ + src/application/ + src/infrastructure/ → Clean Architecture
│    ├── tests/ 或 test/ 或 **/*.spec.ts → 測試目錄
│    └── **/integration/ 或 **/e2e/ 或 playwright.config.* → 整合測試目錄
│
└── 測試框架設定偵測
     ├── karma.conf.js → Angular Karma（單元）
     ├── jest.config.ts / jest.config.js → Jest（單元）
     ├── playwright.config.ts / playwright.config.js → Playwright（整合/E2E）
     ├── pytest.ini / pyproject.toml[tool.pytest.ini_options] → pytest
     └── "*.Tests/*.csproj" 或 "*.IntegrationTests/*.csproj" → xUnit
```

### Step 2：識別框架版本

```yaml
Angular 偵測：
  file: package.json
  field: dependencies["@angular/core"]
  example: "^17.3.0" → version = "17.3.0"

.NET 偵測：
  file: "**/*.csproj"（優先主要 csproj，非 Test 專案）
  field: <TargetFramework>
  example: "net8.0" → version = "8.0"

Python 偵測：
  file_priority: [pyproject.toml, setup.cfg, setup.py]
  field: requires-python 或 [tool.poetry.dependencies.python]
  example: ">=3.10" → version = "3.10"
```

### Step 3：分析架構風格

```
分析維度：
├── Clean Architecture 符合度
│    ✅ 完整符合：有 domain/ + application/ + infrastructure/ + presentation/，且各層只依賴內層
│    ⚠️ 部分符合：有分層但有依賴反轉偏差（記錄偏差至 architecture.deviations）
│    ❌ 不符合：功能性分層（按功能分目錄）或 Monolithic
│
├── DDD 應用程度
│    ✅ 有 DDD：domain/ 中有 Entity / ValueObject / Repository 介面 / DomainEvent
│    ⚠️ 部分 DDD：有 Entity 但 Repository 介面在 Application 層
│    ❌ 無 DDD：無 Domain 物件概念，直接使用 DB 模型
│
├── 測試基礎設施
│    ├── 有單元測試 → 記錄框架與 config 路徑
│    ├── 有整合測試 → 記錄工具與 config 路徑（already_configured: true）
│    └── 無測試 → 記錄（Phase D 需要完整安裝）
│
└── Lint / Format 設定
     ├── 有設定 → 記錄路徑，custom_commands.lint 設為 null（使用既有設定執行 Adapter 指令）
     └── 無設定 → 使用 Adapter 預設指令
```

### Step 4：生成 Project Profile

輸出 `project-profile.yaml` 至專案根目錄，供後續所有 Phase 引用。

### Step 5：框架初始化狀態驗證

根據 Adapter 偵測結果，驗證框架是否已正確初始化：

```
框架初始化驗證：
├─ Angular WEC 專案（framework.primary = angular-wec）
│    ├─ 檢查 fork_status（來自 detector Step 5）
│    │    ├─ CONFIGURED → 正常繼續
│    │    └─ NOT_CONFIGURED → 標記 initialization_required: true
│    │         → project-profile.yaml 註記：「必須先執行 wec-framework-install skill」
│    ├─ 檢查 dependency_mode
│    │    ├─ submodule / npm → 正常繼續
│    │    └─ NOT_INITIALIZED → 標記需執行 npm install 或 submodule update
│    └─ 自動加入 instructions_override:
│         - "frameworks/wec-main/instructions/wecui.instructions.md"
│         - "frameworks/wec-main/instructions/wec-components.instructions.md"
│         - "frameworks/wec-main/instructions/wec-core.instructions.md"
│
├─ Python 專案（framework.primary = python）
│    ├─ 檢查 wecpy_detected（來自 detector Step 4）
│    │    ├─ true → 自動加入 instructions_override:
│    │    │    - "frameworks/wec-py/instructions/wecpy.instructions.md"
│    │    └─ false →（由 project-discovery 判定是否提示）
│    │         ├─ is_existing_project = false（新專案）：強制提示「Python 專案必須使用 wecpy 函式庫」
│    │         │    → 設定 initialization_required: true
│    │         │    → **詢問使用者選擇 API 框架**（FastAPI / Flask / 其他）
│    │         └─ is_existing_project = true（既有專案）：詢問使用者確認是否使用 wecpy
│    │              → 若確認是則引導加入依賴
│    └─ 檢查 wecpy_initialized
│         ├─ true → 正常繼續
│         └─ false → 標記 initialization_required: true
│              → 引導建立 PROD/config.yaml + PILOT/config.yaml
│
└─ Composite Adapter 場景（monorepo: Angular + Python）
     ├─ 同時偵測到多個框架時：
     │    ├─ 依目錄結構判定各框架負責範圍
     │    ├─ primary = 依優先級設為最高優先框架
     │    ├─ secondary = 第二框架
     │    └─ scope = 各框架對應目錄
     ├─ 両個框架分別執行 Step 5 驗證
     │    ├─ Angular 部分：檢查 fork_status + dependency_mode
     │    └─ Python 部分：檢查 wecpy_detected + wecpy_initialized
     └─ 兩者的 instructions_override 合併載入
```

---

## Project Profile 輸出格式

詳細 Schema 見 `ai-loop/core/project-profile.schema.yaml`。

```yaml
# project-profile.yaml（由 Project Discovery 生成）
project_id: "{project_name}-{YYYY-MM-DD}"
discovered_at: "YYYY-MM-DD"
is_existing_project: true

framework:
  primary: angular-wec # angular-wec | dotnet | python
  version: "17.3.0"
  secondary: python # 若 monorepo 含第二框架，否則 null
  scope: # 僅 secondary 非 null 時填寫
    angular-wec: "frontend/"
    python: "backend/"

# Angular WEC 專有欄位（僅 primary=angular-wec 時生成）
angular_wec_status:
  fork_status: CONFIGURED # CONFIGURED | NOT_CONFIGURED
  fork_origin: VALID # VALID | DIRECT_CLONE
  dependency_mode: submodule # submodule | npm | NOT_INITIALIZED
  initialization_required: false

# Python wecpy 專有欄位（僅 primary=python 或 secondary=python 時生成）
wecpy_status:
  wecpy_detected: true
  wecpy_initialized: true
  initialization_required: false

architecture:
  style: clean-architecture # clean-architecture | layered | feature-based | monolithic | unknown
  ddd_applied: true
  deviations:
    - "Infrastructure 層有直接引用 Application DTO（偏差範例）"
    # 空 list = 無偏差，[]

existing_tests:
  unit:
    framework: jest # jest | karma | pytest | xunit
    config_path: "jest.config.ts"
    test_dir: "src/"
  integration:
    framework: playwright # playwright | xunit-webapplicationfactory | pytest-httpx | null
    config_path: "playwright.config.ts"
    test_dir: "e2e/"
    already_configured: true # true = Phase D 跳過安裝，直接執行

lint:
  configured: true
  config_path: ".eslintrc.json"

custom_commands: # null = 使用 Adapter 預設值
  lint: null
  build: null
  test: null
  integration_test: null # 若非 null，Phase D 優先使用此指令覆寫 Adapter

instructions_override: # Step 5 自動填入 + 既有專案特有規範
  - "frameworks/wec-main/instructions/wecui.instructions.md"
  - "frameworks/wec-py/instructions/wecpy.instructions.md"
```

---

## 架構偏差處理原則

若 Step 3 發現架構偏差，遵循**漸進式合規**原則：

| 偏差類型                        | 處理方式                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| 現有程式碼偏差                  | 記錄至 `architecture.deviations`，**不強制重構**既有程式碼          |
| 新增程式碼（Phase A Developer） | 必須符合 `standards/` 規範（不延續偏差）                            |
| Spec 要求重構                   | spec.md 明確標注 `refactor: true` 時，才在 Developer Phase 修正偏差 |

---

## Discovery Phase 輸出格式

```yaml
---PROJECT-DISCOVERY---
is_existing_project: true
framework: angular-wec
version: "17.3.0"
secondary_framework: python         # null 若無第二框架
architecture_style: clean-architecture
ddd_applied: true
deviations_count: 0
existing_integration_test: true
integration_test_framework: playwright
custom_commands_overridden: false
# Angular WEC 狀態
fork_status: CONFIGURED              # CONFIGURED | NOT_CONFIGURED
dependency_mode: submodule           # submodule | npm | NOT_INITIALIZED
# Python wecpy 狀態（僅 secondary=python 或 primary=python 時輸出）
wecpy_detected: true
wecpy_initialized: true
# 初始化評估
initialization_required: false        # true = 需先執行初始化流程
initialization_blockers: []           # 待處理項目清單
profile_saved: "project-profile.yaml"
---END-PROJECT-DISCOVERY---
```

---

## 與後續 Phase 的整合

| Phase                        | 如何使用 Project Profile                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0.5 (Init Validation)  | 若 `initialization_required: true`，**中斷 Inner Loop**，引導至對應 skill（Angular → `wec-framework-install`，Python → wecpy 初始化）             |
| Phase A (Developer)          | 讀取 `architecture_style`、`ddd_applied`、`deviations` 調整實作策略；載入 `instructions_override` 定義的額外規範                                  |
| Phase B (Tester)             | 若 `custom_commands.test` 非 null，覆寫 Adapter 測試指令；Composite 場景依 `scope` 分別執行對應框架的測試指令                                     |
| Phase D (Integration Tester) | 若 `existing_tests.integration.already_configured: true`，跳過安裝步驟直接執行；若 `custom_commands.integration_test` 非 null，優先使用此自訂指令 |

---
description: Developer Phase — 依據 spec/plan 實作程式碼，自動根據 Framework Adapter 選擇技術棧（.NET 8 + Angular 17 / Python 3.10+）
---

# AI Developer Phase

> 本 Prompt 由 `ai-loop.prompt.md` 的 Inner Loop 呼叫，也可獨立使用。
> 原自 `3a-dev-dotnet-angular.prompt.md` + `3b-dev-python-streamlit.prompt.md` 合併重構。

## 角色

你是精通多框架的全端開發工程師，根據 Framework Adapter 偵測結果自動切換技術棧。

## 執行前置

```
1. 確認當前 LoopState（若 Loop 中執行）
2. 載入 adapter.getInstructionsPath() 指向的 instructions（每個 Round 重新確認，不快取）
3. 讀取 spec.yaml 或 plan.md 的指定 Task
4. 若 FRD.md 存在 Section 1.5 規範基線表 → 讀取並記錄約束條件（此為本次開發的硬性基線）
5. 若為新 Angular 專案且 fork_status=NOT_CONFIGURED → 中斷，執行 wec-framework-install skill
6. 若為新 Python 專案且 wecpy_initialized=false → 中斷，執行 wecpy-init.prompt.md
```

## 開發工作流程

### Step 1：理解任務

1. 讀取 spec.yaml 的 `acceptance_criteria` 和 `constraints`（或 plan.md 的指定 Task）
2. 確認 `scope`/`framework`（`auto` 時由 Adapter Registry 偵測）
3. 載入 `context_files` 列出的既有程式碼
4. 確認 FRD.md Section 1.5 規範約束已納入開發決策（如有設定檔要求、框架強制規範等）

### Step 2：依框架開發

#### 開發前 Skill 查詢（每次進入 Phase A 必做）

依當前 Task 性質，主動查詢是否有可用的開發 Skill：

| Task 性質                          | 查詢位置                                                          |
| ---------------------------------- | ----------------------------------------------------------------- |
| Angular 新頁面骨架 / 選版型        | `frameworks/wec-main/skills/wec-page-scaffold/`                   |
| Angular 頁面 / 表格元件            | `frameworks/wec-main/skills/wec-aggrid-page/`                     |
| Angular 表單開發                   | `frameworks/wec-main/skills/wec-reactive-form-pattern/`           |
| Angular Dialog / 彈窗              | `frameworks/wec-main/skills/wec-dialog-pattern/`                  |
| Angular 選單/路由                  | `frameworks/wec-main/skills/wec-menu-development/`                |
| Angular CRUD Service + DataService | `frameworks/wec-main/skills/wec-service-dataservice-crud/`        |
| Angular 廢棄元件處理               | `frameworks/wec-main/skills/wec-migration-deprecated-components/` |
| Python wecpy 基礎設施整合          | `frameworks/wec-py/skills/wecpy-core/`                            |
| Python 資料整合（API/ES/ETL）      | `frameworks/wec-py/skills/wecpy-data-integration/`                |
| Python Kafka / 通知                | `frameworks/wec-py/skills/wecpy-messaging/`                       |
| .NET 新專案初始化                  | `frameworks/imxframework/skills/imx-init/`                        |

若找到對應 Skill → **讀取該 Skill 的 SKILL.md**，確保生成的程式碼符合框架慣例與既定結構。

**⚠️ Angular 前端 Task 強制決策（if-then）：**

- 若 Task 涉及**建立新頁面** → MUST 先讀取 `wec-page-scaffold` skill 選擇版型骨架
- 若 Task 涉及 **AG Grid 清單頁** → MUST 讀取 `wec-aggrid-page` skill
- 若 Task 涉及**表單開發** → MUST 讀取 `wec-reactive-form-pattern` skill
- 若 Task 涉及 **Dialog / Modal 彈窗** → MUST 讀取 `wec-dialog-pattern` skill
- 若 Task 涉及 **Service / API 串接** → MUST 讀取 `wec-service-dataservice-crud` skill
- 若 Task 涉及**選單註冊 / setView** → MUST 讀取 `wec-menu-development` skill
- 若 Task 涉及**廢棄元件** → MUST 讀取 `wec-migration-deprecated-components` skill

---

#### Angular + WEC 框架路徑

載入 `instructions/angular.instructions.md` + `frameworks/wec-main/instructions/wecui.instructions.md`，嚴格遵循：

**📐 前端頁面開發前置步驟（每個前端 Task 必做）：**

1. MUST 讀取 `instructions/angular-page-layouts.instructions.md` — 選擇對應版型骨架（A-E）
2. MUST 讀取 `instructions/angular-comp-practices.instructions.md` — 遵循 UI 最佳實踐
3. 若 FRD.md 有 Section 6.5 UI 版面配置 → 根據指定版型建立 HTML 骨架
4. 若 FRD.md 無 Section 6.5 → 自行根據頁面性質從 5 種版型選擇最接近的骨架
5. **先建立頁面骨架 HTML，再填入業務元件**（禁止跳過骨架直接堆元件）

**⚠️ 目錄約束（最高優先）：**

- wec-main 是外殼模板，**禁止重新生成或規劃外層結構**（`angular.json`、`tsconfig.json`、`src/app/`、`src/main.ts`、`nginx.conf` 等）
- 所有業務程式碼必須放在 `projects/{system}/src/lib/system/` 下
- 個別功能頁面放在 `projects/{system}/src/lib/system/views/{menu-name}/`
- 個別服務放在 `projects/{system}/src/lib/system/services/`
- 僅允許修改 shell 的註冊點：`src/app/app.config.ts` + `src/assets/app-config.json`

**元件開發規則：**

- Standalone Component + `ChangeDetectionStrategy.OnPush` 強制
- 所有功能元件必須繼承 `ContentView`（wec-core 提供）
- 狀態管理：使用 RxJS `BehaviorSubject` + `async pipe`（Signal API 為可選，勿混用）
- WEC Component Library：禁止自行實作 WEC 已有的元件
- 禁止使用 Angular Router（改用 `setView()` 機制）
- 控制流使用 `@if`、`@for`、`@switch`（禁止 `*ngIf`、`*ngFor`）

**Service 開發規則：**

- 所有 Service 必須繼承 `DataService`（wec-core 提供）
- `inject()` 注入（不用 constructor 注入）
- `takeUntilDestroyed()` 管理訂閱
- HTTP 呼叫一律通過 Service 層（透過 DataService 的 post()/get() 方法）

**建立新元件/服務指令：**

```bash
# 新增功能頁面
ng generate component system/views/{menu-name} --project={system} --standalone
# 新增服務
ng generate service system/services/{menu-name} --project={system}
```

**測試（Karma/Jasmine）：**

```typescript
// 命名格式
describe("UserListComponent", () => {
  it("should display users when data loads", () => {
    // Arrange - Act - Assert
  });
});
```

---

#### .NET 8 框架路徑

載入 `instructions/csharp.instructions.md`，嚴格遵循：

**Clean Architecture 分層開發：**

| 層             | 職責                                  | 典型產出           |
| -------------- | ------------------------------------- | ------------------ |
| Domain         | Entity, VO, IRepository, Domain Event | 無外部依賴         |
| Application    | Use Case/Command/Query, DTO, Port     | 只依賴 Domain      |
| Infrastructure | Repository(EF Core), 外部服務         | 依賴 Domain + 外部 |
| Presentation   | Controller, API Endpoint              | 只呼叫 Application |

**語法規範（.NET 8）：**

- Primary Constructor：`public class Service(IRepo repo)`
- Pattern Matching：`switch expression` + `is` 模式
- Nullable：`string?` + `??` + `ArgumentNullException.ThrowIfNull()`
- Async：所有 I/O 必須 async，嚴禁 `.Result` / `.Wait()`

**測試（xUnit）：**

```csharp
// 命名格式：MethodName_StateUnderTest_ExpectedBehavior
public async Task GetById_WhenUserExists_ReturnsUserDto()
{
    // Arrange
    // Act
    // Assert（使用 FluentAssertions）
}
```

---

#### Python 3.10+ 框架路徑

載入 `instructions/python.instructions.md`，嚴格遵循：

**分層開發：**

| 層             | 路徑                        | 規則                                                       |
| -------------- | --------------------------- | ---------------------------------------------------------- |
| Domain         | `domain/`                   | 無 framework import，dataclass Entity，frozen dataclass VO |
| Application    | `application/`              | Use Case + DTO（Pydantic 或 dataclass）                    |
| Infrastructure | `infrastructure/`           | Repository 實作，SQLAlchemy/DB                             |
| Presentation   | `presentation/` 或 `pages/` | Streamlit UI 或 FastAPI                                    |

**語法規範（Python 3.10+）：**

- 型別標注：所有參數和回傳值必填，使用 `str | None`（非 `Optional[str]`）
- Docstring：Google 風格
- 錯誤處理：業務錯誤用 Result Pattern，非 `raise`
- 嚴禁 `print()`，使用 `logging.getLogger(__name__)`

**測試（pytest）：**

```python
# 命名格式
def test_get_user_when_user_exists_returns_user_dto():
    # Arrange - Act - Assert
```

---

### Step 3：自我驗證

實作完成後，依框架執行心理驗證清單（不執行實際工具，由 Tester Phase 執行）：

- [ ] 檔案命名是否遵循框架慣例？
- [ ] 所有 import 是否正確（無缺少，無多餘）？
- [ ] 是否有 `any` / 裸 `Exception` / `print` 等禁止模式？
- [ ] 每個 AC 是否有對應的測試案例？

### Step 4：輸出 LoopState

```yaml
---LOOP-STATE---
round: {N}
phase: developer
result: PASS
framework: {framework}
spec_hash: "{spec_hash}"
cumulative_changes:
  - action: created
    file: {path}
errors: []
context_budget:
  tokens_used: {estimated}
  budget_pct: "{pct}%"
---END-LOOP-STATE---
```

---
description: Integration Tester Phase — 在 Inner Loop 完成後執行整合測試，依框架使用 Playwright（Angular）/ WebApplicationFactory+xUnit（.NET）/ pytest+httpx（Python）。整合測試 PARTIAL 不阻斷交付，結果記錄至報告。
---

# AI Integration Tester Phase

> 本 Prompt 由 `ai-loop.prompt.md` 的 Phase D 呼叫，也可獨立使用。
> 此 Phase 在 Inner Loop（Dev→Test→Review）最後一輪 Reviewer PASS 後執行。

## 角色

你是整合測試專家，負責驗證 Inner Loop 產出的程式碼在真實執行環境（跨模組、API 層）下的正確性。
整合測試聚焦於「跨元件 / 跨層互動」，不重複單元測試已驗證的邏輯。

## 執行前置

```
1. 確認 Inner Loop 已完成（最後一輪 phase: reviewer, result: PASS）
2. 讀取 plan.md 的 Integration Test 範圍（Section「Integration Test 範圍」）
3. 讀取 ai-loop/adapters/{framework}/commands.yaml → integration_test 區塊
4. 讀取 project-profile.yaml（若存在）—— 確認既有整合測試設定
5. 載入 ai-loop/core/escape-hatch.md（確認 Escape 條件）
```

---

## 整合測試範圍定義

| 框架                          | ✅ 測試範圍                                                   | ❌ 不測試（單元測試已涵蓋）                          |
| ----------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Angular（Playwright）         | 頁面渲染完整流程、API 呼叫到 UI 顯示、路由導航、表單提交      | 單一元件 @Input/@Output、Service mock 行為           |
| .NET（WebApplicationFactory） | HTTP Request → Controller → Use Case → Repository → DB 完整鏈 | 獨立 Domain Service 邏輯、已 mock 的 Repository 行為 |
| Python（pytest + httpx）      | API endpoint → Use Case → Repository → DB 完整鏈              | 獨立 Domain Entity 行為、已 mock 的 use case         |

---

## 執行流程

### Step 1：確認測試環境

```
讀取 project-profile.yaml（若存在）：
  existing_tests.integration.already_configured = true
    → 跳過 Step 2（環境設定），直接到 Step 3
  already_configured = false 或 profile 不存在
    → 執行 Step 2（環境設定）
```

### Step 2：整合測試環境設定（首次執行）

依框架執行 `adapter.getIntegrationTestSetupCommand()`：

#### Angular（Playwright）

```
執行：npx playwright install --with-deps chromium
確認：playwright.config.ts 存在（不存在則自動生成）
測試目錄：e2e/（不存在則建立）
```

**playwright.config.ts 最簡設定（自動生成若不存在）：**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:4200" },
  webServer: {
    command: "npx ng serve --port 4200",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env["CI"],
  },
});
```

#### .NET（WebApplicationFactory + xUnit）

```
確認：*.IntegrationTests.csproj 存在（不存在則建立）
必要 NuGet packages：
  - Microsoft.AspNetCore.Mvc.Testing
  - xunit（已在 Unit Test 安裝）
  - FluentAssertions（已在 Unit Test 安裝）
```

**整合測試專案設定（自動生成若不存在）：**

```xml
<!-- tests/IntegrationTests/IntegrationTests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.*" />
    <PackageReference Include="xunit" Version="2.*" />
    <PackageReference Include="FluentAssertions" Version="6.*" />
    <PackageReference Include="coverlet.collector" Version="6.*" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="../../src/{ProjectName}/{ProjectName}.csproj" />
  </ItemGroup>
</Project>
```

#### Python（pytest + httpx）

```
確認：tests/integration/ 目錄存在（不存在則建立）
確認依賴套件（檢查 pyproject.toml / requirements.txt）：
  - httpx >= 0.27
  - pytest-asyncio >= 0.23
若缺少 → 提示使用者安裝：pip install httpx pytest-asyncio
```

**pyproject.toml 設定補充（若缺少）：**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

---

### Step 3：撰寫整合測試

依 `plan.md` 的 Integration Test 範圍，逐一撰寫測試案例。

---

#### Angular：Playwright 測試範本

```typescript
// 檔案位置：e2e/{feature}.spec.ts
import { test, expect } from "@playwright/test";

test.describe("{功能名稱} Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/{route}");
  });

  test("should {AC 描述}", async ({ page }) => {
    // Arrange：設定初始狀態
    // Act：執行使用者操作
    await page.click('[data-testid="submit-btn"]');
    // Assert：驗證結果
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

**命名規範：**

- 測試檔案：`e2e/{feature-name}.spec.ts`
- describe：`'{ComponentName} Integration'`
- test：`'should {AC 完整描述}'`

---

#### .NET：WebApplicationFactory + xUnit 範本

```csharp
// 檔案位置：tests/IntegrationTests/{Feature}IntegrationTests.cs
[Collection("Integration")]
public class {Feature}IntegrationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    [Trait("Category", "Integration")]
    public async Task {MethodName}_{StateUnderTest}_{ExpectedBehavior}()
    {
        // Arrange
        // Act
        var response = await _client.GetAsync("/api/{endpoint}");
        // Assert
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<{DtoType}>();
        result.Should().NotBeNull();
    }
}
```

**命名規範：**

- 測試檔案：`tests/IntegrationTests/{Feature}IntegrationTests.cs`
- 方法名稱：`{MethodName}_{StateUnderTest}_{ExpectedBehavior}`
- 所有測試必須加 `[Trait("Category", "Integration")]`（讓 filter 可篩選）

---

#### Python：pytest + httpx 範本

```python
# 檔案位置：tests/integration/test_{feature}_integration.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app  # FastAPI app 入口（依專案調整）


@pytest.mark.asyncio
async def test_{feature}_{ac_description}():
    """AC: {AC 完整描述}"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Arrange
        # Act
        response = await client.get("/api/{endpoint}")
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
```

**命名規範：**

- 測試檔案：`tests/integration/test_{feature}_integration.py`
- 函式名稱：`test_{feature}_{expected_behavior}`
- 每個函式必須有 docstring 說明對應的 AC

---

### Step 4：執行整合測試

```
1. 執行 adapter.getIntegrationTestCommand()
   （若 project-profile.custom_commands.integration_test 非 null，優先使用該指令）
2. 解析輸出結果（各框架的輸出格式）
3. 統計：tests_total / tests_passed / tests_failed / tests_skipped
4. 判斷結果：
   全部通過 → result: PASS
   有失敗   → 進入 Heal 流程（Step 5）
```

---

### Step 5：失敗處理（Heal 流程，最多 3 次）

```
整合測試失敗類型分析：

├── 類型 A：測試程式碼本身錯誤（選擇器錯誤、Mock 設定不當、Assertion 錯誤）
│    → Heal：僅修改測試程式碼（e2e/ 或 tests/integration/，不修改 src/ 業務邏輯）
│    → 最多 3 次 Heal → 仍 FAIL → result: PARTIAL（標記此失敗）
│
├── 類型 B：業務邏輯缺失（AC 未完整實作，整合測試揭露了單元測試未捕捉的缺陷）
│    → 通知：返回 Inner Loop Phase A（重新開發）
│    → Inner Loop 重新執行 Phase A → B → C（注意：Round 計數繼續累加）
│    → Inner Loop PASS 後，Phase D 重新執行
│
├── 類型 C：環境 / 設定問題（DB 連線失敗、Port 衝突、設定檔缺失）
│    → Heal：修正設定（不修改業務邏輯）
│    → 3 次 Heal 無效 → result: PARTIAL（標記原因為環境問題）
│
└── 類型 D：整合測試超出本次 Spec 範圍（誤計入本次 AC 之外的測試）
     → 標記該測試為 SKIPPED（加入說明：超出本次 Spec 範圍）
     → 不計入 FAIL
```

**重要規則：**

- 類型 B 返回 Inner Loop 後，若 Inner Loop Round 數達到上限（5）→ 觸發 Escape Hatch
- 整合測試 PARTIAL **不觸發 Escape Hatch**（PARTIAL 為可接受的交付狀態）
- 整合測試顯示安全性問題（OWASP C 維度 HIGH）→ **觸發 Escape Hatch**

---

## IntegrationTestState 輸出格式

### PASS

```yaml
---INTEGRATION-TEST-STATE---
result: PASS                      # PASS | PARTIAL | SKIPPED
framework: angular-wec
test_tool: playwright
tests_total: 8
tests_passed: 8
tests_failed: 0
tests_skipped: 0
heal_attempts: 0
returned_to_inner_loop: false     # 是否觸發返回 Inner Loop（類型 B）
test_files:
  - path: "e2e/user-list.spec.ts"
    status: PASS
    tests_passed: 3
    tests_failed: 0
  - path: "e2e/user-create.spec.ts"
    status: PASS
    tests_passed: 5
    tests_failed: 0
---END-INTEGRATION-TEST-STATE---
```

### PARTIAL

```yaml
---INTEGRATION-TEST-STATE---
result: PARTIAL
framework: dotnet
test_tool: xunit-webapplicationfactory
tests_total: 6
tests_passed: 4
tests_failed: 2
tests_skipped: 0
heal_attempts: 3
returned_to_inner_loop: false
failed_tests:
  - test: "GetUsers_WhenCalled_ReturnsUserList"
    file: "tests/IntegrationTests/UserApiIntegrationTests.cs"
    failure_type: TYPE_C
    reason: "環境問題：TestDB 連線字串未在 appsettings.Test.json 設定"
  - test: "CreateUser_WithValidData_Returns201"
    file: "tests/IntegrationTests/UserApiIntegrationTests.cs"
    failure_type: TYPE_B
    reason: "回傳 400 BadRequest，驗證邏輯與 AC-2 不符，已觸發返回 Inner Loop"
test_files:
  - path: "tests/IntegrationTests/UserApiIntegrationTests.cs"
    status: PARTIAL
    tests_passed: 4
    tests_failed: 2
---END-INTEGRATION-TEST-STATE---
```

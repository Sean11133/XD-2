# Adapter 開發指南

# 檔案 #34 | 新增框架支援的完整步驟

## 設計原則（OCP）

Inner Auto Loop 的 Adapter 層遵循「開放/封閉原則」：

- **開放**：可以新增任何新的框架 Adapter
- **封閉**：新增 Adapter **不需要修改任何 Core 檔案**

---

## 新增 Adapter 的步驟（4 個檔案）

### 步驟 1：建立目錄

```
.github/ai-loop/adapters/{your-framework}/
```

### 步驟 2：建立 4 個必要檔案

#### 2a. `detector.md`

參考 `adapters/angular-wec/detector.md` 的格式。

必須包含：

- Marker Files 表格（哪些檔案代表此框架）
- 偵測算法（偽碼）
- 成功/失敗的輸出 YAML 格式
- `next_handler`：偵測失敗時傳給哪個偵測器

#### 2b. `commands.yaml`

必須實作 7 個 Required Methods，加上 2 個選用整合測試 Methods：

```yaml
framework: "your-framework-id"
display_name: "Your Framework Name"

getFrameworkName: "your-framework-id"
getLintCommand: "your-lint-command"
getTestCommand: "your-test-command"
getBuildCommand: "your-build-command"
getInstructionsPath: ".github/instructions/your-framework.instructions.md"
getReviewDimensions: ".github/ai-loop/adapters/your-framework/review-dimensions.md"

# 選填
getMarkerFiles:
  - "marker-file.ext"

parseErrorOutput: ".github/ai-loop/adapters/your-framework/error-parser.md"

# 整合測試（Phase D 使用）
# null = 此框架不支援整合測試，Phase D 標記為 SKIPPED
integration_test:
  command: "your-integration-test-command"
  failOnNonZeroExit: false
  timeout_seconds: 300

# null = 不需要額外安裝步驟
integration_test_setup: null
```

#### 2c. `error-parser.md`

必須包含：

- 每個工具的輸出格式
- BLOCK / WARN 的 Regex 模式
- error_id 生成規則
- Fast-Fail 策略

#### 2d. `review-dimensions.md`

必須包含：

- D1：Framework SSoT 合規性（必查）
- D2–DN：框架特有的審查維度
- Review 通過條件表格

### 步驟 3：在 adapter-registry.md 新增一行

```yaml
your-framework:
  adapter_path: adapters/your-framework/
  display_name: "Your Framework Name"
  detector: adapters/your-framework/detector.md
  priority: 4 # 在現有優先序後新增
```

**這是唯一需要修改的現有檔案！**

### 步驟 4：更新 Chain of Responsibility

在前一個偵測器的「失敗輸出」中，將 `next_handler` 指向你的新偵測器。

---

## OCP 合規驗證清單

完成後，確認以下項目全部為 ✅：

- [ ] 新建 `adapters/{framework}/detector.md`
- [ ] 新建 `adapters/{framework}/commands.yaml`（含 7 個 Required Methods + 2 個整合測試選用 Methods）
- [ ] 新建 `adapters/{framework}/error-parser.md`
- [ ] 新建 `adapters/{framework}/review-dimensions.md`
- [ ] 在 `adapter-registry.md` 新增 1 行（唯一修改的現有檔案）
- [ ] **未修改** `core/loop-orchestrator.md`
- [ ] **未修改** `core/loop-state.schema.yaml`
- [ ] **未修改** `prompts/ai-loop*.prompt.md`
- [ ] **未修改** `instructions/ai-loop-*.instructions.md`

---

## Adapter Adapter Interface 的 6 個方法說明

| 方法                    | 說明                   | 範例                                                          |
| ----------------------- | ---------------------- | ------------------------------------------------------------- |
| `getFrameworkName()`    | 框架唯一識別符         | `"angular-wec"`                                               |
| `getLintCommand()`      | Lint 命令              | `"npx eslint . --ext .ts"`                                    |
| `getTestCommand()`      | 測試命令               | `"npx jest"`                                                  |
| `getBuildCommand()`     | Build 命令             | `"npx ng build"`                                              |
| `getInstructionsPath()` | SSoT Instructions 路徑 | `".github/instructions/wec-core.instructions.md"`             |
| `getReviewDimensions()` | Review 維度檔案路徑    | `".github/ai-loop/adapters/angular-wec/review-dimensions.md"` |

---

## 完整範例：新增 Vue.js Adapter

```
# 步驟 1: 建立目錄
.github/ai-loop/adapters/vue/

# 步驟 2: 建立 4 個檔案
detector.md        → 偵測 vite.config.ts / vue.config.js
commands.yaml      → lint: "npx eslint .", test: "npx vitest", build: "npx vite build"
error-parser.md    → 解析 ESLint + Vitest 輸出
review-dimensions.md → Vue 3 Composition API, TypeScript 合規

# 步驟 3: adapter-registry.md 新增
vue:
  adapter_path: adapters/vue/
  priority: 4

# 步驟 4: 在 python/detector.md 的失敗 next_handler 改為 vue
# 然後在 vue/detector.md 的失敗 next_handler 設為 UNKNOWN_FRAMEWORK
```

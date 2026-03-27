# Adapter Registry — 框架偵測與 Adapter 載入

> 設計模式：Factory Method + Chain of Responsibility + Composite
> Registry 根據 project 特徵自動選擇正確的 Adapter。

## 偵測鏈（Chain of Responsibility）

Adapters 按 `priority` 數值由小到大嘗試偵測，第一個偵測成功的 Adapter 被使用：

```
1. angular-wec/detector.md    priority: 10 （更具體，優先偵測）
2. dotnet/detector.md         priority: 20
3. python/detector.md         priority: 30
4. [fallback] → Escape Hatch（framework=unknown）
```

> **priority 規約**：數值越小優先度越高。建議以 10 為間距，留給未來插入新 Adapter 時不需要重新編號。

---

## 已註冊 Adapters

| 索引 | 框架          | Adapter 路徑                    | priority | 偵測優先級     |
| ---- | ------------- | ------------------------------- | -------- | -------------- |
| 1    | Angular + WEC | `ai-loop/adapters/angular-wec/` | 10       | HIGH（最優先） |
| 2    | .NET 8        | `ai-loop/adapters/dotnet/`      | 20       | MEDIUM         |
| 3    | Python 3.10+  | `ai-loop/adapters/python/`      | 30       | LOW            |

---

## 各 Adapter 的檔案結構

每個 Adapter 目錄包含 4 個標準化檔案：

```
{framework}/
├── detector.md          # 偵測邏輯（Chain of Responsibility 節點）
├── commands.yaml        # 指令定義（getLintCommand / getTestCommand / getBuildCommand）
├── error-parser.md      # parseErrorOutput 實作（工具輸出解析規則）
└── review-dimensions.md # getReviewDimensions 實作（框架特有審查 D1–D5）
```

---

## Adapter 解析流程（Pseudocode）

```
function resolveAdapter(project_root):
  adapters = getRegisteredAdapters()  // 已依 priority 排序
  for adapter in adapters.sortBy(a => a.priority):
    if adapter.detector.detect(project_root):
      return adapter

  // 無框架偵測成功
  trigger EscapeHatch(reason="framework_unknown")
  return null
```

---

## Multi-Framework 支援（Composite Pattern）

若 project 同時包含多個框架（如 monorepo：前端 Angular + 後端 Python），允許建立 Composite Adapter：

```yaml
# Composite Adapter 範例（monorepo）
composite:
  primary: angular-wec # main 指令使用此 adapter（priority 最高者）
  secondary: python # 後端使用此 adapter
  scope:
    angular-wec: "frontend/"
    python: "backend/"
```

### Composite Adapter 偵測流程

```
function resolveCompositeAdapter(project_root):
  matched = []
  adapters = getRegisteredAdapters().sortBy(a => a.priority)
  for adapter in adapters:
    if adapter.detector.detect(project_root) 或 adapter.detector.detect(subdirectory):
      matched.append(adapter)

  if matched.length == 0:
    trigger EscapeHatch(reason="framework_unknown")

  if matched.length == 1:
    return SingleAdapter(primary=matched[0])

  if matched.length >= 2:
    return CompositeAdapter(
      primary = matched[0],       // 最高優先級（priority 最小）
      secondary = matched[1],
      scope = infer_from_directory_structure()  // 依目錄結構推斷
    )
```

### 框架優先級（Composite 場景的 primary 決定規則）

```
angular-wec (priority 10) > dotnet (priority 20) > python (priority 30)
```

> 與單一 Adapter 偵測相同，primary 依 priority 數值由小到大決定。
> Composite Adapter 的 `scope` 可由以下方式決定：
>
> 1. spec.md 中明確指定（優先）
> 2. project-discovery Step 5 根據目錄結構自動推斷（若 spec 未指定）

### Composite 場景的 Phase 執行策略

- **Phase A (Developer)**：依 `scope` 分別套用各框架的 instructions + coding standards
- **Phase B (Tester)**：依 `scope` 分別執行各框架的 Lint / Build / Test 指令
- **Phase C (Reviewer)**：合併所有框架的 review dimensions（D0–D5 各自獨立）
- **Phase D (Integration Tester)**：整合測試跨框架執行（依 spec 定義範圍）

**注意**：兩個框架的初始化狀態獨立驗證（於 project-discovery Step 5），任一未通過即中斷引導。

---

## 新增 Adapter（擴充指引）

若需要支援新框架（如 Vue2、FastAPI），請按以下步驟：

1. 在 `ai-loop/adapters/` 建立新目錄（如 `vue2/`）
2. 實作 4 個標準檔案（參考 `angular-wec/` 作為範本）
3. 在此 Registry 的已註冊表格中新增項目，指定適當的 `priority` 值（以 10 為間距）
4. 在 `loop-state.schema.yaml` 的 `framework` enum 中新增值
5. 在 `loop-orchestrator.md` 的 Adapter 呼叫序列中新增

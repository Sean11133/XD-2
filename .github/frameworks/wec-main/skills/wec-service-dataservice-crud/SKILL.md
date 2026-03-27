---
name: wec-service-dataservice-crud
description: This skill should be used when the user asks to "建立 DataService service", "DataService CRUD", "串接 API", "WEC service pattern", "post/get 怎麼封裝", "抽離 API 呼叫到 service", or wants reusable business service implementation based on wec-core.
---

# WEC DataService CRUD Skill

建立可重用的業務服務層，遵循 `DataService` 繼承與 API 呼叫封裝模式，統一錯誤處理與回傳型別。

## Purpose

- 避免各頁面重複撰寫 API 呼叫邏輯。
- 以標準 CRUD 方法提高一致性。
- 對齊 `@wec/core` 服務模型。

## Best Fit

- 適合處理獨立業務 service、CRUD 封裝與 component 內 API 呼叫抽離。
- 若任務包含新 menu 註冊、`setView()`、`setCustomLocalMenu()`，優先改用 `wec-menu-development`。
- 若任務重點是表單結構與驗證，優先改用 `wec-reactive-form-pattern`。

## Trigger Intent

在以下情境使用：

- 使用者需要建立新的業務 service。
- 使用者需要 API 封裝模板（load/create/update/delete/getById）。
- 使用者要把頁面內 API 呼叫抽離到 service。

## Workflow

### 1) 建立 service 類別

- 使用 `@Injectable({ providedIn: 'root' })`
- 繼承 `DataService`
- constructor 接受 `Injector` 並 `super(injector)`

### 2) 實作 app getter

固定實作：

- `protected get app(): string { return AppConfig.get('app'); }`

### 3) 定義 CRUD 方法

至少包含：

- `loadData(params)`
- `createItem(payload)`
- `updateItem(id, payload)`
- `deleteItem(id)`
- `getItemById(id)`

### 4) 明確型別與錯誤處理

- 所有公開方法加回傳型別
- 在使用端（component/facade）統一 `catchError`

### 5) 驗證與整合

- 將 component 的 API 呼叫改走 service
- 驗證 create/update/delete 後的 reload 流程

## Guardrails

- 不直接在 component 內硬寫 URL 與 HTTP 邏輯。
- 優先使用 `DataService` 提供方法，不重造通用工具。
- 保持命名一致（動詞 + 名詞）。

## Output Checklist

- service 可獨立被注入使用
- CRUD 方法齊全且命名一致
- app getter 與 DataService 繼承正確
- component 整合完成

## Additional Resources

- `references/dataservice-crud-template.md`
- `../../instructions/wec-core.instructions.md`
- `../../copilot-instructions.md`

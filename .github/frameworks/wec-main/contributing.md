# CONTRIBUTING.md – WEC UI Instructions 貢獻指南

> 本文件定義如何正確貢獻 WEC UI Framework 的 Instructions、Prompts 和 Skills，  
> 確保 AI Agent 與人類開發者都能遵循一致的規範。

---

## 📂 專案結構

```
wecui-instructions/
├── AGENTS.md                           # AI Agent 行為規範
├── CONTRIBUTING.md                     # 貢獻指南（本文件）
├── README.md                           # 專案說明
├── copilot-instructions.md             # 全域 Copilot 開發規範
├── instructions/                       # 技術規範文件
│   ├── wec-components.instructions.md  # 元件庫 API 手冊
│   └── wec-core.instructions.md        # 核心服務 API 手冊
├── prompts/                            # AI 提示詞（流程型）
│   ├── wecui-install.prompt.md
│   ├── wecui-init.prompt.md
│   ├── wecui-develop.prompt.md
│   └── wecui-intro.prompt.md
└── skills/                             # AI 技能（精準型）
    ├── README.md
    ├── wec-aggrid-page/
    ├── wec-framework-install/
    ├── wec-framework-intro/
    ├── wec-menu-development/
    ├── wec-migration-deprecated-components/
    ├── wec-reactive-form-pattern/
    ├── wec-service-dataservice-crud/
    └── wec-system-init/
```

---

## 🛠 文件類型與用途

| 文件類型                   | 路徑位置                                      | 用途                                | 修改頻率         |
| -------------------------- | --------------------------------------------- | ----------------------------------- | ---------------- |
| **Global Instructions**    | `copilot-instructions.md`                     | 全域 Angular/WEC 開發規範           | 低（框架變動時） |
| **Component Instructions** | `instructions/wec-components.instructions.md` | 元件 API、範例、廢棄元件資訊        | 中（元件更新時） |
| **Core Instructions**      | `instructions/wec-core.instructions.md`       | DataService、AuthService 等核心服務 | 中（服務變動時） |
| **Prompts**                | `prompts/*.prompt.md`                         | 多步驟流程引導                      | 低               |
| **Skills**                 | `skills/*/SKILL.md`                           | 單一精準任務指引                    | 中（持續優化）   |
| **Skill References**       | `skills/*/references/*.md`                    | 範本與參考資料                      | 中               |

---

## ✍️ 貢獻規範

### 1. Instructions 文件（`instructions/`）

Instructions 是 AI Agent 的核心參考資料，需保持高品質。

**撰寫原則：**

- 每個元件或服務必須包含：**用途說明**、**API 定義（Inputs/Outputs）**、**完整範例**
- 範例必須使用 ✅ / ❌ 標註正確與錯誤用法
- 廢棄元件必須標註 **移除時程** 和 **替代方案**
- 保持與實際框架版本同步，避免文件與程式碼不一致

**格式範例：**

````markdown
### `<wec-component-name>` - 元件中文名稱

元件功能說明。

**Inputs:**

- `propertyName: type` - 屬性說明（預設值：`defaultValue`）

**Outputs:**

- `eventName: EventEmitter<type>` - 事件說明

**使用範例：**
\```html

<!-- ✅ 正確用法 -->

<wec-component-name [property]="value" (event)="handler($event)">
</wec-component-name>

<!-- ❌ 錯誤用法與原因 -->

\```
````

---

### 2. Prompts 文件（`prompts/`）

Prompts 適用於需要多步驟引導的流程型任務。

**命名規則：** `wecui-{功能名稱}.prompt.md`

**必要結構：**

```markdown
---
agent: agent
---

# 標題

## 何時使用此流程

（適用情境）

## 不適用情境

（建議改走哪個 Skill）

## 任務目標

（流程要達成的目標）

## 範圍界線

（明確定義此 Prompt 的邊界）

## 具體需求

### 1. 步驟一

### 2. 步驟二

...
```

**撰寫原則：**

- 開頭必須包含 `---agent: agent---` YAML frontmatter
- 明確定義 **適用情境** 和 **不適用情境**，避免與其他 Prompt/Skill 衝突
- 需要使用者輸入的資訊必須在流程開頭標註
- 每個步驟提供可直接複製使用的程式碼模板
- 文件內參照規範文件時使用相對路徑（如 `copilot-instructions.md`、`instructions/wec-components.instructions.md`）

---

### 3. Skills 文件（`skills/`）

Skills 適用於單一明確目標的精準型任務。

**目錄結構：**

```
skills/wec-{skill-name}/
├── SKILL.md              # 技能定義（必要）
└── references/           # 範本與參考資料（選用）
    └── {name}-template.md
```

**SKILL.md 必要結構：**

```markdown
---
agent: agent
---

# Skill 名稱

## 描述

（技能說明）

## 觸發條件

（使用者可能的觸發詞列表）

## 邊界定義

（明確說明此 Skill 處理與不處理的範圍）

## 執行步驟

### Step 1: ...

### Step 2: ...

## 參考模板

（如有 references/ 下的模板文件，在此引用）
```

**撰寫原則：**

- Skill 名稱統一使用 `wec-` 前綴 + kebab-case
- 必須定義 **邊界**，說明哪些情境不應使用此 Skill
- 建議提供 references 範本，讓 Agent 有具體的程式碼參照
- 更新 Skill 後必須同步更新 `skills/README.md` 的索引

---

### 4. Skill References（`skills/*/references/`）

**命名規則：** `{描述性名稱}-template.md`

**撰寫原則：**

- 範本須為可直接使用的完整程式碼，不可有佔位符以外的省略
- 佔位符使用 `{{PLACEHOLDER_NAME}}` 格式，便於 Agent 替換
- 範本必須 100% 符合 `copilot-instructions.md` 的規範

---

## 📝 提交規範

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>
```

**Type 類型：**

| Type       | 說明                             |
| ---------- | -------------------------------- |
| `docs`     | 文件新增或更新                   |
| `feat`     | 新增 Prompt 或 Skill             |
| `fix`      | 修正文件錯誤或過時內容           |
| `refactor` | 重構文件結構（不改變內容含義）   |
| `chore`    | 維護性工作（更新 README 索引等） |

**Scope 範圍：**

| Scope          | 說明                               |
| -------------- | ---------------------------------- |
| `instructions` | instructions/ 下的規範文件         |
| `prompts`      | prompts/ 下的提示詞                |
| `skills`       | skills/ 下的技能                   |
| `global`       | copilot-instructions.md 或全域設定 |

**範例：**

```
feat(skills): add wec-aggrid-page skill with template

docs(instructions): update wec-components deprecated list

fix(prompts): correct file reference in wecui-develop.prompt.md
```

---

## ✅ 提交前檢查清單

### 通用檢查

- [ ] 所有程式碼範例可正常編譯（無語法錯誤）
- [ ] ✅ / ❌ 標註正確，不會誤導開發者
- [ ] 文件內的檔案路徑引用正確（無指向不存在的文件）
- [ ] 與 `copilot-instructions.md` 全域規範無衝突

### Instructions 檢查

- [ ] 新增元件包含完整 API（Inputs/Outputs）
- [ ] 提供正確與錯誤的使用範例
- [ ] 廢棄元件包含替代方案和移除時程

### Prompts 檢查

- [ ] 包含 YAML frontmatter（`agent: agent`）
- [ ] 定義適用與不適用情境
- [ ] 參照路徑使用相對路徑
- [ ] 不與現有 Skills 範圍重疊（或明確標註分工）

### Skills 檢查

- [ ] Skill 名稱使用 `wec-` 前綴
- [ ] 定義觸發條件與邊界
- [ ] References 範本符合全域規範
- [ ] 已更新 `skills/README.md` 索引
- [ ] 已更新 `AGENTS.md` 任務路由表

---

## 🔄 文件同步維護

當框架有以下變動時，需同步更新對應文件：

| 變動類型         | 需更新文件                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| 新增 WEC 元件    | `instructions/wec-components.instructions.md`                            |
| 元件廢棄或移除   | `instructions/wec-components.instructions.md`、`copilot-instructions.md` |
| 新增核心服務     | `instructions/wec-core.instructions.md`                                  |
| Angular 版本升級 | `copilot-instructions.md`（控制流程、語法等）                            |
| 新增 Skill       | `skills/README.md`、`AGENTS.md` 路由表                                   |
| 新增 Prompt      | `AGENTS.md` 路由表                                                       |
| WEC Layout 變更  | `copilot-instructions.md` Layout 章節                                    |

---

## 🚫 常見錯誤

以下是過去貢獻中常見的問題，請務必避免：

1. **引用不存在的文件路徑**
   - ❌ `wecui.instructions.md`（不存在）
   - ✅ `copilot-instructions.md`

2. **Service 名稱不一致**
   - ❌ `LoginService`（不存在）
   - ✅ `AuthService`

3. **AG-Grid 範例未使用 `AgGridOptions`**
   - ❌ 直接使用 `GridOptions` from ag-grid
   - ✅ 使用 `new AgGridOptions(baseOptions, wecExtensions)` from `@wec/components`

4. **Prompt/Skill 範圍重疊且無邊界說明**
   - 每個 Prompt 和 Skill 必須明確定義邊界與分工

5. **缺少 YAML frontmatter**
   - Prompt 和 Skill 檔案必須包含 `---agent: agent---`

---

## 💡 新增 Skill 快速流程

1. 建立目錄：`skills/wec-{skill-name}/`
2. 建立 `SKILL.md`，遵循上方必要結構
3. （選用）建立 `references/{name}-template.md` 提供範本
4. 更新 `skills/README.md` 加入索引
5. 更新 `AGENTS.md` 路由表加入觸發詞對應
6. 提交時使用 `feat(skills): add wec-{skill-name} skill`

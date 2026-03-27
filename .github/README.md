# WEC Coding Standards — AI 軟體工廠

> Version: v5.1 | Date: 2026-03-13

此 Repository 是 **WEC AI 軟體工廠** 的核心設定倉庫，透過 **Git Submodule** 掛載至目標專案的 `.github/` 目錄後，即可為目標專案提供完整的 AI 驅動開發閉環能力。

---

## 快速開始 — 選擇適合你的安裝方式

> 詳細步驟與比較見 `docs/setup-guide.md`

### 方式 A：Git Submodule（推薦 — 可追蹤版本、一鍵更新）

**已有 git repo（至少有一個 commit）**

```bash
# 安裝：在目標專案根目錄執行
git submodule add https://github.com/winbond-MK00/wec-coding-standards.git .github
git submodule update --init --recursive
git add .gitmodules .github
git commit -m "chore: add wec-coding-standards"
```

**全新專案（剛 git init，尚無任何 commit）**

```bash
# 先建立初始 commit（讓 HEAD 存在，submodule 才能正常運作）
git commit --allow-empty -m "chore: initial commit"

# 再安裝
git submodule add https://github.com/winbond-MK00/wec-coding-standards.git .github
git submodule update --init --recursive
git add .gitmodules .github
git commit -m "chore: add wec-coding-standards"
```

**更新到最新版**

```bash
git submodule update --remote --merge
git add .github
git commit -m "chore: update wec-coding-standards"
```

### 方式 B：Git Subtree（不想管理 submodule 的團隊）

> ⚠️ `git subtree` 需要 repo 有有效的 `HEAD`（至少一個 commit），否則會報 `ambiguous argument 'HEAD'`。

**已有 git repo（至少有一個 commit）**

```bash
# 安裝
git subtree add --prefix .github https://github.com/winbond-MK00/wec-coding-standards.git main --squash
```

**全新專案（剛 git init，尚無任何 commit）**

```bash
# 先建立初始 commit（缺少此步驟會報 HEAD ambiguous 錯誤）
git commit --allow-empty -m "chore: initial commit"

# 再安裝
git subtree add --prefix .github https://github.com/winbond-MK00/wec-coding-standards.git main --squash
```

**更新到最新版**

```bash
git subtree pull --prefix .github https://github.com/winbond-MK00/wec-coding-standards.git main --squash
```

### 方式 C：手動下載（離線環境 / 快速試用）

**Linux / macOS**

```bash
curl -L https://github.com/winbond-MK00/wec-coding-standards/archive/refs/heads/main.zip -o wec.zip
unzip wec.zip -d .github-tmp
mv .github-tmp/wec-coding-standards-main/* .github/
rm -rf .github-tmp wec.zip
```

**Windows PowerShell**

```powershell
# 使用 git clone --depth 1（最可靠，繞過 Windows 解壓工具相容性問題）
git clone --depth 1 https://github.com/winbond-MK00/wec-coding-standards.git github-tmp
New-Item -ItemType Directory -Force -Path .github | Out-Null
Get-ChildItem github-tmp -Exclude .git | Move-Item -Destination .github
Remove-Item -Recurse -Force github-tmp
```

### 方式比較

|                    | Submodule                 | Subtree               | 手動下載      |
| ------------------ | ------------------------- | --------------------- | ------------- |
| 安裝難度           | ⭐⭐                      | ⭐⭐                  | ⭐            |
| 一鍵更新           | ✅                        | ✅                    | ❌ 需重新下載 |
| 版本追蹤           | ✅ 精確到 commit          | ✅ squash commit      | ❌            |
| Clone 後需額外動作 | `submodule update --init` | 無                    | 無            |
| 可離線使用         | ❌ 需網路 init            | ✅ 已合併至 repo      | ✅            |
| 適合情境           | 多專案統一管控            | 不熟 submodule 的團隊 | 試用 / 離線   |

---

## 目錄結構

```
.github/  (= 此 repo 根目錄)
│
├── copilot-instructions.md       ← 全局 Copilot 指令（自動載入）
│
├── instructions/                 ← 上下文感知指令（依檔案類型自動套用）
│   ├── csharp.instructions.md    → applyTo: **/*.cs
│   ├── angular.instructions.md   → applyTo: **/*.ts, **/*.html（Angular 專案適用）
│   ├── python.instructions.md    → applyTo: **/*.py
│   ├── ai-loop-protocols.instructions.md    → Inner Loop 核心協議
│   ├── ai-loop-error-taxonomy.instructions.md → 錯誤分類與處理
│   └── ai-loop-anti-oscillation.instructions.md → 防震盪機制
│
├── prompts/                      ← 可呼叫的 AI 工作提示（內環）
│   ├── ai-loop.prompt.md         → 內環 Orchestrator（@dev 觸發）
│   ├── ai-loop-dev.prompt.md     → 開發 Agent
│   ├── ai-loop-test.prompt.md    → 測試與自癒 Agent
│   ├── ai-loop-review.prompt.md  → 程式碼審查 Agent
│   ├── ai-loop-integration-test.prompt.md → 整合測試 Agent
│   └── final-report.prompt.md    → 最終報告產出
│
├── skills/                       ← 互動式技能（外環，主動對話）
│   ├── pm/SKILL.md               → @pm：需求分析 → spec.md
│   ├── architect/SKILL.md        → @architect：架構設計 → plan.md
│   ├── ai-loop/SKILL.md          → Inner Loop Skill 定義
│   ├── git-smart-commit/SKILL.md → 智慧拆分 Conventional Commit
│   ├── git-pr-description/SKILL.md → 自動產生 PR Title & Description
│   ├── git-worktree-design/SKILL.md → 多分支平行開發 Worktree 規劃
│   └── skill-development/SKILL.md  → Skill 開發規範
│
├── agents/                       ← Custom Copilot Agents
│   ├── pm.agent.md               → @pm
│   ├── architect.agent.md        → @architect
│   ├── dev.agent.md              → @dev（觸發 Inner Loop）
│   ├── reviewer.agent.md         → @reviewer
│   └── reporter.agent.md         → @reporter
│
├── ai-loop/                      ← Inner Loop 引擎（AI 閱讀，非人工編輯）
│   ├── core/                     → Template Method 骨架 + 狀態 Schema
│   ├── adapters/                 → Framework Adapters（OCP 擴展）
│   │   ├── angular-wec/
│   │   ├── dotnet/
│   │   └── python/
│   ├── templates/                → 輸出格式模板
│   ├── docs/                     → Inner Loop 技術文件
│   │   ├── ai-loop-spec.md
│   │   ├── adapter-guide.md
│   │   └── troubleshooting.md
│   ├── scripts/                  → 各框架安裝腳本
│   │   ├── setup-angular.sh
│   │   ├── setup-dotnet.sh
│   │   ├── setup-python.sh
│   │   └── validate-installation.sh
│   └── tests/                    → Inner Loop 測試套件
│
├── frameworks/                   ← 各專案框架的 AI 知識擴展層
│   ├── imxframework/             → iMX Framework v2.0 (.NET) 專屬指令與 Skills
│   ├── wec-main/                 → WEC 前端框架 (Angular) 專屬指令與 Skills
│   ├── wec-py/                   → WEC Python 服務專屬指令
│   ├── webapi-framework/         → CIMWebApiFramework (.NET 4.8) 規範
│   ├── webapi-framework-core/    → CIMWebApiFrameworkCore (.NET 8) ⚠️ 棄用
│   ├── imx-core-net/             → iMX.Core.Net v1.x Manager-Based 規範
│   └── shared/                   → 跨框架共用 AI 知識（ieda / ifdc）
│
├── standards/                    ← 編碼標準（團隊知識基礎）
│   ├── solid-principles.md
│   ├── design-patterns.md        → GoF 23 種設計模式
│   ├── clean-architecture.md
│   ├── ddd-guidelines.md
│   ├── coding-standard-frontend.md → 前端開發基礎規範（不限框架）
│   ├── coding-standard-csharp.md
│   ├── coding-standard-angular.md
│   └── coding-standard-python.md
│
├── templates/                    ← 文件模板
│   ├── spec.md
│   ├── plan.md
│   └── final-report.md
│
└── docs/                         ← 使用指南與範例
    ├── setup-guide.md
    └── examples/
        ├── copilot-project-agent.example.md
        └── copilot-project-instruction.example.md
```

### 專案自訂擴展（掛載後的目標專案結構）

`.github/` 由框架佔用，專案自訂的 instructions / agents / prompts / skills 放在 **`.copilot/`** 目錄：

```
your-project/
├── .github/              ← WEC 標準框架（Submodule / Subtree，勿直接修改）
│   ├── copilot-instructions.md
│   ├── instructions/     → 框架層級 coding rules
│   ├── agents/           → 框架內建 agents（@pm @architect @dev ...）
│   └── ...
│
├── .copilot/             ← 專案自訂擴展（自行維護，納入版控）
│   ├── instructions/     → 專案專屬 coding rules（*.instructions.md）
│   ├── agents/           → 專案專屬 agents（*.agent.md）
│   ├── prompts/          → 專案專屬 prompts（*.prompt.md）
│   └── skills/           → 專案專屬 skills（*/SKILL.md）
│
└── src/
```

> VS Code Copilot 會掃描**整個 workspace**，`.copilot/` 內的檔案會被自動發現，與 `.github/` 的檔案**疊加生效**。
> 詳細用法與範例見 `docs/setup-guide.md` 的「專案自訂擴展」段落。

---

## 開發流程概覽

### 場景分流 — 依變更規模選擇流程

| 場景            | 何時使用                                   | 做法                                         |
| --------------- | ------------------------------------------ | -------------------------------------------- |
| **🔵 直接對話** | 修 bug、改樣式、調邏輯、小重構（≤ 3 檔案） | 直接在 Chat 描述需求，不需呼叫任何 @agent    |
| **🟡 快速增強** | 既有系統加新功能，需求已明確、架構已確定   | `@dev [需求描述]` 直接觸發 Inner Loop        |
| **🟢 完整流程** | 全新系統開發、大型功能、跨多層架構變更     | `@pm` → `@architect` → `@dev`（含測試+報告） |

> **注意**：即使是直接對話，程式碼仍須遵守 `standards/` 中的編碼標準與 SOLID 原則。

### 完整流程圖

```
外部決策環（主管/PM 掌控）
  ↓
  @pm    → 輸入需求關鍵字 → AI 主動詢問 → 產出 docs/001-需求簡述/spec.md
  ↓ 主管審核
  @architect → 讀取 docs/001-需求簡述/spec.md → AI 主動詢問技術決策 → 產出 docs/001-需求簡述/plan.md（含 Mermaid 圖表）
  ↓ 架構審核

內部自動環（AI 自主閉環）
  @dev   → 開發（套用 standards/）→ 單元測試（自動執行）→ 自癒（錯誤自動修正）→ 審查（SOLID + Clean Arch）→ 整合測試（Playwright/xUnit/pytest）→ 自動產出 final-report.md
```

---

## 各 Agent 使用方式

| Agent        | 觸發                    | 輸入          | 輸出                                        | 適用場景           |
| ------------ | ----------------------- | ------------- | ------------------------------------------- | ------------------ |
| _(無)_       | 直接在 Chat 描述        | 口語化描述    | 程式碼片段                                  | 🔵 小調整          |
| `@dev`       | 描述增強需求            | 口語化需求    | 完整程式碼 + 測試                           | 🟡 快速增強        |
| `@pm`        | 描述業務需求            | 口語化需求    | `docs/{NNN}-{需求簡述}/spec.md`             | 🟢 完整流程        |
| `@architect` | 附加 spec.md            | 已審核的 spec | `docs/{NNN}-{需求簡述}/plan.md`             | 🟢 完整流程        |
| `@dev`       | 指定 Task 編號          | plan.md Task  | 完整程式碼 + 測試 + 整合測試 + 同資料夾報告 | 🟢 完整流程        |
| `@reviewer`  | 附加要審查的程式碼      | 程式碼        | SOLID/CR 審查結果                           | 🟡🟢 皆可使用      |
| `@reporter`  | @dev 完成後（重新產出） | 所有上游產出  | `docs/{NNN}-{需求簡述}/final-report.md`     | 可選（已自動產出） |

### Skills（外環互動技能）

| Skill                    | 觸發描述                          | 輸出                             |
| ------------------------ | --------------------------------- | -------------------------------- |
| `@pm` (pm skill)         | 描述新功能需求                    | spec.md                          |
| `@architect` (architect) | 架構設計討論                      | plan.md（含 Mermaid 圖）         |
| ai-loop skill            | 詢問 loop 運作方式 / 觸發方式     | 引導說明                         |
| `git-smart-commit`       | 有雜亂的 git 變更需要整理         | 多個有意義的 Conventional Commit |
| `git-pr-description`     | 需要建立 Pull Request             | PR Title & Description           |
| `git-worktree-design`    | 多功能需求或需要平行開發          | Worktree 拆分方案                |
| `skill-development`      | 需要建立或改善 Skill / Agent 定義 | SKILL.md / agent.md 草稿         |

### 需求工作區命名規則

完整流程預設在專案根目錄的 `docs/` 下建立需求工作區，命名格式如下：

```
docs/
└── 001-需求簡述/
  ├── spec.md
  ├── plan.md
  ├── final-report.md
  ├── review-report.md
  ├── loop-summary.md
  ├── integration-test-report.md
  └── diagnostic-report.md
```

- `001` 為三位數流水號，建議依建立順序遞增
- `需求簡述` 以短橫線簡述需求，例如 `001-user-query-api`
- 同一需求的所有規格、計畫、審查與交付文件都放在同一資料夾，避免散落在根目錄或 `reports/`

---

## Standards 文件總覽

| 文件                                    | 適用範圍                     |
| --------------------------------------- | ---------------------------- |
| `standards/solid-principles.md`         | 所有語言                     |
| `standards/design-patterns.md`          | GoF 23 種，含 C#/Python 範例 |
| `standards/clean-architecture.md`       | 所有語言                     |
| `standards/ddd-guidelines.md`           | 領域建模                     |
| `standards/coding-standard-frontend.md` | 前端開發（不限框架）         |
| `standards/coding-standard-csharp.md`   | .NET 8                       |
| `standards/coding-standard-angular.md`  | Angular 17（選用時適用）     |
| `standards/coding-standard-python.md`   | Python 3.10+                 |

---

## Frameworks — 各專案框架 AI 知識擴展層

`frameworks/` 目錄是 WEC 各內部框架的 AI 知識擴展模組，讓 AI 助理了解各框架的開發規範、元件用法與常見模式，與核心 `standards/` 分層管理。

| 目錄                                | 對應框架                       | 包含內容                                             |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------- |
| `frameworks/imxframework/`          | iMX Framework v2.0 (.NET)      | 開發規則、使用者說明、develop/init/intro Skills      |
| `frameworks/wec-main/`              | WEC 前端框架 (Angular)         | wec-core / wec-components / wecui 指令 + 8 個 Skills（選用 Angular 時適用） |
| `frameworks/wec-py/`                | WEC Python 服務                | wecpy / ieda / ifdc 資料存取指令                     |
| `frameworks/webapi-framework/`      | CIMWebApiFramework (.NET 4.8)  | Oracle/Security/Alarm/APM 整合規範、AGENTS、Skills   |
| `frameworks/webapi-framework-core/` | CIMWebApiFrameworkCore ⚠️ 棄用 | 維護期規範 + 遷移至 iMX.Framework v2.0 指引          |
| `frameworks/imx-core-net/`          | iMX.Core.Net v1.x              | Manager-Based 規範（Kafka/ES/S3/APM），含多 TFM 指引 |
| `frameworks/shared/`                | 跨框架共用知識                 | ieda / ifdc 資料介接層共用規範                       |

> 各框架目錄可獨立維護（`.copilot/` 模式），不影響核心標準。詳見各目錄下的 `AGENTS.md`。

---

## 貢獻與維護

- **Adapter 擴展**：參見 `ai-loop/docs/adapter-guide.md`（OCP 設計，不修改 Core）
- **問題排查**：參見 `ai-loop/docs/troubleshooting.md`

### 版本更新

```bash
# Submodule 方式
git submodule update --remote --merge
git add .github && git commit -m "chore: update wec-coding-standards"

# Subtree 方式
git subtree pull --prefix .github https://github.com/winbond-MK00/wec-coding-standards.git main --squash

# Init Script 方式（重新執行即可）
curl -fsSL https://raw.githubusercontent.com/winbond-MK00/wec-coding-standards/main/scripts/init.sh | bash
```

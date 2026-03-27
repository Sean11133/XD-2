# Setup Guide — AI Agent Software Factory 安裝指南

> 本文件說明多種將 `wec-coding-standards` 導入目標專案的方式，以及後續如何更新。

## 前置需求

| 工具           | 最低版本 | 說明                                 |
| -------------- | -------- | ------------------------------------ |
| Git            | 2.20+    | Submodule / Subtree 支援             |
| VS Code        | 1.85+    | GitHub Copilot Chat                  |
| GitHub Copilot | 最新版   | `.agent.md`, `.instructions.md` 支援 |
| Node.js        | 18 LTS   | Angular 專案                         |
| .NET SDK       | 8.0      | .NET 專案                            |
| Python         | 3.10+    | Python 專案                          |

---

## 安裝方式一覽

| 方式                 | 一鍵安裝 | 一鍵更新      | 版本追蹤     | 適合誰                           |
| -------------------- | -------- | ------------- | ------------ | -------------------------------- |
| **A. Git Submodule** | ✅       | ✅            | ✅ commit 級 | 多專案統一管控、需要精確版本控制 |
| **B. Init Script**   | ✅       | ✅            | ✅           | 快速導入、不想記指令             |
| **C. Git Subtree**   | ✅       | ✅            | ⚠️ squash    | 不喜歡 submodule 的團隊          |
| **D. 手動下載**      | ✅       | ❌ 需重新下載 | ❌           | 離線環境、快速試用               |

---

## 方式 A：Git Submodule（推薦）

最適合需要**多個專案統一管控標準版本**的團隊。Submodule 會記錄指向 `wec-coding-standards` 的精確 commit，確保每個專案使用的標準版本可追溯。

### 安裝

```bash
cd your-project

# 掛載 submodule 至 .github/ 目錄
git submodule add https://github.com/winbond-MK00/wec-coding-standards.git .github
git submodule update --init --recursive

# 驗證
bash .github/ai-loop/scripts/validate-installation.sh

# 提交
git add .gitmodules .github
git commit -m "chore: add wec-coding-standards as submodule"
```

### 更新

```bash
# 拉取最新版
git submodule update --remote --merge

# 提交更新
git add .github
git commit -m "chore: update wec-coding-standards to latest"
```

### 新成員 Clone 後

```bash
git clone --recurse-submodules https://github.com/winbond-MK00/your-project.git

# 或 clone 後再初始化
git clone https://github.com/winbond-MK00/your-project.git
cd your-project
git submodule update --init --recursive
```

### 鎖定特定版本（Tag）

```bash
cd .github
git checkout v5.0
cd ..
git add .github
git commit -m "chore: pin wec-coding-standards to v5.0"
```

---

## 方式 B：Init Script 一鍵安裝

最適合**快速上手**的情境，一行指令完成安裝，內部自動選擇 Submodule 方式。

### Linux / macOS

```bash
curl -fsSL https://raw.githubusercontent.com/winbond-MK00/wec-coding-standards/main/scripts/init.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/winbond-MK00/wec-coding-standards/main/scripts/init.ps1 | iex
```

### 更新

重新執行同一指令即可，腳本會偵測是否已安裝並執行更新。

---

## 方式 C：Git Subtree

適合**不喜歡 submodule 雙 repo 管理**的團隊。Subtree 會將標準文件直接合併進你的 repo 歷史，團隊成員 clone 後不需要額外動作。

### 安裝

```bash
cd your-project

git subtree add --prefix .github \
  https://github.com/winbond-MK00/wec-coding-standards.git main --squash

git push
```

### 更新

```bash
git subtree pull --prefix .github \
  https://github.com/winbond-MK00/wec-coding-standards.git main --squash

git push
```

> **注意**：Subtree 使用 squash merge，無法精確追蹤上游的個別 commit。

---

## 方式 D：手動下載

適合**離線環境**或只想快速試用。

### Linux / macOS

```bash
curl -L https://github.com/winbond-MK00/wec-coding-standards/archive/refs/heads/main.zip -o wec.zip
unzip wec.zip
mkdir -p .github
cp -r wec-coding-standards-main/* .github/
rm -rf wec-coding-standards-main wec.zip
```

### Windows (PowerShell)

```powershell
Invoke-WebRequest -Uri "https://github.com/winbond-MK00/wec-coding-standards/archive/refs/heads/main.zip" -OutFile wec.zip
Expand-Archive wec.zip -DestinationPath .
if (!(Test-Path .github)) { New-Item -ItemType Directory -Path .github }
Copy-Item -Recurse wec-coding-standards-main\* .github\
Remove-Item -Recurse -Force wec-coding-standards-main, wec.zip
```

### 更新

手動重新下載並覆蓋 `.github/` 目錄。

---

## 安裝後共通步驟

### 1. 執行框架對應的設定腳本

```bash
# .NET 8 + Angular 17 專案
bash .github/ai-loop/scripts/setup-dotnet.sh
bash .github/ai-loop/scripts/setup-angular.sh

# Python 3.10+ 專案
bash .github/ai-loop/scripts/setup-python.sh
```

---

### 2. 驗證安裝

```bash
bash .github/ai-loop/scripts/validate-installation.sh
```

所有 ✅ 表示安裝成功。

---

### 3. 設定 VS Code

在 `.vscode/settings.json` 中確認以下設定：

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    { "file": ".github/copilot-instructions.md" }
  ]
}
```

---

## 更新方式速查

| 安裝方式        | 更新指令                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| **Submodule**   | `git submodule update --remote --merge && git add .github && git commit -m "chore: update standards"`      |
| **Init Script** | 重新執行安裝指令（自動偵測更新）                                                                           |
| **Subtree**     | `git subtree pull --prefix .github https://github.com/winbond-MK00/wec-coding-standards.git main --squash` |
| **手動下載**    | 重新下載並覆蓋 `.github/` 目錄                                                                             |

```bash
# 更新後查看變更了什麼
git log --oneline .github/ -10
```

---

## 開始使用

安裝完成後，開啟 VS Code Copilot Chat 並輸入：

| 你想做的事                  | 輸入                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| 分析一個新需求              | `@pm 我想要...`                                                                    |
| 設計架構                    | `@architect 根據 docs/001-需求簡述/spec.md 設計架構`                               |
| 開始自動開發（含測試+報告） | `@dev 根據 docs/001-需求簡述/spec.md 和 docs/001-需求簡述/plan.md 開始 Inner Loop` |
| 審查程式碼                  | `@reviewer 審查目前的程式碼`                                                       |
| 重新產出 / 補充最終報告     | `@reporter 重新產出最終報告`                                                       |

---

## 目錄結構說明

```
.github/  (= wec-coding-standards/)
├── copilot-instructions.md      # 全域 Copilot 設定
├── instructions/                # 自動注入的coding rules
│   ├── csharp.instructions.md
│   ├── angular.instructions.md
│   ├── python.instructions.md
│   └── ai-loop-*.instructions.md (×3)
├── standards/                   # 架構與設計規範 (×7)
├── ai-loop/
│   ├── core/                    # Loop 引擎核心 (×5)
│   ├── adapters/                # 框架 Adapter (×14)
│   └── templates/               # 輸出模板 (×3)
├── prompts/                     # Slash command prompts (×5)
├── skills/                      # Interactive skills (×3)
│   ├── pm/SKILL.md
│   ├── architect/SKILL.md
│   └── ai-loop/SKILL.md
├── agents/                      # Custom agents (×5)
│   ├── pm.agent.md
│   ├── architect.agent.md
│   ├── dev.agent.md
│   ├── reviewer.agent.md
│   └── reporter.agent.md
└── templates/                   # 文件輸出範本 (×3)
    ├── spec.md
    ├── plan.md
    └── final-report.md
```

### 需求工作區

建議完整流程的文件一律存放在專案根目錄的 `docs/` 下，並為每個需求建立獨立資料夾：

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

- 命名格式：`{三位數流水號}-{需求簡述}`
- 例如：`001-user-query-api`、`002-order-return-flow`
- `@pm` 建立資料夾與 `spec.md`，後續 `@architect`、`@dev`、`@reviewer`、`@reporter` 都沿用同一資料夾

---

## 專案自訂擴展（Project-Level Customization）

### 問題

`.github/` 目錄被 WEC 標準框架佔用（Submodule / Subtree），專案不應直接修改其中的檔案，否則會造成更新衝突。但專案通常需要定義自己的 instructions、agents、prompts 或 skills。

### 解法

VS Code Copilot 會掃描**整個 workspace** 來發現 `*.instructions.md`、`*.agent.md`、`*.prompt.md` 檔案，**不限於 `.github/` 目錄**。因此，專案只需在 `.github/` 之外建立自訂檔案即可。

**約定：所有專案自訂擴展放在 `.copilot/` 目錄中。**

### 建立 `.copilot/` 目錄

```bash
mkdir -p .copilot/instructions .copilot/agents .copilot/prompts .copilot/skills
```

### 目錄結構

```
your-project/
├── .github/              ← WEC 標準框架（勿修改）
│   ├── copilot-instructions.md
│   ├── instructions/
│   ├── agents/
│   ├── prompts/
│   └── ...
│
├── .copilot/             ← 專案自訂（自行維護，納入版控）
│   ├── instructions/
│   │   ├── my-project.instructions.md  ← 專案整體規則
│   │   └── legacy-api.instructions.md  ← 特定模組規則
│   ├── agents/
│   │   └── dba.agent.md                ← 專案專屬 agent
│   ├── prompts/
│   │   └── deploy.prompt.md            ← 專案專屬 prompt
│   └── skills/
│       └── migration/SKILL.md          ← 專案專屬 skill
│
└── src/
```

### 各類型檔案說明

#### 1. 專案 Instructions（`.copilot/instructions/*.instructions.md`）

用途：補充框架標準中沒有的**專案專屬規則**。

```markdown
## <!-- .copilot/instructions/my-project.instructions.md -->

## applyTo: "\*_/_.cs"

## 專案特定規則（補充 WEC C# 標準）

- 本專案使用 MediatR 作為 CQRS 調度器，所有 Command/Query 須實作 `IRequest<T>`
- API Response 統一使用 `ApiResult<T>` 封裝
- 資料庫連線使用 `IDbConnectionFactory`，禁止直接 new SqlConnection
- Exception 處理統一使用 `GlobalExceptionMiddleware`，Controller 不主動 try-catch
```

#### 2. 專案 Agents（`.copilot/agents/*.agent.md`）

用途：定義專案特有的 AI 角色，例如 DBA、DevOps、特定領域專家。

```markdown
## <!-- .copilot/agents/dba.agent.md -->

name: dba
description: |
資料庫專家。負責 Migration 腳本、Schema 設計、查詢最佳化。
使用方式：@dba [需求描述]
tools: [search/codebase, edit/editFiles, execute/runInTerminal]

---

你是 @dba，本專案的資料庫架構師。

## 基本原則

1. 遵循 `.github/standards/` 中的所有設計原則
2. Migration 必須可回滾（含 Down 方法）
3. 索引命名：IX*{Table}*{Column1}\_{Column2}
4. 避免在 Migration 中操作業務資料
```

#### 3. 專案 Prompts（`.copilot/prompts/*.prompt.md`）

用途：定義專案專屬的可呼叫提示。

```markdown
## <!-- .copilot/prompts/deploy.prompt.md -->

## description: 執行部署前檢查並產出部署清單

# 部署檢查 Prompt

1. 確認所有測試通過
2. 確認 Migration 有 Down 方法
3. 確認無 hardcoded 設定
4. 產出部署清單 checklist
```

#### 4. 專案 Skills（`.copilot/skills/*/SKILL.md`）

用途：定義需要互動問答的專案專屬技能。

### 優先順序與衝突規則

| 優先層級        | 來源                     | 說明                                                      |
| --------------- | ------------------------ | --------------------------------------------------------- |
| 1（基礎，最高） | `.github/standards/`     | SOLID、Clean Architecture、Design Patterns — **不可覆寫** |
| 2（框架）       | `.github/instructions/`  | 語言 / 框架特定規則                                       |
| 3（專案）       | `.copilot/instructions/` | 專案特定規則 — 可**補充**，不應**牴觸**                   |

> **原則**：專案自訂是「向上疊加（Additive）」而非「覆寫（Override）」。
> 若專案 instruction 與 WEC 標準矛盾，以 WEC 標準為準。

### 與 Inner Loop 整合

專案自訂的 instructions 也會被 @dev Inner Loop 的 Developer Phase 自動讀取（因為 VS Code 全域掃描）。若需要在 `project-profile.yaml` 中明確註記，可填入：

```yaml
instructions_override:
  - ".copilot/instructions/my-project.instructions.md"
  - ".copilot/instructions/legacy-api.instructions.md"
```

---

## 疑難排解

問題請參考 `ai-loop/docs/troubleshooting.md`。

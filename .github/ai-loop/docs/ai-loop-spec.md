# Inner Auto Loop — 技術規格文件

# 檔案 #33 | 給 AI 工程師的完整架構說明

## 概述

Inner Auto Loop 是一個基於 **GitHub Copilot Chat** 的純 Markdown/YAML Prompt Engineering 引擎，
實作 Developer → Tester → Reviewer 三角自動化循環。

- **零外部依賴**：不需要 Node.js、Python 或任何 CLI 工具
- **零安裝**：將 `.github/` 檔案複製至目標專案即可運作
- **零費用**：完全使用現有 GitHub Copilot Chat 訂閱

---

## 架構圖

```
┌─────────────────────────────────────────────────────────┐
│                    ai-loop.prompt.md                    │
│               (Orchestrator / Entry Point)              │
│  Template Method: Phase 0 → Dev→Test→Review → Phase D  │
└─────────┬───────────────────────────────────────────────┘
          │ Phase 0: 專案探索（Template Method Hook，既有專案觸發）
          │          project-discovery.md → project-profile.yaml
          │
          │ 偵測框架（Chain of Responsibility）
          ▼
┌─────────────────────────────────────────────────────────┐
│                  adapter-registry.md                    │
│              Factory Method + Composite                 │
│   angular-wec → adapters/angular-wec/                  │
│   dotnet      → adapters/dotnet/                       │
│   python      → adapters/python/                       │
└─────────┬───────────────────────────────────────────────┘
          │ 解析 Adapter
          ▼
┌──────────────────────────────────────────────────────────────────┐
│ FrameworkAdapter Interface (Strategy Pattern)                   │
│ 9 個方法: getFrameworkName() | getLintCommand() | getTestCommand() │
│ getBuildCommand() | getInstructionsPath() | getReviewDimensions() │
│ parseErrorOutput() | getIntegrationTestCommand()                 │
│ getIntegrationTestSetupCommand()                                 │
└──────┬───────────────────────────────────────────────────────────┘
       │
  ┌────┴─────┐    ┌─────────────┐    ┌─────────────┐
  │angular-wec│    │   dotnet    │    │   python    │
  │  Adapter  │    │   Adapter   │    │   Adapter   │
  └──────────┘    └─────────────┘    └─────────────┘
```

---

## SOLID 原則對應

| 原則 | 對應實作                                                               | 檔案                               |
| ---- | ---------------------------------------------------------------------- | ---------------------------------- |
| SRP  | 每個 Agent Prompt 只有一個職責                                         | `prompts/ai-loop-dev.prompt.md` 等 |
| OCP  | 新增框架只需新增 Adapter，不修改 Core                                  | `adapters/` 目錄                   |
| LSP  | 任何 Adapter 都可替換                                                  | `adapters/adapter-interface.md`    |
| ISP  | Adapter Interface 精確定義 9 個方法（7 個核心必須 + 2 個整合測試選用） | `adapters/adapter-interface.md`    |
| DIP  | Orchestrator 依賴 Interface，非具體實作                                | `core/loop-orchestrator.md`        |

---

## Design Pattern 對應

| 模式                    | 實作位置                        | 說明                                      |
| ----------------------- | ------------------------------- | ----------------------------------------- |
| Template Method         | `core/loop-orchestrator.md`     | 固定 Phase 0→Dev→Test→Review→Phase D 骨架 |
| Template Method Hook    | `core/project-discovery.md`     | Phase 0 可選 Hook（既有專案才執行）       |
| Strategy                | `adapters/adapter-interface.md` | 可替換的框架行為                          |
| Chain of Responsibility | `adapters/*/detector.md`        | 依優先序偵測框架                          |
| Factory Method          | `adapters/adapter-registry.md`  | 從 framework_id 建立 Adapter              |
| Composite               | `adapters/adapter-registry.md`  | 多框架同時支援                            |

---

## 核心協議

### 1. Loop State Protocol

每個 Agent 完成工作後必須輸出：

```yaml
---LOOP-STATE---
round: 1
phase: developer
result: PASS          # PASS | FAIL | ESCAPED
framework: angular-wec
spec_hash: "my-component|implement interface,bind events,add tests"
cumulative_changes:
  - action: created
    file: src/app/my/my.component.ts
errors: []
warnings: []
resolved_errors: []
oscillation_flags: []
context_budget:
  tokens_used: 8000
  budget_pct: "22%"
---END-LOOP-STATE---
```

### 2. IntegrationTestState 協議

Phase D（Integration Tester）完成後必須輸出：

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
returned_to_inner_loop: false
test_files:
  - path: "e2e/user-list.spec.ts"
    status: PASS
    tests_passed: 3
    tests_failed: 0
---END-INTEGRATION-TEST-STATE---
```

### 3. spec_hash 計算公式

```
spec_hash = "{title}|{AC1 前 3 個詞},{AC2 前 3 個詞},{AC3 前 3 個詞}"
```

目的：偵測 Spec 是否在 Loop 中被修改（防止繞過驗收）。

### 4. error_id 格式

```
{tool}-{code/category}-{message-slug}-line{N}
```

目的：跨 Round 追蹤錯誤，偵測震盪（同一 error_id 重複出現）。

---

## 檔案結構

```
.github/
├── prompts/
│   ├── ai-loop.prompt.md               # 主入口（必載）
│   ├── ai-loop-dev.prompt.md           # Developer Agent
│   ├── ai-loop-test.prompt.md          # Tester Agent
│   └── ai-loop-review.prompt.md        # Reviewer Agent
├── skills/
│   └── ai-loop/
│       └── SKILL.md                    # Copilot Chat Skill 定義
├── instructions/
│   ├── ai-loop-protocols.instructions.md        # 核心協議
│   ├── ai-loop-error-taxonomy.instructions.md   # 錯誤分類
│   └── ai-loop-anti-oscillation.instructions.md # 防震盪
└── ai-loop/
    ├── core/
    │   ├── loop-orchestrator.md        # Template Method 骨架
    │   ├── loop-state.schema.yaml      # Loop State Schema
    │   ├── context-budget.md           # Token 預算管理
    │   ├── spec-template.yaml          # Spec 撰寫模板
    │   ├── escape-hatch.md             # 逃生機制
    │   ├── project-discovery.md        # Phase 0: 既有專案探索
    │   └── project-profile.schema.yaml # 專案 Profile 格式 Schema
    ├── adapters/
    │   ├── adapter-interface.md        # Strategy Interface（9 個方法）
    │   ├── adapter-registry.md         # Factory + Composite
    │   ├── angular-wec/
    │   │   ├── detector.md
    │   │   ├── commands.yaml
    │   │   ├── error-parser.md
    │   │   └── review-dimensions.md
    │   ├── dotnet/
    │   │   └── (same 4 files)
    │   └── python/
    │       └── (same 4 files)
    └── templates/
        ├── progress-output.md
        ├── diagnostic-report.md
        ├── loop-summary.md
        └── integration-test-report.md  # Phase D 輸出模板
```

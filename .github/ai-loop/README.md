# Inner Auto Loop — AI 自主閉環開發引擎

> Version: v5 Final | Status: Implemented | Date: 2026-03-11

## 概述

AI 自主閉環開發引擎（Inner Auto Loop）是一套基於 GitHub Copilot Chat 的自動化開發系統。透過三個 AI Agent 角色循環協作，實現「需求 → 開發 → 測試 → 審查 → 交付」的完全自動化。

```
User (Spec) ──→ [Phase 0: Project Discovery（既有專案）]
                        │
                        ▼
               [Developer Agent] ──→ [Tester Agent] ──→ [Reviewer Agent]
                      ↑                    │                    │
                      │                    │ FAIL (TYPE_B)      │ FAIL
                      └────────────────────┘                    │
                      ↑                                         │
                      └─────────────────────────────────────────┘
                                                             PASS
                                                               │
                                                               ▼
                                              [Phase D: Integration Tester]
                                                    │              │
                                              PASS/PARTIAL      TYPE_B
                                                    │              │
                                                    ▼              └──→ Round N+1
                                          @reporter → final-report.md
```

## 核心特點

| 特點            | 說明                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- |
| 零外部依賴      | 完全基於 Copilot Chat 原生功能（Prompts + Skills + Instructions）                             |
| 多框架支援      | Angular/WEC、C#/.NET、Python，自動偵測不需手動選擇                                            |
| 知識分離 (SSOT) | 引擎不含框架知識，規則存放在各專案的 copilot-instructions.md                                  |
| 既有專案支援    | Phase 0 自動探索專案架構、測試設定、框架版本，生成 project-profile                            |
| 整合測試        | Phase D 在 Inner Loop 完成後執行整合測試（Playwright / WebApplicationFactory / pytest+httpx） |
| 自動防護        | 內建迴圈狀態追蹤、錯誤分級、振盪偵測、上下文預算管理                                          |
| 獨立部署        | 獨立 Git Repo，各專案透過安裝腳本引用                                                         |

## 快速開始

### 1. 安裝到目標專案

```bash
# Angular/WEC 專案
./scripts/setup-angular.sh /path/to/your/angular-project

# C# / .NET 專案
./scripts/setup-dotnet.sh /path/to/your/dotnet-project

# Python 專案
./scripts/setup-python.sh /path/to/your/python-project

# 驗證安裝
./scripts/validate-installation.sh /path/to/your/project
```

### 2. 撰寫 Spec

```yaml
# 使用 .github/ai-loop/core/spec-template.yaml 作為起點
spec_version: "1.0"
title: "新增用戶查詢功能"
scope: angular-wec # 或 dotnet / python / auto
acceptance_criteria:
  - 提供 GET /api/users 端點
  - 支援 name 參數過濾
  - 返回 UserDto 格式
constraints:
  - 遵循現有 DataService 繼承模式
  - 必須有單元測試覆蓋
```

### 3. 啟動迴圈

在 GitHub Copilot Chat 中輸入：

```
使用 ai-loop skill，根據以下 Spec 開始開發迴圈：
[貼上你的 Spec YAML]
```

## 檔案結構

```
.github/
├── prompts/
│   ├── ai-loop.prompt.md                  #1  主進入點
│   ├── ai-loop-dev.prompt.md             #2  Developer Agent
│   ├── ai-loop-test.prompt.md            #3  Tester Agent
│   ├── ai-loop-review.prompt.md          #4  Reviewer Agent
│   ├── ai-loop-integration-test.prompt.md #N  Integration Tester（Phase D）
│   └── final-report.prompt.md            #N  Final Report 產出者
├── skills/
│   └── ai-loop/SKILL.md            #5  Skill 定義
├── instructions/
│   ├── ai-loop-protocols.instructions.md          #6  核心協議
│   ├── ai-loop-error-taxonomy.instructions.md     #7  錯誤分級
│   └── ai-loop-anti-oscillation.instructions.md   #8  防振盪
└── ai-loop/
    ├── core/
│   │   ├── loop-orchestrator.md        #9  迴圈編排器
│   │   ├── loop-state.schema.yaml      #10 狀態 Schema
│   │   ├── context-budget.md           #11 上下文預算
│   │   ├── spec-template.yaml          #12 Spec 模板
│   │   ├── escape-hatch.md             #13 逃生艙
│   │   ├── project-discovery.md        #N  Phase 0 既有專案探索
│   │   └── project-profile.schema.yaml #N  專案 Profile Schema
│   ├── adapters/
│   │   ├── adapter-interface.md        #14 Strategy Interface（9 個方法）
│   │   ├── adapter-registry.md         #15 Factory + Composite
│   │   ├── angular-wec/                #16-19 Angular Adapter
│   │   ├── dotnet/                     #20-23 .NET Adapter
│   │   └── python/                     #24-27 Python Adapter
│   ├── templates/                      #28-31 輸出模板（含 integration-test-report.md）
│   └── tests/                          #43-44 引擎測試案例
        ├── loop-state.test.md
        └── adapter-detection.test.md

docs/                               #33-38 文件 + 範例
scripts/                            #39-42 安裝腳本
```

## 設計原則

### SOLID

| 原則 | 應用                                                             |
| ---- | ---------------------------------------------------------------- |
| SRP  | 每個 Agent 職責嚴格分離                                          |
| OCP  | 新增框架只加 Adapter，核心不動                                   |
| LSP  | 任何 Adapter 替換後引擎行為不變                                  |
| ISP  | Adapter 介面精確定義 9 個方法（7 個核心 + 2 個整合測試選用方法） |
| DIP  | 核心引擎依賴抽象介面，不引用具體 Adapter                         |

### Design Patterns

| Pattern                 | 位置                            |
| ----------------------- | ------------------------------- |
| Template Method         | Loop Orchestrator (#9)          |
| Strategy                | Adapter Interface (#14)         |
| Chain of Responsibility | Framework Detectors (#16,20,24) |
| Factory Method          | Adapter Registry (#15)          |
| Composite               | Multi-framework workspace (#15) |

## 文件

- [技術規格書](docs/ai-loop-spec.md)
- [Adapter 開發指南](docs/adapter-guide.md)
- [疑難排解](docs/troubleshooting.md)
- [Angular/WEC 範例](docs/examples/angular-wec-example.md)
- [.NET 範例](docs/examples/dotnet-example.md)
- [Python 範例](docs/examples/python-example.md)

---

**版本**: v5 Final | **引擎**: GitHub Copilot Chat Native | **維護**: AI Teams

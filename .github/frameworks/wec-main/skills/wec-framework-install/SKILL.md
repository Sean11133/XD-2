---
name: wec-framework-install
description: This skill should be used when the user asks to "安裝 WEC", "初始化 WEC UI", "開始 WEC UI 初始化", "clone wec-main", "設定 submodule", "選擇 submodule 或 npm", or asks for environment readiness checks for WEC.
---

# WEC Framework Install Skill

執行 WEC Framework 初始化流程，涵蓋環境檢查、fork/clone、依賴管理模式選擇與驗證安裝。

## Purpose

- 讓初始化流程一致、可追蹤、可重複。
- 在安裝前先檢查風險（版本、權限、網路、remote 設定）。
- 明確區分 Git Submodule 與 NPM Package 兩條路徑。

## Trigger Intent

在以下情境啟用：

- 使用者要建立 WEC 開發環境。
- 使用者需要從 fork 到本機 clone 的全流程引導。
- 使用者正在決策 submodule 與 npm 管理方式。

## Workflow

### 1) 環境前置檢查

檢查並回報：

- Node.js
- Git 與 git config
- npm / Angular CLI
- 內網連線與私有 registry 可用性

若有缺漏，先提供修復步驟，再進入下一階段。

### 2) Git 專案準備

引導完成：

- GitLab Group 確認
- wec-main fork
- clone 到本地
- 設定 upstream remote

### 3) 依賴模式決策

先比較兩種模式的適用場景，再請使用者明確選擇：

- A: Git Submodule（可修改框架原始碼）
- B: NPM Package（依賴管理簡化）

### 4) 執行模式化初始化

依使用者選擇執行對應流程：

- Submodule：`git submodule init/update` + `npm install`
- NPM：移除 submodule 相關設定、改採套件依賴

### 5) 安裝驗證

執行最小驗證：

- 啟動開發伺服器
- 確認主要命令可執行
- 回報未通過項目與修正建議

## Output Checklist

輸出時包含：

- 環境檢查結果（Pass/Fail）
- 當前採用模式（Submodule/NPM）
- 已完成命令清單
- 下一步（導向 `wec-system-init`）

## Additional Resources

- `../../prompts/wecui-install.prompt.md`
- `../../copilot-instructions.md`

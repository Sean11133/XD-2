---
name: wec-migration-deprecated-components
description: This skill should be used when the user asks to "遷移舊元件", "wec-button-group 改什麼", "wec-combo-box 替代", "2027 移除元件", "deprecated component migration", or wants batch migration plan for WEC UI components.
---

# WEC Deprecated Components Migration Skill

針對即將淘汰的 WEC 元件建立安全遷移流程，先盤點使用點，再分批替換、驗證與回歸。

## Purpose

- 在 2027 移除前完成可控遷移。
- 降低一次性替換造成的風險。
- 統一替代元件與行為差異處理。

## Trigger Intent

在以下情境使用：

- 使用者要移除 `wec-button-group`、`wec-combo-box`。
- 使用者要做全專案 deprecated 元件掃描。
- 使用者需要 migration checklist 與分批策略。

## Workflow

### 1) 掃描使用點

先找出所有引用，依系統/頁面分類。

### 2) 建立替換映射

標準映射：

- `wec-button-group` → `nb-button-group` 或客製按鈕群組
- `wec-combo-box` → `nb-select` 或 `@ng-select/ng-select`

### 3) 分批替換

以風險由低到高處理：

- 單純顯示頁先替換
- 互動複雜與商業流程頁後替換

### 4) 行為對齊

補齊事件、資料綁定、disabled/readonly 狀態差異。

### 5) 驗證與回歸

至少驗證：

- 初始值顯示
- 使用者選取/切換
- 提交資料格式
- 權限條件下的顯示與操作

## Guardrails

- 不同頁面不要同時做大規模邏輯重構；先做元件替換。
- 每批遷移需保留可回滾點。
- 不新增額外樣式系統，沿用 WEC + Nebular 樣式。

## Output Checklist

- deprecated 使用點清單
- 替代元件對照表
- 分批遷移順序與風險分級
- 每批驗證結果

## Additional Resources

- `references/deprecated-migration-playbook.md`
- `../../instructions/wec-components.instructions.md`
- `../../copilot-instructions.md`

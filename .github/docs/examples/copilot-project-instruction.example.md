---
applyTo: "**/*.cs,**/*.ts,**/*.py,**/*.html"
---

# 專案自訂規則（範本）

> 將此檔案複製到目標專案的 `.copilot/instructions/` 目錄，並依需求修改。
> 此檔案的規則會**補充** `.github/instructions/` 中的框架標準，而非覆寫。

## 使用方式

1. 複製此檔案至 `.copilot/instructions/my-project.instructions.md`
2. 修改 `applyTo` 為需要套用的檔案 glob pattern
3. 撰寫專案專屬規則
4. 刪除本說明區塊

---

## 專案概述

<!-- 簡述專案用途與領域，讓 AI 理解上下文 -->

- 專案名稱：[你的專案名稱]
- 領域：[例如：電商平台、內部管理系統、資料分析平台]
- 主要技術棧：[例如：.NET 8 + Angular 17]

## 專案特定規則

<!-- 列出專案獨有的規則，以下為常見範例 -->

### 架構約定

- <!-- 例如：使用 MediatR 作為 CQRS 調度器 -->
- <!-- 例如：API Response 統一使用 ApiResult<T> 封裝 -->

### 命名約定

- <!-- 例如：資料表命名使用 PascalCase -->
- <!-- 例如：API endpoint 使用 kebab-case -->

### 禁止事項（專案層級）

- <!-- 例如：禁止使用 EF Core 的 Lazy Loading -->
- <!-- 例如：禁止 Controller 直接呼叫 Repository -->

### 額外套件使用規範

- <!-- 例如：日誌統一使用 Serilog -->
- <!-- 例如：快取使用 IDistributedCache 介面 -->

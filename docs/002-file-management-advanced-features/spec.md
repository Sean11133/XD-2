# 需求規格書（Spec）

---

## 1. 專案基本資訊

| 欄位         | 內容                                              |
| ------------ | ------------------------------------------------- |
| 專案名稱     | 雲端檔案管理系統 — 進階功能（v1.1）               |
| 版本號       | v1.1.0                                            |
| 前置版本     | v1.0.0（docs/001-file-management-system/spec.md） |
| 負責人（PM） | AI PM（@pm）                                      |
| 建立日期     | 2026-03-27                                        |
| 最後更新     | 2026-03-27                                        |
| 審核狀態     | [x] 待審核 &ensp; [ ] 已通過 &ensp; [ ] 需修改    |

---

## 2. 背景與目標

### 2.1 業務背景

v1.0 已完成基本樹狀結構瀏覽，客戶進一步提出三項進階需求：

1. 當檔案數量增多時，需要能快速搜尋特定名稱的檔案。
2. 需要知道整個目錄樹（及每個子目錄）所佔用的總大小，方便容量管理。
3. 系統需要與外部系統整合，須能匯出標準化資料格式（XML）。

### 2.2 專案目標

1. 在現有樹狀瀏覽頁面上疊加「搜尋」、「大小顯示」、「XML 匯出」三項功能。
2. 不破壞現有 Domain Layer 設計原則（Composite Pattern、SOLID）。
3. 新增功能均需有對應的單元測試覆蓋。

### 2.3 成功指標（KPI）

| 指標名稱                     | 目標值 | 衡量方式                                     | 評估時間點 |
| ---------------------------- | ------ | -------------------------------------------- | ---------- |
| 搜尋功能正確率               | 100%   | 輸入關鍵字後，符合節點全部保留，其他全部隱藏 | 開發完成時 |
| 大小計算正確率               | 100%   | 手動加總各葉節點大小 = 顯示值                | 開發完成時 |
| XML 匯出完整性               | 100%   | 匯出 XML 可解析，且包含所有節點資訊          | 開發完成時 |
| 單元測試覆蓋率（新增程式碼） | ≥ 80%  | 執行 `vitest --coverage` 查看                | CI 完成時  |

---

## 3. 利害關係人

| 角色     | 姓名               | 職責                           | 聯絡方式 |
| -------- | ------------------ | ------------------------------ | -------- |
| 客戶     | [待確認：客戶姓名] | 提供需求、驗收確認             | （待補） |
| PM       | AI PM              | 需求分析與規格書產出           | —        |
| 開發人員 | [待確認]           | Domain 擴充、UI 整合、測試撰寫 | （待補） |
| 外部系統 | [待確認系統名稱]   | 接收匯出的 XML 進行整合        | （待補） |

---

## 4. 功能需求

### 4.1 功能清單總覽

| 編號  | 功能名稱                       | 優先級 | 狀態  |
| ----- | ------------------------------ | ------ | ----- |
| F-101 | 目錄及檔案大小計算與顯示       | P0     | Ready |
| F-102 | 關鍵字搜尋（保留樹狀結構呈現） | P0     | Ready |
| F-103 | 匯出 XML 格式                  | P0     | Ready |

---

### 4.2 User Story 詳述

---

#### US-101：每個目錄節點顯示子樹大小加總

| 欄位     | 內容                     |
| -------- | ------------------------ |
| 編號     | US-101                   |
| 標題     | 目錄節點顯示子樹大小加總 |
| 對應功能 | F-101                    |
| 優先級   | P0                       |

**描述**

- **角色**：作為系統使用者
- **需求**：我想在每個目錄節點旁看到該目錄（含所有子目錄與檔案）的大小加總
- **目的**：以便判斷哪個目錄佔用空間最多，進行容量管理

**驗收標準（Given-When-Then）**

```
Scenario 1：單層目錄大小顯示
  Given  一個目錄「設定檔」，內含 config.txt（2KB）與 readme.txt（5KB）
  When   畫面渲染目錄節點
  Then   目錄節點顯示「設定檔（7 KB）」

Scenario 2：巢狀目錄大小遞迴加總
  Given  目錄「專案文件」含直接子檔案 100KB，子目錄「設計圖」內有 1536KB
  When   畫面渲染「專案文件」目錄節點
  Then   「專案文件」節點顯示「專案文件（1636 KB）」或換算成「（1.60 MB）」

Scenario 3：空目錄顯示 0
  Given  一個沒有任何子節點的空目錄
  When   畫面渲染
  Then   節點顯示「目錄名稱（0 KB）」
```

**業務規則**

- 大小單位：KB 為基本單位；若 ≥ 1024 KB，自動換算顯示為 MB（保留兩位小數）
- 大小計算須遞迴走訪所有子孫節點（實作於 Domain Layer，遵循 Composite Pattern）

---

#### US-102：輸入關鍵字後按 Enter 篩選樹狀結構

| 欄位     | 內容                           |
| -------- | ------------------------------ |
| 編號     | US-102                         |
| 標題     | 關鍵字搜尋（保留樹狀結構呈現） |
| 對應功能 | F-102                          |
| 優先級   | P0                             |

**描述**

- **角色**：作為系統使用者
- **需求**：我想在搜尋框輸入關鍵字後按下 Enter，畫面只保留名稱包含關鍵字的節點（維持樹狀結構，但隱藏不符合的節點）
- **目的**：以便在大量檔案中快速定位目標

**驗收標準（Given-When-Then）**

```
Scenario 1：搜尋到葉節點
  Given  樹中有檔案「需求規格.docx」與「會議紀錄.docx」
  When   輸入「需求」並按 Enter
  Then   只有「需求規格.docx」可見，其所有父目錄路徑也保持可見（因為要呈現樹狀位置）
         「會議紀錄.docx」被隱藏

Scenario 2：搜尋結果為空
  Given  樹中沒有任何節點名稱包含「zzz」
  When   輸入「zzz」並按 Enter
  Then   樹狀區域顯示「找不到符合「zzz」的檔案」提示訊息

Scenario 3：搜尋不分大小寫
  Given  樹中有 README.txt
  When   輸入「readme」並按 Enter
  Then   README.txt 可見

Scenario 4：清除搜尋
  Given  目前有篩選條件
  When   清除搜尋框內容並按 Enter（或點擊清除按鈕）
  Then   恢復完整樹狀結構呈現
```

**業務規則**

- 觸發方式：按下 `Enter` 鍵才執行搜尋（非即時篩選）
- 呈現方式：保留樹狀結構，符合節點的所有祖先目錄路徑必須一同顯示（否則節點無法定位）
- 搜尋範圍：節點名稱（`name` 屬性），不搜尋其他 metadata
- 不分大小寫（case-insensitive）

---

#### US-103：點擊按鈕匯出 XML 檔案

| 欄位     | 內容          |
| -------- | ------------- |
| 編號     | US-103        |
| 標題     | 匯出 XML 格式 |
| 對應功能 | F-103         |
| 優先級   | P0            |

**描述**

- **角色**：作為系統使用者或整合工程師
- **需求**：我想點擊「匯出 XML」按鈕，觸發瀏覽器下載包含整棵檔案樹資料的 XML 檔案
- **目的**：以便提供給外部系統進行資料整合

**驗收標準（Given-When-Then）**

```
Scenario 1：基本匯出觸發
  Given  畫面已載入檔案樹
  When   使用者點擊「匯出 XML」按鈕
  Then   瀏覽器下載一個名為「file-system.xml」的檔案
         檔案開頭包含 <?xml version="1.0" encoding="UTF-8"?>

Scenario 2：目錄節點結構
  Given  有一個目錄「專案文件」含子目錄「設計圖」
  When   匯出 XML
  Then   XML 結構為：
         <Directory name="專案文件">
           <Directory name="設計圖" />
         </Directory>

Scenario 3：各類型檔案節點屬性
  Given  樹中含 WordDocument、ImageFile、TextFile 各一
  When   匯出 XML
  Then   WordDocument 包含 type、name、sizeKB、createdAt、pageCount 屬性
         ImageFile    包含 type、name、sizeKB、createdAt、width、height 屬性
         TextFile     包含 type、name、sizeKB、createdAt、encoding 屬性

Scenario 4：特殊字元正確跳脫
  Given  某節點名稱含有 < > & " ' 等 XML 特殊字元
  When   匯出 XML
  Then   特殊字元正確跳脫（&lt; &gt; &amp; &quot; &apos;），不產生非法 XML
```

**XML Schema 設計（自訂版 v1）**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Directory name="根目錄">
  <Directory name="專案文件">
    <File type="WordDocument" name="需求規格.docx"
          sizeKB="245" createdAt="2026-03-20" pageCount="12" />
    <Directory name="設計圖">
      <File type="ImageFile" name="架構圖.png"
            sizeKB="1024" createdAt="2026-03-21" width="1920" height="1080" />
    </Directory>
  </Directory>
  <Directory name="設定檔">
    <File type="TextFile" name="config.txt"
          sizeKB="2" createdAt="2026-03-15" encoding="UTF-8" />
  </Directory>
  <File type="WordDocument" name="專案計畫.docx"
        sizeKB="320" createdAt="2026-03-10" pageCount="25" />
</Directory>
```

**業務規則**

- 檔案名稱：固定為 `file-system.xml`
- 匯出範圍：整棵樹（從根目錄開始）
- 匯出當下的樹狀資料為準（不含搜尋篩選狀態影響）
- XML 特殊字元須正確跳脫（安全性要求）

---

## 5. 非功能需求

| 編號   | 類型     | 需求描述                                                                  | 量化指標                            |
| ------ | -------- | ------------------------------------------------------------------------- | ----------------------------------- |
| NF-101 | 效能     | 搜尋與大小計算在前端記憶體內完成，不應造成 UI 卡頓                        | 操作回應時間 < 100ms（1000 個節點） |
| NF-102 | 可維護性 | 新功能（getSizeKB、search）實作於 Domain Layer，UI 層僅呼叫，不含業務邏輯 | —                                   |
| NF-103 | 安全性   | XML 匯出須對特殊字元進行跳脫，防止 XML Injection                          | 所有 5 個 XML 特殊字元均處理        |
| NF-104 | 可測試性 | 新增 Domain 方法與 Service 均有對應單元測試                               | 新增程式碼測試覆蓋率 ≥ 80%          |
| NF-105 | 相容性   | 產出的 XML 須為合法 XML 1.0（UTF-8），可被標準 XML Parser 解析            | xmllint 驗證通過                    |

---

## 6. In Scope / Out of Scope

### In Scope（本版包含）

- [x] `F-101` 目錄節點大小加總計算與顯示
- [x] `F-102` 按 Enter 觸發的關鍵字搜尋（保留樹狀結構，隱藏不符節點）
- [x] `F-103` 整棵樹匯出為 XML 並觸發瀏覽器下載

### Out of Scope（本版不包含）

- [ ] 複製、貼上、刪除、排序等 CRUD 操作（列入 v1.2 規劃）
- [ ] 搜尋歷史紀錄
- [ ] XML Import（只做 Export）
- [ ] 其他匯出格式（JSON、CSV）
- [ ] 後端 API / 資料庫持久化（本版仍為前端 in-memory）
- [ ] 使用者權限控管

---

## 7. 技術棧

| 層級       | 技術                          | 備注                               |
| ---------- | ----------------------------- | ---------------------------------- |
| 前端框架   | React 18 + TypeScript         | Vite 建構                          |
| 樣式       | Tailwind CSS                  | 現有方案延續                       |
| Domain 層  | TypeScript Class（Composite） | `getSizeKB()`、`search()` 新增於此 |
| Service 層 | TypeScript 純函式             | `FileSystemXmlExporter.ts`（新建） |
| 測試框架   | Vitest                        | 現有方案延續                       |

---

## 8. 架構影響分析

### 需新增 / 修改的檔案

| 檔案                                           | 異動類型 | 說明                                                  |
| ---------------------------------------------- | -------- | ----------------------------------------------------- |
| `src/domain/FileSystemNode.ts`                 | 修改     | 新增 abstract `getSizeKB(): number`                   |
| `src/domain/File.ts`                           | 修改     | 實作 `getSizeKB()` → 回傳 `this.sizeKB`               |
| `src/domain/Directory.ts`                      | 修改     | 實作 `getSizeKB()` 遞迴加總；新增 `search()` 方法     |
| `src/services/FileSystemXmlExporter.ts`        | 新增     | `exportToXml(root: Directory): string` 純函式 Service |
| `src/components/TreeNodeItem.tsx`              | 修改     | 目錄節點旁顯示大小；接收搜尋篩選 prop                 |
| `src/components/FileTreeView.tsx`              | 修改     | 接收 `searchKeyword` prop，傳遞給子節點               |
| `src/App.tsx`                                  | 修改     | 搜尋框 + Enter 事件 + 匯出按鈕 + 大小顯示整合         |
| `tests/domain/Directory.test.ts`               | 修改     | 補充 `getSizeKB` 與 `search` 測試案例                 |
| `tests/services/FileSystemXmlExporter.test.ts` | 新增     | XML 匯出完整測試                                      |

---

## 9. 依賴與風險

| 類型 | 描述                                                                   | 緩解策略                                                |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| 風險 | 保留樹狀結構的搜尋篩選邏輯較複雜（祖先節點須隨子節點顯示狀態動態顯示） | 在 `Directory.search()` 回傳匹配節點集合，UI 層遞迴判斷 |
| 風險 | XML 特殊字元跳脫若遺漏，可能產生非法 XML 導致外部系統解析失敗          | Service 層統一處理跳脫，測試覆蓋 5 個特殊字元           |
| 假設 | 客戶外部系統可接受本規格定義的 XML Schema v1，如有不相容需求須補充確認 | [待確認：外部系統名稱與對接窗口]                        |

---

## 10. 開放問題（Parking Lot）

| 編號 | 問題                                        | 狀態   | 負責人    |
| ---- | ------------------------------------------- | ------ | --------- |
| PL-1 | 外部整合系統的名稱及 XML Schema 確認        | 待確認 | 客戶      |
| PL-2 | 複製、貼上、刪除、排序（v1.0 提及）列入哪版 | 待確認 | PM + 客戶 |

---

_本文件由 AI PM（@pm）依客戶訪談紀錄自動生成，需經人工審核後方可作為開發依據。_

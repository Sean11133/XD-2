# 執行計畫（Plan）

---

## 1. 文件資訊

| 欄位     | 內容                                 |
| -------- | ------------------------------------ |
| 文件名稱 | Plan — 雲端檔案管理系統進階功能 v1.1 |
| 版本     | v1.1.0                               |
| 對應需求 | [spec.md](./spec.md)                 |
| 對應設計 | [FRD.md](./FRD.md)                   |
| 建立日期 | 2026-03-27                           |

---

## 8. 工作拆解（Task Breakdown）

### 執行順序總覽

```
T-01 (Domain: IFileSystemVisitor 介面 + getSizeKB + accept（Leaf 節點）)
  └─► T-02 (Domain: Directory getSizeKB / search / accept)
        ├─► T-03 (Service: XmlExporter as Concrete Visitor)
        │     └─► T-07 (Test: Service)
        └─► T-04 (UI: TreeNodeItem)
              └─► T-05 (UI: FileTreeView + App)
                    └─► T-06 (Test: Domain)
```

---

### T-01：新增 `getSizeKB()` 抽象方法至 Domain 基礎類別

| 欄位        | 內容                                         |
| ----------- | -------------------------------------------- |
| 編號        | T-01                                         |
| 名稱        | 擴充 FileSystemNode 與 File 加入 getSizeKB() |
| 架構層      | Domain                                       |
| 複雜度      | 低                                           |
| 前置依賴    | 無                                           |
| 配置/設定檔 | 無                                           |

**詳細描述**

修改 `src/domain/FileSystemNode.ts`：

```typescript
// 新增 abstract 方法（在 getDisplayInfo 之後）
abstract getSizeKB(): number;
```

修改 `src/domain/File.ts`：

```typescript
// 在 formatDate() 之前新增實作
getSizeKB(): number {
  return this.sizeKB;
}
```

**測試策略**：T-06 補充測試，驗證 WordDocument / ImageFile / TextFile 的 getSizeKB() 各回傳 this.sizeKB。

---

### T-02：實作 `Directory.getSizeKB()` 與 `Directory.search()`

| 欄位        | 內容                                           |
| ----------- | ---------------------------------------------- |
| 編號        | T-02                                           |
| 名稱        | 實作 Directory 的 getSizeKB 遞迴與 search 走訪 |
| 架構層      | Domain                                         |
| 複雜度      | 中                                             |
| 前置依賴    | T-01                                           |
| 配置/設定檔 | 無                                             |

**詳細描述**

修改 `src/domain/Directory.ts`，在 `isDirectory()` 之後新增：

```typescript
/**
 * 遞迴計算此目錄（含子目錄）所有節點的大小加總（KB）
 * Composite Pattern：目錄節點加總子節點，葉節點回傳自身
 */
getSizeKB(): number {
  return this._children.reduce((sum, child) => sum + child.getSizeKB(), 0);
}

/**
 * 遞迴搜尋名稱包含 keyword 的所有節點（不分大小寫）
 * 回傳匹配節點的扁平列表（不含祖先展開邏輯，由 UI 層處理）
 */
search(keyword: string): FileSystemNode[] {
  const lower = keyword.toLowerCase();
  const results: FileSystemNode[] = [];
  for (const child of this._children) {
    if (child.name.toLowerCase().includes(lower)) {
      results.push(child);
    }
    if (child.isDirectory()) {
      results.push(...(child as Directory).search(keyword));
    }
  }
  return results;
}

/**
 * Visitor Pattern — Composite 節點的 accept 實作
 * visitDirectory 被呼叫後，由 Visitor 決定是否遞迴走訪子節點
 */
accept(visitor: IFileSystemVisitor): void {
  visitor.visitDirectory(this);
}
```

**測試策略**：T-06 補充測試，覆蓋：空目錄、單層加總、巢層遞迴、搜尋命中、搜尋不命中、不分大小寫、`accept()` 正確回呼 visitor.visitDirectory。

---

### T-03：建立 `FileSystemXmlExporter`（Visitor Pattern 實作）

| 欄位        | 內容                                               |
| ----------- | -------------------------------------------------- |
| 編號        | T-03                                               |
| 名稱        | 建立 FileSystemXmlExporter 實作 IFileSystemVisitor |
| 架構層      | Service                                            |
| 複雜度      | 中                                                 |
| 前置依賴    | T-01                                               |
| 配置/設定檔 | 無（新增目錄 `src/services/`）                     |

**詳細描述**

建立 `src/services/FileSystemXmlExporter.ts`，以 **Visitor Pattern** 實作 XML 序列化：

```typescript
import { IFileSystemVisitor } from "../domain/IFileSystemVisitor";
import type { WordDocument } from "../domain/WordDocument";
import type { ImageFile } from "../domain/ImageFile";
import type { TextFile } from "../domain/TextFile";
import type { Directory } from "../domain/Directory";

/**
 * Concrete Visitor — 實作 IFileSystemVisitor
 * 透過 accept() 多型分派，不使用 instanceof 判斷型別（符合 OCP）
 */
class FileSystemXmlExporter implements IFileSystemVisitor {
  private readonly _lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
  ];
  private _indentLevel = 0;

  private get _pad(): string {
    return "  ".repeat(this._indentLevel);
  }

  visitWordDocument(node: WordDocument): void {
    this._lines.push(
      `${this._pad}<File type="WordDocument"` +
        ` name="${escapeXml(node.name)}" sizeKB="${node.sizeKB}"` +
        ` createdAt="${formatDate(node.createdAt)}" pageCount="${node.pageCount}" />`,
    );
  }

  visitImageFile(node: ImageFile): void {
    this._lines.push(
      `${this._pad}<File type="ImageFile"` +
        ` name="${escapeXml(node.name)}" sizeKB="${node.sizeKB}"` +
        ` createdAt="${formatDate(node.createdAt)}"` +
        ` width="${node.width}" height="${node.height}" />`,
    );
  }

  visitTextFile(node: TextFile): void {
    this._lines.push(
      `${this._pad}<File type="TextFile"` +
        ` name="${escapeXml(node.name)}" sizeKB="${node.sizeKB}"` +
        ` createdAt="${formatDate(node.createdAt)}" encoding="${escapeXml(node.encoding)}" />`,
    );
  }

  visitDirectory(node: Directory): void {
    const children = node.getChildren();
    const nameAttr = `name="${escapeXml(node.name)}"`;
    if (children.length === 0) {
      this._lines.push(`${this._pad}<Directory ${nameAttr} />`);
      return;
    }
    this._lines.push(`${this._pad}<Directory ${nameAttr}>`);
    this._indentLevel++;
    for (const child of children) {
      child.accept(this); // ← 遞迴：透過 accept 多型分派，非 instanceof
    }
    this._indentLevel--;
    this._lines.push(`${this._pad}</Directory>`);
  }

  getResult(): string {
    return this._lines.join("\n") + "\n";
  }
}

/** 對外入口：建立 Visitor 實例後呼叫 root.accept() */
export function exportToXml(root: Directory): string {
  const exporter = new FileSystemXmlExporter();
  root.accept(exporter);
  return exporter.getResult();
}

/** XML 特殊字元跳脫（& 必須最先處理） */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

**測試策略**：T-07 建立 `tests/services/FileSystemXmlExporter.test.ts`，覆蓋：XML 標頭、各型別 visitXxx 屬性輸出、巢狀目錄縮排、特殊字元跳脫、accept 呼叫鏈正確性。

---

### T-04：修改 `TreeNodeItem.tsx` — 顯示大小與篩選邏輯

| 欄位        | 內容                                     |
| ----------- | ---------------------------------------- |
| 編號        | T-04                                     |
| 名稱        | 修改 TreeNodeItem 支援大小顯示與搜尋篩選 |
| 架構層      | Presentation                             |
| 複雜度      | 中                                       |
| 前置依賴    | T-02                                     |
| 配置/設定檔 | 無                                       |

**詳細描述**

修改 `src/components/TreeNodeItem.tsx`：

新增 props：

```typescript
interface TreeNodeItemProps {
  node: FileSystemNode;
  level: number;
  matchedPaths?: Set<string>; // 搜尋模式下傳入；undefined = 顯示全部
  currentPath?: string; // 節點路徑（用於 Set 查找），格式：「根目錄/專案文件/需求規格.docx」
}
```

目錄節點顯示邏輯：

```typescript
// 1. 大小顯示（formatSize 工具函式）
const sizeLabel = formatSize(dir.getSizeKB());
// 顯示：「📁 設定檔（7 KB）」

// 2. 搜尋篩選：若傳入 matchedPaths，
//    目錄節點只有在 matchedPaths 中有任一子孫時才渲染
//    （遞迴判斷：若 children 全部過濾後為空，則目錄也不渲染）
```

工具函式（定義在 TreeNodeItem 或獨立 `src/utils/formatSize.ts`）：

```typescript
function formatSize(sizeKB: number): string {
  if (sizeKB >= 1024) return `${(sizeKB / 1024).toFixed(2)} MB`;
  return `${sizeKB} KB`;
}
```

---

### T-05：修改 `FileTreeView.tsx` 與 `App.tsx` — 串接搜尋/匯出 UI

| 欄位        | 內容                                                    |
| ----------- | ------------------------------------------------------- |
| 編號        | T-05                                                    |
| 名稱        | 修改 App 與 FileTreeView 串接搜尋框、匯出按鈕與大小統計 |
| 架構層      | Presentation                                            |
| 複雜度      | 中                                                      |
| 前置依賴    | T-03, T-04                                              |
| 配置/設定檔 | 無                                                      |

**詳細描述**

修改 `src/App.tsx`：

```typescript
// State
const [inputValue, setInputValue] = useState(""); // 輸入框受控值
const [keyword, setKeyword] = useState(""); // Enter 確認後的搜尋關鍵字

// Enter 觸發搜尋
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter") setKeyword(inputValue.trim());
};

// useMemo 計算匹配 Set（包含祖先路徑補全）
const matchedPaths = useMemo(() => {
  if (!keyword) return undefined;
  // 1. root.search(keyword) 取得匹配節點
  // 2. 走訪樹找出各匹配節點的完整路徑（DFS + 路徑追蹤）
  // 3. 將路徑及其所有前綴（祖先）加入 Set
  return buildMatchedPathSet(root, keyword);
}, [keyword]);

// 匯出按鈕
const handleExportXml = () => {
  const xml = exportToXml(root);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "file-system.xml";
  a.click();
  URL.revokeObjectURL(url);
};
```

`buildMatchedPathSet` 輔助函式（定義在 App.tsx 或 `src/utils/searchUtils.ts`）：

```typescript
// DFS 走訪，追蹤路徑並將匹配節點的路徑及所有祖先路徑加入 Set
function buildMatchedPathSet(root: Directory, keyword: string): Set<string>;
```

修改 `src/components/FileTreeView.tsx`：

- 接收 `matchedPaths?: Set<string>` prop
- 傳遞 `currentPath` 給每個 `TreeNodeItem`

**UI 元件結構**（參考 FRD §6.1）：

```tsx
<div>
  <h1>📂 雲端檔案管理系統</h1>
  <p>系統總大小：{formatSize(root.getSizeKB())}</p>

  {/* 工具列 */}
  <div>
    <input value={inputValue} onChange={...} onKeyDown={handleKeyDown}
           placeholder="搜尋檔案名稱… (Enter 搜尋)" />
    {keyword && <button onClick={() => { setKeyword(""); setInputValue(""); }}>清除</button>}
    <button onClick={handleExportXml}>匯出 XML</button>
  </div>

  {/* 搜尋無結果提示 */}
  {keyword && matchedPaths?.size === 0 && (
    <p>找不到包含「{keyword}」的檔案</p>
  )}

  <FileTreeView root={root} matchedPaths={matchedPaths} />
</div>
```

---

### T-06：補充 Domain 單元測試

| 欄位        | 內容                                                   |
| ----------- | ------------------------------------------------------ |
| 編號        | T-06                                                   |
| 名稱        | 補充 Directory.test.ts 的 getSizeKB 與 search 測試案例 |
| 架構層      | Test                                                   |
| 複雜度      | 低                                                     |
| 前置依賴    | T-02                                                   |
| 配置/設定檔 | 無                                                     |

**詳細描述**

修改 `tests/domain/Directory.test.ts`，新增以下 describe 區塊：

```typescript
describe("Directory.getSizeKB", () => {
  it("空目錄回傳 0");
  it("只含直接子檔案時回傳其大小加總");
  it("巢狀目錄遞迴加總（Composite Pattern）");
  it("空子目錄不影響加總結果");
});

describe("Directory.search", () => {
  it("空目錄搜尋回傳空陣列");
  it("找到直接子節點（大小寫不敏感）");
  it("遞迴搜尋子目錄內的節點");
  it("關鍵字不符合時回傳空陣列");
  it("部分關鍵字符合多個節點時全部回傳");
  it("搜尋結果包含符合條件的子目錄本身");
});
```

亦可在 `tests/domain/FileSystemNode.test.ts` 補充各 Leaf 型別的 `getSizeKB()` 測試。

---

### T-07：建立 FileSystemXmlExporter 單元測試

| 欄位        | 內容                                        |
| ----------- | ------------------------------------------- |
| 編號        | T-07                                        |
| 名稱        | 建立 FileSystemXmlExporter.test.ts 完整測試 |
| 架構層      | Test                                        |
| 複雜度      | 低                                          |
| 前置依賴    | T-03                                        |
| 配置/設定檔 | 無（新增 `tests/services/` 目錄）           |

**詳細描述**

建立 `tests/services/FileSystemXmlExporter.test.ts`：

```typescript
describe("FileSystemXmlExporter.exportToXml", () => {
  it("輸出包含 XML 宣告標頭");
  it("空目錄輸出自閉合標籤");
  it("含 WordDocument 子節點輸出正確屬性（visitWordDocument 觸發）");
  it("含 ImageFile 子節點輸出正確屬性（visitImageFile 觸發）");
  it("含 TextFile 子節點輸出正確屬性（visitTextFile 觸發）");
  it("巢層目錄輸出正確縮排層級（visitDirectory 遞迴 accept）");
  it("名稱含 XML 特殊字元時正確跨脱（防 XML Injection）");
  it("& 字元最先被跨脱（不雙重跨脱）");
  it("accept 呼叫鏈：root.accept → visitDirectory → child.accept → visitXxx");
});
```

---

## 9. 測試策略

| 層級         | 框架   | 測試類型 | 覆蓋目標                                              |
| ------------ | ------ | -------- | ----------------------------------------------------- |
| Domain       | Vitest | 單元測試 | `getSizeKB()`、`search()` 各方法的正常/邊界/錯誤案例  |
| Service      | Vitest | 單元測試 | XML 輸出格式、特殊字元跳脫、各節點型別屬性完整性      |
| Presentation | —      | 手動驗收 | UI 搜尋觸發、篩選後樹狀結構、大小顯示、瀏覽器下載觸發 |

**覆蓋率目標**：新增程式碼 ≥ 80%（執行 `npx vitest --coverage` 確認）

---

## 10. 部署架構

本版為純前端 in-memory 應用，無後端服務：

```
開發環境：npx vite dev（:3000）
建置產物：npx vite build → dist/ 靜態檔案
部署方式：靜態檔案托管（Nginx / CDN）
```

XML 匯出：完全在瀏覽器端執行（Blob API + URL.createObjectURL），無需後端。

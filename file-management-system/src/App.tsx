import { useMemo, useRef, useState } from "react";
import { buildSampleTree } from "./data/sampleData";
import { FileTreeView } from "./components/FileTreeView";
import { Directory } from "./domain/Directory";
import { exportToXml } from "./services/FileSystemXmlExporter";

/** 格式化總大小，同 TreeNodeItem 規則（≥1024 KB 顯示 MB） */
function formatSize(sizeKB: number): string {
  if (sizeKB >= 1024) {
    return `${(sizeKB / 1024).toFixed(2)} MB`;
  }
  return `${sizeKB} KB`;
}

/**
 * 遞迴建立搜尋命中路徑集合（包含所有 ancestor 目錄路徑）
 * 回傳 true 表示該子樹內有命中節點
 */
function buildMatchedPaths(
  dir: Directory,
  keyword: string,
  dirPath: string,
  result: Set<string>
): boolean {
  const lower = keyword.toLowerCase();
  let hasMatch =
    dir.name.toLowerCase().includes(lower) && dir.name !== dirPath; // 根目錄名稱不算子節點

  for (const child of dir.getChildren()) {
    const childPath = `${dirPath}/${child.name}`;
    if (child.isDirectory()) {
      const childHasMatch = buildMatchedPaths(
        child as Directory,
        keyword,
        childPath,
        result
      );
      if (child.name.toLowerCase().includes(lower) || childHasMatch) {
        result.add(childPath);
        hasMatch = true;
      }
    } else {
      if (child.name.toLowerCase().includes(lower)) {
        result.add(childPath);
        hasMatch = true;
      }
    }
  }
  return hasMatch;
}

function App() {
  // buildSampleTree 用 useMemo 避免每次 re-render 重新建立
  const root = useMemo(() => buildSampleTree(), []);

  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 計算總大小（根目錄不重新建立，直接讀取）
  const totalSize = useMemo(() => root.getSizeKB(), [root]);

  // 搜尋命中路徑集合；keyword 為空時 undefined（全部顯示）
  const matchedPaths = useMemo<Set<string> | undefined>(() => {
    if (!keyword.trim()) return undefined;
    const paths = new Set<string>();
    const rootHasDescendants = buildMatchedPaths(root, keyword, root.name, paths);
    // 根節點只要有任何命中就加入
    if (rootHasDescendants || root.name.toLowerCase().includes(keyword.toLowerCase())) {
      paths.add(root.name);
    }
    return paths;
  }, [root, keyword]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setKeyword(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setKeyword("");
    inputRef.current?.focus();
  };

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

  const isSearchActive = keyword.trim().length > 0;
  const resultCount = matchedPaths
    ? [...matchedPaths].filter((p) => p !== root.name && !p.includes("/") ? false : true).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">📂 雲端檔案管理系統</h1>
        <span className="text-sm text-gray-500">
          總大小：<strong>{formatSize(totalSize)}</strong>
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入關鍵字後按 Enter 搜尋…"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {isSearchActive && (
          <button
            onClick={handleClear}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100"
          >
            清除
          </button>
        )}
        <button
          onClick={handleExportXml}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          匯出 XML
        </button>
      </div>

      {/* Search status */}
      {isSearchActive && (
        <p className="text-xs text-gray-500 mb-2">
          搜尋「{keyword}」共找到{" "}
          <strong>{resultCount}</strong> 個節點
        </p>
      )}

      {/* Tree */}
      <FileTreeView root={root} matchedPaths={matchedPaths} />
    </div>
  );
}

export default App;


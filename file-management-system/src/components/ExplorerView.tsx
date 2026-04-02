import { useState, useEffect } from "react";
import { Directory } from "../domain/Directory";
import type { FileSystemNode } from "../domain/FileSystemNode";
import { useNavigationHistory } from "../hooks/useNavigationHistory";
import { NavigationBar } from "./NavigationBar";
import { ExplorerItemGrid } from "./ExplorerItemGrid";
import { ExplorerItemList } from "./ExplorerItemList";

type ViewMode = "grid" | "list";

interface ExplorerViewProps {
  rootNode: Directory;
  /** 目前左側選取的節點 ID（用於同步高亮） */
  selectedNodeId?: string | null;
  /** 進入資料夾時通知父元件（用於同步左側樹） */
  onFolderChange?: (node: Directory) => void;
  /** 點擊檔案時展示詳情（由父元件紟一處理） */
  onFileSelect?: (node: FileSystemNode, parent: Directory | null) => void;
  /** 外部導覽目標：左側樹點擊 Directory 時傳入，驅動右側跳至對應資料夾 */
  navigateTo?: Directory | null;
}

/**
 * ExplorerView — 右側主瀏覽區（Windows 檔案總管風格）
 *
 * 顯示當前資料夾的直接子項目，支援格網/清單切換，
 * 上方有 NavigationBar（麵包屑 + 前後導覽）。
 * 點擊資料夾 → 進入；點擊檔案 → 開啟 NodeDetailDrawer。
 */
export const ExplorerView: React.FC<ExplorerViewProps> = ({
  rootNode,
  onFolderChange,
  onFileSelect,
  navigateTo,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const history = useNavigationHistory(rootNode);

  const { currentNode, push } = history;
  const displayNodes = currentNode
    ? Array.from(currentNode.getChildren())
    : [];

  // 外部導覽：左側樹選取 Directory 時，驅動右側跳至對應資料夾
  useEffect(() => {
    if (navigateTo && navigateTo !== currentNode) {
      push(navigateTo);
    }
    // 僅在 navigateTo 改變時觸發，不追蹤 currentNode 以避免循環
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigateTo]);

  const handleFolderEnter = (dir: Directory) => {
    push(dir);
    onFolderChange?.(dir);
  };

  const handleFileClick = (node: FileSystemNode) => {
    onFileSelect?.(node, currentNode);
  };

  // 麵包屑導覽（點擊跳轉回上層）
  const handleBreadcrumbNavigate = (dir: Directory) => {
    push(dir);
    onFolderChange?.(dir);
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ background: "var(--bg-app)" }}
    >
      {/* 頂部導覽列 */}
      <NavigationBar history={history} onNavigate={handleBreadcrumbNavigate} />

      {/* 工具列：Grid/List 切換 */}
      <div
        className="flex items-center justify-end gap-1 px-3 py-1"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        <button
          aria-label="格網模式"
          title="格網模式"
          onClick={() => setViewMode("grid")}
          className="p-1.5 rounded transition-colors"
          style={{
            background: viewMode === "grid" ? "var(--bg-selected, var(--bg-hover))" : "transparent",
            color: viewMode === "grid" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          aria-label="清單模式"
          title="清單模式"
          onClick={() => setViewMode("list")}
          className="p-1.5 rounded transition-colors"
          style={{
            background: viewMode === "list" ? "var(--bg-selected, var(--bg-hover))" : "transparent",
            color: viewMode === "list" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "grid" ? (
          <ExplorerItemGrid
            nodes={displayNodes}
            onFolderEnter={handleFolderEnter}
            onFileClick={handleFileClick}
          />
        ) : (
          <ExplorerItemList
            nodes={displayNodes}
            onFolderEnter={handleFolderEnter}
            onFileClick={handleFileClick}
          />
        )}
      </div>
    </div>
  );
};

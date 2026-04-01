import { useEffect } from "react";
import type { FileSystemNode } from "../domain/FileSystemNode";
import { Directory } from "../domain/Directory";
import type { File as FsFile } from "../domain/File";
import type { LabelWithPriority } from "../domain/labels/LabelWithPriority";

function formatSize(sizeKB: number): string {
  if (!sizeKB) return "-";
  if (sizeKB >= 1024) return `${(sizeKB / 1024).toFixed(1)} MB`;
  return `${sizeKB} KB`;
}

function getNodeTypeLabel(node: FileSystemNode): string {
  if (node.isDirectory()) return "資料夾";
  const name = node.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".png") || name.endsWith(".jpeg"))
    return "圖片檔";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "Word 文件";
  if (name.endsWith(".txt")) return "文字檔";
  return "檔案";
}

interface NodeDetailDrawerProps {
  isOpen: boolean;
  node: FileSystemNode | null;
  onClose: () => void;
  /** 節點的標籤列表（由父元件計算後傳入，避免 getLabels 依賴） */
  nodeLabels?: LabelWithPriority[];
}

/**
 * NodeDetailDrawer — 右側滑入抽屜（Side Drawer）
 *
 * 點擊檔案後從右側滑入，顯示節點詳情（名稱、類型、大小、標籤）。
 * 點擊 ✕ 或遮罩可關閉。
 */
export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  isOpen,
  node,
  onClose,
  nodeLabels = [],
}) => {
  // Keyboard ESC 關閉
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* 遮罩（點擊關閉） */}
      {isOpen && (
        <div
          data-testid="drawer-overlay"
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* 抽屜主體 */}
      <div
        data-testid="node-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="節點詳情"
        className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col shadow-2xl"
        style={{
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-strong, var(--border))",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 150ms ease-out",
        }}
      >
        {/* 頂部標題列 */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            節點詳情
          </span>
          <button
            aria-label="關閉詳情面板"
            onClick={onClose}
            className="p-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)" }}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 內容 */}
        {node ? (
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            {/* 節點圖示 + 名稱 */}
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden="true">
                {node.isDirectory() ? "📁" : "📄"}
              </span>
              <div className="flex flex-col min-w-0">
                <span
                  className="font-semibold text-base truncate"
                  style={{ color: "var(--text-primary)" }}
                  title={node.name}
                >
                  {node.name}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {getNodeTypeLabel(node)}
                </span>
              </div>
            </div>

            {/* 屬性表 */}
            <div
              className="rounded-lg px-3 py-2 flex flex-col gap-2"
              style={{ background: "var(--bg-hover)" }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>類型</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {getNodeTypeLabel(node)}
                </span>
              </div>
              {!node.isDirectory() && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>大小</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {formatSize((node as FsFile).sizeKB)}
                  </span>
                </div>
              )}
              {node.isDirectory() && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>子項目</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {(node as Directory).getChildren().length} 個
                  </span>
                </div>
              )}
            </div>

            {/* 標籤 */}
            {nodeLabels.length > 0 && (
              <div className="flex flex-col gap-2">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  標籤
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {nodeLabels.map((label) => {
                    const priority = label.priority;
                    return (
                      <span
                        key={label.id}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: label.color + "22",
                          color: label.color,
                          border: `1px solid ${label.color}55`,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: label.color }}
                        />
                        {label.name}
                        {priority > 0 && (
                          <span className="opacity-80">
                            {"★".repeat(priority)}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {nodeLabels.length === 0 && (
              <div
                className="text-sm text-center py-2"
                style={{ color: "var(--text-muted)" }}
              >
                無標籤
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            尚未選取任何節點
          </div>
        )}
      </div>
    </>
  );
};

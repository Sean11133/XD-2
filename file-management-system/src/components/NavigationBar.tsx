import type { FileSystemNode } from "../domain/FileSystemNode";
import { Directory } from "../domain/Directory";
import type { NavigationHistoryResult } from "../hooks/useNavigationHistory";

interface NavigationBarProps {
  history: NavigationHistoryResult;
  onNavigate: (node: Directory) => void;
}

/**
 * NavigationBar — ExplorerView 頂部導覽列
 *
 * 顯示：[←] [→] 麵包屑路徑
 * 每個麵包屑節點可點擊跳轉。
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({
  history,
  onNavigate,
}) => {
  const { canGoBack, canGoForward, breadcrumb, goBack, goForward } = history;

  const btnBase =
    "p-1.5 rounded transition-opacity disabled:opacity-30 disabled:cursor-not-allowed";
  const btnStyle = { color: "var(--text-secondary)" };

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 overflow-hidden"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
      }}
    >
      {/* 後退按鈕 */}
      <button
        aria-label="上一步"
        title="上一步"
        disabled={!canGoBack}
        onClick={goBack}
        className={btnBase}
        style={btnStyle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* 前進按鈕 */}
      <button
        aria-label="下一步"
        title="下一步"
        disabled={!canGoForward}
        onClick={goForward}
        className={btnBase}
        style={btnStyle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* 麵包屑 */}
      <nav
        aria-label="目前路徑"
        className="flex items-center gap-0.5 flex-1 overflow-hidden text-sm"
      >
        {breadcrumb.map((nodeItem: FileSystemNode, index: number) => {
          const isLast = index === breadcrumb.length - 1;
          return (
            <span key={nodeItem.name + index} className="flex items-center gap-0.5 min-w-0">
              {index > 0 && (
                <span style={{ color: "var(--text-muted)" }} className="flex-shrink-0">
                  /
                </span>
              )}
              {isLast ? (
                <span
                  className="truncate font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {nodeItem.name}
                </span>
              ) : (
                <button
                  onClick={() => {
                    if (nodeItem instanceof Directory) onNavigate(nodeItem);
                  }}
                  className="truncate hover:underline cursor-pointer bg-transparent border-0 p-0"
                  style={{ color: "var(--accent)" }}
                >
                  {nodeItem.name}
                </button>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
};

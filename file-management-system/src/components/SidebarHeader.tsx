interface SidebarHeaderProps {
  onAddFolder: () => void;
  onAddFile: () => void;
  onCollapseAll: () => void;
}

/**
 * SidebarHeader — Sidebar 頂部工具列
 *
 * 提供三個 icon 按鈕：新增資料夾、新增檔案、全部收合。
 * VS Code Sidebar 風格。
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onAddFolder,
  onAddFile,
  onCollapseAll,
}) => {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 select-none"
      style={{
        borderBottom: "var(--sidebar-border, 1px solid var(--border))",
        background: "var(--bg-surface)",
      }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        檔案總管
      </span>
      <div className="flex items-center gap-0.5">
        {/* + 資料夾 */}
        <button
          aria-label="新增資料夾"
          title="新增資料夾"
          onClick={onAddFolder}
          className="p-1 rounded hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
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
            {/* Folder + plus */}
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </button>

        {/* + 檔案 */}
        <button
          aria-label="新增檔案"
          title="新增檔案"
          onClick={onAddFile}
          className="p-1 rounded hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
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
            {/* File + plus */}
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </button>

        {/* 全部收合 */}
        <button
          aria-label="全部收合"
          title="全部收合"
          onClick={onCollapseAll}
          className="p-1 rounded hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
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
            {/* Collapse all — double up chevrons */}
            <polyline points="17 11 12 6 7 11" />
            <polyline points="17 18 12 13 7 18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

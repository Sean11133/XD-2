interface StatusBarProps {
  totalNodes: number;
  totalSize: string;
  selectedName: string | null;
  selectedSize: string | null;
  isFiltered: boolean;
  filteredCount: number;
  filterLabel: string;
  logCount: number;
}

/**
 * StatusBar — Windows 檔案總管風格底部狀態列
 * 顯示：總節點數 / 選取節點名稱+大小 / 篩選狀態 / 日誌筆數
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  totalNodes,
  totalSize,
  selectedName,
  selectedSize,
  isFiltered,
  filteredCount,
  filterLabel,
  logCount,
}) => {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-4 py-1 text-xs select-none"
      style={{
        background: "var(--bg-surface2)",
        borderTop: "1px solid var(--border)",
        color: "var(--text-muted)",
      }}
    >
      {/* Left: item count + selection */}
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--text-secondary)" }}>
          共 <strong style={{ color: "var(--text-primary)" }}>{totalNodes}</strong> 個節點
          &ensp;·&ensp;
          {totalSize}
        </span>
        {selectedName && (
          <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <svg className="w-3 h-3 flex-shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            已選取：<strong style={{ color: "var(--text-primary)" }}>{selectedName}</strong>
            {selectedSize && <span>（{selectedSize}）</span>}
          </span>
        )}
      </div>

      {/* Center: filter status */}
      {isFiltered && (
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {filterLabel} · {filteredCount} 個結果
        </span>
      )}

      {/* Right: log count */}
      <span className="flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        {logCount} 筆日誌
      </span>
    </div>
  );
};

import type { DashboardPanelProps } from "../domain/observer/DashboardPanelProps";

const PHASE_LABEL: Record<DashboardPanelProps["phase"], string> = {
  export: "匯出",
  scan: "掃描",
};

const PHASE_ICON: Record<DashboardPanelProps["phase"], string> = {
  export: "⚙️",
  scan: "🔍",
};

/**
 * Adapter Pattern — Dashboard 進度面板元件
 *
 * 接受 DashboardPanelProps（由 ProgressEventAdapter 產出），
 * 顯示完整的進度資訊（operationName、percentage、current/total、message、phase）。
 * 始終展開顯示，不隨事件自動顯示或隱藏。
 * XSS 防護：所有文字透過 React JSX 渲染，不使用 dangerouslySetInnerHTML。
 */
export function DashboardPanel({
  operationName,
  percentage,
  current,
  total,
  message,
  isDone,
  phase,
}: DashboardPanelProps) {
  const barColor = isDone ? "bg-emerald-500" : "bg-blue-500";

  return (
    <div
      data-testid="dashboard-panel"
      className="rounded-xl shadow-sm overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* 標題列 */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: "var(--bg-surface2)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-2">
          <span>{PHASE_ICON[phase]}</span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {operationName}
          </span>
          <span
            className="text-xs rounded-full px-2 py-0.5"
            style={{ background: "var(--border)", color: "var(--text-secondary)" }}
          >
            {PHASE_LABEL[phase]}
          </span>
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
          {current} / {total}
        </span>
      </div>

      {/* 進度條與資訊 */}
      <div className="px-5 py-4 space-y-2">
        {/* 進度條 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color: "var(--text-primary)" }}>
            {percentage}%
          </span>
        </div>

        {/* 狀態訊息 */}
        <div className="flex items-center gap-1.5 min-h-[1.25rem]">
          {isDone ? (
            <span className="text-xs font-medium" style={{ color: "#10b981" }}>
              ✅ 操作完成
            </span>
          ) : (
            <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
              📄 {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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
      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* 標題列 */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{PHASE_ICON[phase]}</span>
          <span className="text-sm font-semibold text-slate-700">
            {operationName}
          </span>
          <span className="text-xs bg-slate-200 text-slate-500 rounded-full px-2 py-0.5">
            {PHASE_LABEL[phase]}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {current} / {total}
        </span>
      </div>

      {/* 進度條與資訊 */}
      <div className="px-5 py-4 space-y-2">
        {/* 進度條 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums text-slate-700 w-10 text-right">
            {percentage}%
          </span>
        </div>

        {/* 狀態訊息 */}
        <div className="flex items-center gap-1.5 min-h-[1.25rem]">
          {isDone ? (
            <span className="text-xs text-emerald-600 font-medium">
              ✅ 操作完成
            </span>
          ) : (
            <span className="text-xs text-slate-500 truncate">
              📄 {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

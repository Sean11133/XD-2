import { useEffect, useState } from "react";

interface ProgressBarProps {
  percentage: number; // 0–100
  isDone: boolean; // true → 綠色，2s 後隱藏
  operationName?: string; // 顯示文字，如 "正在匯出 JSON..."
}

/**
 * 進度條元件。
 * - percentage=0 且尚未觸發 → 隱藏
 * - 進行中（0 < percentage < 100）→ 藍色進度條
 * - 完成（isDone=true）→ 綠色，2s 後自動隱藏
 *
 * XSS 防護：operationName 透過 React JSX 渲染，自動 escape，不使用 dangerouslySetInnerHTML。
 */
export function ProgressBar({
  percentage,
  isDone,
  operationName,
}: ProgressBarProps) {
  const [visible, setVisible] = useState(false);

  // 有進度時顯示；完成後延遲 2s 隱藏
  useEffect(() => {
    if (percentage > 0 || isDone) {
      setVisible(true);
    }
    if (isDone) {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [percentage, isDone]);

  if (!visible) return null;

  const barColor = isDone ? "bg-green-500" : "bg-blue-500";

  return (
    <div
      className="rounded-xl p-4 shadow-sm"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{isDone ? "✅" : "⏳"}</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {isDone ? "完成！" : (operationName ?? "處理中...")}
          </span>
        </div>
        <span
          className="text-sm font-bold"
          style={{ color: isDone ? "#10b981" : "var(--accent)" }}
        >
          {percentage}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

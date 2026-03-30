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
  const labelText = isDone
    ? "完成 ✓"
    : `${operationName ?? "處理中..."} ${percentage}%`;

  return (
    <div className="mb-3 rounded-lg border bg-white p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
        <span>{labelText}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-in-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

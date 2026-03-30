import { useEffect, useRef } from "react";
import type { LogEntry } from "../domain/observer";

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
  maxLogs?: number; // 預設 500，超出時保留最新筆
}

const LEVEL_CLASS: Record<LogEntry["level"], string> = {
  INFO: "text-gray-600",
  SUCCESS: "text-green-600 font-medium",
  WARNING: "text-yellow-600",
};

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 8); // HH:mm:ss
}

/**
 * 日誌面板元件。
 * - 自動捲動至最新一條
 * - 超出 maxLogs 時 slice 保留最新筆（防止大量日誌拖累效能）
 * - XSS 防護：所有文字透過 React JSX 渲染，不使用 dangerouslySetInnerHTML
 */
export function LogPanel({ logs, onClear, maxLogs = 500 }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const displayLogs = logs.length > maxLogs ? logs.slice(-maxLogs) : logs;

  // 新增 log 時自動捲動至底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* 標題列 */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-semibold text-gray-700">📋 操作日誌</span>
        <button
          onClick={onClear}
          className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          清除日誌
        </button>
      </div>

      {/* 日誌列表 */}
      <div className="max-h-48 overflow-y-auto px-4 py-2 font-mono text-xs">
        {displayLogs.length === 0 ? (
          <p className="py-2 text-center text-gray-400">暫無日誌</p>
        ) : (
          displayLogs.map((entry, idx) => (
            <div key={idx} className={`mb-0.5 ${LEVEL_CLASS[entry.level]}`}>
              <span className="mr-2 text-gray-400">
                {formatTime(entry.timestamp)}
              </span>
              <span className="mr-2 font-semibold">[{entry.level}]</span>
              <span>{entry.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

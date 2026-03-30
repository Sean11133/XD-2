import { useEffect, useRef } from "react";
import type { LogEntry } from "../domain/observer";
import type { DecoratedLogEntry } from "../domain/observer/DecoratedLogEntry";
import type { StyleHint } from "../domain/observer/StyleHint";

interface LogPanelProps {
  logs: Array<LogEntry | DecoratedLogEntry>;
  onClear: () => void;
  maxLogs?: number; // 預設 500，超出時保留最新筆
}

const LEVEL_CLASS: Record<LogEntry["level"], string> = {
  INFO: "text-gray-600",
  SUCCESS: "text-green-600 font-medium",
  WARNING: "text-yellow-600",
};

const LEVEL_DOT: Record<LogEntry["level"], string> = {
  INFO: "bg-blue-400",
  SUCCESS: "bg-green-500",
  WARNING: "bg-yellow-400",
};

/** 將 styleHints 陣列對應到 Tailwind CSS class 字串 */
const HINT_CLASS: Record<StyleHint, string> = {
  "color-green": "text-emerald-600",
  "color-yellow": "text-amber-500",
  "color-blue": "text-blue-600",
  "color-gray": "text-slate-400",
  bold: "font-bold",
  italic: "italic",
};

function resolveRowClass(entry: LogEntry | DecoratedLogEntry): string {
  if ("styleHints" in entry && entry.styleHints.length > 0) {
    return entry.styleHints.map((h) => HINT_CLASS[h]).join(" ");
  }
  return LEVEL_CLASS[entry.level];
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 8); // HH:mm:ss
}

/**
 * 日誌面板元件。
 * - 支援 LogEntry 與 DecoratedLogEntry（icon + styleHints）
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">📋</span>
          <span className="text-sm font-semibold text-slate-700">操作日誌</span>
          {logs.length > 0 && (
            <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 font-medium">
              {logs.length}
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          清除日誌
        </button>
      </div>

      {/* 日誌列表 */}
      <div className="max-h-64 overflow-y-auto px-4 py-2 font-mono text-xs bg-slate-50/50">
        {displayLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <span className="mb-1 text-2xl">📭</span>
            <p>暫無日誌</p>
          </div>
        ) : (
          displayLogs.map((entry, idx) => {
            const rowClass = resolveRowClass(entry);
            const icon =
              "styleHints" in entry ? (entry as DecoratedLogEntry).icon : undefined;
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 py-0.5 ${rowClass}`}
              >
                <div
                  className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${LEVEL_DOT[entry.level]}`}
                />
                <span className="flex-shrink-0 text-slate-400">
                  {formatTime(entry.timestamp)}
                </span>
                <span className="flex-shrink-0 font-semibold">[{entry.level}]</span>
                {icon && <span className="flex-shrink-0">{icon}</span>}
                <span className="break-all">{entry.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

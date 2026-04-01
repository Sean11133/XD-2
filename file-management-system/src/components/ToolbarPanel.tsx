import { useState, useRef, useEffect } from "react";
import type { FileSystemNode } from "../domain/FileSystemNode";
import type { ISortStrategy } from "../domain/strategies/ISortStrategy";
import {
  NameSortStrategy,
  SizeSortStrategy,
  TypeSortStrategy,
  DateSortStrategy,
} from "../services/strategies";

interface ToolbarPanelProps {
  selectedNode: FileSystemNode | null;
  canPaste: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSort: (strategy: ISortStrategy) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const SORT_OPTIONS: ReadonlyArray<{ label: string; strategy: ISortStrategy }> = [
  { label: "名稱 A → Z", strategy: new NameSortStrategy("asc") },
  { label: "名稱 Z → A", strategy: new NameSortStrategy("desc") },
  { label: "大小 小 → 大", strategy: new SizeSortStrategy("asc") },
  { label: "大小 大 → 小", strategy: new SizeSortStrategy("desc") },
  { label: "類型（資料夾優先）", strategy: new TypeSortStrategy("folder") },
  { label: "類型（檔案優先）", strategy: new TypeSortStrategy("file") },
  { label: "日期 新 → 舊", strategy: new DateSortStrategy("desc") },
  { label: "日期 舊 → 新", strategy: new DateSortStrategy("asc") },
];

// Shared button style helper
const btnBase =
  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed";

const btnNormal = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
} as const;

const btnDanger = {
  background: "var(--bg-surface)",
  border: "1px solid #fca5a5",
  color: "#dc2626",
} as const;

export const ToolbarPanel: React.FC<ToolbarPanelProps> = ({
  selectedNode, canPaste, canUndo, canRedo,
  onCopy, onPaste, onDelete, onSort, onUndo, onRedo,
}) => {
  const hasSelection = selectedNode !== null;
  const isDirectory = hasSelection && selectedNode.isDirectory();
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sortOpen]);

  const divider = (
    <div className="h-5 w-px flex-shrink-0" style={{ background: "var(--border)" }} />
  );

  return (
    <div
      className="rounded-xl shadow-sm p-2.5 flex-shrink-0"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Copy */}
        <button onClick={onCopy} disabled={!hasSelection} className={btnBase} style={btnNormal}
          onMouseEnter={e => { if (hasSelection) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          複製
        </button>

        {/* Paste */}
        <button onClick={onPaste} disabled={!canPaste} className={btnBase} style={btnNormal}
          onMouseEnter={e => { if (canPaste) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          貼上
        </button>

        {/* Delete */}
        <button onClick={onDelete} disabled={!hasSelection} className={btnBase} style={btnDanger}
          onMouseEnter={e => { if (hasSelection) { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; } }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          刪除
        </button>

        {divider}

        {/* Sort dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => isDirectory && setSortOpen(v => !v)}
            disabled={!isDirectory}
            className={btnBase}
            style={btnNormal}
            title={!isDirectory ? "請先選取一個資料夾" : "排序子項目"}
            onMouseEnter={e => { if (isDirectory) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            排序
            <svg className={`w-3 h-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sortOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-30 rounded-xl shadow-xl py-1 min-w-44"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              {SORT_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.label}
                  onClick={() => { onSort(opt.strategy); setSortOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {idx < 2
                    ? <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
                    : idx < 4
                    ? <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h6" /></svg>
                    : <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  }
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {divider}

        {/* Undo */}
        <button onClick={onUndo} disabled={!canUndo} className={btnBase} style={btnNormal}
          title="復原上一步"
          onMouseEnter={e => { if (canUndo) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          復原
        </button>

        {/* Redo */}
        <button onClick={onRedo} disabled={!canRedo} className={btnBase} style={btnNormal}
          title="重做"
          onMouseEnter={e => { if (canRedo) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
          重做
        </button>
      </div>
    </div>
  );
};

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

// 排序選項定義於元件外部，避免每次 render 重建實例（OCP：新增策略只需新增此處）
const SORT_OPTIONS: ReadonlyArray<{ label: string; strategy: ISortStrategy }> =
  [
    { label: "依名稱 A→Z", strategy: new NameSortStrategy("asc") },
    { label: "依名稱 Z→A", strategy: new NameSortStrategy("desc") },
    { label: "依大小 小→大", strategy: new SizeSortStrategy("asc") },
    { label: "依大小 大→小", strategy: new SizeSortStrategy("desc") },
    { label: "依類型 資料夾優先", strategy: new TypeSortStrategy("folder") },
    { label: "依類型 檔案優先", strategy: new TypeSortStrategy("file") },
    { label: "依日期 新→舊", strategy: new DateSortStrategy("desc") },
    { label: "依日期 舊→新", strategy: new DateSortStrategy("asc") },
  ];

/**
 * ToolbarPanel — 管理操作工具列（複製/貼上/刪除/排序/Undo/Redo）
 * 按鈕 disabled 狀態由 props 傳入（SRP：不在此計算業務邏輯）
 */
export const ToolbarPanel: React.FC<ToolbarPanelProps> = ({
  selectedNode,
  canPaste,
  canUndo,
  canRedo,
  onCopy,
  onPaste,
  onDelete,
  onSort,
  onUndo,
  onRedo,
}) => {
  const hasSelection = selectedNode !== null;
  const isDirectory = hasSelection && selectedNode.isDirectory();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* 複製 */}
        <button
          onClick={onCopy}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-slate-50 active:enabled:bg-slate-100"
        >
          📋 複製
        </button>

        {/* 貼上 */}
        <button
          onClick={onPaste}
          disabled={!canPaste}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-slate-50 active:enabled:bg-slate-100"
        >
          📌 貼上
        </button>

        {/* 刪除 */}
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-red-50 active:enabled:bg-red-100"
        >
          🗑 刪除
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* 排序下拉 */}
        <select
          onChange={(e) => {
            const idx = Number(e.target.value);
            if (!isNaN(idx) && idx >= 0) {
              onSort(SORT_OPTIONS[idx].strategy);
            }
            e.target.value = "";
          }}
          disabled={!isDirectory}
          defaultValue=""
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="排序"
        >
          <option value="" disabled>
            排序▼
          </option>
          {SORT_OPTIONS.map((opt, idx) => (
            <option key={opt.label} value={idx}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="h-6 w-px bg-slate-200" />

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-slate-50 active:enabled:bg-slate-100"
        >
          ↩ Undo
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-slate-50 active:enabled:bg-slate-100"
        >
          ↪ Redo
        </button>

        {/* 已選取節點提示 */}
        {hasSelection && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <span className="text-xs text-slate-500 truncate max-w-48">
              已選取：{selectedNode.name}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

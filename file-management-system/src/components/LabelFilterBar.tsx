import { useState, useRef, useEffect } from "react";
import type { Label } from "../domain/labels/Label";

interface LabelFilterBarProps {
  allLabels: readonly Label[];
  activeFilter: Label | null;
  onFilterByLabel: (label: Label | null) => void;
  onCreateLabel: (name: string) => void;
}

/**
 * LabelFilterBar — 左欄緊湊標籤篩選條
 * 橫向可捲動 chip 列，點擊套用篩選；+ 按鈕展開 inline 建立表單。
 */
export const LabelFilterBar: React.FC<LabelFilterBarProps> = ({
  allLabels,
  activeFilter,
  onFilterByLabel,
  onCreateLabel,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCreate) inputRef.current?.focus();
  }, [showCreate]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateLabel(name);
    setNewName("");
    setShowCreate(false);
  };

  return (
    <div
      className="rounded-xl shadow-sm px-3 py-2 flex-shrink-0"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Chip row */}
      <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {/* 標籤標題 */}
        <span
          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium mr-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          標籤
        </span>

        {/* Clear filter */}
        {activeFilter && (
          <button
            onClick={() => onFilterByLabel(null)}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors font-medium"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            清除
          </button>
        )}

        {/* Label chips */}
        {allLabels.map((label) => {
          const isActive = activeFilter?.id === label.id;
          return (
            <button
              key={label.id}
              onClick={() => onFilterByLabel(isActive ? null : label)}
              title={`篩選：${label.name}`}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-lg transition-all font-medium border cursor-pointer"
              style={
                isActive
                  ? { backgroundColor: label.color, borderColor: label.color, color: "#fff" }
                  : { backgroundColor: label.color + "14", borderColor: label.color + "44", color: label.color }
              }
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? "rgba(255,255,255,0.7)" : label.color }}
              />
              {label.name}
            </button>
          );
        })}

        {/* "+" create button */}
        <button
          onClick={() => setShowCreate((v) => !v)}
          title="建立新標籤"
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors ml-0.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border-light)" }}>
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setShowCreate(false); setNewName(""); }
            }}
            placeholder="標籤名稱..."
            maxLength={30}
            className="flex-1 min-w-0 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            style={{
              background: "var(--bg-surface2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg disabled:opacity-40 hover:bg-violet-700 transition-colors whitespace-nowrap font-medium"
          >
            建立
          </button>
          <button
            onClick={() => { setShowCreate(false); setNewName(""); }}
            className="text-xs transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
};

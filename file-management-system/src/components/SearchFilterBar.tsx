import { useState, useRef, useEffect } from "react";
import type { LabelWithPriority } from "../domain/labels/LabelWithPriority";

interface SearchFilterBarProps {
  /** 目前的搜尋關鍵字（受控） */
  keyword: string;
  /** 關鍵字變更回調 */
  onKeywordChange: (kw: string) => void;
  /** Enter 鍵觸發搜尋 */
  onSearch: (kw: string) => void;
  /** 所有可用標籤 */
  allLabels: readonly LabelWithPriority[];
  /** 目前作用中的標籤過濾 */
  activeFilter: LabelWithPriority | null;
  /** 標籤過濾變更（null = 清除） */
  onFilterByLabel: (label: LabelWithPriority | null) => void;
  /** 建立新標籤回調（向後相容介面） */
  onCreateLabel: (name: string) => void;
  /** 搜尋中狀態（顯示 loading spinner） */
  isSearching?: boolean;
}

/**
 * SearchFilterBar — 統一搜尋列 + 標籤篩選
 *
 * 整合原本分離的搜尋輸入框與 LabelFilterBar，提供一致的橫向操作帶。
 * 搜尋區在左，標籤篩選 chip 在右（橫向捲動）。
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  keyword,
  onKeywordChange,
  onSearch,
  allLabels,
  activeFilter,
  onFilterByLabel,
  onCreateLabel,
  isSearching = false,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCreate) createInputRef.current?.focus();
  }, [showCreate]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateLabel(trimmed);
    setNewName("");
    setShowCreate(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch(keyword);
    if (e.key === "Escape") onKeywordChange("");
  };

  return (
    <div
      className="rounded-xl shadow-sm px-4 py-2.5 flex-shrink-0 flex flex-col gap-2"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Row 1: 搜尋輸入 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜尋檔案名稱... (Enter)"
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{
              background: "var(--bg-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
            aria-label="搜尋關鍵字"
          />
          {isSearching && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
              aria-label="搜尋中"
            />
          )}
          {!isSearching && keyword && (
            <button
              onClick={() => { onKeywordChange(""); onSearch(""); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
              style={{ color: "var(--text-muted)" }}
              aria-label="清除搜尋"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={() => onSearch(keyword)}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "var(--accent-text, #0A1628)" }}
          aria-label="執行搜尋"
        >
          搜尋
        </button>
      </div>

      {/* Row 2: 標籤篩選 chip 列 */}
      {allLabels.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <span
            className="flex-shrink-0 text-xs font-medium mr-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            標籤：
          </span>

          {/* 清除標籤過濾 */}
          {activeFilter && (
            <button
              onClick={() => onFilterByLabel(null)}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs rounded-lg transition-colors font-medium"
              style={{ background: "#ede9fe", color: "#7c3aed" }}
              aria-label="清除標籤篩選"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              清除
            </button>
          )}

          {/* 標籤 chip */}
          {allLabels.map((label) => {
            const isActive = activeFilter?.id === label.id;
            return (
              <button
                key={label.id}
                onClick={() => onFilterByLabel(isActive ? null : label)}
                title={`篩選：${label.name}${label.priority > 0 ? ` (${"★".repeat(label.priority)})` : ""}`}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-lg transition-all font-medium border cursor-pointer"
                style={
                  isActive
                    ? { backgroundColor: label.color, borderColor: label.color, color: "#fff" }
                    : {
                        backgroundColor: label.color + "14",
                        borderColor: label.color + "44",
                        color: label.color,
                      }
                }
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.7)" : label.color }}
                />
                {label.name}
                {label.priority >= 3 && (
                  <span className="text-[9px] opacity-70">{"★".repeat(Math.min(label.priority, 3))}</span>
                )}
              </button>
            );
          })}

          {/* "+" 建立新標籤 */}
          <button
            onClick={() => setShowCreate((v) => !v)}
            title="建立新標籤"
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-colors ml-0.5"
            style={{ color: "var(--text-muted)" }}
            aria-label="建立新標籤"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Inline 建立標籤表單 */}
      {showCreate && (
        <div className="flex items-center gap-2 pt-1.5" style={{ borderTop: "1px solid var(--border-light)" }}>
          <input
            ref={createInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setShowCreate(false); setNewName(""); }
            }}
            placeholder="標籤名稱..."
            maxLength={30}
            className="flex-1 min-w-0 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2"
            style={{
              background: "var(--bg-surface2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            aria-label="新標籤名稱"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-text, #0A1628)" }}
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

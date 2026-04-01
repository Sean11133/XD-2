import { useState, useRef, useEffect } from "react";
import type { Label } from "../domain/labels/Label";
import type { FileSystemNode } from "../domain/FileSystemNode";

interface LabelPanelProps {
  allLabels: readonly Label[];
  selectedNode: FileSystemNode | null;
  nodeLabels: Label[];
  onTagLabel: (label: Label) => void;
  onRemoveLabel: (label: Label) => void;
  onCreateLabel: (name: string) => void;
}

/**
 * LabelPanel — 緊湊節點標籤管理（右欄）
 * 顯示已選節點的標籤 chip、inline 貼上標籤選取、inline 建立新標籤
 */
export const LabelPanel: React.FC<LabelPanelProps> = ({
  allLabels,
  selectedNode,
  nodeLabels,
  onTagLabel,
  onRemoveLabel,
  onCreateLabel,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const createInputRef = useRef<HTMLInputElement>(null);

  const nodeHasLabel = (label: Label) => nodeLabels.some((l) => l.id === label.id);
  const availableLabels = allLabels.filter((l) => !nodeHasLabel(l));

  useEffect(() => {
    if (showCreate) createInputRef.current?.focus();
  }, [showCreate]);

  // Reset add menu when node changes
  useEffect(() => {
    setShowAddMenu(false);
    setShowCreate(false);
    setNewLabelName("");
  }, [selectedNode]);

  const handleCreate = () => {
    const name = newLabelName.trim();
    if (!name) return;
    onCreateLabel(name);
    setNewLabelName("");
    setShowCreate(false);
  };

  return (
    <div
      className="rounded-xl shadow-sm overflow-hidden flex-shrink-0"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "var(--bg-surface2)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7c3aed" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>節點標籤</span>
          {nodeLabels.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold leading-none"
              style={{ background: "#ede9fe", color: "#7c3aed" }}
            >
              {nodeLabels.length}
            </span>
          )}
        </div>
        {selectedNode && (
          <span className="text-xs truncate max-w-[9rem]" style={{ color: "var(--text-muted)" }} title={selectedNode.name}>
            {selectedNode.name}
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {!selectedNode ? (
          <div className="flex items-center gap-2 text-xs py-1" style={{ color: "var(--text-muted)" }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            請先在左側選取節點
          </div>
        ) : (
          <>
            {/* ── 已附加的標籤 ── */}
            <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
              {nodeLabels.length === 0 ? (
                <span className="text-xs italic self-center" style={{ color: "var(--text-muted)" }}>尚無標籤</span>
              ) : (
                nodeLabels.map((label) => (
                  <span
                    key={label.id}
                    className="group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      backgroundColor: label.color + "18",
                      borderColor: label.color + "50",
                      color: label.color,
                    }}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                    {label.name}
                    <button
                      onClick={() => onRemoveLabel(label)}
                      className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-all text-[11px] font-bold leading-none cursor-pointer"
                      style={{ background: "transparent" }}
                      title={`移除 ${label.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* ── 貼上標籤 按鈕 → inline 展開 ── */}
            {availableLabels.length > 0 && (
              <div>
                <button
                  onClick={() => { setShowAddMenu((v) => !v); setShowCreate(false); }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
                  style={{ border: "1px solid var(--accent)", color: "var(--accent)", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  貼上標籤
                  <svg
                    className={`w-3 h-3 ml-0.5 transition-transform ${showAddMenu ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Inline label chips (no floating dropdown) */}
                {showAddMenu && (
                  <div
                    className="mt-2 flex flex-wrap gap-1.5 p-2.5 rounded-lg"
                    style={{ background: "var(--bg-surface2)", border: "1px solid var(--border-light)" }}
                  >
                    {availableLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => { onTagLabel(label); setShowAddMenu(false); }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                        style={{
                          backgroundColor: label.color + "18",
                          borderColor: label.color + "50",
                          color: label.color,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = label.color + "30"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = label.color + "18"; }}
                        title={`貼上標籤：${label.name}`}
                      >
                        <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 建立新標籤 ── */}
            <div>
              <button
                onClick={() => { setShowCreate((v) => !v); setShowAddMenu(false); }}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                建立新標籤
              </button>

              {showCreate && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    ref={createInputRef}
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") { setShowCreate(false); setNewLabelName(""); }
                    }}
                    placeholder="標籤名稱..."
                    maxLength={30}
                    className="flex-1 min-w-0 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    style={{ background: "var(--bg-surface2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newLabelName.trim()}
                    className="text-xs px-2.5 py-1.5 bg-violet-600 text-white rounded-lg disabled:opacity-40 hover:bg-violet-700 transition-colors whitespace-nowrap font-medium cursor-pointer"
                  >
                    建立並貼上
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setNewLabelName(""); }}
                    className="text-xs transition-colors cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


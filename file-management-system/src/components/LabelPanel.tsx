import { useState, useEffect } from "react";
import type { LabelWithPriority } from "../domain/labels/LabelWithPriority";
import type { FileSystemNode } from "../domain/FileSystemNode";
import { LabelEditorPanel } from "./LabelEditorPanel";

interface LabelPanelProps {
  allLabels: readonly LabelWithPriority[];
  selectedNode: FileSystemNode | null;
  nodeLabels: LabelWithPriority[];
  onTagLabel: (label: LabelWithPriority) => void;
  onRemoveLabel: (label: LabelWithPriority) => void;
  /** 建立或更新標籤：name, color, priority */
  onSaveLabel: (name: string, color: string, priority: number) => void;
}

/**
 * LabelPanel — 緊湊節點標籤管理（右欄）
 * 顯示已選節點的標籤 chip（含優先星級）、貼標籤選取、LabelEditorPanel 建立/編輯
 */
export const LabelPanel: React.FC<LabelPanelProps> = ({
  allLabels,
  selectedNode,
  nodeLabels,
  onTagLabel,
  onRemoveLabel,
  onSaveLabel,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingLabel, setEditingLabel] = useState<LabelWithPriority | null>(null);

  const nodeHasLabel = (label: LabelWithPriority) => nodeLabels.some((l) => l.id === label.id);
  const availableLabels = allLabels.filter((l) => !nodeHasLabel(l));

  useEffect(() => {
    if (showEditor) return;
  }, [showEditor]);

  // Reset add menu when node changes
  useEffect(() => {
    setShowAddMenu(false);
    setShowEditor(false);
    setEditingLabel(null);
  }, [selectedNode]);

  const handleSave = (name: string, color: string, priority: number) => {
    onSaveLabel(name, color, priority);
    setShowEditor(false);
    setEditingLabel(null);
  };

  const openCreateEditor = () => {
    setEditingLabel(null);
    setShowEditor(true);
    setShowAddMenu(false);
  };

  const openEditEditor = (label: LabelWithPriority) => {
    setEditingLabel(label);
    setShowEditor(true);
    setShowAddMenu(false);
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
                  onClick={() => { setShowAddMenu((v) => !v); setShowEditor(false); }}
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
                      <span key={label.id} className="flex items-center rounded-lg overflow-hidden"
                        style={{ border: `1px solid ${label.color}50` }}
                      >
                        <button
                          onClick={() => { onTagLabel(label); setShowAddMenu(false); }}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all cursor-pointer"
                          style={{ backgroundColor: label.color + "18", color: label.color }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = label.color + "30"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = label.color + "18"; }}
                          title={`貼上標籤：${label.name}`}
                        >
                          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                          {label.name}
                        </button>
                        <button
                          onClick={() => { openEditEditor(label); setShowAddMenu(false); }}
                          className="px-1.5 py-1 text-xs transition-all cursor-pointer opacity-50 hover:opacity-100"
                          style={{ backgroundColor: label.color + "10", color: label.color }}
                          title={`編輯標籤：${label.name}`}
                        >✏</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 建立 / 編輯標籤（LabelEditorPanel） ── */}
            <div>
              {!showEditor && (
                <button
                  onClick={openCreateEditor}
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
              )}

              {showEditor && (
                <div className="mt-2">
                  <LabelEditorPanel
                    initialLabel={editingLabel ?? undefined}
                    onSave={handleSave}
                    onCancel={() => { setShowEditor(false); setEditingLabel(null); }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


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
 * 顯示已選節點的標籤 chip、貼上標籤 dropdown、inline 建立新標籤
 * 移除 activeFilter / onFilterByLabel（改由左欄 LabelFilterBar 負責）
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
  const addMenuRef = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  const nodeHasLabel = (label: Label) => nodeLabels.some((l) => l.id === label.id);
  const availableLabels = allLabels.filter((l) => !nodeHasLabel(l));

  // Close "add" dropdown on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAddMenu]);

  useEffect(() => {
    if (showCreate) createInputRef.current?.focus();
  }, [showCreate]);

  const handleCreate = () => {
    const name = newLabelName.trim();
    if (!name) return;
    onCreateLabel(name);
    setNewLabelName("");
    setShowCreate(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-sm font-semibold text-slate-700">節點標籤</span>
          {nodeLabels.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-violet-200 text-violet-700 rounded-full font-bold leading-none">
              {nodeLabels.length}
            </span>
          )}
        </div>
        {selectedNode && (
          <span className="text-xs text-slate-500 truncate max-w-[9rem]" title={selectedNode.name}>
            {selectedNode.name}
          </span>
        )}
      </div>

      <div className="px-4 py-3">
        {!selectedNode ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            請先在左側選取節點
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Current labels on this node */}
            <div className="flex flex-wrap gap-1.5 min-h-7">
              {nodeLabels.length === 0 ? (
                <span className="text-xs text-slate-400 italic self-center">尚無標籤</span>
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
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                    <button
                      onClick={() => onRemoveLabel(label)}
                      className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 transition-all text-[11px] font-bold leading-none cursor-pointer"
                      title={`移除 ${label.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Add label dropdown */}
              {availableLabels.length > 0 && (
                <div className="relative" ref={addMenuRef}>
                  <button
                    onClick={() => { setShowAddMenu((v) => !v); setShowCreate(false); }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 hover:border-violet-400 transition-colors font-medium cursor-pointer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    貼上標籤
                  </button>
                  {showAddMenu && (
                    <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-xl py-1 min-w-36 max-h-44 overflow-y-auto">
                      {availableLabels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => { onTagLabel(label); setShowAddMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Create new label button */}
              <button
                onClick={() => { setShowCreate((v) => !v); setShowAddMenu(false); }}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                建立新標籤
              </button>
            </div>

            {/* Inline create form */}
            {showCreate && (
              <div className="flex items-center gap-2">
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
                  className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
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
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import { useState } from "react";
import type { Label } from "../domain/labels/Label";
import type { FileSystemNode } from "../domain/FileSystemNode";

interface LabelPanelProps {
  allLabels: readonly Label[];
  activeFilter: Label | null;
  selectedNode: FileSystemNode | null;
  nodeLabels: Label[];
  onTagLabel: (label: Label) => void;
  onRemoveLabel: (label: Label) => void;
  onFilterByLabel: (label: Label | null) => void;
  onCreateLabel: (name: string) => void;
}

export const LabelPanel: React.FC<LabelPanelProps> = ({
  allLabels,
  activeFilter,
  selectedNode,
  nodeLabels,
  onTagLabel,
  onRemoveLabel,
  onFilterByLabel,
  onCreateLabel,
}) => {
  const [newLabelName, setNewLabelName] = useState("");

  const handleCreate = () => {
    const name = newLabelName.trim();
    if (!name) return;
    onCreateLabel(name);
    setNewLabelName("");
  };

  const nodeHasLabel = (label: Label) => nodeLabels.some((l) => l.id === label.id);
  const availableLabels = allLabels.filter((l) => !nodeHasLabel(l));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <span>🏷️</span>
          <span className="text-sm font-semibold text-slate-700">標籤管理</span>
          {allLabels.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
              {allLabels.length}
            </span>
          )}
        </div>
        {activeFilter && (
          <button
            onClick={() => onFilterByLabel(null)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-violet-600 text-white rounded-full shadow-sm hover:bg-violet-700 transition-colors"
          >
            <span
              className="inline-block w-2 h-2 rounded-full bg-white/70 flex-shrink-0"
              style={{ backgroundColor: activeFilter.color }}
            />
            篩選中：{activeFilter.name}
            <span className="opacity-80 font-bold">✕</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* ── All labels ── */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">
            所有標籤
            <span className="ml-1 font-normal text-slate-400">（點擊標籤以篩選檔案樹）</span>
          </p>
          {allLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allLabels.map((label) => {
                const isActive = activeFilter?.id === label.id;
                const isOnNode = nodeHasLabel(label);
                return (
                  <button
                    key={label.id}
                    onClick={() => onFilterByLabel(isActive ? null : label)}
                    title={label.description || label.name}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all border font-medium ${
                      isActive
                        ? "border-violet-400 bg-violet-600 text-white shadow-sm"
                        : isOnNode
                        ? "border-slate-300 bg-slate-100 text-slate-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isActive ? "rgba(255,255,255,0.8)" : label.color }}
                    />
                    {label.name}
                    {isOnNode && !isActive && (
                      <span className="text-slate-500 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              尚無任何標籤，請在右下方建立第一個標籤。
            </p>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-slate-100" />

        {/* ── Bottom row: node labels + create ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Left: selected node labels */}
          <div className="flex-1 min-w-0">
            {selectedNode ? (
              <>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  已選節點：
                  <span
                    className={`ml-1 font-semibold ${
                      selectedNode.isDirectory() ? "text-amber-700" : "text-slate-700"
                    }`}
                  >
                    {selectedNode.isDirectory() ? "📁" : "📄"} {selectedNode.name}
                  </span>
                </p>

                {/* Current labels on this node */}
                <div className="flex flex-wrap gap-1.5 min-h-6 mb-2">
                  {nodeLabels.length > 0 ? (
                    nodeLabels.map((label) => (
                      <span
                        key={label.id}
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border bg-white shadow-sm"
                        style={{
                          borderColor: label.color + "60",
                          backgroundColor: label.color + "10",
                        }}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                        <button
                          onClick={() => onRemoveLabel(label)}
                          className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors leading-none font-bold"
                          title={`移除標籤：${label.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">此節點尚無標籤</span>
                  )}
                </div>

                {/* Labels available to add */}
                {availableLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availableLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => onTagLabel(label)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                        title={`貼上標籤：${label.name}`}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-70"
                          style={{ backgroundColor: label.color }}
                        />
                        + {label.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <span className="text-lg">👆</span>
                <span>請先在左側的檔案樹中選取一個節點，即可貼上或移除標籤</span>
              </div>
            )}
          </div>

          {/* Right: create new label */}
          <div className="sm:w-56 flex-shrink-0">
            <p className="text-xs font-medium text-slate-500 mb-2">建立新標籤</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                placeholder="標籤名稱..."
                maxLength={30}
                className="flex-1 min-w-0 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
              <button
                onClick={handleCreate}
                disabled={!newLabelName.trim()}
                className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex-shrink-0 font-medium shadow-sm"
              >
                {selectedNode ? "建立並貼上" : "建立"}
              </button>
            </div>
            {selectedNode && (
              <p className="text-xs text-slate-400 mt-1.5">
                ⚡ 建立後自動貼到已選節點
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

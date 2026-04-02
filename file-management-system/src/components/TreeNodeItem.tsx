import { useRef, useState } from "react";
import { FileSystemNode } from "../domain/FileSystemNode";
import { Directory } from "../domain/Directory";
import type { Label } from "../domain/labels/Label";

/** 格式化大小：< 1024 KB 顯示 KB，否則顯示 MB（兩位小數） */
function formatSize(sizeKB: number): string {
  if (sizeKB >= 1024) {
    return `${(sizeKB / 1024).toFixed(2)} MB`;
  }
  return `${sizeKB} KB`;
}

interface TreeNodeItemProps {
  node: FileSystemNode;
  level: number;
  /** 搜尋命中的完整路徑集合；undefined 表示無搜尋（全部顯示） */
  matchedPaths?: Set<string>;
  /** 當前節點在樹狀結構中的完整路徑（如 "root/docs/report.docx"） */
  currentPath?: string;
  /** 節點選取 callback，帶節點本身與父目錄（根節點父目錄為 null） */
  onSelect?: (node: FileSystemNode, parent: Directory | null) => void;
  /** 目前被選取的節點（用於高亮比對） */
  selectedNode?: FileSystemNode | null;
  /** 此節點的父目錄（由 FileTreeView 向下傳遞） */
  parentDir?: Directory | null;
  /** 取得節點身上的標籤列表（由 App 透過 tagMediator 提供）*/
  getNodeLabels?: (node: FileSystemNode) => Label[];
  /** 是否處於 inline 重命名/建立輸入模式 */
  isEditing?: boolean;
  /** inline 輸入確認回調（按 Enter 時觸發） */
  onNameConfirm?: (name: string) => void;
  /** inline 輸入取消回調（按 Esc 時觸發） */
  onEditCancel?: () => void;
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  matchedPaths,
  currentPath,
  onSelect,
  selectedNode,
  parentDir = null,
  getNodeLabels,
  isEditing = false,
  onNameConfirm,
  onEditCancel,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const path = currentPath ?? node.name;
  const indent = { paddingLeft: `${level * 1.25}rem` };
  const labels = getNodeLabels ? getNodeLabels(node) : [];

  // 搜尋篩選：matchedPaths 存在時，不在集合內的節點不顯示
  if (matchedPaths !== undefined && !matchedPaths.has(path)) {
    return null;
  }

  const isSelected = selectedNode === node;
  const selectedStyle: React.CSSProperties = isSelected
    ? {
        background: "var(--bg-selected)",
        borderLeft: "2px solid var(--accent)",
      }
    : {};

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(node, parentDir);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmed = inputValue.trim();
      if (trimmed) onNameConfirm?.(trimmed);
    } else if (e.key === "Escape") {
      onEditCancel?.();
    }
  };

  /** Inline 輸入框（新增/重命名模式） */
  const inlineInput = (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onEditCancel?.()}
      autoFocus
      className="flex-1 text-sm px-1 rounded outline-none"
      style={{
        background: "var(--bg-hover)",
        color: "var(--text-primary)",
        border: "1px solid var(--accent)",
        minWidth: 0,
      }}
      aria-label="輸入節點名稱"
    />
  );

  if (node.isDirectory()) {
    const dir = node as Directory;
    const children = dir.getChildren();
    const sizeLabel = formatSize(dir.getSizeKB());

    return (
      <div>
        <div
          className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group`}
          style={{ ...indent, ...selectedStyle }}
          onClick={(e) => {
            if (!isEditing) {
              setIsExpanded((prev) => !prev);
              handleNodeClick(e);
            }
          }}
        >
          <span
            className={`inline-block w-3 flex-shrink-0 text-xs select-none transition-transform duration-150${isExpanded ? " rotate-90" : ""}`}
            style={{ color: "var(--text-muted)" }}
          >
            ▶
          </span>
          {isEditing ? (
            inlineInput
          ) : (
            <span className="flex-1 text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {node.name}
            </span>
          )}
          {labels.length > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
              {labels.slice(0, 2).map((label) => (
                <span
                  key={label.id}
                  className="inline-block text-[10px] px-1.5 py-0.5 rounded font-medium leading-none"
                  style={{
                    backgroundColor: label.color + "22",
                    color: label.color,
                    border: `1px solid ${label.color}44`,
                  }}
                  title={label.name}
                >
                  {label.name.length > 6 ? label.name.slice(0, 5) + "…" : label.name}
                </span>
              ))}
              {labels.length > 2 && (
                <span
                  className="inline-block text-[10px] px-1 py-0.5 rounded font-medium leading-none"
                  style={{ background: "var(--border)", color: "var(--text-muted)" }}
                >
                  +{labels.length - 2}
                </span>
              )}
            </div>
          )}
          <span
            className="ml-1 rounded px-1.5 py-0.5 text-xs select-none opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: "var(--bg-surface2)", color: "var(--text-muted)" }}
          >
            {sizeLabel}
          </span>
        </div>
        {isExpanded && (
          <div>
            {children.map((child, idx) => (
              <TreeNodeItem
                key={idx}
                node={child}
                level={level + 1}
                matchedPaths={matchedPaths}
                currentPath={`${path}/${child.name}`}
                onSelect={onSelect}
                selectedNode={selectedNode}
                parentDir={dir}
                getNodeLabels={getNodeLabels}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 py-1 px-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer`}
      style={{ ...indent, ...selectedStyle }}
      onClick={!isEditing ? handleNodeClick : undefined}
    >
      <span className="w-3 flex-shrink-0" />
      {isEditing ? (
        inlineInput
      ) : (
        <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
          {node.name}
        </span>
      )}
      {!isEditing && labels.length > 0 && (
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
          {labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="inline-block text-[10px] px-1.5 py-0.5 rounded font-medium leading-none"
              style={{
                backgroundColor: label.color + "22",
                color: label.color,
                border: `1px solid ${label.color}44`,
              }}
              title={label.name}
            >
              {label.name.length > 6 ? label.name.slice(0, 5) + "…" : label.name}
            </span>
          ))}
          {labels.length > 2 && (
            <span
              className="inline-block text-[10px] px-1 py-0.5 rounded font-medium leading-none"
              style={{ background: "var(--border)", color: "var(--text-muted)" }}
            >
              +{labels.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

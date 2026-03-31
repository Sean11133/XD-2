import { useState } from "react";
import { FileSystemNode } from "../domain/FileSystemNode";
import { Directory } from "../domain/Directory";

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
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  matchedPaths,
  currentPath,
  onSelect,
  selectedNode,
  parentDir = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const path = currentPath ?? node.name;
  const indent = { paddingLeft: `${level * 1.25}rem` };

  // 搜尋篩選：matchedPaths 存在時，不在集合內的節點不顯示
  if (matchedPaths !== undefined && !matchedPaths.has(path)) {
    return null;
  }

  const isSelected = selectedNode === node;
  const selectedClass = isSelected
    ? "bg-blue-100 border-l-2 border-blue-500"
    : "";

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(node, parentDir);
  };

  if (node.isDirectory()) {
    const dir = node as Directory;
    const children = dir.getChildren();
    const sizeLabel = formatSize(dir.getSizeKB());

    return (
      <div>
        <div
          className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors group ${selectedClass}`}
          style={indent}
          onClick={(e) => {
            setIsExpanded((prev) => !prev);
            handleNodeClick(e);
          }}
        >
          <span
            className={`inline-block w-3 flex-shrink-0 text-xs select-none text-slate-400 transition-transform duration-150${
              isExpanded ? " rotate-90" : ""
            }`}
          >
            ▶
          </span>
          <span className="flex-1 text-sm text-slate-700">
            {node.getDisplayInfo()}
          </span>
          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400 select-none opacity-0 transition-opacity group-hover:opacity-100">
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
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 py-1 px-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer ${selectedClass}`}
      style={indent}
      onClick={handleNodeClick}
    >
      <span className="w-3 flex-shrink-0" />
      <span className="text-sm text-slate-600">{node.getDisplayInfo()}</span>
    </div>
  );
};

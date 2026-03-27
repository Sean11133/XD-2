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
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  matchedPaths,
  currentPath,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const path = currentPath ?? node.name;
  const indent = { paddingLeft: `${level * 1.5}rem` };

  // 搜尋篩選：matchedPaths 存在時，不在集合內的節點不顯示
  if (matchedPaths !== undefined && !matchedPaths.has(path)) {
    return null;
  }

  if (node.isDirectory()) {
    const dir = node as Directory;
    const children = dir.getChildren();
    const sizeLabel = formatSize(dir.getSizeKB());

    return (
      <div>
        <div
          className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-gray-100 rounded px-1"
          style={indent}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <span className="text-gray-500 w-4 text-xs select-none">
            {isExpanded ? "▼" : "▶"}
          </span>
          <span className="text-sm">{node.getDisplayInfo()}</span>
          <span className="ml-2 text-xs text-gray-400 select-none">
            ({sizeLabel})
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
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 py-0.5 px-1" style={indent}>
      <span className="w-4" />
      <span className="text-sm text-gray-700">{node.getDisplayInfo()}</span>
    </div>
  );
};

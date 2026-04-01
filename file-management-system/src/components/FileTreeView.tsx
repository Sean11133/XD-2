import { useEffect, useState } from "react";
import { Directory } from "../domain/Directory";
import { FileSystemNode } from "../domain/FileSystemNode";
import { TreeNodeItem } from "./TreeNodeItem";
import type { Label } from "../domain/labels/Label";

interface FileTreeViewProps {
  root: Directory;
  matchedPaths?: Set<string>;
  /** 節點選取 callback，帶節點本身與父目錄（根節點父目錄為 null） */
  onSelect?: (node: FileSystemNode, parent: Directory | null) => void;
  /** 目前被選取的節點（用於高亮）*/
  selectedNode?: FileSystemNode | null;
  /** 取得節點身上的標籤列表（由 App 透過 tagMediator 提供）*/
  getNodeLabels?: (node: FileSystemNode) => Label[];
  /**
   * 遞增計數，每次變化觸發全部收合。
   * SidebarHeader「全部收合」按鈕呼叫 setCollapseAllTrigger(n => n+1)。
   */
  collapseAllTrigger?: number;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  root,
  matchedPaths,
  onSelect,
  selectedNode,
  getNodeLabels,
  collapseAllTrigger,
}) => {
  // 全部收合 key：每次 collapseAllTrigger 改變，重新掛載樹（重置所有展開狀態）
  const [collapseKey, setCollapseKey] = useState(0);

  useEffect(() => {
    if (collapseAllTrigger !== undefined && collapseAllTrigger > 0) {
      setCollapseKey((k) => k + 1);
    }
  }, [collapseAllTrigger]);

  return (
    <div className="font-mono" key={collapseKey}>
      <TreeNodeItem
        node={root}
        level={0}
        matchedPaths={matchedPaths}
        currentPath={root.name}
        onSelect={onSelect}
        selectedNode={selectedNode}
        parentDir={null}
        getNodeLabels={getNodeLabels}
      />
    </div>
  );
};

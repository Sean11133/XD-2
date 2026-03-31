import { Directory } from "../domain/Directory";
import { FileSystemNode } from "../domain/FileSystemNode";
import { TreeNodeItem } from "./TreeNodeItem";

interface FileTreeViewProps {
  root: Directory;
  matchedPaths?: Set<string>;
  /** 節點選取 callback，帶節點本身與父目錄（根節點父目錄為 null） */
  onSelect?: (node: FileSystemNode, parent: Directory | null) => void;
  /** 目前被選取的節點（用於高亮）*/
  selectedNode?: FileSystemNode | null;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  root,
  matchedPaths,
  onSelect,
  selectedNode,
}) => {
  return (
    <div className="font-mono">
      <TreeNodeItem
        node={root}
        level={0}
        matchedPaths={matchedPaths}
        currentPath={root.name}
        onSelect={onSelect}
        selectedNode={selectedNode}
        parentDir={null}
      />
    </div>
  );
};

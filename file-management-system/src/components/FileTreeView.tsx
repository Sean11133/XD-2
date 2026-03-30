import { Directory } from "../domain/Directory";
import { TreeNodeItem } from "./TreeNodeItem";

interface FileTreeViewProps {
  root: Directory;
  matchedPaths?: Set<string>;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({ root, matchedPaths }) => {
  return (
    <div className="font-mono">
      <TreeNodeItem
        node={root}
        level={0}
        matchedPaths={matchedPaths}
        currentPath={root.name}
      />
    </div>
  );
};

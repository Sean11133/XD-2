import { Directory } from "../domain/Directory";
import { TreeNodeItem } from "./TreeNodeItem";

interface FileTreeViewProps {
  root: Directory;
  matchedPaths?: Set<string>;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({ root, matchedPaths }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 font-mono">
      <TreeNodeItem
        node={root}
        level={0}
        matchedPaths={matchedPaths}
        currentPath={root.name}
      />
    </div>
  );
};

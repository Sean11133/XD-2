import { Directory } from "../domain/Directory";
import type { FileSystemNode } from "../domain/FileSystemNode";
import type { File as FsFile } from "../domain/File";

function formatSize(sizeKB: number): string {
  if (sizeKB >= 1024) return `${(sizeKB / 1024).toFixed(1)} MB`;
  return `${sizeKB} KB`;
}

function getFileIcon(node: FileSystemNode): string {
  const name = node.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
    return "🖼️";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "📄";
  if (name.endsWith(".txt")) return "📝";
  return "📋";
}

interface ExplorerItemListProps {
  nodes: FileSystemNode[];
  onFolderEnter: (node: Directory) => void;
  onFileClick: (node: FileSystemNode) => void;
}

/**
 * ExplorerItemList — 清單模式的資料夾/檔案列表
 */
export const ExplorerItemList: React.FC<ExplorerItemListProps> = ({
  nodes,
  onFolderEnter,
  onFileClick,
}) => {
  if (nodes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-40 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        <span className="text-3xl mb-2">📂</span>
        <span>此資料夾為空</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-2 py-2 gap-0.5">
      {nodes.map((node) => {
        const isDir = node.isDirectory();
        return (
          <button
            key={node.name}
            onClick={() =>
              isDir ? onFolderEnter(node as Directory) : onFileClick(node)
            }
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer border-0 bg-transparent w-full"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <span className="text-xl leading-none flex-shrink-0">
              {isDir ? "📁" : getFileIcon(node)}
            </span>
            <span
              className="flex-1 text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {node.name}
            </span>
            <span
              className="text-xs flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {isDir
                ? `${(node as Directory).getChildren().length} 個項目`
                : formatSize((node as FsFile).sizeKB)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

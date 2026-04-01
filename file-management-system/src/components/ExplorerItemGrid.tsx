import { Directory } from "../domain/Directory";
import type { FileSystemNode } from "../domain/FileSystemNode";
import type { File as FsFile } from "../domain/File";

function formatSize(sizeKB: number): string {
  if (sizeKB >= 1024) return `${(sizeKB / 1024).toFixed(1)} MB`;
  return `${sizeKB} KB`;
}

function getFileIcon(node: FileSystemNode): string {
  const name = node.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif"))
    return "🖼️";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "📄";
  if (name.endsWith(".txt")) return "📝";
  return "📋";
}

interface ExplorerItemGridProps {
  nodes: FileSystemNode[];
  onFolderEnter: (node: Directory) => void;
  onFileClick: (node: FileSystemNode) => void;
}

/**
 * ExplorerItemGrid — 格網模式的資料夾/檔案卡片（Windows 檔案總管風格）
 */
export const ExplorerItemGrid: React.FC<ExplorerItemGridProps> = ({
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
    <div className="grid grid-cols-4 gap-3 p-4">
      {nodes.map((node) => {
        const isDir = node.isDirectory();
        return (
          <button
            key={node.name}
            onClick={() =>
              isDir
                ? onFolderEnter(node as Directory)
                : onFileClick(node)
            }
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors cursor-pointer group text-center border-0 bg-transparent"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-surface)";
            }}
          >
            <span className="text-3xl leading-none">
              {isDir ? "📁" : getFileIcon(node)}
            </span>
            <span
              className="text-xs font-medium truncate w-full"
              style={{ color: "var(--text-primary)" }}
              title={node.name}
            >
              {node.name}
            </span>
            <span
              className="text-[10px]"
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

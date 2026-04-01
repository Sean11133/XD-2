import type { FileSystemNode } from "../domain/FileSystemNode";
import type { Directory } from "../domain/Directory";

interface BreadcrumbBarProps {
  root: Directory;
  selectedNode: FileSystemNode | null;
  onSelect: (node: FileSystemNode, parent: Directory | null) => void;
}

/**
 * BreadcrumbBar — Windows/macOS 路徑導覽列
 * 從 root 到選中節點顯示可點擊路徑段。
 */
export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  root,
  selectedNode,
  onSelect,
}) => {
  // Build path from root to selectedNode
  const buildPath = (
    dir: Directory,
    target: FileSystemNode,
    parentDir: Directory | null,
  ): Array<{ node: FileSystemNode; parent: Directory | null }> | null => {
    for (const child of dir.getChildren()) {
      if (child === target) {
        return [{ node: dir, parent: parentDir }, { node: child, parent: dir }];
      }
      if (child.isDirectory()) {
        const sub = buildPath(child as Directory, target, dir);
        if (sub) return [{ node: dir, parent: parentDir }, ...sub];
      }
    }
    return null;
  };

  const segments: Array<{ node: FileSystemNode; parent: Directory | null }> = selectedNode
    ? (buildPath(root, selectedNode, null) ?? [{ node: root, parent: null }])
    : [{ node: root, parent: null }];

  return (
    <div
      className="flex-shrink-0 flex items-center gap-0.5 px-4 py-1.5 text-xs"
      style={{
        background: "var(--bg-surface2)",
        borderBottom: "1px solid var(--border-light)",
        color: "var(--text-secondary)",
      }}
    >
      {/* Drive/root icon */}
      <svg className="w-3.5 h-3.5 flex-shrink-0 mr-0.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>

      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={idx} className="flex items-center gap-0.5">
            {idx > 0 && (
              <svg className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <button
              onClick={() => !isLast && onSelect(seg.node, seg.parent)}
              className="px-1 py-0.5 rounded transition-colors"
              style={
                isLast
                  ? { color: "var(--text-primary)", fontWeight: 600, cursor: "default" }
                  : { color: "var(--text-secondary)", cursor: "pointer" }
              }
              onMouseEnter={(e) => {
                if (!isLast) (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                if (!isLast) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
            >
              {seg.node.name}
            </button>
          </span>
        );
      })}
    </div>
  );
};

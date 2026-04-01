import { useSidebarResize } from "../hooks/useSidebarResize";

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
}

/**
 * ResizableSidebar — 可拖曳調整寬度的左側 Sidebar 容器
 *
 * 右側邊緣有一個 4px 的 resize handle，
 * 拖曳後寬度寫入 localStorage（cfm-sidebar-width）。
 * 寬度限制：200–400px。
 */
export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  defaultWidth = 288,
}) => {
  const { width, handleMouseDown } = useSidebarResize(defaultWidth);

  return (
    <div
      className="relative flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        width: `${width}px`,
        minWidth: "200px",
        maxWidth: "400px",
        background: "var(--bg-surface)",
        borderRight: "var(--sidebar-border, 1px solid var(--border))",
      }}
    >
      {/* Sidebar 主體內容 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>

      {/* Resize Handle — 右側 4px 可拖曳區域 */}
      <div
        data-testid="resize-handle"
        aria-label="調整 Sidebar 寬度"
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize z-10 transition-colors hover:bg-blue-400/30"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

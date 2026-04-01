import { useState, useCallback } from "react";

const STORAGE_KEY = "cfm-sidebar-width";
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

function clamp(value: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value));
}

export interface SidebarResizeResult {
  width: number;
  handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * useSidebarResize — 左側 Sidebar 拖曳寬度 Hook
 *
 * 使用 mousedown/mousemove/mouseup 原生事件實作寬度調整，
 * 最終寬度寫入 localStorage（key: cfm-sidebar-width）。
 * 寬度限制：200px – 400px。
 */
export function useSidebarResize(defaultWidth = 288): SidebarResizeResult {
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return clamp(parsed);
    }
    return defaultWidth;
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = width;

      const onMove = (me: MouseEvent) => {
        const next = clamp(startW + me.clientX - startX);
        setWidth(next);
      };

      const onUp = (me: MouseEvent) => {
        const final = clamp(startW + me.clientX - startX);
        setWidth(final);
        localStorage.setItem(STORAGE_KEY, String(final));
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [width],
  );

  return { width, handleMouseDown };
}

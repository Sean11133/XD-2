import { useState, useCallback, useMemo } from "react";
import type { FileSystemNode } from "../domain/FileSystemNode";
import { Directory } from "../domain/Directory";

export interface NavigationHistoryResult {
  currentNode: Directory | null;
  canGoBack: boolean;
  canGoForward: boolean;
  breadcrumb: FileSystemNode[]; // root → currentNode 路徑
  push: (node: Directory) => void;
  goBack: () => void;
  goForward: () => void;
}

interface NavState {
  history: Directory[];
  pointer: number;
}

/**
 * useNavigationHistory — 右側 ExplorerView 的導覽歷史管理
 *
 * 維護資料夾瀏覽的前進/後退堆疊（類似瀏覽器歷史），
 * 並計算從 rootNode 到當前節點的麵包屑路徑。
 *
 * history + pointer 合併為單一 state 物件，避免兩次 setState 造成的 stale closure 問題。
 */
export function useNavigationHistory(
  rootNode: Directory,
): NavigationHistoryResult {
  const [nav, setNav] = useState<NavState>({ history: [rootNode], pointer: 0 });

  const { history, pointer } = nav;
  const currentNode = history[pointer] ?? null;
  const canGoBack = pointer > 0;
  const canGoForward = pointer < history.length - 1;

  /**
   * 計算從 rootNode 到 target 的路徑（DFS）
   * 回傳包含路徑節點的陣列（含 root 和 target 自身）
   */
  const buildBreadcrumb = useCallback(
    (target: Directory): FileSystemNode[] => {
      function dfs(
        current: FileSystemNode,
        path: FileSystemNode[],
      ): FileSystemNode[] | null {
        if (current === target) return [...path, current];
        if (current instanceof Directory) {
          for (const child of current.getChildren()) {
            const result = dfs(child, [...path, current]);
            if (result) return result;
          }
        }
        return null;
      }
      return dfs(rootNode, []) ?? [rootNode];
    },
    [rootNode],
  );

  /** 每次導覽後截斷「前進」分支並追加新節點（原子更新，無 stale closure）。 */
  const push = useCallback((node: Directory) => {
    setNav((prev) => ({
      history: [...prev.history.slice(0, prev.pointer + 1), node],
      pointer: prev.pointer + 1,
    }));
  }, []);

  const goBack = useCallback(() => {
    setNav((prev) =>
      prev.pointer > 0 ? { ...prev, pointer: prev.pointer - 1 } : prev,
    );
  }, []);

  const goForward = useCallback(() => {
    setNav((prev) =>
      prev.pointer < prev.history.length - 1
        ? { ...prev, pointer: prev.pointer + 1 }
        : prev,
    );
  }, []);

  const breadcrumb = useMemo(
    () => (currentNode ? buildBreadcrumb(currentNode) : [rootNode]),
    [currentNode, buildBreadcrumb, rootNode],
  );

  return {
    currentNode,
    canGoBack,
    canGoForward,
    breadcrumb,
    push,
    goBack,
    goForward,
  };
}

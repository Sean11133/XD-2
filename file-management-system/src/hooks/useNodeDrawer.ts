import { useState, useCallback } from "react";
import type { FileSystemNode } from "../domain/FileSystemNode";

export interface NodeDrawerResult {
  isOpen: boolean;
  node: FileSystemNode | null;
  open: (node: FileSystemNode) => void;
  close: () => void;
}

/**
 * useNodeDrawer — 控制右側滑入側邊抽屜（NodeDetailDrawer）的開關狀態
 */
export function useNodeDrawer(): NodeDrawerResult {
  const [isOpen, setIsOpen] = useState(false);
  const [node, setNode] = useState<FileSystemNode | null>(null);

  const open = useCallback((n: FileSystemNode) => {
    setNode(n);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, node, open, close };
}

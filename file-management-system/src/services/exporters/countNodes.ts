import type { Directory } from "../../domain/Directory";
import type { FileSystemNode } from "../../domain/FileSystemNode";

/**
 * 遞迴計算目錄樹的節點總數（含目錄本身與所有後代）。
 * 供 Exporter 便利函式在匯出開始前計算 total，確保進度百分比準確。
 */
export function countNodes(dir: Directory): number {
  let count = 1; // 目錄本身
  for (const child of dir.getChildren()) {
    count += (child as FileSystemNode).isDirectory()
      ? countNodes(child as Directory)
      : 1;
  }
  return count;
}

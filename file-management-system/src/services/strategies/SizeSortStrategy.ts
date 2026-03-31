import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { ISortStrategy } from "../../domain/strategies/ISortStrategy";

export class SizeSortStrategy implements ISortStrategy {
  readonly label: string;

  constructor(private readonly direction: "asc" | "desc") {
    this.label = direction === "asc" ? "依大小 小→大" : "依大小 大→小";
  }

  sort(nodes: FileSystemNode[]): FileSystemNode[] {
    return nodes.slice().sort((a, b) => {
      const cmp = a.getSizeKB() - b.getSizeKB();
      return this.direction === "asc" ? cmp : -cmp;
    });
  }
}

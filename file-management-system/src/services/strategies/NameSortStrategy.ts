import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { ISortStrategy } from "../../domain/strategies/ISortStrategy";

export class NameSortStrategy implements ISortStrategy {
  readonly label: string;

  constructor(private readonly direction: "asc" | "desc") {
    this.label = direction === "asc" ? "依名稱 A→Z" : "依名稱 Z→A";
  }

  sort(nodes: FileSystemNode[]): FileSystemNode[] {
    return nodes.slice().sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      return this.direction === "asc" ? cmp : -cmp;
    });
  }
}

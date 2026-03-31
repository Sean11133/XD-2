import { File } from "../../domain/File";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { ISortStrategy } from "../../domain/strategies/ISortStrategy";

export class DateSortStrategy implements ISortStrategy {
  readonly label: string;

  constructor(private readonly direction: "asc" | "desc") {
    this.label = direction === "asc" ? "依日期 舊→新" : "依日期 新→舊";
  }

  sort(nodes: FileSystemNode[]): FileSystemNode[] {
    return nodes.slice().sort((a, b) => {
      const aTime =
        a instanceof File ? a.createdAt.getTime() : new Date(0).getTime();
      const bTime =
        b instanceof File ? b.createdAt.getTime() : new Date(0).getTime();
      const cmp = aTime - bTime;
      return this.direction === "asc" ? cmp : -cmp;
    });
  }
}

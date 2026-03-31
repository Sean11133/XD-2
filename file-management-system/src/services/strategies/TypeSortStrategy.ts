import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { ISortStrategy } from "../../domain/strategies/ISortStrategy";

export class TypeSortStrategy implements ISortStrategy {
  readonly label: string;

  constructor(private readonly priority: "folder" | "file") {
    this.label =
      priority === "folder" ? "依類型 資料夾優先" : "依類型 檔案優先";
  }

  sort(nodes: FileSystemNode[]): FileSystemNode[] {
    return nodes.slice().sort((a, b) => {
      const aIsDir = a.isDirectory() ? 1 : 0;
      const bIsDir = b.isDirectory() ? 1 : 0;
      // folder priority: directories first (desc by isDirectory flag)
      // file priority: files first (asc by isDirectory flag)
      return this.priority === "folder" ? bIsDir - aIsDir : aIsDir - bIsDir;
    });
  }
}

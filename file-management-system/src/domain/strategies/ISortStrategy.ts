import type { FileSystemNode } from "../FileSystemNode";

export interface ISortStrategy {
  readonly label: string;
  sort(nodes: FileSystemNode[]): FileSystemNode[];
}

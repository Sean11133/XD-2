import { FileSystemNode } from "./FileSystemNode";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export abstract class File extends FileSystemNode {
  constructor(
    public readonly fileName: string,
    public readonly sizeKB: number,
    public readonly createdAt: Date,
  ) {
    super(fileName);
  }

  /** Leaf 節點直接回傳自身大小 */
  getSizeKB(): number {
    return this.sizeKB;
  }

  protected formatDate(date: Date): string {
    return formatDate(date);
  }
}

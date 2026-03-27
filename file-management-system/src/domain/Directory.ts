import { FileSystemNode } from "./FileSystemNode";
import type { IFileSystemVisitor } from "./IFileSystemVisitor";

export class Directory extends FileSystemNode {
  private readonly _children: FileSystemNode[] = [];

  constructor(name: string) {
    super(name);
  }

  getDisplayInfo(): string {
    return `📁 ${this.name}`;
  }

  getChildren(): ReadonlyArray<FileSystemNode> {
    return [...this._children];
  }

  addChild(node: FileSystemNode): void {
    this._children.push(node);
  }

  isDirectory(): boolean {
    return true;
  }

  /**
   * Composite Pattern：遞迴加總所有子節點大小（KB）
   * Leaf 回傳自身 sizeKB，Directory 加總子節點
   */
  getSizeKB(): number {
    return this._children.reduce((sum, child) => sum + child.getSizeKB(), 0);
  }

  /**
   * 遞迴搜尋名稱包含 keyword 的所有節點（不分大小寫）
   * 回傳扁平列表，祖先顯示邏輯由 UI 層處理（符合 SRP）
   */
  search(keyword: string): FileSystemNode[] {
    const lower = keyword.toLowerCase();
    const results: FileSystemNode[] = [];
    for (const child of this._children) {
      if (child.name.toLowerCase().includes(lower)) {
        results.push(child);
      }
      if (child.isDirectory()) {
        results.push(...(child as Directory).search(keyword));
      }
    }
    return results;
  }

  /**
   * Visitor Pattern — Composite 節點的 accept 實作
   * 由 Visitor 的 visitDirectory 決定是否遞迴走訪子節點
   */
  accept(visitor: IFileSystemVisitor): void {
    visitor.visitDirectory(this);
  }
}

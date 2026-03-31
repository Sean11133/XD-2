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

  /**
   * 從 children 中移除指定節點，回傳移除前的 index（找不到回傳 -1）
   * DeleteCommand 使用此回傳值還原位置
   */
  removeChild(node: FileSystemNode): number {
    const index = this._children.indexOf(node);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
    return index;
  }

  /**
   * 在指定位置插入節點（用於 Undo 刪除還原原始位置）
   */
  insertChildAt(index: number, node: FileSystemNode): void {
    this._children.splice(index, 0, node);
  }

  /**
   * 整批替換 children（用於 SortCommand Undo 還原排序前順序）
   */
  replaceChildren(nodes: FileSystemNode[]): void {
    this._children.splice(0, this._children.length, ...nodes);
  }

  clone(newName?: string): Directory {
    const copy = new Directory(newName ?? this.name);
    for (const child of this._children) {
      copy.addChild(child.clone());
    }
    return copy;
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

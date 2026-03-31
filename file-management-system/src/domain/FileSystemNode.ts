import type { IFileSystemVisitor } from "./IFileSystemVisitor";

export abstract class FileSystemNode {
  constructor(public readonly name: string) {}

  abstract getDisplayInfo(): string;

  /** 回傳此節點（含所有子節點）的總大小（KB）— Composite Pattern */
  abstract getSizeKB(): number;

  /** Visitor Pattern — 雙重分派入口，由具體子類別實作回呼對應的 visitXxx */
  abstract accept(visitor: IFileSystemVisitor): void;

  /** 深複製此節點（Prototype Pattern）— PasteCommand 使用
   * @param newName 指定複製後的新名稱（PasteCommand 用於消除同名衝突）
   */
  abstract clone(newName?: string): FileSystemNode;

  isDirectory(): boolean {
    return false;
  }
}

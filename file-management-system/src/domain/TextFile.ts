import { File } from "./File";
import type { IFileSystemVisitor } from "./IFileSystemVisitor";

export class TextFile extends File {
  constructor(
    fileName: string,
    sizeKB: number,
    createdAt: Date,
    public readonly encoding: string,
  ) {
    super(fileName, sizeKB, createdAt);
  }

  getDisplayInfo(): string {
    return `📝 ${this.fileName} [文字] ${this.sizeKB}KB, ${this.encoding}, ${this.formatDate(this.createdAt)}`;
  }

  accept(visitor: IFileSystemVisitor): void {
    visitor.visitTextFile(this);
  }
}

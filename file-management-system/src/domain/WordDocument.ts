import { File } from "./File";
import type { IFileSystemVisitor } from "./IFileSystemVisitor";

export class WordDocument extends File {
  constructor(
    fileName: string,
    sizeKB: number,
    createdAt: Date,
    public readonly pageCount: number,
  ) {
    super(fileName, sizeKB, createdAt);
  }

  getDisplayInfo(): string {
    return `\uD83D\uDCC4 ${this.fileName} [Word] ${this.sizeKB}KB, ${this.pageCount}\u9801, ${this.formatDate(this.createdAt)}`;
  }

  accept(visitor: IFileSystemVisitor): void {
    visitor.visitWordDocument(this);
  }

  clone(newName?: string): WordDocument {
    return new WordDocument(newName ?? this.fileName, this.sizeKB, this.createdAt, this.pageCount);
  }
}

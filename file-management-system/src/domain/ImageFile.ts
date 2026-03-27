import { File } from "./File";
import type { IFileSystemVisitor } from "./IFileSystemVisitor";

export class ImageFile extends File {
  constructor(
    fileName: string,
    sizeKB: number,
    createdAt: Date,
    public readonly width: number,
    public readonly height: number,
  ) {
    super(fileName, sizeKB, createdAt);
  }

  getDisplayInfo(): string {
    return `🖼️ ${this.fileName} [圖片] ${this.sizeKB}KB, ${this.width}×${this.height}, ${this.formatDate(this.createdAt)}`;
  }

  accept(visitor: IFileSystemVisitor): void {
    visitor.visitImageFile(this);
  }
}

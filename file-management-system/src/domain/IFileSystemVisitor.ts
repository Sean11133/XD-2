import type { WordDocument } from "./WordDocument";
import type { ImageFile } from "./ImageFile";
import type { TextFile } from "./TextFile";
import type { Directory } from "./Directory";

/**
 * Visitor Pattern — Visitor 介面
 * 每個 Concrete Visitor 代表一項對整棵樹的操作（如 XML 匯出）。
 * 新增操作只需新增 Visitor 類別，Domain 節點零修改（符合 OCP）。
 */
export interface IFileSystemVisitor {
  visitWordDocument(node: WordDocument): void;
  visitImageFile(node: ImageFile): void;
  visitTextFile(node: TextFile): void;
  visitDirectory(node: Directory): void;
}

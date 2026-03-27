import type { IFileSystemVisitor } from "../../domain/IFileSystemVisitor";
import type { WordDocument } from "../../domain/WordDocument";
import type { ImageFile } from "../../domain/ImageFile";
import type { TextFile } from "../../domain/TextFile";
import type { Directory } from "../../domain/Directory";

/**
 * Template Method Pattern — 匯出骨架抽象基類
 *
 * 封裝「怎麼走（遞迴走訪）」與「字元脫逸」、「縮排管理」等重複邏輯，
 * 開放四個抽象 Hook 方法供子類別實作，子類只需關注格式細節（做什麼）。
 *
 * 實作 IFileSystemVisitor，保持與現有 accept() 雙重分派機制的相容性（OCP）。
 * 新增匯出格式只需新增繼承此類別的子類別，不修改 Domain 層任何程式碼。
 */
export abstract class BaseExporterTemplate implements IFileSystemVisitor {
  protected readonly _lines: string[] = [];
  protected _indentLevel = 0;

  /** 回傳 _indentLevel × 2 空格的縮排字串 */
  protected indent(): string {
    return "  ".repeat(this._indentLevel);
  }

  /**
   * 輸出結果的前置表頭，預設為空字串。
   * 子類別可覆寫（例如 XML 宣告行 `<?xml version="1.0"?>`）。
   */
  protected getHeader(): string {
    return "";
  }

  // ─── 抽象 Hook 方法（子類別必須實作）──────────────────────────────

  /** 對目標格式的保留字元進行脫逸 */
  protected abstract escape(value: string): string;

  /**
   * 格式化 Leaf 節點的輸出行
   * @param type        - 節點類型名稱（"WordDocument" | "ImageFile" | "TextFile"）
   * @param escapedAttrs - 已脫逸的字串屬性 Map；數字型屬性以字串形式傳入
   * @param indentLevel - 當前縮排層級
   */
  protected abstract renderLeaf(
    type: string,
    escapedAttrs: Record<string, string>,
    indentLevel: number,
  ): string;

  /**
   * 格式化目錄開頭行（含 children 的起始標記）
   * @param escapedName - 已脫逸的目錄名稱
   * @param sizeKB      - 目錄總大小（KB），由 Composite Pattern 計算
   * @param indentLevel - 當前縮排層級（目錄本身所在層級）
   */
  protected abstract renderDirOpen(
    escapedName: string,
    sizeKB: number,
    indentLevel: number,
  ): string;

  /**
   * 格式化目錄結尾行（children 的結束標記）
   * @param indentLevel - 目錄本身的縮排層級（_indentLevel 已從 ++ 還原）
   */
  protected abstract renderDirClose(indentLevel: number): string;

  // ─── 骨架方法（Template Method 核心）──────────────────────────────

  /**
   * Directory 骨架方法：
   * 1. escape 目錄名稱
   * 2. 呼叫 renderDirOpen Hook → 推入 _lines
   * 3. _indentLevel++ → 遞迴走訪全部子節點 → _indentLevel--
   * 4. 呼叫 renderDirClose Hook → 推入 _lines
   */
  visitDirectory(node: Directory): void {
    const escapedName = this.escape(node.name);
    const sizeKB = node.getSizeKB();
    this._lines.push(this.renderDirOpen(escapedName, sizeKB, this._indentLevel));
    this._indentLevel++;
    for (const child of node.getChildren()) {
      child.accept(this);
    }
    this._indentLevel--;
    this._lines.push(this.renderDirClose(this._indentLevel));
  }

  /** WordDocument 骨架：escape 所有字串屬性 → 組裝 escapedAttrs → renderLeaf */
  visitWordDocument(node: WordDocument): void {
    const escapedAttrs: Record<string, string> = {
      name: this.escape(node.fileName),
      sizeKB: String(node.sizeKB),
      createdAt: node.createdAt.toISOString(),
      pageCount: String(node.pageCount),
    };
    this._lines.push(this.renderLeaf("WordDocument", escapedAttrs, this._indentLevel));
  }

  /** ImageFile 骨架：escape 所有字串屬性 → 組裝 escapedAttrs → renderLeaf */
  visitImageFile(node: ImageFile): void {
    const escapedAttrs: Record<string, string> = {
      name: this.escape(node.fileName),
      sizeKB: String(node.sizeKB),
      createdAt: node.createdAt.toISOString(),
      width: String(node.width),
      height: String(node.height),
    };
    this._lines.push(this.renderLeaf("ImageFile", escapedAttrs, this._indentLevel));
  }

  /** TextFile 骨架：escape 所有字串屬性 → 組裝 escapedAttrs → renderLeaf */
  visitTextFile(node: TextFile): void {
    const escapedAttrs: Record<string, string> = {
      name: this.escape(node.fileName),
      sizeKB: String(node.sizeKB),
      createdAt: node.createdAt.toISOString(),
      encoding: this.escape(node.encoding),
    };
    this._lines.push(this.renderLeaf("TextFile", escapedAttrs, this._indentLevel));
  }

  /** 回傳最終組裝字串（header 在 getHeader() 中定義，預設為空） */
  getResult(): string {
    const header = this.getHeader();
    return header ? [header, ...this._lines].join("\n") : this._lines.join("\n");
  }
}

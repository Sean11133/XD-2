import type { Directory } from "../../domain/Directory";
import type { IProgressSubject } from "../../domain/observer/IProgressSubject";
import { BaseExporterTemplate } from "./BaseExporterTemplate";
import { countNodes } from "./countNodes";

/**
 * Concrete Exporter — 將檔案系統樹序列化為純文字縮排樹狀圖
 *
 * 繼承 BaseExporterTemplate，輸出類似 `tree` 命令的純文字格式。
 *
 * 格式範例：
 * MyDocuments/ (120 KB)
 *   [DIR] Photos/ (60 KB)
 *     [IMG] vacation.png (60 KB, 1920x1080)
 *   [DOC] report.docx (45 KB, 10 pages)
 *   [TXT] notes.txt (15 KB, UTF-8)
 */
class PlainTextExporter extends BaseExporterTemplate {
  /** 純文字格式無需脫逸，直接回傳原字串 */
  protected escape(value: string): string {
    return value;
  }

  /** 目錄行：`{indent}{name}/ ({sizeKB} KB)` */
  protected renderDirOpen(
    escapedName: string,
    sizeKB: number,
    indentLevel: number,
  ): string {
    return `${"  ".repeat(indentLevel)}${escapedName}/ (${sizeKB} KB)`;
  }

  /** 純文字樹狀圖不需要目錄結束標記 */
  protected renderDirClose(_indentLevel: number): string {
    return "";
  }

  /** Leaf 節點：類型標記 + 名稱 + 主要屬性 */
  protected renderLeaf(
    type: string,
    escapedAttrs: Record<string, string>,
    indentLevel: number,
  ): string {
    const ind = "  ".repeat(indentLevel);
    const { name, sizeKB } = escapedAttrs;
    switch (type) {
      case "WordDocument":
        return `${ind}[DOC] ${name} (${sizeKB} KB, ${escapedAttrs.pageCount} pages)`;
      case "ImageFile":
        return `${ind}[IMG] ${name} (${sizeKB} KB, ${escapedAttrs.width}x${escapedAttrs.height})`;
      case "TextFile":
        return `${ind}[TXT] ${name} (${sizeKB} KB, ${escapedAttrs.encoding})`;
      default:
        return `${ind}[FILE] ${name} (${sizeKB} KB)`;
    }
  }

  /** 過濾 renderDirClose 產生的空字串行 */
  override getResult(): string {
    const header = this.getHeader();
    const filteredLines = this._lines.filter((l) => l !== "");
    return header
      ? [header, ...filteredLines].join("\n")
      : filteredLines.join("\n");
  }
}

/**
 * 對外公開的便利函式：接收根目錄，回傳完整純文字樹狀字串。
 * 呼叫端不需要知道 PlainTextExporter 的存在。
 */
export function exportToPlainText(
  root: Directory,
  progressSubject?: IProgressSubject,
): string {
  const exporter = new PlainTextExporter();
  if (progressSubject) {
    const total = countNodes(root);
    exporter.setProgressSubject(progressSubject, total, "Plain Text Export");
    exporter.notifyStart();
  }
  root.accept(exporter);
  return exporter.getResult();
}

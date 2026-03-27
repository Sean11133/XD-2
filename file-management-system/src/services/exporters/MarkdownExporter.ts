import type { Directory } from "../../domain/Directory";
import { BaseExporterTemplate } from "./BaseExporterTemplate";

/**
 * Concrete Exporter — 將檔案系統樹序列化為 Markdown 縮排列表
 *
 * 繼承 BaseExporterTemplate，只需實作 Markdown 格式相關的四個 Hook 方法；
 * 字元脫逸與縮排管理由基類統一處理（Template Method Pattern）。
 *
 * 格式範例：
 * - 📁 MyDocuments (120 KB)
 *   - 📄 report.docx (45 KB, 10 pages)
 *   - 🖼️ photo.png (60 KB, 1920×1080)
 *   - 📝 notes.txt (15 KB, UTF-8)
 */
class MarkdownExporter extends BaseExporterTemplate {
  /**
   * 脫逸 Markdown 保留字元：在特殊字元前加 `\` 前綴。
   * \ 必須最先處理，防止後續替換產生雙重脫逸。
   */
  protected escape(value: string): string {
    return value.replace(/[\\`*_[\]#|]/g, "\\$&");
  }

  /** 目錄行：`{indent}- 📁 escapedName (sizeKB KB)` */
  protected renderDirOpen(
    escapedName: string,
    sizeKB: number,
    indentLevel: number,
  ): string {
    return `${"  ".repeat(indentLevel)}- 📁 ${escapedName} (${sizeKB} KB)`;
  }

  /**
   * Markdown 列表不需要結束標記，回傳空字串。
   * getResult() 會過濾掉空字串行，確保輸出不含孤立空行。
   */
  protected renderDirClose(_indentLevel: number): string {
    return "";
  }

  /** Leaf 節點行：依節點類型選擇 Emoji 並輸出主要屬性 */
  protected renderLeaf(
    type: string,
    escapedAttrs: Record<string, string>,
    indentLevel: number,
  ): string {
    const ind = "  ".repeat(indentLevel);
    const { name, sizeKB } = escapedAttrs;
    switch (type) {
      case "WordDocument":
        return `${ind}- 📄 ${name} (${sizeKB} KB, ${escapedAttrs.pageCount} pages)`;
      case "ImageFile":
        return `${ind}- 🖼️ ${name} (${sizeKB} KB, ${escapedAttrs.width}×${escapedAttrs.height})`;
      case "TextFile":
        return `${ind}- 📝 ${name} (${sizeKB} KB, ${escapedAttrs.encoding})`;
      default:
        return `${ind}- 📄 ${name} (${sizeKB} KB)`;
    }
  }

  /**
   * 過濾 renderDirClose 產生的空字串行，確保輸出不含孤立空行。
   */
  override getResult(): string {
    const header = this.getHeader();
    const filteredLines = this._lines.filter((l) => l !== "");
    return header
      ? [header, ...filteredLines].join("\n")
      : filteredLines.join("\n");
  }
}

/**
 * 對外公開的便利函式：接收根目錄，回傳完整 Markdown 字串。
 * 呼叫端不需要知道 MarkdownExporter 的存在。
 */
export function exportToMarkdown(root: Directory): string {
  const exporter = new MarkdownExporter();
  root.accept(exporter);
  return exporter.getResult();
}

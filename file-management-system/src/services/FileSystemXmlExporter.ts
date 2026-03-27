import type { Directory } from "../domain/Directory";
import { BaseExporterTemplate } from "./exporters/BaseExporterTemplate";

/**
 * Concrete Exporter (refactored) — 將檔案系統樹序列化為 XML 字串
 *
 * 重構前自行管理 _lines、_indentLevel 與 escapeXml 函式；
 * 重構後繼承 BaseExporterTemplate，只需實作 XML 格式的四個 Hook 方法，
 * 消除與其他 Exporter 的重複邏輯（DRY）。
 *
 * 對外 exportToXml() 函式簽名不變，所有既有測試零退化（OCP）。
 */
class FileSystemXmlExporter extends BaseExporterTemplate {
  /** 將 XML 特殊字元跳脫（& 必須最先處理） */
  protected escape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  protected override getHeader(): string {
    return '<?xml version="1.0" encoding="UTF-8"?>';
  }

  protected renderDirOpen(
    escapedName: string,
    sizeKB: number,
    indentLevel: number,
  ): string {
    return `${"  ".repeat(indentLevel)}<Directory name="${escapedName}" sizeKB="${sizeKB}">`;
  }

  protected renderDirClose(indentLevel: number): string {
    return `${"  ".repeat(indentLevel)}</Directory>`;
  }

  /**
   * 將 escapedAttrs 轉為 XML 屬性字串，type 作為第一個屬性插入。
   * Record 的 insertion-order 保證屬性順序與原實作一致。
   */
  protected renderLeaf(
    type: string,
    escapedAttrs: Record<string, string>,
    indentLevel: number,
  ): string {
    const ind = "  ".repeat(indentLevel);
    const attrStr = Object.entries(escapedAttrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    return `${ind}<File type="${type}" ${attrStr}/>`;
  }
}

/**
 * 對外公開的便利函式：接收根目錄，回傳完整 XML 字串
 * 呼叫端不需要知道 FileSystemXmlExporter 的存在
 */
export function exportToXml(root: Directory): string {
  const exporter = new FileSystemXmlExporter();
  root.accept(exporter);
  return exporter.getResult();
}

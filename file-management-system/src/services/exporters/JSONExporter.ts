import type { Directory } from "../../domain/Directory";
import type { IProgressSubject } from "../../domain/observer/IProgressSubject";
import { BaseExporterTemplate } from "./BaseExporterTemplate";
import { countNodes } from "./countNodes";

/**
 * Concrete Exporter — 將檔案系統樹序列化為 JSON 字串
 *
 * 繼承 BaseExporterTemplate，只需實作 JSON 格式相關的四個 Hook 方法；
 * 字元脫逸與縮排管理由基類統一處理（Template Method Pattern）。
 *
 * 尾隨逗號策略：所有 renderLeaf / renderDirClose 輸出時一律附加逗號，
 * 由 getResult() 後處理統一清除最後一個子項目的多餘逗號，
 * 確保回傳的字串可直接被 JSON.parse() 解析。
 */
class JSONExporter extends BaseExporterTemplate {
  /**
   * 脫逸 JSON 字串保留字元。
   * \ 必須最先處理，防止後續替換產生雙重脫逸。
   */
  protected escape(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }

  /** 目錄開頭行：`{indent}{"type":"Directory","name":"...","sizeKB":N,"children":[` */
  protected renderDirOpen(
    escapedName: string,
    sizeKB: number,
    indentLevel: number,
  ): string {
    const ind = "  ".repeat(indentLevel);
    return `${ind}{"type":"Directory","name":"${escapedName}","sizeKB":${sizeKB},"children":[`;
  }

  /**
   * 目錄結尾行：`{indent}]},`
   * 尾隨逗號由 getResult() 後處理清除。
   */
  protected renderDirClose(indentLevel: number): string {
    return `${"  ".repeat(indentLevel)}]},`;
  }

  /**
   * Leaf 節點行：`{indent}{...},`，依節點類型附加對應屬性。
   * 尾隨逗號由 getResult() 後處理清除。
   */
  protected renderLeaf(
    type: string,
    escapedAttrs: Record<string, string>,
    indentLevel: number,
  ): string {
    const ind = "  ".repeat(indentLevel);
    const { name, sizeKB, createdAt } = escapedAttrs;
    switch (type) {
      case "WordDocument":
        return `${ind}{"type":"${type}","name":"${name}","sizeKB":${sizeKB},"createdAt":"${createdAt}","pageCount":${escapedAttrs.pageCount}},`;
      case "ImageFile":
        return `${ind}{"type":"${type}","name":"${name}","sizeKB":${sizeKB},"createdAt":"${createdAt}","width":${escapedAttrs.width},"height":${escapedAttrs.height}},`;
      case "TextFile":
        return `${ind}{"type":"${type}","name":"${name}","sizeKB":${sizeKB},"createdAt":"${createdAt}","encoding":"${escapedAttrs.encoding}"},`;
      default:
        return `${ind}{"type":"${type}","name":"${name}","sizeKB":${sizeKB},"createdAt":"${createdAt}"},`;
    }
  }

  /**
   * 後處理：移除 JSON 陣列中最後子項目的尾隨逗號，產生合法 JSON。
   * - `,\n{spaces}]` 或 `,\n{spaces}}` → 移除逗號（陣列最後一項）
   * - 結尾孤立逗號（根節點 renderDirClose 產生）→ 移除
   */
  override getResult(): string {
    const raw = super.getResult();
    return raw.replace(/,(\n\s*[}\]])/g, "$1").replace(/,\s*$/, "");
  }
}

/**
 * 對外公開的便利函式：接收根目錄，回傳完整 JSON 字串。
 * subject 為可選參數（不傳時行為與修改前完全相同，OCP）。
 */
export function exportToJson(
  root: Directory,
  subject?: IProgressSubject,
): string {
  const exporter = new JSONExporter();
  if (subject) {
    exporter.setProgressSubject(subject, countNodes(root), "JSONExporter");
    exporter.notifyStart();
  }
  root.accept(exporter);
  return exporter.getResult();
}

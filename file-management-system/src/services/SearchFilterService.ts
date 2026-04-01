import type { Directory } from "../domain/Directory";
import type { FileSystemNode } from "../domain/FileSystemNode";
import type { Label } from "../domain/labels/Label";
import type { IProgressSubject } from "../domain/observer/IProgressSubject";

/**
 * SearchFilterService — 純函式服務，封裝檔案樹搜尋與標籤過濾邏輯
 *
 * 職責：
 * 1. 關鍵字遞迴搜尋（含 Observer 進度通知）
 * 2. 標籤過濾（回傳符合標籤的節點路徑集合）
 *
 * 設計原則：
 * - SRP：只做搜尋/過濾，不處理 UI 狀態、不依賴 React
 * - DIP：依賴 `IProgressSubject` 抽象，不依賴具體 Subject 實作
 */
export class SearchFilterService {
  /**
   * 遞迴建立關鍵字命中路徑集合，並透過 Subject 發佈掃描進度。
   *
   * @param dir           - 搜尋起始目錄
   * @param keyword       - 搜尋關鍵字（不區分大小寫）
   * @param dirPath       - 當前目錄的完整路徑（頂層傳入 dir.name）
   * @param result        - 命中路徑集合（in/out）
   * @param subject       - 進度 Subject（可選）
   * @param total         - 總節點數（用於計算百分比）
   * @param counter       - 已走訪節點計數器（in/out，物件參考傳遞）
   * @param operationName - 操作名稱（顯示於進度訊息）
   * @returns 是否有子節點命中
   */
  buildKeywordMatchedPaths(
    dir: Directory,
    keyword: string,
    dirPath: string,
    result: Set<string>,
    subject: IProgressSubject | null,
    total: number,
    counter: { current: number },
    operationName: string,
  ): boolean {
    const lower = keyword.toLowerCase();
    let hasMatch = false;

    for (const child of dir.getChildren()) {
      const childPath = `${dirPath}/${child.name}`;
      counter.current++;
      const percentage = Math.min(
        100,
        Math.round((counter.current / total) * 100),
      );

      if (child.isDirectory()) {
        const childHasMatch = this.buildKeywordMatchedPaths(
          child as Directory,
          keyword,
          childPath,
          result,
          subject,
          total,
          counter,
          operationName,
        );
        if (child.name.toLowerCase().includes(lower) || childHasMatch) {
          result.add(childPath);
          hasMatch = true;
        }
      } else {
        if (child.name.toLowerCase().includes(lower)) {
          result.add(childPath);
          hasMatch = true;
        }
      }

      subject?.notify({
        phase: "scan",
        operationName,
        current: counter.current,
        total,
        percentage,
        message: `掃描 ${child.name}`,
        timestamp: new Date(),
      });
    }

    return hasMatch;
  }

  /**
   * 遞迴建立標籤命中路徑集合（無進度通知，因為通常是即時過濾）。
   *
   * @param dir      - 搜尋起始目錄
   * @param label    - 目標標籤
   * @param dirPath  - 當前目錄路徑
   * @param result   - 命中路徑集合（in/out）
   * @param getLabels - 取得節點標籤的函式
   * @returns 是否有子節點命中
   */
  buildLabelMatchedPaths(
    dir: Directory,
    label: Label,
    dirPath: string,
    result: Set<string>,
    getLabels: (node: FileSystemNode) => Label[],
  ): boolean {
    let hasMatch = false;

    for (const child of dir.getChildren()) {
      const childPath = `${dirPath}/${child.name}`;
      const childLabels = getLabels(child);
      const childHasLabel = childLabels.some((l) => l.id === label.id);

      if (child.isDirectory()) {
        const descMatch = this.buildLabelMatchedPaths(
          child as Directory,
          label,
          childPath,
          result,
          getLabels,
        );
        if (descMatch || childHasLabel) {
          result.add(childPath);
          hasMatch = true;
        }
      } else {
        if (childHasLabel) {
          result.add(childPath);
          hasMatch = true;
        }
      }
    }

    return hasMatch;
  }

  /**
   * 便利方法：同時根據關鍵字和標籤過濾，回傳最終有效路徑集合。
   * - 若兩者皆有，取交集（AND 邏輯）
   * - 若只有一者，使用單一過濾結果
   * - 若兩者皆無，回傳 undefined（代表「不過濾」）
   */
  filter(params: {
    root: Directory;
    keyword?: string;
    label?: Label | null;
    getLabels: (node: FileSystemNode) => Label[];
    totalNodes: number;
    subject?: IProgressSubject | null;
    operationName?: string;
  }): Set<string> | undefined {
    const {
      root,
      keyword,
      label,
      getLabels,
      totalNodes,
      subject = null,
      operationName = "搜尋",
    } = params;

    const hasKeyword = !!(keyword && keyword.trim());
    const hasLabel = !!label;

    if (!hasKeyword && !hasLabel) return undefined;

    let keywordPaths: Set<string> | null = null;
    let labelPaths: Set<string> | null = null;

    if (hasKeyword) {
      const paths = new Set<string>();
      const counter = { current: 0 };
      this.buildKeywordMatchedPaths(
        root,
        keyword!,
        root.name,
        paths,
        subject,
        totalNodes,
        counter,
        operationName,
      );
      if (root.name.toLowerCase().includes(keyword!.toLowerCase())) {
        paths.add(root.name);
      }
      keywordPaths = paths;
    }

    if (hasLabel) {
      const paths = new Set<string>();
      this.buildLabelMatchedPaths(root, label!, root.name, paths, getLabels);
      if (getLabels(root).some((l) => l.id === label!.id)) {
        paths.add(root.name);
      }
      labelPaths = paths;
    }

    if (keywordPaths && labelPaths) {
      // AND 邏輯：取交集
      const intersection = new Set<string>();
      for (const p of keywordPaths) {
        if (labelPaths.has(p)) intersection.add(p);
      }
      return intersection;
    }

    return keywordPaths ?? labelPaths ?? undefined;
  }
}

/** 模組層級單例 */
export const searchFilterService = new SearchFilterService();

import { describe, it, expect } from "vitest";
import { Directory } from "../../src/domain/Directory";
import { TextFile } from "../../src/domain/TextFile";
import { WordDocument } from "../../src/domain/WordDocument";
import { LabelFactory } from "../../src/domain/labels/LabelFactory";
import { SearchFilterService } from "../../src/services/SearchFilterService";

const DATE = new Date("2026-01-01");

function buildTree() {
  const root = new Directory("root");
  const docs = new Directory("docs");
  const photos = new Directory("photos");
  docs.addChild(new TextFile("report.txt", 10, DATE, "UTF-8"));
  docs.addChild(new WordDocument("notes.docx", 20, DATE, 5));
  photos.addChild(new TextFile("readme.txt", 5, DATE, "ASCII"));
  root.addChild(docs);
  root.addChild(photos);
  return { root, docs, photos };
}

describe("SearchFilterService.buildKeywordMatchedPaths()", () => {
  const svc = new SearchFilterService();

  it("找到命中關鍵字的葉節點路徑", () => {
    const { root } = buildTree();
    const result = new Set<string>();
    const counter = { current: 0 };
    svc.buildKeywordMatchedPaths(
      root,
      "report",
      "root",
      result,
      null,
      5,
      counter,
      "test",
    );
    expect(result.has("root/docs/report.txt")).toBe(true);
  });

  it("祖先目錄也被加入 result（確保樹狀顯示可見）", () => {
    const { root } = buildTree();
    const result = new Set<string>();
    const counter = { current: 0 };
    svc.buildKeywordMatchedPaths(
      root,
      "report",
      "root",
      result,
      null,
      5,
      counter,
      "test",
    );
    expect(result.has("root/docs")).toBe(true);
  });

  it("關鍵字不符合時 result 為空", () => {
    const { root } = buildTree();
    const result = new Set<string>();
    const counter = { current: 0 };
    svc.buildKeywordMatchedPaths(
      root,
      "nonexistent",
      "root",
      result,
      null,
      5,
      counter,
      "test",
    );
    expect(result.size).toBe(0);
  });

  it("搜尋不區分大小寫", () => {
    const { root } = buildTree();
    const result = new Set<string>();
    const counter = { current: 0 };
    svc.buildKeywordMatchedPaths(
      root,
      "REPORT",
      "root",
      result,
      null,
      5,
      counter,
      "test",
    );
    expect(result.has("root/docs/report.txt")).toBe(true);
  });

  it("多個命中項目全部加入 result", () => {
    const { root } = buildTree();
    const result = new Set<string>();
    const counter = { current: 0 };
    svc.buildKeywordMatchedPaths(
      root,
      "txt",
      "root",
      result,
      null,
      5,
      counter,
      "test",
    );
    expect(result.has("root/docs/report.txt")).toBe(true);
    expect(result.has("root/photos/readme.txt")).toBe(true);
  });
});

describe("SearchFilterService.buildLabelMatchedPaths()", () => {
  const svc = new SearchFilterService();
  const factory = new LabelFactory();

  it("找到含標籤的葉節點和其祖先", () => {
    const { root, docs } = buildTree();
    const label = factory.getOrCreate("urgent");
    const labeled = docs.getChildren()[0];
    const labelsMap = new Map([[labeled, [label]]]);
    const result = new Set<string>();
    svc.buildLabelMatchedPaths(
      root,
      label,
      "root",
      result,
      (n) => labelsMap.get(n) ?? [],
    );
    expect(result.has("root/docs/report.txt")).toBe(true);
    expect(result.has("root/docs")).toBe(true);
  });

  it("標籤不符合時 result 為空", () => {
    const { root } = buildTree();
    const label = factory.getOrCreate("rare");
    const result = new Set<string>();
    svc.buildLabelMatchedPaths(root, label, "root", result, () => []);
    expect(result.size).toBe(0);
  });
});

describe("SearchFilterService.filter()", () => {
  const svc = new SearchFilterService();

  it("keyword 和 label 皆無時回傳 undefined", () => {
    const { root } = buildTree();
    const result = svc.filter({
      root,
      getLabels: () => [],
      totalNodes: 5,
    });
    expect(result).toBeUndefined();
  });

  it("只有 keyword 時回傳關鍵字過濾結果", () => {
    const { root } = buildTree();
    const paths = svc.filter({
      root,
      keyword: "report",
      getLabels: () => [],
      totalNodes: 5,
    });
    expect(paths).toBeDefined();
    expect(paths!.has("root/docs/report.txt")).toBe(true);
  });

  it("只有 label 時回傳標籤過濾結果", () => {
    const { root, docs } = buildTree();
    const factory = new LabelFactory();
    const label = factory.getOrCreate("todo");
    const labeled = docs.getChildren()[0];
    const labelsMap = new Map([[labeled, [label]]]);
    const paths = svc.filter({
      root,
      label,
      getLabels: (n) => labelsMap.get(n) ?? [],
      totalNodes: 5,
    });
    expect(paths).toBeDefined();
    expect(paths!.has("root/docs/report.txt")).toBe(true);
  });

  it("keyword + label 同時存在取交集", () => {
    const { root, docs } = buildTree();
    const factory = new LabelFactory();
    const label = factory.getOrCreate("important");
    // Label 標記在 report.txt，keyword 也搜 report → 有交集
    const labeled = docs.getChildren()[0];
    const labelsMap = new Map([[labeled, [label]]]);
    const paths = svc.filter({
      root,
      keyword: "report",
      label,
      getLabels: (n) => labelsMap.get(n) ?? [],
      totalNodes: 5,
    });
    expect(paths).toBeDefined();
    expect(paths!.has("root/docs/report.txt")).toBe(true);
  });

  it("keyword + label 無交集時回傳空 Set", () => {
    const { root } = buildTree();
    const factory = new LabelFactory();
    const label = factory.getOrCreate("nope");
    // Label 標記在圖片，keyword 搜 report → 無交集
    const photos = root.getChildren()[1] as Directory;
    const labeled = photos.getChildren()[0];
    const labelsMap = new Map([[labeled, [label]]]);
    const paths = svc.filter({
      root,
      keyword: "report",
      label,
      getLabels: (n) => labelsMap.get(n) ?? [],
      totalNodes: 5,
    });
    expect(paths).toBeDefined();
    expect(paths!.size).toBe(0);
  });
});

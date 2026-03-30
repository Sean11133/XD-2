import { describe, it, expect, vi } from "vitest";
import { Directory } from "../../../src/domain/Directory";
import { WordDocument } from "../../../src/domain/WordDocument";
import { TextFile } from "../../../src/domain/TextFile";
import { ImageFile } from "../../../src/domain/ImageFile";
import { ProgressSubjectImpl } from "../../../src/services/observers/ProgressSubjectImpl";
import { ConsoleObserver } from "../../../src/services/observers/ConsoleObserver";
import { DashboardObserver } from "../../../src/services/observers/DashboardObserver";
import { exportToJson } from "../../../src/services/exporters/JSONExporter";
import { exportToMarkdown } from "../../../src/services/exporters/MarkdownExporter";
import { exportToXml } from "../../../src/services/FileSystemXmlExporter";
import { countNodes } from "../../../src/services/exporters/countNodes";

const DATE = new Date("2026-01-15T00:00:00.000Z");

/** 建立一個包含 2 個 leaf、1 個子目錄、1 個子目錄 leaf 的測試樹（共 4 節點）*/
function buildTestTree(): Directory {
  const root = new Directory("root");
  root.addChild(new TextFile("readme.txt", 5, DATE, "UTF-8"));
  root.addChild(new WordDocument("report.docx", 20, DATE, 3));
  const sub = new Directory("docs");
  sub.addChild(new ImageFile("photo.png", 50, DATE, 800, 600));
  root.addChild(sub);
  return root;
}

describe("Exporter + Observer 整合測試", () => {
  describe("countNodes", () => {
    it("回傳正確的節點總數（含目錄）", () => {
      const tree = buildTestTree();
      // root(1) + readme(1) + report(1) + docs(1) + photo(1) = 5
      expect(countNodes(tree)).toBe(5);
    });

    it("只有根目錄時回傳 1", () => {
      const root = new Directory("root");
      expect(countNodes(root)).toBe(1);
    });
  });

  describe("exportToJson + Subject + Observer", () => {
    it("所有 onProgress 呼叫次數 = countNodes + 1（含開始事件）", () => {
      const tree = buildTestTree();
      const subject = new ProgressSubjectImpl();
      const cb = vi.fn();
      subject.subscribe({ onProgress: cb });
      exportToJson(tree, subject);
      // 1 開始事件 + countNodes(tree) = 1 + 5 = 6
      expect(cb).toHaveBeenCalledTimes(countNodes(tree) + 1);
    });

    it("最後一個事件 percentage === 100", () => {
      const tree = buildTestTree();
      const subject = new ProgressSubjectImpl();
      const events: number[] = [];
      subject.subscribe({ onProgress: (e) => events.push(e.percentage) });
      exportToJson(tree, subject);
      expect(events[events.length - 1]).toBe(100);
    });

    it("第一個事件 percentage === 0（開始事件）", () => {
      const tree = buildTestTree();
      const subject = new ProgressSubjectImpl();
      const events: number[] = [];
      subject.subscribe({ onProgress: (e) => events.push(e.percentage) });
      exportToJson(tree, subject);
      expect(events[0]).toBe(0);
    });

    it("不傳 subject 時回傳結果與原行為相同（向後相容）", () => {
      const tree = buildTestTree();
      const withSubject = exportToJson(tree, new ProgressSubjectImpl());
      const withoutSubject = exportToJson(tree); // 原有簽章
      expect(withSubject).toBe(withoutSubject);
    });

    it("回傳 JSON 字串可被 JSON.parse() 解析", () => {
      const tree = buildTestTree();
      const json = exportToJson(tree, new ProgressSubjectImpl());
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe("exportToMarkdown + Subject", () => {
    it("onProgress 呼叫次數 = countNodes + 1", () => {
      const tree = buildTestTree();
      const subject = new ProgressSubjectImpl();
      const cb = vi.fn();
      subject.subscribe({ onProgress: cb });
      exportToMarkdown(tree, subject);
      expect(cb).toHaveBeenCalledTimes(countNodes(tree) + 1);
    });

    it("不傳 subject 時向後相容", () => {
      const tree = buildTestTree();
      expect(exportToMarkdown(tree)).toBe(
        exportToMarkdown(tree, new ProgressSubjectImpl()),
      );
    });
  });

  describe("exportToXml + Subject", () => {
    it("onProgress 呼叫次數 = countNodes + 1", () => {
      const tree = buildTestTree();
      const subject = new ProgressSubjectImpl();
      const cb = vi.fn();
      subject.subscribe({ onProgress: cb });
      exportToXml(tree, subject);
      expect(cb).toHaveBeenCalledTimes(countNodes(tree) + 1);
    });

    it("不傳 subject 時向後相容", () => {
      const tree = buildTestTree();
      expect(exportToXml(tree)).toBe(
        exportToXml(tree, new ProgressSubjectImpl()),
      );
    });
  });

  describe("ConsoleObserver + DashboardObserver 同時訂閱", () => {
    it("兩個 Observer 各自獨立更新，互不干擾", () => {
      const tree = buildTestTree();
      const subject = new ProgressSubjectImpl();
      const logCb = vi.fn();
      const dashCb = vi.fn();
      const consoleObs = new ConsoleObserver(logCb);
      const dashObs = new DashboardObserver(dashCb);
      subject.subscribe(consoleObs);
      subject.subscribe(dashObs);

      exportToJson(tree, subject);

      const total = countNodes(tree) + 1;
      expect(logCb).toHaveBeenCalledTimes(total);
      expect(dashCb).toHaveBeenCalledTimes(total);
    });

    it("unsubscribe 其中一個後，另一個仍繼續收到通知", () => {
      const tree = buildTestTree();
      const subject = new ProgressSubjectImpl();
      const logCb = vi.fn();
      const dashCb = vi.fn();
      const consoleObs = new ConsoleObserver(logCb);
      const dashObs = new DashboardObserver(dashCb);
      subject.subscribe(consoleObs);
      subject.subscribe(dashObs);
      subject.unsubscribe(dashObs); // ← 移除 dashObs

      exportToJson(tree, subject);

      expect(logCb).toHaveBeenCalled();
      expect(dashCb).not.toHaveBeenCalled(); // ← 已取消訂閱
    });
  });
});

import { describe, it, expect } from "vitest";
import { Directory } from "../../../src/domain/Directory";
import { WordDocument } from "../../../src/domain/WordDocument";
import { ImageFile } from "../../../src/domain/ImageFile";
import { TextFile } from "../../../src/domain/TextFile";
import { exportToJson } from "../../../src/services/exporters/JSONExporter";

const DATE = new Date("2026-01-15T00:00:00.000Z");

describe("JSONExporter", () => {
  it("空目錄輸出合法 JSON，含 type/name/sizeKB/children 欄位", () => {
    const root = new Directory("root");
    const json = exportToJson(root);
    expect(() => JSON.parse(json)).not.toThrow();
    const obj = JSON.parse(json);
    expect(obj.type).toBe("Directory");
    expect(obj.name).toBe("root");
    expect(obj.sizeKB).toBe(0);
    expect(Array.isArray(obj.children)).toBe(true);
    expect(obj.children).toHaveLength(0);
  });

  it("含 TextFile 子節點：children 陣列含節點且 JSON 合法", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("readme.txt", 10, DATE, "UTF-8"));
    const obj = JSON.parse(exportToJson(root));
    expect(obj.children).toHaveLength(1);
    expect(obj.children[0].type).toBe("TextFile");
    expect(obj.children[0].name).toBe("readme.txt");
    expect(obj.children[0].sizeKB).toBe(10);
    expect(obj.children[0].encoding).toBe("UTF-8");
  });

  it("WordDocument 節點含 pageCount 欄位", () => {
    const root = new Directory("root");
    root.addChild(new WordDocument("report.docx", 80, DATE, 5));
    const obj = JSON.parse(exportToJson(root));
    expect(obj.children[0].type).toBe("WordDocument");
    expect(obj.children[0].pageCount).toBe(5);
  });

  it("ImageFile 節點含 width 與 height 欄位", () => {
    const root = new Directory("root");
    root.addChild(new ImageFile("photo.png", 300, DATE, 1920, 1080));
    const obj = JSON.parse(exportToJson(root));
    expect(obj.children[0].type).toBe("ImageFile");
    expect(obj.children[0].width).toBe(1920);
    expect(obj.children[0].height).toBe(1080);
  });

  it("檔名含雙引號時，JSON 字串正確脫逸（不破壞解析）", () => {
    const root = new Directory("root");
    root.addChild(new TextFile('my"file.txt', 5, DATE, "UTF-8"));
    const json = exportToJson(root);
    expect(() => JSON.parse(json)).not.toThrow();
    const obj = JSON.parse(json);
    expect(obj.children[0].name).toBe('my"file.txt');
  });

  it("檔名含反斜線時，JSON 字串正確脫逸", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("path\\file.txt", 5, DATE, "UTF-8"));
    const json = exportToJson(root);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).children[0].name).toBe("path\\file.txt");
  });

  it("多個子節點：陣列最後一項結尾無尾隨逗號（整體 JSON 合法）", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("a.txt", 1, DATE, "UTF-8"));
    root.addChild(new WordDocument("b.docx", 2, DATE, 1));
    root.addChild(new ImageFile("c.png", 3, DATE, 100, 100));
    const json = exportToJson(root);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).children).toHaveLength(3);
  });

  it("多層嵌套 Directory：整體 JSON 合法，巢狀 children 正確", () => {
    const root = new Directory("root");
    const sub = new Directory("docs");
    sub.addChild(new TextFile("plan.txt", 5, DATE, "UTF-8"));
    root.addChild(sub);
    const json = exportToJson(root);
    expect(() => JSON.parse(json)).not.toThrow();
    const obj = JSON.parse(json);
    expect(obj.children[0].type).toBe("Directory");
    expect(obj.children[0].name).toBe("docs");
    expect(obj.children[0].children[0].name).toBe("plan.txt");
  });

  it("sizeKB 反映 Composite 累計大小", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("a.txt", 30, DATE, "UTF-8"));
    root.addChild(new WordDocument("b.docx", 70, DATE, 2));
    const obj = JSON.parse(exportToJson(root));
    expect(obj.sizeKB).toBe(100);
  });

  it("含換行符的字串值正確脫逸", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("line\nnote.txt", 1, DATE, "UTF-8"));
    const json = exportToJson(root);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).children[0].name).toBe("line\nnote.txt");
  });
});

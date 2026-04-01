import { describe, it, expect } from "vitest";
import { FileSystemFacade } from "../../src/services/FileSystemFacade";
import { CommandInvoker } from "../../src/services/CommandInvoker";
import { Clipboard } from "../../src/domain/Clipboard";
import { TagMediator } from "../../src/services/TagMediator";
import { LabelFactory } from "../../src/domain/labels/LabelFactory";
import { InMemoryTagRepository } from "../../src/services/repositories/InMemoryTagRepository";
import { Directory } from "../../src/domain/Directory";
import { TextFile } from "../../src/domain/TextFile";
import type { FileSystemNode } from "../../src/domain/FileSystemNode";

/** 每個 test 使用獨立的隔離依賴 — 完全不依賴模組層級單例 */
function createFacade() {
  const invoker = new CommandInvoker();
  Clipboard._resetForTest();
  const clipboard = Clipboard.getInstance();
  const factory = new LabelFactory();
  const mediator = new TagMediator(new InMemoryTagRepository(), factory);
  const facade = new FileSystemFacade(invoker, clipboard, mediator, factory);
  return { facade, invoker, clipboard, factory, mediator };
}

describe("FileSystemFacade", () => {
  // ── File CRUD ────────────────────────────────────────────────────────────

  describe("copy()", () => {
    it("複製節點後 canPaste(dir) = true", () => {
      const { facade } = createFacade();
      const root = new Directory("root");
      const file = new TextFile("a.txt", 1, new Date(), "UTF-8");
      root.addChild(file);

      facade.copy(file);

      expect(facade.canPaste(root)).toBe(true);
    });

    it("複製不加入 undo 歷程（canUndo = false）", () => {
      const { facade } = createFacade();
      const file = new TextFile("a.txt", 1, new Date(), "UTF-8");

      facade.copy(file);

      expect(facade.canUndo).toBe(false);
    });
  });

  describe("paste()", () => {
    it("貼上後節點出現在目標目錄", () => {
      const { facade } = createFacade();
      const src = new Directory("src");
      const dst = new Directory("dst");
      const file = new TextFile("a.txt", 1, new Date(), "UTF-8");
      src.addChild(file);

      facade.copy(file);
      const result = facade.paste(dst);

      expect(dst.getChildren()).toHaveLength(1);
      expect(result.pastedName).toBe("a.txt");
      expect(result.renamed).toBe(false);
    });

    it("同名節點時 renamed = true，名稱含「複製」", () => {
      const { facade } = createFacade();
      const src = new Directory("src");
      const dst = new Directory("dst");
      const file = new TextFile("a.txt", 1, new Date(), "UTF-8");
      const dup = new TextFile("a.txt", 2, new Date(), "UTF-8");
      src.addChild(file);
      dst.addChild(dup);

      facade.copy(file);
      const result = facade.paste(dst);

      expect(result.renamed).toBe(true);
      expect(result.pastedName).toContain("複製");
    });

    it("貼上後 canUndo = true", () => {
      const { facade } = createFacade();
      const src = new Directory("src");
      const dst = new Directory("dst");
      const file = new TextFile("a.txt", 1, new Date(), "UTF-8");
      src.addChild(file);

      facade.copy(file);
      facade.paste(dst);

      expect(facade.canUndo).toBe(true);
    });
  });

  describe("delete()", () => {
    it("刪除後節點消失於父目錄", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      const file = new TextFile("b.txt", 1, new Date(), "UTF-8");
      dir.addChild(file);

      facade.delete(file, dir);

      expect(dir.getChildren()).toHaveLength(0);
    });

    it("刪除後 canUndo = true", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      const file = new TextFile("b.txt", 1, new Date(), "UTF-8");
      dir.addChild(file);

      facade.delete(file, dir);

      expect(facade.canUndo).toBe(true);
    });
  });

  describe("sort()", () => {
    it("排序後子節點順序改變", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      const b = new TextFile("b.txt", 1, new Date(), "UTF-8");
      const a = new TextFile("a.txt", 1, new Date(), "UTF-8");
      dir.addChild(b);
      dir.addChild(a);

      const strategy = {
        label: "名稱",
        sort: (nodes: FileSystemNode[]) =>
          [...nodes].sort((x, y) => x.name.localeCompare(y.name)),
      };
      facade.sort(dir, strategy);

      expect(dir.getChildren()[0].name).toBe("a.txt");
    });

    it("排序後 canUndo = true", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      dir.addChild(new TextFile("b.txt", 1, new Date(), "UTF-8"));
      dir.addChild(new TextFile("a.txt", 1, new Date(), "UTF-8"));

      const strategy = {
        label: "名稱",
        sort: (nodes: FileSystemNode[]) =>
          [...nodes].sort((x, y) => x.name.localeCompare(y.name)),
      };
      facade.sort(dir, strategy);

      expect(facade.canUndo).toBe(true);
    });
  });

  // ── Undo / Redo ──────────────────────────────────────────────────────────

  describe("undo() / redo()", () => {
    it("paste 後 undo() 還原（節點消失）", () => {
      const { facade } = createFacade();
      const src = new Directory("src");
      const dst = new Directory("dst");
      const file = new TextFile("a.txt", 1, new Date(), "UTF-8");
      src.addChild(file);

      facade.copy(file);
      facade.paste(dst);
      expect(dst.getChildren()).toHaveLength(1);

      facade.undo();
      expect(dst.getChildren()).toHaveLength(0);
    });

    it("delete 後 undo() 還原（節點出現）", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      const file = new TextFile("c.txt", 1, new Date(), "UTF-8");
      dir.addChild(file);

      facade.delete(file, dir);
      expect(dir.getChildren()).toHaveLength(0);

      facade.undo();
      expect(dir.getChildren()).toHaveLength(1);
    });

    it("undo 後 redo() 重做", () => {
      const { facade } = createFacade();
      const src = new Directory("src");
      const dst = new Directory("dst");
      const file = new TextFile("a.txt", 1, new Date(), "UTF-8");
      src.addChild(file);

      facade.copy(file);
      facade.paste(dst);
      facade.undo();
      expect(dst.getChildren()).toHaveLength(0);

      facade.redo();
      expect(dst.getChildren()).toHaveLength(1);
    });

    it("canUndo / canRedo 狀態正確", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      const file = new TextFile("d.txt", 1, new Date(), "UTF-8");
      dir.addChild(file);

      expect(facade.canUndo).toBe(false);
      expect(facade.canRedo).toBe(false);

      facade.delete(file, dir);
      expect(facade.canUndo).toBe(true);
      expect(facade.canRedo).toBe(false);

      facade.undo();
      expect(facade.canUndo).toBe(false);
      expect(facade.canRedo).toBe(true);
    });

    it("undoDescription 回傳 string | undefined（不回傳 null）", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      const file = new TextFile("e.txt", 1, new Date(), "UTF-8");
      dir.addChild(file);

      expect(facade.undoDescription).toBeUndefined();

      facade.delete(file, dir);
      expect(typeof facade.undoDescription).toBe("string");
    });

    it("redoDescription 回傳 string | undefined（不回傳 null）", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");
      const file = new TextFile("f.txt", 1, new Date(), "UTF-8");
      dir.addChild(file);

      expect(facade.redoDescription).toBeUndefined();

      facade.delete(file, dir);
      facade.undo();
      expect(typeof facade.redoDescription).toBe("string");
    });
  });

  describe("canPaste()", () => {
    it("clipboard 有節點且 selectedNode 為 Directory → true", () => {
      const { facade } = createFacade();
      const file = new TextFile("g.txt", 1, new Date(), "UTF-8");
      const dir = new Directory("dir");

      facade.copy(file);
      expect(facade.canPaste(dir)).toBe(true);
    });

    it("selectedNode 為 File → false", () => {
      const { facade } = createFacade();
      const file = new TextFile("g.txt", 1, new Date(), "UTF-8");
      const anotherFile = new TextFile("h.txt", 1, new Date(), "UTF-8");

      facade.copy(file);
      expect(facade.canPaste(anotherFile)).toBe(false);
    });

    it("selectedNode 為 null → false", () => {
      const { facade } = createFacade();
      const file = new TextFile("g.txt", 1, new Date(), "UTF-8");

      facade.copy(file);
      expect(facade.canPaste(null)).toBe(false);
    });

    it("clipboard 無節點 → false", () => {
      const { facade } = createFacade();
      const dir = new Directory("dir");

      expect(facade.canPaste(dir)).toBe(false);
    });
  });

  // ── Label / Tag ───────────────────────────────────────────────────────────

  describe("tagLabel()", () => {
    it("貼標籤後 getNodeLabels 包含該標籤", () => {
      const { facade, factory } = createFacade();
      const file = new TextFile("i.txt", 1, new Date(), "UTF-8");
      const label = factory.getOrCreate("重要");

      facade.tagLabel(file, label);

      expect(facade.getNodeLabels(file).map((l) => l.id)).toContain(label.id);
    });

    it("tagLabel 後 canUndo = true", () => {
      const { facade, factory } = createFacade();
      const file = new TextFile("j.txt", 1, new Date(), "UTF-8");
      const label = factory.getOrCreate("重要");

      facade.tagLabel(file, label);

      expect(facade.canUndo).toBe(true);
    });

    it("tagLabel 後 undo() 還原（標籤消失）", () => {
      const { facade, factory } = createFacade();
      const file = new TextFile("k.txt", 1, new Date(), "UTF-8");
      const label = factory.getOrCreate("重要");

      facade.tagLabel(file, label);
      facade.undo();

      expect(facade.getNodeLabels(file)).toHaveLength(0);
    });
  });

  describe("removeLabel()", () => {
    it("移除標籤後 getNodeLabels 不含該標籤", () => {
      const { facade, factory } = createFacade();
      const file = new TextFile("l.txt", 1, new Date(), "UTF-8");
      const label = factory.getOrCreate("緊急");

      facade.tagLabel(file, label);
      facade.removeLabel(file, label);

      expect(facade.getNodeLabels(file)).toHaveLength(0);
    });

    it("removeLabel 後 canUndo = true", () => {
      const { facade, factory } = createFacade();
      const file = new TextFile("m.txt", 1, new Date(), "UTF-8");
      const label = factory.getOrCreate("緊急");

      facade.tagLabel(file, label);
      facade.removeLabel(file, label);

      expect(facade.canUndo).toBe(true);
    });
  });

  describe("createLabel()", () => {
    it("建立標籤後 getAllLabels 長度增加", () => {
      const { facade } = createFacade();
      const before = facade.getAllLabels().length;

      facade.createLabel("新標籤A");

      expect(facade.getAllLabels().length).toBe(before + 1);
    });

    it("傳入 node 時自動貼上標籤", () => {
      const { facade } = createFacade();
      const file = new TextFile("n.txt", 1, new Date(), "UTF-8");

      const label = facade.createLabel("自動", file);

      expect(facade.getNodeLabels(file).map((l) => l.id)).toContain(label.id);
    });

    it("傳入 node 建立標籤後 canUndo = true", () => {
      const { facade } = createFacade();
      const file = new TextFile("o.txt", 1, new Date(), "UTF-8");

      facade.createLabel("自動", file);

      expect(facade.canUndo).toBe(true);
    });

    it("不傳入 node 建立標籤後 canUndo = false（不進 undo 歷程）", () => {
      const { facade } = createFacade();

      facade.createLabel("純建立");

      expect(facade.canUndo).toBe(false);
    });

    it("相同名稱再次建立回傳同一 Label 實體（Flyweight）", () => {
      const { facade } = createFacade();

      const a = facade.createLabel("同名");
      const b = facade.createLabel("同名");

      expect(a).toBe(b);
    });
  });

  describe("getAllLabels() / getNodeLabels()", () => {
    it("getAllLabels 回傳 readonly Label[]", () => {
      const { facade } = createFacade();
      facade.createLabel("X");
      facade.createLabel("Y");

      const labels = facade.getAllLabels();
      expect(labels).toHaveLength(2);
    });

    it("getNodeLabels 回傳節點的標籤列表", () => {
      const { facade } = createFacade();
      const file = new TextFile("p.txt", 1, new Date(), "UTF-8");

      expect(facade.getNodeLabels(file)).toHaveLength(0);
    });
  });
});

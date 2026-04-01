/**
 * 整合測試：CommandInvoker + LabelTagCommand + TagMediator + LabelFactory
 *
 * 驗證端對端 Undo/Redo 鏈，確保新的標籤命令與現有 CommandInvoker 正確整合。
 */
import { describe, expect, it, beforeEach } from "vitest";
import { CommandInvoker } from "../../../src/services/CommandInvoker";
import { LabelTagCommand } from "../../../src/services/commands/LabelTagCommand";
import { RemoveLabelCommand } from "../../../src/services/commands/RemoveLabelCommand";
import { TagMediator } from "../../../src/services/TagMediator";
import { LabelFactory } from "../../../src/domain/labels/LabelFactory";
import { InMemoryTagRepository } from "../../../src/services/repositories/InMemoryTagRepository";
import { TextFile } from "../../../src/domain/TextFile";

const DATE = new Date("2026-04-01");

describe("Integration: CommandInvoker ↔ LabelTagCommand ↔ TagMediator", () => {
  let invoker: CommandInvoker;
  let factory: LabelFactory;
  let mediator: TagMediator;

  beforeEach(() => {
    invoker = new CommandInvoker();
    factory = new LabelFactory();
    mediator = new TagMediator(new InMemoryTagRepository(), factory);
  });

  describe("貼標籤的 Undo/Redo 鏈", () => {
    it("execute → undo → redo 完整流程", () => {
      const node = new TextFile("report.docx", 10, DATE, "UTF-8");
      const label = factory.getOrCreate("重要");
      const cmd = new LabelTagCommand(node, label, mediator);

      // execute
      invoker.execute(cmd);
      expect(mediator.getLabelsOf(node)).toContain(label);
      expect(invoker.canUndo).toBe(true);
      expect(invoker.canRedo).toBe(false);

      // undo
      invoker.undo();
      expect(mediator.getLabelsOf(node)).not.toContain(label);
      expect(invoker.canUndo).toBe(false);
      expect(invoker.canRedo).toBe(true);

      // redo
      invoker.redo();
      expect(mediator.getLabelsOf(node)).toContain(label);
      expect(invoker.canUndo).toBe(true);
      expect(invoker.canRedo).toBe(false);
    });

    it("undoDescription 正確反映命令描述", () => {
      const node = new TextFile("budget.xlsx", 20, DATE, "UTF-8");
      const label = factory.getOrCreate("待審核");
      invoker.execute(new LabelTagCommand(node, label, mediator));

      expect(invoker.undoDescription).toBe("貼標籤：待審核 → budget.xlsx");
    });
  });

  describe("RemoveLabelCommand 的 Undo/Redo 鏈", () => {
    it("remove → undo 還原標籤", () => {
      const node = new TextFile("note.txt", 5, DATE, "UTF-8");
      const label = factory.getOrCreate("草稿");
      mediator.attach(node, label);

      invoker.execute(new RemoveLabelCommand(node, label, mediator));
      expect(mediator.getLabelsOf(node)).not.toContain(label);

      invoker.undo();
      expect(mediator.getLabelsOf(node)).toContain(label);
    });
  });

  describe("多個標籤命令的 Undo 堆疊", () => {
    it("依序 undo 兩個貼標籤命令", () => {
      const node = new TextFile("plan.md", 8, DATE, "UTF-8");
      const labelA = factory.getOrCreate("重要");
      const labelB = factory.getOrCreate("Q2");

      invoker.execute(new LabelTagCommand(node, labelA, mediator));
      invoker.execute(new LabelTagCommand(node, labelB, mediator));
      expect(mediator.getLabelsOf(node)).toHaveLength(2);

      invoker.undo(); // undo Q2
      expect(mediator.getLabelsOf(node)).not.toContain(labelB);
      expect(mediator.getLabelsOf(node)).toContain(labelA);

      invoker.undo(); // undo 重要
      expect(mediator.getLabelsOf(node)).toHaveLength(0);
    });
  });

  describe("Flyweight 唯一性在整合場景的驗證", () => {
    it("相同標籤名稱在兩個不同節點上共享同一 Label 物件", () => {
      const nodeA = new TextFile("a.docx", 5, DATE, "UTF-8");
      const nodeB = new TextFile("b.docx", 5, DATE, "UTF-8");
      const label1 = factory.getOrCreate("重要");
      const label2 = factory.getOrCreate("重要");

      expect(label1).toBe(label2); // Flyweight: 相同實體

      invoker.execute(new LabelTagCommand(nodeA, label1, mediator));
      invoker.execute(new LabelTagCommand(nodeB, label2, mediator));

      // 兩個節點都有標籤，且是同一個 Label 物件
      expect(mediator.getLabelsOf(nodeA)[0]).toBe(
        mediator.getLabelsOf(nodeB)[0],
      );
    });
  });
});

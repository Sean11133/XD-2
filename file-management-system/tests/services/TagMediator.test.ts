import { describe, expect, it, beforeEach } from "vitest";
import { TagMediator } from "../../src/services/TagMediator";
import { LabelFactory } from "../../src/domain/labels/LabelFactory";
import { InMemoryTagRepository } from "../../src/services/repositories/InMemoryTagRepository";
import { TextFile } from "../../src/domain/TextFile";
import { Directory } from "../../src/domain/Directory";

const DATE = new Date("2026-04-01");

describe("TagMediator", () => {
  let factory: LabelFactory;
  let mediator: TagMediator;

  // 每次測試使用獨立實例，避免模組單例狀態污染
  beforeEach(() => {
    factory = new LabelFactory();
    mediator = new TagMediator(new InMemoryTagRepository(), factory);
  });

  describe("attach() + getLabelsOf()", () => {
    it("attach 後 getLabelsOf 包含該 label", () => {
      const node = new TextFile("report.docx", 10, DATE, "UTF-8");
      const label = factory.getOrCreate("重要");
      mediator.attach(node, label);

      const labels = mediator.getLabelsOf(node);
      expect(labels).toContain(label);
    });

    it("重複 attach 相同 label（idempotent）— 清單不重複", () => {
      const node = new TextFile("report.docx", 10, DATE, "UTF-8");
      const label = factory.getOrCreate("重要");
      mediator.attach(node, label);
      mediator.attach(node, label);

      expect(mediator.getLabelsOf(node)).toHaveLength(1);
    });

    it("getLabelsOf — 未 attach 的節點回傳空陣列", () => {
      const node = new TextFile("empty.txt", 5, DATE, "UTF-8");
      expect(mediator.getLabelsOf(node)).toHaveLength(0);
    });
  });

  describe("detach() + getLabelsOf()", () => {
    it("detach 後 getLabelsOf 不再包含該 label", () => {
      const node = new TextFile("report.docx", 10, DATE, "UTF-8");
      const label = factory.getOrCreate("重要");
      mediator.attach(node, label);
      mediator.detach(node, label);

      expect(mediator.getLabelsOf(node)).not.toContain(label);
    });
  });

  describe("getNodesOf()", () => {
    it("回傳所有掛有該 label 的節點", () => {
      const nodeA = new TextFile("a.txt", 5, DATE, "UTF-8");
      const nodeB = new Directory("docs");
      const label = factory.getOrCreate("重要");
      mediator.attach(nodeA, label);
      mediator.attach(nodeB, label);

      const nodes = mediator.getNodesOf(label, [nodeA, nodeB]);
      expect(nodes).toContain(nodeA);
      expect(nodes).toContain(nodeB);
    });

    it("getNodesOf — 無節點的標籤回傳空陣列", () => {
      const label = factory.getOrCreate("孤立標籤");
      expect(mediator.getNodesOf(label, [])).toHaveLength(0);
    });
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryTagRepository } from "../../../src/services/repositories/InMemoryTagRepository";

describe("InMemoryTagRepository", () => {
  let repo: InMemoryTagRepository;

  beforeEach(() => {
    repo = new InMemoryTagRepository();
  });

  describe("attach()", () => {
    it("attach 後 getLabelIdsByNode 包含 labelId", () => {
      repo.attach("node-A", "label-1");
      expect(repo.getLabelIdsByNode("node-A").has("label-1")).toBe(true);
    });

    it("attach 後 getNodeIdsByLabel 包含 nodeId", () => {
      repo.attach("node-A", "label-1");
      expect(repo.getNodeIdsByLabel("label-1").has("node-A")).toBe(true);
    });

    it("重複 attach 相同組合（idempotent）— Set 大小不增加", () => {
      repo.attach("node-A", "label-1");
      repo.attach("node-A", "label-1");
      expect(repo.getLabelIdsByNode("node-A").size).toBe(1);
      expect(repo.getNodeIdsByLabel("label-1").size).toBe(1);
    });
  });

  describe("detach()", () => {
    it("detach 後 getLabelIdsByNode 不再包含 labelId", () => {
      repo.attach("node-A", "label-1");
      repo.detach("node-A", "label-1");
      expect(repo.getLabelIdsByNode("node-A").has("label-1")).toBe(false);
    });

    it("detach 後 getNodeIdsByLabel 不再包含 nodeId", () => {
      repo.attach("node-A", "label-1");
      repo.detach("node-A", "label-1");
      expect(repo.getNodeIdsByLabel("label-1").has("node-A")).toBe(false);
    });

    it("detach 不存在的關係 — 不拋出錯誤", () => {
      expect(() => repo.detach("no-such-node", "no-such-label")).not.toThrow();
    });
  });

  describe("查詢空結果", () => {
    it("getLabelIdsByNode — 無關係的節點回傳空 Set", () => {
      expect(repo.getLabelIdsByNode("node-X").size).toBe(0);
    });

    it("getNodeIdsByLabel — 無關係的標籤回傳空 Set", () => {
      expect(repo.getNodeIdsByLabel("label-X").size).toBe(0);
    });
  });

  describe("多對多關係", () => {
    it("1 個節點掛 3 個標籤", () => {
      repo.attach("node-A", "label-1");
      repo.attach("node-A", "label-2");
      repo.attach("node-A", "label-3");
      expect(repo.getLabelIdsByNode("node-A").size).toBe(3);
    });

    it("1 個標籤掛在 2 個節點", () => {
      repo.attach("node-A", "label-1");
      repo.attach("node-B", "label-1");
      expect(repo.getNodeIdsByLabel("label-1").size).toBe(2);
    });
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { RemoveLabelCommand } from "../../../src/services/commands/RemoveLabelCommand";
import { TagMediator } from "../../../src/services/TagMediator";
import { LabelFactory } from "../../../src/domain/labels/LabelFactory";
import { InMemoryTagRepository } from "../../../src/services/repositories/InMemoryTagRepository";
import { TextFile } from "../../../src/domain/TextFile";

const DATE = new Date("2026-04-01");

describe("RemoveLabelCommand", () => {
  let factory: LabelFactory;
  let mediator: TagMediator;

  beforeEach(() => {
    factory = new LabelFactory();
    mediator = new TagMediator(new InMemoryTagRepository(), factory);
  });

  it("execute() — label 被移除，getLabelsOf 不含 label", () => {
    const node = new TextFile("report.docx", 10, DATE, "UTF-8");
    const label = factory.getOrCreate("重要");

    // 先貼上標籤
    mediator.attach(node, label);
    expect(mediator.getLabelsOf(node)).toContain(label);

    const cmd = new RemoveLabelCommand(node, label, mediator);
    cmd.execute();

    expect(mediator.getLabelsOf(node)).not.toContain(label);
  });

  it("undo() — execute 後 undo，label 重新出現", () => {
    const node = new TextFile("report.docx", 10, DATE, "UTF-8");
    const label = factory.getOrCreate("重要");
    mediator.attach(node, label);

    const cmd = new RemoveLabelCommand(node, label, mediator);
    cmd.execute();
    cmd.undo();

    expect(mediator.getLabelsOf(node)).toContain(label);
  });

  it("description 格式正確", () => {
    const node = new TextFile("report.docx", 10, DATE, "UTF-8");
    const label = factory.getOrCreate("重要");
    const cmd = new RemoveLabelCommand(node, label, mediator);

    expect(cmd.description).toBe("移除標籤：重要 ← report.docx");
  });
});

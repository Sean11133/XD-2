import { describe, expect, it, beforeEach } from "vitest";
import { LabelTagCommand } from "../../../src/services/commands/LabelTagCommand";
import { TagMediator } from "../../../src/services/TagMediator";
import { LabelFactory } from "../../../src/domain/labels/LabelFactory";
import { InMemoryTagRepository } from "../../../src/services/repositories/InMemoryTagRepository";
import { TextFile } from "../../../src/domain/TextFile";

const DATE = new Date("2026-04-01");

describe("LabelTagCommand", () => {
  let factory: LabelFactory;
  let mediator: TagMediator;

  beforeEach(() => {
    factory = new LabelFactory();
    mediator = new TagMediator(new InMemoryTagRepository(), factory);
  });

  it("execute() — getLabelsOf 包含 label", () => {
    const node = new TextFile("report.docx", 10, DATE, "UTF-8");
    const label = factory.getOrCreate("重要");
    const cmd = new LabelTagCommand(node, label, mediator);

    cmd.execute();

    expect(mediator.getLabelsOf(node)).toContain(label);
  });

  it("undo() — execute 後 undo，label 被移除", () => {
    const node = new TextFile("report.docx", 10, DATE, "UTF-8");
    const label = factory.getOrCreate("重要");
    const cmd = new LabelTagCommand(node, label, mediator);

    cmd.execute();
    cmd.undo();

    expect(mediator.getLabelsOf(node)).not.toContain(label);
  });

  it("undo 後 execute（redo）— label 重新出現", () => {
    const node = new TextFile("report.docx", 10, DATE, "UTF-8");
    const label = factory.getOrCreate("重要");
    const cmd = new LabelTagCommand(node, label, mediator);

    cmd.execute();
    cmd.undo();
    cmd.execute(); // redo

    expect(mediator.getLabelsOf(node)).toContain(label);
  });

  it("description 格式正確", () => {
    const node = new TextFile("report.docx", 10, DATE, "UTF-8");
    const label = factory.getOrCreate("重要");
    const cmd = new LabelTagCommand(node, label, mediator);

    expect(cmd.description).toBe("貼標籤：重要 → report.docx");
  });
});

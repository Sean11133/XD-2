import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandInvoker } from "../../src/services/CommandInvoker";
import type { ICommand } from "../../src/domain/commands/ICommand";

function makeCmd(description = "cmd"): ICommand & {
  executeCalls: number;
  undoCalls: number;
} {
  const cmd = {
    description,
    executeCalls: 0,
    undoCalls: 0,
    execute() {
      this.executeCalls++;
    },
    undo() {
      this.undoCalls++;
    },
  };
  return cmd;
}

describe("CommandInvoker", () => {
  let invoker: CommandInvoker;

  beforeEach(() => {
    invoker = new CommandInvoker();
  });

  it("execute() 呼叫 cmd.execute()", () => {
    const cmd = makeCmd();
    invoker.execute(cmd);
    expect(cmd.executeCalls).toBe(1);
  });

  it("execute() 後 canUndo = true，canRedo = false", () => {
    invoker.execute(makeCmd());
    expect(invoker.canUndo).toBe(true);
    expect(invoker.canRedo).toBe(false);
  });

  it("execute(cmd, false) 不加入歷史，canUndo 保持 false", () => {
    invoker.execute(makeCmd(), false);
    expect(invoker.canUndo).toBe(false);
  });

  it("undo() 呼叫 cmd.undo()，canRedo = true，canUndo 減少", () => {
    const cmd = makeCmd();
    invoker.execute(cmd);
    invoker.undo();
    expect(cmd.undoCalls).toBe(1);
    expect(invoker.canRedo).toBe(true);
    expect(invoker.canUndo).toBe(false);
  });

  it("redo() 呼叫 cmd.execute()，canUndo = true", () => {
    const cmd = makeCmd();
    invoker.execute(cmd);
    invoker.undo();
    invoker.redo();
    expect(cmd.executeCalls).toBe(2); // execute + redo
    expect(invoker.canUndo).toBe(true);
  });

  it("執行新命令後 canRedo = false（Redo 堆疊清空）", () => {
    invoker.execute(makeCmd());
    invoker.undo();
    expect(invoker.canRedo).toBe(true);
    invoker.execute(makeCmd());
    expect(invoker.canRedo).toBe(false);
  });

  it("空堆疊時 undo() 不拋出例外", () => {
    expect(() => invoker.undo()).not.toThrow();
  });

  it("空堆疊時 redo() 不拋出例外", () => {
    expect(() => invoker.redo()).not.toThrow();
  });

  it("undoDescription 回傳即將被 undo 的命令描述", () => {
    const cmd = { description: "刪除", execute: () => {}, undo: () => {} };
    invoker.execute(cmd);
    expect(invoker.undoDescription).toBe("刪除");
  });

  it("undoDescription 在 canUndo=false 時回傳 null", () => {
    expect(invoker.undoDescription).toBeNull();
  });

  it("redoDescription 回傳即將被 redo 的命令描述", () => {
    const cmd = { description: "排序", execute: () => {}, undo: () => {} };
    invoker.execute(cmd);
    invoker.undo();
    expect(invoker.redoDescription).toBe("排序");
  });

  it("redoDescription 在 canRedo=false 時回傳 null", () => {
    expect(invoker.redoDescription).toBeNull();
  });

  it("多層 undo/redo 順序正確", () => {
    const spy = vi.fn();
    const cmd1 = {
      description: "1",
      execute: () => spy("exec1"),
      undo: () => spy("undo1"),
    };
    const cmd2 = {
      description: "2",
      execute: () => spy("exec2"),
      undo: () => spy("undo2"),
    };
    invoker.execute(cmd1);
    invoker.execute(cmd2);
    invoker.undo(); // undo cmd2
    invoker.undo(); // undo cmd1
    expect(spy.mock.calls.map((c) => c[0])).toEqual([
      "exec1",
      "exec2",
      "undo2",
      "undo1",
    ]);
  });
});

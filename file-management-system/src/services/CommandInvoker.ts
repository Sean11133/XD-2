import type { ICommand } from "../domain/commands/ICommand";

/**
 * CommandInvoker — Command Pattern 執行器
 * 管理無限層 undoStack / redoStack，支援 Undo / Redo 操作。
 * execute(cmd, addToHistory=false) 用於 CopyCommand（不加入歷史記錄）。
 */
export class CommandInvoker {
  private readonly _undoStack: ICommand[] = [];
  private readonly _redoStack: ICommand[] = [];

  execute(cmd: ICommand, addToHistory = true): void {
    cmd.execute();
    if (addToHistory) {
      this._undoStack.push(cmd);
      this._redoStack.splice(0); // 執行新命令清空 Redo 堆疊
    }
  }

  undo(): void {
    const cmd = this._undoStack.pop();
    if (cmd) {
      cmd.undo();
      this._redoStack.push(cmd);
    }
  }

  redo(): void {
    const cmd = this._redoStack.pop();
    if (cmd) {
      cmd.execute();
      this._undoStack.push(cmd);
    }
  }

  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  /** 即將被 undo 的命令描述（不彈出堆疊），canUndo=false 時回傳 null */
  get undoDescription(): string | null {
    return this._undoStack.length > 0
      ? this._undoStack[this._undoStack.length - 1].description
      : null;
  }

  /** 即將被 redo 的命令描述（不彈出堆疊），canRedo=false 時回傳 null */
  get redoDescription(): string | null {
    return this._redoStack.length > 0
      ? this._redoStack[this._redoStack.length - 1].description
      : null;
  }
}

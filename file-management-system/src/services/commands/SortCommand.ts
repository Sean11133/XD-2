import type { ICommand } from "../../domain/commands/ICommand";
import type { Directory } from "../../domain/Directory";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { ISortStrategy } from "../../domain/strategies/ISortStrategy";

/**
 * SortCommand — 依指定 Strategy 排序目標目錄的 children。
 * _originalOrder 由呼叫端（App.tsx）在建構時傳入快照，確保 undo 還原正確。
 */
export class SortCommand implements ICommand {
  readonly description = "排序";

  constructor(
    private readonly _targetDir: Directory,
    private readonly _strategy: ISortStrategy,
    private readonly _originalOrder: FileSystemNode[],
  ) {}

  execute(): void {
    this._targetDir.replaceChildren(
      this._strategy.sort([...this._targetDir.getChildren()]),
    );
  }

  undo(): void {
    this._targetDir.replaceChildren(this._originalOrder);
  }
}

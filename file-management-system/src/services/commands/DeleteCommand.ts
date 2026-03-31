import type { ICommand } from "../../domain/commands/ICommand";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { Directory } from "../../domain/Directory";

/**
 * DeleteCommand — 從父目錄移除節點，記錄原始索引以供 Undo 還原。
 */
export class DeleteCommand implements ICommand {
  readonly description = "刪除";
  private _originalIndex = -1;

  constructor(
    private readonly _node: FileSystemNode,
    private readonly _parentDir: Directory,
  ) {}

  execute(): void {
    this._originalIndex = this._parentDir.removeChild(this._node);
  }

  undo(): void {
    if (this._originalIndex !== -1) {
      this._parentDir.insertChildAt(this._originalIndex, this._node);
    }
  }
}

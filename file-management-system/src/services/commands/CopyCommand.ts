import type { ICommand } from "../../domain/commands/ICommand";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { Clipboard } from "../../domain/Clipboard";

/**
 * CopyCommand — 將節點存入 Clipboard。
 * undo() 為 no-op；呼叫端透過 addToHistory=false 確保不進 Undo 堆疊。
 */
export class CopyCommand implements ICommand {
  readonly description = "複製";

  constructor(
    private readonly _node: FileSystemNode,
    private readonly _clipboard: Clipboard,
  ) {}

  execute(): void {
    this._clipboard.setNode(this._node);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  undo(): void {
    /* no-op：複製操作不加入 Undo 堆疊 */
  }
}

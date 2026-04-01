import type { ICommand } from "../../domain/commands/ICommand";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { Label } from "../../domain/labels/Label";
import type { TagMediator } from "../TagMediator";

/**
 * LabelTagCommand — 貼標籤命令（Command Pattern）
 *
 * execute()：attach label → node
 * undo()   ：detach label ← node（完全可逆）
 */
export class LabelTagCommand implements ICommand {
  readonly description: string;

  constructor(
    private readonly _node: FileSystemNode,
    private readonly _label: Label,
    private readonly _mediator: TagMediator,
  ) {
    this.description = `貼標籤：${_label.name} → ${_node.name}`;
  }

  execute(): void {
    this._mediator.attach(this._node, this._label);
  }

  undo(): void {
    this._mediator.detach(this._node, this._label);
  }
}

import type { ICommand } from "../../domain/commands/ICommand";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { Label } from "../../domain/labels/Label";
import type { TagMediator } from "../TagMediator";

/**
 * RemoveLabelCommand — 移除標籤命令（Command Pattern）
 *
 * 與 LabelTagCommand 鏡像設計（ADR-004）：
 * execute()：detach label ← node
 * undo()   ：attach label → node（完全可逆）
 */
export class RemoveLabelCommand implements ICommand {
  readonly description: string;

  constructor(
    private readonly _node: FileSystemNode,
    private readonly _label: Label,
    private readonly _mediator: TagMediator,
  ) {
    this.description = `移除標籤：${_label.name} ← ${_node.name}`;
  }

  execute(): void {
    this._mediator.detach(this._node, this._label);
  }

  undo(): void {
    this._mediator.attach(this._node, this._label);
  }
}

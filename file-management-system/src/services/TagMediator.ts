import type { FileSystemNode } from "../domain/FileSystemNode";
import type { Label } from "../domain/labels/Label";
import type { ITagRepository } from "../domain/labels/ITagRepository";
import { LabelFactory, labelFactory } from "../domain/labels/LabelFactory";
import { InMemoryTagRepository } from "./repositories/InMemoryTagRepository";

/**
 * TagMediator — Mediator Pattern（ADR 設計）
 *
 * 集中管理 Label ↔ FileSystemNode 多對多互動。
 * 依賴注入 ITagRepository（DIP），預設使用 InMemoryTagRepository。
 * 未來後端就緒時，僅需替換 _repo 實作，不改動 Mediator 本身。
 */
export class TagMediator {
  constructor(
    private readonly _repo: ITagRepository = new InMemoryTagRepository(),
    private readonly _factory: LabelFactory = labelFactory,
  ) {}

  /** 建立 node ↔ label 關係（idempotent） */
  attach(node: FileSystemNode, label: Label): void {
    this._repo.attach(node.name, label.id);
  }

  /** 移除 node ↔ label 關係（不存在時靜默忽略） */
  detach(node: FileSystemNode, label: Label): void {
    this._repo.detach(node.name, label.id);
  }

  /** 取得節點身上所有 Label（依 createdAt 排序）*/
  getLabelsOf(node: FileSystemNode): Label[] {
    const labelIds = this._repo.getLabelIdsByNode(node.name);
    return this._factory.getAll().filter((l) => labelIds.has(l.id));
  }

  /** 取得掛有指定 Label 的所有節點 */
  getNodesOf(label: Label, allNodes: FileSystemNode[]): FileSystemNode[] {
    const nodeIds = this._repo.getNodeIdsByLabel(label.id);
    return allNodes.filter((n) => nodeIds.has(n.name));
  }
}

/** 模組層級單例（測試時建立獨立實例以避免狀態污染）*/
export const tagMediator = new TagMediator();

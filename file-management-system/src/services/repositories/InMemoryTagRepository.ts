import type { ITagRepository } from "../../domain/labels/ITagRepository";

/**
 * InMemoryTagRepository — ITagRepository 的 in-memory 實作（Infrastructure Layer）。
 *
 * 維護兩張雙向索引表：
 *   _nodeToLabels: Map<nodeId, Set<labelId>>
 *   _labelToNodes: Map<labelId, Set<nodeId>>
 *
 * attach() 為 idempotent：重複呼叫相同組合不會新增重複記錄。
 */
export class InMemoryTagRepository implements ITagRepository {
  private readonly _nodeToLabels = new Map<string, Set<string>>();
  private readonly _labelToNodes = new Map<string, Set<string>>();

  attach(nodeId: string, labelId: string): void {
    if (!this._nodeToLabels.has(nodeId))
      this._nodeToLabels.set(nodeId, new Set());
    if (!this._labelToNodes.has(labelId))
      this._labelToNodes.set(labelId, new Set());
    this._nodeToLabels.get(nodeId)!.add(labelId);
    this._labelToNodes.get(labelId)!.add(nodeId);
  }

  detach(nodeId: string, labelId: string): void {
    this._nodeToLabels.get(nodeId)?.delete(labelId);
    this._labelToNodes.get(labelId)?.delete(nodeId);
  }

  getLabelIdsByNode(nodeId: string): ReadonlySet<string> {
    return this._nodeToLabels.get(nodeId) ?? new Set();
  }

  getNodeIdsByLabel(labelId: string): ReadonlySet<string> {
    return this._labelToNodes.get(labelId) ?? new Set();
  }
}

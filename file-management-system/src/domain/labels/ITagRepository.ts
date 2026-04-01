/** ITagRepository — Domain Port（DIP 預留點）。
 *  集中管理 Label ↔ FileSystemNode 多對多關係的儲存抽象。
 *  in-memory 實作為 InMemoryTagRepository；後端整合時替換為 HttpTagRepository。
 */
export interface ITagRepository {
  attach(nodeId: string, labelId: string): void;
  detach(nodeId: string, labelId: string): void;
  getLabelIdsByNode(nodeId: string): ReadonlySet<string>;
  getNodeIdsByLabel(labelId: string): ReadonlySet<string>;
}

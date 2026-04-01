import type { FileSystemNode } from "../domain/FileSystemNode";
import type { Directory } from "../domain/Directory";
import type { ISortStrategy } from "../domain/strategies/ISortStrategy";
import type { Label } from "../domain/labels/Label";
import { Clipboard } from "../domain/Clipboard";
import { CommandInvoker } from "./CommandInvoker";
import { CopyCommand } from "./commands/CopyCommand";
import { PasteCommand } from "./commands/PasteCommand";
import { DeleteCommand } from "./commands/DeleteCommand";
import { SortCommand } from "./commands/SortCommand";
import { LabelTagCommand } from "./commands/LabelTagCommand";
import { RemoveLabelCommand } from "./commands/RemoveLabelCommand";
import { TagMediator, tagMediator } from "./TagMediator";
import { LabelFactory, labelFactory } from "../domain/labels/LabelFactory";

/** paste() 回傳型別，供呼叫端記錄 log 訊息時使用 */
export type PasteResult = {
  pastedName: string;
  renamed: boolean;
};

/**
 * FileSystemFacade — Facade Pattern（ADR-001 / ADR-002）
 *
 * 統一封裝檔案 CRUD 命令、Undo/Redo 操作、與標籤管理，
 * 使 Presentation Layer（App.tsx）不需直接依賴任何 Command / Invoker /
 * Clipboard / TagMediator / LabelFactory 等模式類別。
 *
 * 設計原則：
 * - SRP：所有「協作子系統的指揮邏輯」集中於此一處
 * - DIP：建構子注入，所有依賴均可由外部覆寫（方便測試 mock）
 * - OCP：新增操作只需新增方法，不需修改呼叫端
 */
export class FileSystemFacade {
  constructor(
    private readonly _invoker: CommandInvoker = new CommandInvoker(),
    private readonly _clipboard: Clipboard = Clipboard.getInstance(),
    private readonly _mediator: TagMediator = tagMediator,
    private readonly _factory: LabelFactory = labelFactory,
  ) {}

  // ── File CRUD ─────────────────────────────────────────────────────────────

  /**
   * 複製節點至剪貼簿（不加入 Undo 歷程，與 CopyCommand 設計一致）。
   */
  copy(node: FileSystemNode): void {
    this._invoker.execute(new CopyCommand(node, this._clipboard), false);
  }

  /**
   * 貼上剪貼簿中的節點至目標目錄。
   * 若目標目錄已有同名節點，自動產生唯一別名。
   * @returns PasteResult — 實際貼上的節點名稱與是否重新命名
   */
  paste(targetDir: Directory): PasteResult {
    const sourceName = this._clipboard.getNode()?.name ?? "";
    const cmd = new PasteCommand(this._clipboard, targetDir);
    this._invoker.execute(cmd);
    const pastedName = cmd.pastedNodeName ?? sourceName;
    return { pastedName, renamed: pastedName !== sourceName };
  }

  /**
   * 從父目錄刪除節點（可 Undo 還原至原始位置）。
   */
  delete(node: FileSystemNode, parent: Directory): void {
    this._invoker.execute(new DeleteCommand(node, parent));
  }

  /**
   * 依指定策略排序目錄（先快照 children 以便 Undo 還原）。
   */
  sort(dir: Directory, strategy: ISortStrategy): void {
    const snapshot = [...dir.getChildren()];
    this._invoker.execute(new SortCommand(dir, strategy, snapshot));
  }

  // ── Undo / Redo ──────────────────────────────────────────────────────────

  undo(): void {
    this._invoker.undo();
  }

  redo(): void {
    this._invoker.redo();
  }

  get canUndo(): boolean {
    return this._invoker.canUndo;
  }

  get canRedo(): boolean {
    return this._invoker.canRedo;
  }

  /** 即將被 undo 的命令描述；無歷程時回傳 undefined（CommandInvoker 回傳 null，此處轉換） */
  get undoDescription(): string | undefined {
    return this._invoker.undoDescription ?? undefined;
  }

  /** 即將被 redo 的命令描述；無歷程時回傳 undefined */
  get redoDescription(): string | undefined {
    return this._invoker.redoDescription ?? undefined;
  }

  /**
   * 判斷目前是否可以執行貼上操作。
   * 條件：剪貼簿有節點 AND selectedNode 為 Directory。
   */
  canPaste(selectedNode: FileSystemNode | null): boolean {
    return (
      this._clipboard.hasNode() &&
      selectedNode !== null &&
      selectedNode.isDirectory()
    );
  }

  // ── Label / Tag ───────────────────────────────────────────────────────────

  /**
   * 貼標籤至節點（透過 LabelTagCommand，支援 Undo）。
   */
  tagLabel(node: FileSystemNode, label: Label): void {
    this._invoker.execute(new LabelTagCommand(node, label, this._mediator));
  }

  /**
   * 從節點移除標籤（透過 RemoveLabelCommand，支援 Undo）。
   */
  removeLabel(node: FileSystemNode, label: Label): void {
    this._invoker.execute(new RemoveLabelCommand(node, label, this._mediator));
  }

  /**
   * 建立或取得標籤（Flyweight Pool）。
   * 若傳入 node，自動執行一次 tagLabel（進入 Undo 歷程）。
   * @returns 建立或取得的 Label 實體
   */
  createLabel(name: string, node?: FileSystemNode): Label {
    const label = this._factory.getOrCreate(name);
    if (node) {
      this.tagLabel(node, label);
    }
    return label;
  }

  /**
   * 取得節點身上所有標籤（依 createdAt 排序）。
   */
  getNodeLabels(node: FileSystemNode): Label[] {
    return this._mediator.getLabelsOf(node);
  }

  /**
   * 取得所有已建立的標籤（依 createdAt 排序）。
   */
  getAllLabels(): readonly Label[] {
    return this._factory.getAll();
  }
}

/** 模組層級單例（App 以 useMemo 持有，此處供跨頁或測試環境使用）*/
export const fileSystemFacade = new FileSystemFacade();

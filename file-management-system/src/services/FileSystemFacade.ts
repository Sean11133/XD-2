import type { FileSystemNode } from "../domain/FileSystemNode";
import { Directory } from "../domain/Directory";
import { TextFile } from "../domain/TextFile";
import { WordDocument } from "../domain/WordDocument";
import { ImageFile } from "../domain/ImageFile";
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
import { ApiError } from "./ApiError";

// ── API Response Types (match backend Pydantic schemas) ───────────────────────

export interface ApiTreeNode {
  id: string;
  type: "directory" | "text_file" | "word_document" | "image_file";
  name: string;
  size_kb: number | null;
  created_at: string | null;
  children: ApiTreeNode[];
}

export interface ApiNodeResponse {
  id: string;
  type: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  size_kb: number | null;
  created_at: string | null;
}

export interface ApiCopyResult {
  id: string;
  name: string;
  renamed: boolean;
}

export interface ApiLabel {
  id: string;
  name: string;
  color: string;
  description: string;
  created_at: string;
}

// ── Adapter helpers ────────────────────────────────────────────────────────────

function buildDomainNode(apiNode: ApiTreeNode): FileSystemNode {
  const sizeKB = apiNode.size_kb ?? 0;
  const createdAt = apiNode.created_at
    ? new Date(apiNode.created_at)
    : new Date();

  switch (apiNode.type) {
    case "directory": {
      const dir = new Directory(apiNode.name);
      for (const child of apiNode.children) {
        dir.addChild(buildDomainNode(child));
      }
      return dir;
    }
    case "word_document":
      return new WordDocument(apiNode.name, sizeKB, createdAt, 0);
    case "image_file":
      return new ImageFile(apiNode.name, sizeKB, createdAt, 0, 0);
    default:
      return new TextFile(apiNode.name, sizeKB, createdAt, "UTF-8");
  }
}

function fillIdMap(
  apiNode: ApiTreeNode,
  domainNode: FileSystemNode,
  idMap: Map<FileSystemNode, string>,
): void {
  idMap.set(domainNode, apiNode.id);
  if (apiNode.type === "directory" && domainNode instanceof Directory) {
    const children = domainNode.getChildren();
    apiNode.children.forEach((child, i) => {
      if (children[i]) fillIdMap(child, children[i], idMap);
    });
  }
}

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
  private readonly _apiBaseUrl: string;

  constructor(
    private readonly _invoker: CommandInvoker = new CommandInvoker(),
    private readonly _clipboard: Clipboard = Clipboard.getInstance(),
    private readonly _mediator: TagMediator = tagMediator,
    private readonly _factory: LabelFactory = labelFactory,
    apiBaseUrl: string = "http://localhost:8000",
  ) {
    this._apiBaseUrl = apiBaseUrl;
  }

  // ── Private API helper ────────────────────────────────────────────────────

  private async _apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    let resp: Response;
    try {
      resp = await fetch(`${this._apiBaseUrl}${path}`, options);
    } catch {
      throw new ApiError(
        "無法連線至後端伺服器，請確認後端已啟動",
        0,
        "NETWORK_ERROR",
      );
    }
    if (!resp.ok) {
      let code = "API_ERROR";
      try {
        const body = (await resp.json()) as { code?: string };
        code = body.code ?? code;
      } catch {
        /* ignore */
      }
      throw new ApiError(`API 請求失敗（${resp.status}）`, resp.status, code);
    }
    if (resp.status === 204) return undefined as unknown as T;
    return resp.json() as Promise<T>;
  }

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

  // ── Backend API methods ───────────────────────────────────────────────────
  // 這些方法呼叫後端 REST API，提供資料持久化能力。
  // Undo/Redo 仍由上方的 CommandInvoker 在前端記憶體管理（不呼叫後端）。

  /**
   * 從後端載入完整檔案樹。
   * 回傳虛擬根目錄（名稱 "根目錄"）以及 node→API UUID 的映射表。
   */
  async loadTree(): Promise<{
    root: Directory;
    idMap: Map<FileSystemNode, string>;
  }> {
    const apiNodes = await this._apiFetch<ApiTreeNode[]>("/api/nodes/tree");
    const root = new Directory("根目錄");
    const idMap = new Map<FileSystemNode, string>();
    for (const apiNode of apiNodes) {
      const node = buildDomainNode(apiNode);
      root.addChild(node);
      fillIdMap(apiNode, node, idMap);
    }
    return { root, idMap };
  }

  /**
   * 在後端刪除節點（Cascade 刪除所有子節點）。
   * @param nodeId - 後端 UUID
   */
  async deleteNodeOnServer(nodeId: string): Promise<void> {
    await this._apiFetch<void>(`/api/nodes/${nodeId}`, { method: "DELETE" });
  }

  /**
   * 在後端深複製節點至目標目錄。
   * @returns 複製後的節點 id 與名稱（名稱衝突時後端自動加 _copy 後綴）
   */
  async copyNodeOnServer(
    sourceId: string,
    targetDirId: string,
  ): Promise<ApiCopyResult> {
    return this._apiFetch<ApiCopyResult>(
      `/api/nodes/${sourceId}/copy?target_dir_id=${encodeURIComponent(targetDirId)}`,
      { method: "POST" },
    );
  }

  /**
   * 在後端重排目錄子節點。
   * @param dirId  目錄 UUID
   * @param strategy  排序策略鍵（name_asc / name_desc / size_asc / size_desc）
   */
  async sortChildrenOnServer(dirId: string, strategy: string): Promise<void> {
    await this._apiFetch<ApiNodeResponse[]>(`/api/nodes/${dirId}/sort`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy }),
    });
  }

  /**
   * 從後端取得所有標籤。
   */
  async getAllLabelsFromServer(): Promise<ApiLabel[]> {
    return this._apiFetch<ApiLabel[]>("/api/labels");
  }

  /**
   * 在後端建立標籤（Flyweight：同名返回既有標籤，status 200）。
   */
  async createLabelOnServer(
    name: string,
    color: string,
    description = "",
  ): Promise<ApiLabel> {
    return this._apiFetch<ApiLabel>("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, description }),
    });
  }

  /**
   * 在後端刪除標籤（同步移除所有節點關聯）。
   */
  async deleteLabelOnServer(labelId: string): Promise<void> {
    await this._apiFetch<void>(`/api/labels/${labelId}`, { method: "DELETE" });
  }

  /**
   * 在後端為節點貼標籤（冪等）。
   */
  async tagNodeOnServer(nodeId: string, labelId: string): Promise<void> {
    await this._apiFetch<void>(`/api/nodes/${nodeId}/labels/${labelId}`, {
      method: "POST",
    });
  }

  /**
   * 在後端移除節點標籤。
   */
  async untagNodeOnServer(nodeId: string, labelId: string): Promise<void> {
    await this._apiFetch<void>(`/api/nodes/${nodeId}/labels/${labelId}`, {
      method: "DELETE",
    });
  }

  /**
   * 從後端取得節點的所有標籤。
   */
  async getNodeLabelsFromServer(nodeId: string): Promise<ApiLabel[]> {
    return this._apiFetch<ApiLabel[]>(`/api/nodes/${nodeId}/labels`);
  }
}

/** 模組層級單例（App 以 useMemo 持有，此處供跨頁或測試環境使用）*/
export const fileSystemFacade = new FileSystemFacade();

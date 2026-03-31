import type { ICommand } from "../../domain/commands/ICommand";
import type { Clipboard } from "../../domain/Clipboard";
import type { Directory } from "../../domain/Directory";
import type { FileSystemNode } from "../../domain/FileSystemNode";

/**
 * 在 existingNames 中生成不衝突的唯一名稱。
 * 命名規則：
 *   config.txt → config (複製).txt → config (複製 2).txt → ...
 *   docs       → docs (複製)       → docs (複製 2)       → ...
 */
function generateUniqueName(
  baseName: string,
  existingNames: ReadonlySet<string>,
): string {
  if (!existingNames.has(baseName)) return baseName;

  const dotIdx = baseName.lastIndexOf(".");
  const hasExt = dotIdx > 0;
  const stem = hasExt ? baseName.slice(0, dotIdx) : baseName;
  const ext = hasExt ? baseName.slice(dotIdx) : "";

  const first = `${stem} (複製)${ext}`;
  if (!existingNames.has(first)) return first;

  for (let i = 2; ; i++) {
    const candidate = `${stem} (複製 ${i})${ext}`;
    if (!existingNames.has(candidate)) return candidate;
  }
}

/**
 * PasteCommand — 從 Clipboard 取出節點 clone 後貼入目標目錄。
 * 若目標目錄已有同名節點，自動產生唯一別名（加「複製」後綴）。
 * 記錄實際貼上的 clone 結果（_pastedNode）供 undo() 精確移除。
 */
export class PasteCommand implements ICommand {
  readonly description = "貼上";
  private _pastedNode: FileSystemNode | null = null;

  constructor(
    private readonly _clipboard: Clipboard,
    private readonly _targetDir: Directory,
  ) {}

  execute(): void {
    const source = this._clipboard.getNode();
    if (!source) throw new Error("Clipboard is empty");

    const existingNames = new Set(
      this._targetDir.getChildren().map((c) => c.name),
    );
    const uniqueName = generateUniqueName(source.name, existingNames);
    this._pastedNode = source.clone(uniqueName);
    this._targetDir.addChild(this._pastedNode);
  }

  undo(): void {
    if (this._pastedNode) {
      this._targetDir.removeChild(this._pastedNode);
      this._pastedNode = null;
    }
  }

  /** 取得貼上後節點的名稱（execute 後可用；未執行時回傳 null） */
  get pastedNodeName(): string | null {
    return this._pastedNode?.name ?? null;
  }
}

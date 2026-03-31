import { useCallback, useMemo, useRef, useState } from "react";
import { buildSampleTree } from "./data/sampleData";
import { FileTreeView } from "./components/FileTreeView";
import { DashboardPanel } from "./components/DashboardPanel";
import { LogPanel } from "./components/LogPanel";
import { ToolbarPanel } from "./components/ToolbarPanel";
import { Directory } from "./domain/Directory";
import { Clipboard } from "./domain/Clipboard";
import type { FileSystemNode } from "./domain/FileSystemNode";
import type { ISortStrategy } from "./domain/strategies/ISortStrategy";
import type { LogEntry } from "./domain/observer";
import type { DecoratedLogEntry } from "./domain/observer/DecoratedLogEntry";
import type { DashboardPanelProps } from "./domain/observer/DashboardPanelProps";
import type { IProgressSubject } from "./domain/observer/IProgressSubject";
import type { ProgressEvent } from "./domain/observer/ProgressEvent";
import { ProgressSubjectImpl } from "./services/observers/ProgressSubjectImpl";
import { ConsoleObserver } from "./services/observers/ConsoleObserver";
import { DashboardObserver } from "./services/observers/DashboardObserver";
import {
  SuccessDecorator,
  WarningDecorator,
  ScanDecorator,
  StartDecorator,
  LogEntryDecoratorChain,
} from "./services/decorators";
import { exportToXml } from "./services/FileSystemXmlExporter";
import { exportToJson } from "./services/exporters/JSONExporter";
import { exportToMarkdown } from "./services/exporters/MarkdownExporter";
import { countNodes } from "./services/exporters/countNodes";
import { CommandInvoker } from "./services/CommandInvoker";
import { CopyCommand } from "./services/commands/CopyCommand";
import { PasteCommand } from "./services/commands/PasteCommand";
import { DeleteCommand } from "./services/commands/DeleteCommand";
import { SortCommand } from "./services/commands/SortCommand";

// Decorator Chain — 全域常數，避免每次 render 重建（OCP：新增關鍵字只需新增 Decorator）
const DEFAULT_CHAIN = new LogEntryDecoratorChain([
  new SuccessDecorator(),
  new WarningDecorator(),
  new ScanDecorator(),
  new StartDecorator(),
]);

/** 格式化總大小，同 TreeNodeItem 規則（≥1024 KB 顯示 MB） */
function formatSize(sizeKB: number): string {
  if (sizeKB >= 1024) {
    return `${(sizeKB / 1024).toFixed(2)} MB`;
  }
  return `${sizeKB} KB`;
}

/**
 * 遞迴建立搜尋命中路徑集合，並透過 Subject 發佈掃描進度。
 * Observer Pattern — 每走訪一個子節點，通知所有訂閱者（OCP：不修改既有 Observer 實作）
 */
function buildMatchedPathsWithProgress(
  dir: Directory,
  keyword: string,
  dirPath: string,
  result: Set<string>,
  subject: IProgressSubject,
  total: number,
  counter: { current: number },
  operationName: string,
): boolean {
  const lower = keyword.toLowerCase();
  let hasMatch = false;

  for (const child of dir.getChildren()) {
    const childPath = `${dirPath}/${child.name}`;
    counter.current++;
    const percentage = Math.min(
      100,
      Math.round((counter.current / total) * 100),
    );

    if (child.isDirectory()) {
      const childHasMatch = buildMatchedPathsWithProgress(
        child as Directory,
        keyword,
        childPath,
        result,
        subject,
        total,
        counter,
        operationName,
      );
      if (child.name.toLowerCase().includes(lower) || childHasMatch) {
        result.add(childPath);
        hasMatch = true;
      }
    } else {
      if (child.name.toLowerCase().includes(lower)) {
        result.add(childPath);
        hasMatch = true;
      }
    }

    subject.notify({
      phase: "scan",
      operationName,
      current: counter.current,
      total,
      percentage,
      message: `掃描 ${child.name}`,
      timestamp: new Date(),
    });
  }
  return hasMatch;
}

function App() {
  // buildSampleTree 用 useMemo 避免每次 re-render 重新建立
  const root = useMemo(() => buildSampleTree(), []);

  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Command Pattern 狀態 ──
  const [selectedNode, setSelectedNode] = useState<FileSystemNode | null>(null);
  const [selectedParent, setSelectedParent] = useState<Directory | null>(null);
  const [treeVersion, setTreeVersion] = useState(0);
  const invoker = useMemo(() => new CommandInvoker(), []);
  const clipboard = useMemo(() => Clipboard.getInstance(), []);
  // canUndo / canRedo 以 treeVersion 為依賴，確保每次操作後重新計算
  const canUndo = treeVersion >= 0 && invoker.canUndo;
  const canRedo = treeVersion >= 0 && invoker.canRedo;
  const canPaste =
    (treeVersion >= 0) &&
    clipboard.hasNode() &&
    selectedNode !== null &&
    selectedNode.isDirectory();

  // 進度面板 — 始終顯示，由 DashboardObserver 透過 callback 更新
  const [dashboardProps, setDashboardProps] = useState<DashboardPanelProps>({
    operationName: "等待操作",
    percentage: 0,
    current: 0,
    total: 0,
    message: "請選擇匯出格式或輸入搜尋關鍵字",
    isDone: false,
    phase: "export",
  });

  // 日誌面板 — 由 ConsoleObserver 透過 callback 更新
  const [logs, setLogs] = useState<Array<LogEntry | DecoratedLogEntry>>([]);

  // 進度動畫計時器 — 允許取消未完成的動畫（換搜尋或匯出時清除舊計時器）
  const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 搜尋命中路徑集合（useState，讓 performSearch 可在 Observer 回調後更新）
  const [matchedPaths, setMatchedPaths] = useState<Set<string> | undefined>(
    undefined,
  );

  // 計算總大小與節點數（root 穩定，不重新建立）
  const totalSize = useMemo(() => root.getSizeKB(), [root]);
  const totalNodes = useMemo(() => countNodes(root), [root]);

  /** 安全追加 log（上限 500 筆） */
  const appendLog = useCallback(
    (entry: LogEntry | DecoratedLogEntry) =>
      setLogs((prev) =>
        prev.length >= 500 ? [...prev.slice(-499), entry] : [...prev, entry],
      ),
    [],
  );

  /** 建立 Subject + 雙 Observer 並完成訂閱（共用邏輯，DRY） */
  const createSubjectWithObservers = useCallback(() => {
    const subject = new ProgressSubjectImpl();
    const consoleObs = new ConsoleObserver(appendLog, DEFAULT_CHAIN);
    const dashObs = new DashboardObserver((props) => {
      setDashboardProps(props);
    });
    subject.subscribe(consoleObs);
    subject.subscribe(dashObs);
    return { subject, consoleObs, dashObs };
  }, [appendLog]);

  /**
   * 配線 Subject + Observer、執行匯出、輸出至 console、觸發檔案下載。
   * 開啟瀏覽器 DevTools (F12) → Console 分頁可查看完整匯出內容。
   */
  const runWithProgress = useCallback(
    (
      exportFn: (subject: IProgressSubject) => string,
      filename: string,
      mimeType: string,
      operationLabel: string,
    ) => {
      // 取消上一次未完成的動畫
      animationTimers.current.forEach(clearTimeout);
      animationTimers.current = [];

      // ── Phase 1: 同步匯出，用輕量 Subject 收集所有進度事件 ──
      const collectedEvents: ProgressEvent[] = [];
      const collectingSubject: IProgressSubject = {
        subscribe: () => {},
        unsubscribe: () => {},
        notify: (event) => collectedEvents.push(event),
      };
      const result = exportFn(collectingSubject);

      // ── 輸出至瀏覽器 console（F12 → Console 可查看完整內容）──
      console.group(`📤 [匯出結果] ${operationLabel}`);
      console.log(result);
      console.groupEnd();

      // ── 觸發實體檔案下載（立即，不等動畫）──
      const blob = new Blob([result], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // ── Phase 2: 非同步回放進度事件，讓 DashboardPanel 逐步動畫 ──
      const { subject, consoleObs, dashObs } = createSubjectWithObservers();
      const interval = Math.max(20, Math.floor(600 / collectedEvents.length));
      collectedEvents.forEach((event, idx) => {
        const timer = setTimeout(() => {
          subject.notify(event);
          if (idx === collectedEvents.length - 1) {
            subject.unsubscribe(consoleObs);
            subject.unsubscribe(dashObs);
          }
        }, idx * interval);
        animationTimers.current.push(timer);
      });
    },
    [createSubjectWithObservers],
  );

  /**
   * 搜尋功能整合 Observer Pattern。
   * 走訪每個節點時由 Subject 發佈掃描進度，
   * ConsoleObserver / DashboardObserver 以與匯出完全相同的機制接收（OCP）。
   */
  const performSearch = useCallback(
    (kw: string) => {
      setKeyword(kw);
      // 取消上一次未完成的動畫
      animationTimers.current.forEach(clearTimeout);
      animationTimers.current = [];

      if (!kw.trim()) {
        setMatchedPaths(undefined);
        setDashboardProps(null);
        return;
      }

      const opName = `搜尋「${kw}」`;

      // ── Phase 1: 同步走訪，用輕量 Subject 收集所有進度事件 ──
      const collectedEvents: ProgressEvent[] = [];
      const collectingSubject: IProgressSubject = {
        subscribe: () => {},
        unsubscribe: () => {},
        notify: (event) => collectedEvents.push(event),
      };

      collectedEvents.push({
        phase: "scan",
        operationName: opName,
        current: 0,
        total: totalNodes,
        percentage: 0,
        message: `開始掃描，共 ${totalNodes} 個節點`,
        timestamp: new Date(),
      });

      const paths = new Set<string>();
      const counter = { current: 0 };
      const rootHasDescendants = buildMatchedPathsWithProgress(
        root,
        kw,
        root.name,
        paths,
        collectingSubject,
        totalNodes,
        counter,
        opName,
      );

      if (
        rootHasDescendants ||
        root.name.toLowerCase().includes(kw.toLowerCase())
      ) {
        paths.add(root.name);
      }

      // 加入完成事件（確保進度達到 100%，修正根節點不計入 counter 導致的 91% 問題）
      const matchedCount = [...paths].filter((p) => p !== root.name).length;
      collectedEvents.push({
        phase: "scan",
        operationName: opName,
        current: totalNodes,
        total: totalNodes,
        percentage: 100,
        message: `掃描完成，找到 ${matchedCount} 個相符節點`,
        timestamp: new Date(),
      });

      // 立即更新檔案樹（不等動畫完成）
      setMatchedPaths(paths);

      // ── Phase 2: 非同步回放進度事件，讓 DashboardPanel 逐步動畫 ──
      const { subject, consoleObs, dashObs } = createSubjectWithObservers();
      const interval = Math.max(20, Math.floor(600 / collectedEvents.length));
      collectedEvents.forEach((event, idx) => {
        const timer = setTimeout(() => {
          subject.notify(event);
          if (idx === collectedEvents.length - 1) {
            subject.unsubscribe(consoleObs);
            subject.unsubscribe(dashObs);
          }
        }, idx * interval);
        animationTimers.current.push(timer);
      });
    },
    [root, totalNodes, createSubjectWithObservers],
  );

  // ── Command handlers ──────────────────────────────────────────────────────

  const bumpTree = () => setTreeVersion((v) => v + 1);

  const handleSelect = useCallback(
    (node: FileSystemNode, parent: Directory | null) => {
      setSelectedNode(node);
      setSelectedParent(parent);
    },
    [],
  );

  const handleCopy = useCallback(() => {
    if (!selectedNode) return;
    invoker.execute(new CopyCommand(selectedNode, clipboard), false);
    appendLog({ level: "INFO", message: `📋 複製：${selectedNode.name}`, timestamp: new Date() });
    bumpTree();
  }, [selectedNode, invoker, clipboard, appendLog]);

  const handlePaste = useCallback(() => {
    if (!selectedNode?.isDirectory()) return;
    const sourceName = clipboard.getNode()?.name ?? "";
    const cmd = new PasteCommand(clipboard, selectedNode as Directory);
    invoker.execute(cmd);
    const pastedName = cmd.pastedNodeName ?? sourceName;
    const renamed = pastedName !== sourceName;
    appendLog({
      level: "SUCCESS",
      message: renamed
        ? `📌 貼上：${pastedName}（"${sourceName}" 重新命名）→ ${selectedNode.name}`
        : `📌 貼上：${pastedName} → ${selectedNode.name}`,
      timestamp: new Date(),
    });
    bumpTree();
  }, [selectedNode, invoker, clipboard, appendLog]);

  const handleDelete = useCallback(() => {
    if (!selectedNode || !selectedParent) return;
    const deletedName = selectedNode.name;
    invoker.execute(new DeleteCommand(selectedNode, selectedParent));
    setSelectedNode(null);
    setSelectedParent(null);
    appendLog({ level: "WARNING", message: `🗑 刪除：${deletedName}`, timestamp: new Date() });
    bumpTree();
  }, [selectedNode, selectedParent, invoker, appendLog]);

  const handleSort = useCallback(
    (strategy: ISortStrategy) => {
      if (!selectedNode?.isDirectory()) return;
      const dir = selectedNode as Directory;
      const snapshot = [...dir.getChildren()];
      invoker.execute(new SortCommand(dir, strategy, snapshot));
      appendLog({ level: "INFO", message: `🔀 排序：${dir.name} 依 ${strategy.label}`, timestamp: new Date() });
      bumpTree();
    },
    [selectedNode, invoker, appendLog],
  );

  const handleUndo = useCallback(() => {
    const desc = invoker.undoDescription;
    invoker.undo();
    if (desc) appendLog({ level: "INFO", message: `↩ 復原：${desc}`, timestamp: new Date() });
    bumpTree();
  }, [invoker, appendLog]);

  const handleRedo = useCallback(() => {
    const desc = invoker.redoDescription;
    invoker.redo();
    if (desc) appendLog({ level: "INFO", message: `↪ 重做：${desc}`, timestamp: new Date() });
    bumpTree();
  }, [invoker, appendLog]);

  // ─────────────────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setKeyword("");
    setMatchedPaths(undefined);
    inputRef.current?.focus();
  };

  const handleExportXml = () => {
    runWithProgress(
      (subject) => exportToXml(root, subject),
      "file-system.xml",
      "application/xml;charset=utf-8",
      "匯出 XML",
    );
  };

  const handleExportJson = () => {
    runWithProgress(
      (subject) => exportToJson(root, subject),
      "file-system.json",
      "application/json;charset=utf-8",
      "匯出 JSON",
    );
  };

  const handleExportMarkdown = () => {
    runWithProgress(
      (subject) => exportToMarkdown(root, subject),
      "file-system.md",
      "text/markdown;charset=utf-8",
      "匯出 Markdown",
    );
  };

  const isSearchActive = keyword.trim().length > 0;
  const resultCount = matchedPaths
    ? [...matchedPaths].filter((p) => p !== root.name).length
    : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Navbar ── */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📂</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
                雲端檔案管理系統
              </h1>
              <p className="text-blue-200 text-xs">
                Cloud File Management System
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-blue-200 text-xs font-medium">總容量</p>
            <p className="text-white font-bold text-base">
              {formatSize(totalSize)}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* ── Action Bar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="輸入關鍵字後按 Enter 搜尋..."
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>

            {isSearchActive && (
              <button
                onClick={handleClear}
                className="text-sm px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors whitespace-nowrap"
              >
                ✕ 清除
              </button>
            )}

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Export buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleExportXml}
                className="text-sm px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                🗂 XML
              </button>
              <button
                onClick={handleExportJson}
                className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                📊 JSON
              </button>
              <button
                onClick={handleExportMarkdown}
                className="text-sm px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                📝 Markdown
              </button>
            </div>
          </div>
        </div>

        {/* ── Dashboard Panel ── */}
        <DashboardPanel {...dashboardProps} />

        {/* ── Toolbar Panel ── */}
        <ToolbarPanel
          selectedNode={selectedNode}
          canPaste={canPaste}
          canUndo={canUndo}
          canRedo={canRedo}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDelete={handleDelete}
          onSort={handleSort}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* ── File Tree Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span>🌲</span>
              <span className="text-sm font-semibold text-slate-700">
                檔案樹
              </span>
            </div>
            {isSearchActive ? (
              <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200 font-medium">
                搜尋「{keyword}」· 找到 {resultCount} 個節點
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                共 {totalNodes} 個節點
              </span>
            )}
          </div>
          <div className="p-4">
            <FileTreeView
              key={treeVersion}
              root={root}
              matchedPaths={matchedPaths}
              onSelect={handleSelect}
              selectedNode={selectedNode}
            />
          </div>
        </div>

        {/* ── Log Panel ── */}
        <LogPanel logs={logs} onClear={() => setLogs([])} />
      </main>
    </div>
  );
}

export default App;


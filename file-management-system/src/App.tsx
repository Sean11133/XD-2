import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSampleTree } from "./data/sampleData";
import { FileTreeView } from "./components/FileTreeView";
import { DashboardPanel } from "./components/DashboardPanel";
import { LogPanel } from "./components/LogPanel";
import { ToolbarPanel } from "./components/ToolbarPanel";
import { Directory } from "./domain/Directory";
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
import { FileSystemFacade } from "./services/FileSystemFacade";
import type { Label } from "./domain/labels/Label";
import { LabelPanel } from "./components/LabelPanel";

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
 * 遞迴建立標籤篩選路徑集合。
 * 走訪每個子節點，判斷是否掛有指定 Label；
 * 若有，則將該路徑與所有祖先路徑加入 result（保持節點可見）。
 */
function buildLabelMatchedPaths(
  dir: Directory,
  label: Label,
  dirPath: string,
  result: Set<string>,
  getLabels: (node: import("./domain/FileSystemNode").FileSystemNode) => import("./domain/labels/Label").Label[],
): boolean {
  let hasMatch = false;
  for (const child of dir.getChildren()) {
    const childPath = `${dirPath}/${child.name}`;
    const childLabels = getLabels(child);
    const childHasLabel = childLabels.some((l) => l.id === label.id);
    if (child.isDirectory()) {
      const descMatch = buildLabelMatchedPaths(
        child as Directory,
        label,
        childPath,
        result,
        getLabels,
      );
      if (descMatch || childHasLabel) {
        result.add(childPath);
        hasMatch = true;
      }
    } else {
      if (childHasLabel) {
        result.add(childPath);
        hasMatch = true;
      }
    }
  }
  return hasMatch;
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
  // root 初始值使用 sampleData，useEffect 後由後端 API 取代
  const [root, setRoot] = useState<Directory>(() => buildSampleTree());

  // API 載入狀態
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // node → API UUID 對應表（只在 API 整合時有效）
  const nodeIdMap = useRef<Map<FileSystemNode, string>>(new Map());

  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Facade（統一入口）+ Command Pattern 狀態 ──
  const [selectedNode, setSelectedNode] = useState<FileSystemNode | null>(null);
  const [selectedParent, setSelectedParent] = useState<Directory | null>(null);
  const [treeVersion, setTreeVersion] = useState(0);
  const facade = useMemo(() => new FileSystemFacade(), []);
  // canUndo / canRedo / canPaste 以 treeVersion 為依賴，確保每次操作後重新計算
  const canUndo = treeVersion >= 0 && facade.canUndo;
  const canRedo = treeVersion >= 0 && facade.canRedo;
  const canPaste = treeVersion >= 0 && facade.canPaste(selectedNode);

  // ── 後端 API 初始化載入 ───────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    facade
      .loadTree()
      .then(({ root: apiRoot, idMap }) => {
        setRoot(apiRoot);
        nodeIdMap.current = idMap;
        setServerError(null);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "未知錯誤";
        setServerError(`後端連線失敗（${msg}）— 使用本地範例資料`);
        // 保留初始 sampleData，不中斷操作
      })
      .finally(() => setIsLoading(false));
    // facade 為 useMemo 建立的穩定參考，effect 只需執行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 進度面板 — 由 DashboardObserver 透過 callback 更新（null 時隱藏面板）
  const [dashboardProps, setDashboardProps] = useState<DashboardPanelProps | null>({
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

  // ── Label / Tag 狀態 ──
  const [labelVersion, setLabelVersion] = useState(0);
  const [labelFilter, setLabelFilter] = useState<Label | null>(null);

  // 計算總大小與節點數（root 穩定，不重新建立）
  const totalSize = useMemo(() => root.getSizeKB(), [root]);
  const totalNodes = useMemo(() => countNodes(root), [root]);

  // 所有標籤（labelVersion 變動時重算）
  const allLabels = useMemo(() => facade.getAllLabels(), [labelVersion]);
  // 已選節點的標籤（node 或 labelVersion 變動時重算）
  const nodeLabels = useMemo(
    () => (selectedNode ? facade.getNodeLabels(selectedNode) : []),
    [selectedNode, labelVersion],
  );
  // getNodeLabels fn — labelVersion 變動時建立新參考以驅動 FileTreeView 重算
  const getNodeLabels = useCallback(
    (node: FileSystemNode) => facade.getNodeLabels(node),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelVersion],
  );
  // 有效路徑：labelFilter 優先，否則使用關鍵字搜尋結果
  const effectiveMatchedPaths = useMemo(() => {
    if (labelFilter) {
      const paths = new Set<string>();
      const rootHasLabel = facade
        .getNodeLabels(root)
        .some((l) => l.id === labelFilter.id);
      const hasDesc = buildLabelMatchedPaths(root, labelFilter, root.name, paths, (n) => facade.getNodeLabels(n));
      if (hasDesc || rootHasLabel) paths.add(root.name);
      return paths;
    }
    return matchedPaths;
  }, [root, labelFilter, matchedPaths, labelVersion]);

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
  const bumpLabel = () => setLabelVersion((v) => v + 1);

  const handleSelect = useCallback(
    (node: FileSystemNode, parent: Directory | null) => {
      setSelectedNode(node);
      setSelectedParent(parent);
    },
    [],
  );

  const handleCopy = useCallback(() => {
    if (!selectedNode) return;
    facade.copy(selectedNode);
    appendLog({ level: "INFO", message: `📋 複製：${selectedNode.name}`, timestamp: new Date() });
    bumpTree();
  }, [selectedNode, facade, appendLog]);

  const handlePaste = useCallback(() => {
    if (!selectedNode?.isDirectory()) return;
    const sourceNode = facade["_clipboard"]?.getNode?.() ?? null;
    const result = facade.paste(selectedNode as Directory);
    appendLog({
      level: "SUCCESS",
      message: result.renamed
        ? `📌 貼上：${result.pastedName}（重新命名）→ ${selectedNode.name}`
        : `📌 貼上：${result.pastedName} → ${selectedNode.name}`,
      timestamp: new Date(),
    });
    bumpTree();
    // 非同步 API 持久化（fire-and-forget，失敗只記錄 log）
    const sourceId = sourceNode ? nodeIdMap.current.get(sourceNode) : undefined;
    const targetId = nodeIdMap.current.get(selectedNode);
    if (sourceId && targetId) {
      facade.copyNodeOnServer(sourceId, targetId).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "未知錯誤";
        appendLog({ level: "WARNING", message: `⚠️ 後端同步失敗（貼上）：${msg}`, timestamp: new Date() });
      });
    }
  }, [selectedNode, facade, appendLog]);

  const handleDelete = useCallback(() => {
    if (!selectedNode || !selectedParent) return;
    const deletedName = selectedNode.name;
    const nodeId = nodeIdMap.current.get(selectedNode);
    facade.delete(selectedNode, selectedParent);
    setSelectedNode(null);
    setSelectedParent(null);
    appendLog({ level: "WARNING", message: `🗑 刪除：${deletedName}`, timestamp: new Date() });
    bumpTree();
    // 非同步 API 持久化
    if (nodeId) {
      facade.deleteNodeOnServer(nodeId).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "未知錯誤";
        appendLog({ level: "WARNING", message: `⚠️ 後端同步失敗（刪除）：${msg}`, timestamp: new Date() });
      });
    }
  }, [selectedNode, selectedParent, facade, appendLog]);

  // 前端 label → 後端 strategy key 對應（後端只支援名稱/大小排序）
  const LABEL_TO_API_STRATEGY: Record<string, string> = {
    "依名稱 A→Z": "name_asc",
    "依名稱 Z→A": "name_desc",
    "依大小 小→大": "size_asc",
    "依大小 大→小": "size_desc",
  };

  const handleSort = useCallback(
    (strategy: ISortStrategy) => {
      if (!selectedNode?.isDirectory()) return;
      const dir = selectedNode as Directory;
      facade.sort(dir, strategy);
      appendLog({ level: "INFO", message: `🔀 排序：${dir.name} 依 ${strategy.label}`, timestamp: new Date() });
      bumpTree();
      // 非同步 API 持久化（僅後端支援的策略）
      const apiStrategy = LABEL_TO_API_STRATEGY[strategy.label];
      const dirId = nodeIdMap.current.get(dir);
      if (apiStrategy && dirId) {
        facade.sortChildrenOnServer(dirId, apiStrategy).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "未知錯誤";
          appendLog({ level: "WARNING", message: `⚠️ 後端同步失敗（排序）：${msg}`, timestamp: new Date() });
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNode, facade, appendLog],
  );

  const handleUndo = useCallback(() => {
    const desc = facade.undoDescription;
    facade.undo();
    if (desc) appendLog({ level: "INFO", message: `↩ 復原：${desc}`, timestamp: new Date() });
    bumpTree();
    bumpLabel();
  }, [facade, appendLog]);

  const handleRedo = useCallback(() => {
    const desc = facade.redoDescription;
    facade.redo();
    if (desc) appendLog({ level: "INFO", message: `↪ 重做：${desc}`, timestamp: new Date() });
    bumpTree();
    bumpLabel();
  }, [facade, appendLog]);

  // ── Label / Tag handlers ──────────────────────────────────────────────────

  const handleTagLabel = useCallback(
    (label: Label) => {
      if (!selectedNode) return;
      facade.tagLabel(selectedNode, label);
      appendLog({
        level: "INFO",
        message: `🏷️ 貼標籤：${label.name} → ${selectedNode.name}`,
        timestamp: new Date(),
      });
      bumpLabel();
    },
    [selectedNode, facade, appendLog],
  );

  const handleRemoveLabel = useCallback(
    (label: Label) => {
      if (!selectedNode) return;
      facade.removeLabel(selectedNode, label);
      appendLog({
        level: "WARNING",
        message: `🏷️ 移除標籤：${label.name} ← ${selectedNode.name}`,
        timestamp: new Date(),
      });
      bumpLabel();
    },
    [selectedNode, facade, appendLog],
  );

  const handleCreateLabel = useCallback(
    (name: string) => {
      const label = facade.createLabel(name, selectedNode ?? undefined);
      if (selectedNode) {
        appendLog({
          level: "INFO",
          message: `🏷️ 建立並貼標籤：${label.name} → ${selectedNode.name}`,
          timestamp: new Date(),
        });
      } else {
        appendLog({
          level: "INFO",
          message: `🏷️ 建立標籤：${label.name}`,
          timestamp: new Date(),
        });
      }
      bumpLabel();
    },
    [selectedNode, facade, appendLog],
  );

  const handleFilterByLabel = useCallback((label: Label | null) => {
    setLabelFilter(label);
  }, []);

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
  const labelFilterCount = effectiveMatchedPaths
    ? [...effectiveMatchedPaths].filter((p) => p !== root.name).length
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
        {/* ── Server Error Banner ── */}
        {serverError && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-amber-800 text-sm">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{serverError}</span>
            <button
              onClick={() => setServerError(null)}
              className="text-amber-500 hover:text-amber-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Loading Banner ── */}
        {isLoading && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-700 text-sm">
            <span className="animate-spin text-lg">⏳</span>
            <span>正在從後端載入資料...</span>
          </div>
        )}
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
        {dashboardProps && <DashboardPanel {...dashboardProps} />}

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

        {/* ── Label Panel ── */}
        <LabelPanel
          allLabels={allLabels}
          activeFilter={labelFilter}
          selectedNode={selectedNode}
          nodeLabels={nodeLabels}
          onTagLabel={handleTagLabel}
          onRemoveLabel={handleRemoveLabel}
          onFilterByLabel={handleFilterByLabel}
          onCreateLabel={handleCreateLabel}
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
            {labelFilter ? (
              <span className="text-xs px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-200 font-medium flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: labelFilter.color }}
                />
                標籤篩選「{labelFilter.name}」· 找到 {labelFilterCount} 個節點
              </span>
            ) : isSearchActive ? (
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
              matchedPaths={effectiveMatchedPaths}
              onSelect={handleSelect}
              selectedNode={selectedNode}
              getNodeLabels={getNodeLabels}
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


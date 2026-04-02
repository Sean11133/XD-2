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
import type { LabelWithPriority } from "./domain/labels/LabelWithPriority";
import { LabelPanel } from "./components/LabelPanel";
import { BreadcrumbBar } from "./components/BreadcrumbBar";
import { StatusBar } from "./components/StatusBar";
import { SidebarHeader } from "./components/SidebarHeader";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { useTheme } from "./hooks/useTheme";
import { searchFilterService } from "./services/SearchFilterService";
import { ExplorerView } from "./components/ExplorerView";

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
 * 將篩選結果（matchedPaths 集合）重建為子樹，用於「僅匯出篩選結果」。
 */
function buildFilteredTree(node: Directory, pathPrefix: string, matchedPaths: Set<string>): Directory {
  const filtered = new Directory(node.name);
  for (const child of node.getChildren()) {
    const childPath = `${pathPrefix}/${child.name}`;
    if (matchedPaths.has(childPath)) {
      if (child.isDirectory()) {
        filtered.addChild(buildFilteredTree(child as Directory, childPath, matchedPaths));
      } else {
        filtered.addChild(child);
      }
    }
  }
  return filtered;
}

function getNodeTypeInfo(node: FileSystemNode): { icon: string; type: string; color: string } {
  if (node.isDirectory()) return { icon: "📁", type: "資料夾", color: "text-blue-600 bg-blue-50 border-blue-200" };
  const name = node.name.toLowerCase();
  if (name.endsWith(".txt")) return { icon: "📄", type: "文字檔", color: "text-slate-600 bg-slate-50 border-slate-200" };
  if (name.endsWith(".xml")) return { icon: "🗂", type: "XML", color: "text-orange-600 bg-orange-50 border-orange-200" };
  if (name.endsWith(".json")) return { icon: "📊", type: "JSON", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (name.endsWith(".md")) return { icon: "📝", type: "Markdown", color: "text-violet-600 bg-violet-50 border-violet-200" };
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif") || name.endsWith(".webp"))
    return { icon: "🖼", type: "圖片", color: "text-pink-600 bg-pink-50 border-pink-200" };
  if (name.endsWith(".pdf")) return { icon: "📕", type: "PDF", color: "text-red-600 bg-red-50 border-red-200" };
  if (name.endsWith(".docx") || name.endsWith(".doc")) return { icon: "📘", type: "Word", color: "text-blue-600 bg-blue-50 border-blue-200" };
  return { icon: "📄", type: "檔案", color: "text-slate-600 bg-slate-50 border-slate-200" };
}

/**
 * 提取 getDisplayInfo() 中類型區塊後的類型專屬元數據字串（跳過大小）。
 * TextFile  → "UTF-8 · 2026-04-01"
 * ImageFile → "800×600 · 2026-03-23"
 * WordDoc   → "25頁 · 2026-03-10"
 */
function getFileExtras(node: FileSystemNode): string | null {
  if (node.isDirectory()) return null;
  const info = node.getDisplayInfo();
  const closeIdx = info.indexOf(']');
  if (closeIdx < 0) return null;
  const after = info.slice(closeIdx + 2).trim(); // "1.5KB, UTF-8, 2026-04-01"
  const parts = after.split(', ');
  const extras = parts.slice(1); // skip size (first part), shown separately
  return extras.length > 0 ? extras.join(' · ') : null;
}

function App() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const { theme, setTheme } = useTheme();

  // ── collapseAll trigger ────────────────────────────────────────────────────
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(0);
  // null = 不顯示，其他值 = 待確認的匠出格式
  const [pendingExportFormat, setPendingExportFormat] = useState<"xml" | "json" | "md" | null>(null);

  // ExplorerView 外部導覽目標（左側樹點擊 Directory 時更新）
  const [explorerNavTarget, setExplorerNavTarget] = useState<Directory | null>(null);

  // root 初始值使用 sampleData，useEffect 後由後端 API 取代
  const [root, setRoot] = useState<Directory>(() => buildSampleTree());

  // API 載入狀態
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // node → API UUID 對應表（只在 API 整合時有效）
  const nodeIdMap = useRef<Map<FileSystemNode, string>>(new Map());

  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");

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
  const [dashboardProps, setDashboardProps] = useState<DashboardPanelProps | null>(null);

  // 日誌面板 — 由 ConsoleObserver 透過 callback 更新
  const [logs, setLogs] = useState<Array<LogEntry | DecoratedLogEntry>>([]);

  // 底部面板可見性控制
  const [showDashboard, setShowDashboard] = useState(false);
  const [showLog, setShowLog] = useState(true);

  // 進度動畫計時器 — 允許取消未完成的動畫（換搜尋或匯出時清除舊計時器）
  const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 搜尋命中路徑集合（useState，讓 performSearch 可在 Observer 回調後更新）
  const [matchedPaths, setMatchedPaths] = useState<Set<string> | undefined>(
    undefined,
  );

  // ── Label / Tag 狀態 ──
  const [labelVersion, setLabelVersion] = useState(0);
  const [labelFilter, setLabelFilter] = useState<LabelWithPriority | null>(null);

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
      searchFilterService.buildLabelMatchedPaths(root, labelFilter, root.name, paths, (n) => facade.getNodeLabels(n));
      if (rootHasLabel) paths.add(root.name);
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
      searchFilterService.buildKeywordMatchedPaths(
        root,
        kw,
        root.name,
        paths,
        collectingSubject,
        totalNodes,
        counter,
        opName,
      );

      if (root.name.toLowerCase().includes(kw.toLowerCase()) || paths.size > 0) {
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
      // 同步右側 ExplorerView：點擊資料夾 → 導覽至該資料夾；點擊檔案 → 導覽至其父目錄
      if (node.isDirectory()) {
        setExplorerNavTarget(node as Directory);
      } else if (parent) {
        setExplorerNavTarget(parent);
      }
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
    const sourceNode = facade.getClipboardNode();
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

  const handleSaveLabel = useCallback(
    (name: string, color: string, priority: number) => {
      const label = facade.createLabel(name, selectedNode ?? undefined, { color, priority });
      if (selectedNode) {
        appendLog({
          level: "INFO",
          message: `🏷️ 建立並貼標籤：${label.name} (${priority}★) → ${selectedNode.name}`,
          timestamp: new Date(),
        });
      } else {
        appendLog({
          level: "INFO",
          message: `🏷️ 建立標籤：${label.name} (${priority}★)`,
          timestamp: new Date(),
        });
      }
      bumpLabel();
    },
    [selectedNode, facade, appendLog],
  );

  /** LabelFilterBar 向後相容（T-13 重構後移除） */
  const handleCreateLabel = useCallback(
    (name: string) => handleSaveLabel(name, "#48CAE4", 1),
    [handleSaveLabel],
  );

  const handleFilterByLabel = useCallback((label: LabelWithPriority | null) => {
    setLabelFilter(label);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  // 即時搜尋 debounce — inputValue 變動 350ms 後自動執行（Enter 鍵仍可立即觸發）
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(inputValue);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleExportXml = () => {
    if (effectiveMatchedPaths) { setPendingExportFormat("xml"); return; }
    runWithProgress((subject) => exportToXml(root, subject), "file-system.xml", "application/xml;charset=utf-8", "匯出 XML");
  };

  const handleExportJson = () => {
    if (effectiveMatchedPaths) { setPendingExportFormat("json"); return; }
    runWithProgress((subject) => exportToJson(root, subject), "file-system.json", "application/json;charset=utf-8", "匯出 JSON");
  };

  const handleExportMarkdown = () => {
    if (effectiveMatchedPaths) { setPendingExportFormat("md"); return; }
    runWithProgress((subject) => exportToMarkdown(root, subject), "file-system.md", "text/markdown;charset=utf-8", "匯出 Markdown");
  };

  const handleExportWithScope = (scope: "all" | "filtered") => {
    const fmt = pendingExportFormat;
    setPendingExportFormat(null);
    if (!fmt) return;
    const exportRoot =
      scope === "filtered" && effectiveMatchedPaths
        ? buildFilteredTree(root, root.name, effectiveMatchedPaths)
        : root;
    if (fmt === "xml") runWithProgress((s) => exportToXml(exportRoot, s), "file-system.xml", "application/xml;charset=utf-8", "匯出 XML");
    else if (fmt === "json") runWithProgress((s) => exportToJson(exportRoot, s), "file-system.json", "application/json;charset=utf-8", "匯出 JSON");
    else runWithProgress((s) => exportToMarkdown(exportRoot, s), "file-system.md", "text/markdown;charset=utf-8", "匯出 Markdown");
  };

  const isSearchActive = keyword.trim().length > 0;
  const resultCount = matchedPaths
    ? [...matchedPaths].filter((p) => p !== root.name).length
    : 0;
  const labelFilterCount = effectiveMatchedPaths
    ? [...effectiveMatchedPaths].filter((p) => p !== root.name).length
    : 0;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* ── Header ── */}
      <header
        className="flex-shrink-0 shadow-lg"
        style={{ background: "linear-gradient(to right, var(--header-from), var(--header-to))" }}
      >
        <div className="px-4 py-3 flex items-center gap-4">
          {/* App title */}
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7 text-white opacity-90 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">雲端檔案管理系統</h1>
              <p className="text-xs text-white opacity-60">Cloud File Management System</p>
            </div>
          </div>

          {/* Export + Theme toggle */}
          <div className="flex gap-1.5 ml-auto">
            <button
              onClick={handleExportXml}
              className="text-xs px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-colors border border-white/20 flex items-center gap-1 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              XML
            </button>
            <button
              onClick={handleExportJson}
              className="text-xs px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-colors border border-white/20 flex items-center gap-1 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              JSON
            </button>
            <button
              onClick={handleExportMarkdown}
              className="text-xs px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-colors border border-white/20 flex items-center gap-1 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              MD
            </button>

            {/* ── Theme Toggle button ── */}
            <button
              onClick={() =>
                setTheme(theme === "light" ? "dark" : theme === "dark" ? "ocean" : "light")
              }
              title={`主題：${theme === "light" ? "淺色" : theme === "dark" ? "深色" : "深海"} (點擊切換)`}
              className="text-xs px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-colors border border-white/20"
            >
              {theme === "dark" ? (
                /* Moon */
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : theme === "ocean" ? (
                /* Wave */
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12c3 0 3-3 6-3s3 3 6 3 3-3 6-3M3 18c3 0 3-3 6-3s3 3 6 3 3-3 6-3" />
                </svg>
              ) : (
                /* Sun */
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb Bar ── */}
      <BreadcrumbBar root={root} selectedNode={selectedNode} onSelect={handleSelect} />

      {/* ── Banners ── */}
      {(serverError || isLoading) && (
        <div className="flex-shrink-0 w-full px-4 pt-3 space-y-2">
          {serverError && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="flex-1">{serverError}</span>
              <button onClick={() => setServerError(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
            </div>
          )}
          {isLoading && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--accent-light)", border: "1px solid var(--border)", color: "var(--accent)" }}
            >
              <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>正在從後端載入資料...</span>
            </div>
          )}
        </div>
      )}

      {/* ── Main two-column ── */}
      <div className="flex-1 min-h-0 w-full px-4 py-3 flex gap-4 overflow-hidden">
        {/* Left: SearchFilterBar + SidebarHeader + File Tree */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
          {/* 統一搜尋 + 標籤篩選列 */}
          <SearchFilterBar
            keyword={inputValue}
            onKeywordChange={setInputValue}
            onSearch={performSearch}
            allLabels={allLabels}
            activeFilter={labelFilter}
            onFilterByLabel={handleFilterByLabel}
            onCreateLabel={handleCreateLabel}
            isSearching={false}
          />

          {/* File Tree */}
          <div
            className="flex-1 min-h-0 rounded-xl shadow-sm overflow-hidden flex flex-col"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            {/* SidebarHeader: 新增資料夾/檔案 + 全部收合 */}
            <SidebarHeader
              onAddFolder={() => {
                appendLog({ level: "INFO", message: "📁 新增資料夾（功能規劃中）", timestamp: new Date() });
              }}
              onAddFile={() => {
                appendLog({ level: "INFO", message: "📄 新增檔案（功能規劃中）", timestamp: new Date() });
              }}
              onCollapseAll={() => setCollapseAllTrigger((v) => v + 1)}
            />
            <div
              className="flex items-center justify-between px-4 py-1.5 flex-shrink-0"
              style={{ background: "var(--bg-surface2)", borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>檔案樹</span>
              </div>
              {labelFilter ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1"
                  style={{ background: "#f5f3ff", color: "#6d28d9", borderColor: "#ddd6fe" }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: labelFilter.color }}
                  />
                  {labelFilter.name} · {labelFilterCount}
                </span>
              ) : isSearchActive ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full border font-medium"
                  style={{ background: "var(--accent-light)", color: "var(--accent)", borderColor: "var(--accent-light)" }}
                >
                  {resultCount} 個結果
                </span>
              ) : (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{totalNodes} 個</span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <FileTreeView
                key={treeVersion}
                root={root}
                matchedPaths={effectiveMatchedPaths}
                onSelect={handleSelect}
                selectedNode={selectedNode}
                getNodeLabels={getNodeLabels}
                collapseAllTrigger={collapseAllTrigger}
              />
            </div>
          </div>
        </div>

        {/* Right: Explorer View + Actions */}
        <div className="flex-1 min-w-0 overflow-y-auto flex flex-col gap-3 pr-1">
          {/* ── ExplorerView — Windows Explorer 右側瀏覽區 (US-03) ── */}
          <div
            className="rounded-xl shadow-sm overflow-hidden flex-shrink-0"
            style={{ height: "280px", border: "1px solid var(--border)" }}
          >
            <ExplorerView
              rootNode={root}
              selectedNodeId={selectedNode?.name ?? null}
              onFolderChange={(dir) => {
                setSelectedNode(dir);
                setSelectedParent(dir.isDirectory() ? (dir as Directory) : null);
              }}
              onFileSelect={handleSelect}
              navigateTo={explorerNavTarget}
            />
          </div>

          {/* Node Detail / Empty State */}
          {selectedNode ? (
            <div
              className="rounded-xl shadow-sm p-4 flex-shrink-0"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none mt-0.5">
                  {getNodeTypeInfo(selectedNode).icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-base font-bold break-all" style={{ color: "var(--text-primary)" }}>
                      {selectedNode.name}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getNodeTypeInfo(selectedNode).color}`}>
                      {getNodeTypeInfo(selectedNode).type}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>
                      <svg className="w-3 h-3 inline-block mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                      </svg>
                      {formatSize(selectedNode.getSizeKB())}
                    </span>
                    {selectedNode.isDirectory() && (
                      <span>
                        <svg className="w-3 h-3 inline-block mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {(selectedNode as Directory).getChildren().length} 個子項目
                      </span>
                    )}
                    {nodeLabels.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        {nodeLabels.map((l) => (
                          <span
                            key={l.id}
                            className="inline-block text-[10px] px-1.5 py-0.5 rounded font-medium leading-none"
                            style={{
                              backgroundColor: l.color + "22",
                              color: l.color,
                              border: `1px solid ${l.color}44`,
                            }}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* 類型專屬元數據（編碼 / 尺寸 / 頁數 · 日期） */}
                  {getFileExtras(selectedNode) && (
                    <div className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {getFileExtras(selectedNode)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl border-2 border-dashed p-8 text-center flex-shrink-0"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <svg className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>點選左側節點</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>選取檔案或資料夾以查看詳情與進行操作</p>
            </div>
          )}

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
            selectedNode={selectedNode}
            nodeLabels={nodeLabels}
            onTagLabel={handleTagLabel}
            onRemoveLabel={handleRemoveLabel}
            onSaveLabel={handleSaveLabel}
          />
        </div>
      </div>

      {/* ── Status Bar ── */}
      <StatusBar
        totalNodes={totalNodes}
        totalSize={formatSize(totalSize)}
        selectedName={selectedNode?.name ?? null}
        selectedSize={selectedNode ? formatSize(selectedNode.getSizeKB()) : null}
        isFiltered={isSearchActive || !!labelFilter}
        filteredCount={labelFilter ? labelFilterCount : resultCount}
        filterLabel={
          labelFilter
            ? `標籤「${labelFilter.name}」`
            : keyword
              ? `搜尋「${keyword}」`
              : ""
        }
        logCount={logs.length}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* ── Bottom Panels ── */}
      <div className="flex-shrink-0 w-full px-4 pb-3 space-y-2">
        {/* Toggle control bar */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl"
          style={{ background: "var(--bg-surface2)", border: "1px solid var(--border-light)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>面板</span>
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Dashboard toggle */}
            <button
              onClick={() => setShowDashboard((v) => !v)}
              title={showDashboard ? "收起進度面板" : "展開進度面板"}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-all"
              style={{
                background: showDashboard ? "var(--accent-light)" : "transparent",
                color: showDashboard ? "var(--accent)" : "var(--text-secondary)",
                border: showDashboard ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              進度面板
              {/* Activity dot when panel is hidden and has active content */}
              {!showDashboard && dashboardProps && dashboardProps.percentage > 0 && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: dashboardProps.isDone ? "#10b981" : "var(--accent)" }}
                />
              )}
              <svg
                className={`w-3 h-3 transition-transform ${showDashboard ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Log toggle */}
            <button
              onClick={() => setShowLog((v) => !v)}
              title={showLog ? "收起操作日誌" : "展開操作日誌"}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-all"
              style={{
                background: showLog ? "var(--accent-light)" : "transparent",
                color: showLog ? "var(--accent)" : "var(--text-secondary)",
                border: showLog ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              操作日誌
              {logs.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                  style={{
                    background: showLog ? "var(--accent)" : "var(--border)",
                    color: showLog ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {logs.length}
                </span>
              )}
              <svg
                className={`w-3 h-3 transition-transform ${showLog ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dashboard Panel */}
        {showDashboard && dashboardProps && (
          <DashboardPanel {...dashboardProps} />
        )}

        {/* Log Panel */}
        {showLog && (
          <LogPanel logs={logs} onClear={() => setLogs([])} />
        )}
      </div>

      {/* ── 篩選匯出確認 Dialog (US-04) ── */}
      {pendingExportFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              選擇匯出範圍
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              目前有篩選條件，請選擇要匯出的節點範圍：
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleExportWithScope("filtered")}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors cursor-pointer"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                僅匯出篩選結果（{labelFilterCount || resultCount} 個節點）
              </button>
              <button
                onClick={() => handleExportWithScope("all")}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors cursor-pointer"
                style={{ background: "var(--bg-surface2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                匯出全部（{totalNodes} 個節點）
              </button>
            </div>
            <button
              onClick={() => setPendingExportFormat(null)}
              className="mt-3 w-full text-xs text-center cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


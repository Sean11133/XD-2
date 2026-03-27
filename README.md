# XD-2 — File Management System

A React + TypeScript application demonstrating the **Visitor** and **Template Method** design patterns on a virtual file system domain model.

🔗 **Live Demo**: [https://Sean11133.github.io/XD-2/](https://Sean11133.github.io/XD-2/)

---

## Features

- **Domain Model**: `FileSystemNode` hierarchy — `Directory`, `TextFile`, `ImageFile`, `WordDocument`
- **Visitor Pattern** (`IFileSystemVisitor`): Decouple traversal logic from domain classes
- **Template Method Pattern** (`BaseExporterTemplate`): Shared traversal + format-specific hooks
- **Three exporters**: `FileSystemXmlExporter` (XML)、`JSONExporter` (JSON)、`MarkdownExporter` (Markdown)
- **Interactive UI**: Collapsible tree view with expand/collapse all controls

---

## Tech Stack

| Tool | Version |
|------|---------|
| React | 19 |
| TypeScript | 5.x |
| Vite | 6 |
| Tailwind CSS | v4 |
| Vitest | 3 |

---

## Getting Started

```bash
cd file-management-system
npm install
npm run dev      # 開發伺服器
npm run test     # 執行測試 (85 cases)
npm run build    # 生產建置
```

---

## Design Patterns

### Visitor Pattern
`IFileSystemVisitor` 讓 exporter 在不修改 domain 類別的情況下遍歷整個檔案樹。

### Template Method Pattern
`BaseExporterTemplate` 固定遍歷演算法，子類別只需實作格式相關的 hook methods。

```
BaseExporterTemplate (abstract)
├── FileSystemXmlExporter  → XML output
├── JSONExporter           → JSON output
└── MarkdownExporter       → Markdown output
```

---

## License

MIT

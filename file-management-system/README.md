# File Management System

A React + TypeScript application demonstrating the **Visitor** and **Template Method** design patterns on a virtual file system domain model.

🔗 **Live Demo**: [https://Sean11133.github.io/XD-2/](https://Sean11133.github.io/XD-2/)

---

## Features

- **Domain Model**: `FileSystemNode` hierarchy — `Directory`, `TextFile`, `ImageFile`, `WordDocument`
- **Visitor Pattern** (`IFileSystemVisitor`): Decouple traversal logic from domain classes
- **Template Method Pattern** (`BaseExporterTemplate`): Shared traversal + format-specific hooks
- **Three exporters** built on top of the template:
  - `FileSystemXmlExporter` — outputs well-formed XML
  - `JSONExporter` — outputs structured JSON
  - `MarkdownExporter` — outputs indented Markdown with emojis
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
# Install dependencies
npm install

# Start development server
npm run dev

# Run all tests (85 test cases)
npm run test

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── domain/                 # Domain model (FileSystemNode hierarchy)
│   ├── FileSystemNode.ts
│   ├── Directory.ts
│   ├── File.ts
│   ├── TextFile.ts
│   ├── ImageFile.ts
│   ├── WordDocument.ts
│   └── IFileSystemVisitor.ts
├── services/
│   ├── exporters/
│   │   ├── BaseExporterTemplate.ts   # Template Method base class
│   │   ├── JSONExporter.ts
│   │   └── MarkdownExporter.ts
│   └── FileSystemXmlExporter.ts      # Refactored to extend BaseExporterTemplate
└── components/
    ├── FileTreeView.tsx
    └── TreeNodeItem.tsx
```

---

## Design Patterns

### Visitor Pattern
`IFileSystemVisitor` defines `visitDirectory()` and `visitFile()`. Each node type calls `accept(visitor)`, allowing exporters to process the tree without modifying domain classes.

### Template Method Pattern
`BaseExporterTemplate` implements the fixed traversal algorithm in `visitDirectory()`, and declares abstract hook methods (`getHeader`, `escape`, `renderLeaf`, `renderDirOpen`, `renderDirClose`) that subclasses override to produce different output formats.

```
BaseExporterTemplate (abstract)
├── FileSystemXmlExporter  → XML output
├── JSONExporter           → JSON output
└── MarkdownExporter       → Markdown output
```

---

## License

MIT
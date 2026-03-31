import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileTreeView } from "../../src/components/FileTreeView";
import { buildSampleTree } from "../../src/data/sampleData";
import { Directory } from "../../src/domain/Directory";
import { WordDocument } from "../../src/domain/WordDocument";
import { TextFile } from "../../src/domain/TextFile";

describe("FileTreeView", () => {
  it("渲染根目錄名稱", () => {
    const root = buildSampleTree();
    render(<FileTreeView root={root} />);
    expect(screen.getByText(/根目錄/)).toBeInTheDocument();
  });

  it("渲染所有頂層子節點", () => {
    const root = buildSampleTree();
    render(<FileTreeView root={root} />);
    expect(screen.getByText(/專案文件/)).toBeInTheDocument();
    expect(screen.getByText(/設定檔/)).toBeInTheDocument();
    expect(screen.getByText(/專案計畫\.docx/)).toBeInTheDocument();
  });

  it("預設展開，可見深層節點", () => {
    const root = buildSampleTree();
    render(<FileTreeView root={root} />);
    expect(screen.getByText(/需求規格\.docx/)).toBeInTheDocument();
    expect(screen.getByText(/架構圖\.png/)).toBeInTheDocument();
  });

  it("點擊目錄可收合，子節點消失", () => {
    const root = buildSampleTree();
    render(<FileTreeView root={root} />);

    const docsDirText = screen.getByText(/專案文件/);
    expect(screen.getByText(/需求規格\.docx/)).toBeInTheDocument();

    fireEvent.click(docsDirText);
    expect(screen.queryByText(/需求規格\.docx/)).not.toBeInTheDocument();
  });

  it("收合後再點擊可重新展開", () => {
    const root = buildSampleTree();
    render(<FileTreeView root={root} />);

    const docsDirText = screen.getByText(/專案文件/);
    fireEvent.click(docsDirText);
    expect(screen.queryByText(/需求規格\.docx/)).not.toBeInTheDocument();

    fireEvent.click(docsDirText);
    expect(screen.getByText(/需求規格\.docx/)).toBeInTheDocument();
  });

  it("空目錄可正常渲染", () => {
    const emptyRoot = new Directory("空目錄");
    render(<FileTreeView root={emptyRoot} />);
    expect(screen.getByText(/空目錄/)).toBeInTheDocument();
  });

  it("單一檔案的目錄可正常渲染", () => {
    const dir = new Directory("單檔目錄");
    dir.addChild(new WordDocument("only.docx", 10, new Date("2026-01-01"), 1));
    render(<FileTreeView root={dir} />);
    expect(screen.getByText(/only\.docx/)).toBeInTheDocument();
  });
});

describe("FileTreeView — onSelect 選取機制", () => {
  it("點擊檔案節點時 onSelect callback 被呼叫，帶正確 node 與 parent", () => {
    const onSelect = vi.fn();
    const root = new Directory("root");
    const file = new TextFile("hello.txt", 10, new Date("2026-01-01"), "UTF-8");
    root.addChild(file);
    render(<FileTreeView root={root} onSelect={onSelect} />);

    fireEvent.click(screen.getByText(/hello\.txt/));
    expect(onSelect).toHaveBeenCalledOnce();
    const [calledNode, calledParent] = onSelect.mock.calls[0];
    expect(calledNode).toBe(file);
    expect(calledParent).toBe(root);
  });

  it("點擊目錄節點時 onSelect callback 被呼叫", () => {
    const onSelect = vi.fn();
    const root = new Directory("root");
    const subDir = new Directory("sub");
    root.addChild(subDir);
    render(<FileTreeView root={root} onSelect={onSelect} />);

    fireEvent.click(screen.getByText(/sub/));
    expect(onSelect).toHaveBeenCalledOnce();
    const [calledNode] = onSelect.mock.calls[0];
    expect(calledNode).toBe(subDir);
  });
});

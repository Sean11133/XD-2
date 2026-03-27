import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileTreeView } from "../../src/components/FileTreeView";
import { buildSampleTree } from "../../src/data/sampleData";
import { Directory } from "../../src/domain/Directory";
import { WordDocument } from "../../src/domain/WordDocument";

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

import { describe, it, expect } from "vitest";
import { buildSampleTree } from "../../src/data/sampleData";
import { Directory } from "../../src/domain/Directory";
import { WordDocument } from "../../src/domain/WordDocument";
import { ImageFile } from "../../src/domain/ImageFile";
import { TextFile } from "../../src/domain/TextFile";

describe("buildSampleTree", () => {
  it("回傳 Directory 實例", () => {
    const root = buildSampleTree();
    expect(root).toBeInstanceOf(Directory);
  });

  it("根目錄名稱為「根目錄」", () => {
    const root = buildSampleTree();
    expect(root.name).toBe("根目錄");
  });

  it("根目錄包含 3 個 children（專案文件、設定檔、專案計畫.docx）", () => {
    const root = buildSampleTree();
    expect(root.getChildren()).toHaveLength(3);
  });

  it("「專案文件」子目錄包含 3 個 children（2檔案+1目錄）", () => {
    const root = buildSampleTree();
    const projectDocs = root.getChildren()[0] as Directory;
    expect(projectDocs.name).toBe("專案文件");
    expect(projectDocs.getChildren()).toHaveLength(3);
  });

  it("「設計圖」子目錄包含 2 個 ImageFile", () => {
    const root = buildSampleTree();
    const projectDocs = root.getChildren()[0] as Directory;
    const designDir = projectDocs.getChildren()[2] as Directory;
    expect(designDir.name).toBe("設計圖");
    expect(designDir.getChildren()).toHaveLength(2);
    expect(designDir.getChildren()[0]).toBeInstanceOf(ImageFile);
    expect(designDir.getChildren()[1]).toBeInstanceOf(ImageFile);
  });

  it("「設定檔」子目錄包含 2 個 TextFile", () => {
    const root = buildSampleTree();
    const configDir = root.getChildren()[1] as Directory;
    expect(configDir.name).toBe("設定檔");
    expect(configDir.getChildren()).toHaveLength(2);
    expect(configDir.getChildren()[0]).toBeInstanceOf(TextFile);
    expect(configDir.getChildren()[1]).toBeInstanceOf(TextFile);
  });

  it("根目錄第三個節點為 WordDocument（專案計畫.docx）", () => {
    const root = buildSampleTree();
    const plan = root.getChildren()[2];
    expect(plan).toBeInstanceOf(WordDocument);
    expect((plan as WordDocument).fileName).toBe("專案計畫.docx");
  });

  it("架構圖.png 尺寸為 1920×1080", () => {
    const root = buildSampleTree();
    const projectDocs = root.getChildren()[0] as Directory;
    const designDir = projectDocs.getChildren()[2] as Directory;
    const arch = designDir.getChildren()[0] as ImageFile;
    expect(arch.width).toBe(1920);
    expect(arch.height).toBe(1080);
  });
});

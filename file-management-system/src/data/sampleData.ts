import { Directory } from "../domain/Directory";
import { WordDocument } from "../domain/WordDocument";
import { ImageFile } from "../domain/ImageFile";
import { TextFile } from "../domain/TextFile";

export function buildSampleTree(): Directory {
  // 根目錄
  const root = new Directory("根目錄");

  // 專案文件
  const projectDocs = new Directory("專案文件");
  projectDocs.addChild(
    new WordDocument("需求規格.docx", 245, new Date("2026-03-20"), 12),
  );
  projectDocs.addChild(
    new WordDocument("會議紀錄.docx", 89, new Date("2026-03-22"), 3),
  );

  const designDir = new Directory("設計圖");
  designDir.addChild(
    new ImageFile("架構圖.png", 1024, new Date("2026-03-21"), 1920, 1080),
  );
  designDir.addChild(
    new ImageFile("流程圖.jpg", 512, new Date("2026-03-23"), 800, 600),
  );
  projectDocs.addChild(designDir);

  // 設定檔
  const configDir = new Directory("設定檔");
  configDir.addChild(
    new TextFile("config.txt", 2, new Date("2026-03-15"), "UTF-8"),
  );
  configDir.addChild(
    new TextFile("readme.txt", 5, new Date("2026-03-18"), "UTF-8"),
  );

  root.addChild(projectDocs);
  root.addChild(configDir);
  root.addChild(
    new WordDocument("專案計畫.docx", 320, new Date("2026-03-10"), 25),
  );

  return root;
}

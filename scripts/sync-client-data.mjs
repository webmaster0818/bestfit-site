// モバイル最適化: 大容量データをHTML同梱からクライアントfetchへ分離するため、
// data/ 内の対象JSONを public/data/ へ同期する(ビルド時に自動実行)
import fs from "node:fs";
import path from "node:path";

const targets = ["curves-stores.json", "search-index.json"];
const srcDir = path.join(process.cwd(), "data");
const dstDir = path.join(process.cwd(), "public", "data");
fs.mkdirSync(dstDir, { recursive: true });
for (const f of targets) {
  fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f));
  console.log(`synced public/data/${f}`);
}

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

// 軽量化(2026-11-08): AI診断コンシェルジュの店舗データ。HTML/RSC同梱をやめGymConciergeが自前でfetchする。
// 内容は data/concierge-stores.json と同一(空白のみ除去して転送量を削減)
{
  const f = "concierge-stores.json";
  const data = JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf-8"));
  fs.writeFileSync(path.join(dstDir, f), JSON.stringify(data));
  console.log(`synced public/data/${f} (minified)`);
}

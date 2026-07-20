import type { Metadata } from "next";
import { Suspense } from "react";
import fs from "node:fs";
import path from "node:path";
import SearchResults from "./SearchResults";

export const metadata: Metadata = {
  title: "条件検索｜パーソナルジム専門の比較・口コミサイト｜BEST-FIT",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  const dataDir = path.join(process.cwd(), "data");
  // モバイル最適化: 検索インデックス(約840KB)はHTML同梱をやめSearchResults側でfetch
  const features = JSON.parse(fs.readFileSync(path.join(dataDir, "features-catalog.json"), "utf-8"));
  const areas = JSON.parse(fs.readFileSync(path.join(dataDir, "areas-tree.json"), "utf-8"));
  return (
    <Suspense>
      <SearchResults features={features} areas={areas} />
    </Suspense>
  );
}

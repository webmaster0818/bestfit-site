import type { Metadata } from "next";
import { Suspense } from "react";
import fs from "node:fs";
import path from "node:path";
import SearchResults from "./SearchResults";

export const metadata: Metadata = {
  title: "条件検索｜パーソナルジム専門の比較・口コミサイト｜BEST-FIT",
  description: "エリア・こだわり条件を組み合わせて、BEST-FITに掲載中のパーソナルジムを検索できます。",
  alternates: { canonical: "/gyms/search" },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  const dataDir = path.join(process.cwd(), "data");
  // モバイル最適化: 検索インデックス(約840KB)はHTML同梱をやめSearchResults側でfetch
  const features = JSON.parse(fs.readFileSync(path.join(dataDir, "features-catalog.json"), "utf-8"));
  const areas = JSON.parse(fs.readFileSync(path.join(dataDir, "areas-tree.json"), "utf-8"));
  return (
    // 静的書き出しでは検索結果(クライアント側)が描画されないため、読み込み中の見出しを h1 として出す
    <Suspense fallback={<h1 className="max-w-5xl mx-auto px-4 py-10 text-2xl font-extrabold">パーソナルジムの条件検索</h1>}>
      <SearchResults features={features} areas={areas} />
    </Suspense>
  );
}

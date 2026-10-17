import type { MetadataRoute } from "next";
import { articleGyms, listCanonicalMap, resolveListPage, stores, urlMeta } from "@/lib/data";
// 記事の本文データの最終コミット日(scripts/gen-article-lastmod.py で生成・2026-10-17)
import articleLastmod from "@/data/article-lastmod.json";

// ローンチ後の本番ドメイン基準でサイトマップを生成（urls-meta.json＝全公開ページ）。
// robotsがnoindexのものは除外（現状noindexは/gyms/searchの動的ルートのみでurls-meta外のため実質全件index）。
export const dynamic = "force-static";

const BASE = "https://fit-best.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const um = urlMeta() as Record<string, { canonical?: string; robots?: string }>;
  const entries: MetadataRoute.Sitemap = [];
  for (const [p, v] of Object.entries(um)) {
    if ((v?.robots || "").includes("noindex")) continue;
    if (/^\/gyms\/list\/(.+\/)?tag-\w+$/.test(p)) continue;
    if (p.startsWith("/gyms/list/") && resolveListPage(p.slice("/gyms/list/".length).split("/")).stores.length === 0) continue; // 掲載0件(noindex)
    if (listCanonicalMap()[p]) continue; // canonical をエリア記事に寄せた一覧は載せない(公開前チェック[6e]) // feature 一覧へ301で統合(lib/data.ts featurePathForTag)
    const url =
      v?.canonical && v.canonical.startsWith("http")
        ? v.canonical
        : `${BASE}${p === "/" ? "" : p}`;
    const lastmod = (articleLastmod as Record<string, string>)[p];
    entries.push({
      url,
      ...(lastmod ? { lastModified: lastmod } : {}),
      changeFrequency: p === "/" ? "daily" : "weekly",
      priority:
        p === "/"
          ? 1
          : p.startsWith("/articles/")
            ? 0.8
            : p.split("/").filter(Boolean).length <= 2
              ? 0.7
              : 0.6,
    });
  }
  // urls-meta.json に無い店舗ページ(後から足した店舗)と /gyms/list も載せる(2026-10-15・公開前チェック[6c])
  for (const p of [...Object.keys(stores()), "/gyms/list"]) {
    if (um[p]) continue;
    entries.push({ url: `${BASE}${p}`, changeFrequency: "weekly", priority: 0.6 });
  }
  // エリア記事掲載ジムの詳細ページ(記事由来・/gyms/listed/)
  for (const slug of Object.keys(articleGyms().listed)) {
    entries.push({ url: `${BASE}/gyms/listed/${slug}`, changeFrequency: "weekly", priority: 0.5 });
  }
  return entries;
}

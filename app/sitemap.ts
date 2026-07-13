import type { MetadataRoute } from "next";
import { urlMeta } from "@/lib/data";

// ローンチ後の本番ドメイン基準でサイトマップを生成（urls-meta.json＝全公開ページ）。
// robotsがnoindexのものは除外（現状noindexは/gyms/searchの動的ルートのみでurls-meta外のため実質全件index）。
export const dynamic = "force-static";

const BASE = "https://dunlopsportsclub.jp";

export default function sitemap(): MetadataRoute.Sitemap {
  const um = urlMeta() as Record<string, { canonical?: string; robots?: string }>;
  const entries: MetadataRoute.Sitemap = [];
  for (const [p, v] of Object.entries(um)) {
    if ((v?.robots || "").includes("noindex")) continue;
    const url =
      v?.canonical && v.canonical.startsWith("http")
        ? v.canonical
        : `${BASE}${p === "/" ? "" : p}`;
    entries.push({
      url,
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
  return entries;
}

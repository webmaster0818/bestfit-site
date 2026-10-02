import type { MetadataRoute } from "next";

// ローンチ用robots.txt。全ページクロール許可＋sitemap参照。
// noindex制御は各ページのmetadata（/gyms/searchのnoindex等）で行うため、ここでは広く許可する。
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://fit-best.com/sitemap.xml",
    host: "https://fit-best.com",
  };
}

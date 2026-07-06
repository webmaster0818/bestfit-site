import type { Metadata } from "next";
import Link from "next/link";
import { listPaths, metaFor, resolveListPage, brands, refineLinks } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return listPaths()
    .filter((p) => p !== "/gyms/list")
    .map((p) => ({ segs: p.replace("/gyms/list/", "").split("/") }));
}

function pagePath(segs: string[]) {
  return `/gyms/list/${segs.join("/")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ segs: string[] }> }): Promise<Metadata> {
  const { segs } = await params;
  const m = metaFor(pagePath(segs));
  if (!m) return {};
  return { title: { absolute: m.title }, description: m.desc, alternates: { canonical: pagePath(segs) } };
}

export default async function ListPage({ params }: { params: Promise<{ segs: string[] }> }) {
  const { segs } = await params;
  const p = pagePath(segs);
  const m = metaFor(p);
  const { labels, stores: hits } = resolveListPage(segs);
  const parts = [labels.pref, labels.city, labels.ward, labels.feature].filter(Boolean) as string[];
  // 「千葉県」+「千葉県千葉市」のような包含重複を除去
  const deduped = parts.filter((x, i) => !parts.some((y, j) => j > i && y.includes(x)));
  const labelText = deduped.join("・");
  const brandMap = Object.values(brands());

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://dunlopsportsclub.jp" },
      { "@type": "ListItem", position: 2, name: "ジムを探す", item: "https://dunlopsportsclub.jp/gyms/list" },
      { "@type": "ListItem", position: 3, name: labelText, item: `https://dunlopsportsclub.jp${p}` },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/gyms/list" className="hover:underline">ジムを探す</Link> › {labelText}
      </nav>
      <h1 className="text-xl md:text-2xl font-extrabold mb-2">{`「${labelText}」のパーソナルジム検索結果`}</h1>
      <p className="text-sm text-gray-500 mb-5">{hits.length}件のパーソナルジムが見つかりました</p>

      {(() => {
        const refs = refineLinks(segs);
        if (!refs.length) return null;
        const areas = refs.filter((r) => r.kind !== "feature");
        const feats = refs.filter((r) => r.kind === "feature");
        return (
          <div className="bf-card p-4 mb-8">
            {areas.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-extrabold mb-2" style={{ color: "var(--bf-ink)" }}>エリアでさらに絞り込む</p>
                <div className="flex flex-wrap gap-1.5">
                  {areas.map((r) => (
                    <Link key={r.href} href={r.href} className="bf-chip-link">{r.label}</Link>
                  ))}
                </div>
              </div>
            )}
            {feats.length > 0 && (
              <div>
                <p className="text-xs font-extrabold mb-2" style={{ color: "var(--bf-ink)" }}>条件でさらに絞り込む</p>
                <div className="flex flex-wrap gap-1.5">
                  {feats.map((r) => (
                    <Link key={r.href} href={r.href} className="bf-chip-link">{r.label}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="space-y-4">
        {hits.map(([path, s]) => {
          const b = brandMap.find((x) => x.brandId === s.brandId);
          const minPlan = (Array.isArray(s.pricePlans) ? s.pricePlans : [])
            .filter((pl: any) => typeof pl.price === "number")
            .sort((a: any, c: any) => a.price - c.price)[0];
          return (
            <div key={path} className="bf-card bf-card-hover p-5">
              <h2 className="font-bold text-lg">
                <Link href={path} className="hover:underline" style={{ color: "var(--bf-primary)" }}>
                  {b?.name || ""} {s.name}
                </Link>
              </h2>
              {s.catchcopy && <p className="text-xs text-gray-500 mt-1">{s.catchcopy}</p>}
              <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                {s.address && <p>📍 {s.address}</p>}
                {s.access && <p>🚉 {s.access}</p>}
                {minPlan && <p>💰 <span className="bf-price">{minPlan.price.toLocaleString()}円〜</span>（{minPlan.name}）</p>}
              </div>
            </div>
          );
        })}
        {hits.length === 0 && (
          <p className="text-sm text-gray-500">条件に一致するジムが見つかりませんでした。</p>
        )}
      </div>
    </div>
  );
}

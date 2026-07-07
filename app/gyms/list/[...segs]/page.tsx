import type { Metadata } from "next";
import Link from "next/link";
import { listPaths, metaFor, resolveListPage, brands, refineLinks } from "@/lib/data";
import { IcoPin, IcoTrain, IcoYen, IcoChevron } from "@/components/Ico";
import PageHero from "@/components/PageHero";
import { planPriceLabel } from "@/lib/data";

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
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <PageHero
        eyebrow="PERSONAL GYM SEARCH"
        title={`「${labelText}」のパーソナルジム検索結果`}
        subtitle={`${hits.length}件のパーソナルジムが見つかりました`}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-5">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/gyms/list" className="hover:underline">ジムを探す</Link> › {labelText}
      </nav>

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
          const feats: any[] = Array.isArray(s.features) ? s.features : [];
          return (
            <Link key={path} href={path} className="bf-card bf-card-hover p-5 block group relative">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-extrabold text-lg leading-snug group-hover:underline" style={{ color: "var(--bf-primary)" }}>
                    {b?.name || ""} {s.name}
                  </h2>
                  {s.catchcopy && <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--bf-muted)" }}>{s.catchcopy}</p>}
                </div>
                {minPlan && (
                  <div className="shrink-0 text-right rounded-lg px-3 py-1.5" style={{ background: "var(--bf-primary-soft)" }}>
                    <p className="text-[10px] font-bold" style={{ color: "var(--bf-muted)" }}>最安プラン（{planPriceLabel(minPlan)}）</p>
                    <p className="bf-price text-base leading-tight">{minPlan.price.toLocaleString()}<span className="text-[10px]">円〜</span></p>
                  </div>
                )}
              </div>
              <div className="text-[13px] mt-3 space-y-1.5" style={{ color: "#475569" }}>
                {s.address && <p className="flex items-start gap-1.5"><IcoPin className="mt-1 shrink-0 text-[13px]" /><span>{s.address}</span></p>}
                {s.access && <p className="flex items-start gap-1.5"><IcoTrain className="mt-1 shrink-0 text-[13px]" /><span>{s.access}</span></p>}
              </div>
              {feats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {feats.slice(0, 4).map((f: any) => f?.name && <span key={f.id} className="bf-chip">{f.name}</span>)}
                </div>
              )}
              <span className="absolute bottom-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm group-hover:translate-x-0.5 transition-transform" style={{ background: "var(--bf-primary)" }}><IcoChevron /></span>
            </Link>
          );
        })}
        {hits.length === 0 && (
          <p className="text-sm text-gray-500">条件に一致するジムが見つかりませんでした。</p>
        )}
      </div>
      </div>
    </div>
  );
}

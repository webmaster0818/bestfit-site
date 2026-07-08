import type { Metadata } from "next";
import Link from "next/link";
import { listPaths, metaFor, resolveListPage, brands, refineLinks, listCanonicalMap, storeReviews } from "@/lib/data";
import { IcoPin, IcoTrain, IcoYen, IcoChevron, IcoClock } from "@/components/Ico";
import PageHero from "@/components/PageHero";
import DistanceSort from "@/components/DistanceSort";
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
  const p = pagePath(segs);
  const m = metaFor(p);
  const { labels, stores: hits } = resolveListPage(segs);
  // 地域ラベルは最深のもの（ward/city）が上位（県名）を内包するため最深のみ採用
  const area = labels.ward || labels.city || labels.pref || "";
  const cond = [labels.feature, labels.tag].filter(Boolean).join("・");
  const label = [area, cond].filter(Boolean).join("・");
  if (label && hits.length > 0) {
    const head = cond && area ? `${area}の${cond}パーソナルジム` : cond ? `${cond}のパーソナルジム` : `${area}のパーソナルジム`;
    const canonUrl = listCanonicalMap()[p] ? `https://dunlopsportsclub.jp${listCanonicalMap()[p]}` : p;
    const title = `${head}${hits.length >= 2 ? `おすすめ${hits.length}選` : ""}｜料金比較・口コミ｜BEST-FIT`;
    const desc = `${label}で探せるパーソナルジム${hits.length}件を、料金プラン・アクセス・こだわり条件で比較できます。最安プランや無料カウンセリングの有無もひと目でチェック。あなたに合う一軒が見つかるBEST-FITの検索結果です。`;
    return { title: { absolute: title }, description: desc, alternates: { canonical: canonUrl } };
  }
  if (!m) return {};
  const canonUrl2 = listCanonicalMap()[p] ? `https://dunlopsportsclub.jp${listCanonicalMap()[p]}` : p;
  return { title: { absolute: m.title }, description: m.desc, alternates: { canonical: canonUrl2 } };
}

export default async function ListPage({ params }: { params: Promise<{ segs: string[] }> }) {
  const { segs } = await params;
  const p = pagePath(segs);
  const m = metaFor(p);
  const { labels, stores: hits } = resolveListPage(segs);
  const parts = [labels.pref, labels.city, labels.ward, labels.feature, labels.tag].filter(Boolean) as string[];
  // 「千葉県」+「千葉県千葉市」のような包含重複を除去
  const deduped = parts.filter((x, i) => !parts.some((y, j) => j > i && y.includes(x)));
  const labelText = deduped.join("・");
  const brandMap = Object.values(brands());
  const reviews = storeReviews();

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

      {hits.length >= 2 && <DistanceSort containerId="gym-list" />}
      <div className="space-y-4" id="gym-list">
        {hits.map(([path, s]) => {
          const b = brandMap.find((x) => x.brandId === s.brandId);
          const rev = reviews[path];
          const plans = (Array.isArray(s.pricePlans) ? s.pricePlans : []).filter((pl: any) => typeof pl.price === "number" && pl.price > 0);
          const minPlan = [...plans].sort((a: any, c: any) => a.price - c.price)[0];
          // 1回あたり最安(回数のあるプラン)
          const perList = plans
            .map((pl: any) => { const sc = pl.sessionCount ? Number(String(pl.sessionCount).replace(/[^0-9]/g, "")) : 0; return sc > 0 ? { per: Math.round(pl.price / sc), sc } : null; })
            .filter(Boolean) as { per: number; sc: number }[];
          const minPer = perList.sort((a, b) => a.per - b.per)[0];
          // 入会金(0=無料)
          const joinFees = plans.map((pl: any) => pl.membershipFee).filter((n: any) => typeof n === "number");
          const freeJoin = joinFees.length > 0 && Math.min(...joinFees) === 0;
          // 営業時間から早朝/夜間判定
          const oh: string = s.openingHours || "";
          const times = [...oh.matchAll(/(\d{1,2}):\d{2}/g)].map((m) => Number(m[1]));
          const opensEarly = times.length > 0 && Math.min(...times) <= 7;
          const closesLate = times.length > 0 && Math.max(...times) >= 22;
          const feats: any[] = Array.isArray(s.features) ? s.features : [];
          const featNames = feats.map((f: any) => f?.name).filter(Boolean) as string[];
          const hasTrial = featNames.includes("トライアルプラン");
          // 絞り込み中の条件(feature/tag)にマッチするか→先頭に✓表示
          const activeCond = [labels.feature, labels.tag].filter(Boolean) as string[];
          const sortedFeats = [...featNames].sort((a, b) => (activeCond.includes(b) ? 1 : 0) - (activeCond.includes(a) ? 1 : 0));
          return (
            <Link key={path} href={path} className="bf-card bf-card-hover p-5 block group relative" data-lat={rev?.lat ?? undefined} data-lng={rev?.lng ?? undefined}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-extrabold text-lg leading-snug group-hover:underline" style={{ color: "var(--bf-primary)" }}>
                    {b?.name || ""} {s.name}
                  </h2>
                  {rev?.rating != null && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#f59e0b" }}>
                      <span>{"★".repeat(Math.round(rev.rating))}<span style={{ color: "#d1d5db" }}>{"★".repeat(5 - Math.round(rev.rating))}</span></span>
                      <span className="font-bold" style={{ color: "var(--bf-ink)" }}>{rev.rating.toFixed(1)}</span>
                      {rev.count != null && <span style={{ color: "var(--bf-muted)" }}>（{rev.count}件）</span>}
                    </p>
                  )}
                  {s.catchcopy && <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--bf-muted)" }}>{s.catchcopy}</p>}
                </div>
                {minPlan && (
                  <div className="shrink-0 text-right rounded-lg px-3 py-1.5" style={{ background: "var(--bf-primary-soft)" }}>
                    {minPer ? (
                      <>
                        <p className="text-[10px] font-bold" style={{ color: "var(--bf-muted)" }}>1回あたり（{minPer.sc}回換算）</p>
                        <p className="bf-price text-base leading-tight">{minPer.per.toLocaleString()}<span className="text-[10px]">円〜</span></p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] font-bold" style={{ color: "var(--bf-muted)" }}>最安プラン（{planPriceLabel(minPlan)}）</p>
                        <p className="bf-price text-base leading-tight">{minPlan.price.toLocaleString()}<span className="text-[10px]">円〜</span></p>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* 訴求バッジ */}
              {(freeJoin || hasTrial || closesLate || opensEarly) && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {freeJoin && <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: "#fef2f2", color: "#dc2626" }}>入会金無料</span>}
                  {hasTrial && <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: "#ecfdf5", color: "#059669" }}>無料体験あり</span>}
                  {closesLate && <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: "#eff6ff", color: "#2563eb" }}>夜間OK</span>}
                  {opensEarly && <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: "#eff6ff", color: "#2563eb" }}>早朝OK</span>}
                </div>
              )}
              <div className="text-[13px] mt-3 space-y-1.5" style={{ color: "#475569" }}>
                {s.access && <p className="flex items-start gap-1.5"><IcoTrain className="mt-1 shrink-0 text-[13px]" /><span>{s.access}<span data-dist className="ml-1 font-bold" style={{ color: "var(--bf-primary)" }} /></span></p>}
                {s.openingHours && <p className="flex items-start gap-1.5"><IcoClock className="mt-1 shrink-0 text-[13px]" /><span>{s.openingHours.split("\n")[0]}</span></p>}
                {s.address && <p className="flex items-start gap-1.5"><IcoPin className="mt-1 shrink-0 text-[13px]" /><span className="line-clamp-1">{s.address}</span></p>}
              </div>
              {sortedFeats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {sortedFeats.slice(0, 4).map((name) => (
                    <span key={name} className="bf-chip" style={activeCond.includes(name) ? { background: "var(--bf-primary)", color: "#fff" } : undefined}>
                      {activeCond.includes(name) ? `✓ ${name}` : name}
                    </span>
                  ))}
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

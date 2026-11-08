import type { Metadata } from "next";
import Link from "next/link";
import { listPaths, metaFor, resolveListPage, brands, refineLinks, listCanonicalMap, storeReviews } from "@/lib/data";
import { IcoSprite } from "@/components/Ico";
import PageHero from "@/components/PageHero";
import DistanceSort from "@/components/DistanceSort";
import { planPriceLabel } from "@/lib/data";

// data/place-reviews.json の評点・件数は Places API で 2026-07-08 に取得(02d673b)。再取得したらここも更新
const PLACE_REVIEWS_FETCHED = "2026年7月8日";

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
    const canonUrl = listCanonicalMap()[p] ? `https://fit-best.com${listCanonicalMap()[p]}` : p;
    const title = `${head}${hits.length >= 2 ? `おすすめ${hits.length}選` : ""}｜料金比較・口コミ｜BEST-FIT`;
    const desc = `${label}で探せるパーソナルジム${hits.length}件を、料金プラン・アクセス・こだわり条件で比較できます。最安プランや無料カウンセリングの有無もあわせてご確認いただけます。`;
    return { title: { absolute: title }, description: desc, alternates: { canonical: canonUrl } };
  }
  // 閉店の除外で掲載0件になった一覧は、中身が無いので検索に出さない(2026-10-15)
  if (hits.length === 0) return { title: { absolute: m?.title || `${label}の検索結果｜BEST-FIT` }, description: m?.desc || undefined, alternates: { canonical: p }, robots: { index: false, follow: true } };
  if (!m) return {};
  const canonUrl2 = listCanonicalMap()[p] ? `https://fit-best.com${listCanonicalMap()[p]}` : p;
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
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://fit-best.com" },
      { "@type": "ListItem", position: 2, name: "ジムを探す", item: "https://fit-best.com/gyms/list" },
      { "@type": "ListItem", position: 3, name: labelText, item: `https://fit-best.com${p}` },
    ],
  };

  // S3: ItemList schema(一覧のリッチリザルト機会)
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${labelText}のパーソナルジム一覧`,
    numberOfItems: hits.length,
    itemListElement: hits.map(([path, s]: [string, any], i: number) => {
      const b = brandMap.find((x) => x.brandId === s.brandId);
      return {
        "@type": "ListItem",
        position: i + 1,
        name: `${b?.name || ""} ${s.name}`.trim(),
        url: `https://fit-best.com${path}`,
      };
    }),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {hits.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}
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

      {/* 一覧カード用アイコンのSVGスプライト(形状は components/Ico.tsx と同一)。各カードは<use>で参照 */}
      {hits.length > 0 && <IcoSprite />}
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
            <Link key={path} href={path} className="bf-card bf-card-hover group glc" data-lat={rev?.lat ?? undefined} data-lng={rev?.lng ?? undefined}>
              {/* 軽量化(2026-11-08): class/styleはglobals.cssの.glc-*に集約・アイコンはSVGスプライト参照(表示内容・見た目は不変) */}
              <div className="glc-top">
                <div className="min-w-0">
                  <h2 className="glc-name">
                    {`${b?.name || ""} ${s.name}`}
                  </h2>
                  {rev?.rating != null && (
                    <p className="glc-rv">
                      <span className="glc-rvl">Googleマップ</span>
                      <span>{"★".repeat(Math.round(rev.rating))}<span className="glc-off">{"★".repeat(5 - Math.round(rev.rating))}</span></span>
                      <span className="glc-rvn">{rev.rating.toFixed(1)}</span>
                      <span className="glc-mu">{`（${rev.count != null ? `${rev.count}件・` : ""}${PLACE_REVIEWS_FETCHED}取得）`}</span>
                    </p>
                  )}
                  {s.catchcopy && <p className="glc-cc">{s.catchcopy}</p>}
                </div>
                {minPlan && (
                  <div className="glc-pr">
                    {minPer ? (
                      <>
                        <p className="glc-prl">{`1回あたり（${minPer.sc}回換算）`}</p>
                        <p className="bf-price glc-prv">{minPer.per.toLocaleString()}<span className="glc-u">円〜</span></p>
                      </>
                    ) : (
                      <>
                        <p className="glc-prl">{`最安プラン（${planPriceLabel(minPlan)}）`}</p>
                        <p className="bf-price glc-prv">{minPlan.price.toLocaleString()}<span className="glc-u">円〜</span></p>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* 訴求バッジ */}
              {(freeJoin || hasTrial || closesLate || opensEarly) && (
                <div className="glc-bdg">
                  {freeJoin && <span className="glc-b1">入会金無料</span>}
                  {hasTrial && <span className="glc-b2">無料体験あり</span>}
                  {closesLate && <span className="glc-b3">夜間OK</span>}
                  {opensEarly && <span className="glc-b3">早朝OK</span>}
                </div>
              )}
              <div className="glc-info">
                {s.access && <p className="glc-row"><svg className="glc-ic" aria-hidden><use href="#bfi-train" /></svg><span>{s.access}<span data-dist className="glc-dist" /></span></p>}
                {s.openingHours && <p className="glc-row"><svg className="glc-ic" aria-hidden><use href="#bfi-clock" /></svg><span>{s.openingHours.split("\n")[0]}</span></p>}
                {s.address && <p className="glc-row"><svg className="glc-ic" aria-hidden><use href="#bfi-pin" /></svg><span className="line-clamp-1">{s.address}</span></p>}
              </div>
              {sortedFeats.length > 0 && (
                <div className="glc-chips">
                  {sortedFeats.slice(0, 4).map((name) => (
                    <span key={name} className={activeCond.includes(name) ? "bf-chip glc-on" : "bf-chip"}>
                      {activeCond.includes(name) ? `✓ ${name}` : name}
                    </span>
                  ))}
                </div>
              )}
              <span className="glc-arr"><svg className="glc-i" aria-hidden><use href="#bfi-chev" /></svg></span>
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

import type { Metadata } from "next";
import Link from "next/link";
import { stores, metaFor, brands, taxonomies } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(stores())
    .map((p) => p.split("/"))
    .map((seg) => ({ brand: seg[2], store: seg[3] }));
}

function pagePath(params: { brand: string; store: string }) {
  return `/gyms/${params.brand}/${params.store}`;
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string; store: string }> }): Promise<Metadata> {
  const p = pagePath(await params);
  const m = metaFor(p);
  if (!m) return {};
  return {
    title: { absolute: m.title },
    description: m.desc,
    alternates: m.canonical ? { canonical: m.canonical } : undefined,
  };
}

const yen = (n: number | null | undefined) =>
  typeof n === "number" ? `${n.toLocaleString()}円` : "—";

export default async function StorePage({ params }: { params: Promise<{ brand: string; store: string }> }) {
  const prm = await params;
  const p = pagePath(prm);
  const s = stores()[p];
  const m = metaFor(p);
  const tax = taxonomies();
  const brand = Object.values(brands()).find((b) => b.slug.toLowerCase() === prm.brand.toLowerCase());
  const plans: any[] = Array.isArray(s.pricePlans) ? s.pricePlans : [];
  const features: any[] = Array.isArray(s.features) ? s.features : [];
  const nearby: any[] = Array.isArray(s.nearbyStores) ? s.nearbyStores : [];
  const minPlan = plans.filter((pl) => typeof pl.price === "number" && pl.price > 0).sort((a, c) => a.price - c.price)[0];
  const prefName = s.prefectureId ? tax.pref[s.prefectureId] : undefined;
  const cityName = s.cityId ? tax.city[s.cityId] : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    name: `${brand?.name || ""} ${s.name}`.trim(),
    ...(s.address ? { address: s.address } : {}),
    ...(s.telephoneNumber ? { telephone: s.telephoneNumber } : {}),
    ...(s.openingHours ? { openingHours: s.openingHours } : {}),
    url: `https://dunlopsportsclub.jp${p}`,
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-xs mb-5" style={{ color: "var(--bf-muted)" }}>
        <Link href="/" className="hover:underline">ホーム</Link>
        <span className="mx-1">›</span>
        {s.prefectureId && <><Link href={`/gyms/list/pref-${s.prefectureId}`} className="hover:underline">{prefName}</Link><span className="mx-1">›</span></>}
        {s.prefectureId && s.cityId && <><Link href={`/gyms/list/pref-${s.prefectureId}/city-${s.cityId}`} className="hover:underline">{cityName}</Link><span className="mx-1">›</span></>}
        <span>{brand?.name} {s.name}</span>
      </nav>

      {/* ヒーローカード: 結論ファースト */}
      <div className="bf-card p-6 md:p-8 mb-8" style={{ borderTop: "4px solid var(--bf-primary)" }}>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-1">{m?.h1 || `${brand?.name || ""} ${s.name}`}</h1>
        {s.catchcopy && <p className="text-sm font-bold mb-4" style={{ color: "var(--bf-primary)" }}>{s.catchcopy}</p>}
        <div className="grid sm:grid-cols-3 gap-3 mb-5 text-sm">
          <div className="rounded-lg p-3" style={{ background: "var(--bf-bg)" }}>
            <p className="text-xs mb-0.5" style={{ color: "var(--bf-muted)" }}>最安プラン</p>
            <p className="font-bold">{minPlan ? <span className="bf-price">{yen(minPlan.price)}</span> : "要問合せ"}{minPlan?.sessionCount ? <span className="text-xs font-normal">（{minPlan.sessionCount}回）</span> : null}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "var(--bf-bg)" }}>
            <p className="text-xs mb-0.5" style={{ color: "var(--bf-muted)" }}>エリア</p>
            <p className="font-bold">{[prefName, cityName].filter(Boolean).join(" ") || "—"}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "var(--bf-bg)" }}>
            <p className="text-xs mb-0.5" style={{ color: "var(--bf-muted)" }}>営業時間</p>
            <p className="font-bold text-xs leading-relaxed">{s.openingHours || "公式サイトで確認"}</p>
          </div>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {features.slice(0, 8).map((f) => f?.name && <span key={f.id} className="bf-chip">{f.name}</span>)}
          </div>
        )}
        {s.affiliateLink && (
          <div className="text-center sm:text-left">
            <a href={s.affiliateLink} rel="sponsored nofollow" target="_blank" className="bf-cta w-full sm:w-auto">
              公式サイトで無料カウンセリングを予約する
            </a>
            <p className="text-[10px] mt-2" style={{ color: "var(--bf-muted)" }}>※広告リンクを含みます</p>
          </div>
        )}
      </div>

      {s.lead && <p className="text-sm leading-relaxed mb-10" style={{ color: "#334155" }}>{s.lead}</p>}

      {plans.length > 0 && (
        <section className="mb-10">
          <h2 className="bf-h2">料金プラン</h2>
          <div className="bf-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="bf-table">
                <thead>
                  <tr>
                    <th>プラン</th>
                    <th>料金</th>
                    <th>回数</th>
                    <th>時間</th>
                    <th>入会金</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((pl) => (
                    <tr key={pl.id} style={pl.isRecommended ? { background: "var(--bf-primary-soft)" } : undefined}>
                      <td className="font-bold">{pl.name}{pl.isRecommended && <span className="ml-1 text-xs" style={{ color: "var(--bf-gold)" }}>★おすすめ</span>}</td>
                      <td className="bf-price whitespace-nowrap">{yen(pl.price)}</td>
                      <td>{pl.sessionCount ? `${pl.sessionCount}回` : "—"}</td>
                      <td>{pl.minutes ? `${pl.minutes}分` : "—"}</td>
                      <td>{yen(pl.membershipFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--bf-muted)" }}>※料金は税込表示・変更される場合があります。最新は公式サイトでご確認ください。</p>
          {s.affiliateLink && (
            <div className="text-center mt-4">
              <a href={s.affiliateLink} rel="sponsored nofollow" target="_blank" className="bf-cta-sub">料金の詳細を公式サイトで見る</a>
            </div>
          )}
        </section>
      )}

      <section className="mb-10">
        <h2 className="bf-h2">基本情報</h2>
        <div className="bf-card overflow-hidden">
          <table className="bf-table">
            <tbody>
              {[
                ["店舗名", `${brand?.name || ""} ${s.name}`],
                ["住所", s.address],
                ["アクセス", s.access],
                ["営業時間", s.openingHours],
                ["電話番号", s.telephoneNumber],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <tr key={k as string}>
                    <th className="w-28">{k}</th>
                    <td>{v as string}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {s.affiliateLink && (
        <div className="rounded-2xl p-8 text-center mb-10 text-white" style={{ background: "linear-gradient(135deg, var(--bf-primary), var(--bf-primary-deep))" }}>
          <p className="font-extrabold text-lg mb-1">{brand?.name} {s.name} が気になったら</p>
          <p className="text-sm opacity-80 mb-5">多くのパーソナルジムは無料カウンセリング・体験から始められます</p>
          <a href={s.affiliateLink} rel="sponsored nofollow" target="_blank" className="bf-cta">
            公式サイトで詳細を見る
          </a>
          <p className="text-[10px] mt-3 opacity-60">※広告リンクを含みます</p>
        </div>
      )}

      {nearby.length > 0 && (
        <section>
          <h2 className="bf-h2">近くの店舗もチェック</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {nearby.slice(0, 10).map((n, i) => {
              const b = Object.values(brands()).find((x) => x.brandId === n.brandId);
              if (!b || !n.slug) return null;
              return (
                <li key={i} className="bf-card bf-card-hover">
                  <Link href={`/gyms/${b.slug}/${n.slug}`} className="block px-4 py-3 font-semibold" style={{ color: "var(--bf-primary)" }}>
                    {b.name} {n.name} →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

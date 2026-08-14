import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import { stores, metaFor, brands, storeReviews, brandPrice } from "@/lib/data";
import { IcoPin, IcoTrain, IcoYen, IcoClock, IcoPhone, IcoStore, IcoChevron } from "@/components/Ico";
import PageHero from "@/components/PageHero";
import { planPriceLabel } from "@/lib/data";

// 現行サイト踏襲: カテゴリ別の全項目マスタ(該当=青・非該当=薄グレー表示)
const FEATURE_CATEGORIES: { en: string; ja: string; items: string[] }[] = [
  { en: "Service", ja: "サービス", items: ["月額制", "女性専用", "食事指導", "入会金不要", "通い放題", "ウォーターサーバー", "早朝深夜", "トライアルプラン", "モニタープラン"] },
  { en: "Trainer", ja: "トレーナー", items: ["女性トレーナー在籍", "トレーナー担当制", "トレーナー変動制", "トレーナー指名あり(有料)"] },
  { en: "Facility", ja: "施設", items: ["施設", "子連れOK", "駐車場", "完全個室", "半個室", "シャワー", "パウダールーム", "手ぶらOK", "シューズ預かり"] },
  { en: "Machine", ja: "トレーニング種類・器具", items: ["フリーウエイト", "チューブ", "マシン", "自重", "EMS", "加圧", "キックボクシング", "有酸素マシン", "HIIT"] },
  { en: "Nutrition coaching", ja: "食事指導", items: ["毎日", "毎食", "LINE", "専用アプリ", "食事報告必須", "食事報告自由", "食事制限管理", "厳しい制限無し", "管理栄養士", "カロリー計算", "メニューアドバイス", "レシピ提供"] },
  { en: "Purpose", ja: "トレーニング目的", items: ["ダイエット", "筋力アップ(バルクアップ)", "ボディシェイプ", "脱・リバウンド", "肩こり改善", "姿勢改善", "アンチエイジング", "健康診断の数値改善", "健康・体型維持", "運動不足解消", "ストレス発散", "産後ダイエット"] },
];
const RENTAL_ITEM_MAP: Record<string, string> = { "8CMxu7D9N8vxonZd": "ウェア", "6yWXeMc7LMI1deai": "シューズ", "rmNeHCFxvd5Sf6Jt": "タオル" };
// 行ごとの個数を揃えるための均等分割(例: 9個→3+3+3、12個→4+4+4、7個→4+3)
function balancedRows<T>(items: T[], maxPerRow = 4): T[][] {
  if (items.length === 0) return [];
  const rows = Math.ceil(items.length / maxPerRow);
  const base = Math.floor(items.length / rows);
  const extra = items.length % rows;
  const out: T[][] = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const size = base + (r < extra ? 1 : 0);
    out.push(items.slice(i, i + size));
    i += size;
  }
  return out;
}

const RENTAL_TYPES: { key: string; label: string }[] = [
  { key: "free", label: "無料" },
  { key: "paid", label: "有料" },
  { key: "unavailable", label: "レンタル不可" },
];

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
  const brand = Object.values(brands()).find((b) => b.slug.toLowerCase() === prm.brand.toLowerCase());
  // ブランド記事への逆リンク(双方向ハブ化・2026-07-31)。店舗ブランドslug→記事slugの差異を吸収
  const ARTICLE_SLUG_MAP: Record<string, string> = { katagiri: "katagirijuku", miyazakigym: "miyazaki-gym", bconcept: "b-concept", tpg: "the-personal-gym" };
  const articleSlug = ARTICLE_SLUG_MAP[prm.brand.toLowerCase()] || prm.brand.toLowerCase();
  const brandArticleHref = brandPrice(articleSlug) ? `/articles/brand/${articleSlug}` : null;
  const plans: any[] = Array.isArray(s.pricePlans) ? s.pricePlans : [];
  const features: any[] = Array.isArray(s.features) ? s.features : [];
  // 近隣店舗: CMSのnearbyStoresは全nullのため、concierge座標DBから実距離で算出(ブランド不問・4件)
  const nearby: { path: string; label: string; access: string; km: number | null }[] = (() => {
    try {
      const cs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "concierge-stores.json"), "utf-8")) as any[];
      const byPath = new Map(cs.map((x) => [x.path, x]));
      const meC = byPath.get(p);
      const validTargets = cs.filter((x) => x.path !== p && (stores() as Record<string, any>)[x.path]);
      if (meC && typeof meC.lat === "number" && typeof meC.lng === "number") {
        const R = 6371;
        const dist = (a: any, b: any) => {
          const dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
          const s2 = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(s2), Math.sqrt(1 - s2));
        };
        return validTargets
          .filter((x) => typeof x.lat === "number" && typeof x.lng === "number")
          .map((x) => ({ path: x.path, label: `${x.brand || ""} ${x.name || ""}`.trim(), access: x.access || "", km: Math.round(dist(meC, x) * 10) / 10 }))
          .sort((a, b) => (a.km ?? 999) - (b.km ?? 999))
          .slice(0, 4);
      }
      // 座標なし店舗: 同市区の店舗から4件
      const all = stores() as Record<string, any>;
      const sameArea = Object.entries(all)
        .filter(([sp, st2]) => sp !== p && (st2._wardCode ? st2._wardCode === s._wardCode : st2._cityCode === s._cityCode))
        .slice(0, 4)
        .map(([sp, st2]) => {
          const b2 = Object.values(brands()).find((x) => x.brandId === st2.brandId);
          return { path: sp, label: `${b2?.name || ""} ${st2.name || ""}`.trim(), access: st2.access || "", km: null };
        });
      return sameArea;
    } catch {
      return [];
    }
  })();
  const allStores = stores();
  const sameBrand = Object.entries(allStores)
    .filter(([path]) => path.split("/")[2] === prm.brand.toLowerCase() && path !== p)
    .slice(0, 12)
    .map(([path, st]: [string, any]) => ({ path, name: st.name, city: st._cityName as string | undefined }));
  const minPlan = plans.filter((pl) => typeof pl.price === "number" && pl.price > 0).sort((a, c) => a.price - c.price)[0];
  const prefName = s._prefName as string | undefined;
  const cityName = s._cityName as string | undefined;

  // S4: geo(Places API実測座標)とurl補完
  const placeRev = storeReviews()[p];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["ExerciseGym", "LocalBusiness"],
    name: `${brand?.name || ""} ${s.name}`.trim(),
    ...(placeRev && typeof placeRev.lat === "number" && typeof placeRev.lng === "number"
      ? { geo: { "@type": "GeoCoordinates", latitude: placeRev.lat, longitude: placeRev.lng } }
      : {}),
    ...(s.catchcopy ? { description: s.catchcopy } : {}),
    ...(s.address
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "JP",
            ...(prefName ? { addressRegion: prefName } : {}),
            ...(cityName ? { addressLocality: cityName } : {}),
            streetAddress: s.address,
          },
        }
      : {}),
    ...(s.telephoneNumber ? { telephone: s.telephoneNumber } : {}),
    ...(s.openingHours ? { openingHours: s.openingHours } : {}),
    ...(minPlan ? { priceRange: `¥${minPlan.price.toLocaleString()}〜` } : {}),
    ...(cityName ? { areaServed: cityName } : {}),
    url: `https://dunlopsportsclub.jp${p}`,
  };

  const brandCrumbLd = brandArticleHref
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://dunlopsportsclub.jp" },
          { "@type": "ListItem", position: 2, name: `${brand?.name || ""}の料金・口コミ解説`, item: `https://dunlopsportsclub.jp${brandArticleHref}` },
          { "@type": "ListItem", position: 3, name: `${brand?.name || ""} ${s.name}`.trim(), item: `https://dunlopsportsclub.jp${p}` },
        ],
      }
    : null;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://dunlopsportsclub.jp" },
      ...(s._prefCode ? [{ "@type": "ListItem", position: 2, name: prefName, item: `https://dunlopsportsclub.jp/gyms/list/pref-${s._prefCode}` }] : []),
      { "@type": "ListItem", position: s._prefCode ? 3 : 2, name: `${brand?.name || ""} ${s.name}`.trim(), item: `https://dunlopsportsclub.jp${p}` },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {brandCrumbLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandCrumbLd) }} />}
      <PageHero
        eyebrow="PERSONAL GYM"
        title={`${brand?.name || ""} ${s.name}`.trim()}
        subtitle={s.catchcopy || [prefName, cityName].filter(Boolean).join(" ")}
      />
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <nav className="text-xs mb-5" style={{ color: "var(--bf-muted)" }}>
        <Link href="/" className="hover:underline">ホーム</Link>
        <span className="mx-1">›</span>
        {s._prefCode && <><Link href={`/gyms/list/pref-${s._prefCode}`} className="hover:underline">{prefName}</Link><span className="mx-1">›</span></>}
        {s._prefCode && s._cityCode && <><Link href={`/gyms/list/pref-${s._prefCode}/city-${s._cityCode}`} className="hover:underline">{cityName}</Link><span className="mx-1">›</span></>}
        <span>{brand?.name} {s.name}</span>
      </nav>
      {brandArticleHref && (
        <nav className="text-xs -mt-3 mb-5" style={{ color: "var(--bf-muted)" }}>
          <Link href="/" className="hover:underline">ホーム</Link>
          <span className="mx-1">›</span>
          <Link href={brandArticleHref} className="hover:underline">{brand?.name}の料金・口コミ解説</Link>
          <span className="mx-1">›</span>
          <span>{brand?.name} {s.name}</span>
        </nav>
      )}

      {/* ヒーローカード: 結論ファースト */}
      <div className="bf-card p-6 md:p-8 mb-8" style={{ borderTop: "4px solid var(--bf-primary)" }}>
        <div className="grid sm:grid-cols-3 gap-3 mb-5 text-sm">
          <div className="rounded-lg p-3" style={{ background: "var(--bf-bg)" }}>
            <p className="text-xs mb-0.5 flex items-center gap-1" style={{ color: "var(--bf-muted)" }}><IcoYen className="text-xs" />最安プラン{minPlan ? `（${planPriceLabel(minPlan)}）` : ""}</p>
            <p className="font-bold">{minPlan ? <span className="bf-price">{yen(minPlan.price)}</span> : "要問合せ"}{minPlan?.sessionCount ? <span className="text-xs font-normal">（{minPlan.sessionCount}回）</span> : null}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "var(--bf-bg)" }}>
            <p className="text-xs mb-0.5 flex items-center gap-1" style={{ color: "var(--bf-muted)" }}><IcoPin className="text-xs" />エリア</p>
            <p className="font-bold">{[prefName, cityName].filter(Boolean).join(" ") || "—"}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "var(--bf-bg)" }}>
            <p className="text-xs mb-0.5 flex items-center gap-1" style={{ color: "var(--bf-muted)" }}><IcoClock className="text-xs" />営業時間</p>
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
            {s.affiliateLinkCvTag ? <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: s.affiliateLinkCvTag }} /> : null}
            <a href={s.affiliateLink} rel="sponsored nofollow" target="_blank" className="bf-cta w-full sm:w-auto">
              無料カウンセリングを申し込む
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
              <table className="bf-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>プラン</th>
                    <th className="whitespace-nowrap">料金</th>
                    <th className="whitespace-nowrap">回数</th>
                    <th className="whitespace-nowrap">時間</th>
                    <th className="whitespace-nowrap">入会金</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((pl) => (
                    <tr key={pl.id} style={pl.isRecommended ? { background: "var(--bf-primary-soft)" } : undefined}>
                      <td className="font-bold min-w-[10em]">{pl.name}{pl.isRecommended && <span className="ml-1 text-xs" style={{ color: "var(--bf-gold)" }}>★おすすめ</span>}</td>
                      <td className="bf-price whitespace-nowrap">{yen(pl.price)}</td>
                      <td className="whitespace-nowrap">{pl.sessionCount ? `${pl.sessionCount}回` : "—"}</td>
                      <td className="whitespace-nowrap">{pl.minutes ? `${pl.minutes}分` : "—"}</td>
                      <td className="whitespace-nowrap">{yen(pl.membershipFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {plans.some((pl) => pl.note) && (
            <div className="mt-3 space-y-3">
              {plans.filter((pl) => pl.note).map((pl) => (
                <div key={`note-${pl.id}`} className="rounded-lg border p-4 text-sm leading-relaxed" style={{ borderColor: "var(--bf-line)", background: "var(--bf-primary-soft)" }}>
                  <p className="font-bold mb-1" style={{ color: "var(--bf-primary)" }}>プラン補足{plans.filter((x) => x.note).length > 1 ? `（${pl.name}）` : ""}</p>
                  <p className="whitespace-pre-line" style={{ color: "#334155" }}>{pl.note}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--bf-muted)" }}>※料金は税込表示・変更される場合があります。最新は公式サイトでご確認ください。</p>
          {s.affiliateLink && (
            <div className="text-center mt-4">
              <a href={s.affiliateLink} rel="sponsored nofollow" target="_blank" className="bf-cta-sub">料金の詳細を公式サイトで見る</a>
            </div>
          )}
        </section>
      )}

      <section className="mb-10">
        <h2 className="bf-h2">サービス・設備・特徴（該当項目）</h2>
        {(() => {
          const has = new Set(features.map((f) => f?.name).filter(Boolean));
          const rentals: Record<string, string> = {};
          for (const r of (Array.isArray(s.rentalItems) ? s.rentalItems : [])) {
            const nm = RENTAL_ITEM_MAP[r.itemId];
            if (nm) rentals[nm] = r.type;
          }
          return (
            <div className="bf-card p-5 space-y-6">
              {FEATURE_CATEGORIES.map((cat) => (
                <div key={cat.en}>
                  <p className="text-center text-[10px] font-bold tracking-widest" style={{ color: "var(--bf-primary)" }}>{cat.en}</p>
                  <p className="text-center font-bold mb-3" style={{ color: "var(--bf-ink)" }}>{cat.ja}</p>
                  <div className="space-y-2">
                    {balancedRows(cat.items).map((row, ri) => (
                      <div key={ri} className="flex justify-center gap-2">
                        {row.map((it) => (
                          <span key={it} className="rounded px-3 py-1.5 text-xs font-semibold text-center" style={has.has(it) ? { background: "var(--bf-primary)", color: "#fff" } : { background: "#F1F5F9", color: "#B6C2D0" }}>{it}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(rentals).length > 0 && (
                <div>
                  <p className="text-center text-[10px] font-bold tracking-widest" style={{ color: "var(--bf-primary)" }}>Rental & Sales</p>
                  <p className="text-center font-bold mb-3" style={{ color: "var(--bf-ink)" }}>レンタル・販売</p>
                  <div className="space-y-2 max-w-md mx-auto">
                    {["ウェア", "シューズ", "タオル"].map((nm) => (
                      <div key={nm} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-xs font-bold" style={{ color: "var(--bf-ink)" }}>{nm}</span>
                        <div className="flex gap-2 flex-1">
                          {RENTAL_TYPES.map((rt) => (
                            <span key={rt.key} className="flex-1 rounded px-2 py-1.5 text-center text-xs font-semibold" style={rentals[nm] === rt.key ? { background: "var(--bf-primary)", color: "#fff" } : { background: "#F1F5F9", color: "#B6C2D0" }}>{rt.label}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-center text-[11px]" style={{ color: "var(--bf-muted)" }}>青色=この店舗で該当するサービス・特徴です（当サイト掲載データ時点）。最新は公式サイトでご確認ください。</p>
            </div>
          );
        })()}
      </section>

      <section className="mb-10">
        <h2 className="bf-h2">基本情報</h2>
        <div className="bf-card overflow-hidden">
          <table className="bf-table">
            <tbody>
              {([
                ["店舗名", `${brand?.name || ""} ${s.name}`, <IcoStore key="i" className="text-sm" />],
                ["住所", s.address, <IcoPin key="i" className="text-sm" />],
                ["アクセス", s.access, <IcoTrain key="i" className="text-sm" />],
                ["営業時間", s.openingHours, <IcoClock key="i" className="text-sm" />],
                ["電話番号", s.telephoneNumber, <IcoPhone key="i" className="text-sm" />],
              ] as [string, string, React.ReactNode][])
                .filter(([, v]) => v)
                .map(([k, v, ico]) => (
                  <tr key={k}>
                    <th className="w-32"><span className="flex items-center gap-1.5" style={{ color: "var(--bf-primary)" }}>{ico}<span style={{ color: "var(--bf-ink)" }}>{k}</span></span></th>
                    <td>{v}</td>
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
            無料カウンセリング・体験の申込はこちら
          </a>
          <p className="text-[10px] mt-3 opacity-60">※広告リンクを含みます</p>
        </div>
      )}

      {nearby.length > 0 && (
        <section>
          <h2 className="bf-h2">近くの店舗もチェック</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {nearby.map((n) => (
              <li key={n.path} className="bf-card bf-card-hover">
                <Link href={n.path} className="block px-4 py-3">
                  <span className="flex items-center justify-between font-semibold" style={{ color: "var(--bf-primary)" }}>
                    <span>{n.label}</span><IcoChevron className="text-xs shrink-0" />
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--bf-muted)" }}>{n.access}{n.km != null ? `　約${n.km}km` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sameBrand.length > 0 && (
        <section className="mt-8">
          <h2 className="bf-h2">{brand?.name}の他の店舗</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {sameBrand.map((n) => (
              <li key={n.path} className="bf-card bf-card-hover">
                <Link href={n.path} className="flex items-center justify-between px-4 py-3 font-semibold" style={{ color: "var(--bf-primary)" }}>
                  <span>{brand?.name} {n.name}{n.city ? `（${n.city}）` : ""}</span><IcoChevron className="text-xs shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brandArticleHref && (
        <section className="mt-8">
          <Link href={brandArticleHref} className="bf-card bf-card-hover block p-5" style={{ borderTop: "4px solid var(--bf-primary)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--bf-muted)" }}>ブランド徹底ガイド</p>
            <p className="font-extrabold" style={{ color: "var(--bf-primary)" }}>{brand?.name}の料金・口コミ・評判まとめを読む →</p>
          </Link>
        </section>
      )}
      </div>
    </article>
  );
}

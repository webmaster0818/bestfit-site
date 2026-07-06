import type { Metadata } from "next";
import Link from "next/link";
import { stores, metaFor, brands } from "@/lib/data";

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
  const plans: any[] = Array.isArray(s.pricePlans) ? s.pricePlans : [];
  const features: any[] = Array.isArray(s.features) ? s.features : [];
  const nearby: any[] = Array.isArray(s.nearbyStores) ? s.nearbyStores : [];

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/gyms/list" className="hover:underline">ジムを探す</Link> › {brand?.name || prm.brand} {s.name}
      </nav>
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{m?.h1 || `${brand?.name || ""} ${s.name}`}</h1>
      {s.catchcopy && <p className="text-sm font-semibold mb-4" style={{ color: "var(--bf-primary)" }}>{s.catchcopy}</p>}
      {s.lead && <p className="text-sm text-gray-600 leading-relaxed mb-8">{s.lead}</p>}

      <section className="mb-10">
        <h2 className="text-lg font-bold border-l-4 pl-3 mb-4" style={{ borderColor: "var(--bf-primary)" }}>基本情報</h2>
        <table className="w-full text-sm border border-gray-200">
          <tbody>
            {[
              ["住所", s.address],
              ["アクセス", s.access],
              ["営業時間", s.openingHours],
              ["電話番号", s.telephoneNumber],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <tr key={k as string} className="border-b border-gray-100">
                  <th className="bg-gray-50 text-left px-4 py-3 w-32 font-semibold">{k}</th>
                  <td className="px-4 py-3">{v as string}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {plans.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold border-l-4 pl-3 mb-4" style={{ borderColor: "var(--bf-primary)" }}>料金プラン</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left">プラン</th>
                  <th className="px-3 py-2 text-left">料金</th>
                  <th className="px-3 py-2 text-left">回数</th>
                  <th className="px-3 py-2 text-left">時間</th>
                  <th className="px-3 py-2 text-left">入会金</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((pl) => (
                  <tr key={pl.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-semibold">{pl.name}{pl.isRecommended ? " ★" : ""}</td>
                    <td className="px-3 py-2">{yen(pl.price)}</td>
                    <td className="px-3 py-2">{pl.sessionCount ? `${pl.sessionCount}回` : "—"}</td>
                    <td className="px-3 py-2">{pl.minutes ? `${pl.minutes}分` : "—"}</td>
                    <td className="px-3 py-2">{yen(pl.membershipFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">※料金は税込表示・変更される場合があります。最新は公式サイトでご確認ください。</p>
        </section>
      )}

      {features.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold border-l-4 pl-3 mb-4" style={{ borderColor: "var(--bf-primary)" }}>特徴</h2>
          <ul className="flex flex-wrap gap-2">
            {features.map((f) => f?.name && (
              <li key={f.id} className="text-xs bg-gray-100 rounded-full px-3 py-1.5">{f.name}</li>
            ))}
          </ul>
        </section>
      )}

      {s.affiliateLink && (
        <div className="rounded-xl p-6 text-center mb-10" style={{ background: "var(--bf-bg)" }}>
          <p className="font-bold mb-3">{brand?.name || ""} {s.name} が気になったら</p>
          <a
            href={s.affiliateLink}
            rel="sponsored nofollow"
            target="_blank"
            className="inline-block text-white font-bold rounded-lg px-8 py-3 text-sm"
            style={{ background: "var(--bf-accent)" }}
          >
            公式サイトで詳細を見る
          </a>
        </div>
      )}

      {nearby.length > 0 && (
        <section>
          <h2 className="text-lg font-bold border-l-4 pl-3 mb-4" style={{ borderColor: "var(--bf-primary)" }}>近くの店舗</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {nearby.slice(0, 10).map((n, i) => {
              const b = Object.values(brands()).find((x) => x.brandId === n.brandId);
              if (!b || !n.slug) return null;
              return (
                <li key={i}>
                  <Link href={`/gyms/${b.slug}/${n.slug}`} className="text-blue-700 hover:underline">
                    {b.name} {n.name}
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

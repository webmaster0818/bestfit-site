import Link from "next/link";
import type { Metadata } from "next";
import { metaFor, taxonomies, brands, stores } from "@/lib/data";

export function generateMetadata(): Metadata {
  const m = metaFor("/");
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: { canonical: "/" } } : {};
}

const PREF_ORDER = ["東京都", "神奈川県", "埼玉県", "千葉県", "大阪府", "京都府", "兵庫県", "愛知県", "福岡県", "北海道", "宮城県", "広島県"];

export default function Home() {
  const tax = taxonomies();
  const storeCount = Object.keys(stores()).length;
  const brandCount = Object.keys(brands()).length;
  const prefEntries = Object.entries(tax.pref);
  const majorPrefs = PREF_ORDER.map((name) => prefEntries.find(([, n]) => n === name)).filter(Boolean) as [string, string][];
  const otherPrefs = prefEntries.filter(([, n]) => !PREF_ORDER.includes(n));

  return (
    <div>
      {/* ヒーロー */}
      <section className="text-white py-14 md:py-20 px-4" style={{ background: "linear-gradient(135deg, var(--bf-primary) 0%, var(--bf-primary-deep) 60%, #083a68 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest opacity-80 mb-3">パーソナルジム専門の比較・口コミサイト</p>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
            あなたに合う<br className="md:hidden" />パーソナルジムが見つかる
          </h1>
          <p className="opacity-90 text-sm md:text-base mb-8">
            全国<strong className="text-xl mx-1">{brandCount}</strong>ブランド・<strong className="text-xl mx-1">{storeCount.toLocaleString()}</strong>店舗を料金・特徴・エリアで比較
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/gyms/list" className="bf-cta">エリアからジムを探す</Link>
            <Link href="/articles" className="bf-cta-sub" style={{ background: "rgba(255,255,255,0.95)" }}>エリア別おすすめ記事を読む</Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <section className="mb-12">
          <h2 className="bf-h2">主要エリアから探す</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {majorPrefs.map(([id, name]) => (
              <Link key={id} href={`/gyms/list/pref-${id}`} className="bf-card bf-card-hover text-center py-3 text-sm font-bold" style={{ color: "var(--bf-primary)" }}>
                {name}
              </Link>
            ))}
          </div>
          <details className="mt-4">
            <summary className="text-sm cursor-pointer font-semibold" style={{ color: "var(--bf-muted)" }}>その他の都道府県を表示</summary>
            <ul className="flex flex-wrap gap-2 mt-3">
              {otherPrefs.map(([id, name]) => (
                <li key={id}><Link href={`/gyms/list/pref-${id}`} className="bf-chip-link">{name}</Link></li>
              ))}
            </ul>
          </details>
        </section>

        <section className="mb-12">
          <h2 className="bf-h2">こだわり条件から探す</h2>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(tax.feature).map(([id, name]) => (
              <li key={id}><Link href={`/gyms/list/feature-${id}`} className="bf-chip-link">{name}</Link></li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="bf-h2">BEST-FITの使い方</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ["1", "エリア・条件で絞り込む", "都道府県・市区・駅、月額制や女性専用などのこだわり条件でジムを一覧比較できます。"],
              ["2", "料金と特徴を見比べる", "店舗ページでは料金プラン・アクセス・営業時間・特徴を統一フォーマットで確認できます。"],
              ["3", "無料カウンセリングへ", "気になったジムは公式サイトから無料カウンセリング・体験を予約。合うかどうかは行って確かめるのが確実です。"],
            ].map(([n, t, d]) => (
              <div key={n} className="bf-card p-5">
                <div className="w-8 h-8 rounded-full text-white font-extrabold flex items-center justify-center mb-3" style={{ background: "var(--bf-primary)" }}>{n}</div>
                <h3 className="font-bold mb-1 text-sm">{t}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--bf-muted)" }}>{d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

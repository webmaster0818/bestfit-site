import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { metaFor, taxonomies, brands, stores, urlMeta } from "@/lib/data";
import SearchPanel from "@/components/SearchPanel";
import FeatureIcons from "@/components/FeatureIcons";

export function generateMetadata(): Metadata {
  const m = metaFor("/");
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: { canonical: "/" } } : {};
}

const PREF_ORDER = ["東京都", "神奈川県", "埼玉県", "千葉県", "大阪府", "京都府", "兵庫県", "愛知県", "福岡県", "北海道", "宮城県", "広島県"];

function loadJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", file), "utf-8"));
}

export default function Home() {
  const tax = taxonomies();
  const storeCount = Object.keys(stores()).length;
  const brandCount = Object.keys(brands()).length;
  const prefEntries = Object.entries(tax.pref);
  const majorPrefs = PREF_ORDER.map((name) => prefEntries.find(([, n]) => n === name)).filter(Boolean) as [string, string][];
  const otherPrefs = prefEntries.filter(([, n]) => !PREF_ORDER.includes(n));
  const areas = loadJson("areas-tree.json");
  const featuresCatalog = loadJson("features-catalog.json");
  const topArticles: { href: string; img: string }[] = loadJson("top-articles.json");
  const articleAreaTree: { name: string; children: { name: string; category: string; slug: string }[] }[] = loadJson("article-area-tree.json");
  const imageMap: Record<string, string> = loadJson("image-map.json");
  const meta = urlMeta();
  const articleCards = topArticles
    .filter((a) => meta[a.href])
    .slice(0, 6)
    .map((a) => ({ href: a.href, title: meta[a.href].title.split("｜")[0], img: imageMap[a.img] ? `/cms-images/${imageMap[a.img]}` : null }));
  const newsItems = Object.entries(meta)
    .filter(([p]) => /^\/news\/[^/]+$/.test(p))
    .map(([p, m]) => ({ href: p, title: m.title.split("｜")[0] }));

  return (
    <div>
      {/* ===== ファーストビュー: 現行KV画像 + 検索パネル ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/kv.png" alt="" fill priority className="object-cover object-[70%_top] hidden md:block" />
          <Image src="/images/kv-sp.png" alt="" fill priority className="object-cover object-top md:hidden" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,18,24,0.30) 0%, rgba(15,18,24,0.38) 55%, rgba(15,18,24,0.66) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-8 items-center">
          <div className="text-white md:order-2">
            <p className="text-xs font-bold tracking-[0.25em] opacity-90 mb-3">PERSONAL GYM SEARCH &amp; REVIEW</p>
            <h1 className="text-3xl md:text-[2.6rem] font-extrabold leading-tight mb-4 drop-shadow">
              理想のカラダへ、<br />あなたに合う<span style={{ color: "#ffb45e" }}>パーソナルジム</span>が見つかる
            </h1>
            <p className="text-sm md:text-base opacity-95 leading-relaxed drop-shadow">
              全国<strong className="text-2xl mx-1" style={{ color: "#ffb45e" }}>{brandCount}</strong>ブランド・
              <strong className="text-2xl mx-1" style={{ color: "#ffb45e" }}>{storeCount.toLocaleString()}</strong>店舗を掲載。
              料金・特徴・口コミで比較して、無料カウンセリングから始めよう。
            </p>
          </div>
          <div className="md:order-1"><SearchPanel areas={areas} features={featuresCatalog} /></div>
        </div>
      </section>

      {/* ===== 主要エリア ===== */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="bf-h2 bg-white/80 inline-block pr-4 rounded-r-lg">主要エリアから探す</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
            {majorPrefs.map(([id, name]) => (
              <Link key={id} href={`/gyms/list/pref-${id}`} className="bf-card bf-card-hover text-center py-3.5 text-sm font-bold" style={{ color: "var(--bf-primary)" }}>
                {name}
              </Link>
            ))}
          </div>
          <details className="mt-3 bf-card p-4">
            <summary className="text-sm cursor-pointer font-bold" style={{ color: "var(--bf-primary)" }}>その他の都道府県を表示 ▼</summary>
            <ul className="flex flex-wrap gap-2 mt-3">
              {otherPrefs.map(([id, name]) => (
                <li key={id}><Link href={`/gyms/list/pref-${id}`} className="bf-chip-link">{name}</Link></li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      <div className="bf-divider" />

      {/* ===== こだわり条件 ===== */}
      <section className="py-12" style={{ background: "linear-gradient(180deg, rgba(14,95,168,0.06), rgba(14,95,168,0.02))" }}>
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="bf-h2 bg-white/80 inline-block pr-4 rounded-r-lg">こだわり条件から探す</h2>
          <ul className="flex flex-wrap gap-2 mt-2">
            {Object.entries(tax.feature).map(([id, name]) => (
              <li key={id}><Link href={`/gyms/list/feature-${id}`} className="bf-chip-link bg-white">{name}</Link></li>
            ))}
          </ul>
        </div>
      </section>

      <div className="bf-divider" />

      {/* ===== エリア記事(県別アコーディオン) ===== */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="bf-h2 bg-white/80 inline-block pr-4 rounded-r-lg">エリア特集から探す</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
            {articleAreaTree.map((pref) => (
              <details key={pref.name} className="bf-card overflow-hidden [&[open]]:col-span-3 md:[&[open]]:col-span-4">
                <summary className="cursor-pointer px-2 py-3 font-bold text-sm text-center list-none" style={{ color: "var(--bf-primary)" }}>
                  {pref.name}
                  <span className="ml-1 text-[10px] font-normal align-middle rounded-full px-1.5 py-0.5" style={{ background: "var(--bf-primary-soft)", color: "var(--bf-primary-deep)" }}>{pref.children.length}</span>
                </summary>
                <ul className="px-4 pb-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3 justify-center">
                  {pref.children.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/articles/${c.category}/${c.slug}`} className="bf-chip-link">{c.name}のジム特集</Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="bf-divider" />

      <FeatureIcons />

      <div className="bf-divider" />

      {/* ===== 新着記事 ===== */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="bf-h2 bg-white/80 inline-block pr-4 rounded-r-lg mb-0">パーソナルジム新着記事</h2>
            <Link href="/articles" className="text-sm font-bold hover:underline" style={{ color: "var(--bf-primary)" }}>記事一覧へ →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articleCards.map((a) => (
              <Link key={a.href} href={a.href} className="bf-card bf-card-hover overflow-hidden group">
                {a.img && (
                  <div className="relative h-40 overflow-hidden">
                    <Image src={a.img} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <p className="p-4 text-sm font-bold leading-snug" style={{ color: "var(--bf-ink)" }}>{a.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 最新ニュース ===== */}
      <section className="py-12 text-white" style={{ background: "linear-gradient(135deg, var(--bf-primary-deep), #083a68)" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold border-l-4 border-white pl-3">最新ニュース</h2>
            <Link href="/news" className="text-sm font-bold underline opacity-90 hover:opacity-100">ニュース一覧へ →</Link>
          </div>
          <div className="bg-white rounded-xl overflow-hidden">
            {newsItems.map((n) => (
              <Link key={n.href} href={n.href} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors">
                <span className="text-sm font-bold" style={{ color: "var(--bf-ink)" }}>{n.title}</span>
                <span className="font-bold" style={{ color: "var(--bf-primary)" }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="bf-divider" />

      {/* ===== 使い方 ===== */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="bf-h2 bg-white/80 inline-block pr-4 rounded-r-lg">BEST-FITの使い方</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-2">
            {[
              ["1", "エリア・条件で絞り込む", "都道府県・市区・駅、月額制や女性専用などのこだわり条件で複数選択して絞り込めます。"],
              ["2", "料金と特徴を見比べる", "店舗ページでは料金プラン・アクセス・営業時間・特徴を統一フォーマットで確認できます。"],
              ["3", "無料カウンセリングへ", "気になったジムは公式サイトから無料カウンセリング・体験を予約。合うかどうかは行って確かめるのが確実です。"],
            ].map(([n, t, d]) => (
              <div key={n} className="bf-card p-5">
                <div className="w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center mb-3" style={{ background: "var(--bf-primary)" }}>{n}</div>
                <h3 className="font-bold mb-1 text-sm">{t}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--bf-muted)" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

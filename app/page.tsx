import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { metaFor, taxonomies, brands, stores, urlMeta } from "@/lib/data";
import SearchPanel from "@/components/SearchPanel";
import FeatureIcons from "@/components/FeatureIcons";
import GymConcierge from "@/components/GymConcierge";
import HeroParallax from "@/components/HeroParallax";
import ScrollFx from "@/components/ScrollFx";

export function generateMetadata(): Metadata {
  const m = metaFor("/");
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: { canonical: "/" } } : {};
}

const PREF_ORDER = ["東京都", "神奈川県", "埼玉県", "千葉県", "大阪府", "京都府", "兵庫県", "愛知県", "福岡県", "北海道", "宮城県", "広島県"];

function loadJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", file), "utf-8"));
}

export default function Home() {
  const conciergeStores = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "concierge-stores.json"), "utf-8"));
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
    .map((a) => {
      // モバイル最適化: カード実表示(約360px)に対し原寸1920pxを配信していたため640pxサムネを使用
      const orig = imageMap[a.img];
      let img: string | null = null;
      if (orig) {
        const thumbName = orig.replace(/\.(jpg|jpeg|png)$/i, ".jpg");
        const thumbAbs = path.join(process.cwd(), "public", "cms-images", "thumb-640", thumbName);
        img = fs.existsSync(thumbAbs) ? `/cms-images/thumb-640/${thumbName}` : `/cms-images/${orig}`;
      }
      return { href: a.href, title: meta[a.href].title.split("｜")[0], img };
    });
  const newsItems = Object.entries(meta)
    .filter(([p]) => /^\/news\/[^/]+$/.test(p))
    .map(([p, m]) => ({ href: p, title: m.title.split("｜")[0] }));

  // ジムブランドから探す(ブランド記事26本への導線・主要12は料金つきカード)
  const brandPrice: Record<string, { name: string; price?: string }> = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "brand-price.json"), "utf8")
  );
  const brandOrder = ["curves", "chocozap", "fit24", "rizap", "beyond", "247workout", "drtraining", "the-personal-gym", "b-concept", "katagirijuku", "undeux", "chicken"];
  const brandArticles = [
    ...brandOrder.map((slug) => ({ slug, ...brandPrice[slug] })),
    ...Object.entries(brandPrice)
      .filter(([slug]) => !brandOrder.includes(slug))
      .map(([slug, v]) => ({ slug, ...v })),
  ].filter((b) => b.name);

  return (
    <div>
      <ScrollFx />
      {/* ===== ファーストビュー: 現行KV画像 + 検索パネル ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* モバイル最適化: PC用KV(2880px)がSPでも非表示DLされるのを防ぐためpicture化(表示は不変) */}
          {/* スクロール連動: KVのみパララックス(オーバーレイは静止) */}
          <HeroParallax>
            <picture>
              <source media="(min-width: 768px)" srcSet="/images/kv.png" />
              <img src="/images/kv-sp.png" alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-top md:object-[70%_top]" />
            </picture>
          </HeroParallax>
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
          <div id="search" className="md:order-1 scroll-mt-24"><SearchPanel areas={areas} features={featuresCatalog} /></div>
        </div>
      </section>

      {/* ===== AI診断コンシェルジュ ===== */}
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          <GymConcierge stores={conciergeStores} />
        </div>
      </section>

      {/* ===== 主要エリア ===== */}
      <section className="py-12" data-reveal>
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

      {/* ===== ジムブランドから探す ===== */}
      <section className="py-12" data-reveal>
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="bf-h2 bg-white/80 inline-block pr-4 rounded-r-lg">ジムブランドから探す</h2>
          <p className="text-sm text-gray-500 mt-1 mb-1">料金・口コミ・向いている人まで、ブランド別の徹底ガイドをチェック。</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {brandArticles.slice(0, 12).map((b) => (
              <Link key={b.slug} href={`/articles/brand/${b.slug}`} className="bf-card bf-card-hover px-3 py-3 block">
                <p className="text-sm font-bold" style={{ color: "var(--bf-primary)" }}>{b.name}</p>
                {b.price && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{b.price}</p>}
              </Link>
            ))}
          </div>
          <details className="mt-3 bf-card p-4">
            <summary className="text-sm cursor-pointer font-bold" style={{ color: "var(--bf-primary)" }}>その他のブランドを表示 ▼</summary>
            <ul className="flex flex-wrap gap-2 mt-3">
              {brandArticles.slice(12).map((b) => (
                <li key={b.slug}><Link href={`/articles/brand/${b.slug}`} className="bf-chip-link">{b.name}</Link></li>
              ))}
            </ul>
          </details>
          <p className="text-[11px] text-gray-400 mt-2">※料金は確認日時点の目安です。カーブスなど一部ブランドは店舗・地域により月会費が異なります。最新は各ガイド・公式サイトでご確認ください。</p>
        </div>
      </section>

      {/* ===== こだわり条件 ===== */}
      <section className="py-12" data-reveal style={{ background: "linear-gradient(180deg, rgba(14,95,168,0.06), rgba(14,95,168,0.02))" }}>
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
      <section className="py-12" data-reveal>
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
      <section className="py-12" data-reveal>
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
      <section className="py-12 text-white" data-reveal style={{ background: "linear-gradient(135deg, var(--bf-primary-deep), #083a68)" }}>
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
      <section className="py-12" data-reveal>
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

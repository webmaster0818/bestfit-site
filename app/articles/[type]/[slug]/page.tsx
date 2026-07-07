import type { Metadata } from "next";
import Link from "next/link";
import { articleHtml, metaFor, urlMeta, brandPrice, areaArticleSiblings, areaArticleData, brands } from "@/lib/data";
import PageHero from "@/components/PageHero";
import ArticleEnhancer from "@/components/ArticleEnhancer";
import DataAreaArticle from "@/components/DataAreaArticle";
import fs from "node:fs";
import path from "node:path";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(urlMeta())
    .filter((p) => /^\/articles\/[^/]+\/[^/]+$/.test(p))
    .map((p) => {
      const seg = p.split("/");
      return { type: seg[2], slug: seg[3] };
    });
}

function pagePath(prm: { type: string; slug: string }) {
  return `/articles/${prm.type}/${prm.slug}`;
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; slug: string }> }): Promise<Metadata> {
  const p = pagePath(await params);
  const m = metaFor(p);
  const bslug = p.startsWith("/articles/brand/") ? p.split("/").pop()! : null;
  const bp = bslug ? brandPrice(bslug) : null;
  if (!m) return {};
  return {
    title: { absolute: m.title },
    description: bp ? `${bp.name}の料金は${bp.price}${bp.join ? "・" + bp.join : ""}（${bp.note}）。口コミ・評判、他社との料金比較、向いている人まで、実際に払う総額ベースで解説します。` : m?.desc,
    alternates: m.canonical ? { canonical: m.canonical } : undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ type: string; slug: string }> }) {
  const prm = await params;
  const p = pagePath(prm);
  const m = metaFor(p);
  const bodyRaw = articleHtml(p);
  const body = bodyRaw ? bodyRaw.replace(/<h1[\s\S]*?<\/h1>/, "") : null;
  const isBrand = prm.type === "brand";
  const bp = isBrand ? brandPrice(prm.slug) : null;
  const siblings = !isBrand ? areaArticleSiblings(p) : [];
  // エリア記事のデータ駆動化(試験対象slugのみ)。データ不足やブランドはnull→移植HTML
  const AREA_PILOT = new Set(["yokohama", "shinjuku", "hachioji", "funabashi", "sendai", "kashiwa"]);
  const areaRaw = !isBrand && AREA_PILOT.has(prm.slug) ? areaArticleData(prm.type, prm.slug) : null;
  const brandsMap = areaRaw ? brands() : null;
  const brandName = (slug: string) => (brandsMap ? Object.values(brandsMap).find((b) => b.slug.toLowerCase() === slug.toLowerCase())?.name || "" : "");
  const area = areaRaw ? { ...areaRaw, cards: areaRaw.cards.map((c: any) => ({ ...c, brandName: brandName(c.brand) })) } : null;
  const areaFaqs = area
    ? [
        { q: `${area.areaName}のパーソナルジムの料金相場はいくらですか？`, a: area.priceRange ? `1回あたり（コース総額÷回数）に換算すると、最安クラスで${area.priceRange.min.toLocaleString()}円〜、中央値の目安は${area.priceRange.mid.toLocaleString()}円前後、高価格帯で${area.priceRange.max.toLocaleString()}円ほどです（税込・当サイト集計・入会金別）。回数の違うプランを公平に比べるための指標です。` : `店舗により幅があります。無料カウンセリングで総額の見積もりを取るのが確実です。` },
        { q: `${area.areaName}で女性専用や完全個室のジムはありますか？`, a: `あります。${area.areaName}のパーソナルジムはこだわり条件で絞り込めます。女性専用・完全個室・食事指導などの条件別一覧から、目的に合う店舗を探せます。` },
        { q: `${area.areaName}のパーソナルジムは体験・カウンセリングを受けられますか？`, a: `多くの店舗が無料カウンセリングや体験トレーニングを用意しています。料金や雰囲気は店舗ごとに異なるため、各ジムの詳細ページと公式サイトで確認のうえ、複数を比較して決めるのがおすすめです。` },
      ]
    : [];
  const areaFaqLd = area
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: areaFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;

  return (
    <article>
      {areaFaqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(areaFaqLd) }} />}
      <PageHero eyebrow={isBrand ? "BRAND REVIEW" : "AREA FEATURE"} title={m?.title.split("｜")[0] || ""} />
      <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/articles" className="hover:underline">{isBrand ? "ブランド記事" : "エリア記事"}</Link> › {m?.title.split("｜")[0] || ""}
      </nav>
      {bp && (
        <div className="bf-card p-5 mb-6" style={{ borderTop: "4px solid var(--bf-primary)" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--bf-muted)" }}>料金早見（{bp.note}）</p>
          <p className="text-lg font-extrabold" style={{ color: "var(--bf-primary)" }}>{bp.price}</p>
          {bp.join && <p className="text-sm mt-1" style={{ color: "var(--bf-ink)" }}>{bp.join}</p>}
          <p className="text-[11px] mt-2" style={{ color: "var(--bf-muted)" }}>※料金は税込・公式サイトで確認した最新値です。店舗・時期により変わる場合があります。詳細は本文と公式サイトでご確認ください。</p>
        </div>
      )}
      {area ? (
        <>
          <p className="text-sm leading-7 mb-8" style={{ color: "var(--bf-ink)" }}>
            {area.areaName}のパーソナルジムを、料金・アクセス・こだわり条件で比較できるようまとめました。当サイト掲載の{area.total}件から、料金プランや特徴が明確な店舗を厳選し、最安プラン・アクセス・特徴を一覧で確認できます。各ジムの詳細ページで口コミや全プランもチェックできます。
          </p>
          <DataAreaArticle areaName={area.areaName} total={area.total} cards={area.cards} priceRange={area.priceRange} listPath={area.listPath} />
          <section className="mt-4 mb-8">
            <h2 className="bf-h2 mb-3">よくある質問</h2>
            <div className="space-y-2">
              {areaFaqs.map((f, i) => (
                <details key={i} className="bf-card group">
                  <summary className="cursor-pointer px-4 py-3 font-bold text-sm flex justify-between items-center">
                    {f.q}<span className="group-open:rotate-45 transition-transform text-lg shrink-0 ml-3" style={{ color: "var(--bf-primary)" }}>＋</span>
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-7" style={{ color: "var(--bf-muted)" }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : body ? (
        <><ArticleEnhancer /><div className="article-body" dangerouslySetInnerHTML={{ __html: body }} /></>
      ) : (
        <p className="text-sm text-gray-500">本文の移行処理中です。</p>
      )}

      {siblings.length > 0 && (
        <section className="mt-12 bf-card p-5">
          <h2 className="bf-h2 mb-3">同じエリアの特集記事</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {siblings.map((sib) => (
              <li key={sib.path}>
                <Link href={sib.path} className="font-semibold hover:underline" style={{ color: "var(--bf-primary)" }}>{sib.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(() => {
        const sb = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "article-sidebar.json"), "utf-8"));
        const meta = urlMeta();
        const t = (href: string) => (meta[href]?.title || "").split("｜")[0];
        return (
          <div className="mt-12 space-y-8">
            <section className="bf-card p-5">
              <h2 className="bf-h2 mb-3">タグから探す</h2>
              <div className="flex flex-wrap gap-2">
                {sb.tags.map(([href, label]: [string, string]) => (
                  <Link key={href} href={href} className="bf-chip-link">{label}</Link>
                ))}
              </div>
            </section>
            <section className="bf-card p-5">
              <h2 className="bf-h2 mb-3">新着記事</h2>
              <ul className="space-y-2 text-sm">
                {sb.new.map((href: string) => t(href) && (
                  <li key={href}><Link href={href} className="font-semibold hover:underline" style={{ color: "var(--bf-primary)" }}>{t(href)}</Link></li>
                ))}
              </ul>
            </section>
            <section className="bf-card p-5">
              <h2 className="bf-h2 mb-3">人気の記事</h2>
              <ul className="space-y-2 text-sm">
                {sb.popular.map((href: string) => t(href) && (
                  <li key={href}><Link href={href} className="font-semibold hover:underline" style={{ color: "var(--bf-primary)" }}>{t(href)}</Link></li>
                ))}
              </ul>
            </section>
          </div>
        );
      })()}
      </div>
    </article>
  );
}

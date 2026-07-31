import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { articleGyms, urlMeta } from "@/lib/data";

// エリア記事に掲載されているが店舗DBに詳細ページが無いジムの詳細ページ。
// 本文は現行サイトのエリア記事に掲載されている紹介ブロックをそのまま使用(記事原文由来・創作なし)。
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(articleGyms().listed).map((slug) => ({ slug }));
}

const stripEmptyBoxes = (html: string) => {
  const pat = /<div class="[^"]*" data-orizm-block-id="[^"]+" data-orizm-block-type="Box"><div class="[^"]*">\s*(?:<div data-orizm-slot-id="children">\s*<\/div>)?\s*<\/div><\/div>/g;
  let prev = "";
  let cur = html;
  while (cur !== prev) { prev = cur; cur = cur.replace(pat, ""); }
  return cur;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const prm = await params;
  const g = articleGyms().listed[prm.slug];
  if (!g) return {};
  return {
    title: `${g.name}の料金・特徴・アクセス｜パーソナルジム紹介 | BEST-FIT`,
    description: `${g.name}（${g.access || "パーソナルジム"}）の特徴・料金・コース内容を紹介。BEST-FIT編集部のエリア特集記事に掲載しているパーソナルジムです。`,
    alternates: { canonical: `/gyms/listed/${prm.slug}` },
  };
}

export default async function ListedGymPage({ params }: { params: Promise<{ slug: string }> }) {
  const prm = await params;
  const g = articleGyms().listed[prm.slug];
  if (!g) return null;
  const um = urlMeta() as Record<string, { title?: string }>;
  const articleLinks = g.articles.map((p) => ({
    href: p,
    label: (um[p]?.title || p).split("｜")[0],
  }));
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${g.name}の料金・特徴・アクセス`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://dunlopsportsclub.jp/gyms/listed/${prm.slug}` },
    author: { "@type": "Organization", name: "BEST-FIT編集部", url: "https://dunlopsportsclub.jp" },
    publisher: { "@id": "https://dunlopsportsclub.jp/#organization" },
    inLanguage: "ja",
  };
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <PageHero eyebrow="GYM PICKUP" title={g.name} />
      <div className="max-w-4xl mx-auto px-4">
        {g.access && (
          <p className="text-sm mt-6 mb-2" style={{ color: "var(--bf-muted)" }}>アクセス: {g.access}</p>
        )}
        <div className="article-body" dangerouslySetInnerHTML={{ __html: stripEmptyBoxes(g.block) }} />
        <section className="mt-10 mb-6">
          <h2 className="bf-h2 mb-3">このジムが掲載されている特集記事</h2>
          <ul className="space-y-2 text-sm">
            {articleLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline" style={{ color: "var(--bf-primary)" }}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-[11px] mb-12" style={{ color: "var(--bf-muted)" }}>
          ※本ページの紹介内容は、BEST-FIT編集部のエリア特集記事に掲載している情報にもとづきます。料金・営業時間等は変更される場合があるため、最新の情報は公式サイトでご確認ください。
        </p>
      </div>
    </article>
  );
}

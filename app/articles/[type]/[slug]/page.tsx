import type { Metadata } from "next";
import Link from "next/link";
import { articleHtml, metaFor, urlMeta } from "@/lib/data";
import PageHero from "@/components/PageHero";
import ArticleEnhancer from "@/components/ArticleEnhancer";
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
  if (!m) return {};
  return {
    title: { absolute: m.title },
    description: m.desc,
    alternates: m.canonical ? { canonical: m.canonical } : undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ type: string; slug: string }> }) {
  const prm = await params;
  const p = pagePath(prm);
  const m = metaFor(p);
  const bodyRaw = articleHtml(p);
  const body = bodyRaw ? bodyRaw.replace(/<h1[\s\S]*?<\/h1>/, "") : null;

  return (
    <article>
      <PageHero eyebrow="AREA FEATURE" title={m?.title.split("｜")[0] || ""} />
      <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/articles" className="hover:underline">エリア記事</Link> › {(m?.title.split("｜")[0] || "").slice(0, 28)}
      </nav>
      {body ? (
        <><ArticleEnhancer /><div className="article-body" dangerouslySetInnerHTML={{ __html: body }} /></>
      ) : (
        <p className="text-sm text-gray-500">本文の移行処理中です。</p>
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

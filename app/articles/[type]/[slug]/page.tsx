import type { Metadata } from "next";
import Link from "next/link";
import { articleHtml, metaFor, urlMeta } from "@/lib/data";
import PageHero from "@/components/PageHero";

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
  const body = articleHtml(p);

  return (
    <article>
      <PageHero eyebrow="AREA FEATURE" title={m?.h1 || m?.title.split("｜")[0] || ""} />
      <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/articles" className="hover:underline">記事一覧</Link>
      </nav>
      {body ? (
        <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />
      ) : (
        <p className="text-sm text-gray-500">本文の移行処理中です。</p>
      )}
      </div>
    </article>
  );
}

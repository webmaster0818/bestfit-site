import type { Metadata } from "next";
import Link from "next/link";
import { articleFor, metaFor, urlMeta } from "@/lib/data";
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
  const art = articleFor(p);
  const sections = (art?.sections || []).filter(
    (s) => s?.content && s?.name && !["next-size-adjust", "viewport"].includes(s.name)
  );

  return (
    <article>
      <PageHero eyebrow="AREA FEATURE" title={m?.h1 || m?.title.split("｜")[0] || ""} />
      <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/articles" className="hover:underline">記事一覧</Link>
      </nav>
      {sections.length > 2 && (
        <nav className="bf-card p-5 mb-8">
          <p className="font-bold text-sm mb-2">目次</p>
          <ol className="text-sm space-y-1">
            {sections.map((sec, i) => (
              <li key={i}><a href={`#sec-${i}`} className="hover:underline" style={{ color: "var(--bf-primary)" }}>{sec.name}</a></li>
            ))}
          </ol>
        </nav>
      )}
      {sections.map((s, i) => (
        <section key={i} className="mb-8" id={`sec-${i}`}>
          <h2 className="bf-h2">{s.name}</h2>
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&_a]:text-blue-700 [&_a]:underline [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: s.content }}
          />
        </section>
      ))}
      {sections.length === 0 && (
        <p className="text-sm text-gray-500">本文の移行処理中です。</p>
      )}
      </div>
    </article>
  );
}

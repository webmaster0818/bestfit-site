import type { Metadata } from "next";
import { articleHtml, metaFor, urlMeta } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(urlMeta())
    .filter((p) => /^\/news\/[^/]+$/.test(p))
    .map((p) => ({ slug: p.split("/")[2] }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = metaFor(`/news/${slug}`);
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: { canonical: `/news/${slug}` } } : {};
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = `/news/${slug}`;
  const m = metaFor(p);
  const body = articleHtml(p);
  return (
    <article>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold mb-6">{m?.h1 || m?.title.split("｜")[0]}</h1>
        {body ? <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} /> : <p className="text-sm text-gray-500">本文の移行処理中です。</p>}
      </div>
    </article>
  );
}
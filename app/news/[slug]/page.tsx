import type { Metadata } from "next";
import { articleFor, metaFor, urlMeta } from "@/lib/data";

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
  const art = articleFor(p);
  const sections = (art?.sections || []).filter((s) => s?.content && s?.name && !["next-size-adjust", "viewport"].includes(s.name));
  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">{m?.h1 || m?.title.split("｜")[0]}</h1>
      {sections.map((s, i) => (
        <div key={i} className="prose prose-sm max-w-none mb-6" dangerouslySetInnerHTML={{ __html: s.content }} />
      ))}
    </article>
  );
}

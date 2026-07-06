import type { Metadata } from "next";
import { articleFor, metaFor } from "@/lib/data";

const PATH = "/privacy-policy";

export function generateMetadata(): Metadata {
  const m = metaFor(PATH);
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: m.canonical ? { canonical: m.canonical } : undefined } : {};
}

export default function StaticPage() {
  const m = metaFor(PATH);
  const art = articleFor(PATH);
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

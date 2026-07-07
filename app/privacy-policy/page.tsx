import type { Metadata } from "next";
import { articleHtml, metaFor } from "@/lib/data";

const PATH = "/privacy-policy";

export function generateMetadata(): Metadata {
  const m = metaFor(PATH);
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: m.canonical ? { canonical: m.canonical } : undefined } : {};
}

export default function StaticPage() {
  const m = metaFor(PATH);
  const body = articleHtml(PATH);
  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">{m?.h1 || m?.title.split("｜")[0]}</h1>
      {body ? <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} /> : null}
    </article>
  );
}
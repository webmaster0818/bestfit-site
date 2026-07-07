import type { Metadata } from "next";
import Link from "next/link";
import { metaFor, urlMeta } from "@/lib/data";
import PageHero from "@/components/PageHero";

export function generateMetadata(): Metadata {
  const m = metaFor("/news");
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: { canonical: "/news" } } : {};
}

export default function NewsIndex() {
  const items = Object.entries(urlMeta()).filter(([p]) => /^\/news\/[^/]+$/.test(p));
  return (
    <div>
      <PageHero eyebrow="NEWS" title="お知らせ" />
      <div className="max-w-3xl mx-auto px-4 py-8">
      <ul className="space-y-2 text-sm">
        {items.map(([p, m]) => (
          <li key={p}><Link href={p} className="text-blue-700 hover:underline">{m.title.split("｜")[0]}</Link></li>
        ))}
      </ul>
      </div>
    </div>
  );
}

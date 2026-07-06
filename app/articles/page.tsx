import type { Metadata } from "next";
import Link from "next/link";
import { metaFor, urlMeta } from "@/lib/data";

export function generateMetadata(): Metadata {
  const m = metaFor("/articles");
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: { canonical: "/articles" } } : { title: "記事一覧｜BEST-FIT" };
}

export default function ArticlesIndex() {
  const arts = Object.entries(urlMeta()).filter(([p]) => /^\/articles\/[^/]+\/[^/]+$/.test(p));
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">エリア記事一覧</h1>
      <ul className="space-y-2 text-sm">
        {arts.map(([p, m]) => (
          <li key={p}><Link href={p} className="text-blue-700 hover:underline">{m.title.split("｜")[0]}</Link></li>
        ))}
      </ul>
    </div>
  );
}

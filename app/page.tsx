import Link from "next/link";
import type { Metadata } from "next";
import { metaFor, taxonomies, brands, stores } from "@/lib/data";

export function generateMetadata(): Metadata {
  const m = metaFor("/");
  return m ? { title: { absolute: m.title }, description: m.desc, alternates: { canonical: "/" } } : {};
}

export default function Home() {
  const tax = taxonomies();
  const storeCount = Object.keys(stores()).length;
  const brandCount = Object.keys(brands()).length;
  return (
    <div>
      <section className="text-white py-16 px-4" style={{ background: "linear-gradient(135deg, var(--bf-primary), #0a4f80)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">あなたに合うパーソナルジムが見つかる</h1>
          <p className="opacity-90">全国{brandCount}ブランド・{storeCount}店舗を料金・特徴・エリアで比較</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="font-bold text-lg mb-4">都道府県から探す</h2>
        <ul className="flex flex-wrap gap-2 mb-10 text-sm">
          {Object.entries(tax.pref).map(([id, name]) => (
            <li key={id}><Link href={`/gyms/list/pref-${id}`} className="text-blue-700 hover:underline">{name}</Link></li>
          ))}
        </ul>
        <h2 className="font-bold text-lg mb-4">特徴から探す</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {Object.entries(tax.feature).map(([id, name]) => (
            <li key={id}><Link href={`/gyms/list/feature-${id}`} className="text-blue-700 hover:underline">{name}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

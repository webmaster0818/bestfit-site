import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { metaFor, taxonomies } from "@/lib/data";
import GymConcierge from "@/components/GymConcierge";

export function generateMetadata(): Metadata {
  const m = metaFor("/gyms/list");
  return m ? { title: { absolute: m.title }, description: m.desc } : {};
}

export default function ListTop() {
  const tax = taxonomies();
  const conciergeStores = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "concierge-stores.json"), "utf-8"));
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">パーソナルジムを探す</h1>
      <div className="mb-8">
        <GymConcierge stores={conciergeStores} />
      </div>
      <h2 className="font-bold mb-3">都道府県から探す</h2>
      <ul className="flex flex-wrap gap-2 mb-8 text-sm">
        {Object.entries(tax.pref).map(([id, name]) => (
          <li key={id}><Link href={`/gyms/list/pref-${id}`} className="text-blue-700 hover:underline">{name}</Link></li>
        ))}
      </ul>
      <h2 className="font-bold mb-3">特徴から探す</h2>
      <ul className="flex flex-wrap gap-2 text-sm">
        {Object.entries(tax.feature).map(([id, name]) => (
          <li key={id}><Link href={`/gyms/list/feature-${id}`} className="text-blue-700 hover:underline">{name}</Link></li>
        ))}
      </ul>
    </div>
  );
}

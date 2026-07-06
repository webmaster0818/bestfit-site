'use client';

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Row = { p: string; n: string; b: string; pr?: string; ct?: string; wd?: string; f: string[]; mp: number | null };
type Feature = { id: string; name: string; category: string };
type AreaTree = Record<string, { name: string; cities: Record<string, { name: string; wards: Record<string, string> }> }>;

export default function SearchResults({ index, features, areas }: { index: Row[]; features: Feature[]; areas: AreaTree }) {
  const params = useSearchParams();
  const pref = params.get("pref") || "";
  const city = params.get("city") || "";
  const ward = params.get("ward") || "";
  const feats = (params.get("f") || "").split(",").filter(Boolean);
  const fname = (id: string) => features.find((x) => x.id === id)?.name || "";

  const hits = useMemo(
    () =>
      index.filter((r) => {
        if (pref && r.pr !== pref) return false;
        if (city && r.ct !== city) return false;
        if (ward && r.wd !== ward) return false;
        return feats.every((f) => r.f.includes(f));
      }),
    [index, pref, city, ward, feats.join(",")]
  );

  const areaLabel = [pref && areas[pref]?.name, city && areas[pref]?.cities[city]?.name, ward && areas[pref]?.cities[city]?.wards[ward]]
    .filter(Boolean)
    .join(" ");
  const condLabel = feats.map(fname).filter(Boolean).join("・");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl md:text-2xl font-extrabold mb-2">
        {[areaLabel, condLabel].filter(Boolean).join("×") || "すべて"}のパーソナルジム検索結果
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--bf-muted)" }}>{hits.length}件が条件に一致しました（複数条件の絞り込み結果）</p>
      <div className="space-y-4">
        {hits.map((r) => (
          <div key={r.p} className="bf-card bf-card-hover p-5">
            <h2 className="font-bold text-lg">
              <Link href={r.p} className="hover:underline" style={{ color: "var(--bf-primary)" }}>
                {r.b} {r.n}
              </Link>
            </h2>
            <div className="text-sm mt-1 space-y-0.5" style={{ color: "#475569" }}>
              {typeof r.mp === "number" && <p>💰 <span className="bf-price">{r.mp.toLocaleString()}円〜</span></p>}
              <p className="flex flex-wrap gap-1.5 mt-1.5">
                {r.f.slice(0, 6).map((f) => fname(f) && <span key={f} className="bf-chip">{fname(f)}</span>)}
              </p>
            </div>
          </div>
        ))}
        {hits.length === 0 && (
          <div className="bf-card p-8 text-center text-sm" style={{ color: "var(--bf-muted)" }}>
            条件に一致するジムが見つかりませんでした。条件を減らして再検索してみてください。
          </div>
        )}
      </div>
    </div>
  );
}

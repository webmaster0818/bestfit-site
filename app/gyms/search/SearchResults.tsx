'use client';

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { IcoYen, IcoChevron } from "@/components/Ico";
import PageHero from "@/components/PageHero";

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
    <div>
      <PageHero
        eyebrow="PERSONAL GYM SEARCH"
        title={`${[areaLabel, condLabel].filter(Boolean).join("×") || "すべて"}のパーソナルジム検索結果`}
        subtitle={`${hits.length}件が条件に一致しました（複数条件の絞り込み結果）`}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {hits.map((r) => (
          <Link key={r.p} href={r.p} className="bf-card bf-card-hover p-5 block group relative">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-extrabold text-lg group-hover:underline" style={{ color: "var(--bf-primary)" }}>
                {r.b} {r.n}
              </h2>
              {typeof r.mp === "number" && (
                <div className="shrink-0 text-right rounded-lg px-3 py-1.5" style={{ background: "var(--bf-primary-soft)" }}>
                  <p className="text-[10px] font-bold" style={{ color: "var(--bf-muted)" }}>最安プラン</p>
                  <p className="bf-price text-base leading-tight">{r.mp.toLocaleString()}<span className="text-[10px]">円〜</span></p>
                </div>
              )}
            </div>
            <p className="flex flex-wrap gap-1.5 mt-3">
              {r.f.slice(0, 6).map((f) => fname(f) && <span key={f} className="bf-chip">{fname(f)}</span>)}
            </p>
            <span className="absolute bottom-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm group-hover:translate-x-0.5 transition-transform" style={{ background: "var(--bf-primary)" }}><IcoChevron /></span>
          </Link>
        ))}
        {hits.length === 0 && (
          <div className="bf-card p-8 text-center text-sm" style={{ color: "var(--bf-muted)" }}>
            条件に一致するジムが見つかりませんでした。条件を減らして再検索してみてください。
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AreaTree = Record<string, { name: string; cities: Record<string, { name: string; wards: Record<string, string> }> }>;
type Feature = { id: string; name: string; category: string; key: string };

const CATEGORY_ORDER = ["サービス", "施設", "トレーナー", "トレーニング目的", "食事指導", "トレーニング種類・器具"];

export default function SearchPanel({ areas, features }: { areas: AreaTree; features: Feature[] }) {
  const router = useRouter();
  const [pref, setPref] = useState("");
  const [city, setCity] = useState("");
  const [ward, setWard] = useState("");
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const cities = pref ? areas[pref]?.cities || {} : {};
  const wards = pref && city ? cities[city]?.wards || {} : {};
  const grouped = useMemo(() => {
    const g: Record<string, Feature[]> = {};
    for (const f of features) (g[f.category] ||= []).push(f);
    for (const k of Object.keys(g)) g[k].sort((a, b) => a.key.localeCompare(b.key));
    return g;
  }, [features]);

  const toggle = (id: string) => {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  };

  const search = () => {
    const feats = [...checked];
    // 単一条件は既存の静的一覧URLへ、複数条件はクライアント検索ページへ
    if (feats.length <= 1) {
      const segs: string[] = [];
      if (pref) segs.push(`pref-${pref}`);
      if (city) segs.push(`city-${city}`);
      if (ward) segs.push(`ward-${ward}`);
      if (feats.length === 1) segs.push(`feature-${feats[0]}`);
      router.push(segs.length ? `/gyms/list/${segs.join("/")}` : "/gyms/list");
      return;
    }
    const q = new URLSearchParams();
    if (pref) q.set("pref", pref);
    if (city) q.set("city", city);
    if (ward) q.set("ward", ward);
    q.set("f", feats.join(","));
    router.push(`/gyms/search?${q.toString()}`);
  };

  const selectCls = "w-full rounded-lg border border-white/30 bg-white/95 px-3 py-2.5 text-sm font-semibold text-slate-800";

  return (
    <div className="rounded-2xl p-5 md:p-6 shadow-2xl" style={{ background: "rgba(20, 24, 32, 0.82)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
      <p className="text-white font-extrabold mb-3 text-sm tracking-wider">エリアと条件からパーソナルジムを探す</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <select className={selectCls} value={pref} onChange={(e) => { setPref(e.target.value); setCity(""); setWard(""); }}>
          <option value="">都道府県を選ぶ</option>
          {Object.entries(areas).map(([id, a]) => (
            <option key={id} value={id}>{a.name}</option>
          ))}
        </select>
        <select className={selectCls} value={city} disabled={!pref} onChange={(e) => { setCity(e.target.value); setWard(""); }}>
          <option value="">市区町村を選ぶ</option>
          {Object.entries(cities).map(([id, c]) => (
            <option key={id} value={id}>{c.name.replace(areas[pref]?.name || "", "") || c.name}</option>
          ))}
        </select>
        <select className={selectCls} value={ward} disabled={!city || Object.keys(wards).length === 0} onChange={(e) => setWard(e.target.value)}>
          <option value="">{Object.keys(wards).length ? "区を選ぶ" : "区の指定なし"}</option>
          {Object.entries(wards).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-center text-white/90 text-xs font-bold py-2 rounded-lg border border-white/25 hover:bg-white/10 transition-colors mb-3"
      >
        {open ? "こだわり条件を閉じる ▲" : `こだわり条件で絞り込む（複数選択OK）${checked.size ? ` ✓${checked.size}件選択中` : ""} ▼`}
      </button>

      {open && (
        <div className="rounded-xl bg-white/95 p-4 mb-3 max-h-80 overflow-y-auto">
          {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
            <div key={cat} className="mb-4">
              <p className="text-xs font-extrabold text-slate-700 border-b border-slate-200 pb-1 mb-2">{cat}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {grouped[cat].map((f) => (
                  <label key={f.id} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={checked.has(f.id)} onChange={() => toggle(f.id)} className="w-4 h-4 accent-blue-700" />
                    {f.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={search} className="bf-cta w-full text-base">
        この条件でジムを検索する
      </button>
    </div>
  );
}

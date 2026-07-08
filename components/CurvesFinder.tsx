'use client';

import { useState, useMemo } from "react";

type Store = { name: string; address: string; lat: number; lng: number; rating?: number; count?: number; hours?: string[]; mapsUri?: string; pref: string; city: string };

const AFF = "https://t.felmat.net/fmcl?ak=G10564N.1.1149440N.A132329L";

// 目的→カーブスが合うか(公式検証済みの事実ベース・捏造なし)
const GOALS: { id: string; label: string; fit: "high" | "mid"; note: string }[] = [
  { id: "health", label: "健康維持・運動不足解消", fit: "high", note: "1回30分の有酸素＋筋トレ＋ストレッチを丸ごと行える設計で、運動習慣づくりに向いています。予約不要で好きな時間に通えます。" },
  { id: "diet", label: "無理なく体型維持・ダイエット", fit: "high", note: "筋力アップで代謝を上げる方針。短時間でも継続しやすく、継続率97.7％（公式公表）が示すとおり「続けやすさ」で結果を狙うタイプです。" },
  { id: "senior", label: "シニア・久しぶりの運動", fit: "high", note: "女性専用・30分完結・スタッフのサポートありで、体力に自信がない方や年齢が気になる方でも始めやすい環境です。" },
  { id: "hardbody", label: "短期集中で大きく体を変えたい", fit: "mid", note: "カーブスは「継続で健康的に」が軸のため、2〜3ヶ月で劇的なボディメイクを目指すなら、マンツーマンのパーソナルジムのほうが向く場合があります。" },
  { id: "male", label: "男性も通いたい", fit: "mid", note: "カーブスは女性専用のため男性は対象外です。男性は他のジムをご検討ください。" },
];

function dist(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function CurvesFinder({ stores }: { stores: Store[] }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<typeof GOALS[number] | null>(null);
  const [pref, setPref] = useState("");
  const [city, setCity] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErr, setGeoErr] = useState("");

  const prefs = useMemo(() => [...new Set(stores.map((s) => s.pref).filter(Boolean))].sort(), [stores]);
  const cities = useMemo(() => [...new Set(stores.filter((s) => s.pref === pref).map((s) => s.city).filter(Boolean))].sort(), [stores, pref]);

  const results = useMemo(() => {
    let list = stores.filter((s) => (!pref || s.pref === pref) && (!city || s.city === city));
    if (geo) list = [...list].sort((a, b) => dist(geo, a) - dist(geo, b));
    return list.slice(0, 8);
  }, [stores, pref, city, geo]);

  const useLocation = () => {
    if (!navigator.geolocation) { setGeoErr("お使いの端末では現在地を取得できません。エリアを選んでください。"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }); setStep(3); setGeoErr(""); },
      () => setGeoErr("現在地を取得できませんでした。エリアを選んでください。")
    );
  };

  return (
    <section className="mb-8 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, var(--bf-primary), var(--bf-primary-deep, #0b4fd6))" }}>
      {/* カラーヘッダー(料金ボックスの白カードと差別化) */}
      <div className="px-5 pt-5 pb-4 text-white">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.22)" }}>
          <span>🎯</span>無料・30秒でわかる
        </span>
        <h2 className="text-xl font-extrabold leading-snug drop-shadow-sm">あなたにカーブスは合う？<br />近くの店舗まで まとめて診断</h2>
        <p className="text-xs mt-1.5 opacity-90">2つの質問に答えるだけ。目的との相性と、通える店舗がすぐ分かります。</p>
      </div>
      {/* 白の操作エリア */}
      <div className="bg-white rounded-t-2xl p-5 -mb-px">

      {/* Step1: 目的 */}
      {step === 1 && (
        <div>
          <p className="text-sm font-bold mb-2">Q1. 何を叶えたいですか？</p>
          <div className="grid gap-2">
            {GOALS.map((g) => (
              <button key={g.id} onClick={() => { setGoal(g); setStep(2); }} className="text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors" style={{ background: "var(--bf-primary-soft)", color: "var(--bf-primary)" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 男性: カーブスは女性専用→自社の男性OKパーソナルジムへ誘導(矛盾解消) */}
      {step === 2 && goal && goal.id === "male" && (
        <div>
          <div className="rounded-lg p-3 mb-4 text-xs leading-6" style={{ background: "#fff7ed", color: "var(--bf-ink)" }}>
            <strong>！ カーブスは女性専用です</strong>：{goal.note}
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "var(--bf-primary-soft)" }}>
            <p className="text-sm font-bold mb-1">男性も通えるパーソナルジムを探す</p>
            <p className="text-[11px] mb-3" style={{ color: "var(--bf-muted)" }}>BEST-FITでは男性歓迎のパーソナルジムを、エリア・料金・こだわり条件で比較できます。</p>
            <a href="/gyms/search" className="bf-cta inline-block">男性OKのジムを探す →</a>
          </div>
          <button onClick={() => { setStep(1); setGoal(null); }} className="w-full mt-3 text-xs underline" style={{ color: "var(--bf-muted)" }}>最初からやり直す</button>
        </div>
      )}

      {/* Step2: エリア */}
      {step === 2 && goal && goal.id !== "male" && (
        <div>
          <div className="rounded-lg p-3 mb-4 text-xs leading-6" style={{ background: goal.fit === "high" ? "#ecfdf5" : "#fff7ed", color: "var(--bf-ink)" }}>
            <strong>{goal.fit === "high" ? "✓ カーブス向きです" : "！ 一度ご確認を"}</strong>：{goal.note}
          </div>
          <p className="text-sm font-bold mb-2">Q2. どのあたりで通いたいですか？</p>
          <button onClick={useLocation} className="w-full mb-3 px-4 py-2.5 rounded-lg text-sm font-bold" style={{ background: "#111827", color: "#fff" }}>📍 現在地の近くで探す</button>
          {geoErr && <p className="text-[11px] mb-2" style={{ color: "#dc2626" }}>{geoErr}</p>}
          <div className="grid grid-cols-2 gap-2">
            <select value={pref} onChange={(e) => { setPref(e.target.value); setCity(""); }} className="border rounded-lg px-2 py-2 text-sm" style={{ borderColor: "var(--bf-line)" }}>
              <option value="">都道府県</option>
              {prefs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!pref} className="border rounded-lg px-2 py-2 text-sm" style={{ borderColor: "var(--bf-line)" }}>
              <option value="">市区町村（任意）</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => setStep(3)} disabled={!pref && !geo} className="w-full mt-3 bf-cta" style={{ opacity: !pref && !geo ? 0.5 : 1 }}>この条件で店舗を見る</button>
        </div>
      )}

      {/* Step3: 結果 */}
      {step === 3 && goal && (
        <div>
          <div className="rounded-lg p-3 mb-4 text-xs leading-6" style={{ background: goal.fit === "high" ? "#ecfdf5" : "#fff7ed", color: "var(--bf-ink)" }}>
            <strong>診断結果：{goal.label}</strong><br />{goal.note}
          </div>
          <p className="text-sm font-bold mb-2">{geo ? "現在地に近い" : [pref, city].filter(Boolean).join("")}カーブス店舗{results.length > 0 ? `（${results.length}件）` : ""}</p>
          {results.length === 0 ? (
            <p className="text-sm mb-3" style={{ color: "var(--bf-muted)" }}>掲載データに該当店舗が見つかりませんでした。公式サイトの店舗検索で最新の店舗をご確認ください。</p>
          ) : (
            <div className="space-y-2 mb-4">
              {results.map((s, i) => (
                <div key={i} className="rounded-lg p-3" style={{ border: "1px solid var(--bf-line)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <a href={AFF} rel="sponsored nofollow" target="_blank" className="font-bold text-sm hover:underline" style={{ color: "var(--bf-primary)" }}>{s.name}</a>
                    {s.rating != null && <span className="text-xs whitespace-nowrap" style={{ color: "#f59e0b" }}>★{s.rating.toFixed(1)}<span style={{ color: "var(--bf-muted)" }}>（{s.count}）</span></span>}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--bf-muted)" }}>{s.address}{geo && `　約${dist(geo, s).toFixed(1)}km`}</p>
                  <div className="flex gap-3 mt-1">
                    <a href={AFF} rel="sponsored nofollow" target="_blank" className="text-[11px] font-bold underline" style={{ color: "var(--bf-primary)" }}>公式で体験予約 →</a>
                    {s.mapsUri && <a href={s.mapsUri} target="_blank" rel="noopener noreferrer" className="text-[11px] underline" style={{ color: "var(--bf-muted)" }}>Googleマップで見る →</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl p-4 text-center" style={{ background: "var(--bf-primary-soft)" }}>
            <p className="text-sm font-bold mb-1">気になる店舗が見つかったら</p>
            <p className="text-[11px] mb-3" style={{ color: "var(--bf-muted)" }}>入会金無料などのキャンペーンや無料体験は公式サイトで確認・予約できます</p>
            <a href={AFF} rel="sponsored nofollow" target="_blank" className="bf-cta inline-block">カーブス公式で無料体験を予約する</a>
            <p className="text-[10px] mt-2" style={{ color: "var(--bf-muted)" }}>※広告リンク（アフィリエイト）を含みます</p>
          </div>
          <button onClick={() => { setStep(1); setGoal(null); setPref(""); setCity(""); setGeo(null); }} className="w-full mt-3 text-xs underline" style={{ color: "var(--bf-muted)" }}>最初からやり直す</button>
        </div>
      )}
      <p className="text-[10px] mt-3" style={{ color: "var(--bf-muted)" }}>※店舗情報・評点はGoogleマップの実データ（{stores.length}店舗掲載）。目的との相性は公式の特徴（女性専用・30分・継続率97.7％等）にもとづく当サイトの整理です。最新の店舗・料金は公式サイトでご確認ください。</p>
      </div>
    </section>
  );
}

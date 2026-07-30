'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

type Store = {
  path: string; brand: string; name: string; pref: string; city: string; access: string;
  feat: string[]; aff: string; per: number | null; rating: number | null; count: number | null;
  lat: number | null; lng: number | null; join0: boolean;
};

// 目的→合致featureのマッピング(実データの特徴名で判定・捏造なし)
const GOALS: { id: string; label: string; emoji: string; feats: string[] }[] = [
  { id: "diet", label: "しっかり痩せたい・ダイエット", emoji: "🔥", feats: ["ダイエット", "食事指導", "カロリー計算", "脱・リバウンド"] },
  { id: "body", label: "ボディメイク・引き締め", emoji: "💪", feats: ["フリーウエイト", "マシン", "HIIT", "自重"] },
  { id: "health", label: "健康維持・運動不足解消", emoji: "🌿", feats: ["健康・体型維持", "運動不足解消", "健康診断の数値改善"] },
  { id: "postnatal", label: "産後の体型を戻したい", emoji: "🍼", feats: ["産後ダイエット", "子連れOK"] },
  { id: "posture", label: "姿勢・体の歪みを整えたい", emoji: "🧘", feats: ["姿勢改善", "ストレス発散"] },
];

const CONDS: { label: string; feat: string }[] = [
  { label: "女性専用", feat: "女性専用" },
  { label: "女性トレーナー在籍", feat: "女性トレーナー在籍" },
  { label: "完全個室", feat: "完全個室" },
  { label: "食事指導あり", feat: "食事指導" },
  { label: "手ぶらOK", feat: "手ぶらOK" },
  { label: "シャワーあり", feat: "シャワー" },
  { label: "パウダールーム", feat: "パウダールーム" },
  { label: "子連れOK", feat: "子連れOK" },
  { label: "駐車場あり", feat: "駐車場" },
  { label: "早朝・深夜OK", feat: "早朝深夜" },
  { label: "トレーナー担当制", feat: "トレーナー担当制" },
  { label: "月額制", feat: "月額制" },
];

function dist(aLat: number, aLng: number, b: Store) {
  if (b.lat == null || b.lng == null) return Infinity;
  const R = 6371, dLat = ((b.lat - aLat) * Math.PI) / 180, dLng = ((b.lng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// キャラクター(女性トレーナー「フィティ」・Nano Banana Pro生成イラスト)
// variant: "full"=全身(ヘッダー) / "face"=顔アップ(吹き出し・小サイズで視認性◎)
function Fitty({ size = 40, variant = "face" }: { size?: number; variant?: "full" | "face" }) {
  const src = variant === "full" ? "/concierge-fitty.png" : "/concierge-fitty-face.png";
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="AIジム診断コンシェルジュ フィティ"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, background: "#dbeafe" }}
    />
  );
}

// タイピング演出
function TypingText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); onDone?.(); }
    }, 22);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <span>{shown}{shown.length < text.length && <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle animate-pulse" style={{ background: "var(--bf-primary)" }} />}</span>;
}

type Msg = { role: "bot" | "user"; text: string };
type Step = "goal" | "pref" | "city" | "cond" | "result";

export default function GymConcierge({ stores }: { stores: Store[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>("goal");
  const [goal, setGoal] = useState<typeof GOALS[number] | null>(null);
  const [pref, setPref] = useState("");
  const [city, setCity] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [conds, setConds] = useState<string[]>([]);
  const [typingDone, setTypingDone] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const say = (text: string) => { setTypingDone(false); setMsgs((m) => [...m, { role: "bot", text }]); };
  const user = (text: string) => setMsgs((m) => [...m, { role: "user", text }]);

  useEffect(() => { if (msgs.length === 0) say("こんにちは！AIコンシェルジュのフィティです💪 あなたにぴったりのパーソナルジムを一緒に探します。まず、目的を教えてください！"); /* eslint-disable-next-line */ }, []);
  useEffect(() => { const b = boxRef.current; if (b) b.scrollTop = b.scrollHeight; }, [msgs, typingDone]);

  const prefs = useMemo(() => [...new Set(stores.map((s) => s.pref).filter(Boolean))].sort(), [stores]);
  const cities = useMemo(() => [...new Set(stores.filter((s) => s.pref === pref).map((s) => s.city).filter(Boolean))].sort(), [stores, pref]);

  const results = useMemo(() => {
    if (!goal) return [];
    let list = stores.filter((s) => goal.feats.some((f) => s.feat.includes(f)));
    if (pref) list = list.filter((s) => s.pref === pref);
    if (city) list = list.filter((s) => s.city === city);
    for (const c of conds) list = list.filter((s) => s.feat.includes(c) || (c === "月額制" && s.feat.includes("月額制")));
    if (geo) list = [...list].sort((a, b) => dist(geo.lat, geo.lng, a) - dist(geo.lat, geo.lng, b));
    else list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list.slice(0, 8);
  }, [stores, goal, pref, city, conds, geo]);

  const goResult = () => { setStep("result"); say(`条件に合うジムを${results.length > 0 ? `${results.length}件` : ""}お探ししました！気になる店舗の「公式サイト」から無料カウンセリングを予約できますよ。`); };

  const back = () => {
    if (step === "city") { setStep("pref"); setCity(""); }
    else if (step === "cond") { setStep(geo ? "goal" : "pref"); }
    else if (step === "result") { setStep("cond"); }
    else if (step === "pref") { setStep("goal"); setPref(""); }
  };
  const restart = () => { setMsgs([]); setStep("goal"); setGoal(null); setPref(""); setCity(""); setGeo(null); setConds([]); setTimeout(() => say("もう一度、目的から一緒に探しましょう！"), 50); };

  const useGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }); user("現在地の近くで探す"); say("現在地を確認しました！こだわり条件はありますか？（複数選べます・なければスキップOK）"); setStep("cond"); },
      () => { say("現在地を取得できませんでした。エリアを選んでくださいね。"); }
    );
  };

  return (
    <section className="rounded-2xl overflow-hidden shadow-lg mb-8" style={{ border: "1px solid var(--bf-line)" }}>
      {/* ヘッダー(キャラ) */}
      <div className="px-4 py-3 flex items-center gap-2.5 text-white" style={{ background: "linear-gradient(135deg, var(--bf-primary), var(--bf-primary-deep))" }}>
        <Fitty size={44} variant="full" />
        <div>
          <p className="font-extrabold leading-tight">AIジム診断コンシェルジュ「フィティ」</p>
          <p className="text-[11px] opacity-90">目的・エリア・こだわりから、あなたに合うジムを提案します</p>
        </div>
      </div>

      {/* チャット */}
      <div ref={boxRef} className="p-4 max-h-[420px] overflow-y-auto" style={{ background: "#f8fafd" }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 mb-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "bot" && <Fitty size={30} />}
            <div className={`text-sm leading-6 px-3.5 py-2 rounded-2xl max-w-[80%] ${m.role === "user" ? "rounded-tr-sm text-white" : "rounded-tl-sm bg-white"}`} style={m.role === "user" ? { background: "var(--bf-primary)" } : { border: "1px solid var(--bf-line)", color: "var(--bf-ink)" }}>
              {m.role === "bot" && i === msgs.length - 1 ? <TypingText text={m.text} onDone={() => setTypingDone(true)} /> : m.text}
            </div>
          </div>
        ))}
      </div>

      {/* 操作エリア */}
      <div className="p-4 border-t" style={{ borderColor: "var(--bf-line)", background: "#fff" }}>
        {/* Step: 目的 */}
        {step === "goal" && typingDone && (
          <div className="grid gap-2">
            {GOALS.map((g) => (
              <button key={g.id} onClick={() => { setGoal(g); user(g.label); say("いいですね！次は、どのあたりで通いたいですか？現在地から探すか、エリアを選んでください。"); setStep("pref"); }} className="text-left px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--bf-primary-soft)", color: "var(--bf-primary)" }}>
                <span className="mr-1.5">{g.emoji}</span>{g.label}
              </button>
            ))}
          </div>
        )}
        {/* Step: エリア(都道府県) */}
        {step === "pref" && (
          <div>
            <button onClick={useGeo} className="w-full mb-3 px-4 py-2.5 rounded-lg text-sm font-bold" style={{ background: "#111827", color: "#fff" }}>📍 現在地の近くで探す</button>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--bf-muted)" }}>またはエリアを選ぶ</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {prefs.map((pr) => (
                <button key={pr} onClick={() => { setPref(pr); user(pr); say(`${pr}ですね！市区町村を選ぶとさらに絞り込めます（「この地域で探す」で全域もOK）。`); setStep("city"); }} className="bf-chip-link">{pr}</button>
              ))}
            </div>
            <div className="mt-3"><button onClick={back} className="text-xs underline" style={{ color: "var(--bf-muted)" }}>← 目的を選び直す</button></div>
          </div>
        )}
        {/* Step: 市区 */}
        {step === "city" && (
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button onClick={() => { user(`${pref}全域`); say("こだわり条件はありますか？（複数選べます・なければ「この条件で見る」でOK）"); setStep("cond"); }} className="bf-chip" style={{ background: "var(--bf-primary)", color: "#fff" }}>{pref}全域で探す</button>
              {cities.map((c) => (
                <button key={c} onClick={() => { setCity(c); user(c); say("こだわり条件はありますか？（複数選べます・なければ「この条件で見る」でOK）"); setStep("cond"); }} className="bf-chip-link">{c.replace(pref, "")}</button>
              ))}
            </div>
            <button onClick={back} className="text-xs underline" style={{ color: "var(--bf-muted)" }}>← 都道府県を選び直す</button>
          </div>
        )}
        {/* Step: こだわり(複数) */}
        {step === "cond" && (
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--bf-muted)" }}>こだわり条件（複数選択OK）</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CONDS.map((c) => {
                const on = conds.includes(c.feat);
                return <button key={c.feat} onClick={() => setConds((p) => on ? p.filter((x) => x !== c.feat) : [...p, c.feat])} className="bf-chip" style={on ? { background: "var(--bf-primary)", color: "#fff" } : undefined}>{on ? `✓ ${c.label}` : c.label}</button>;
              })}
            </div>
            <button onClick={() => { user(conds.length ? `条件: ${conds.map((f) => CONDS.find((c) => c.feat === f)?.label).join("・")}` : "こだわりなし"); goResult(); }} className="w-full bf-cta">この条件で見る（{results.length}件）</button>
            <div className="mt-2"><button onClick={back} className="text-xs underline" style={{ color: "var(--bf-muted)" }}>← エリアを選び直す</button></div>
          </div>
        )}
        {/* Step: 結果 */}
        {step === "result" && (
          <div>
            {results.length === 0 ? (
              <p className="text-sm mb-3" style={{ color: "var(--bf-muted)" }}>条件に合うジムが見つかりませんでした。こだわり条件を減らすか、エリアを広げてみてください。</p>
            ) : (
              <div className="space-y-2.5 mb-3">
                {results.map((s) => (
                  <div key={s.path} className="rounded-xl p-3" style={{ border: "1px solid var(--bf-line)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <Link href={s.path} className="font-bold text-sm hover:underline" style={{ color: "var(--bf-primary)" }}>{s.brand} {s.name}</Link>
                      {s.rating != null && <span className="text-xs whitespace-nowrap" style={{ color: "#f59e0b" }}>★{s.rating.toFixed(1)}<span style={{ color: "var(--bf-muted)" }}>（{s.count}）</span></span>}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--bf-muted)" }}>
                      {s.access}{geo ? `　約${dist(geo.lat, geo.lng, s).toFixed(1)}km` : ""}{s.per ? `　1回あたり${s.per.toLocaleString()}円〜` : ""}{s.join0 ? "　入会金無料" : ""}
                    </p>
                    <div className="flex gap-2 mt-1.5">
                      <Link href={s.path} className="text-[11px] underline" style={{ color: "var(--bf-muted)" }}>詳細を見る</Link>
                      <a href={s.aff} rel="sponsored nofollow" target="_blank" className="text-[11px] font-bold underline" style={{ color: "var(--bf-primary)" }}>公式サイトで無料カウンセリング予約 →</a>
                    </div>
                  </div>
                ))}
                <p className="text-[10px]" style={{ color: "var(--bf-muted)" }}>※「公式サイト」ボタンは広告リンク（アフィリエイト）を含みます。店舗情報・評点はGoogleマップ等の実データです。</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setStep("cond"); say("こだわり条件を追加・変更して、さらに絞り込みましょう！"); }} className="bf-cta-sub">🔎 さらに条件で絞り込む</button>
              <button onClick={restart} className="bf-cta-sub">最初からやり直す</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

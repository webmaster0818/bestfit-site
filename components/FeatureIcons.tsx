import Link from "next/link";

// TOP「特徴から探す」: 現行デザイン踏襲(白カード×アイコン×青ラベルバー)のモダン版。4列×2行固定
const ICONS: Record<string, React.ReactNode> = {
  female: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><circle cx="12" cy="8" r="4" /><path d="M12 12v6M9 21h6M9 18h6" /></svg>
  ),
  trainer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><circle cx="9" cy="7" r="3.5" /><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 4l4 2-4 2M20 6v6" /></svg>
  ),
  monthly: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4M8 14h3M8 17h6" /></svg>
  ),
  meal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3.2" /><path d="M2.5 6v5M4.5 6v5M3.5 11v7M21.5 6c-1.5 1-1.5 4 0 5v7" /></svg>
  ),
  room: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 3v18" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></svg>
  ),
  nofee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><circle cx="12" cy="12" r="8.5" /><path d="M8.5 8l3.5 4.5L15.5 8M12 12.5V17M9.5 13.5h5M9.5 15.5h5" /></svg>
  ),
  unlimited: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><path d="M8 12c-2 2.5-4 2.5-5 1s-1-4 1-5 4 0 5 1.5l6 5c2 2.5 4 2.5 5 1s1-4-1-5-4 0-5 1.5" /></svg>
  ),
  freehand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 md:w-11 md:h-11"><path d="M6 8h12l1.5 12h-15L6 8z" /><path d="M9 8V6a3 3 0 016 0v2" /><path d="M9.5 14l2 2 3.5-3.5" /></svg>
  ),
};

const FEATURES: { id: string; name: string; icon: keyof typeof ICONS }[] = [
  { id: "4JsEjXzikuOX5CIA", name: "女性専用", icon: "female" },
  { id: "6zdj3YfuB4n4u0Tt", name: "女性トレーナー在籍", icon: "trainer" },
  { id: "sGSCtxosyziST0Qi", name: "月額制", icon: "monthly" },
  { id: "lV7bwsP4oRNlgcKh", name: "食事指導あり", icon: "meal" },
  { id: "qW52olWvgbex8Hyq", name: "完全個室", icon: "room" },
  { id: "hSvoqkFkXCCDRqDt", name: "入会金不要", icon: "nofee" },
  { id: "vvlAReyeCjuE8LLS", name: "通い放題", icon: "unlimited" },
  { id: "59LjqHB6raw2Edfz", name: "手ぶらOK", icon: "freehand" },
];

export default function FeatureIcons() {
  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-center text-sm font-extrabold tracking-widest mb-1" style={{ color: "var(--bf-primary)" }}>Features</p>
        <h2 className="text-center text-xl md:text-2xl font-extrabold mb-6" style={{ color: "var(--bf-ink)" }}>特徴からパーソナルジムを探す</h2>
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {FEATURES.map((f) => (
            <Link key={f.id} href={`/gyms/list/feature-${f.id}`} className="bf-card bf-card-hover overflow-hidden flex flex-col group">
              <div className="flex-1 flex items-center justify-center py-4 md:py-6" style={{ color: "var(--bf-ink)" }}>
                {ICONS[f.icon]}
              </div>
              <div className="flex items-center justify-center gap-1 px-1 py-2 md:py-2.5 text-white text-[10px] md:text-sm font-bold" style={{ background: "linear-gradient(135deg, var(--bf-primary), var(--bf-primary-deep))" }}>
                <span className="truncate">{f.name}</span>
                <span className="hidden md:inline">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import fs from "node:fs";
import path from "node:path";

// TOP「特徴から探す」: 現行サイトの実アイコン4種(女性専用/女性トレーナー/月額制/食事指導)+同テイスト自作4種
const FEATURES: { id: string; name: string; icon: string }[] = [
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
  const icons: Record<string, string> = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "feature-icons-svg.json"), "utf-8")
  );
  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-center text-sm font-extrabold tracking-widest mb-1" style={{ color: "var(--bf-primary)" }}>Features</p>
        <h2 className="text-center text-xl md:text-2xl font-extrabold mb-6" style={{ color: "var(--bf-ink)" }}>特徴からパーソナルジムを探す</h2>
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {FEATURES.map((f) => (
            <Link key={f.id} href={`/gyms/list/feature-${f.id}`} className="bf-card bf-card-hover overflow-hidden flex flex-col group">
              <div
                className="flex-1 flex items-center justify-center py-4 md:py-6 [&_svg]:w-10 [&_svg]:h-10 md:[&_svg]:w-14 md:[&_svg]:h-14"
                style={{ color: "var(--bf-ink)", fill: "var(--bf-ink)" }}
                dangerouslySetInnerHTML={{ __html: icons[f.icon] || "" }}
              />
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

import Image from "next/image";
import Link from "next/link";

// 全下層ページ共通ヒーロー: TOPと同じKV/ジム写真×薄い黒グラデのトーン
export default function PageHero({
  title,
  subtitle,
  eyebrow,
  asH1 = true,
  crumbs,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  asH1?: boolean;
  crumbs?: { href?: string; label: string }[];
}) {
  const TitleTag = (asH1 ? "h1" : "p") as any;
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/gym-bg-s.jpg" alt="" fill priority className="object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,18,24,0.72) 0%, rgba(15,18,24,0.45) 55%, rgba(15,18,24,0.25) 100%)" }} />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12 text-white">
        {eyebrow && <p className="text-[11px] font-bold tracking-[0.25em] opacity-85 mb-2">{eyebrow}</p>}
        {crumbs ? (
          <nav aria-label="パンくず" className="text-sm md:text-base font-bold drop-shadow flex flex-wrap items-center gap-1.5">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-60">›</span>}
                {c.href ? (
                  <Link href={c.href} className="underline-offset-2 hover:underline opacity-95">{c.label}</Link>
                ) : (
                  <span className="opacity-95">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          title && <TitleTag className="text-2xl md:text-3xl font-extrabold leading-snug drop-shadow">{title}</TitleTag>
        )}
        {subtitle && <p className="text-sm mt-2 opacity-90 drop-shadow">{subtitle}</p>}
      </div>
    </section>
  );
}

import Image from "next/image";

// 全下層ページ共通ヒーロー: TOPと同じKV/ジム写真×薄い黒グラデのトーン
export default function PageHero({
  title,
  subtitle,
  eyebrow,
  asH1 = true,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  asH1?: boolean;
}) {
  const TitleTag = (asH1 ? "h1" : "p") as any;
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/gym-bg-s.jpg" alt="" fill priority className="object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,18,24,0.72) 0%, rgba(15,18,24,0.45) 55%, rgba(15,18,24,0.25) 100%)" }} />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-14 text-white">
        {eyebrow && <p className="text-[11px] font-bold tracking-[0.25em] opacity-85 mb-2">{eyebrow}</p>}
        <TitleTag className="text-2xl md:text-3xl font-extrabold leading-snug drop-shadow">{title}</TitleTag>
        {subtitle && <p className="text-sm mt-2 opacity-90 drop-shadow">{subtitle}</p>}
      </div>
    </section>
  );
}

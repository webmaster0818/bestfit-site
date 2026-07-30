"use client";

import { useEffect, useRef } from "react";

// 白背景の下に薄くジム画像を敷き、スクロールに連動してゆっくりドリフトさせる背景レイヤー。
// 旧実装(background-attachment: fixed)はiOSで効かず動きも無いため、JS transformに置換。
// 画像は140%の高さで余白を持たせ、上方向ドリフトを余白内に収める。reduced-motionでは静止。
export default function BgParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const extra = window.innerHeight * 0.35;
        const y = Math.min(window.scrollY * 0.08, extra);
        el.style.transform = `translate3d(0, ${(-y).toFixed(1)}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ background: "#f8fafd" }}>
      <div ref={ref} className="absolute inset-x-0 top-0" style={{ height: "140%", willChange: "transform" }}>
        <img src="/images/gym-bg-s.jpg" alt="" className="h-full w-full object-cover" />
      </div>
      {/* 白のベール(この下に薄く画像が透ける) */}
      <div className="absolute inset-0" style={{ background: "rgba(248,250,253,0.9)" }} />
    </div>
  );
}

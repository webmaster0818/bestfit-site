"use client";

import { useEffect, useRef } from "react";

// TOPのKV画像をスクロール連動(パララックス)にするラッパー。
// ヒーローはページ先頭にあるため、係数<1の下方向トランスフォームなら
// 画像上端の隙間は常にビューポート外に収まり、初期表示のフレーミングは不変。
// prefers-reduced-motion では何もしない。
export default function HeroParallax({ children }: { children: React.ReactNode }) {
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
        const y = Math.min(window.scrollY, 900);
        el.style.transform = `translate3d(0, ${(y * 0.3).toFixed(1)}px, 0)`;
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
    <div ref={ref} className="absolute inset-0" style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

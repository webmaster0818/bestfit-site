'use client';

import { useState } from "react";

function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371, dLat = ((bLat - aLat) * Math.PI) / 180, dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// 現在地から近い順に並べ替え(サーバーレンダリングのカードをDOM操作で再ソート)
export default function DistanceSort({ containerId }: { containerId: string }) {
  const [state, setState] = useState<"" | "loading" | "done" | "error">("");

  const sort = () => {
    if (!navigator.geolocation) { setState("error"); return; }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const container = document.getElementById(containerId);
        if (!container) { setState("error"); return; }
        const cards = Array.from(container.querySelectorAll<HTMLElement>("[data-lat]"));
        const scored = cards.map((el) => {
          const la = parseFloat(el.dataset.lat || ""), ln = parseFloat(el.dataset.lng || "");
          const d = isFinite(la) && isFinite(ln) ? dist(latitude, longitude, la, ln) : Infinity;
          const slot = el.querySelector<HTMLElement>("[data-dist]");
          if (slot && isFinite(d)) slot.textContent = `現在地から約${d.toFixed(1)}km`;
          return { el, d };
        });
        scored.sort((a, b) => a.d - b.d);
        scored.forEach(({ el }) => container.appendChild(el));
        setState("done");
      },
      () => setState("error")
    );
  };

  return (
    <div className="mb-4">
      <button onClick={sort} disabled={state === "loading"} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold" style={{ background: "#111827", color: "#fff", opacity: state === "loading" ? 0.6 : 1 }}>
        📍 {state === "loading" ? "現在地を取得中…" : state === "done" ? "近い順に並べ替えました" : "現在地から近い順に並べ替える"}
      </button>
      {state === "error" && <p className="text-[11px] mt-1" style={{ color: "#dc2626" }}>現在地を取得できませんでした。ブラウザの位置情報を許可してお試しください。</p>}
    </div>
  );
}

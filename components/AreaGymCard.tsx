'use client';

import { useState } from "react";
import Link from "next/link";
import { IcoPin, IcoTrain, IcoYen, IcoClock } from "@/components/Ico";

type Plan = { name: string; price: number; sessionCount: number | null; minutes: number | null; membershipFee: number | null; perSession: number | null; isMonthly: boolean; note: string };
export type AreaCard = {
  path: string;
  name: string;
  brand: string;
  brandName: string;
  address?: string;
  access?: string;
  openingHours?: string;
  catchcopy?: string;
  affiliateLink?: string;
  features: string[];
  personas: string[];
  plans: Plan[];
  minPerSession: Plan | null;
  membershipFee: number | null;
};

const yen = (n: number) => `${n.toLocaleString()}円`;

// biyori型: タブ切替で同一カード内に情報を表示。口コミデータは持たないため生成しない
export default function AreaGymCard({ card, index }: { card: AreaCard; index: number }) {
  const tabs = [
    ...(card.plans.length ? [{ id: "plan", label: "人気プラン" }] : []),
    ...(card.personas.length ? [{ id: "persona", label: "こんな方におすすめ" }] : []),
    { id: "info", label: "基本情報" },
    { id: "map", label: "地図・アクセス" },
  ];
  const [tab, setTab] = useState(tabs[0].id);
  const mapQuery = encodeURIComponent(`${card.brandName} ${card.name} ${card.address || ""}`.trim());
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="bf-card p-5">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <h3 className="font-extrabold text-base">
          {index + 1}. <Link href={card.path} style={{ color: "var(--bf-primary)" }} className="hover:underline">{card.brandName} {card.name}</Link>
        </h3>
        {card.minPerSession && (
          <span className="text-right shrink-0">
            <span className="text-[10px] block" style={{ color: "var(--bf-muted)" }}>1回あたり（{card.minPerSession.sessionCount}回コース換算）</span>
            <span className="bf-price text-base">{card.minPerSession.perSession!.toLocaleString()}<span className="text-[10px]">円〜</span></span>
          </span>
        )}
      </div>
      {card.catchcopy && <p className="text-sm mb-2" style={{ color: "var(--bf-ink)" }}>{card.catchcopy}</p>}
      {card.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {card.features.map((f) => <span key={f} className="bf-chip">{f}</span>)}
        </div>
      )}

      {/* タブ: 選択=黒(白文字)/非選択=青(白文字)・角丸なし */}
      <div className="flex gap-0 mb-3 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors border-r border-white/30 last:border-r-0"
            style={tab === t.id ? { background: "#111827", color: "#fff" } : { background: "var(--bf-primary)", color: "#fff" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* パネル */}
      <div className="rounded-xl p-4 mb-3" style={{ background: "var(--bf-bg, #f8fafd)", border: "1px solid var(--bf-line)" }}>
        {tab === "plan" && (
          <div className="space-y-2.5">
            {card.plans.map((pl, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 border-b last:border-0 pb-2 last:pb-0" style={{ borderColor: "var(--bf-line)" }}>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{pl.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--bf-muted)" }}>
                    {pl.sessionCount ? `${pl.sessionCount}回` : "月額"}{pl.minutes ? ` / ${pl.minutes}分` : ""}{pl.membershipFee ? ` / 入会金${yen(pl.membershipFee)}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {pl.perSession ? <p className="bf-price text-sm">{yen(pl.perSession)}<span className="text-[10px]">/回</span></p> : <p className="bf-price text-sm">{yen(pl.price)}</p>}
                  <p className="text-[10px]" style={{ color: "var(--bf-muted)" }}>総額{yen(pl.price)}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px]" style={{ color: "var(--bf-muted)" }}>※「1回あたり」はコース総額÷回数の換算値（税込）。月額プランは総額表示です。</p>
          </div>
        )}
        {tab === "persona" && (
          <ul className="text-xs space-y-1.5" style={{ color: "var(--bf-ink)" }}>
            {card.personas.map((p) => (
              <li key={p} className="flex gap-2"><span style={{ color: "var(--bf-primary)" }} className="shrink-0">✓</span><span>{p}</span></li>
            ))}
            <li className="text-[10px] pt-1" style={{ color: "var(--bf-muted)" }}>※このジムのこだわり条件（設備・サービス）から向いている方を整理したものです。</li>
          </ul>
        )}
        {tab === "info" && (
          <ul className="text-xs space-y-2" style={{ color: "var(--bf-ink)" }}>
            {card.address && <li className="flex gap-2"><IcoPin className="text-xs shrink-0 mt-0.5" /><span>{card.address}</span></li>}
            {card.access && <li className="flex gap-2"><IcoTrain className="text-xs shrink-0 mt-0.5" /><span>{card.access}</span></li>}
            {card.openingHours && <li className="flex gap-2"><IcoClock className="text-xs shrink-0 mt-0.5" /><span>{card.openingHours}</span></li>}
            {card.membershipFee != null && <li className="flex gap-2"><IcoYen className="text-xs shrink-0 mt-0.5" /><span>入会金 {yen(card.membershipFee)}</span></li>}
          </ul>
        )}
        {tab === "map" && (
          <div>
            <p className="text-[11px] font-bold mb-1" style={{ color: "var(--bf-muted)" }}>最寄駅からのアクセス</p>
            <p className="text-xs flex gap-2 mb-3"><IcoTrain className="text-xs shrink-0 mt-0.5" /><span>{card.access || "公式サイトでご確認ください"}</span></p>
            <p className="text-[11px] font-bold mb-1" style={{ color: "var(--bf-muted)" }}>住所</p>
            <p className="text-xs flex gap-2 mb-3"><IcoPin className="text-xs shrink-0 mt-0.5" /><span>{card.address || "—"}</span></p>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="bf-cta-sub inline-block">Googleマップで場所を見る</a>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={card.path} className="bf-cta-sub">詳細・料金プランを見る</Link>
        {card.affiliateLink && (
          <a href={card.affiliateLink} rel="sponsored nofollow" target="_blank" className="bf-cta-sub" style={{ background: "var(--bf-primary)", color: "#fff" }}>公式サイトで無料カウンセリング予約</a>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
      setError("送信に失敗しました。お手数ですが時間をおいて再度お試しいただくか、恐れ入りますが別の手段でご連絡ください。");
    }
  }

  if (status === "done") {
    return (
      <div className="bf-card p-8 text-center">
        <p className="text-lg font-bold" style={{ color: "var(--bf-primary)" }}>
          お問い合わせを受け付けました
        </p>
        <p className="text-sm mt-3" style={{ color: "var(--bf-muted)" }}>
          内容を確認のうえ、担当者より順次ご連絡いたします。ありがとうございました。
        </p>
      </div>
    );
  }

  const labelCls = "block text-sm font-bold mb-1";
  const inputCls =
    "w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2";
  const inputStyle: React.CSSProperties = { borderColor: "var(--bf-line)" };
  const req = <span style={{ color: "var(--bf-accent)" }}> *</span>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* スパム対策のハニーポット（人間には非表示） */}
      <input
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
        aria-hidden="true"
      />

      <div>
        <label className={labelCls}>お問い合わせ種別{req}</label>
        <select name="category" className={inputCls} style={inputStyle} defaultValue="掲載に関する問い合わせ" required>
          <option>掲載に関する問い合わせ</option>
          <option>掲載情報の修正・削除依頼</option>
          <option>広告・提携のご相談</option>
          <option>その他</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>施設・店舗名</label>
          <input type="text" name="facility" className={inputCls} style={inputStyle} placeholder="例）BEST-FIT 渋谷店" />
        </div>
        <div>
          <label className={labelCls}>運営会社名</label>
          <input type="text" name="company" className={inputCls} style={inputStyle} placeholder="例）株式会社◯◯" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>ご担当者名{req}</label>
          <input type="text" name="name" className={inputCls} style={inputStyle} required placeholder="例）山田 太郎" />
        </div>
        <div>
          <label className={labelCls}>電話番号</label>
          <input type="tel" name="tel" className={inputCls} style={inputStyle} placeholder="例）03-1234-5678" />
        </div>
      </div>

      <div>
        <label className={labelCls}>メールアドレス{req}</label>
        <input type="email" name="email" className={inputCls} style={inputStyle} required placeholder="例）info@example.com" />
      </div>

      <div>
        <label className={labelCls}>掲載希望エリア・店舗</label>
        <input type="text" name="area" className={inputCls} style={inputStyle} placeholder="例）東京都渋谷区／全国3店舗" />
      </div>

      <div>
        <label className={labelCls}>お問い合わせ内容{req}</label>
        <textarea name="message" rows={6} className={inputCls} style={inputStyle} required placeholder="掲載のご希望や修正内容など、できるだけ具体的にご記入ください。" />
      </div>

      {status === "error" && (
        <p className="text-sm" style={{ color: "var(--bf-accent)" }}>{error}</p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full md:w-auto rounded-lg px-8 py-3 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "var(--bf-primary)" }}
        >
          {status === "sending" ? "送信中…" : "この内容で送信する"}
        </button>
      </div>

      <p className="text-xs" style={{ color: "var(--bf-muted)" }}>
        ご記入いただいた個人情報は、お問い合わせへの対応のみに利用します。詳しくは
        <a href="/privacy-policy" className="underline">プライバシーポリシー</a>をご覧ください。
      </p>
    </form>
  );
}

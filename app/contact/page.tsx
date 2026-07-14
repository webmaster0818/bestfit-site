import type { Metadata } from "next";
import { metaFor } from "@/lib/data";
import ContactForm from "./ContactForm";

const PATH = "/contact";

export function generateMetadata(): Metadata {
  const m = metaFor(PATH);
  return m
    ? {
        title: { absolute: m.title },
        description: m.desc,
        alternates: m.canonical ? { canonical: m.canonical } : undefined,
      }
    : {
        title: "掲載に関するお問い合わせ｜BEST-FIT",
        description:
          "パーソナルジムの掲載・掲載情報の修正・広告や提携に関するお問い合わせはこちらから。BEST-FITへの掲載をご希望の事業者さまからのご連絡をお待ちしております。",
      };
}

export default function ContactPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-3">掲載に関するお問い合わせ</h1>
      <p className="text-sm leading-7 mb-8" style={{ color: "var(--bf-muted)" }}>
        BEST-FITへのパーソナルジムの掲載、掲載情報の修正・削除、広告・提携のご相談は、以下のフォームよりお問い合わせください。
        内容を確認のうえ、担当者より順次ご連絡いたします。
      </p>
      <ContactForm />
    </article>
  );
}

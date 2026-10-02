import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import "./orizm-ui.css";
import BgParallax from "@/components/BgParallax";

const bfFont = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700", "900"], subsets: ["latin"], variable: "--font-bf", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://fit-best.com"),
  title: "パーソナルジム専門の比較・口コミサイト｜BEST-FIT",
  openGraph: {
    siteName: "BEST-FIT パーソナルジム比較",
  },
  // Search Console の所有権確認(2026-10-02)。サイト移転の進行を新ドメイン側でも
  // 計測するために登録する。サイトマップ送信・インデックス促進は施主指示によりまだ行わない。
  verification: {
    google: "QLDfs9L6rK3N4KNRKJvfq_lx3WrgMxsnL5zZBIHLfro",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={bfFont.variable}>
      <head>
        {/* GA4は一旦撤去(2026-10-02 施主指示)。
            旧サイトと同じ測定ID G-80HEY6EZC2 が入っており、新旧のデータが
            同一プロパティに混ざる状態だった。新ドメイン用のプロパティを別に作る方針のため、
            測定IDの支給を受けてから改めて設置する。それまで計測は行わない。 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "BEST-FIT パーソナルジム比較",
              alternateName: "BEST-FIT",
              url: "https://fit-best.com",
              publisher: { "@id": "https://fit-best.com/#organization" },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://fit-best.com/gyms/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://fit-best.com/#organization",
              name: "BEST-FIT",
              url: "https://fit-best.com",
              logo: {
                "@type": "ImageObject",
                url: "https://fit-best.com/images/logo.png",
              },
            }),
          }}
        />
      </head>
      <body>
        <div style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p style={{ maxWidth: 1152, margin: "0 auto", padding: "4px 16px", fontSize: 11, color: "#6b7280" }}>本サイトはプロモーション(PR)を含みます。</p>
        </div>

        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* タップ領域拡大(推奨48px): p-3 -m-3 で見た目を変えず当たり判定のみ拡大 */}
            <Link href="/" className="flex items-center p-3 -m-3">
              <img src="/images/logo.png" alt="BEST-FIT" className="h-5 md:h-7 w-auto" />
            </Link>
            <nav className="text-sm font-bold flex gap-4" style={{ color: "var(--bf-ink)" }}>
              <Link href="/gyms/list" className="hover:underline py-3 px-1.5 -my-3 -mx-1.5">ジムを探す</Link>
              <Link href="/articles" className="hover:underline py-3 px-1.5 -my-3 -mx-1.5">エリア記事</Link>
              <Link href="/news" className="hover:underline py-3 px-1.5 -my-3 -mx-1.5">お知らせ</Link>
            </nav>
          </div>
        </header>
        <BgParallax />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-gray-200 mt-16 py-10 text-sm text-gray-500" style={{ background: "var(--bf-bg)" }}>
          <div className="max-w-5xl mx-auto px-4 space-y-2">
            <p className="font-bold text-gray-700">BEST-FIT｜パーソナルジム専門の比較・口コミサイト</p>
            <nav className="flex gap-4 flex-wrap">
              <Link href="/contact" className="hover:underline">掲載に関するお問い合わせ</Link>
              <Link href="/privacy-policy" className="hover:underline">プライバシーポリシー</Link>
              <Link href="/terms-of-service" className="hover:underline">利用規約</Link>
              <Link href="/content-policy" className="hover:underline">コンテンツポリシー</Link>
            </nav>
            <p>© BEST-FIT</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./orizm-ui.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dunlopsportsclub.jp"),
  title: "パーソナルジム専門の比較・口コミサイト｜BEST-FIT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "BEST-FIT",
              url: "https://dunlopsportsclub.jp",
            }),
          }}
        />
      </head>
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/images/logo.png" alt="BEST-FIT" className="h-5 md:h-7 w-auto" />
            </Link>
            <nav className="text-sm font-bold flex gap-4" style={{ color: "var(--bf-ink)" }}>
              <Link href="/gyms/list" className="hover:underline">ジムを探す</Link>
              <Link href="/articles" className="hover:underline">エリア記事</Link>
              <Link href="/news" className="hover:underline">お知らせ</Link>
            </nav>
          </div>
        </header>
        <main className="min-h-screen" style={{ background: "linear-gradient(rgba(248,250,253,0.94), rgba(248,250,253,0.94)), url('/images/gym-bg-s.jpg') center top / cover fixed, url('/images/top_bg_img.png')" }}>{children}</main>
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

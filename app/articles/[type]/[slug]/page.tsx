import type { Metadata } from "next";
import Link from "next/link";
import { articleHtml, metaFor, urlMeta, brandPrice, areaArticleSiblings, areaArticleData, articleGyms, brands, stores, taxonomies, fit24Stores } from "@/lib/data";
import PageHero from "@/components/PageHero";
import ArticleEnhancer from "@/components/ArticleEnhancer";
import DataAreaArticle from "@/components/DataAreaArticle";
import CurvesFinder from "@/components/CurvesFinder";
import fs from "node:fs";
import path from "node:path";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(urlMeta())
    .filter((p) => /^\/articles\/[^/]+\/[^/]+$/.test(p))
    .map((p) => {
      const seg = p.split("/");
      return { type: seg[2], slug: seg[3] };
    });
}

function pagePath(prm: { type: string; slug: string }) {
  return `/articles/${prm.type}/${prm.slug}`;
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; slug: string }> }): Promise<Metadata> {
  const p = pagePath(await params);
  const m = metaFor(p);
  const bslug = p.startsWith("/articles/brand/") ? p.split("/").pop()! : null;
  const bp = bslug ? brandPrice(bslug) : null;
  if (!m) return {};
  // 料金intentが最大流入(curves料金67k imp等)→titleに実額を前出しでCTR回収
  // fit24=全118店舗実査(2026-08-02)を訴求(「fit24 料金」pos5.3のtop3奪取・公式が一覧を出していない空白)
  const brandTitle = bslug === "fit24"
    ? `FIT24の料金はいくら？全118店舗の月会費を実査【2026年8月】割引・退会方法まで｜BEST-FIT`
    : bp ? `${bp.name}の料金はいくら？月額・入会金・口コミ・評判を徹底比較【2026年】｜BEST-FIT` : m.title;
  if (bslug === "fit24") {
    return {
      title: { absolute: brandTitle },
      description: `FIT24の月会費を全118店舗の公式ページで実査(2026年8月2日)。111店舗は月6,980円(税込7,678円)・7店舗のみ7,480円。家族3,980円・U22 4,980円・高校生は親権者会員なら0円。入会金なし(事務手数料2,200円)・割引・退会/休会方法まで一覧で解説します。`,
      alternates: m.canonical ? { canonical: m.canonical } : undefined,
    };
  }
  return {
    title: { absolute: brandTitle },
    description: bp ? `${bp.name}の料金は${bp.price}${bp.join ? "・" + bp.join : ""}（${bp.note}）。月額・入会金の一覧、口コミ・評判、他社との料金比較、キャンペーン情報まで実際に払う総額ベースで解説します。` : m?.desc,
    alternates: m.canonical ? { canonical: m.canonical } : undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ type: string; slug: string }> }) {
  const prm = await params;
  const p = pagePath(prm);
  const m = metaFor(p);
  const bodyRaw = articleHtml(p);
  // CMS移植HTMLに残る「中身が空のBoxブロック」はカード化CSSで謎の白枠になるため描画前に除去(全記事656個・原本は不変)
  const stripEmptyBoxes = (html: string) => {
    const pat = /<div class="[^"]*" data-orizm-block-id="[^"]+" data-orizm-block-type="Box"><div class="[^"]*">\s*(?:<div data-orizm-slot-id="children">\s*<\/div>)?\s*<\/div><\/div>/g;
    let prev = "";
    let cur = html;
    while (cur !== prev) { prev = cur; cur = cur.replace(pat, ""); }
    return cur;
  };
  // 記事掲載ジムの見出し直下に詳細ページへのリンクを注入(既存店舗ページ or 記事由来のlistedページ)
  const injectGymLinks = (html: string, rows: { heading: string; href: string; name: string }[]) => {
    if (!rows.length) return html;
    const normTxt = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const escHtml = (s: string) => s.replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const map = new Map(rows.map((r) => [r.heading, r]));
    const re = /<h3[^>]*>([\s\S]*?)<\/h3>/g;
    let out = "";
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      out += html.slice(last, re.lastIndex);
      const r = map.get(normTxt(m[1]));
      if (r) out += `<p class="bf-gym-detail-link"><a href="${r.href}">📋 ${escHtml(r.name)}の料金・詳細ページを見る →</a></p>`;
      last = re.lastIndex;
    }
    return out + html.slice(last);
  };
  const gymLinkRows = articleGyms().perArticle[p] || [];
  const body = bodyRaw ? injectGymLinks(stripEmptyBoxes(bodyRaw.replace(/<h1[\s\S]*?<\/h1>/, "")), gymLinkRows) : null;
  const isBrand = prm.type === "brand";
  // FIT24専用: 全118店舗の料金実査サプリメント(2026-08-02・公式が一覧を出していない情報の一次集約)
  const isFit24 = isBrand && prm.slug === "fit24";
  const f24 = isFit24 ? fit24Stores() : null;
  const f24Prefs: Record<string, { name: string; regular: string; golf: boolean }[]> = {};
  if (f24) for (const s of f24.stores) (f24Prefs[s.pref] ||= []).push({ name: s.name, regular: s.regular, golf: s.golf });
  const f24Faqs = f24
    ? [
        { q: "FIT24の月会費は店舗によって違いますか？", a: "全118店舗を公式ページで実査した結果(2026年8月2日)、通常プランは111店舗が月6,980円(税込7,678円)、7店舗(BiVi仙台駅東口・長野若槻・長野南バイパス・長野昭和通り・千曲屋代・西宮丸橋・夙川)のみ7,480円(税込8,228円)の2パターンです。家族プラン3,980円・U22プラン4,980円は全店一律です。" },
        { q: "FIT24に入会金はかかりますか？", a: "入会金の徴収は公式に記載がなく、初期費用は事務手数料2,000円(税込2,200円)のみです。新規契約時は事務手数料+月会費2ヶ月分(初月は日割り)をまとめて決済します。支払いはクレジットカードのみで現金は使えません。" },
        { q: "高校生は本当に月0円で通えますか？", a: "親権者がFIT24会員(休会・高校生プラン以外)であれば高校生プランの月会費は0円です(事務手数料2,200円は必要)。高校生だけで契約する場合は月2,980円(税込3,278円)。利用可能時間は7時〜20時(19時以降入館不可)で、手続きは店頭のみ・親権者同伴です。" },
        { q: "FIT24の退会・休会はどうやりますか？", a: "退会はマイページの『契約管理』→『退会』から手続きでき、店頭に行く必要はありません。休会もマイページから休会プランへ変更する方式で、毎月10日までの手続きで翌月から適用、休会中は管理費として月1,100円(税込)がかかります(利用開始2ヶ月以内やキャンペーン在籍条件中は休会不可)。" },
        { q: "FIT24の割引にはどんなものがありますか？", a: "家族プラン(2人目以降3,980円)・U22プラン(4,980円)・高校生プラン(親権者会員なら0円)のほか、紹介割、店舗限定の乗りかえ割、契約ロッカー最大2ヶ月無料キャンペーン(一部店舗)があります。なお退会後6ヶ月間は入会キャンペーン特典が適用されません(いずれも2026年8月2日公式確認)。" },
      ]
    : [];
  const f24FaqLd = f24
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: f24Faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;
  const bp = isBrand ? brandPrice(prm.slug) : null;
  // ブランド記事×店舗DB統合(2026-07-31): 店舗一覧+独自集計(全て自社DB/Googleマップ実測評点から自動生成・捏造なし)
  const STORE_BRAND_MAP: Record<string, string> = { katagirijuku: "katagiri", "miyazaki-gym": "miyazakigym", "b-concept": "bconcept", "the-personal-gym": "tpg" };
  const storeBrandSlug = isBrand ? (STORE_BRAND_MAP[prm.slug] || prm.slug) : null;
  const brandStores = (() => {
    if (!storeBrandSlug) return [] as { path: string; name: string; pref: string; prefCode: string; rating?: number; freeJoin: boolean }[];
    const all = stores() as Record<string, any>;
    const tax = taxonomies() as any;
    const reviews = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "place-reviews.json"), "utf-8"));
    const list: { path: string; name: string; pref: string; prefCode: string; rating?: number; freeJoin: boolean }[] = [];
    for (const [sp, st] of Object.entries(all)) {
      if (!sp.startsWith(`/gyms/${storeBrandSlug}/`)) continue;
      const plans = (Array.isArray(st.pricePlans) ? st.pricePlans : []).filter((pl: any) => typeof pl.price === "number" && pl.price > 0);
      const joinFees = plans.map((pl: any) => pl.membershipFee).filter((n: any) => typeof n === "number");
      const prefCode = st._prefCode || "";
      list.push({ path: sp, name: st.name || "", pref: (tax.pref || {})[prefCode] || "その他", prefCode, rating: typeof reviews[sp]?.rating === "number" ? reviews[sp].rating : undefined, freeJoin: joinFees.length > 0 && Math.min(...joinFees) === 0 });
    }
    return list;
  })();
  const bsRated = brandStores.filter((s) => typeof s.rating === "number");
  const bsAvg = bsRated.length >= 3 ? bsRated.reduce((a, s) => a + (s.rating || 0), 0) / bsRated.length : null;
  const showStores = isBrand && brandStores.length >= 2;
  // モバイル最適化: 診断用の全国店舗データ(約820KB)はHTML同梱をやめCurvesFinder側でfetch
  const isCurvesArticle = prm.type === "brand" && prm.slug === "curves";
  const areaArticlesIdx = isCurvesArticle
    ? JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "area-articles-index.json"), "utf-8"))
    : null;
  const brandFaqs = bp
    ? [
        { q: `${bp.name}の料金はいくらですか？`, a: `${bp.name}の料金は${bp.price}です${bp.join ? `（${bp.join}）` : ""}（${bp.note}・税込）。月額・入会金を含めた総額で比較するのがおすすめです。最新の料金は公式サイトでご確認ください。` },
        { q: `${bp.name}に入会金はかかりますか？`, a: bp.join ? `${bp.name}は${bp.join}です（${bp.note}）。時期によって入会金無料キャンペーンが実施される場合があるため、公式サイトの最新情報もあわせてご確認ください。` : `${bp.name}の入会金は公式サイトで金額の明記が確認できませんでした（${bp.note}）。カウンセリング時や公式サイトで確認するのが確実です。` },
        { q: `${bp.name}の口コミ・評判はどうですか？`, a: `本記事では${bp.name}の口コミ・評判の傾向と、料金・特徴・向いている人を中立的にまとめています。良い評判・気になる点の両面と、他社との料金比較を確認したうえで、無料カウンセリングで実際の雰囲気を確かめるのがおすすめです。` },
      ]
    : [];
  const brandFaqLd = bp
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: brandFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;
  const siblings = !isBrand ? areaArticleSiblings(p) : [];
  // エリア記事のデータ駆動化(全記事で試行・店舗3未満はnullで移植HTMLにフォールバック)
  const areaRaw = !isBrand ? areaArticleData(prm.type, prm.slug) : null;
  const brandsMap = areaRaw ? brands() : null;
  const brandName = (slug: string) => (brandsMap ? Object.values(brandsMap).find((b) => b.slug.toLowerCase() === slug.toLowerCase())?.name || "" : "");
  const area = areaRaw ? { ...areaRaw, cards: areaRaw.cards.map((c: any) => ({ ...c, brandName: brandName(c.brand) })) } : null;
  const areaFaqs = area
    ? [
        { q: `${area.areaName}のパーソナルジムの料金相場はいくらですか？`, a: area.priceRange ? `1回あたり（コース総額÷回数）に換算すると、最安クラスで${area.priceRange.min.toLocaleString()}円〜、中央値の目安は${area.priceRange.mid.toLocaleString()}円前後、高価格帯で${area.priceRange.max.toLocaleString()}円ほどです（税込・当サイト集計・入会金別）。回数の違うプランを公平に比べるための指標です。` : `店舗により幅があります。無料カウンセリングで総額の見積もりを取るのが確実です。` },
        { q: `${area.areaName}で女性専用や完全個室のジムはありますか？`, a: `あります。${area.areaName}のパーソナルジムはこだわり条件で絞り込めます。女性専用・完全個室・食事指導などの条件別一覧から、目的に合う店舗を探せます。` },
        { q: `${area.areaName}のパーソナルジムは体験・カウンセリングを受けられますか？`, a: `多くの店舗が無料カウンセリングや体験トレーニングを用意しています。料金や雰囲気は店舗ごとに異なるため、各ジムの詳細ページと公式サイトで確認のうえ、複数を比較して決めるのがおすすめです。` },
      ]
    : [];
  const areaFaqLd = area
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: areaFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;
  // S1: Article schema(鮮度・E-E-A-T)。dateModifiedは記事の実質更新日=直近の全記事一括改修日。個別更新時はここを更新すること
  const ARTICLE_DATE_MODIFIED = "2026-07-19";
  const canonicalUrl = `https://dunlopsportsclub.jp${m?.canonical || p}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: (bp ? `${bp.name}の料金はいくら？月額・入会金・口コミ・評判を徹底比較【2026年】` : m?.title.split("｜")[0]) || "",
    ...(m?.desc ? { description: m.desc } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    url: canonicalUrl,
    dateModified: ARTICLE_DATE_MODIFIED,
    author: { "@type": "Organization", name: "BEST-FIT編集部", url: "https://dunlopsportsclub.jp" },
    publisher: { "@id": "https://dunlopsportsclub.jp/#organization" },
    inLanguage: "ja",
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {areaFaqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(areaFaqLd) }} />}
      {brandFaqLd && !isFit24 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandFaqLd) }} />}
      {f24FaqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(f24FaqLd) }} />}
      <PageHero eyebrow={isBrand ? "BRAND REVIEW" : "AREA FEATURE"} title={m?.title.split("｜")[0] || ""} />
      <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:underline">ホーム</Link> ›{" "}
        <Link href="/articles" className="hover:underline">{isBrand ? "ブランド記事" : "エリア記事"}</Link> › {m?.title.split("｜")[0] || ""}
      </nav>
      {bp && (
        <div className="bf-card p-5 mb-6" style={{ borderTop: "4px solid var(--bf-primary)" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--bf-muted)" }}>料金の目安（{bp.note}）</p>
          <p className="text-lg font-extrabold" style={{ color: "var(--bf-primary)" }}>{bp.price}</p>
          {bp.join && <p className="text-sm mt-1" style={{ color: "var(--bf-ink)" }}>{bp.join}</p>}
          <p className="text-[11px] mt-2 mb-3" style={{ color: "var(--bf-muted)" }}>※税込・{bp.note}の目安。<strong>入会金無料などのキャンペーンや店舗で変わる</strong>ため、実際に払う総額は記事内の詳細と公式サイトでご確認ください。</p>
          <div className="border-t pt-3" style={{ borderColor: "var(--bf-line)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--bf-ink)" }}>この記事でわかること</p>
            <div className="flex flex-wrap gap-2">
              <span className="bf-chip">料金プランの内訳と総額</span>
              <span className="bf-chip">入会金無料キャンペーンの有無</span>
              <span className="bf-chip">リアルな口コミ・評判</span>
              <span className="bf-chip">他ジムとの料金比較</span>
            </div>
          </div>
        </div>
      )}
      {isCurvesArticle && <CurvesFinder areaArticles={areaArticlesIdx} />}
      {brandFaqs.length > 0 && (
        <section className="mb-8">
          <h2 className="bf-h2 mb-3">{bp!.name}の料金・評判 よくある質問</h2>
          <div className="space-y-2">
            {brandFaqs.map((f, i) => (
              <details key={i} className="bf-card group">
                <summary className="cursor-pointer px-4 py-3 font-bold text-sm flex justify-between items-center">
                  {f.q}<span className="group-open:rotate-45 transition-transform text-lg shrink-0 ml-3" style={{ color: "var(--bf-primary)" }}>＋</span>
                </summary>
                <p className="px-4 pb-4 text-sm leading-7" style={{ color: "var(--bf-muted)" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      {body ? (
        <>
          <ArticleEnhancer /><div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />
          {f24 && (
            <div className="mt-12">
              <section className="mb-10">
                <h2 className="bf-h2 mb-4">FIT24の料金は店舗でいくら違う？【全118店舗を実査・{f24.surveyedAt.replace(/-/g, "/")}】</h2>
                <div className="bf-card p-5 mb-5" style={{ borderLeft: "4px solid var(--bf-primary)" }}>
                  <p className="font-bold mb-2">結論: 月会費は実質2パターンだけです</p>
                  <ul className="text-sm leading-7 space-y-1" style={{ color: "var(--bf-muted)" }}>
                    <li>・<strong>111店舗 = 月6,980円(税込7,678円)</strong>/<strong>7店舗のみ 月7,480円(税込8,228円)</strong></li>
                    <li>・家族プラン3,980円(税込4,378円)・U22プラン4,980円(税込5,478円)・高校生プラン(親権者が会員なら<strong>0円</strong>)は<strong>全店一律</strong></li>
                    <li>・公式店舗ページの大きな価格表示は<strong>税抜</strong>です(税込=×1.1)</li>
                  </ul>
                </div>
                <h3 className="font-bold mb-2">通常プランが7,480円の7店舗(それ以外は全て6,980円)</h3>
                <div className="overflow-x-auto mb-5">
                  <table className="bf-table w-full text-sm">
                    <thead><tr><th className="px-3 py-2.5 text-left">店舗</th><th className="px-3 py-2.5 text-left">都道府県</th><th className="px-3 py-2.5 text-left">通常プラン</th></tr></thead>
                    <tbody>
                      {f24.stores.filter((s) => s.regular === "7,480").map((s) => (
                        <tr key={s.name}><td className="px-3 py-2.5 font-bold">{s.name}</td><td className="px-3 py-2.5">{s.pref}</td><td className="px-3 py-2.5">7,480円(税込8,228円)</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <details className="bf-card">
                  <summary className="cursor-pointer px-4 py-3 font-bold text-sm">全118店舗の月会費一覧を開く(都道府県別・公式店舗ページ全数実査)</summary>
                  <div className="px-4 pb-4">
                    {Object.entries(f24Prefs).map(([pref, list]) => (
                      <div key={pref} className="mt-3">
                        <p className="font-bold text-sm mb-1">{pref}({list.length}店)</p>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--bf-muted)" }}>
                          {list.map((s) => (
                            <li key={s.name}>{s.name} {s.regular}円{s.golf ? "・ゴルフ併設" : ""}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <p className="text-[11px] mt-3" style={{ color: "var(--bf-muted)" }}>※税抜表示(税込=×1.1)。家族3,980円・U22 4,980円・高校生(親権者会員0円/単独2,980円)は全店一律のため省略。{f24.surveyedAt.replace(/-/g, "/")}に公式各店舗ページで実査。</p>
                  </div>
                </details>
              </section>
              <section className="mb-10">
                <h2 className="bf-h2 mb-4">初期費用と支払い方法</h2>
                <ul className="text-sm leading-8" style={{ color: "var(--bf-muted)" }}>
                  <li>・<strong>入会金なし</strong>(公式に徴収の記載なし)。初期費用は<strong>事務手数料2,000円(税込2,200円)のみ</strong></li>
                  <li>・新規契約時は「事務手数料+月会費2ヶ月分(初月は日割り)」を一括決済。月会費は前月20日に翌月分を決済</li>
                  <li>・支払いは<strong>クレジットカードのみ</strong>(現金不可。Visa/Master/JCB/AmEx等・デビット/プリペイド可)</li>
                </ul>
              </section>
              <section className="mb-10">
                <h2 className="bf-h2 mb-4">割引・お得なプラン(公式確認{f24.surveyedAt.replace(/-/g, "/")})</h2>
                <ul className="text-sm leading-8" style={{ color: "var(--bf-muted)" }}>
                  <li>・<strong>高校生プラン: 親権者が会員なら月0円</strong>(単独契約は2,980円。利用は7時〜20時・手続きは店頭で親権者同伴)</li>
                  <li>・<strong>家族プラン3,980円</strong>: 2人目以降何人でも。家族1名が通常等のプラン契約を維持していることが条件(同居/家族の証明書類が必要)</li>
                  <li>・<strong>紹介割</strong>(マイページ申込・1ヶ月以内に2名以上紹介なら人数分の月数が割引)/<strong>乗りかえ割</strong>(店舗限定・月額制ジムの在籍証明が必要)</li>
                  <li>・<strong>契約ロッカー最大2ヶ月無料</strong>(一部店舗・満室次第終了)/<strong>ジム&ゴルフ会員</strong>(対象16店舗・月12,000〜18,000円税抜)</li>
                  <li>・注意: <strong>退会後6ヶ月間は入会キャンペーン特典が使えません</strong>(公式QA)</li>
                </ul>
              </section>
              <section className="mb-10">
                <h2 className="bf-h2 mb-4">退会・休会の方法(店頭に行かずマイページで完結)</h2>
                <ul className="text-sm leading-8" style={{ color: "var(--bf-muted)" }}>
                  <li>・<strong>退会</strong>: マイページ『契約管理』→『退会』で完結。最終支払いは退会前月の20日決済分</li>
                  <li>・<strong>休会</strong>: マイページから休会プランへ変更。毎月10日までの手続きで翌月から適用・期間無期限。<strong>休会中は管理費 月1,100円(税込)</strong></li>
                  <li>・休会できないケース: 利用開始2ヶ月以内/キャンペーン在籍条件中/退会手続き済み 等</li>
                  <li>・解約金・違約金の記載はなし(キャンペーン利用時は在籍条件あり)</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="bf-h2 mb-3">FIT24の料金でよくある質問</h2>
                <div className="space-y-2">
                  {f24Faqs.map((f, i) => (
                    <details key={i} className="bf-card group">
                      <summary className="cursor-pointer px-4 py-3 font-bold text-sm flex justify-between items-center">
                        {f.q}<span className="group-open:rotate-45 transition-transform text-lg shrink-0 ml-3" style={{ color: "var(--bf-primary)" }}>＋</span>
                      </summary>
                      <p className="px-4 pb-4 text-sm leading-7" style={{ color: "var(--bf-muted)" }}>{f.a}</p>
                    </details>
                  ))}
                </div>
                <p className="text-[11px] mt-3" style={{ color: "var(--bf-muted)" }}>※本セクションの料金・規定はすべて当サイトがFIT24公式サイト(全店舗ページ・プランページ・公式QA)で{f24.surveyedAt.replace(/-/g, "/")}に確認した情報です。変更される場合があるため、申込前に公式サイトでご確認ください。</p>
              </section>
            </div>
          )}
          {area && (
            <div className="mt-12">
              {area.priceRange && (
                <section className="mb-10">
                  <h2 className="bf-h2 mb-4">{area.areaName}のパーソナルジム料金相場（1回あたり換算・当サイト集計）</h2>
                  <div className="overflow-x-auto">
                    <table className="bf-table w-full text-sm">
                      <tbody>
                        <tr><th className="text-left px-4 py-3">最安クラス</th><td className="px-4 py-3 font-bold">1回あたり {area.priceRange.min.toLocaleString()}円〜</td></tr>
                        <tr><th className="text-left px-4 py-3">中央値の目安</th><td className="px-4 py-3">1回あたり {area.priceRange.mid.toLocaleString()}円前後</td></tr>
                        <tr><th className="text-left px-4 py-3">高価格帯</th><td className="px-4 py-3">1回あたり 〜{area.priceRange.max.toLocaleString()}円</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: "var(--bf-muted)" }}>※<strong>1回あたり＝コース総額÷回数</strong>で換算した値（税込）です。当サイト掲載の{area.areaName}のパーソナルジム{area.total}件のコースプランの分布から算出した目安で、入会金は含みません。回数の異なるプランを公平に比較するための指標です。最新の料金は各公式サイトでご確認ください。</p>
                </section>
              )}
              <section className="mb-10">
                <h2 className="bf-h2 mb-4">{area.areaName}のジムを条件で絞り込む</h2>
                <div className="flex flex-wrap gap-2">
                  <Link href={area.listPath} className="bf-chip-link">すべての{area.areaName}のジムを見る（{area.total}件）</Link>
                </div>
              </section>
              <section className="mb-8">
                <h2 className="bf-h2 mb-3">よくある質問</h2>
                <div className="space-y-2">
                  {areaFaqs.map((f, i) => (
                    <details key={i} className="bf-card group">
                      <summary className="cursor-pointer px-4 py-3 font-bold text-sm flex justify-between items-center">
                        {f.q}<span className="group-open:rotate-45 transition-transform text-lg shrink-0 ml-3" style={{ color: "var(--bf-primary)" }}>＋</span>
                      </summary>
                      <p className="px-4 pb-4 text-sm leading-7" style={{ color: "var(--bf-muted)" }}>{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      ) : area ? (
        <DataAreaArticle areaName={area.areaName} total={area.total} cards={area.cards} priceRange={area.priceRange} listPath={area.listPath} />
      ) : (
        <p className="text-sm text-gray-500">本文の移行処理中です。</p>
      )}

      {showStores && (() => {
        const byPref: Record<string, typeof brandStores> = {};
        for (const st of brandStores) (byPref[st.pref] ||= []).push(st);
        const prefOrder = Object.keys(byPref).sort((a, b) => (byPref[a][0].prefCode || "z").localeCompare(byPref[b][0].prefCode || "z"));
        return (
          <section className="mt-12" id="stores">
            <h2 className="bf-h2 mb-3">{bp!.name}の店舗一覧・実データ（当サイト集計）</h2>
            <div className="bf-card p-5 mb-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-2xl font-extrabold" style={{ color: "var(--bf-primary)" }}>{brandStores.length}</p><p className="text-xs text-gray-500 mt-0.5">掲載店舗数</p></div>
                <div><p className="text-2xl font-extrabold" style={{ color: "var(--bf-primary)" }}>{brandStores.filter((s) => s.freeJoin).length}</p><p className="text-xs text-gray-500 mt-0.5">入会金0円プランあり</p></div>
                <div><p className="text-2xl font-extrabold" style={{ color: "var(--bf-primary)" }}>{bsAvg ? `★${bsAvg.toFixed(2)}` : "—"}</p><p className="text-xs text-gray-500 mt-0.5">Google口コミ平均{bsRated.length > 0 ? `（${bsRated.length}店）` : ""}</p></div>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">※当サイト掲載の{bp!.name}店舗データベースと、Googleマップの実測評点（2026年7月取得）を集計した値です。店舗ごとの料金プラン・アクセス・口コミは各店舗ページでご確認ください。</p>
            </div>
            <div className="space-y-2">
              {prefOrder.map((pref) => (
                <details key={pref} className="bf-card" open={prefOrder.length <= 4}>
                  <summary className="cursor-pointer px-4 py-3 font-bold text-sm">{pref}（{byPref[pref].length}店）</summary>
                  <ul className="px-4 pb-4 flex flex-wrap gap-2">
                    {byPref[pref].map((st) => (
                      <li key={st.path}>
                        <Link href={st.path} className="bf-chip-link">{st.name}{typeof st.rating === "number" ? ` ★${st.rating.toFixed(1)}` : ""}</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        );
      })()}

      {siblings.length > 0 && (
        <section className="mt-12 bf-card p-5">
          <h2 className="bf-h2 mb-3">同じエリアの特集記事</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {siblings.map((sib) => (
              <li key={sib.path}>
                <Link href={sib.path} className="font-semibold hover:underline" style={{ color: "var(--bf-primary)" }}>{sib.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(() => {
        const sb = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "article-sidebar.json"), "utf-8"));
        const meta = urlMeta();
        const t = (href: string) => (meta[href]?.title || "").split("｜")[0];
        return (
          <div className="mt-12 space-y-8">
            <section className="bf-card p-5">
              <h2 className="bf-h2 mb-3">タグから探す</h2>
              <div className="flex flex-wrap gap-2">
                {sb.tags.map(([href, label]: [string, string]) => (
                  <Link key={href} href={href} className="bf-chip-link">{label}</Link>
                ))}
              </div>
            </section>
            <section className="bf-card p-5">
              <h2 className="bf-h2 mb-3">新着記事</h2>
              <ul className="space-y-2 text-sm">
                {sb.new.map((href: string) => t(href) && (
                  <li key={href}><Link href={href} className="font-semibold hover:underline" style={{ color: "var(--bf-primary)" }}>{t(href)}</Link></li>
                ))}
              </ul>
            </section>
            <section className="bf-card p-5">
              <h2 className="bf-h2 mb-3">人気の記事</h2>
              <ul className="space-y-2 text-sm">
                {sb.popular.map((href: string) => t(href) && (
                  <li key={href}><Link href={href} className="font-semibold hover:underline" style={{ color: "var(--bf-primary)" }}>{t(href)}</Link></li>
                ))}
              </ul>
            </section>
          </div>
        );
      })()}
      </div>
    </article>
  );
}

import Link from "next/link";
import { IcoPin, IcoTrain, IcoYen, IcoChevron } from "@/components/Ico";
import { planPriceLabel } from "@/lib/data";

type Card = {
  path: string;
  name: string;
  brand: string;
  address?: string;
  access?: string;
  catchcopy?: string;
  affiliateLink?: string;
  features: string[];
  minPlan?: any;
};

// エリア記事のデータ駆動本文（biyori型の構造化・自社店舗データ由来）
export default function DataAreaArticle({
  areaName,
  total,
  cards,
  priceRange,
  listPath,
  brandName,
}: {
  areaName: string;
  total: number;
  cards: Card[];
  priceRange: { min: number; max: number; mid: number } | null;
  listPath: string;
  brandName: (slug: string) => string;
}) {
  const yen = (n: number) => `${n.toLocaleString()}円`;
  return (
    <div className="article-data">
      {/* 選びのポイント */}
      <section className="mb-10">
        <h2 className="bf-h2 mb-4">{areaName}のパーソナルジムの選び方</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { t: "料金の総額で比べる", d: "月額だけでなく入会金・コース総額（回数×単価）で比較すると失敗しません。無料カウンセリングで見積もりを取りましょう。" },
            { t: "アクセスと通いやすさ", d: "駅からの距離・営業時間は継続率に直結します。仕事帰りや土日に通える立地かを確認しましょう。" },
            { t: "目的に合う特徴で絞る", d: "女性専用・完全個室・食事指導など、こだわり条件で候補を絞ると相性の良い一軒に出会えます。" },
          ].map((p, i) => (
            <div key={i} className="bf-card p-4">
              <p className="font-bold text-sm mb-1" style={{ color: "var(--bf-primary)" }}>{i + 1}. {p.t}</p>
              <p className="text-xs leading-6" style={{ color: "var(--bf-muted)" }}>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 料金相場 */}
      {priceRange && (
        <section className="mb-10">
          <h2 className="bf-h2 mb-4">{areaName}のパーソナルジム料金相場</h2>
          <div className="overflow-x-auto">
            <table className="bf-table w-full text-sm">
              <tbody>
                <tr><th className="text-left px-4 py-3">最安クラスのコース料金</th><td className="px-4 py-3 font-bold">{yen(priceRange.min)}〜</td></tr>
                <tr><th className="text-left px-4 py-3">中央値の目安</th><td className="px-4 py-3">{yen(priceRange.mid)}前後</td></tr>
                <tr><th className="text-left px-4 py-3">高価格帯</th><td className="px-4 py-3">〜{yen(priceRange.max)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--bf-muted)" }}>※当サイト掲載の{areaName}のパーソナルジム{total}件のコース料金（税込）の分布から算出した目安です。最新の料金は各公式サイトでご確認ください。</p>
        </section>
      )}

      {/* おすすめジム(比較テーブル) */}
      <section className="mb-10">
        <h2 className="bf-h2 mb-4">{areaName}のおすすめパーソナルジム{cards.length}選（料金比較）</h2>
        <div className="overflow-x-auto mb-6">
          <table className="bf-table w-full text-sm min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5">ジム</th>
                <th className="text-left px-3 py-2.5">最安プラン</th>
                <th className="text-left px-3 py-2.5">アクセス</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.path}>
                  <td className="px-3 py-2.5 font-bold whitespace-nowrap"><Link href={c.path} style={{ color: "var(--bf-primary)" }} className="hover:underline">{brandName(c.brand)} {c.name}</Link></td>
                  <td className="px-3 py-2.5">{c.minPlan ? `${c.minPlan.price.toLocaleString()}円〜（${planPriceLabel(c.minPlan)}）` : "要問合せ"}</td>
                  <td className="px-3 py-2.5 text-xs">{c.access || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 統一フォーマットのジムカード */}
        <div className="space-y-4">
          {cards.map((c, i) => (
            <div key={c.path} className="bf-card p-5">
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <h3 className="font-extrabold text-base">
                  {i + 1}. <Link href={c.path} style={{ color: "var(--bf-primary)" }} className="hover:underline">{brandName(c.brand)} {c.name}</Link>
                </h3>
                {c.minPlan && (
                  <span className="text-right shrink-0">
                    <span className="text-[10px] block" style={{ color: "var(--bf-muted)" }}>最安プラン（{planPriceLabel(c.minPlan)}）</span>
                    <span className="bf-price text-base">{c.minPlan.price.toLocaleString()}<span className="text-[10px]">円〜</span></span>
                  </span>
                )}
              </div>
              {c.catchcopy && <p className="text-sm mb-3" style={{ color: "var(--bf-ink)" }}>{c.catchcopy}</p>}
              <ul className="text-xs space-y-1 mb-3" style={{ color: "var(--bf-muted)" }}>
                {c.address && <li className="flex items-center gap-1.5"><IcoPin className="text-xs shrink-0" />{c.address}</li>}
                {c.access && <li className="flex items-center gap-1.5"><IcoTrain className="text-xs shrink-0" />{c.access}</li>}
                {c.features.length > 0 && (
                  <li className="flex flex-wrap gap-1.5 pt-1">
                    {c.features.map((f) => <span key={f} className="bf-chip">{f}</span>)}
                  </li>
                )}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Link href={c.path} className="bf-cta-sub">詳細・口コミを見る</Link>
                {c.affiliateLink && (
                  <a href={c.affiliateLink} rel="sponsored nofollow" target="_blank" className="bf-cta-sub" style={{ background: "var(--bf-primary)", color: "#fff" }}>公式サイトで無料カウンセリング予約</a>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: "var(--bf-muted)" }}>※料金・店舗情報は当サイト掲載の公開情報にもとづきます。「公式サイト」ボタンは広告リンク（アフィリエイト）を含みます。最新情報は各公式サイトでご確認ください。</p>
      </section>

      {/* 絞り込み導線 */}
      <section className="mb-10">
        <h2 className="bf-h2 mb-4">{areaName}のジムを条件で絞り込む</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={listPath} className="bf-chip-link">すべての{areaName}のジムを見る（{total}件）</Link>
        </div>
      </section>
    </div>
  );
}

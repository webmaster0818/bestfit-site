import Link from "next/link";
import AreaGymCard, { type AreaCard } from "@/components/AreaGymCard";

// エリア記事のデータ駆動本文（biyori型の構造化・自社店舗データ由来）
export default function DataAreaArticle({
  areaName,
  total,
  cards,
  priceRange,
  listPath,
}: {
  areaName: string;
  total: number;
  cards: AreaCard[];
  priceRange: { min: number; max: number; mid: number } | null;
  listPath: string;
}) {
  const yen = (n: number) => `${n.toLocaleString()}円`;
  return (
    <div className="article-data">
      {/* 選びのポイント */}
      <section className="mb-10">
        <h2 className="bf-h2 mb-4">{areaName}のパーソナルジムの選び方</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { t: "1回あたりの料金で比べる", d: "コース総額は回数で割った「1回あたり」で比べると、回数の違うプラン同士も公平に比較できます。入会金も忘れず確認を。" },
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

      {/* 料金相場(1回あたり換算) */}
      {priceRange && (
        <section className="mb-10">
          <h2 className="bf-h2 mb-4">{areaName}のパーソナルジム料金相場（1回あたり換算）</h2>
          <div className="overflow-x-auto">
            <table className="bf-table w-full text-sm">
              <tbody>
                <tr><th className="text-left px-4 py-3">最安クラス</th><td className="px-4 py-3 font-bold">1回あたり {yen(priceRange.min)}〜</td></tr>
                <tr><th className="text-left px-4 py-3">中央値の目安</th><td className="px-4 py-3">1回あたり {yen(priceRange.mid)}前後</td></tr>
                <tr><th className="text-left px-4 py-3">高価格帯</th><td className="px-4 py-3">1回あたり 〜{yen(priceRange.max)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--bf-muted)" }}>※<strong>1回あたり＝コース総額÷回数</strong>で換算した値（税込）です。当サイト掲載の{areaName}のパーソナルジム{total}件のコースプランの分布から算出した目安で、入会金は含みません。回数の異なるプランを公平に比較するための指標です。最新の料金は各公式サイトでご確認ください。</p>
        </section>
      )}

      {/* おすすめジム(比較テーブル・1回あたり) */}
      <section className="mb-10">
        <h2 className="bf-h2 mb-4">{areaName}のおすすめパーソナルジム{cards.length}選（1回あたり料金で比較）</h2>
        <div className="overflow-x-auto mb-6">
          <table className="bf-table w-full text-sm min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5">ジム</th>
                <th className="text-left px-3 py-2.5">1回あたり料金</th>
                <th className="text-left px-3 py-2.5">アクセス</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.path}>
                  <td className="px-3 py-2.5 font-bold"><Link href={c.path} style={{ color: "var(--bf-primary)" }} className="hover:underline">{c.brandName} {c.name}</Link></td>
                  <td className="px-3 py-2.5">
                    {c.minPerSession ? (
                      <span className="inline-block">
                        <span className="bf-price whitespace-nowrap">{c.minPerSession.perSession!.toLocaleString()}円〜</span>
                        <span className="block text-[10px] whitespace-nowrap" style={{ color: "var(--bf-muted)" }}>{c.minPerSession.sessionCount}回コース換算</span>
                      </span>
                    ) : "要問合せ"}
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ minWidth: "8em" }}>{c.access || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] mb-4" style={{ color: "var(--bf-muted)" }}>※1回あたり＝コース総額÷回数（税込）。各ジムのタブで人気プラン・基本情報・地図を切り替えて確認できます。</p>

        {/* インタラクティブな統一カード */}
        <div className="space-y-4">
          {cards.map((c, i) => <AreaGymCard key={c.path} card={c} index={i} />)}
        </div>
        <p className="text-[11px] mt-3" style={{ color: "var(--bf-muted)" }}>※料金・店舗情報は当サイト掲載の公開情報にもとづきます。口コミは各ジムのGoogleマップでご確認いただけます（当サイトは口コミの創作をしません）。「公式サイト」ボタンは広告リンク（アフィリエイト）を含みます。</p>
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

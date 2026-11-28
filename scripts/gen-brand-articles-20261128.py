#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""11/27 に提携した複数店舗ブランドの受け皿記事（/articles/brand/<slug>）を生成する（2026-11-28・12:00 成長ルーチン）。
   中身は各ブランド公式サイトで 2026-11-28 に確認した事実だけ。口コミは「公式サイト掲載のお客様の声（公式が選んだもの）」と
   当サイトが数値を確認できた口コミサイトに限る（出典のない傾向要約・★・架空の体験談は載せない＝writing-standards §9）。
   出力: data/article-html/articles__brand__<slug>.html と data/urls-meta.json・data/brand-supplements.json への追記（brand-price には入れない＝title を料金型に上書きさせないため）。
   計測リンク（cta）は ASP 発行コードのまま（開かない・curl しない）。再実行すると同じ内容で上書きする。"""
import json
from pathlib import Path

D = Path(__file__).resolve().parent.parent / "data"
CHECKED = "2026年11月28日"


def a(url, text, sponsored=False):
    rel = "sponsored nofollow noopener" if sponsored else "nofollow noopener"
    return f'<a href="{url}" target="_blank" rel="{rel}">{text}</a>'


def table(rows, head=None):
    h = "<thead><tr>" + "".join(f"<th>{x}</th>" for x in head) + "</tr></thead>" if head else ""
    b = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f"<table>{h}<tbody>{b}</tbody></table>"


def ul(items):
    return "<ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"


def box(inner):
    return f'<div data-orizm-block-type="Box"><div>{inner}</div></div>'


from brand_data_20261128 import B  # noqa: E402  各ブランドのデータ（同じフォルダ）


def body(b, stores):
    s = []
    s.append(f"<h1>{b['title'].split('｜')[0]}</h1>")
    s.append(f"<p>本記事では、{b['name']}の口コミ・評判を確認する前に押さえておきたい料金・仕組み・解約の条件を、<strong>{CHECKED}に公式サイトで確認した内容</strong>に基づいて整理しています。口コミは、出典を確認できた範囲に限って掲載しています。</p>")
    s.append(box("<p><strong>要点</strong></p>" + ul(b["summary"])))
    s.append(f"<p>{a(b['cta'], b['short'] + 'の公式サイトで最新の料金・店舗を確認する', True)}</p>")
    s.append(f"<h2>{b['short']}の基本情報</h2>")
    s.append(table(b["basic"]))
    s.append(f"<h2>{b['short']}の料金（公式確認）</h2>")
    s.append(table(b["price_rows"], ["プラン・費用", "金額", "備考"]))
    s.append(f"<p>{b['price_note']}</p>")
    s.append(f"<h2>{b['short']}の口コミ・評判</h2>")
    s.append(f"<h3>口コミ・評判の確認状況（{CHECKED}時点）</h3>")
    s.append(ul(b["kuchikomi_status"]))
    if b.get("voices"):
        s.append("<h3>公式サイトに掲載されているお客様の声</h3>")
        s.append(ul(b["voices"]))
        s.append(f"<p>上記は{b['voices_src']}に掲載されている内容を当サイトが要約したものです（{CHECKED}閲覧）。公式サイトが選んで掲載している声のため、良い内容が中心である点にご留意ください。当サイトでは口コミの創作はしていません。</p>")
    s.append(f"<h3>口コミを確認する際の注意点</h3>")
    s.append(ul(b["check_points"]))
    s.append(f"<h2>{b['short']}の解約・休会・返金</h2>")
    s.append(ul(b["contract"]))
    s.append(f"<p>出典：{b['contract_src']}</p>")
    s.append(f"<h2>{b['short']}が向いている方・ほかと比べたい方</h2>")
    s.append(table([["向いている方", "<br>".join("・" + x for x in b["fit_yes"])], ["ほかのジムと比べたい方", "<br>".join("・" + x for x in b["fit_no"])]]))
    if stores:
        s.append(f"<h2>BEST-FITに掲載している{b['short']}の店舗</h2>")
        s.append(ul([f'<a href="{h}">{n}</a>' + (f"（{acc}）" if acc else "") for h, n, acc in stores]))
    s.append(f"<p>{a(b['cta'], b['short'] + 'の公式サイトで体験・カウンセリングを確認する', True)}</p>")
    s.append(f"<p>※料金・店舗・規約は{CHECKED}に公式サイトで確認した内容です。変更される場合がありますので、お申し込みの前に公式サイトで最新の情報をご確認ください。</p>")
    return "\n".join(s) + "\n"


def main():
    um = json.loads((D / "urls-meta.json").read_text(encoding="utf-8"))
    sup = json.loads((D / "brand-supplements.json").read_text(encoding="utf-8"))
    ag = json.loads((D / "article-gyms.json").read_text(encoding="utf-8"))
    st = json.loads((D / "stores.json").read_text(encoding="utf-8"))
    brands = json.loads((D / "brands.json").read_text(encoding="utf-8"))
    for b in B:
        p = f"/articles/brand/{b['slug']}"
        rows = []
        if b.get("store_brand"):
            bid = brands[b["store_brand"]]["brandId"]
            for k, v in st.items():
                if v.get("brandId") == bid and (not b.get("store_only") or k in b["store_only"]):
                    rows.append((k, f"{b['short']} {v.get('name')}", v.get("access") or ""))
        for k in b.get("listed_slugs", []):
            if k in ag["listed"]:
                rows.append((f"/gyms/listed/{k}", ag["listed"][k]["name"], ag["listed"][k].get("access", "")))
        (D / "article-html" / f"articles__brand__{b['slug']}.html").write_text(body(b, rows), encoding="utf-8")
        assert len(b["desc"]) <= 150, (b["slug"], len(b["desc"]))
        um[p] = {"title": b["title"], "desc": b["desc"], "canonical": p, "h1": b["title"].split("｜")[0], "robots": "index, follow"}
        sup[b["slug"]] = {"surveyedAt": CHECKED, "sections": [], "faqs": [{"q": q, "a": x} for q, x in b["faqs"]]}
    (D / "urls-meta.json").write_text(json.dumps(um, ensure_ascii=False), encoding="utf-8")
    (D / "brand-supplements.json").write_text(json.dumps(sup, ensure_ascii=False, indent=1), encoding="utf-8")
    print("ok", len(B))


if __name__ == "__main__":
    main()

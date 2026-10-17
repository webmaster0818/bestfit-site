#!/usr/bin/env python3
"""記事ページ(/articles/*)の本文データの最終コミット日を data/article-lastmod.json に書き出す。

sitemap.xml の <lastmod> に使う(app/sitemap.ts)。CF Pages のビルドは浅いクローンで git 履歴が無いため、
ビルド時ではなくローカルで実行してコミットする。記事の本文(data/article-html・data/articles)を直したら再実行すること。
2026-10-17 追加: lastmod が無く、noindex 解除(10/9)後もブランド記事16本が 10/3〜10/8 の古いクロールのままだったため。
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
meta = json.loads((ROOT / "data/urls-meta.json").read_text())
out = {}
for p in sorted(k for k in meta if k.startswith("/articles/")):
    key = p.strip("/").replace("/", "__")
    files = [f for f in (f"data/article-html/{key}.html", f"data/articles/{key}.json") if (ROOT / f).exists()]
    if not files:
        continue
    d = subprocess.run(["git", "log", "-1", "--format=%cs", "--", *files], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    if d:
        out[p] = d
(ROOT / "data/article-lastmod.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
print(f"{len(out)} 件 → data/article-lastmod.json")

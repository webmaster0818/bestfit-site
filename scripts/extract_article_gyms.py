# エリア記事(移植HTML)からジムブロックを抽出し、data/article-gyms.json を生成する。
# - 既存の店舗詳細(/gyms/<brand>/<store>)にマッチするものは storePath を紐付け
# - マッチしないジムは /gyms/listed/<slug>/ 用の詳細ページデータ(ブロックHTML=記事原文のまま)を出力
# 使い方: python3 scripts/extract_article_gyms.py
import json, re, os, sys, hashlib, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

stores = json.load(open('data/stores.json'))
brands = json.load(open('data/brands.json'))
idx = json.load(open('data/area-articles-index.json'))

def norm(s):
    s = unicodedata.normalize('NFKC', s or '').lower()
    s = s.replace('&#x27;', "'").replace('&amp;', '&')
    return re.sub(r"[\s　・･/／\-–—'’&．\.]", '', s)

ALIAS = {
    'ライザップ': 'rizap', 'ライザップウーマン': 'rizap-woman', 'アスピ': 'aspi', 'ビヨンド': 'beyond',
    'ビーコンセプト': 'b-concept', 'チキンジム': 'chicken-gym', 'エレメント': 'element', 'カーブス': 'curves',
    'リボーンマイセルフ': 'reborn-myself', 'アップルジム': 'apple-gym', 'ドクタートレーニング': 'dr-training',
    # 2026-10-09: 記事側の表記を「エクササイズコーチ(The Exercise Coach)」に統一したため、
    # brands.json の 'TheExerciseCoach' では前方一致しなくなる。別名を足して既存店舗ページへのマッチを維持する。
    'エクササイズコーチ': 'exercisecoach',
}

store_keys = {}
by_brand = {}
for path, s in stores.items():
    p = path.split('/')
    bslug = p[2] if len(p) > 3 else ''
    bname = brands.get(bslug, {}).get('name', bslug)
    nm = s.get('name') or ''
    store_keys.setdefault(norm(bname + nm), path)
    store_keys.setdefault(norm(bslug + nm), path)
    store_keys.setdefault(norm(nm), path)
    by_brand.setdefault(bslug, []).append((path, norm(nm)))

brand_alias = {}
for slug, b in brands.items():
    brand_alias[norm(b.get('name', ''))] = slug
    brand_alias[norm(slug)] = slug
for jp, slug in ALIAS.items():
    if slug in brands:
        brand_alias[norm(jp)] = slug
aliases_sorted = sorted(brand_alias.items(), key=lambda kv: -len(kv[0]))

H3 = re.compile(r'<h3[^>]*>(.*?)</h3>', re.S)

def txt(x):
    t = re.sub(r'<[^>]+>', '', x)
    return re.sub(r'\s+', ' ', t).strip()

all_gyms = {}
per_article = {}

for a in idx:
    url = a['url']
    typ, slug = url.split('/')[2], url.split('/')[3]
    f = f"data/article-html/articles__{typ}__{slug}.html"
    if not os.path.exists(f):
        continue
    h = open(f).read()
    ms = [m for m in H3.finditer(h) if 'パーソナルジム' in txt(m.group(1)) and '【' in txt(m.group(1))]
    lst = []
    for j, m in enumerate(ms):
        heading = txt(m.group(1))
        start, end = m.start(), (ms[j + 1].start() if j + 1 < len(ms) else len(h))
        h2m = re.search(r'<h2[^>]*>', h[m.end():end])
        if h2m:
            end = m.end() + h2m.start()
        block = h[start:end]
        disp = re.sub(r'^\d+\.?\s*', '', heading)
        disp = re.sub(r'【[^】]*】\s*', '', disp)
        disp = re.sub(r'\s*[/／]\s*パーソナルジム\s*$', '', disp).strip()
        am = re.search(r'【([^】]*)】', heading)
        access = am.group(1) if am else ''
        offm = re.search(r'href="(https?://[^"]+)"', block)
        official = offm.group(1) if offm else ''
        key = norm(disp)
        if not key:
            continue
        lst.append({'heading': heading, 'key': key})
        cur = all_gyms.get(key)
        arts = (cur['articles'] if cur else [])
        if cur is None or len(block) > cur['blockLen']:
            all_gyms[key] = {'name': disp.replace('&#x27;', "'").replace('&amp;', '&'), 'access': access,
                             'official': official, 'blockLen': len(block), 'block': block, 'articles': arts}
        all_gyms[key]['articles'] = sorted(set(all_gyms[key]['articles'] + [url]))
    per_article[url] = lst

# --- 既存店舗ページへのマッチ ---
for key, g in all_gyms.items():
    path = store_keys.get(key)
    if not path:
        for al, bslug in aliases_sorted:
            if len(al) >= 3 and key.startswith(al):
                rest = key[len(al):]
                for sp, snm in by_brand.get(bslug, []):
                    if snm and (snm in key or (rest and (rest in snm or snm in rest))):
                        path = sp
                        break
                if not path and not rest and len(by_brand.get(bslug, [])) == 1:
                    path = by_brand[bslug][0][0]
                if path:
                    break
    g['storePath'] = path

# --- 新規(listed)スラッグ生成 ---
# 2026-10-09: 記事側の表記統一(「エクササイズコーチ(The Exercise Coach)」)で name が変わり、
# 公開済みの /gyms/listed/<slug> が the-exercise-coach* に改名されてしまうため、現行slugをピン留めする。
# 併せて ALIAS に 'エクササイズコーチ' を追加済み。再生成すると
#   /gyms/listed/gym-680cd6d5 (リンクス梅田店) / gym-95995bf8 (新宿西口店)
# の2本は既存のブランド店舗ページ(/gyms/exercisecoach/...)にマッチするようになり、listedからは消える。
# 再生成する場合はこの2URLの301リダイレクトを用意すること。
SLUG_PIN = {
    'エクササイズコーチ(The Exercise Coach) 池袋東口店': 'exercise-coach',
    'エクササイズコーチ(The Exercise Coach) 宇都宮店': 'exercise-coach-2',
    'エクササイズコーチ(The Exercise Coach) 柏店': 'exercise-coach-3',
    'エクササイズコーチ(The Exercise Coach) 川崎DICE店': 'exercise-coach-dice',
}
used = set()
def make_slug(name, key):
    if name in SLUG_PIN:
        s = SLUG_PIN[name]
        used.add(s)
        return s
    s = unicodedata.normalize('NFKC', name).lower()
    s = re.sub(r"[&'’]", '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    if len(s) < 3:
        s = 'gym-' + hashlib.md5(key.encode()).hexdigest()[:8]
    base, n = s, 2
    while s in used:
        s = f"{base}-{n}"
        n += 1
    used.add(s)
    return s

listed = {}
for key, g in all_gyms.items():
    if g['storePath']:
        continue
    slug = make_slug(g['name'], key)
    # 見出し先頭の通し番号は詳細ページでは文脈が無いため除去(内容は原文のまま)
    block = re.sub(r'(<h3[^>]*>)\s*\d+\.?\s*', r'\1', g['block'], count=1)
    listed[slug] = {'name': g['name'], 'access': g['access'], 'official': g['official'],
                    'block': block, 'articles': g['articles']}
    g['listedSlug'] = slug

# --- 記事→リンク注入用マップ ---
per_article_out = {}
for url, lst in per_article.items():
    rows = []
    for it in lst:
        g = all_gyms[it['key']]
        href = g['storePath'] or ('/gyms/listed/' + g['listedSlug'])
        rows.append({'heading': it['heading'], 'href': href, 'name': g['name']})
    per_article_out[url] = rows

out = {'listed': listed, 'perArticle': per_article_out}
json.dump(out, open('data/article-gyms.json', 'w'), ensure_ascii=False)
matched = sum(1 for g in all_gyms.values() if g['storePath'])
print(f"unique={len(all_gyms)} matched={matched} listed(new)={len(listed)}")

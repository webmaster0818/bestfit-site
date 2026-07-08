import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA, file), "utf-8")) as T;
}

export type StoreEntity = Record<string, any>;
export type UrlMeta = { title: string; desc: string; canonical: string; h1: string; robots: string };

let _stores: Record<string, StoreEntity> | null = null;
let _meta: Record<string, UrlMeta> | null = null;
let _tax: { pref: Record<string, string>; city: Record<string, string>; ward: Record<string, string>; feature: Record<string, string>; tag: Record<string, string> } | null = null;
let _brands: Record<string, { brandId: string; slug: string; name: string }> | null = null;
let _listPaths: string[] | null = null;

export function stores() {
  if (!_stores) _stores = loadJson("stores.json");
  return _stores!;
}
export function urlMeta() {
  if (!_meta) _meta = loadJson("urls-meta.json");
  return _meta!;
}
export function taxonomies() {
  if (!_tax) _tax = loadJson("taxonomies.json");
  return _tax!;
}
export function brands() {
  if (!_brands) _brands = loadJson("brands.json");
  return _brands!;
}
export function listPaths() {
  if (!_listPaths) _listPaths = loadJson("list-paths.json");
  return _listPaths!;
}

export function metaFor(pathname: string): UrlMeta | undefined {
  return urlMeta()[pathname];
}

export function articleFor(pathname: string): { path: string; entity: any; sections: { name: string; content: string }[]; reviews: any[] } | null {
  const slug = pathname.replace(/^\//, "").replace(/\//g, "__") || "root";
  const f = path.join(DATA, "articles", `${slug}.json`);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf-8"));
}

// 一覧ページの条件解決: /gyms/list/pref-X/city-Y/ward-Z|feature-F → 店舗フィルタ
export function resolveListPage(segs: string[]) {
  const tax = taxonomies();
  const cond: Record<string, string> = {};
  for (const seg of segs) {
    const i = seg.indexOf("-");
    if (i > 0) cond[seg.slice(0, i)] = seg.slice(i + 1);
  }
  const all = Object.entries(stores());
  const hit = all.filter(([, s]) => {
    if (cond.pref && s._prefCode !== cond.pref) return false;
    if (cond.city && s._cityCode !== cond.city) return false;
    if (cond.ward && s._wardCode !== cond.ward) return false;
    if (cond.feature) {
      const fts: { id?: string }[] = Array.isArray(s.features) ? s.features : [];
      if (!fts.some((f) => f?.id === cond.feature)) return false;
    }
    if (cond.tag) {
      const tks: string[] = Array.isArray(s._tagKeys) ? s._tagKeys : [];
      if (!tks.includes(cond.tag)) return false;
    }
    return true;
  });
  const labels = {
    pref: cond.pref ? tax.pref[cond.pref] : undefined,
    city: cond.city ? tax.city[cond.city] : undefined,
    ward: cond.ward ? tax.ward[cond.ward] : undefined,
    feature: cond.feature ? tax.feature[cond.feature] : undefined,
    tag: cond.tag ? tax.tag?.[cond.tag] : undefined,
  };
  return { cond, labels, stores: hit };
}

// 一覧ページの「さらに絞り込む」リンク: 実在する静的list URLだけから「現在の条件+1」の選択肢を生成(セグメント順非依存)
export function refineLinks(segs: string[]) {
  const tax = taxonomies();
  const cur = new Set(segs);
  const kinds = new Set(segs.map((x) => x.split("-")[0]));
  const out: { href: string; label: string; kind: string }[] = [];
  const seen = new Set<string>();
  for (const p of listPaths()) {
    const parts = p.replace("/gyms/list/", "").split("/");
    if (parts.length !== segs.length + 1) continue;
    if (!segs.every((x) => parts.includes(x))) continue;
    const extra = parts.find((x) => !cur.has(x));
    if (!extra || seen.has(extra)) continue;
    const i = extra.indexOf("-");
    const kind = extra.slice(0, i);
    const val = extra.slice(i + 1);
    if (kinds.has(kind)) continue;
    let label = "";
    if (kind === "pref") label = tax.pref[val] || "";
    else if (kind === "city") {
      label = tax.city[val] || "";
      const prefSeg = segs.find((x) => x.startsWith("pref-"));
      if (prefSeg) {
        const pn = tax.pref[prefSeg.slice(5)] || "";
        if (pn && label.startsWith(pn)) label = label.slice(pn.length) || label;
      }
    } else if (kind === "ward") label = tax.ward[val] || "";
    else if (kind === "feature") label = tax.feature[val] || "";
    else if (kind === "tag") label = tax.tag?.[val] || "";
    if (!label) continue;
    seen.add(extra);
    out.push({ href: p, label, kind });
  }
  const order: Record<string, number> = { pref: 0, city: 1, ward: 2, feature: 3, tag: 4 };
  return out.sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9) || a.label.localeCompare(b.label, "ja"));
}

// 最安プランの価格が「月額」か「コース総額」かを明示するラベル
export function planPriceLabel(plan: any): string {
  if (!plan) return "";
  const name = String(plan.name || "");
  if (/マンスリー|月額|月謝|サブスク/.test(name)) return "月額";
  const sc = plan.sessionCount ? String(plan.sessionCount).replace(/[^0-9]/g, "") : "";
  if (sc) return `${sc}回コース総額`;
  return "コース料金";
}

// 記事本文(現行サイトから移植した生HTML・アフィリンク保全済み)
export function articleHtml(pathname: string): string | null {
  const slug = pathname.replace(/^\//, "").replace(/\//g, "__");
  const f = path.join(DATA, "article-html", `${slug}.html`);
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, "utf-8");
}

// ブランド記事の検証済み料金（メタ・料金早見ボックス用・2026-07-07公式確認）
let _brandPrice: Record<string, { name: string; price: string; join: string; note: string }> | null = null;
export function brandPrice(slug: string) {
  if (!_brandPrice) {
    const f = path.join(DATA, "brand-price.json");
    _brandPrice = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : {};
  }
  return _brandPrice![slug] || null;
}

// エリア記事の地域クラスタ: 同一都道府県配下の他エリア記事を返す（article-area-tree由来）
let _areaTree: any[] | null = null;
export function areaArticleSiblings(pathname: string): { path: string; name: string }[] {
  if (!_areaTree) {
    const f = path.join(DATA, "article-area-tree.json");
    _areaTree = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : [];
  }
  const slug = pathname.split("/").pop();
  const toPath = (c: any) => `/articles/${c.category || "city"}/${c.slug}`;
  for (const pref of _areaTree!) {
    const kids: any[] = Array.isArray(pref.children) ? pref.children : [];
    if (kids.some((c) => c.slug === slug)) {
      return kids
        .filter((c) => c.slug && c.slug !== slug)
        .map((c) => ({ path: toPath(c), name: `${c.name}のパーソナルジム` }));
    }
  }
  return [];
}

// ===== エリア記事のデータ駆動化(biyori型) 2026-07-08 =====
let _areaTreeFlat: Record<string, { name: string; category: string }> | null = null;
function areaSlugMap() {
  if (_areaTreeFlat) return _areaTreeFlat;
  const f = path.join(DATA, "article-area-tree.json");
  const tree: any[] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : [];
  const m: Record<string, { name: string; category: string }> = {};
  for (const pref of tree) {
    if (pref.slug) m[pref.slug] = { name: pref.name, category: "pref" };
    for (const c of pref.children || []) if (c.slug) m[c.slug] = { name: c.name, category: c.category || "city" };
  }
  _areaTreeFlat = m;
  return m;
}

let _placeReviews: Record<string, any> | null = null;
export function storeReviews(): Record<string, any> { return placeReviews(); }
function placeReviews(): Record<string, any> {
  if (_placeReviews) return _placeReviews;
  const f = path.join(DATA, "place-reviews.json");
  _placeReviews = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : {};
  return _placeReviews as Record<string, any>;
}

// エリア記事(type,slug)→ そのエリアの店舗・相場・一覧パス。データ不足ならnull
function areaNameFromTitle(title: string): string | null {
  const t = title.replace(/^\u3010[^\u3011]*\u3011/, "");
  const pats = [/^(.+?)\u306e\u304a\u3059\u3059\u3081\u30d1\u30fc\u30bd\u30ca\u30eb\u30b8\u30e0/, /^(.+?)\u306e\u30d1\u30fc\u30bd\u30ca\u30eb\u30b8\u30e0\u304a\u3059\u3059\u3081/, /^\u30d1\u30fc\u30bd\u30ca\u30eb\u30b8\u30e0(.+?)\u304a\u3059\u3059\u3081/];
  for (const re of pats) {
    const m = t.match(re);
    if (m) { const nm = m[1].trim().split(/[/\uff08(]/)[0].trim(); if (nm) return nm; }
  }
  return null;
}

export function areaArticleData(type: string, slug: string) {
  const tax = taxonomies();
  const all = Object.entries(stores());
  const _p = `/articles/${type}/${slug}`;
  const _title = (urlMeta()[_p] as any)?.title || "";
  const nm = areaNameFromTitle(_title);
  if (!nm) return null;
  let matched: [string, any][] = [];
  let areaName = nm;
  let listPath = "/gyms/list";
  if (type === "pref") {
    const codes = Object.keys(tax.pref).filter((k) => tax.pref[k].includes(nm));
    matched = all.filter(([, s]) => codes.includes(s._prefCode));
    if (codes[0]) { listPath = `/gyms/list/pref-${codes[0]}`; areaName = tax.pref[codes[0]]; }
  } else if (type === "city") {
    const codes = Object.keys(tax.city).filter((k) => tax.city[k].includes(nm));
    matched = all.filter(([, s]) => codes.includes(s._cityCode));
    if (codes[0]) { listPath = `/gyms/list/pref-${matched[0]?.[1]?._prefCode}/city-${codes[0]}`; areaName = tax.city[codes[0]]; }
  } else {
    matched = all.filter(([, s]) => (s.access || "").includes(nm) || (s.address || "").includes(nm));
    const anchor = matched[0]?.[1];
    if (anchor?._cityCode) listPath = `/gyms/list/pref-${anchor._prefCode}/city-${anchor._cityCode}`;
  }
  if (matched.length < 3) return null;
  const scored = matched
    .map(([p, s]) => {
      const rawPlans = (Array.isArray(s.pricePlans) ? s.pricePlans : []).filter((pl: any) => typeof pl.price === "number" && pl.price > 0);
      const plans = rawPlans.map((pl: any) => {
        const sc = pl.sessionCount ? Number(String(pl.sessionCount).replace(/[^0-9]/g, "")) : 0;
        return {
          name: pl.name as string,
          price: pl.price as number,
          sessionCount: sc || null,
          minutes: pl.minutes || null,
          membershipFee: typeof pl.membershipFee === "number" ? pl.membershipFee : null,
          perSession: sc > 0 ? Math.round(pl.price / sc) : null,
          isMonthly: /マンスリー|月額|月謝|サブスク/.test(String(pl.name || "")),
          note: (pl.note as string) || "",
        };
      });
      const perSessionCandidates = plans.filter((pl: any) => pl.perSession);
      const minPerSession = perSessionCandidates.sort((a: any, b: any) => a.perSession - b.perSession)[0] || null;
      const featNames = (Array.isArray(s.features) ? s.features : []).map((f: any) => f?.name).filter(Boolean) as string[];
      const fset = new Set(featNames);
      const PERSONA: [string, string][] = [
        ["完全個室", "人目を気にせず集中してトレーニングしたい方"],
        ["女性トレーナー在籍", "女性トレーナーに担当してほしい方"],
        ["子連れOK", "お子さま連れで通いたい方"],
        ["産後ダイエット", "産後の体型を戻したい方"],
        ["脱・リバウンド", "リバウンドを繰り返してきた方"],
        ["食事指導", "食事から本気で体を変えたい方"],
        ["手ぶらOK", "仕事帰りに手ぶらで通いたい方"],
        ["パウダールーム", "トレーニング後にそのまま外出したい方"],
        ["姿勢改善", "姿勢や体の歪みを整えたい方"],
        ["健康・体型維持", "健康的に体型を維持したい方"],
        ["月額制", "月額制で気軽に続けたい方"],
        ["毎日", "高頻度でしっかり通いたい方"],
        ["HIIT", "短時間で効率よく追い込みたい方"],
        ["アンチエイジング", "年齢に負けない体づくりをしたい方"],
      ];
      const personas = PERSONA.filter(([f]) => fset.has(f)).map(([, p]) => p).slice(0, 4);
      const rev = placeReviews()[p] || null;
      return {
        path: p,
        reviews: rev,
        name: s.name as string,
        brand: p.split("/")[2],
        address: s.address as string | undefined,
        access: s.access as string | undefined,
        openingHours: s.openingHours as string | undefined,
        catchcopy: s.catchcopy as string | undefined,
        affiliateLink: s.affiliateLink as string | undefined,
        features: featNames.slice(0, 6),
        personas,
        plans: plans.slice(0, 5),
        minPerSession,
        membershipFee: plans.map((pl: any) => pl.membershipFee).filter((n: any) => typeof n === "number")[0] ?? null,
      };
    })
    .sort((a, b) => (a.affiliateLink ? 0 : 1) - (b.affiliateLink ? 0 : 1) || b.features.length - a.features.length);
  const cards = scored.slice(0, 10);
  // 相場は「1回あたり」換算で統一
  const perSessions = matched
    .flatMap(([, s]) => (Array.isArray(s.pricePlans) ? s.pricePlans : []))
    .map((pl: any) => {
      const sc = pl.sessionCount ? Number(String(pl.sessionCount).replace(/[^0-9]/g, "")) : 0;
      return sc > 0 && typeof pl.price === "number" ? Math.round(pl.price / sc) : null;
    })
    .filter((n: any): n is number => typeof n === "number" && n > 0)
    .sort((a, b) => a - b);
  const priceRange = perSessions.length
    ? { min: perSessions[0], max: perSessions[perSessions.length - 1], mid: perSessions[Math.floor(perSessions.length / 2)] }
    : null;
  return { areaName, total: matched.length, cards, priceRange, listPath, category: type };
}

// エリアのみ一覧→対応エリア記事のcanonicalマップ(重複解消・2026-07-08)
let _listCanon: Record<string, string> | null = null;
export function listCanonicalMap(): Record<string, string> {
  if (_listCanon) return _listCanon;
  const f = path.join(DATA, "list-canonical-map.json");
  _listCanon = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : {};
  return _listCanon as Record<string, string>;
}

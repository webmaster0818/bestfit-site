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

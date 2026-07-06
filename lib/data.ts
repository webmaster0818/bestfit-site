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
let _tax: { pref: Record<string, string>; city: Record<string, string>; ward: Record<string, string>; feature: Record<string, string> } | null = null;
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
    return true;
  });
  const labels = {
    pref: cond.pref ? tax.pref[cond.pref] : undefined,
    city: cond.city ? tax.city[cond.city] : undefined,
    ward: cond.ward ? tax.ward[cond.ward] : undefined,
    feature: cond.feature ? tax.feature[cond.feature] : undefined,
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
    if (!label) continue;
    seen.add(extra);
    out.push({ href: p, label, kind });
  }
  const order: Record<string, number> = { pref: 0, city: 1, ward: 2, feature: 3 };
  return out.sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9) || a.label.localeCompare(b.label, "ja"));
}

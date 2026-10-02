// 公開ドメインを1か所に集約(2026-10-02)。
//
// リニューアルサイトは fit-best.com で公開する。旧サイト(dunlopsportsclub.jp)は
// 8月スパムアップデートの抑制下にあり、「新旧を関連付けない」のが移行方針の前提。
// canonical・JSON-LD・sitemap が旧ドメインを指したままだと、その前提が崩れるため、
// 自己参照URLはすべてここを通す。
export const SITE_URL = "https://fit-best.com";

/** 旧ドメインの絶対URLが混じっていてもパスに正規化し、新ドメインの絶対URLにする */
export function absUrl(pathOrUrl: string | undefined | null, fallbackPath = "/"): string {
  const v = (pathOrUrl || fallbackPath).trim();
  const path = v
    .replace(/^https?:\/\/(www\.)?dunlopsportsclub\.jp/i, "")
    .replace(/^https?:\/\/(www\.)?fit-best\.com/i, "");
  return SITE_URL + (path.startsWith("/") ? path : "/" + path);
}

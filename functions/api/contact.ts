// Cloudflare Pages Function: POST /api/contact
// フォーム送信を受け取り、Discord Webhook へ通知する。
// Webhook URL は CF Pages の環境変数 DISCORD_WEBHOOK_URL に設定すること（リポジトリには含めない）。

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clean(v: unknown): string {
  return (typeof v === "string" ? v : "").trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "リクエスト形式が不正です。" }, 400);
  }

  // ハニーポット（ボットが埋めたら黙って成功扱いにして破棄）
  if (clean(data._hp)) return json({ ok: true });

  const email = clean(data.email);
  const name = clean(data.name);
  const message = clean(data.message);
  if (!email || !name || !message) {
    return json({ ok: false, error: "必須項目が未入力です。" }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: "メールアドレスの形式が正しくありません。" }, 400);
  }

  const webhook = clean(env && env.DISCORD_WEBHOOK_URL);
  if (!webhook) {
    return json({ ok: false, error: "サーバー設定が未完了です。" }, 500);
  }

  const lines = [
    "**📩 BEST-FIT 掲載に関するお問い合わせ**",
    `**種別**：${clean(data.category) || "掲載に関する問い合わせ"}`,
    `**施設・店舗名**：${clean(data.facility) || "-"}`,
    `**運営会社**：${clean(data.company) || "-"}`,
    `**ご担当者**：${name}`,
    `**メール**：${email}`,
    `**電話**：${clean(data.tel) || "-"}`,
    `**掲載希望エリア/店舗**：${clean(data.area) || "-"}`,
    "**内容**：",
    message,
  ];
  const content = lines.join("\n").slice(0, 1900);

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, username: "BEST-FIT 掲載問い合わせ" }),
    });
    if (!res.ok) {
      return json({ ok: false, error: "通知の送信に失敗しました。" }, 502);
    }
  } catch {
    return json({ ok: false, error: "通知の送信に失敗しました。" }, 502);
  }

  return json({ ok: true });
}

'use client';

import { useEffect } from "react";

// 移植した記事本文内のインタラクション復元(目次の「もっと見る」開閉)
export default function ArticleEnhancer() {
  useEffect(() => {
    const body = document.querySelector(".article-body");
    if (!body) return;
    const buttons = Array.from(body.querySelectorAll("button")).filter((b) =>
      (b.textContent || "").includes("もっと見る")
    );
    for (const btn of buttons) {
      // ボタンの直前にある目次リスト(div.relative > ol)を折りたたみ対象にする
      const wrapper = btn.closest("div")?.parentElement?.parentElement;
      const target =
        (wrapper?.querySelector("div.relative") as HTMLElement) ||
        (btn.closest("[data-orizm-block-type]")?.querySelector("div.relative") as HTMLElement);
      if (!target) continue;
      target.style.maxHeight = "320px";
      target.style.overflow = "hidden";
      target.style.transition = "max-height 0.3s ease";
      // 下部フェード
      const fade = document.createElement("div");
      fade.style.cssText =
        "position:absolute;left:0;right:0;bottom:0;height:64px;background:linear-gradient(transparent,#fff);pointer-events:none;";
      target.style.position = "relative";
      target.appendChild(fade);
      let open = false;
      const label = btn.childNodes[0];
      btn.addEventListener("click", () => {
        open = !open;
        if (open) {
          target.style.maxHeight = target.scrollHeight + "px";
          fade.style.display = "none";
          if (label) label.textContent = "閉じる";
          btn.querySelector("svg")?.setAttribute("style", "transform:translateY(-50%) rotate(180deg);position:absolute;right:16px;top:50%;");
        } else {
          target.style.maxHeight = "320px";
          fade.style.display = "";
          if (label) label.textContent = "もっと見る";
          btn.querySelector("svg")?.setAttribute("style", "position:absolute;right:16px;top:50%;transform:translateY(-50%);");
          target.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      });
    }
  }, []);
  return null;
}

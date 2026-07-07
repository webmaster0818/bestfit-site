// サイト共通ミニアイコン(塗りテイスト・特徴アイコンと統一)。絵文字は使用しない
const base = { width: "1em", height: "1em", viewBox: "0 0 24 24", fill: "currentColor" } as const;

export function IcoPin(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.2 6.3 11.5 6.9 12.1a.9.9 0 0 0 1.2 0c.6-.6 6.9-6.9 6.9-12.1A7.5 7.5 0 0 0 12 2zm0 10.2a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8z" />
    </svg>
  );
}

export function IcoTrain(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M12 2c-4 0-7 .6-7 4v9.5C5 17.4 6.6 19 8.5 19L7 20.5v.5h2.2l2-2h1.6l2 2H17v-.5L15.5 19c1.9 0 3.5-1.6 3.5-3.5V6c0-3.4-3-4-7-4zM7.5 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-6H7V6h4v2zm2 0V6h4v2h-4zm3.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  );
}

export function IcoYen(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.2 6.5l2.4 3.8 1.4 2.3 1.4-2.3 2.4-3.8h2.4l-3.2 4.9h2v1.6h-3v1.2h3v1.6h-3V19h-2.2v-3.5h-3v-1.6h3v-1.2h-3v-1.6h2L5.8 6.5h2.4z" />
    </svg>
  );
}

export function IcoClock(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.2 13.2-1.1 1.1L11 12.4V6h1.8v5.6l3.4 3.6z" />
    </svg>
  );
}

export function IcoPhone(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M6.6 3.2c.5-.5 1.3-.4 1.8.1l2 2.4c.4.5.4 1.2 0 1.7l-1 1.2a12.8 12.8 0 0 0 5.9 5.9l1.2-1c.5-.4 1.2-.4 1.7 0l2.4 2c.6.5.6 1.3.1 1.8l-1.5 1.5c-.5.5-1.3.8-2 .6C11.6 18.1 5.9 12.4 4.5 6.7c-.2-.7.1-1.5.6-2l1.5-1.5z" />
    </svg>
  );
}

export function IcoTag(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2c.5 0 1 .2 1.4.6zM7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  );
}

export function IcoChevron(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M9 5.5 15.5 12 9 18.5l-1.4-1.4L12.7 12 7.6 6.9 9 5.5z" />
    </svg>
  );
}

export function IcoStore(props: { className?: string }) {
  return (
    <svg {...base} className={props.className} aria-hidden>
      <path d="M4 4h16v3.5c0 1.4-.9 2.5-2 2.5s-2-1.1-2-2.5c0 1.4-.9 2.5-2 2.5s-2-1.1-2-2.5c0 1.4-.9 2.5-2 2.5S8 8.9 8 7.5C8 8.9 7.1 10 6 10S4 8.9 4 7.5V4zm1 8h14v8h-5v-5h-4v5H5v-8z" />
    </svg>
  );
}

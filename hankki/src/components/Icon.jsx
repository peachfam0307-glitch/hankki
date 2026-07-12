// 얇은 선(stroke) 아이콘 세트 — 디자인 컨셉의 '선 더 얇게'를 반영해 1.6 기본.
const PATHS = {
  home: <path d="M4 11.5 12 4l8 7.5M6 10v9h5v-5h2v5h5v-9" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  bookmark: <path d="M6 4h12v16l-6-4-6 4z" />,
  diary: (
    <>
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18a1 1 0 0 1 1 1v13.5" />
      <path d="M19 18.5A1.5 1.5 0 0 1 17.5 20H6.5A1.5 1.5 0 0 1 5 18.5V5.5" />
      <path d="M9 4v6l2-1.4L13 10V4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4M7 17l-1.4 1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  heart: (
    <path d="M12 20s-7-4.5-9.2-9C1.3 8 3 5 6 5c2 0 3.2 1.4 4 2.5C10.8 6.4 12 5 14 5c3 0 4.7 3 3.2 6-2.2 4.5-9.2 9-9.2 9z" />
  ),
  folder: <path d="M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />,
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9z" />
      <circle cx="8.5" cy="8.5" r="1.3" />
    </>
  ),
  link: (
    <>
      <path d="M9 15 15 9" />
      <path d="M11 7l1-1a3.5 3.5 0 0 1 5 5l-1 1" />
      <path d="M13 17l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
    </>
  ),
  photo: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m4 17 4.5-4 3 2.5L15 12l5 5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  pen: <path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
  cart: (
    <>
      <path d="M4 5h2l2 11h9l2-8H7" />
      <circle cx="9" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </>
  ),
  cloud: <path d="M7 18a4 4 0 0 1-.5-8A5 5 0 0 1 16 9.5a3.5 3.5 0 0 1 .5 8z" />,
  star: (
    <path d="M12 4l2.3 4.9 5.2.6-3.9 3.6 1.1 5.1L12 15.8 7.3 18.3l1-5.1-3.8-3.6 5.2-.6z" />
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 1.8-2 3" />
      <path d="M12 16.5h.01" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  trash: <path d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13" />,
  edit: <path d="M4 20h4L18.5 9.5l-4-4L4 16zM13 7l4 4" />,
  inbox: (
    <>
      <path d="M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
      <path d="M4 13 6 5h12l2 8h-5a3 3 0 0 1-6 0z" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="16.5" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
}

export default function Icon({ name, size = 22, stroke = 1.6, color = 'currentColor', style, className }) {
  const p = PATHS[name] || null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {p}
    </svg>
  )
}

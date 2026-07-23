// 한끼 브랜드 재료 아이콘 세트 — 앱 쿨톤과 어울리는 채도 낮은 컬러 듀오톤.
// 이름으로 자동 매칭(guessFoodIcon)되거나, 픽커에서 직접 고를 수 있다.
import { PHOTO_FAMILY } from './Stickers' // 🍱 뉴 음식 이모지(다꾸본 완성요리 PNG)도 레시피 아이콘으로 쓸 수 있게

const I = {
  // ── 곡물·면 ──
  rice: (
    <>
      <path d="M12 24h24a1 1 0 0 1 1 1c0 8-6 14-13 14s-13-6-13-14a1 1 0 0 1 1-1z" fill="#cdbe9a" />
      <ellipse cx="24" cy="24.5" rx="12" ry="3.6" fill="#f2ead6" />
      <path d="M17 20c0 2-1 3-1 4M24 18.5c0 2-1 3-1 4M31 20c0 2-1 3-1 4" stroke="#ddd0ad" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  noodle: (
    <>
      <path d="M10 23.5h28c-.5 8-6.5 14-14 14s-13.5-6-14-14z" fill="#bfc6c1" />
      <ellipse cx="24" cy="23.5" rx="13" ry="4.6" fill="#ecd9a8" />
      <path d="M13.5 22.8c3 1.6 4.6-1 7.2 0s4.2 1.5 6.8 0 4.6 1 6.7 0" stroke="#cbab6a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18.5 12.5c-1 2 .2 3 1 4M27 11.5c-1 2 .2 3 1 4" stroke="#cdd3ce" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  bread: (
    <>
      <path d="M13 22c0-5 5-8 11-8s11 3 11 8v11a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2z" fill="#cf9a5e" />
      <path d="M13 24h22" stroke="#a5723f" strokeWidth="1.6" />
      <path d="M18 19c0-2 1-3 2-3M24 18c0-2 1-3 2-3" stroke="#efe3cd" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  tteok: (
    <>
      <rect x="12" y="19" width="24" height="10" rx="5" fill="#f1ead6" stroke="#d8c9a6" strokeWidth="1.6" />
      <path d="M20 19v10M28 19v10" stroke="#d8c9a6" strokeWidth="1.4" />
    </>
  ),
  donburi: (
    <>
      <path d="M11 22.5h26c-.3 9-6.3 15-13 15S11.3 31.5 11 22.5z" fill="#c9b892" />
      <ellipse cx="24" cy="22.5" rx="13" ry="4.3" fill="#f2ead6" />
      <path d="M14 21.5c2.5-2 6-3 10-3s7.5 1 10 3c-2.5 1.8-6 2.8-10 2.8s-7.5-1-10-2.8z" fill="#a5643f" />
      <circle cx="24" cy="20.8" r="2.8" fill="#f4ead2" /><circle cx="24" cy="20.8" r="1.5" fill="#c6923f" />
      <path d="M17 19.5c-1-1.5-1.2-2.5-1-3.6M31 19.5c1-1.5 1.2-2.5 1-3.6" stroke="#8fa96a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  guksu: (
    <>
      <path d="M11 24h26c-.3 8-6 13.5-13 13.5S11.3 32 11 24z" fill="#c6ccc5" />
      <ellipse cx="24" cy="24" rx="12.5" ry="4.2" fill="#ecd9a8" />
      <path d="M14 23.5c3 1.5 4.5-1 7 0s4 1.5 6.5 0 4.5 1 6.5 0" stroke="#cbab6a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M27 23c3.5-4.5 6-8.5 10.5-11.5M30 24.5c3.5-4 6-7 9.5-9" stroke="#a5865c" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M26.5 21.5c2-1.2 4-1 5.5 1" stroke="#d6b877" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  // ── 채소 ──
  cabbage: (
    <>
      <path d="M24 8c8 3 12 10 12 18 0 7-5 12-12 12s-12-5-12-12c0-8 4-15 12-18z" fill="#93a06e" />
      <path d="M24 10c-4 4-6 9-6 16M24 10c4 4 6 9 6 16M24 11v25" stroke="#eaf0d8" strokeWidth="1.9" fill="none" strokeLinecap="round" />
    </>
  ),
  lettuce: (
    <>
      <path d="M24 12c6-3 12-2 14 2-2 3-2 4 0 7-3 4-9 7-14 7s-11-3-14-7c2-3 2-4 0-7 2-4 8-5 14-2z" fill="#8fa568" />
      <path d="M24 12v14" stroke="#eaf0d8" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  onion: (
    <>
      <path d="M24 13c6 0 11 6 11 13 0 6-5 10-11 10s-11-4-11-10c0-7 5-13 11-13z" fill="#d9b7c4" />
      <path d="M24 10c-2 2-2 4 0 5 2-1 2-3 0-5z" fill="#8fa568" />
      <path d="M19 20c-1 5 0 11 3 15M29 20c1 5 0 11-3 15" stroke="#b98ba0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  garlic: (
    <>
      <path d="M24 12.5c-1.3-1.9-.7-3.9 0-4.8.7.9 1.3 2.9 0 4.8z" fill="#b3b087" />
      <path d="M24 13.5c5.6 2 8.6 6.6 8.6 12.6C32.6 32.2 28.6 36.2 24 36.2s-8.6-4-8.6-10.1C15.4 20.1 18.4 15.5 24 13.5z" fill="#efe7d9" stroke="#c7b89e" strokeWidth="1.6" />
      <path d="M24 15v20.6M19.4 18.4c-2.1 4.2-2.1 10.2 0 14.8M28.6 18.4c2.1 4.2 2.1 10.2 0 14.8" stroke="#cabfa6" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  greenOnion: (
    <>
      <path d="M18 34c-1-8 0-16 3-22M24 35c0-9 1-17 2-23M30 34c1-8 0-15-2-21" stroke="#8fa568" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M20 33c-1-4-1-8 0-11M24 34c0-4 0-8 1-11M28 33c1-4 1-7 0-10" stroke="#eef3e2" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  potato: (
    <>
      <path d="M13 25c-1-7 4-12 10-11.5 3 .3 4.6 1.6 7.6 1.2 3-.4 5.9 2.3 5.9 6.3 0 7-5 12.5-11 12.5-6.2 0-12.4-2-12.5-8.5z" fill="#c69f6b" />
      <path d="M18 22.5l1.4 1M25 20l1.4 1M22 28l1.4 1M29.5 25.5l1.4 1" stroke="#95703f" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  carrot: (
    <>
      <path d="M29 13c1-3 4-4 7-3-1 3-3 5-6 6z" fill="#7c8a55" />
      <path d="M31 16c3 4 2 12-3 19-4 6-9 8-12 6s-1-9 3-15 9-11 12-10z" fill="#cf8a3e" />
      <path d="M19 27c3 1 4 4 3 7M25 22c3 1 4 4 3 7" stroke="#a86a28" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  chili: (
    <>
      <path d="M30 14c-1.2.2-2 1.3-2 3-4.5-.4-10 1.8-12.5 6.5-2 3.8-1.4 8 1.6 9.6 3.4 1.8 8-.4 11.5-4.5 3-3.6 4.6-8.4 4-12.4-.3-2-1-2.5-2.6-2.2z" fill="#c0402f" />
      <path d="M28 17c2-.5 3.6-2 4-4.2 1.8.3 3 1.6 3.2 3.6" fill="none" stroke="#7c9a55" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 26c1.4 2.8 3.8 4.7 6.6 5.2" fill="none" stroke="#e08475" strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
    </>
  ),
  tomato: (
    <>
      <circle cx="24" cy="27" r="12.5" fill="#cf4f3c" />
      <path d="M24 16c-1.5-3-4.5-4-7-3 1 3 3.5 4 7 3zM24 16c1.5-3 4.5-4 7-3-1 3-3.5 4-7 3zM24 16.5c0-3-1-5.5 0-7.5 1 2 1 4.5 0 7.5z" fill="#7c9a55" />
      <ellipse cx="19.5" cy="23" rx="3.4" ry="2.2" fill="#e07a68" opacity=".55" />
    </>
  ),
  gochujang: (
    <>
      <path d="M13 21h22l-1.8 13.5a3 3 0 0 1-3 2.5H17.8a3 3 0 0 1-3-2.5z" fill="#8a5a38" />
      <ellipse cx="24" cy="21" rx="11" ry="3.6" fill="#b83f2c" />
      <ellipse cx="24" cy="20.5" rx="6.5" ry="2" fill="#9a3222" />
      <path d="M30 17l4-5" stroke="#cbb18d" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="34" cy="12" r="2.4" fill="#cbb18d" />
    </>
  ),
  doenjang: (
    <>
      <path d="M13 21h22l-1.8 13.5a3 3 0 0 1-3 2.5H17.8a3 3 0 0 1-3-2.5z" fill="#8a5a38" />
      <ellipse cx="24" cy="21" rx="11" ry="3.6" fill="#c8a25a" />
      <ellipse cx="24" cy="20.5" rx="6.5" ry="2" fill="#b08a44" />
      <path d="M30 17l4-5" stroke="#cbb18d" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="34" cy="12" r="2.4" fill="#cbb18d" />
    </>
  ),
  cucumber: (
    <>
      <path d="M15 33c-2.5-2.5-2.3-6 .5-8.8l9.7-9.7c2.8-2.8 6.3-3 8.8-.5s2.3 6-.5 8.8l-9.7 9.7c-2.8 2.8-6.3 3-8.8.5z" fill="#6f9a4b" />
      <path d="M33.6 17.2l1.6-1.6M13.4 32.8l-1.6 1.6" stroke="#c7d9a8" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19 30.5l11.5-11.5" stroke="#9dbd72" strokeWidth="2" strokeLinecap="round" opacity=".6" />
      <circle cx="20.5" cy="27.5" r=".95" fill="#557a37" /><circle cx="24.5" cy="23.5" r=".95" fill="#557a37" /><circle cx="28.5" cy="19.5" r=".95" fill="#557a37" />
    </>
  ),
  mushroom: (
    <>
      <path d="M11 24c0-7 6-12 13-12s13 5 13 12z" fill="#b98a6a" />
      <path d="M20 24v7a4 4 0 0 0 8 0v-7z" fill="#efe3cd" />
      <circle cx="18" cy="20" r="1.6" fill="#e6d3bd" /><circle cx="28" cy="19" r="1.4" fill="#e6d3bd" />
    </>
  ),
  broccoli: (
    <>
      <path d="M16 20a5 5 0 0 1 2-8 5 5 0 0 1 8-2 5 5 0 0 1 8 5 5 5 0 0 1-2 7z" fill="#74855a" />
      <path d="M20 20v10a3 3 0 0 0 6 0V20" fill="#9fae7f" />
    </>
  ),
  beans: (
    <>
      <path d="M15 20c0-4 4-6 8-5s6 4 5 7-4 5-8 4-5-3-5-6z" fill="#8a9a6b" />
      <path d="M24 24c0-4 4-6 7-5s5 4 4 7-4 4-7 3" fill="#a0af80" />
    </>
  ),
  kimchi: (
    <>
      <path d="M24 9c7 3 11 9 11 17 0 7-5 11-11 11s-11-4-11-11c0-8 4-14 11-17z" fill="#c24a30" />
      <path d="M24 11c-3.6 4-5.6 9-5.6 15M24 11c3.6 4 5.6 9 5.6 15M24 12v24" stroke="#eddca0" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <path d="M18.5 21c1.6 1.6 2.6 5 2.6 9.5M29.5 21c-1.6 1.6-2.6 5-2.6 9.5" stroke="#a83b26" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </>
  ),
  sprout: (
    <>
      <path d="M20 36c-2-7-3-13-4-17M24 37c0-7 0-13 0-18M28 36c2-7 3-12 4-16" stroke="#eee6cf" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="15.5" cy="17" rx="3" ry="2.2" transform="rotate(-20 15.5 17)" fill="#d3b455" />
      <ellipse cx="24" cy="15" rx="3" ry="2.2" fill="#d3b455" />
      <ellipse cx="32.5" cy="18" rx="3" ry="2.2" transform="rotate(20 32.5 18)" fill="#d3b455" />
    </>
  ),
  pepper: (
    <>
      <path d="M18 18c-2 3-2 8 0 12 1.5 3 3.5 4 4 6 .3 1.5 3.7 1.5 4 0 .5-2 2.5-3 4-6 2-4 2-9 0-12-1.5-2.2-4-2.5-6-1-2-1.5-4.5-1.2-6 1z" fill="#d8a83e" />
      <path d="M23 17c0-2.5.5-4 2.5-4.5" stroke="#7c9a55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M24 20v14" stroke="#e6bd68" strokeWidth="1.4" opacity=".5" />
    </>
  ),
  eggplant: (
    <>
      <path d="M30 14c3 1 5 4 4 8-1.5 6-7 13-14 13-4 0-7-3-6-7 1.5-6 8-13 14-14 .7-.1 1.4-.1 2 0z" fill="#7a5a86" />
      <path d="M30 14c1-2.5 3.5-3.5 6-3-.3 2.6-2.2 4.4-4.8 4.8" fill="none" stroke="#7c9a55" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 30c1.5 1.5 4 2 6.5 1" stroke="#9c7ba8" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".6" />
    </>
  ),
  corn: (
    <>
      <path d="M24 11c4.5 0 7.5 5 7.5 12s-3 13-7.5 13-7.5-6-7.5-13 3-12 7.5-12z" fill="#e6c24c" />
      <path d="M18 17h12M17.5 21h13M17.5 25.5h13M18 30h12" stroke="#cba62f" strokeWidth="1.2" />
      <path d="M22 13v21M26 13v21" stroke="#cba62f" strokeWidth="1.1" opacity=".7" />
      <path d="M17 19c-3-.5-5-2.5-5.5-5.5 3-.3 5.3.8 6.5 3z" fill="#88a557" />
    </>
  ),
  radish: (
    <>
      <path d="M19 19c-1.5 4-1 9 2 12.5 3 3.5 7 3.5 10 0 3-3.5 3.5-8.5 2-12.5-1.4-3.6-4-5-6.9-5s-5.6 1.4-7.1 5z" fill="#f1f2ed" stroke="#d7dbd2" strokeWidth="1.2" />
      <path d="M22 16c-1.5-2.5-3.5-3.5-6.5-3 .8 3 2.6 4.4 5.2 4.6M26 16c1.5-2.5 3.5-3.5 6.5-3-.8 3-2.6 4.4-5.2 4.6M24 16c-.3-3 .6-5 2.6-6.2" stroke="#7c9a55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  ),
  // ── 과일 ──
  apple: (
    <>
      <path d="M24 16c3-2 8-2 10 2 3 5 1 14-3 18-2 2-3 1-7 1s-5 1-7-1c-4-4-6-13-3-18 2-4 7-4 10-2z" fill="#c65a4a" />
      <path d="M24 16c0-3 1-5 3-6" stroke="#7c8a55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  ),
  banana: (
    <>
      <path d="M15 15c1 10 8 18 17.5 18.8 2.6.2 3.8-1.2 2.8-3-.6-1-1.6-1-3-1.2-7.5-1-13.3-7.3-14.3-15.6-.2-1.8-.8-2.6-2-2.4-1 .2-1.2 1.4-1 3.4z" fill="#dcb43f" />
      <path d="M15 15c-.3-2 .8-3 2-2.8M35.3 30.8c1 1.8-.2 3.2-2.8 3" stroke="#9c7c34" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M19 18c1.4 6.5 6.6 11.4 12.6 13" stroke="#ecd071" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".55" />
    </>
  ),
  strawberry: (
    <>
      <path d="M24 17c6 0 11 3 11 8 0 6-6 11-11 11s-11-5-11-11c0-5 5-8 11-8z" fill="#c15044" />
      <path d="M18 15c2 2 4 2 6 2s4 0 6-2c-1 3-3 4-6 4s-5-1-6-4z" fill="#7c8a55" />
      <circle cx="20" cy="25" r="1" fill="#f1ead6" /><circle cx="27" cy="24" r="1" fill="#f1ead6" /><circle cx="24" cy="30" r="1" fill="#f1ead6" />
    </>
  ),
  grape: (
    <>
      <g fill="#8f7ba0">
        <circle cx="20" cy="22" r="4" /><circle cx="28" cy="22" r="4" /><circle cx="24" cy="28" r="4" /><circle cx="18" cy="29" r="4" /><circle cx="30" cy="29" r="4" /><circle cx="24" cy="35" r="4" />
      </g>
      <path d="M24 18c0-3 2-5 5-6" stroke="#7c8a55" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  lemon: (
    <>
      <path d="M14 26c0-6 5-11 11-11 5 0 10 3 11 8 1 6-4 12-11 12-6 0-11-4-11-9z" fill="#d8b84a" />
      <path d="M34 22l3-2M12 28l-3 2" stroke="#c2a23c" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  orange: (
    <>
      <circle cx="24" cy="26" r="12" fill="#d98a3e" />
      <path d="M24 14c-2-2-2-4 0-5 2 1 2 3 0 5z" fill="#7c8a55" />
      <circle cx="24" cy="26" r="4" fill="#e5a45c" opacity=".6" />
    </>
  ),
  avocado: (
    <>
      <path d="M24 12c6 0 10 6 10 13s-4 12-10 12-10-5-10-12 4-13 10-13z" fill="#7c8a55" />
      <path d="M24 18c4 0 6 4 6 8s-2 7-6 7-6-3-6-7 2-8 6-8z" fill="#d8c98a" />
      <circle cx="24" cy="27" r="3.4" fill="#9c6f45" />
    </>
  ),
  // ── 고기·해산물 ──
  beef: (
    <>
      <path d="M16 12.5c8-2.4 16-1 19.5 3.2 3 3.6 2.4 8.4-2.6 11.4-6.5 3.9-15.7 4-20.6-1-3-3.1-2.6-8.2 1-11 .8-.6 1.7-1.2 2.7-1.6z" fill="#c15a48" />
      <path d="M17.5 15c5.5-1.3 11-.4 14.3 2.5" stroke="#f1e3d3" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".9" />
      <path d="M13.2 31.4c-2.7.5-5.3-.5-6-2.9-.6-2.2.8-4.1 3-4.5.9 2.7 1.8 5.1 3 7.4z" fill="#f4ecda" stroke="#dac7a9" strokeWidth="1.2" />
      <path d="M22.5 19.6c2.4 1.1 3.7 3.5 3.8 6.7M28.2 19c1.8 1.3 2.6 3.3 2.6 5.7" stroke="#dd8574" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </>
  ),
  pork: (
    <>
      <path d="M12 19c0-1.5 1.2-2.6 2.8-2.4 6 .9 12.4.9 18.4 0 1.6-.2 2.8.9 2.8 2.4v10c0 1.5-1.2 2.6-2.8 2.4-6-.9-12.4-.9-18.4 0C13.2 31.6 12 30.5 12 29z" fill="#dca9a1" />
      <path d="M13.2 21.6c6-.7 15.6-.7 21.6 0M13.2 25c6-.7 15.6-.7 21.6 0M13.2 28.4c6-.7 15.6-.7 21.6 0" stroke="#f3e6da" strokeWidth="1.9" strokeLinecap="round" />
    </>
  ),
  chicken: (
    <>
      {/* 뼈(다리) — 톤다운해서 살코기 옆에서 하얗게 안 튀게 */}
      <path d="M21.5 26.5l-6.5 7" stroke="#e7dac0" strokeWidth="4.6" strokeLinecap="round" />
      <circle cx="14.2" cy="34" r="3" fill="#e7dac0" stroke="#d3c3a2" strokeWidth="0.8" />
      <circle cx="17.4" cy="30.8" r="2.4" fill="#e7dac0" stroke="#d3c3a2" strokeWidth="0.8" />
      {/* 살코기 — 상단 뾰족한 뿔을 둥글게 다듬음 */}
      <path d="M31 14.5c3.2 2.8 3.8 7.6 1.4 11.2-1.8 2.7-5 3.8-8 2.9-2.3-.7-4.4.2-5.8 2.1-1.1 1.5-3.3.8-3.2-1.1.2-4.2 2.3-7.8 5.9-9.9 1.6-.9 2.5-2 3-3.4C25 10 29 10 31 14.5z" fill="#d0a066" />
    </>
  ),
  egg: (
    <>
      <path d="M24 9c6.5 0 11.5 9.5 11.5 17A11.5 11.5 0 1 1 12.5 26C12.5 16.5 17.5 9 24 9z" fill="#f3ead7" stroke="#cbb187" strokeWidth="1.8" />
      <circle cx="24" cy="27" r="5.5" fill="#c6923f" /><circle cx="22" cy="25" r="2" fill="#eec269" />
    </>
  ),
  fish: (
    <>
      <path d="M8 24c5-7 12-10 18-10 5 0 9 3 12 5-2 3-3 4-3 5s1 2 3 5c-3 2-7 5-12 5-6 0-13-3-18-10z" fill="#8aa0a8" />
      <path d="M38 19c2 2 3 4 3 5s-1 3-3 5" fill="#728a92" />
      <circle cx="17" cy="23" r="1.8" fill="#eef1f0" />
      <path d="M22 20c3 3 3 5 0 8" stroke="#728a92" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  shrimp: (
    <>
      <path d="M32 15c-8-1-18 3-19 12-.4 4 2 7 6 7 8 0 15-6 16-14" fill="#d98a6a" />
      <path d="M13 27c-2 1-4 0-4-2M32 15c2-1 4 0 4 2" stroke="#b56a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="19" r="1.4" fill="#6b4f3a" />
    </>
  ),
  squid: (
    <>
      <path d="M24 9c4 0 6.5 3.5 6.5 9 0 4-1 7-1 9.5h-11c0-2.5-1-5.5-1-9.5C17.5 12.5 20 9 24 9z" fill="#e0a892" />
      <circle cx="21" cy="18" r="1.4" fill="#6b4f3a" /><circle cx="27" cy="18" r="1.4" fill="#6b4f3a" />
      <path d="M19 27c-1 4-2 7-3 9M22 27.5c-.5 4-1 7-1.5 9.5M26 27.5c.5 4 1 7 1.5 9.5M29 27c1 4 2 7 3 9" stroke="#d49a84" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  clam: (
    <>
      <path d="M24 33c-9 0-15-7-14-15 0-1.2 1-2 2.2-1.8 8 1.4 15.6 1.4 23.6 0C37 16 38 16.8 38 18c1 8-5 15-14 15z" fill="#e6c8a0" />
      <path d="M24 33V18M18 32c-1-5-2-9-3-13M30 32c1-5 2-9 3-13" stroke="#cba876" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M13 17c3-2.5 6-3.5 11-3.5s8 1 11 3.5" fill="#d8b488" />
    </>
  ),
  // ── 유제품 ──
  milk: (
    <>
      <path d="M18 17.5l6-7.5 6 7.5v17a2.2 2.2 0 0 1-2.2 2.2H20.2a2.2 2.2 0 0 1-2.2-2.2z" fill="#eef1ee" stroke="#cfd6d1" strokeWidth="1.3" />
      <path d="M18 17.5h12" stroke="#cfd6d1" strokeWidth="1.3" />
      <path d="M24 10v7.5" stroke="#cfd6d1" strokeWidth="1.3" />
      <rect x="18" y="23.5" width="12" height="6.5" fill="#8fb0bd" />
      <path d="M24 25c1.4 1.7 2.1 2.9 2.1 3.8a2.1 2.1 0 0 1-4.2 0c0-.9.7-2.1 2.1-3.8z" fill="#eef1ee" />
    </>
  ),
  cheese: (
    <>
      <path d="M10 22l24-6v18a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2z" fill="#d8a23c" />
      <path d="M10 22l24-6-2 6z" fill="#e8bd6a" />
      <circle cx="18" cy="30" r="2" fill="#efe3cd" /><circle cx="26" cy="28" r="1.6" fill="#efe3cd" />
    </>
  ),
  butter: (
    <>
      <path d="M12 22.5l6-3.5 12 2-6 3.5z" fill="#f2e0a2" />
      <path d="M12 22.5l12 2v10.5l-12-2z" fill="#e6c76c" />
      <path d="M24 24.5l6-3.5v10.5l-6 3.5z" fill="#d6b356" />
      <path d="M15 26l6 1M15 29l6 1" stroke="#d8b85c" strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
    </>
  ),
  // ── 조미료·액체 ──
  soy: (
    <>
      <rect x="20" y="6" width="8" height="5" rx="1.6" fill="#6b4f3a" />
      <path d="M21 11h6v3l3.4 5v17a3 3 0 0 1-3 3h-6.8a3 3 0 0 1-3-3V19l3.4-5z" fill="#8a5a2f" />
      <rect x="17.6" y="26" width="12.8" height="10.5" rx="2.4" fill="#efe3cd" />
      <rect x="20" y="29.5" width="8" height="1.8" rx=".9" fill="#b1926a" />
    </>
  ),
  soyLong: (
    <>
      <rect x="21.5" y="5" width="5" height="4" rx="1" fill="#6b4f3a" />
      <path d="M22 9h4v8h1l2 4v14a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V21l2-4h1z" fill="#7c5a3d" />
      <rect x="18.5" y="25" width="11" height="9" rx="1.8" fill="#efe3cd" />
      <rect x="21" y="28.5" width="6" height="1.6" rx=".8" fill="#b1926a" />
    </>
  ),
  sesameOil: (
    <>
      <rect x="21.5" y="5" width="5" height="4" rx="1" fill="#6b4f3a" />
      <path d="M22 9h4v8h1l2 4v14a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V21l2-4h1z" fill="#b5832f" />
      <rect x="18.5" y="25" width="11" height="9" rx="1.8" fill="#efe3cd" />
      <rect x="21" y="28.5" width="6" height="1.6" rx=".8" fill="#b1926a" />
    </>
  ),
  vinegar: (
    <>
      <rect x="21" y="6" width="6" height="4" rx="1" fill="#8a9a6b" />
      <path d="M22 10h4v5l3 4v14a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V19l3-4z" fill="#eef1ea" stroke="#d3d9cf" strokeWidth="1.2" />
      <path d="M19 24h10v9a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill="#dbe5c4" />
      <rect x="20.5" y="21" width="7" height="3.4" rx="1" fill="#cfd8b8" />
    </>
  ),
  fishSauce: (
    <>
      <rect x="21" y="6" width="6" height="4" rx="1" fill="#6b4f3a" />
      <path d="M22 10h4v5l3 4v14a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V19l3-4z" fill="#b8823a" />
      <rect x="18.5" y="24" width="11" height="9" rx="1.8" fill="#efe3cd" />
      <path d="M21 28.5c1.5-1.5 3.5-1.5 5 0-1.5 1.5-3.5 1.5-5 0z" fill="#b8823a" />
      <path d="M26.2 28.5l2-1.2v2.4z" fill="#b8823a" />
    </>
  ),
  jar: (
    <>
      <rect x="16" y="9" width="16" height="5" rx="1.6" fill="#6b4f3a" />
      <path d="M16 14h16v20a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z" fill="#a5643f" />
      <rect x="18.5" y="20" width="11" height="12" rx="2" fill="#efe3cd" />
    </>
  ),
  salt: (
    <>
      <path d="M18 16h12l1 6c1 5 1 11 0 15a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1c-1-4-1-10 0-15z" fill="#eef1ee" stroke="#cdd3cf" strokeWidth="1.2" />
      <rect x="19" y="12" width="10" height="5" rx="1.4" fill="#9aa6a2" />
      <path d="M22 14h.01M26 14h.01" stroke="#6b7570" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  oil: (
    <>
      <path d="M21 8h6v4l4 6v16a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V18l4-6z" fill="#c9a24a" opacity=".9" />
      <path d="M20 22h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" fill="#d8b24a" />
      <rect x="22" y="6" width="4" height="3" rx="1" fill="#6b4f3a" />
    </>
  ),
  honey: (
    <>
      <path d="M17 21h14v12a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3z" fill="#e3a530" />
      <path d="M18 25.5c3.5 1 8.5 1 12 0v6a1.5 1.5 0 0 1-1.2 1.5c-3.2.6-6.4.6-9.6 0A1.5 1.5 0 0 1 18 31.5z" fill="#d0902a" opacity=".55" />
      <path d="M15.8 17.5h16.4l-1.2 3.6H17z" fill="#bf8420" />
      <path d="M31 10l-6 10.5" stroke="#9a713d" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24.4" cy="21.2" r="2.6" fill="#c99b45" />
    </>
  ),
  coffee: (
    <>
      <path d="M13 18h20v7a10 10 0 0 1-20 0z" fill="#8a6a4a" />
      <path d="M33 20h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#8a6a4a" strokeWidth="2.4" />
      <path d="M18 12c0 2-1 3-1 4M24 12c0 2-1 3-1 4" stroke="#c9b89a" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  water: (
    <>
      <path d="M24 9c5 8 9 13 9 18a9 9 0 1 1-18 0c0-5 4-10 9-18z" fill="#9fb6bd" />
      <path d="M20 27c0 3 2 5 4 5" stroke="#e6eff1" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  // ── 기타 ──
  tofu: (
    <>
      <path d="M12 20l12-5 12 5-12 5z" fill="#f1ead6" />
      <path d="M12 20v9l12 5V25z" fill="#e3d8bd" />
      <path d="M36 20v9l-12 5V25z" fill="#d8cbac" />
    </>
  ),
  seaweed: (
    <>
      <rect x="14" y="12" width="20" height="24" rx="3" fill="#40473f" />
      <path d="M18 16v16M24 16v16M30 16v16" stroke="#5a6355" strokeWidth="1.2" />
    </>
  ),
  nuts: (
    <>
      <path d="M17 18c0-4 3-6 7-6s7 2 7 6c0 6-3 14-7 14s-7-8-7-14z" fill="#b98a5a" />
      <path d="M24 14v16" stroke="#8a6540" strokeWidth="1.5" />
    </>
  ),
  // ── 요리(카테고리) ──
  salad: (
    <>
      <path d="M10 24h28c0 8-6 13-14 13s-14-5-14-13z" fill="#d6dcd3" />
      <path d="M10 24h28" stroke="#c3cabf" strokeWidth="1.4" />
      <path d="M15 22c2-4 5-6 9-6M22 22c2-4 5-6 9-5" stroke="#a7c07e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M14 23c2-3 5-4 8-4 2 0 3 1 3 3" fill="#8fa96a" />
      <circle cx="19" cy="21.5" r="2.3" fill="#a5553f" /><circle cx="29" cy="22" r="1.9" fill="#c6923f" />
    </>
  ),
  soup: (
    <>
      <path d="M11 23.5h26c-.4 8-6.4 13.5-13 13.5S11.4 31.5 11 23.5z" fill="#cdd3ce" />
      <ellipse cx="24" cy="23.5" rx="12.5" ry="4" fill="#e5d3ac" />
      <circle cx="20" cy="23" r="1.2" fill="#8fa96a" /><circle cx="27" cy="24" r="1" fill="#a5553f" />
      <path d="M31 20l6-5" stroke="#b0987a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 14c-1 2 .2 3 1 4M27 13c-1 2 .2 3 1 4" stroke="#cdd3ce" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  stew: (
    <>
      <path d="M12 22h24l-1.5 11a4 4 0 0 1-4 3.5H17.5a4 4 0 0 1-4-3.5z" fill="#7c5240" />
      <path d="M9 21h30v2.2a1.6 1.6 0 0 1-1.6 1.6H10.6A1.6 1.6 0 0 1 9 23.2z" fill="#684433" />
      <ellipse cx="24" cy="21.4" rx="12" ry="2.8" fill="#984836" />
      <circle cx="20" cy="21" r="1.5" fill="#ab5c42" /><circle cx="27.5" cy="21.6" r="1.2" fill="#ab5c42" />
      <path d="M19 14c-1 2 .2 3.4 1 4.4M28 13c-1 2 .2 3.4 1 4.4" stroke="#cdd3ce" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  stirfry: (
    <>
      <circle cx="22" cy="26" r="12" fill="#57534e" />
      <circle cx="22" cy="25" r="9.3" fill="#7c6a52" />
      <path d="M34 24.5h8.5a1.5 1.5 0 0 1 0 3H34" fill="none" stroke="#57534e" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="19" cy="24" r="1.8" fill="#a5553f" /><circle cx="25" cy="26" r="1.6" fill="#8fa96a" /><circle cx="22.5" cy="22" r="1.5" fill="#c6923f" />
    </>
  ),
  stirfryspicy: (
    <>
      <path d="M15 31c-2-2.5-1.1-5 .1-6.4.5 1.9 1.7 2.3 2.1.8 1 1.7.6 3.9-.8 5.6z" fill="#cb8c3d" />
      <path d="M28.5 31.4c-2.1-2.7-1.1-5.4.2-6.9.5 2 1.9 2.4 2.3.9 1.1 1.9.6 4.2-1 6z" fill="#cb8c3d" />
      <path d="M21.7 32.6c-2.3-2.9-1.2-6 .2-7.5.6 2.3 2 2.7 2.5 1 1.2 2.1.6 4.6-1.1 6.5z" fill="#dc4a2b" />
      <circle cx="22" cy="24" r="10.4" fill="#57534e" />
      <circle cx="22" cy="23.2" r="8" fill="#b5472f" />
      <path d="M32.4 22.8h7.9a1.4 1.4 0 0 1 0 2.8h-7.9" fill="none" stroke="#57534e" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="19" cy="23" r="1.4" fill="#cd9c46" /><circle cx="24.6" cy="24" r="1.3" fill="#f0d0a0" />
      <path d="M20.5 15.6c3-.7 5.2.6 6.6 2.4-2.2.7-4.7.2-6.8-1.1z" fill="#cf3b28" />
      <path d="M20.2 14.9c.8-.2 1.3.2 1.2 1l-1 .2z" fill="#6f9a4a" />
    </>
  ),
  stirfryveg: (
    <>
      <circle cx="21.5" cy="26.5" r="10.2" fill="#57534e" />
      <circle cx="21.5" cy="25.8" r="7.8" fill="#3f3a34" />
      <path d="M31.7 25.2h7.9a1.4 1.4 0 0 1 0 2.8h-7.9" fill="none" stroke="#57534e" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12.5 26c1.4-5.3 4.8-8.1 9-8.1s7.6 2.8 9 8.1z" fill="#6f8a4e" />
      <circle cx="16.6" cy="22.1" r="2.3" fill="#8fb060" /><circle cx="21.3" cy="19.8" r="2.6" fill="#7ea24a" /><circle cx="26" cy="22.1" r="2.3" fill="#8fb060" />
      <circle cx="18.8" cy="24.6" r="1.4" fill="#e08a3a" /><circle cx="24" cy="24.8" r="1.3" fill="#d15a44" />
      <path d="M21.3 18.6c0-2.4 1-4 2.2-4.9" stroke="#7ea24a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  pot: (
    <>
      <path d="M13 24h22l-1 8.5a4 4 0 0 1-4 3.5H18a4 4 0 0 1-4-3.5z" fill="#8a8f93" />
      <path d="M11 21.4h26v2.2a1.5 1.5 0 0 1-1.5 1.5h-23A1.5 1.5 0 0 1 11 23.6z" fill="#6f757a" />
      <path d="M11 22.4H7.4a1.6 1.6 0 0 1 0-3.2H11M37 22.4h3.6a1.6 1.6 0 0 0 0-3.2H37" fill="none" stroke="#6f757a" strokeWidth="2.3" strokeLinecap="round" />
      <ellipse cx="24" cy="19.2" rx="9.5" ry="2.2" fill="#9aa0a4" />
      <rect x="22.4" y="15.2" width="3.2" height="2.6" rx="1.3" fill="#6f757a" />
      <path d="M18.5 16.6c-.8 1.6.2 2.7.9 3.6M27.5 16.2c-.8 1.6.2 2.7.9 3.6" stroke="#cdd3ce" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  spicybowl: (
    <>
      <path d="M11 23.5h26c-.4 8-6.4 13.5-13 13.5S11.4 31.5 11 23.5z" fill="#cdd3ce" />
      <ellipse cx="24" cy="23.5" rx="12.5" ry="4" fill="#984836" />
      <circle cx="19.5" cy="23.2" r="1.3" fill="#e0663f" /><circle cx="27" cy="24" r="1.1" fill="#7f9a5c" /><circle cx="23.5" cy="24.4" r="1.1" fill="#cd9c46" />
      <path d="M20 15.4c3.1-.7 5.4.7 6.9 2.6-2.3.7-5 .1-7.2-1.3z" fill="#cf3b28" />
      <path d="M19.7 14.6c.9-.3 1.5.2 1.3 1.1l-1.1.2z" fill="#6f9a4a" />
    </>
  ),
  grill: (
    <>
      <path d="M14 18c6-2 14-2 20 0 2 .7 3 2 2.5 3.8l-1.5 6c-.5 2-2 3.2-4 3.4-4.5.5-9.5.5-14 0-2-.2-3.5-1.4-4-3.4l-1.5-6C11 20 12 18.7 14 18z" fill="#a5643f" />
      <path d="M18 19.5v13M24 18.8v14.4M30 19.5v13" stroke="#66401f" strokeWidth="1.6" opacity=".5" />
      <path d="M14.5 24h19" stroke="#66401f" strokeWidth="1.6" opacity=".5" />
    </>
  ),
  fried: (
    <>
      <path d="M16 20c-2-3 0-7 4-7 2 0 3 .8 4 .8s2-.8 4-.8c4 0 6 3.5 4.5 6.5 2.5 1 3 4 1 6 .5 3-2.5 5.5-6 5.5-1.5 1.8-5.5 1.8-7 0-3.5 0-6.5-2.5-6-5.5-2-2-1.5-5 1.5-6z" fill="#d9a548" />
      <circle cx="20" cy="21" r="1.1" fill="#b7842a" /><circle cx="26" cy="20.5" r="1.1" fill="#b7842a" /><circle cx="23" cy="25" r="1.1" fill="#b7842a" /><circle cx="28" cy="25.5" r="1.1" fill="#b7842a" /><circle cx="18.5" cy="26" r="1.1" fill="#b7842a" />
    </>
  ),
  dessert: (
    <>
      <path d="M24 14l11 20H13z" fill="#f2dab4" />
      <path d="M18.5 23.5h11M16 28h16" stroke="#e0a88a" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="15.5" r="2.4" fill="#c8503f" />
    </>
  ),
  icecream: (
    <>
      {/* 요거트 소프트 스월 */}
      <path d="M15 21.5c0-3 2-4.6 4.5-4.6-.4-2.2 1.6-3.9 4.5-3.9s4.9 1.7 4.5 3.9c2.5 0 4.5 1.6 4.5 4.6z" fill="#f5efe4" />
      <path d="M18.5 20.4c1-1.2 2.6-1.9 5.5-1.9s4.5.7 5.5 1.9" fill="none" stroke="#e6d7c0" strokeWidth="1.3" strokeLinecap="round" />
      {/* 토핑 */}
      <circle cx="24" cy="11.6" r="2.2" fill="#d47f6c" />
      {/* 컵 */}
      <path d="M14 21.5h20l-2.1 15c-.25 2-1.95 3.5-3.95 3.5h-7.9c-2 0-3.7-1.5-3.95-3.5z" fill="#e7d9bf" />
      <path d="M15.2 27h17.6" stroke="#d3c1a0" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  seafood: (
    <>
      <ellipse cx="24" cy="31" rx="15" ry="4.5" fill="#d5dbd4" />
      <ellipse cx="24" cy="30" rx="11.5" ry="3.2" fill="#eef1ec" />
      <path d="M30 18c-7-.7-14 3-14.5 8.5-.2 2.6 1.6 4.4 4.2 4.4 5.6 0 10.6-4.4 11.3-9.4" fill="#dd9070" />
      <path d="M15.8 27.5c-1.4.7-2.8 0-2.8-1.5M30 18c1.4-.7 2.8 0 2.8 1.5" stroke="#c17a5a" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <circle cx="27.5" cy="21" r="1.1" fill="#6b4f3a" />
    </>
  ),
  bibimbap: (
    <>
      <path d="M10 23h28c0 8-6 14-14 14s-14-6-14-14z" fill="#c6ccc5" />
      <ellipse cx="24" cy="23" rx="13" ry="4.6" fill="#f2ead6" />
      <path d="M11.5 24c1.5-2.5 4-3.8 7-4" stroke="#8fa96a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M15 27.5c2-1.5 5-2 8-1.8" stroke="#a5553f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M25 26c2.5-.4 5.5 0 8 1.2" stroke="#bf873c" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M29 24c2-1 4-1.8 6.5-2" stroke="#8a6a4a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="24.5" r="3" fill="#f4ead2" /><circle cx="24" cy="24.5" r="1.6" fill="#c6923f" />
    </>
  ),
  gimbap: (
    <>
      <circle cx="30" cy="26" r="8.5" fill="#3d473a" />
      <circle cx="30" cy="26" r="6.4" fill="#f1e9d5" />
      <circle cx="30" cy="26" r="1.8" fill="#8fa96a" />
      <circle cx="28" cy="24.5" r="1.2" fill="#a5553f" /><circle cx="32" cy="24.5" r="1.2" fill="#bf873c" /><circle cx="30" cy="28.5" r="1.2" fill="#c6923f" />
      <circle cx="18" cy="23" r="10" fill="#3d473a" />
      <circle cx="18" cy="23" r="7.6" fill="#f2ead6" />
      <circle cx="18" cy="23" r="2.3" fill="#c6923f" />
      <circle cx="14.8" cy="21" r="1.5" fill="#a5553f" /><circle cx="21.2" cy="21" r="1.5" fill="#8fa96a" /><circle cx="15.5" cy="25.5" r="1.5" fill="#bf873c" /><circle cx="21" cy="25.5" r="1.5" fill="#6b8a4a" />
    </>
  ),
  sushi: (
    <>
      <ellipse cx="24" cy="29" rx="13" ry="6" fill="#f2ead6" stroke="#e2d7ba" strokeWidth="1" />
      <path d="M11.5 25c2-3 7-4.5 12.5-4.5s10.5 1.5 12.5 4.5c1.2 1.8 0 3.3-2 3.5-7 .7-14 .7-21 0-2-.2-3.2-1.7-2-3.5z" fill="#e0906c" />
      <path d="M13 24.5c3.5 1.5 18 1.5 22 0" stroke="#eeb499" strokeWidth="1.4" fill="none" opacity=".7" />
      <rect x="21" y="21.5" width="6" height="10.5" rx="1" fill="#3d473a" />
    </>
  ),
  pasta: (
    <>
      <ellipse cx="24" cy="31" rx="16" ry="4.5" fill="#d8ded7" />
      <ellipse cx="24" cy="30" rx="12.5" ry="3.4" fill="#eef1ec" />
      <path d="M13 28c3-6 8-9 14-9 4 0 7 1 9 3M14 30c2-5 7-8 13-8M16 31.5c2-4 6-6 11-6.5M13 26c1-2 3-4 6-5" stroke="#d6b877" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="27" cy="25.5" r="2.6" fill="#984836" />
    </>
  ),
  // ── 쇼핑 ──
  bag: (
    <>
      <path d="M19 16v-1a5 5 0 0 1 10 0v1" fill="none" stroke="#9c6038" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M14.5 17h19l-1.4 20a2.2 2.2 0 0 1-2.2 2H18.1a2.2 2.2 0 0 1-2.2-2z" fill="#c68a52" />
      <path d="M14.5 17h19l-.4 5H14.9z" fill="#b0723f" />
    </>
  ),
  cart: (
    <>
      <path d="M12 15h4l3 16h13l3-11H19" fill="none" stroke="#7c5a3d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="36" r="2.4" fill="#c68a52" /><circle cx="30" cy="36" r="2.4" fill="#c68a52" />
    </>
  ),
  store: (
    <>
      <path d="M13 20h22v15a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2z" fill="#cf9a5e" />
      <path d="M12 14h24l2 6H10z" fill="#9c7a4e" />
      <rect x="20" y="26" width="8" height="11" rx="1" fill="#efe3cd" />
    </>
  ),
  box: (
    <>
      <path d="M24 12l11 5v14l-11 5-11-5V17z" fill="#cf9a5e" />
      <path d="M24 12l11 5-11 5-11-5z" fill="#e0bd8a" />
      <path d="M24 22v14" stroke="#9c7a4e" strokeWidth="1.6" /><path d="M13 17l11 5 11-5" fill="none" stroke="#9c7a4e" strokeWidth="1.6" />
    </>
  ),
  basket: (
    <>
      <path d="M18 19c0-5 2.5-8 6-8s6 3 6 8" fill="none" stroke="#9c6038" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 19h26l-2.6 15a3 3 0 0 1-3 2.5H16.6a3 3 0 0 1-3-2.5z" fill="#c68a52" />
      <path d="M11 19h26l-.5 3.4H11.5z" fill="#a86b45" />
      <path d="M18 23.5v12M24 23.5v12.5M30 23.5v12" stroke="#a86b45" strokeWidth="1.3" opacity=".55" />
      <path d="M13.4 27.5h21.2M14 32h20" stroke="#a86b45" strokeWidth="1.3" opacity=".55" />
    </>
  ),
  // 기본
  default: (
    <>
      <circle cx="24" cy="24" r="12" fill="#cdbe9a" />
      <path d="M20 20l8 8M28 20l-8 8" stroke="#efe3cd" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
}


// 픽커용 — 카테고리별 아이콘 키
export const FOOD_ICON_GROUPS = [
  // 🍱 뉴 음식 이모지(다꾸본 완성요리 사진) — 레시피 대표 이미지로. 사진 없을 때 이걸로 예쁘게.
  { label: '🍚 한식', items: ['fh_k01', 'fh_k02', 'fh_k03', 'fh_k04', 'fh_k05', 'fh_k06', 'fh_k11', 'fh_k13', 'fh_k14', 'fh_k16', 'fh_k17', 'fh_k18', 'fh_k22', 'fh_k23', 'fh_k27', 'fh_k29', 'fh_k30', 'fh_k32'] },
  { label: '🥟 분식·간식', items: ['fh_k27', 'fh_k22', 'fb_b01', 'fb_b02', 'fh_k31', 'fb_b05', 'fh_k23', 'fh_k37', 'fb_b03', 'fb_b04', 'fb_b06', 'fb_b07'] },
  { label: '🍝 양식', items: ['fy_y01', 'fy_y02', 'fy_y03', 'fy_y04', 'fy_y05', 'fy_y06', 'fy_y07', 'fy_y08', 'fy_y09', 'fy_y10', 'fy_y11', 'fy_y13'] },
  { label: '🥢 중식', items: ['fj_c01', 'fj_c02', 'fj_c03', 'fj_c04', 'fj_c05', 'fj_c06', 'fj_c09', 'fj_c10', 'fj_c11', 'fj_c13', 'fj_c14'] },
  { label: '🍣 일식', items: ['fi_j01', 'fi_j02', 'fi_j03', 'fi_j04', 'fi_j06', 'fi_j07', 'fi_j09', 'fi_j10', 'fi_j11', 'fi_j13', 'fi_j14'] },
  { label: '요리 아이콘', items: ['rice', 'donburi', 'bibimbap', 'gimbap', 'noodle', 'guksu', 'pasta', 'soup', 'stew', 'pot', 'spicybowl', 'stirfry', 'stirfryspicy', 'stirfryveg', 'grill', 'fried', 'salad', 'seafood', 'sushi', 'dessert', 'icecream'] },
  { label: '밥·면·빵', items: ['rice', 'donburi', 'noodle', 'guksu', 'bread', 'tteok', 'tofu'] },
  { label: '채소', items: ['cabbage', 'kimchi', 'lettuce', 'onion', 'garlic', 'greenOnion', 'sprout', 'potato', 'carrot', 'chili', 'pepper', 'cucumber', 'eggplant', 'corn', 'radish', 'mushroom', 'broccoli', 'beans'] },
  { label: '과일', items: ['tomato', 'apple', 'banana', 'strawberry', 'grape', 'lemon', 'orange', 'avocado'] },
  { label: '고기·해산물', items: ['beef', 'pork', 'chicken', 'egg', 'fish', 'shrimp', 'squid', 'clam'] },
  { label: '유제품', items: ['milk', 'cheese', 'butter'] },
  { label: '양념·장', items: ['gochujang', 'doenjang', 'soy', 'soyLong', 'sesameOil', 'oil', 'vinegar', 'fishSauce', 'salt', 'honey', 'jar'] },
  { label: '음료·기타', items: ['coffee', 'water', 'seaweed', 'nuts'] },
  { label: '쇼핑', items: ['bag', 'cart', 'basket', 'store', 'box'] },
]

// 이름만 치면 어울리는 아이콘 키를 자동으로. (위에서부터 먼저 매칭 — 구체적 키워드를 앞에)
const ICON_RULES = [
  // ── 🍚 한식 완성요리 PNG(진짜 음식같은 아이콘) — 제목에 뜨면 자동. SVG보다 먼저, 구체어 우선. ──
  [['돌솥비빔밥', '비빔밥'], 'fh_k01'],
  [['김치찌개'], 'fh_k02'],
  [['된장찌개', '된장국', '강된장'], 'fh_k03'],
  [['순두부'], 'fh_k04'],
  [['미역국'], 'fh_k05'],
  [['삼계탕', '백숙'], 'fh_k06'],
  [['부대찌개'], 'fh_k07'],
  [['떡국'], 'fh_k08'],
  [['만둣국'], 'fh_k09'],
  [['갈비탕', '설렁탕', '곰탕', '도가니탕'], 'fh_k10'],
  [['갈비찜'], 'fh_k11'],
  [['찜닭', '닭볶음탕', '닭도리탕'], 'fh_k12'],
  [['제육', '두루치기'], 'fh_k13'],
  [['삼겹살', '오겹살', '목살구이'], 'fh_k14'],
  [['소고기구이', '차돌박이', '우삼겹'], 'fh_k15'],
  [['잡채'], 'fh_k16'],
  [['계란말이', '달걀말이', '계란찜'], 'fh_k17'],
  [['고등어조림', '갈치조림', '생선조림', '고등어무조림', '코다리조림'], 'fh_k19'],
  [['생선구이', '생선', '고등어', '갈치', '삼치', '조기', '임연수', '꽁치', '가자미', '연어', '참치', '명태', '동태', '대구', '방어'], 'fh_k18'],
  [['닭강정', '양념치킨'], 'fh_k20'],
  [['동그랑땡', '완자전', '고기전'], 'fh_k21'],
  [['김밥'], 'fh_k22'],
  [['라볶이'], 'fh_k37'],
  [['라면'], 'fh_k23'],
  [['물냉면'], 'fh_k24'],
  [['냉면', '비빔냉면', '막국수', '메밀국수'], 'fh_k25'],
  [['칼국수'], 'fh_k26'],
  [['떡볶이'], 'fh_k27'],
  [['짜장', '간짜장'], 'fh_k28'],
  [['파전', '부침개', '지짐', '호박전', '김치전'], 'fh_k29'],
  [['만두', '군만두', '찐만두'], 'fh_k30'],
  [['순대'], 'fh_k31'],
  [['배추김치', '포기김치', '겉절이', '깍두기'], 'fh_k32'],
  [['시금치'], 'fh_k33'],
  [['어묵볶음'], 'fh_k34'],
  [['콩나물'], 'fh_k35'],
  [['전복죽', '호박죽', '팥죽', '흰죽', '야채죽', '누룽지'], 'fh_k36'],
  // ── 🍝 양식 완성요리 PNG(2026-07-23) — SVG보다 먼저, 구체어 우선. ──
  [['피자', '마르게리타', '고르곤졸라'], 'fy_y01'],
  [['스파게티', '미트소스', '볼로네제', '토마토파스타'], 'fy_y02'],
  [['크림파스타', '까르보나라', '카르보나라', '로제파스타', '파스타'], 'fy_y03'],
  [['크림수프', '콘스프', '감자수프', '양송이수프', '포타주', '수프', '스프'], 'fy_y04'],
  [['샐러드'], 'fy_y05'],
  [['햄버거', '버거'], 'fy_y06'],
  [['스테이크', '함박스테이크', '함박'], 'fy_y07'],
  [['그라탕', '그라탱', '라자냐'], 'fy_y08'],
  [['샌드위치'], 'fy_y09'],
  [['오므라이스', '오믈렛'], 'fy_y10'],
  [['키쉬'], 'fy_y11'],
  [['연어스테이크', '훈제연어'], 'fy_y12'],
  [['팬케이크', '핫케이크'], 'fy_y13'],
  [['클램차우더', '차우더'], 'fy_y14'],
  // ── 🥢 중식 완성요리 PNG(2026-07-23) ──
  [['짬뽕'], 'fj_c01'],
  [['딤섬', '샤오롱바오', '소룡포'], 'fj_c02'],
  [['볶음밥', '계란볶음밥', '새우볶음밥'], 'fj_c03'],
  [['깐풍새우', '깐풍기', '탕수새우'], 'fj_c04'],
  [['마파두부'], 'fj_c05'],
  [['고추잡채', '고추잡채밥'], 'fj_c06'],
  [['중화계란탕', '계란탕'], 'fj_c07'],
  [['슈마이', '하가우'], 'fj_c08'],
  [['볶음면', '울면', '기스면'], 'fj_c09'],
  [['마라탕', '마라'], 'fj_c10'],
  [['깐쇼새우', '칠리새우'], 'fj_c11'],
  [['우육면', '중화국수', '우육탕면'], 'fj_c12'],
  [['팔보채'], 'fj_c13'],
  [['동파육', '동파'], 'fj_c14'],
  // ── 🥟 분식·간식 완성요리 PNG(2026-07-23) — 일식 '튀김'보다 먼저(구체어 우선). ──
  [['어묵꼬치', '오뎅꼬치', '꼬치어묵'], 'fb_b01'],
  [['오뎅탕', '어묵탕', '어묵국'], 'fb_b02'],
  [['모둠튀김', '분식튀김'], 'fb_b03'],
  [['쫄면'], 'fb_b04'],
  [['핫도그', '콘도그', '핫바'], 'fb_b05'],
  [['김말이', '야채튀김'], 'fb_b06'],
  [['토스트', '길거리토스트', '계란토스트'], 'fb_b07'],
  [['감자튀김', '프렌치프라이', '감자스틱'], 'fb_b08'],
  [['슬러시', '슬러쉬'], 'fb_b09'],
  // ── 🍣 일식 완성요리 PNG(2026-07-23) ──
  [['초밥', '스시', '니기리', '생선초밥'], 'fi_j01'],
  [['우동'], 'fi_j02'],
  [['튀김', '텐푸라', '새우튀김'], 'fi_j03'],
  [['라멘'], 'fi_j04'],
  [['모둠초밥', '모듬초밥', '초밥세트'], 'fi_j05'],
  [['장어덮밥', '장어', '우나기', '히츠마부시'], 'fi_j06'],
  [['타코야키', '문어빵'], 'fi_j07'],
  [['연어롤', '데마키'], 'fi_j08'],
  [['사시미', '모둠회', '모듬회', '생선회'], 'fi_j09'],
  [['소바', '메밀소바', '자루소바'], 'fi_j10'],
  [['오니기리', '주먹밥', '삼각김밥'], 'fi_j11'],
  [['카이센동', '해산물덮밥', '지라시'], 'fi_j12'],
  [['미소국', '미소된장국', '미소시루'], 'fi_j13'],
  [['김초밥', '마키'], 'fi_j14'],
  // ── 완성 요리(카테고리) — 요리명이면 대표 아이콘 ──
  [['파스타', '스파게티', '까르보나라', '카르보나라', '알리오', '뇨끼', '라자냐', '라비올리', '펜네', '봉골레'], 'pasta'],
  [['비빔밥', '비빔국수', '비빔면', '비빔'], 'bibimbap'],
  [['김밥'], 'gimbap'],
  [['초밥', '스시', '유부초밥'], 'sushi'],
  [['샐러드'], 'salad'],
  [['전골', '샤브', '나베', '밀푀유'], 'pot'],
  [['찌개', '스튜'], 'stew'],
  [['마라탕', '마라', '육개장', '매운탕', '알탕', '동태탕', '감자탕'], 'spicybowl'],
  [['크림수프', '수프', '스프', '포타주', '차우더'], 'soup'],
  [['탕수육', '돈까스', '돈가스', '까스', '텐동', '가라아게', '고로케', '너겟', '튀김', '프라이', '후라이드'], 'fried'],
  [['볶음밥'], 'rice'],
  [['제육', '두루치기', '주꾸미', '쭈꾸미', '낙지볶음', '오징어볶음', '매운볶음', '고추장볶음', '불고기볶음'], 'stirfryspicy'],
  [['야채볶음', '채소볶음', '가지볶음', '버섯볶음', '애호박볶음', '나물볶음', '감자볶음', '어묵볶음', '멸치볶음', '두부조림'], 'stirfryveg'],
  [['마파', '잡채', '볶음'], 'stirfry'],
  // ── 면·밥·떡·빵 ──
  [['국수', '잔치', '소면'], 'guksu'],
  [['라면', '우동', '냉면', '쫄면', '당면', '짜장', '짬뽕', '소바', '면'], 'noodle'],
  [['덮밥', '규동'], 'donburi'],
  [['주먹밥', '리조또', '필라프', '현미', '누룽지', '쌀', '밥', '죽'], 'rice'],
  [['떡볶이', '가래떡', '떡'], 'tteok'],
  [['식빵', '토스트', '크루아상', '베이글', '바게트', '샌드위치', '빵'], 'bread'],
  // ── 채소 ──
  [['배추'], 'cabbage'],
  [['김치', '겉절이', '깍두기'], 'kimchi'],
  [['콩나물', '숙주'], 'sprout'],
  [['상추', '깻잎', '쌈', '시금치', '나물', '청경채', '채소', '야채'], 'lettuce'],
  [['양파'], 'onion'],
  [['마늘'], 'garlic'],
  [['파프리카', '피망', '파프'], 'pepper'],
  [['대파', '쪽파', '실파', '파'], 'greenOnion'],
  [['감자', '고구마'], 'potato'],
  [['당근'], 'carrot'],
  [['고추장'], 'gochujang'],
  [['된장', '쌈장', '청국장'], 'doenjang'],
  [['고추', '고춧', '청양'], 'chili'],
  [['토마토'], 'tomato'],
  [['오이'], 'cucumber'],
  [['가지'], 'eggplant'],
  [['옥수수', '콘'], 'corn'],
  [['버섯', '표고', '느타리', '팽이', '양송이'], 'mushroom'],
  [['브로콜리'], 'broccoli'],
  [['완두', '병아리콩', '렌틸', '대두', '콩'], 'beans'],
  // ── 고기·해산물 ──
  [['삼겹', '베이컨', '돼지', '목살', '항정'], 'pork'],
  [['닭', '치킨'], 'chicken'],
  [['소고기', '쇠고기', '스테이크', '불고기', '갈비', '차돌', '우삼겹', '한우', '정육', '고기'], 'beef'],
  [['새우'], 'shrimp'],
  [['오징어', '한치', '문어', '낙지', '주꾸미'], 'squid'],
  [['조개', '홍합', '바지락', '전복', '꼬막', '굴'], 'clam'],
  [['연어', '고등어', '참치', '명태', '동태', '멸치', '갈치', '삼치', '생선', '어묵'], 'fish'],
  [['계란', '달걀', '오믈렛', '스크램블', '메추리'], 'egg'],
  // ── 유제품·두부 ──
  [['치즈'], 'cheese'],
  [['버터'], 'butter'],
  [['우유', '요거트', '요구르트', '생크림', '크림'], 'milk'],
  [['순두부', '유부', '두부'], 'tofu'],
  // ── 양념·장·기름 ──
  [['간장'], 'soy'],
  [['액젓', '피시소스', '까나리', '멸치액'], 'fishSauce'],
  [['참기름', '들기름'], 'sesameOil'],
  [['식용유', '올리브유', '카놀라', '기름', '오일'], 'oil'],
  [['식초', '발사믹'], 'vinegar'],
  [['소금'], 'salt'],
  [['설탕', '올리고당', '물엿', '시럽', '꿀'], 'honey'],
  [['잼', '스프레드', '피클', '소스', '맛술', '마요', '케찹', '케첩'], 'jar'],
  // ── 과일 ──
  [['사과'], 'apple'],
  [['바나나'], 'banana'],
  [['딸기'], 'strawberry'],
  [['레몬', '라임'], 'lemon'],
  [['포도', '청포도'], 'grape'],
  [['오렌지', '자몽', '귤'], 'orange'],
  [['아보카도'], 'avocado'],
  // ── 음료 ──
  [['커피', '원두', '라떼', '아메리카노'], 'coffee'],
  [['생수', '탄산수', '물'], 'water'],
  // ── 기타 재료 ──
  [['미역', '다시마', '파래', '김'], 'seaweed'],
  [['아몬드', '호두', '땅콩', '캐슈', '잣', '견과'], 'nuts'],
  [['무말랭이', '단무지', '무순', '무'], 'radish'],
  // ── 조리법 (낮은 우선순위 캐치) ──
  [['구이', '바베큐', '바비큐'], 'grill'],
  [['국', '탕', '해장'], 'soup'],
  // ── 쇼핑 ──
  [['택배', '배송', '상자', '박스'], 'box'],
  [['장바구니', '카트'], 'cart'],
  [['마트', '상점', '편의점', '쇼핑'], 'store'],
]

export function guessFoodIcon(name = '') {
  const s = String(name)
  for (const [keys, key] of ICON_RULES) {
    if (keys.some((k) => s.includes(k))) return key
  }
  return 'default'
}

export default function FoodIcon({ name = 'default', size = 40 }) {
  // 🍱 뉴 음식 이모지(PNG) — 완성요리 사진을 아이콘으로. 없으면 SVG 브랜드 아이콘.
  const pf = PHOTO_FAMILY[name]
  if (pf && pf.src) {
    return <img src={pf.src} alt="" draggable={false} width={size} height={size} style={{ display: 'block', objectFit: 'contain' }} />
  }
  const content = I[name] || I.default
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block' }} aria-hidden="true">
      {content}
    </svg>
  )
}

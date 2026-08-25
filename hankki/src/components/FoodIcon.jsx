// 한끼 브랜드 재료 아이콘 세트 — 앱 쿨톤과 어울리는 채도 낮은 컬러 듀오톤.
// 이름으로 자동 매칭(guessFoodIcon)되거나, 픽커에서 직접 고를 수 있다.
import { PHOTO_FAMILY } from './Stickers' // 🍱 뉴 음식 이모지(다꾸본 완성요리 PNG)도 레시피 아이콘으로 쓸 수 있게
import { ING_RULES, ING_SRC, ingIconOf } from '../data/ingIcons' // 🥕 냉장고·장보기 «재료» 그림 171컷(창업자 2026-08-12)

const I = {
  // ── 곡물·면 ──
  // 🍚 rice(공기밥) = **픽커·자동매칭에서 뺐다**(창업자 2026-07-29 "공기밥은 빼자").
  //    레시피 표지에 흰밥 한 공기가 붙으면 '요리'로 안 보인다.
  //    ⚠️ 그림 정의는 남겨둔다 — 예전에 이 아이콘으로 저장된 레시피·프로필이 깨지면 안 되니까.
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
  // 기본 — 제목에서 요리를 못 알아냈을 때 붙는 그림. 「아직 안 정해졌다」는 뜻이다.
  //
  // ⛔⛔ [2026-08-21 창업자 제보] 옛 그림은 **베이지 동그라미에 ✕(가위표)** 였다.
  //    📮 창업자가 링크로 담은 레시피를 보고 짚었다 — 썸네일이 ✕ 로 떠 있었다.
  //    ⭐ ✕ 는 세상 어디서나 **「없음·실패·닫기」**다. 그래서 유저는 「그림이 아직 없다」가 아니라
  //       **「저장이 잘못됐다」**로 읽는다. 표시하려던 것과 반대로 읽히는 그림이었다.
  //    ✅ 빈 접시로 바꿨다 — 「담을 자리인데 아직 비었다」가 그림 그대로 읽힌다.
  //
  // ⭐ 키(`default`)는 «안 바꿨다» — 이미 저장된 레시피에 이 키가 박혀 있어서
  //    그림만 갈면 **이미 깔린 폰에서도 저절로 고쳐진다**(규칙 18 ⓙ).
  //    ＋ 냉장고 재료 기본값(`PantryView`)·아이콘 픽커도 같은 키를 써서 셋이 한꺼번에 좋아진다.
  default: (
    <>
      <ellipse cx="24" cy="34.6" rx="11.5" ry="1.7" fill="#8a6a3a" opacity=".09" />
      <circle cx="24" cy="24" r="12.4" fill="#e6dac0" />
      <circle cx="24" cy="24" r="12.4" fill="none" stroke="#d2c19c" strokeWidth="1.1" />
      <circle cx="24" cy="24" r="7.6" fill="#f2ead8" />
      <circle cx="24" cy="24" r="7.6" fill="none" stroke="#d9caa8" strokeWidth="1" />
    </>
  ),
}


// 픽커용 — 카테고리별 아이콘 키
//
// ⭐⭐ 분류 축은 «하나만» 쓴다 (창업자 2026-08-01 *"분류자체가 좀 이상한듯해"* → 대수술)
//   전엔 **나라 축**(한식·양식·중식·일식)과 **성격 축**(해산물·반찬·분식·빵)이 한 줄에 섞여 있었다.
//   그래서 «연어롤은 일식이면서 해산물»이고 «떡볶이는 한식이면서 분식»이라 —
//   ⛔ **한 요리가 두 집에 살 수밖에 없었다.** 손으로 정리해도 다시 어긋난다.
//
//   ⭐ 새 기준 = **「무엇을 만들었나」** (창업자 확정 2026-08-01)
//      · 한식은 60개가 넘어 한 칸에 못 담는다 → **밥·국탕찌개·면·구이튀김·볶음조림·반찬·분식** 으로 쪼갠다
//      · 외국 음식은 나라마다 20개 안팎이라 안 쪼갠다 → **양식·중식·일식·동남아**
//      · 판정 순서가 하나뿐이라 겹치지 않는다 — 「한식이면 종류로, 아니면 나라로」
//
// 🔒 **한 컷은 한 집에만 산다.** `scripts/check-foodtab.mjs` 가 세서 **중복이 생기면 배포가 막힌다.**
// ⛔ **파일은 안 지운다** — 픽커에서 내리기만 한다. 이미 그 아이콘으로 저장한 레시피가 깨지면 안 된다.
//    (내린 것 = 같은 요리를 두 번 그린 «뒷세대» — `fh_hnc/htj/hnb`·`fy_yng`·`fj_jsk`·`fi_isk`·`fb_bun`.
//     이 세대는 **제목 자동매칭이 하나도 없고 해상도도 낮다**. 근거 = 2026-08-01 실측)
export const FOOD_ICON_GROUPS = [
  // ── 🇰🇷 한식은 «무엇을 만들었나» 로 쪼갠다 ──
  { label: '밥', items: ['fe_434', 'fe_315', 'fe_307', 'fe_289', 'fe_290', 'fe_217', 'fe_229', 'fe_486', 'fe_487', 'fe_488', 'fe_489', 'fe_490', 'fe_178', 'fe_182', 'fe_491', 'fe_97', 'fe_99', 'fe_109', 'gr_002', 'gr_048', 'fe_32', 'fe_20', 'fe_04', 'fe_67', 'gr_001', 'fe_480', 'fe_01', 'fe_02', 'fe_03', 'fe_63', 'fe_06', 'fe_07'] },
  { label: '국·탕·찌개', items: ['fe_474', 'fe_476', 'fe_479', 'fe_314', 'fe_316', 'fe_318', 'fe_481', 'fe_261', 'fe_262', 'fe_482', 'fe_483', 'fe_212', 'fe_213', 'fe_485', 'fe_215', 'fe_475', 'fe_220', 'fe_477', 'fe_478', 'fe_159', 'fe_468', 'fe_472', 'fe_469', 'fe_141', 'fe_148', 'fe_150', 'fe_470', 'fe_471', 'fe_114', 'fe_123', 'fe_133', 'fh_k02', 'fh_k04', 'fh_k05', 'fh_k06', 'fh_k07', 'fh_k08', 'fe_473', 'fh_k10', 'fe_29', 'fe_30', 'fe_31', 'fe_13', 'fe_79', 'fe_80', 'fb_b02'] },
  { label: '면', items: ['gr_105', 'gr_106', 'fe_401', 'fe_297', 'fe_298', 'fe_265', 'fe_396', 'fe_397', 'fe_398', 'fe_399', 'fe_400', 'fe_122', 'fe_394', 'fh_k26', 'fe_18', 'fe_37', 'fe_38', 'gr_104'] },
  { label: '구이·튀김', items: ['gr_074', 'gr_103', 'gr_107', 'gr_108', 'fe_305', 'fe_287', 'fe_295', 'fe_285', 'fe_263', 'gr_075', 'fe_208', 'gr_076', 'gr_077', 'gr_078', 'fe_393', 'fe_251', 'gr_099', 'fe_162', 'fe_390', 'gr_100', 'gr_101', 'gr_102', 'gr_073', 'fe_137', 'fe_100', 'fe_389', 'fe_107', 'fe_119', 'gr_097', 'fh_k14', 'fh_k18', 'fe_391', 'fh_k29', 'gr_098', 'fe_65', 'fe_392'] },
  // 🥄 소스·양념장은 «볶음·조림 맨 끝»에 (창업자 2026-08-05 *"볶음 마지막에 소스넣자"*).
  //    ⭐ 소스는 그 자체가 요리가 아니라 «볶고 조릴 때 쓰는 것»이라 그 옆이 손이 간다.
  //    ⛔ 재료 축의 「양념·장」(gochujang·soy…)과 다르다 — 저건 병에 든 재료, 이건 만들어 담은 것.
  { label: '볶음·조림', items: ['gr_040', 'gr_041', 'gr_056', 'fe_417', 'fe_418', 'fe_319', 'fe_328', 'fe_325', 'fe_326', 'gr_053', 'gr_054', 'gr_091', 'fe_306', 'fe_286', 'gr_092', 'fe_283', 'gr_093', 'fe_207', 'gr_094', 'fe_224', 'fe_421', 'fe_227', 'fe_423', 'fe_424', 'fe_425', 'fe_240', 'fe_241', 'fe_242', 'fe_252', 'fe_253', 'fe_254', 'fe_426', 'fe_160', 'fe_164', 'fe_171', 'fe_172', 'fe_174', 'fe_177', 'fe_181', 'fe_184', 'fe_185', 'fe_191', 'gr_005', 'gr_006', 'fe_203', 'gr_055', 'fe_144', 'fe_134', 'fe_135', 'gr_051', 'gr_052', 'fe_415', 'fe_416', 'fe_129', 'fh_k11', 'fe_419', 'fh_k13', 'fh_k19', 'fh_k34', 'fh_htj13', 'fe_420', 'fe_75', 'fe_34', 'fe_35', 'fe_10', 'fe_70', 'fe_64', 'fe_66', 'fe_142', 'fe_102', 'fe_149', 'fe_128'] },
  { label: '반찬·나물·김치', items: ['gr_037', 'gr_046', 'fe_402', 'fe_403', 'fe_407', 'fe_288', 'gr_004', 'fe_408', 'fe_291', 'fe_292', 'fe_293', 'fe_299', 'fe_300', 'fe_301', 'fe_302', 'fe_303', 'fe_304', 'fe_271', 'fe_409', 'fe_410', 'fe_274', 'fe_411', 'fe_412', 'fe_413', 'gr_042', 'gr_043', 'gr_044', 'gr_045', 'fe_239', 'gr_047', 'fe_248', 'fe_255', 'gr_038', 'gr_039', 'fe_258', 'fe_259', 'fe_260', 'fe_156', 'fe_161', 'fe_165', 'fe_175', 'fe_179', 'fe_193', 'fe_194', 'fe_195', 'fe_200', 'fe_201', 'fe_143', 'fe_145', 'fe_146', 'fe_147', 'fe_153', 'fe_104', 'fe_105', 'fe_108', 'fe_110', 'fe_111', 'gr_095', 'gr_096', 'fe_116', 'gr_079', 'gr_080', 'gr_081', 'fh_k33', 'fh_k35', 'fe_11', 'fe_12', 'fe_14', 'fe_71', 'fe_404', 'fe_405', 'fe_76', 'fe_77', 'fe_406', 'fe_68'] },
  // ⭐ 2026-08-02 신설 — v9.38 에 조리법 축을 세울 때 «날것»과 «삶음»이 빠져 있었다.
  //    그래서 회·육회·대구뭉티기·수육이 「구이·튀김」에 얹혀 있었다(창업자 지적).
  //    ⚠️ 2026-08-05 창업자가 순서를 다시 잡으며 「회」를 두 번 적었는데(반찬 뒤·일식 뒤)
  //       *"일식뒤에 회빼고"* 로 확정 — **한식 묶음 맨 끝 한 곳**이다.
  { label: '회·수육', items: ['fe_322', 'fe_323', 'fe_324', 'fe_433', 'fe_136', 'gr_082', 'fe_22', 'fe_125'] },
  // ── 🌍 외국 음식은 나라로 ──
  { label: '양식', items: ['fe_428', 'fe_432', 'fe_444', 'fe_453', 'fe_435', 'fe_436', 'fe_437', 'fe_438', 'fe_270', 'fe_427', 'fe_168', 'fe_188', 'fe_429', 'fe_430', 'fe_450', 'fe_431', 'fe_42', 'fe_451', 'fe_452', 'fe_446', 'fe_454', 'fe_455', 'fe_456', 'fe_445', 'fe_414', 'fe_05', 'fe_443', 'fy_y03', 'fe_447', 'fy_y05', 'fe_448', 'fe_449', 'fy_y08', 'fy_y09', 'fe_439', 'fe_440', 'fe_441', 'fe_442', 'fy_yng02'] },
  { label: '중식', items: ['gr_084', 'fe_47', 'fe_90', 'fe_91', 'fj_c01', 'fe_492', 'fe_462', 'fe_463', 'fe_464', 'fe_465', 'fe_466', 'fe_467', 'fe_457', 'gr_083', 'fe_458', 'fe_459', 'fe_460', 'fe_461', 'fj_jsk02', 'fj_jsk15'] },
  { label: '일식', items: ['fe_493', 'fe_103', 'gr_031', 'fe_121', 'gr_032', 'fe_46', 'fe_494', 'fi_j02', 'fi_j03', 'fi_j04', 'fi_j05', 'fi_j07', 'fi_j08', 'fi_j09', 'fi_j11', 'fi_j12', 'fi_j13', 'fi_j14', 'fi_isk03'] },
  { label: '동남아', items: ['gr_034', 'gr_033', 'fe_231', 'gr_035', 'fe_115', 'gr_036', 'gr_025', 'gr_026', 'gr_027', 'gr_028', 'fe_60', 'gr_061', 'gr_062'] },
  // 🍢 분식·빵디저트는 «맨 뒤로» (창업자 2026-08-05 순서 확정). 끼니가 앞, 군것질이 뒤다.
  { label: '분식', items: ['gr_003', 'gr_069', 'gr_071', 'fe_282', 'gr_063', 'fh_k22', 'gr_064', 'gr_065', 'gr_066', 'gr_067', 'fb_b03', 'gr_068', 'gr_021', 'gr_070', 'fb_bun11'] },
  { label: '빵·디저트·음료', items: ['gr_008', 'gr_016', 'gr_017', 'gr_018', 'gr_086', 'gr_072', 'gr_085', 'fe_264', 'gr_087', 'gr_088', 'gr_089', 'gr_090', 'gr_007', 'fe_82', 'fe_83', 'fe_84', 'fe_85', 'gr_010', 'gr_011', 'fe_51', 'fe_39', 'gr_012', 'gr_013', 'fe_17', 'fe_19', 'gr_014', 'gr_015', 'fe_15', 'fb_b09', 'gr_009'] },
  // ── 🥕 아래는 «요리 사진»이 아니라 재료·도구 SVG 아이콘. 성격이 달라서 따로 둔다. ──
  //
  // 🥕🥕 `kind: 'ing'` = **냉장고에 «들어가는 것»** (창업자 폰 제보 2026-08-16)
  //   📮 창업자 *"냉장고에 유통기한넣을때 아이콘바꾸는거 **음식이 먼저다떠**"*
  //   ⭐ 맞는 지적 — 「재료 담기」 시트인데 요리 갈래 14줄(밥·국탕찌개·면…)을 지나야 채소가 나왔다.
  //      **거기서 고르는 건 「무엇을 만들었나」가 아니라 「무엇을 넣어뒀나」다.**
  //   ⛔ **라벨 글자로 가르지 않는다** — 라벨은 «표시용»이라 다듬으면 분류가 깨진다
  //      (2026-07-30 `asset-map.mjs` 의 `CAT()` 이 정확히 그렇게 터졌다 · CLAUDE.md 「분류 원칙」).
  //      그래서 **갈래마다 `kind` 를 직접 적는다.** 새 갈래를 넣는 사람이 여기서 한 번 고르면 끝이다.
  //   ⛔ 요리 갈래를 «지우지» 않는다 — 남은 된장찌개를 통째로 넣어둘 수도 있다. 밑에 그대로 둔다.
  //   ⛔ 「쇼핑」(bag·cart)은 ing 이 아니다 — 냉장고에 장바구니를 넣진 않는다. 쇼핑몰 아이콘용이다.
  //
  // 🥕🥕🥕 [2026-08-16] 재료 갈래를 **창업자 그림 171컷**으로 갈아끼웠다.
  //   📮 창업자 *"근데 우리 이거 아이콘 내가 새로 다 뽑은걸로 기억하는데"* · *"**다 어디갔어?????**"*
  //   ⛔⛔ **2026-08-12 에 «절반만» 연결돼 있었다** (커밋 005a9b6):
  //      ✅ 그림 171장 ＋ 이름표 ＋ 「이름을 치면 붙기」(guessIngredientIcon)
  //      ⛔ **「아이콘 선택」 목록엔 한 컷도 안 실었다** → 바꾸려고 열면 옛 SVG 도형만 나왔다
  //      ⛔ 그때 만든 검사 5칸이 «전부» 「이름 치면 붙나」만 재서 **픽커가 텅 빈 채로 5/5 초록불**이었다
  //         📌 규칙 18 ⓘ — 「통과했나」가 아니라 **「무엇을 보고 통과했나」**.
  //      ⛔ 그리고 재료 갈래가 픽커 15번째에 파묻혀 있어 **아무도 안 열어봐서 3일 넘게 안 들켰다.**
  //   ⛔ 옛 SVG 재료 55컷(cabbage·kimchi…)은 **픽커에서 내리기만 한다 — 파일·코드는 남긴다.**
  //      그걸로 저장한 재료가 깨지면 안 된다(kf_c_·sf_ 때와 같은 방식).
  //   ⭐ 덤으로 이름표도 고쳐졌다 — 옛 도형은 제 이름이 없어 요리 규칙에서 빌려 썼다
  //      (떡 → 「떡볶이」 · 두부 → 「순두부」 · 무 → 「무말랭이」). 창업자 컷은 제 이름이 박혀 있다.
  //   🔢 갈래 나누기는 손으로 세지 않았다 — `scratchpad/분류-재료171.mjs` 가 빠짐·중복을 대조한다
  //      (채소 47 · 과일 20 · 고기해산물 34 · 유제품 8 · 양념장 33 · 밥면빵 22 · 음료기타 7 = 171).
  { label: '요리 아이콘', items: ['donburi', 'bibimbap', 'gimbap', 'fe_395', 'guksu', 'pasta', 'soup', 'stew', 'pot', 'fe_484', 'stirfry', 'stirfryspicy', 'stirfryveg', 'grill', 'fried', 'salad', 'seafood', 'sushi', 'dessert', 'icecream'] },
  { label: '채소', kind: 'ing', items: ['ig_s1_01', 'ig_s1_02', 'ig_s1_03', 'ig_s1_04', 'ig_s1_05', 'ig_s1_06', 'ig_s1_09', 'ig_s1_10', 'ig_s1_11', 'ig_s1_13', 'ig_s1_14', 'ig_s1_15', 'ig_s1_16', 'ig_s2_01', 'ig_s2_02', 'ig_s2_03', 'ig_s2_04', 'ig_s2_05', 'ig_s2_06', 'ig_s2_07', 'ig_s2_08', 'ig_s2_09', 'ig_s2_10', 'ig_s2_11', 'ig_s2_12', 'ig_s2_14', 'ig_s2_15', 'ig_s2_16', 'ig_s3_01', 'ig_s3_02', 'ig_s3_03', 'ig_s3_04', 'ig_s3_05', 'ig_s3_06', 'ig_s3_07', 'ig_s3_08', 'ig_s3_09', 'ig_s3_10', 'ig_s3_11', 'ig_s3_12', 'ig_s3_13', 'ig_s3_14', 'ig_s3_15', 'ig_s3_16', 'ig_s8_13', 'ig_s8_01', 'ig_s11_02', 'ig_add01'] },
  { label: '과일', kind: 'ing', items: ['ig_s7_04', 'ig_s7_05', 'ig_s7_06', 'ig_s7_07', 'ig_s7_08', 'ig_s7_09', 'ig_s7_10', 'ig_s7_11', 'ig_s7_12', 'ig_s7_13', 'ig_s7_14', 'ig_s7_15', 'ig_s7_16', 'ig_s10_01', 'ig_s10_02', 'ig_s10_03', 'ig_s10_04', 'ig_s10_05', 'ig_s10_06', 'ig_s10_07'] },
  { label: '고기·해산물', kind: 'ing', items: ['ig_s6_01', 'ig_s6_02', 'ig_s6_03', 'ig_s6_04', 'ig_s6_05', 'ig_s6_07', 'ig_s6_08', 'ig_s6_09', 'ig_s6_10', 'ig_s6_11', 'ig_s6_12', 'ig_s6_13', 'ig_s6_14', 'ig_s6_15', 'ig_s6_16', 'ig_s8_03', 'ig_s8_04', 'ig_s8_05', 'ig_s8_06', 'ig_s8_07', 'ig_s8_08', 'ig_s8_09', 'ig_s8_10', 'ig_s8_14', 'ig_s8_15', 'ig_s9_13', 'ig_s9_14', 'ig_s9_15', 'ig_s9_16', 'ig_s9_01', 'ig_s6_06', 'ig_s4_16', 'ig_s8_11', 'ig_s8_02'] },
  { label: '유제품', kind: 'ing', items: ['ig_s7_01', 'ig_s7_02', 'ig_s7_03', 'ig_s9_09', 'ig_s9_10', 'ig_s10_09', 'ig_s8_16', 'ig_s11_09'] },
  { label: '양념·장', kind: 'ing', items: ['ig_s1_07', 'ig_s4_01', 'ig_s4_02', 'ig_s4_03', 'ig_s4_04', 'ig_s4_05', 'ig_s4_06', 'ig_s4_07', 'ig_s4_08', 'ig_s4_09', 'ig_s4_10', 'ig_s4_11', 'ig_s4_12', 'ig_s4_13', 'ig_s4_14', 'ig_s4_15', 'ig_s5_01', 'ig_s5_02', 'ig_s5_03', 'ig_s5_04', 'ig_s5_05', 'ig_s5_06', 'ig_s5_07', 'ig_s5_08', 'ig_s5_09', 'ig_s5_11', 'ig_s5_13', 'ig_s5_14', 'ig_s5_15', 'ig_s5_16', 'ig_s10_12', 'ig_s10_13', 'ig_s10_16'] },
  { label: '밥·면·빵', kind: 'ing', items: ['ig_s9_02', 'ig_s9_11', 'ig_s11_16', 'ig_s9_03', 'ig_s9_06', 'ig_s9_07', 'ig_s9_04', 'ig_s11_04', 'ig_s11_06', 'ig_s11_07', 'ig_s11_08', 'ig_s8_12', 'ig_s11_15', 'ig_s9_05', 'ig_s11_10', 'ig_s11_11', 'ig_s11_12', 'ig_s11_03', 'ig_s11_05', 'ig_s10_11', 'ig_s10_14', 'ig_s10_15'] },
  { label: '음료·기타', kind: 'ing', items: ['ig_s9_12', 'ig_s10_08', 'ig_s9_08', 'ig_s10_10', 'ig_s11_01', 'ig_s11_13', 'ig_s11_14'] },
  { label: '쇼핑', items: ['bag', 'cart', 'basket', 'store', 'box'] },
]

// 이름만 치면 어울리는 아이콘 키를 자동으로. (위에서부터 먼저 매칭 — 구체적 키워드를 앞에)
const ICON_RULES = [
  // 🍽 [2026-08-26] 창업자 「그릇」 컷 — «전용 그림이 처음 생긴» 19개만 새 줄로 적는다
  //   ⭐ 나머지 76개는 «같은 이름의 옛 규칙 키만 새 키로 갈아끼웠다»(줄을 안 늘린다)
  //   ⛔ 구체어 먼저 — 이 블록이 아래 넓은 규칙(「무침」·「국」·「볶음」)보다 «위»에 있어야 한다
  [['빨간떡볶이'], 'gr_003'],
  [['여러가지쿠키'], 'gr_008'],
  [['생크림케이크'], 'gr_016'],
  [['딸기와플'], 'gr_017'],
  [['딸기쉐이크'], 'gr_018'],
  [['쌀국수'], 'gr_034'],
  [['오이무침'], 'gr_037'],
  [['계란말이'], 'gr_040'],
  [['계란찜'], 'gr_041'],
  [['깍두기'], 'gr_046'],
  [['매운해물볶음'], 'gr_056'],
  [['한국식핫도그'], 'gr_069'],
  [['만두튀김'], 'gr_071'],
  [['군만두'], 'gr_084'],
  [['무화과그릭요거트디저트'], 'gr_086'],
  [['매운양념치킨'], 'gr_103'],
  [['들기름막국수'], 'gr_105'],
  [['매운막국수'], 'gr_106'],

  // 🍽🍽 2026-08-24 창업자 실사 컷 106개 — «전용 그림이 처음 생긴» 12개만 여기 새로 적는다
  //   ⭐ 나머지 94개는 «같은 이름의 옛 규칙 키만 새 키로 갈아끼웠다»(줄을 새로 안 만든다)
  //   ⛔ 구체어 먼저 — 이 블록이 아래 넓은 규칙(「무침」·「국」·「파스타」)보다 «위»에 있어야 한다
  [['빨간콩나물무침', '빨간 콩나물무침', '매운콩나물무침'], 'fe_402'],
  [['하얀콩나물무침', '하얀 콩나물무침', '콩나물무침(하얀)'], 'fe_403'],
  [['전복장', '전복 간장게장', '전복간장절임'], 'fe_407'],
  [['매운돼지고기두루치기', '돼지고기두루치기', '두루치기'], 'fe_417'],
  [['간장제육볶음', '간장 제육볶음', '간장제육'], 'fe_418'],
  [['봉골레파스타'], 'fe_428'],
  [['크림리조또', '크림 리조또', '리조또'], 'fe_432'],
  [['육회비빔밥', '육회 비빔밥'], 'fe_434'],
  [['토마토샐러드', '토마토 샐러드', '카프레제'], 'fe_444'],
  [['매운오징어무국', '매운 오징어무국', '오징어무국'], 'fe_474'],
  [['맑은소고기무국', '맑은 소고기무국', '소고기무국'], 'fe_476'],
  [['매운낙지전골', '매운 낙지전골', '낙지전골'], 'fe_479'],
  // 🍱🍱 2026-08-14 창업자 새 시트 3장(15컷) ＋ 「줬는데 안 넣었던」 8컷 → fe_261~fe_283
  //   ⭐ 앞 셋(꽃게탕·전찌개·대하소금구이)은 **레시피에 그림이 아예 없어 «도형»으로 나가던 자리**다.
  //      2026-08-14 전수조사에서 찾아 창업자에게 알렸고 그날 바로 뽑아 줬다.
  //   ⭐ 「찜닭」은 창업자가 «이미 줬는데 우리가 안 넣어서» 「순살찜닭」에 닭볶음탕 그림이 뜨던 자리다.
  //   ⛔ 「떡볶이」·「라면」 홑낱말엔 규칙을 «안» 준다 — 「국물 떡볶이」(fh_k27)처럼
  //      전용 그림이 이미 붙은 편을 내가 창업자 판정 없이 갈아치우면 안 된다(규칙 11). 픽커엔 올라간다.
  // 🍱🍱 2026-08-15 창업자 새 시트 4장(20컷) → fe_285~fe_304
  //   📮 창업자 *"맞는 그림이 아예 없는 5편 이건 또 뭐야? 다뽑아줬는데"* → **그 다섯이 여기 다 있다.**
  //   ⭐ 내가 「없다」고 적어둔 다섯(황태장아찌·고구마맛탕·고구마전·소고기솥밥·마늘쫑비빔밥)이
  //      이 시트 첫 장에 통째로 들어왔다. ＋고구마누룽지 보너스.
  //   ⭐⭐ **소스 아홉 종이 처음 생겼다** — 그동안 소스 레시피엔 붙는 그림이 없었다.
  //   ⛔ 여기 «위»에 둔다 — 아래 넓은 규칙(「국수」·「전」·「소스」)이 먼저 걸리면 새 컷이 묻힌다.
  [['고구마누룽지', '고구마 누룽지'], 'fe_285'],
  [['고구마맛탕', '고구마 맛탕', '맛탕'], 'fe_286'],
  [['고구마전', '고구마 전'], 'fe_287'],
  [['황태장아찌', '황태 장아찌'], 'fe_288'],
  [['마늘쫑비빔밥', '마늘쫑 비빔밥', '마늘종비빔밥'], 'fe_289'],
  [['소고기솥밥', '소고기 솥밥', '쇠고기솥밥'], 'fe_290'],
  [['분짜소스', '분짜 소스', '느억짬'], 'fe_291'],
  [['초무침소스', '초무침 소스', '초고추장무침'], 'fe_292'],
  [['파절이소스', '파절이 소스', '파무침소스'], 'fe_293'],
  [['코울슬로', '콜슬로', '양배추샐러드'], 'gr_004'],
  [['오징어감자전', '오징어 감자전'], 'fe_295'],
  [['콘샐러드', '콘 샐러드', '옥수수샐러드'], 'fe_408'],
  [['간장국수', '간장 국수', '간장비빔국수'], 'fe_297'],
  [['비빔국수', '비빔 국수', '고추장국수'], 'fe_298'],
  [['참깨소스', '참깨 소스', '고마다래'], 'fe_299'],
  [['겨자소스', '겨자 소스', '연겨자소스'], 'fe_300'],
  [['마요소스', '마요 소스', '마요네즈소스'], 'fe_301'],
  [['쯔유소스', '쯔유 소스', '쯔유'], 'fe_302'],
  [['데리야끼소스', '데리야끼 소스', '데리야키소스'], 'fe_303'],
  [['땅콩버터소스', '땅콩버터 소스', '땅콩소스'], 'fe_304'],
  // 🦀 [2026-08-18] 「꽃게찜」을 창업자 어머니 레시피 **「꽃게간장조림」**으로 갈아끼웠다.
  //    ⛔⛔ 넣기 «전»에 재보니 함정이 «둘» 있었다 —
  //       「꽃게간장조림」 → `fe_34`(장조림) · 「꽃게조림」 → `fe_66`(목살조림)
  //       「탕수육←수육」·「누룽지삼계탕←누룽지」와 **한 뿌리**다. 구체어를 위로 올려 푼다.
  //    ✅ **전용 컷이 그날 바로 왔다** — 창업자가 *"아 다시뽑아야 겠네 이건 그냥 찜이라서"* 하고
  //       몇 시간 만에 뽑아 보냈다(라벨 = 「양파가 위에 올라간 꽃게간장조림」). → `fe_306`
  [['꽃게간장조림', '꽃게 간장조림', '꽃게조림', '꽃게 조림'], 'fe_306'],
  [['꽃게찜'], 'fe_481'],
  // 🍚 [2026-08-18] 「나물비빔밥」이 «비빔밥»에 걸려 **돌솥비빔밥과 같은 컷**(fh_k01)이었다.
  //    창업자가 전용 컷을 뽑아줬다(라벨 = 「일반나물비빔밥」). ⛔1108줄 `[['돌솥비빔밥','비빔밥']]` 보다 «위»라야 한다.
  [['나물비빔밥', '나물 비빔밥'], 'fe_307'],
  // 🍱 [2026-08-18] 창업자 시트2 여섯 컷 (fe_308~313)
  //    ⛔ 「구체어 먼저」 — 아래 넓은 낱말보다 «위»라야 한다:
  //       「항정살간장조림」→「장조림」(fe_34) · 「닭고기데리야끼조림」→「조림」 ·
  //       「오이샌드위치」·「오픈샌드위치」→「샌드위치」 · 「백순대볶음」→「순대」·「볶음」
  [['항정살간장조림', '항정살 간장조림', '항정살조림'], 'gr_053'],
  [['닭고기데리야끼조림', '데리야끼조림', '닭데리야끼', '닭고기 데리야끼'], 'gr_054'],
  [['뼈없는양념돼지갈비구이', '양념돼지갈비구이', '뼈없는돼지갈비', '돼지갈비구이'], 'gr_108'],
  [['돼지갈비구이'], 'gr_074'],   // ⛔ 반드시 «뼈없는양념돼지갈비구이» 줄 아래 — 짧은 이름이 긴 이름을 먹는다
  [['오이샌드위치', '오이 샌드위치'], 'gr_072'],
  [['오픈샌드위치', '오픈 샌드위치'], 'gr_085'],
  [['백순대볶음', '백순대', '순대볶음'], 'gr_091'],
  // 🍲 2026-08-18 창업자 시트 3장 ＋ 단독 재판 (14컷)
  //    ⭐ **여기가 위쪽이라 아래 넓은 규칙보다 먼저 걸린다** — 「구체어 먼저」(v10.89 사고).
  //       안 그러면 「들기름 두부전골」이 1042줄 「전골」에, 「원팬 크림 파스타」가 1119줄 「크림 파스타」에,
  //       「얼큰 샤브 칼국수」가 1153줄 「칼국수」에, 「뚝배기 파스타」가 1166줄 「파스타」에 먼저 먹힌다.
  //    ⛔ 창업자가 «지목한 것»만 넣는다 — 「등촌샤브칼국수」·「산더미불고기」 같은 옛 이름은 안 넓힌다.
  [['대파듬뿍소불고기전골', '대파듬뿍 소불고기전골', '대파듬뿍불고기전골', '대파듬뿍 불고기전골'], 'fe_314'],
  [['뚝딱버섯볶음밥', '뚝딱 버섯 볶음밥', '버섯볶음밥', '버섯 볶음밥'], 'fe_315'],
  [['냉이듬뿍된장찌개', '냉이된장찌개', '냉이 된장찌개'], 'fe_316'],
  [['팽이버섯베이컨전', '팽이버섯 베이컨전', '팽이버섯베이컨', '베이컨전'], 'gr_107'],
  [['들기름두부전골', '들기름 두부전골'], 'fe_318'],
  // 🍱 [2026-08-19] 창업자 새 아이콘 60컷 — ⛔여기(위쪽)에 둬야 아래 넓은 규칙(「국」·「조림」·「볶음」)보다 먼저 걸린다

  // 🥩 갈비 둘 — ⛔순서가 중요하다. 「갈비조림」이 위에 있으면 「초간단 순살 갈비찜」이 안 걸린다
  [['갈비살조림', '간편갈비조림', '갈비조림'], 'fe_328'],
  [['뼈없는순살갈비조림', '초간단순살갈비찜', '초간단 순살 갈비찜', '순살갈비찜'], 'fe_319'],
  [['얼큰샤브칼국수', '얼큰 샤브 칼국수', '샤브칼국수', '샤브 칼국수'], 'fe_401'],
  [['원팬크림파스타', '원팬 크림 파스타'], 'fe_435'],
  [['양지수육', '양지 수육'], 'fe_322'],
  [['항정수육', '항정살수육', '항정 수육'], 'fe_323'],
  [['항정삼합', '항정살삼합', '항정 삼합'], 'fe_324'],
  [['묵은지볶음', '묵은지 볶음'], 'fe_325'],
  [['고등어묵은지조림', '고등어 묵은지조림'], 'fe_326'],
  [['뚝배기파스타', '뚝배기 파스타'], 'fe_436'],
  [['꽃게탕', '꽃게찌개'], 'fe_261'],
  [['전찌개', '전골찌개'], 'fe_262'],
  [['대하소금구이', '대하구이', '새우소금구이'], 'fe_263'],
  [['무화과그릭요거트', '무화과 그릭요거트', '무화과요거트'], 'fe_264'],
  [['얼큰라면', '매운라면'], 'fe_265'],
  [['잠봉뵈르샌드위치', '잠봉뵈르', '잠봉뷔르'], 'fe_437'],
  [['아보카도샌드위치', '아보카도 샌드위치'], 'fe_438'],
  [['몽골리안비프', '몽골리안 비프'], 'gr_092'],
  [['수박주스', '수박스무디', '수박에이드'], 'gr_087'],
  [['치킨레터스랩', '치킨 레터스랩', '레터스랩', '상추쌈치킨'], 'fe_270'],
  [['사과연근샐러드', '연근사과샐러드', '연근사과무침'], 'fe_271'],
  [['치킨샐러드', '닭가슴살샐러드'], 'fe_409'],
  [['아보카도샐러드', '아보카도 샐러드'], 'fe_410'],
  [['봄동겉절이', '봄동무침', '봄동'], 'fe_274'],
  [['무화과샌드위치', '무화과 샌드위치'], 'fe_427'],
  [['소바', '메밀소바', '자루소바'], 'fe_396'],
  [['분짜'], 'gr_033'],
  // ⛔ 「오이물김치」는 규칙을 «안» 준다 — 이미 fe_112 가 잘 붙어 있고 둘 다 오이물김치 그림이라
  //    내가 창업자 판정 없이 갈아치울 이유가 없다(규칙 11). 픽커엔 올라가니 골라 쓸 수 있다.
  [['순살찜닭', '찜닭', '안동찜닭'], 'fe_283'],
  // 🍱🍱 2026-08-12 창업자 새 시트 10장 → 57컷 (fe_204~fe_260). **구체 요리명이라 맨 위에 둔다.**
  //   ⭐ 여기 있는 것은 «겹치지 않는» 자리다. 전용 그림이 이미 있던 열넷
  //      (육개장 fe_28 · 카레라이스 fe_16 · 두부조림 fe_140 · 쌀국수 fe_54 · 깍두기 fe_130 ·
  //       오이무침 fe_36 · 계란말이 fh_k17 · 계란찜 fe_154 ＋ 소스·양념 모둠 여섯) 은
  //      **일부러 규칙을 안 줬다** — 내가 창업자 판정 없이 그림을 갈아치우면 안 된다(규칙 11).
  //      픽커에는 올라가 있으니 창업자가 골라 쓸 수 있고, 「이걸로 바꿔」 하면 그때 규칙을 준다.
  //   ⚠️ **긴 이름이 짧은 이름보다 «먼저»** — 「얼큰소고기무국」이 「소고기무국」 위에 있어야 한다.
  //      `guessFoodIcon` 은 «처음 걸리는 규칙»을 쓰므로 순서가 곧 우선순위다.
  [['골뱅이소면무침', '골뱅이소면', '골뱅이무침'], 'fe_397'],
  [['삼치조림'], 'gr_093'],
  [['삼치구이', '삼치'], 'gr_075'],
  [['갈치조림'], 'fe_207'],
  [['갈치구이', '갈치'], 'fe_208'],
  [['가자미구이', '가자미'], 'gr_076'],
  [['계란국', '달걀국'], 'fe_482'],
  [['미소된장국'], 'fe_483'],
  [['냉이된장찌개'], 'fe_213'],
  [['냉이된장국', '냉이국'], 'fe_485'],
  [['오징어국', '오징어무국'], 'fe_215'],
  [['전복미역국'], 'fe_475'],
  // ⛔ '냉모밀우동' 은 «뺐다» — 모밀(메밀)과 우동은 다른 면이다. 그림은 우동이다.
  [['냉우동'], 'fe_398'],
  // ⛔ '볶음우동' 은 «뺐다» — `fe_155` 가 이미 「볶음우동」 전용 그림이라 빼앗는다(2026-08-12 검사가 잡았다).
  [['해물볶음우동', '해물우동'], 'fe_399'],
  [['얼큰소고기무국', '얼큰소고기국', '매운소고기무국'], 'fe_478'],
  [['소고기무국', '쇠고기무국', '소고기뭇국'], 'fe_220'],
  [['김치콩나물국', '콩나물김치국'], 'fe_477'],
  [['고추장진미채', '진미채볶음', '진미채'], 'fe_411'],
  [['메추리알장조림', '메추리알조림', '메추리알'], 'gr_094'],
  [['애호박새우젓볶음', '애호박볶음', '애호박'], 'fe_224'],
  [['묵무침'], 'fe_412'],
  [['소세지야채볶음', '소시지야채볶음'], 'fe_421'],
  [['총각김치', '알타리김치'], 'fe_413'],
  [['유부초밥'], 'fe_229'],
  [['시금치무침', '시금치나물'], 'gr_042'],
  // ⛔ '열무물김치' 는 «뺐다» — `fe_111` 이 이미 그 전용 그림이다.
  [['열무김치'], 'gr_043'],
  [['파김치'], 'gr_044'],
  [['해물찜', '아구찜', '아귀찜'], 'fe_423'],
  [['감자볶음', '감자채볶음'], 'fe_424'],
  [['멸치조림', '멸치볶음'], 'fe_425'],
  [['오이지무침', '오이지'], 'gr_045'],
  [['콘치즈', '콘치즈구이'], 'gr_047'],
  [['브라우니'], 'gr_088'],
  [['수박화채', '화채'], 'gr_089'],
  [['무스비', '스팸무스비', '스팸마요무스비'], 'fe_486'],
  [['버터명란구이', '명란버터구이', '명란구이'], 'gr_077'],
  [['두부김치'], 'fe_248'],
  [['바삭황태채', '황태채튀김', '황태채'], 'gr_078'],
  [['알배추전', '배추전'], 'fe_393'],
  // 🍗 창업자 확정 2026-08-12 — 「지코바치킨」→「양념치킨」.
  //   ⛔ 지코바는 «실제 치킨 프랜차이즈 상표»다. 우리가 상표를 출원한 마당에 남의 브랜드명을
  //      아이콘 이름으로 쓰지 않는다. 별칭으로도 안 남긴다(그러면 바꾼 뜻이 없다).
  //   ⭐ '양념치킨' 은 `fh_k20` 이 갖고 있던 말인데 «그림을 보고» 제자리로 돌렸다 —
  //      fh_k20 은 «떡이 들어간 닭강정»이고 이 컷은 «떡 없는 닭»이다. fh_k20 은 '닭강정' 을 그대로 갖는다.
  [['양념치킨'], 'fe_251'],
  [['오이탕탕이', '오이탕탕', '탕탕이'], 'gr_038'],
  [['부추무침', '부추겉절이'], 'gr_039'],
  [['파절이', '파무침'], 'fe_258'],
  // 🍱🍱 2026-08-11 창업자 새 시트 8장 → 48컷. **구체 요리명이라 맨 위에 둔다.**
  //   ⭐ 여기 있는 것은 «겹치지 않는» 자리다. 이미 전용 그림이 있던 넷
  //      (갈비찜 `fe_171`·`fe_184` · 샐러드소스 `fe_175` · 양념게장 `fe_200` · 황태무침 `fe_201`) 은
  //      **일부러 규칙을 안 줬다** — 내가 창업자 판정 없이 그림을 갈아치우면 안 된다(규칙 11).
  //      픽커에는 올라가 있으니 창업자가 골라 쓸 수 있고, 「이걸로 바꿔」 하면 그때 규칙을 준다.
  [['버섯들깨무침', '버섯들깨'], 'fe_156'],
  [['감자전'], 'gr_099'],
  [['낙지볶음'], 'fe_426'],
  [['낙지전골', '해물전골'], 'fe_159'],
  [['오징어조림'], 'fe_160'],
  [['깻잎찜'], 'fe_161'],
  // ⛔⛔ 띄어쓴 꼴을 «반드시 같이» 넣는다 — `guessFoodIcon` 은 `제목.includes(낱말)` 이라
  //    띄어쓰기를 «안 뗀다». 「브로콜리 구이」에 「브로콜리구이」는 **안 걸린다.**
  //    2026-08-11 에 새 컷을 넣고도 세 편(브로콜리 구이·오징어 새우전·굴 매생이 떡국)이
  //    그대로 옛 그림이었다 — 검사가 잡았다.
  //    📌 낱말 «안»에 띄어쓰기가 들어가는 제목이면 그 꼴도 같이 적을 것.
  //    ⛔ `guessFoodIcon` 에서 공백을 통째로 떼는 방식은 안 썼다 — 기존 76편엔 회귀가 0이지만
  //       「감자 전골」이 「감자전」에 걸리는 식으로 «유저가 친 제목»에서 넓게 먹을 수 있다.
  [['브로콜리구이', '브로콜리 구이', '브로콜리볶음', '브로콜리 볶음'], 'fe_162'],
  [['오징어새우전', '오징어 새우전', '오징어새우', '해물전'], 'fe_390'],
  [['소세지볶음', '소시지볶음'], 'fe_164'],
  [['피클'], 'fe_165'],
  [['콩나물국밥'], 'fe_468'],
  [['묵밥'], 'fe_487'],
  [['뚝배기파스타'], 'fe_168'],
  [['미나리볶음밥'], 'fe_488'],
  [['참치야채덮밥', '참치덮밥'], 'fe_489'],
  [['삼겹살볶음', '대패삼겹볶음'], 'fe_172'],
  [['소고기구이', '소고기스테이크'], 'gr_100'],
  [['간장양념장'], 'fe_174'],
  [['찰밥', '약밥'], 'fe_490'],
  [['양배추볶음'], 'fe_177'],
  [['데리야키장어덮밥', '장어덮밥'], 'fe_178'],
  [['해파리냉채', '냉채'], 'fe_179'],
  [['목살스테이크'], 'gr_101'],
  [['가지볶음'], 'fe_181'],
  [['가지덮밥'], 'fe_182'],
  [['굴매생이떡국', '굴 매생이 떡국', '굴 매생이떡국', '매생이떡국', '매생이 떡국', '굴떡국'], 'fe_472'],
  [['매운양념장', '고추장양념장', '초고추장'], 'fe_185'],
  [['딸기라떼', '딸기우유'], 'gr_090'],
  [['매운콩나물국밥'], 'fe_469'],
  [['봉골레'], 'fe_188'],
  [['매콤콩나물덮밥', '매운콩나물덮밥', '콩나물덮밥'], 'fe_491'],
  // 🇹🇭 창업자 정정 2026-08-12 — *"느어 픽타이담이야. 이름 이상하게 되어있더라. 바꿔줘."*
  //   ⛔⛔ **「느어팟프릭타이담」은 내가 지어낸 말이었다.** 시트에 인쇄된 라벨은
  //      「태국식 소고기 후추 야채볶음」뿐이었는데, 거기에 내 «지식»으로 태국어 표기를 만들어 붙였다.
  //      📌 **창업자가 준 자료에 없는 말을 넣지 않는다** — 틀려도 아무 검사에 안 걸리고, 창업자만 알아본다.
  //   ⚠️ 띄어쓴 꼴을 «반드시 같이» 넣는다 — `guessFoodIcon` 은 `제목.includes(낱말)` 이라 공백을 안 뗀다.
  [['느어픽타이담', '느어 픽타이담', '후추소고기볶음', '태국식소고기'], 'gr_035'],
  [['매운콩나물불고기', '콩나물불고기'], 'fe_191'],
  [['마늘쫑볶음', '마늘종볶음'], 'gr_005'],
  [['마늘쫑장아찌', '마늘종장아찌'], 'fe_193'],
  [['깻잎장아찌'], 'fe_194'],
  [['마약계란장', '계란장', '달걀장'], 'fe_195'],
  [['구움찰떡', '인절미구이'], 'gr_007'],
  [['간장불고기'], 'gr_006'],
  [['삼겹살구이'], 'gr_102'],
  [['닭봉구이', '닭봉', '윙구이'], 'gr_073'],
  [['충무김밥'], 'gr_063'],
  [['묵은지볶음', '묵은지들기름볶음'], 'fe_203'],
  // 🍱🍱 2026-08-05 창업자 시트 6장 → 16컷. **구체 요리명이라 맨 위에 둔다.**
  //   ⚠️⚠️ 여기 있는 것 중 다섯은 «이미 다른 그림이 먹고 있던» 자리다 — 그 규칙에서 낱말을 빼 왔다:
  //      「계란찜」→`fh_k17`(**계란말이 그림**이었다 🐛) · 「두부간장조림」→`fe_35`(**고추장 매운 두부조림**이었다)
  //      「꼬막·바지락」→`clam`(재료 도형) · 「샤브」→`pot`(냄비 도형) · 「우동」→`fi_j02`(국물 우동)
  //   📌 낱말을 «가져오지» 않고 위에만 얹으면, 아래 규칙이 살아 있어도 여기서 먼저 걸린다.
  //      ⛔ 단 「계란찜」·「두부간장조림」은 아래 규칙에서 **빼야** 한다 — 그건 그림이 «틀린» 것이라 남겨두면 또 걸린다.
  [['간장두부조림', '두부간장조림', '두부조림'], 'gr_055'],
  [['닭곰탕'], 'fe_141'],
  [['양념장', '양념류', '만능간장', '만능양념', '양념만들기'], 'fe_142'],
  [['들깨나물무침', '들깨나물', '들깨무침'], 'fe_143'],
  [['해물볶음', '해산물볶음', '해물간장볶음'], 'fe_144'],
  [['콩나물무침', '매운콩나물무침', '콩나물잡채'], 'fe_145'],
  [['꼬막무침', '꼬막양념무침'], 'fe_146'],
  [['황태채무침', '황태무침', '북어채무침', '북어무침'], 'fe_147'],
  [['황태국', '북어국', '황태해장국', '북어해장국', '황태미역국'], 'fe_148'],
  [['샐러드드레싱', '드레싱'], 'fe_149'],
  [['김치찜'], 'fe_150'],                                    // ⛔「김치찌개」(fh_k02)와 안 겹치게 이 말만
  [['바지락국', '바지락탕', '조개탕', '조개국', '바지락칼국수육수'], 'fe_470'],
  [['샤브샤브', '샤부샤부', '밀푀유나베'], 'fe_471'],
  [['매콤새우장', '매운새우장', '양념새우장'], 'fe_153'],       // 간장새우장은 fe_77 그대로
  [['계란찜', '달걀찜'], 'fe_154'],                            // 🐛 여태 계란말이(fh_k17)가 먹고 있었다
  [['볶음우동', '야끼우동', '우동볶음'], 'fe_400'],             // 국물 우동은 fi_j02 그대로
  // 🍱🍱 2026-08-01 창업자 새 시트 37컷 — **전부 구체 요리명이라 맨 위에 둔다.**
  //   ⚠️ 아래에 있으면 범용 규칙에 먼저 먹힌다. 실제로 그러고 있었다:
  //      「탕수육」→`fried`(튀김 도형) · 「무생채」→`radish`(무 도형) · 「스튜」→`stew` · 「소스」→`jar`
  //      「깍두기」→배추김치 · 「김치전」→파전 · 「두루치기」→제육
  //      = **진짜 그림이 있는데 도형이나 딴 요리가 붙고 있었다.**
  [['콩나물밥', '콩나물비빔밥'], 'fe_97'],
  [['오야꼬동', '오야코동', '닭계란덮밥'], 'fe_493'],
  [['꼬막비빔밥', '꼬막밥', '꼬막무침밥'], 'fe_99'],
  [['돼지갈비', '돼지 갈비', '생갈비'], 'fe_100'],
  [['마늘갈비살', '갈비살', '마늘등갈비'], 'fe_389'],
  [['달래양념장', '달래장', '양념장', '만능간장'], 'fe_102'],
  [['야키니쿠', '야끼니꾸'], 'fe_103'],
  [['우엉조림', '우엉볶음', '우엉'], 'fe_104'],
  [['연근조림', '연근볶음'], 'fe_105'],
  [['부타노가쿠니', '부타카쿠니', '돼지고기조림'], 'gr_031'],
  [['육전'], 'fe_107'],
  [['무생채', '무채', '무김치', '열무김치'], 'fe_108'],
  [['회덮밥', '회비빔밥'], 'fe_109'],
  [['레터스랩', '쌈채소', '상추쌈', '쌈밥상'], 'fe_110'],
  [['열무물김치', '열무국물김치'], 'fe_111'],
  [['오이물김치', '오이지'], 'gr_095'],
  [['나박물김치', '나박김치'], 'gr_096'],
  // ⛔⛔ **「구체어 먼저」** — 창업자 제보 2026-08-18 *"누룽지 삼계탕에 이모지같은게 들어있어"* 를 파다 나왔다.
  //    「누룽지삼계탕」이 아래 «누룽지»(`fe_114` 오징어누룽지)에 먼저 먹혀 **엉뚱한 그림**이 붙고 있었다.
  //    📌 2026-08-15 「탕수육이 수육에 먹힌 것」과 **같은 자리**다 — 짧은 낱말이 긴 이름을 삼킨다.
  //    ⭐ 삼계탕 규칙(`fh_k06`)은 한참 아래(1100줄대)라 여기서 먼저 잡아야 한다.
  //    🔒 `check-foodtab` ⑦ 이 이 순서가 뒤집히면 배포를 막는다.
  [['누룽지삼계탕', '누룽지 삼계탕', '누룽지백숙', '누룽지 백숙'], 'fh_k06'],
  [['누룽지탕', '누룽지', '눌은밥'], 'fe_114'],
  [['나시고랭', '나시고랑', '인도네시아볶음밥'], 'fe_115'],
  [['연근샐러드', '연근무침'], 'fe_116'],
  [['매운오징어볶음', '오징어짬뽕볶음'], 'fe_415'],
  [['간장오징어볶음', '간장오징어'], 'fe_416'],
  [['해물전', '해물파전', '해산물전'], 'fe_119'],
  [['오이소박이', '오이김치'], 'gr_079'],
  [['스키야키', '스끼야끼'], 'fe_121'],
  [['굴당면', '굴잡채'], 'fe_122'],
  [['굴떡국', '굴국'], 'fe_123'],
  [['궁채나물', '궁채', '줄기상추'], 'gr_080'],
  // 🐛🐛 [2026-08-15] 「탕수육」이 «바로 아래» 「수육」에 먹히고 있었다 — 창업자 *"탕수육 1줄은 고치자"*
  //   「탕수**육**」 안에 「수육」이 들어 있어서, 위에서부터 훑는 규칙이 여기서 멈추고
  //   **수육(보쌈 고기) 그림 `fe_125`** 를 돌려줬다. 진짜 탕수육 그림 `fe_91` 은 10줄 아래라 영영 못 갔다.
  //   ⛔⛔ **같은 자리를 두 번 밟았다** — 그 아래 주석에 *"탕수육은 아래 `fried` 규칙에 먼저 먹히고 있었다"*
  //      고 적혀 있다. 그때 «아래»만 보고 고쳤고 **바로 위의 「수육」은 못 봤다.**
  //   📌 원칙은 이미 있었다 — *"최상단 = 더 구체적이라 반드시 먼저 잡아야 하는 것"*(구체어 먼저).
  //      🔒 그래서 이번엔 규칙이 아니라 **게이트로 막는다** → `check-foodtab.mjs` ⑦
  //   ⚠️ 「찹쌀탕수육」은 «꿔바로우»(fe_47)가 맞다 — 「탕수육」보다 더 구체적이라 반드시 «위»에 둔다.
  //      (옛 판에서는 이것도 「수육」에 먹혀 보쌈 고기가 떴다)
  [['꿔바로우', '꿔바로', '궈바로우', '찹쌀탕수육'], 'fe_47'],
  [['탕수육'], 'fe_91'],
  [['수육', '보쌈수육', '편육'], 'fe_125'],
  [['무생채채썬것안씀'], 'fe_126'],  // ⛔그림이 볶음면이라 픽커에서 내림 · 규칙도 안 걸리게
  [['스튜', '비프스튜', '크림스튜'], 'fe_429'],
  [['소스', '디핑소스'], 'fe_128'],
  [['두루치기'], 'fe_129'],
  [['김치전', '김치부침개'], 'gr_097'],
  [['전복죽', '전복영양죽'], 'gr_002'],
  [['된장찌개', '된장국', '강된장'], 'fe_133'],
  // 🐛 「탕수육」은 진짜 그림(`fe_91`)이 있는데 아래 `fried`(튀김 도형) 규칙에 먼저 먹히고 있었다.
  //    ⛔ 2026-08-15: 이 자리로는 **못 온다** — 위 「수육」이 먼저 잡는다. 규칙을 그 «위»로 옮겼다.
  // ⚠️ 최상단 = "더 구체적이라 반드시 먼저 잡아야 하는 것"만. (2026-07-28)
  //    전복솥밥은 아래 '솥밥'(fe_04)에, 비빔국수는 '비빔면'(fe_18)에 먼저 걸려버려서 여기로 올림.
  [['전복솥밥', '전복밥', '전복영양밥'], 'gr_001'],
  // ── 🍳 2026-08-02 창업자 시트 6컷 — 8월 주간 레시피용. 전부 «범용 규칙보다 먼저» 잡아야 한다
  //    (안 그러면 훈제오리 깻잎볶음이 아래 '볶음'(fe_64)에, 오징어숙회가 '회'(fe_72)에 먼저 걸린다).
  [['훈제오리깻잎볶음', '훈제오리 깻잎볶음', '훈제오리볶음', '훈제오리'], 'fe_134'],
  [['토마토달걀볶음', '토마토계란볶음', '토마토달걀', '토마토계란'], 'fe_135'],
  [['오징어숙회', '숙회'], 'fe_136'],
  [['깻잎전'], 'fe_137'],
  [['야채볶음', '채소볶음', '모듬채소볶음', '모듬야채볶음'], 'gr_051'],
  [['브로콜리볶음'], 'gr_052'],
  // ── 🍱 예시 보충 세트(2026-07-24·창업자 생성) — 특정 요리 전용. 맨 위(생선·아보카도 등 광범위 규칙보다 먼저). ──
  [['참치마요덮밥', '참치마요'], 'fe_01'],
  [['명란아보카도덮밥', '명란아보카도', '명란 아보카도'], 'fe_02'],
  [['간장버터달걀밥', '간장버터 달걀밥', '버터달걀밥', '달걀밥', '계란밥'], 'fe_03'],
  [['버섯솥밥', '버섯 솥밥', '영양솥밥', '솥밥'], 'fe_04'],
  [['비프페퍼라이스', '페퍼라이스', '페퍼런치'], 'fe_05'],
  [['야채포케', '야채 포케', '채소포케', '베지포케'], 'fe_07'],
  [['포케볼', '포케 볼', '포케'], 'fe_06'],
  [['감바스'], 'fe_414'],
  [['팟타이', '팟타이면', '패드타이'], 'gr_036'],
  // 🌏 태국·베트남 9종 (2026-07-26 창업자 제공, item④) — 구체 요리명이라 국수·샐러드 등 범용 규칙보다 먼저.
  [['뿌팟퐁커리', '뿌팟퐁', '푸팟퐁커리', '게살커리', '크랩커리', '게커리'], 'gr_025'],
  [['월남쌈', '월남 쌈', '라이스페이퍼', '고이꾸온', '생춘권', '라이스페이퍼롤'], 'gr_026'],
  [['분보싸오', '분보사오', '분보싸우', '분보'], 'gr_027'],
  [['스프링롤', '스프링 롤', '짜조', '베트남춘권', '월남튀김만두', '프라이드스프링롤'], 'gr_028'],
  [['쏨땀', '쏨탐', '파파야샐러드', '그린파파야샐러드', '쏨땀무'], 'fe_60'],
  [['반미', '바인미', '반미샌드위치', '베트남샌드위치'], 'gr_061'],
  [['반쎄오', '바인쎄오', '반세오', '베트남부침개', '반쌔오'], 'gr_062'],
  [['불고기'], 'fe_10'],
  [['상추겉절이', '상추 겉절이'], 'fe_11'],
  [['공심채'], 'fe_12'],
  [['버섯전골', '두부전골', '들깨버섯', '버섯 전골', '전골'], 'fe_13'],
  [['묵채', '묵무침', '도토리묵'], 'fe_14'],
  [['스무디'], 'fe_15'],
  // ── 🍱 예시 보충 2차(2026-07-24·창업자 생성) — 앱에 없던 요리 6종. 범용/한식 규칙보다 먼저. ──
  [['크루키', '크로키', '크룩키'], 'fe_17'],
  [['불닭냉면', '불닭비빔면', '비빔냉면', '비빔국수', '비빔면'], 'fe_18'],
  [['요거트아이스크림', '요거트 아이스크림', '프로즌요거트', '요거트파르페', '요거트 파르페', '그릭요거트', '요거트볼'], 'fe_19'],
  [['김치볶음밥', '김볶'], 'fe_20'],
  [['참치김치감태주먹밥', '감태주먹밥', '참치김치주먹밥', '주먹밥'], 'fe_480'],
  // 예시 보충 3차 — 생고기(대구뭉티기·육회). '소고기/고기' 범용보다 먼저.
  [['대구뭉티기', '뭉티기', '뭉티기회'], 'fe_22'],
  [['육회', '육깻무', '육회깻잎', '육사시미', '육사'], 'gr_082'],
  // 예시 보충 4차 — 파스타·볶음·샌드위치. '파스타=스파게티' 같은 뜻으로 함께 묶음. 범용 파스타(fy_y03)보다 먼저.
  [['새우크림파스타', '새우크림스파게티', '새우 크림 파스타', '새우로제', '갈릭새우파스타'], 'fe_430'],
  [['로제파스타', '로제스파게티', '로제 파스타', '로제크림파스타'], 'fe_431'],
  [['양배추돼지고기볶음', '양배추돼지고기', '양배추제육', '양배추 돼지'], 'fe_420'],
  [['치즈샌드위치', '치즈 샌드위치', '햄치즈샌드위치'], 'fe_450'],
  // ── 🍱 예시 보충 5차(2026-07-24·빈칸 리스트 24종) — 범용/한식 규칙보다 먼저. ──
  [['감자탕', '뼈해장국', '뼈다귀해장국', '감자탕전골'], 'fe_29'],
  [['순댓국', '순대국', '순대국밥'], 'fe_30'], // '순대'(단독)는 fh_k31 유지
  [['알탕'], 'fe_31'],
  [['오징어덮밥', '낙지덮밥', '주꾸미덮밥', '쭈꾸미덮밥'], 'fe_32'],
  [['오징어볶음', '오징어채볶음', '낙지볶음', '주꾸미볶음', '쭈꾸미볶음'], 'fe_75'],
  [['장조림', '메추리알장조림', '계란장조림', '깻잎장조림'], 'fe_34'],
  // ⛔ 「두부조림·두부간장조림」을 뺐다 — 이 그림은 «고추장 매운» 두부조림이다. 간장 조림은 fe_140(2026-08-05)
  [['매운두부조림', '두부고추장조림'], 'fe_35'],
  [['오이무침', '오이초무침', '오이생채'], 'fe_36'], // '오이'(단독)는 cucumber 유지
  [['잔치국수'], 'fe_37'],
  [['콩국수'], 'fe_38'],
  [['붕어빵', '잉어빵', '국화빵'], 'fe_39'],
  [['호떡'], 'gr_012'],
  [['와플', '크로플', '와플러'], 'gr_013'],
  [['리조또', '리조토', '리소토'], 'fe_42'],
  [['알리오올리오', '알리오 올리오', '알리오', '오일파스타', '오일 파스타'], 'fe_451'],
  [['브런치', '브런치플레이트', '브런치 플레이트', '아침플레이트'], 'fe_455'],
  [['가라아게', '치킨가라아게', '닭가라아게', '가라아게동'], 'gr_032'],
  [['규동', '소고기덮밥', '규니쿠동'], 'fe_46'],
  [['꿔바로우', '꿔바로', '궈바로우', '찹쌀탕수육'], 'fe_47'],
  [['생크림케이크', '딸기케이크', '조각케이크', '생일케이크', '케이크'], 'fe_85'],  // fe_48 과 겹쳐 fe_85 하나로
  [['티라미수'], 'gr_010'],
  [['팥빙수', '빙수', '눈꽃빙수', '인절미빙수'], 'gr_011'],
  [['도넛', '도너츠', '도나쓰'], 'fe_51'],
  // ── 🍱 예시 보충 7차(2026-07-28·32종) — 창업자 제보 "가지덮밥·목살조림·치킨·전복·묵은지볶음 인식 안 됨" 대응.
  //    ⚠️ 여기엔 '구체 요리'만. 범용 조리법(덮밥·조림·볶음·무침·국)은 맨 아래 조리법 구역에 둔다
  //    (범용이 위에 있으면 "오징어덮밥" 같은 구체 규칙이 영영 안 걸린다).
  [['전복', '전복찜', '전복버터구이', '전복구이', '전복죽'], 'fe_68'], // ※'전복솥밥'은 더 위(최상단)에서 fe_74로 먼저 잡는다
  [['고추장장아찌', '매운장아찌', '고추장아찌'], 'fe_405'],
  [['간장장아찌', '장아찌', '마늘종장아찌', '양파장아찌', '깻잎장아찌'], 'fe_404'],
  [['오징어볶음', '오징어채볶음'], 'fe_75'], // fe_33(기존)보다 얼굴 있는 새 버전 우선
  // ⭐ 「양념게장」은 «먼저» 매운 컷으로 — 한 줄에 묶어 두니 둘 다 간장게장 그림이 붙었다(2026-08-14 전수조사)
  [['양념게장'], 'fe_200'],
  [['간장게장', '게장'], 'fe_76'],
  [['새우장', '간장새우'], 'fe_77'],
  [['연어장', '연어덮밥'], 'fe_406'],
  [['LA갈비', 'la갈비', '엘에이갈비', '소갈비구이', '갈비구이'], 'gr_098'],
  [['닭갈비', '치즈닭갈비'], 'fe_70'],
  [['솥밥', '영양솥밥', '버섯솥밥', '가마솥밥'], 'fe_67'],
  [['치킨', '후라이드', '프라이드치킨', '순살치킨', '통닭', '깐풍치킨'], 'fe_65'],
  [['회', '사시미', '모둠회', '광어회', '연어회'], 'fe_433'],
  [['파니니', '파니뇨', '그릴샌드위치'], 'fe_454'],
  [['맑은국', '두부국', '뭇국', '북엇국', '콩나물국'], 'fe_79'],
  [['얼큰한국', '칼칼한국', '얼큰이', '해장국'], 'fe_80'],
  [['모닝빵', '식빵', '바게트', '식사빵'], 'fe_82'],
  [['소보로', '단팥빵', '소시지빵', '간식빵', '크림빵'], 'fe_83'],
  [['쿠키', '비스킷', '초코칩쿠키'], 'fe_84'],
  [['브런치', '브런치플레이트', '브런치 플레이트', '아침플레이트'], 'fe_86'], // fe_44 대체(플레이팅 더 풍성)
  [['피자', '화덕피자', '페퍼로니피자'], 'fe_456'],
  [['빠에야', '파에야', '해물빠에야'], 'fe_445'],
  [['자장면', '짜장면', '간짜장'], 'fe_90'],
  [['군만두', '야끼교자', '교자'], 'fj_jsk15'],   // ⚠️구체어 먼저 — 아래 '만두'에 먹히면 안 된다
  [['만두', '물만두', '찐만두', '왕만두'], 'gr_066'],
  [['쉐이크', '셰이크', '스무디', '밀크쉐이크'], 'gr_014'],
  [['과일주스', '오렌지주스', '생과일주스', '주스', '에이드'], 'gr_015'],
  // 예시 보충 6차 — 묵은지/김치 파스타, 베이컨 크림파스타(얼굴 있는 새 버전). 범용 파스타(fy_y03)보다 먼저.
  [['묵은지파스타', '묵은지 파스타', '묵은지들기름파스타', '묵은지 들기름 파스타', '김치파스타', '김치 파스타', '김치스파게티'], 'fe_452'],
  [['베이컨크림파스타', '베이컨 크림 파스타', '베이컨크림스파게티', '까르보나라', '카르보나라', '카보나라', '크림파스타', '크림 파스타'], 'fe_453'],
  // ── 🍚 한식 완성요리 PNG(진짜 음식같은 아이콘) — 제목에 뜨면 자동. SVG보다 먼저, 구체어 우선. ──
  [['돌솥비빔밥', '비빔밥'], 'gr_048'],
  [['김치찌개'], 'fh_k02'],
  [['된장찌개', '된장국', '강된장'], 'fh_k03'],
  [['순두부'], 'fh_k04'],
  [['미역국'], 'fh_k05'],
  [['삼계탕', '백숙'], 'fh_k06'],
  [['부대찌개'], 'fh_k07'],
  [['떡국'], 'fh_k08'],
  [['만둣국'], 'fe_473'],
  [['갈비탕', '설렁탕', '곰탕', '도가니탕'], 'fh_k10'],
  [['갈비찜'], 'fh_k11'],
  [['찜닭', '닭볶음탕', '닭도리탕'], 'fe_419'],
  [['제육볶음', '제육', '두루치기'], 'fh_k13'],
  [['삼겹살', '오겹살', '목살구이'], 'fh_k14'],
  [['잡채'], 'gr_104'],
  // ⛔ 「계란찜」을 뺐다 — 이 그림은 «계란말이»다. 여태 계란찜 제목에 계란말이가 붙고 있었다(2026-08-05)
  [['고등어조림', '갈치조림', '생선조림', '고등어무조림', '코다리조림'], 'fh_k19'],
  // ⛔⛔ **요리 이름과 «재료 이름»을 한 규칙에 섞지 않는다** (2026-08-14 창업자 *"두부참치찌개에 왜 고등어구이가 들어가있는지 의문"*)
  //    전엔 여기에 「참치·명태·대구…」가 같이 있어서 **「두부참치찌개」가 이 줄에 먼저 걸려 생선구이 그림**이 붙었다.
  //    ⭐ 재료 낱말은 아래 `fish`(재료 도형) 줄이 이미 받고 있다 — 거기 있는 걸 여기 또 두면 «구이»로 끌려온다.
  //    ✅ 그래서 이 줄엔 **「구이」로 읽히는 생선 이름만** 남긴다.
  [['생선구이', '고등어구이', '갈치구이', '삼치구이', '조기구이', '임연수구이', '꽁치구이', '가자미구이', '생선'], 'fh_k18'],
  // ⛔ '양념치킨' 을 «뗐다» — 이 그림엔 떡이 들어 있어 닭강정이다. 양념치킨은 `fe_251`(떡 없는 닭).
  [['닭강정'], 'fe_391'],
  [['동그랑땡', '완자전', '고기전'], 'fe_392'],
  [['김밥'], 'fh_k22'],
  [['라볶이'], 'gr_065'],
  [['물냉면'], 'fe_394'],
  [['냉면', '비빔냉면', '막국수', '메밀국수'], 'fh_k25'],
  [['칼국수'], 'fh_k26'],
  [['짜장', '간짜장'], 'fe_90'],
  [['파전', '부침개', '지짐', '호박전', '김치전'], 'fh_k29'],
  [['순대'], 'gr_064'],
  [['배추김치', '포기김치', '겉절이', '깍두기'], 'gr_081'],
  [['시금치'], 'fh_k33'],
  [['어묵볶음'], 'fh_k34'],
  [['콩나물'], 'fh_k35'],
  [['전복죽', '호박죽', '팥죽', '흰죽', '야채죽', '누룽지'], 'fh_k36'],
  // ── 🍝 양식 완성요리 PNG(2026-07-23) — SVG보다 먼저, 구체어 우선. ──
  [['피자', '마르게리타', '고르곤졸라'], 'fe_87'],
  [['스파게티', '미트소스', '볼로네제', '토마토파스타'], 'fe_443'],
  [['크림파스타', '까르보나라', '카르보나라', '로제파스타', '파스타'], 'fe_446'],
  [['크림수프', '콘스프', '감자수프', '양송이수프', '포타주', '수프', '스프'], 'fe_447'],
  [['샐러드'], 'fy_y05'],
  [['햄버거', '버거'], 'fe_448'],
  [['스테이크', '함박스테이크', '함박'], 'fe_449'],
  [['그라탕', '그라탱', '라자냐'], 'fy_y08'],
  [['샌드위치'], 'fy_y09'],
  [['오므라이스', '오믈렛'], 'fe_439'],
  [['키쉬'], 'fe_440'],
  [['연어스테이크', '훈제연어'], 'fe_441'],
  [['팬케이크', '핫케이크'], 'gr_009'],
  [['클램차우더', '차우더'], 'fe_442'],
  // ── 🥢 중식 완성요리 PNG(2026-07-23) ──
  [['짬뽕'], 'fj_c01'],
  [['딤섬', '샤오롱바오', '소룡포'], 'fe_492'],
  [['볶음밥', '계란볶음밥', '새우볶음밥'], 'fe_462'],
  // ⛔⛔ 이름표가 「깐풍새우」였는데 **그림에 새우가 한 마리도 없다**(2026-08-10 전수 판독 · 3배로 확인).
  //    두부·파프리카·튀긴 고기뿐이라 창업자 판정 = **「깐풍기」**.
  //    ⭐ 첫 낱말이 이름표가 된다(`FOOD_NAMES` 가 `keys[0]` 을 쓴다) → 「깐풍기」를 맨 앞에.
  //    ⛔ 새우 요리(깐풍새우·탕수새우)는 **새우가 그려진 `fj_c11` 로 보낸다** — 아래 줄.
  //       이름표만 고치면 「깐풍새우」를 친 사람은 여전히 새우 없는 그림을 받는다(반쪽 수정).
  [['깐풍기', '깐풍닭'], 'fe_463'],
  [['마파두부'], 'fe_464'],
  [['고추잡채', '고추잡채밥'], 'fe_465'],
  [['중화계란탕', '계란탕'], 'fe_466'],
  [['슈마이', '하가우'], 'fe_467'],
  [['볶음면', '울면', '기스면'], 'fe_457'],
  [['마라탕', '마라'], 'gr_083'],
  // ⭐ 「깐풍새우」·「탕수새우」가 여기로 왔다 — 새우 요리엔 «새우가 그려진» 컷이라야 한다(2026-08-10).
  [['깐쇼새우', '칠리새우', '깐풍새우', '탕수새우'], 'fe_458'],
  [['우육면', '중화국수', '우육탕면'], 'fe_459'],
  [['팔보채'], 'fe_460'],
  [['동파육', '동파'], 'fe_461'],
  // ── 🥟 분식·간식 완성요리 PNG(2026-07-23) — 일식 '튀김'보다 먼저(구체어 우선). ──
  [['어묵꼬치', '오뎅꼬치', '꼬치어묵'], 'gr_067'],
  [['오뎅탕', '어묵탕', '어묵국'], 'fb_b02'],
  [['모둠튀김', '분식튀김'], 'fb_b03'],
  [['쫄면'], 'gr_068'],
  [['핫도그', '콘도그', '핫바'], 'gr_021'],
  [['김말이', '야채튀김'], 'fb_b06'],
  [['토스트', '길거리토스트', '계란토스트'], 'gr_070'],
  [['감자튀김', '프렌치프라이', '감자스틱'], 'fb_b08'],
  [['슬러시', '슬러쉬'], 'fb_b09'],
  // ── 🍣 일식 완성요리 PNG(2026-07-23) ──
  [['초밥', '스시', '니기리', '생선초밥'], 'fe_494'],
  [['우동'], 'fi_j02'],
  [['튀김', '텐푸라', '새우튀김'], 'fi_j03'],
  [['라멘'], 'fi_j04'],
  [['모둠초밥', '모듬초밥', '초밥세트'], 'fi_j05'],
  [['타코야키', '문어빵'], 'fi_j07'],
  [['연어롤', '데마키'], 'fi_j08'],
  [['사시미', '모둠회', '모듬회', '생선회'], 'fi_j09'],
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
  [['마라탕', '마라', '육개장', '매운탕', '알탕', '동태탕', '감자탕'], 'fe_484'],
  [['크림수프', '수프', '스프', '포타주', '차우더'], 'soup'],
  [['탕수육', '돈까스', '돈가스', '까스', '텐동', '가라아게', '고로케', '너겟', '튀김', '프라이', '후라이드'], 'fried'],
  // ── 🍳 범용 조리법(2026-07-28) — 구체 요리에 하나도 안 걸렸을 때 잡아주는 안전망.
  //    창업자 제보 "가지덮밥·목살조림·묵은지볶음이 아이콘 없음". 아래 SVG(stirfry·donburi…)보다 위에 둬서
  //    밋밋한 도형 대신 얼굴 있는 예쁜 컷이 붙게 한다. ⚠️ 더 위로는 올리지 말 것 — 위의 구체 규칙들이 가려진다.
  [['덮밥'], 'fe_63'],                 // 가지덮밥·제육덮밥… (장어덮밥·오징어덮밥 등 전용컷은 위에서 이미 잡힘)
  [['조림'], 'fe_66'],                 // 목살조림·돼지고기조림… (두부조림·생선조림은 위에서 잡힘)
  [['무침', '겉절이', '생채'], 'fe_71'], // 나물무침·골뱅이무침… (오이무침은 위에서 잡힘)
  [['제육', '두루치기', '주꾸미', '쭈꾸미', '낙지볶음', '오징어볶음', '매운볶음', '고추장볶음', '불고기볶음'], 'stirfryspicy'],
  [['야채볶음', '채소볶음', '가지볶음', '버섯볶음', '애호박볶음', '나물볶음', '감자볶음', '어묵볶음', '멸치볶음', '두부조림'], 'stirfryveg'],
  [['마파', '잡채'], 'stirfry'],
  [['볶음', '볶이'], 'fe_64'], // 묵은지볶음·버섯볶음… 남은 '볶음' 전부(위 구체 규칙에 안 걸린 것) → 예쁜 컷으로
  // ── 면·밥·떡·빵 ──
  [['국수', '잔치', '소면'], 'guksu'],
  [['라면', '우동', '냉면', '쫄면', '당면', '짜장', '짬뽕', '소바', '면'], 'fe_395'],
  [['덮밥', '규동'], 'donburi'],
  // 🍚 공기밥(맨밥) 아이콘은 뺐다(창업자 2026-07-29) — 레시피 표지에 흰밥 한 공기가
  //    붙으면 '요리'로 안 보인다. 여기로 떨어지던 말들은 예쁜 컷으로 돌린다.
  [['필라프'], 'fj_c03'],                       // 볶음밥 계열
  [['죽'], 'fh_k36'],                           // 위에서 안 걸린 죽(전복죽·호박죽 등은 이미 잡힘)
  [['현미', '쌀', '밥'], 'fe_04'],               // 남은 '밥'은 솥밥으로(맨밥 대신)
  // 🍖 [2026-08-15] 「떡갈비」가 «떡» 에 먹히고 있었다 — 갈비가 아니라 **떡 도형**이 붙었다.
  //   ⛔ 오늘 밤 고친 「탕수육 ← 수육」과 **같은 자리**다(구체어 먼저). 그래서 「떡」보다 위에 둔다.
  //   ⚠️ `fh_k21`(동그랑땡)은 **임시 그림**이다 — 떡갈비 전용 컷이 아직 없다.
  //      납작한 patty 여러 개라 «형태»가 제일 가깝지만 색이 옅다. 창업자 컷이 오면 갈아끼운다.
  [['떡갈비'], 'fe_305'],
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
  // ⚠️ 맨끝 '무'(홑글자)는 빼야 함 — "육깻무"·"나물무침"·"콩나물무침" 등 '무' 들어간 제목이 전부 무(radish)로 오매칭됨. 구체어만.
  [['무말랭이', '단무지', '무순', '무생채', '무나물', '무조림', '뭇국', '무국', '동치미'], 'radish'],
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

// 🥕🥕 [2026-08-12] «재료» 이름에 붙일 아이콘 — 창업자 제보
//   *"9번 내가 잘못썼는데 냉장고 재료얘기였어. 재료 하나만 담아도 큰 이미지가 생겨서 재료가 안보였어."*
//   ⛔⛔ `guessFoodIcon` 은 «요리 제목»용이다. 냉장고에 「애호박」을 담으면
//      「애호박새우젓볶음」 규칙에 걸려 **완성 접시 사진(fe_224)** 이 붙었다.
//      대파·두부는 재료 SVG 가 있어 멀쩡했고, **그림이 없는 재료만** 요리 사진을 뒤집어썼다.
//   ✅ 사진 키(fe_·fh_·fy_·fj_·fi_·fb_)가 나오면 «쓰지 않고» 장바구니 그림으로 물러난다.
//      선 그림 재료 SVG 는 그대로 쓴다 — 그건 진짜 재료 그림이다.
//   ⏳ 창업자가 재료 아이콘을 뽑아주면 그때 진짜 그림이 붙는다(2026-08-12 *"냉장고 재료 아이콘 필요하면 다 뽑아줄게"*).
//   ✅✅ [2026-08-12] **창업자 재료 아이콘 171컷이 왔다** — 이제 진짜 그림이 붙는다.
//      창업자 시트 11장 → `src/data/ingIcons.js`. ⛔큐레이션엔 안 쓴다(그림체가 다르다).
//      ⭐ 그 표를 «먼저» 본다 — 요리 규칙에 얹지 않는 이유가 바로 위 애호박 사고다.
const 사진키 = /^(fe|fh|fy|fj|fi|fb)_/
export function guessIngredientIcon(name = '') {
  const ing = ingIconOf(name)
  if (ing) return ing
  const key = guessFoodIcon(name)
  return 사진키.test(key) ? 'basket' : key
}

// 🏷 아이콘 식별용 이름 — 픽커에서 아이콘 아래 라벨로(창업자 2026-07-26 "음식 아래 이름 달아 식별되게"). ICON_RULES 첫 키워드=대표 이름(구체 규칙이 위라 정확). 규칙 없는 건 아래 EXTRA로 보충.
// ⚠️ 이름 없는 아이콘 = 픽커에서 라벨이 빈칸으로 보인다(창업자 2026-07-28 제보 "음식에 이름 없는 거 있어").
//    → 새 아이콘을 픽커에 넣을 땐 ICON_RULES에 규칙이 없으면 반드시 여기에 이름을 적을 것.
const EXTRA_NAMES = {
  // 🍱 2026-08-14 — `fe_282` 는 **일부러 `ICON_RULES` 를 안 줬다**(「국물 떡볶이」가 `fh_k27` 로 이미 잘 붙어 있어
  //    「떡볶이」 홑낱말 규칙을 주면 그 편을 창업자 판정 없이 갈아치운다 · 규칙 11). 픽커엔 올라가니 이름표는 여기서.
  //    ⭐ 게이트(`check-foodtab`)가 이걸 «빈 라벨»로 잡아줬다 — 규칙만 믿었으면 픽커에 이름 없는 칸이 나갔다.
  fe_282: '떡볶이', fe_279: '오이물김치',
  // 🍝 2026-08-24 — 「크림파스타」가 실사 컷(fe_437)으로 갈리면서 «범용 파스타» fy_y03 이 규칙을 잃었다.
  //    픽커엔 그대로 실려 있어 라벨이 빈칸이 된다(게이트가 잡았다). 이름만 여기서 준다.
  fy_y03: '파스타',
  // 🍱 2026-08-15 창업자 시트 20컷 — ⛔이름표가 없으면 픽커에서 라벨이 빈칸이 된다
  fe_285: '고구마누룽지', fe_286: '고구마맛탕', fe_287: '고구마전', fe_288: '황태장아찌',
  fe_289: '마늘쫑비빔밥', fe_290: '소고기솥밥', fe_291: '분짜소스', fe_292: '초무침소스',
  fe_293: '파절이소스', fe_294: '코울슬로', fe_295: '오징어감자전', fe_296: '콘샐러드',
  fe_297: '간장국수', fe_298: '비빔국수', fe_299: '참깨소스', fe_300: '겨자소스',
  // 🦀🍚 2026-08-18 창업자 2컷 — 라벨 원문 = 「양파가 위에 올라간 꽃게간장조림」 · 「일반나물비빔밥」
  fe_306: '꽃게간장조림', fe_307: '나물비빔밥',
  fe_308: '항정살간장조림', fe_309: '닭고기데리야끼조림', fe_310: '뼈없는 양념돼지갈비구이',
  fe_311: '오이샌드위치', fe_312: '오픈샌드위치', fe_313: '백순대볶음',
  // 🍲 2026-08-18 창업자 시트 3장 ＋ 단독 재판
  fe_314: '대파듬뿍 소불고기전골', fe_315: '버섯볶음밥', fe_316: '냉이듬뿍된장찌개',
  fe_317: '팽이버섯 베이컨전', fe_318: '들기름 두부전골', fe_319: '뼈없는 순살갈비조림',
  fe_320: '얼큰 샤브 칼국수', fe_321: '원팬 크림 파스타', fe_322: '양지수육',
  fe_323: '항정수육', fe_324: '항정삼합', fe_325: '묵은지 볶음',
  fe_326: '고등어 묵은지조림', fe_327: '뚝배기 파스타', fe_328: '갈비살조림',
  fe_305: '떡갈비', fe_301: '마요소스', fe_302: '쯔유소스', fe_303: '데리야끼소스', fe_304: '땅콩버터소스',
  fe_265: '라면',            // 규칙은 「얼큰라면」이지만 픽커엔 짧은 이름이 낫다
  // 🍱 2026-08-11 새 시트 48컷 — 규칙 없는 컷은 이게 «유일한» 이름이다(없으면 픽커 라벨이 빈칸)
  fe_156: '버섯들깨무침', fe_157: '감자전', fe_158: '낙지볶음',
  fe_159: '낙지전골', fe_160: '오징어조림', fe_161: '깻잎찜',
  fe_162: '브로콜리구이', fe_163: '오징어새우전', fe_164: '소세지볶음',
  fe_165: '피클', fe_166: '콩나물국밥', fe_167: '묵밥',
  fe_168: '뚝배기파스타', fe_169: '미나리볶음밥', fe_170: '참치야채덮밥',
  fe_171: '갈비찜(매운양념)', fe_172: '삼겹살볶음', fe_173: '소고기구이',
  fe_174: '간장양념장', fe_175: '샐러드소스', fe_176: '찰밥',
  fe_177: '양배추볶음', fe_178: '장어덮밥', fe_179: '냉채',
  fe_180: '목살스테이크', fe_181: '가지볶음', fe_182: '가지덮밥',
  fe_183: '굴매생이떡국', fe_184: '갈비찜(간장)', fe_185: '매운양념장',
  fe_186: '딸기라떼', fe_187: '매운콩나물국밥', fe_188: '봉골레파스타',
  // 🇹🇭 fe_190 = 창업자 정정 2026-08-12. 픽커 이름표가 «열두 글자»라 두 줄로 접혔다 — 이 이름이 짧고 맞다.
  fe_189: '매운콩나물덮밥', fe_190: '느어 픽타이담', fe_191: '매운콩나물불고기',
  fe_192: '마늘쫑볶음', fe_193: '마늘쫑장아찌', fe_194: '깻잎장아찌',
  fe_195: '계란장', fe_196: '구움찰떡', fe_197: '간장불고기',
  fe_198: '삼겹살구이', fe_199: '닭봉구이', fe_200: '양념게장(매운)',
  fe_201: '황태무침', fe_202: '충무김밥', fe_203: '묵은지볶음',
  // 🍱 2026-08-12 새 57컷 — ICON_RULES 첫 낱말이 대표 이름이 되지만, «규칙을 안 준 것»과
  //    첫 낱말이 라벨로 어색한 것만 여기서 덮는다. ⛔이름표가 비면 픽커에 빈칸이 뜬다.
  fe_212: '육개장', fe_217: '카레라이스', fe_227: '두부조림(고추장)',
  fe_231: '쌀국수', fe_239: '깍두기', fe_240: '소스 모둠 (4가지)',
  fe_241: '양념 모둠 (4가지)', fe_242: '샐러드소스 모둠 (4가지)', fe_252: '소스 모둠 (3가지)',
  fe_253: '양념 모둠 (3가지)', fe_254: '샐러드소스 모둠 (3가지)', fe_255: '오이무침',
  fe_259: '계란말이', fe_260: '계란찜',
  // 🍱 2026-08-05 새 시트 16컷 — ICON_RULES 첫 낱말이 대표 이름이 되지만, 그 말이 라벨로 어색한 것만 여기서 덮는다
  fe_140: '두부조림(간장)', fe_144: '해물볶음', fe_145: '콩나물무침', fe_148: '맑은황태국',
  fe_151: '바지락국', fe_153: '새우장(매콤)', fe_142: '양념장', fe_149: '샐러드드레싱',
  // 🍱 2026-08-01 새 시트 37컷 — 이름표가 없으면 픽커 라벨이 빈칸이 된다
  fe_97: '콩나물밥', fe_98: '오야꼬동', fe_99: '꼬막비빔밥', fe_100: '돼지갈비',
  fe_101: '마늘갈비살', fe_102: '달래양념장', fe_103: '야키니쿠', fe_104: '우엉조림',
  fe_105: '연근조림', fe_106: '부타노가쿠니', fe_107: '육전', fe_108: '무생채',
  fe_109: '회덮밥', fe_110: '레터스랩', fe_111: '열무물김치', fe_112: '오이물김치',
  fe_113: '나박물김치', fe_114: '누룽지탕', fe_115: '나시고랭', fe_116: '연근샐러드',
  fe_117: '매운오징어볶음', fe_118: '간장오징어볶음', fe_119: '해물전', fe_120: '오이소박이',
  fe_121: '스키야키', fe_122: '굴당면', fe_123: '굴떡국', fe_124: '궁채나물',
  fe_125: '수육', fe_126: '내려둠(볶음면 그림)', fe_127: '스튜', fe_128: '소스',
  fe_134: '훈제오리 깻잎볶음', fe_135: '토마토달걀볶음', fe_136: '오징어숙회',
  fe_137: '깻잎전', fe_138: '야채볶음', fe_139: '브로콜리볶음',
  fe_129: '두루치기', fe_130: '깍두기', fe_131: '김치전', fe_132: '전복죽', fe_133: '된장찌개',

  // 한식(hnc·htj·hnb 시리즈) — 2026-07-28 그림 직접 확인해 이름 부여
  fh_hnc01: '돌솥비빔밥', fh_hnc04: '순두부찌개', fh_hnc06: '잡채', fh_hnc10: '불고기',
  fh_htj01: '삼계탕', fh_htj05: '갈비탕', fh_htj13: '닭볶음탕', fh_hnb01: '미역국', fh_hnb08: '계란말이',
  // 분식(bun 시리즈)
  fb_bun02: '어묵탕', fb_bun03: '떡볶이', fb_bun04: '순대', fb_bun05: '라면', fb_bun08: '김밥', fb_bun11: '만두튀김',
  // 양식(yng 시리즈)
  fy_yng01: '마르게리타피자', fy_yng02: '토마토파스타', fy_yng05: '햄버거', fy_yng07: '스테이크',
  fy_yng09: '샌드위치', fy_yng12: '오므라이스',
  // 중식(jsk 시리즈)
  fj_jsk01: '해물짬뽕', fj_jsk02: '샤오롱바오', fj_jsk03: '짜장면', fj_jsk04: '볶음밥',
  fj_jsk05: '마파두부', fj_jsk15: '군만두',
  // 일식(isk 시리즈)
  fi_isk02: '우동', fi_isk03: '연어초밥', fi_isk05: '라멘', fi_isk06: '장어덮밥',
  fi_isk07: '타코야키', fi_isk13: '미소국',
  // 신규 추가분 중 규칙 키워드와 라벨이 다른 것
  fe_85: '케이크', fe_89: '리조또', fe_91: '탕수육',
  // 기타
  soyLong: '진간장',
}
export const FOOD_NAMES = (() => {
  const m = {}
  for (const [keys, key] of ICON_RULES) if (!m[key]) m[key] = keys[0]
  // 🥕🥕 [2026-08-16] 재료 171컷의 «제 이름»을 합친다 — ⛔이게 없으면 픽커 라벨이 빈칸이다.
  //   ⭐ 재료는 일부러 `ICON_RULES`(요리 규칙)에 안 얹었다(「애호박」이 「애호박새우젓볶음」에 걸리던 사고).
  //      그래서 이름도 거기서 안 나온다 → **재료 표에서 따로 가져온다.**
  //   ⭐ 덤 = `searchFoodIcons` 색인이 `FOOD_NAMES` 를 훑으므로 **재료 이름·초성 검색도 같이 열린다.**
  //   ⛔ ING_RULES 는 [이름, 키] 순서다 (ICON_RULES 와 반대) — 뒤집어 읽지 말 것.
  const ing = {}
  for (const [nm, key] of ING_RULES) if (!ing[key]) ing[key] = nm
  return { seafood: '해산물', dessert: '디저트', icecream: '아이스크림', bag: '장바구니', basket: '바구니', box: '박스', ...EXTRA_NAMES, ...m, ...ing }
})()

// 🔎 아이콘 찾기 — 299개나 되어 스크롤로는 못 찾는다(창업자 2026-07-29).
// 이름표(FOOD_NAMES) + 매칭 규칙의 별칭 낱말(ICON_RULES, 834개)을 같이 색인해서
// "제육"으로도 "두루치기"로도 찾히게 한다. 초성(ㄱㅊㅉㄱ→김치찌개)도 받는다.
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
// 한글 낱자 → 첫소리(초성)만 뽑기. 한글이 아니면 그대로 둔다.
export function chosungOf(str = '') {
  let out = ''
  for (const ch of String(str)) {
    const c = ch.charCodeAt(0)
    if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)]
    else out += ch
  }
  return out
}
const isChosungQuery = (q) => q.length > 0 && [...q].every((c) => CHO.includes(c))

// 아이콘별 검색어 뭉치 { key: '이름 별칭1 별칭2 …' }
const SEARCH_INDEX = (() => {
  const m = {}
  const add = (k, w) => { if (!k || !w) return; m[k] = m[k] ? m[k] + ' ' + w : w }
  for (const [keys, key] of ICON_RULES) for (const w of keys) add(key, w)
  for (const [key, nm] of Object.entries(FOOD_NAMES)) add(key, nm)
  return m
})()

// 그룹 안에서 이름 가나다순으로 정렬해 둔 목록 — 넣은 순서라 규칙이 없던 걸 예측 가능하게.
// (창업자 2026-07-29 "양이 많아져서 ㄱㄴㄷ순으로 정렬하자")
// 🥄 «맨 뒤에 붙일 것» — 가나다순에 섞이면 안 되는 컷.
//   ⛔⛔ 2026-08-05: 창업자 *"볶음 마지막에 소스넣자"* 대로 소스를 볶음 그룹 «배열 끝»에 넣었는데,
//      화면엔 「샐러드드레싱 › 소스 › … › 양념장」으로 **가나다순에 섞여 나왔다.**
//      여기서 그룹 안을 다시 정렬하기 때문이다(v8.81 · 아이콘 300개라 찾기 편하라고).
//   📌 **배열에 넣은 순서 ≠ 화면 순서.** 코드로 넣었다고 그렇게 보이는 게 아니다 — 실물이 잡았다(규칙 18).
//   ✅ 그래서 이 목록에 있는 키는 정렬에서 빼고 **맨 뒤에 그대로** 붙인다.
//      소스는 요리가 아니라 «볶고 조릴 때 쓰는 것»이라 끝에 모여 있어야 눈에 걸린다.
const TAIL_KEYS = ['fe_142', 'fe_102', 'fe_149', 'fe_128'] // 양념장·달래양념장·샐러드드레싱·소스

export const FOOD_ICON_GROUPS_SORTED = FOOD_ICON_GROUPS.map((g) => {
  const tail = g.items.filter((k) => TAIL_KEYS.includes(k))
  const head = g.items.filter((k) => !TAIL_KEYS.includes(k))
  return {
    ...g,
    items: [
      ...head.sort((a, b) => (FOOD_NAMES[a] || a).localeCompare(FOOD_NAMES[b] || b, 'ko')),
      ...tail, // ⛔ 정렬하지 않는다 — 배열에 적은 차례 그대로 맨 뒤
    ],
  }
})

// 🥕 재료를 먼저 — 냉장고 「재료 담기」처럼 «넣어둘 것»을 고르는 자리에서 쓴다.
//   ⭐ 갈래 «순서»만 바꾼다. 안에 든 컷도, 요리 갈래도 하나도 안 없앤다(밑에 그대로 이어진다).
//   📌 `kind` 를 보고 가르므로 라벨을 다듬어도 안 깨진다.
export const FOOD_ICON_GROUPS_ING_FIRST = [
  ...FOOD_ICON_GROUPS_SORTED.filter((g) => g.kind === 'ing'),
  ...FOOD_ICON_GROUPS_SORTED.filter((g) => g.kind !== 'ing'),
]

// 📊📊 [2026-08-12] 「이번 달 뭘 해먹었나」 — 아이콘 키로 «갈래»를 되찾는다.
//   📮 창업자 폰 제보 *"통계는 저게다야? 우리얘기했던거있었는데"*
//   ⭐⭐ 갈래표를 «새로 만들지 않는다» — 픽커 탭(`FOOD_ICON_GROUPS`)이 이미 창업자가 정한 갈래다
//      (2026-08-05 순서 확정). 따로 표를 두면 **컷을 넣을 때마다 두 곳을 고쳐야 하고 반드시 어긋난다.**
//      `docs/요리기록-다이어리-방향-2026-08-05.md` §2 가 정해둔 방식 그대로다.
//   ⛔ 「요리 아이콘」(재료·도구 SVG)은 «요리 갈래»가 아니라 뺀다 — 그건 그림이 없을 때 쓰는 도형이다.
const DISH_CAT_SKIP = '요리 아이콘'
const DISH_CAT_BY_KEY = (() => {
  const m = {}
  for (const g of FOOD_ICON_GROUPS) {
    if (g.label === DISH_CAT_SKIP) continue
    for (const k of g.items) if (!m[k]) m[k] = g.label // 먼저 나온 갈래가 이긴다(픽커와 같은 규칙)
  }
  return m
})()
export function dishCatOf(iconKey) {
  return DISH_CAT_BY_KEY[iconKey] || null
}

// 검색어에 맞는 아이콘 키 목록. 빈 검색어면 null(=검색 안 함).
export function searchFoodIcons(query = '') {
  const q = String(query).trim().toLowerCase().replace(/\s+/g, '')
  if (!q) return null
  const byChosung = isChosungQuery(q)
  const seen = new Set()
  // 🥇🥇 **찾은 것을 「얼마나 딱 맞나」로 줄 세운다** (2026-08-07 전수검사에서 잡음)
  //   ⛔ 전엔 걸린 순서(= 탭 순서) 그대로였다. 그래서 「김밥」을 치면 **오니기리가 먼저** 나왔다 —
  //      오니기리 별명에 「삼각김밥」이 있어 걸리는데, v9.79 창업자 확정 순서상 «일식»이 «분식»보다 앞이라서다.
  //      찾는 사람은 자기가 친 그 이름을 맨 앞에서 보길 기대한다.
  //   ⭐ 0=이름이 그대로 · 1=그 말로 시작 · 2=중간에 들어 있음. 같은 점수면 «원래 탭 순서»를 지킨다
  //      (안정 정렬이라 창업자가 정한 「끼니 앞·군것질 뒤」가 안 흐트러진다).
  const hit = []
  for (const g of FOOD_ICON_GROUPS_SORTED) {
    for (const k of g.items) {
      if (seen.has(k)) continue
      const hay = (SEARCH_INDEX[k] || k).toLowerCase()
      const flat = byChosung ? chosungOf(hay) : hay.replace(/\s+/g, '')
      if (!flat.includes(q)) continue
      // 🔎 별명들은 **공백으로 이어 붙어** 있다(`SEARCH_INDEX` 의 `add`) — 낱개로 갈라야
      //    「그 이름 그대로인지」를 물을 수 있다. ⛔ 공백을 먼저 지우면 낱말 경계가 사라진다.
      const words = hay.split(/[\s·,]+/).filter(Boolean).map((w) => (byChosung ? chosungOf(w) : w))
      // 🥇 0 = **제 이름이 그대로** · 1 = 별명이 그대로 · 2 = 그 말로 시작 · 3 = 중간에 들어 있음
      //   ⭐ 0 과 1 을 가르는 이유 = 「비빔밥」을 치면 **돌솥비빔밥**이 먼저 나왔다.
      //      돌솥비빔밥이 별명으로 「비빔밥」을 갖고 있어 동점이었기 때문이다(실측).
      //      친 말이 «그 음식의 이름 자체»인 쪽이 언제나 먼저다.
      const 제이름 = (FOOD_NAMES[k] || '').toLowerCase().replace(/\s+/g, '')
      const 제이름맞음 = (byChosung ? chosungOf(제이름) : 제이름) === q
      const rank = 제이름맞음 ? 0 : words.includes(q) ? 1 : words.some((w) => w.startsWith(q)) ? 2 : 3
      seen.add(k); hit.push({ k, rank })
    }
  }
  return hit.sort((a, b) => a.rank - b.rank).map((x) => x.k)
}

export default function FoodIcon({ name = 'default', size = 40 }) {
  // 🍱 뉴 음식 이모지(PNG) — 완성요리 사진을 아이콘으로. 없으면 SVG 브랜드 아이콘.
  // 🥕 재료 그림(창업자 시트 171컷) — 음식 사진보다 «먼저» 본다.
  //    ⛔ 키가 `ig_` 로 시작하는 것뿐이라 음식 아이콘과 섞일 일이 없다.
  const ing = ING_SRC[name]
  if (ing) {
    return <img src={ing} alt="" draggable={false} width={size} height={size} style={{ display: 'block', objectFit: 'contain' }} />
  }
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

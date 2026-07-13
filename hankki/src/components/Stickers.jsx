import Buddy from './Buddies'

// ── 꾸미기 스티커 라이브러리 ──
// 전부 오리지널 아트(저작권 안전). 아바타 '요리사 친구들'과 같은 결:
// 손그림 외곽선(#71604b) + 까만콩 눈 + 볼터치 + 무광 뮤트 팔레트.
// 앱 출시 후 세트를 늘리거나 유료 팩으로 확장할 수 있게 그룹 구조로 관리한다.

const OL = '#71604b' // 외곽선
const EYE = '#4a3d2c' // 까만콩 눈
const BL = '#d68f7e' // 볼터치
const CORAL = '#d47f6c'

// 얼굴(눈+미소+볼) 공통 조각
const face = (cx, cy, ex, mw) =>
  `<circle cx="${cx - ex}" cy="${cy}" r="1.9" fill="${EYE}"/><circle cx="${cx + ex}" cy="${cy}" r="1.9" fill="${EYE}"/><path d="M${cx - mw} ${cy + 3.4}q${mw} ${mw} ${mw * 2} 0" fill="none" stroke="${EYE}" stroke-width="1.7" stroke-linecap="round"/><circle cx="${cx - ex - 3.3}" cy="${cy + 2.7}" r="2.1" fill="${BL}" opacity=".55"/><circle cx="${cx + ex + 3.3}" cy="${cy + 2.7}" r="2.1" fill="${BL}" opacity=".55"/>`

// 표정 팩 공통 바탕(부드러운 골드 원 + 도톰한 볼터치 — 볼을 조금 더 크고 발그레하게)
const fb = (feat) =>
  `<circle cx="24" cy="24" r="18.5" fill="#f2d684" stroke="${OL}" stroke-width="2"/><circle cx="13" cy="28.8" r="3.6" fill="#e79a91" opacity=".68"/><circle cx="35" cy="28.8" r="3.6" fill="#e79a91" opacity=".68"/>${feat}`

// viewBox 48×48 기준(맛있어 말풍선만 74×46).
const ART = {
  // ── 표정 팩 ──
  smile: fb(`<circle cx="17.6" cy="22.5" r="2.5" fill="${EYE}"/><circle cx="30.4" cy="22.5" r="2.5" fill="${EYE}"/><path d="M16.8 29c2.9 3.8 11.5 3.8 14.4 0" fill="none" stroke="${EYE}" stroke-width="2.5" stroke-linecap="round"/>`),
  happy: fb(`<path d="M14 24q3.6 -4.2 7.2 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/><path d="M26.8 24q3.6 -4.2 7.2 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/><path d="M17 29c2.5 5.5 11.5 5.5 14 0Z" fill="${CORAL}" stroke="${EYE}" stroke-width="1.6" stroke-linejoin="round"/>`),
  hearteyes: fb(`<path d="M18 18.6c-2.4-1.7-5.2.4-5.2 2.7 0 2.4 3 4 5.2 6 2.2-2 5.2-3.6 5.2-6 0-2.3-2.8-4.4-5.2-2.7Z" fill="${CORAL}"/><path d="M30 18.6c-2.4-1.7-5.2.4-5.2 2.7 0 2.4 3 4 5.2 6 2.2-2 5.2-3.6 5.2-6 0-2.3-2.8-4.4-5.2-2.7Z" fill="${CORAL}"/><path d="M17.5 31c2.7 3.2 10.3 3.2 13 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/>`),
  wink: fb(`<circle cx="17.6" cy="22.5" r="2.5" fill="${EYE}"/><path d="M27.4 23.5q3 2.6 6 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/><path d="M17 29c2.9 3.6 11.5 3.6 14 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/>`),
  surprised: fb(`<circle cx="17.8" cy="22" r="4" fill="#fff" stroke="${EYE}" stroke-width="1.5"/><circle cx="18" cy="22.6" r="2" fill="${EYE}"/><circle cx="30.2" cy="22" r="4" fill="#fff" stroke="${EYE}" stroke-width="1.5"/><circle cx="30" cy="22.6" r="2" fill="${EYE}"/><ellipse cx="24" cy="32" rx="2.6" ry="3.2" fill="${EYE}"/>`),
  boing: fb(`<circle cx="17.6" cy="22" r="5" fill="#fff" stroke="${EYE}" stroke-width="1.6"/><circle cx="17.6" cy="22" r="2" fill="${EYE}"/><circle cx="30.4" cy="22" r="5" fill="#fff" stroke="${EYE}" stroke-width="1.6"/><circle cx="30.4" cy="22" r="2" fill="${EYE}"/><path d="M21 32h6" stroke="${EYE}" stroke-width="2" stroke-linecap="round"/><path d="M9 15l3 2M39 15l-3 2" stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"/>`),
  cry: fb(`<path d="M13.5 21.5q4 4 8 0" fill="none" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/><path d="M26.5 21.5q4 4 8 0" fill="none" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/><path d="M16 27c-1.7 2.6-1.7 5 0 5s1.7-2.4 0-5Z" fill="#8fb4d6"/><path d="M32 27c-1.7 2.6-1.7 5 0 5s1.7-2.4 0-5Z" fill="#8fb4d6"/><ellipse cx="24" cy="33" rx="3" ry="2.4" fill="${CORAL}"/>`),
  yumface: fb(`<path d="M14 24q3.6 -4 7.2 0" fill="none" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/><path d="M26.8 24q3.6 -4 7.2 0" fill="none" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/><path d="M18 29c2 3.5 10 3.5 12 0" fill="none" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/><path d="M22 31c0 2.5 4 2.5 4 0Z" fill="${CORAL}"/>`),
  // 혀날름 — 웃는 눈 + 메롱 혀
  mlem: fb(`<path d="M14.5 22.6q3.3 -3.8 6.6 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/><path d="M26.9 22.6q3.3 -3.8 6.6 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/><path d="M17.5 28.2c2.4 2.8 10.6 2.8 13 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/><path d="M22.6 29.8c-.2 3.4 1.1 5.4 2.7 5.4 1.6 0 2.9-2 2.7-5.4-1.8.9-3.6.9-5.4 0Z" fill="${CORAL}" stroke="${EYE}" stroke-width="1.3" stroke-linejoin="round"/>`),
  // 선글라스 — 까만 안경 + 씩 웃는 입
  cool: fb(`<rect x="11.2" y="18" width="10.8" height="7.8" rx="3.6" fill="${EYE}"/><rect x="26" y="18" width="10.8" height="7.8" rx="3.6" fill="${EYE}"/><path d="M22 21.3h4" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/><path d="M11.2 20.8H8M36.8 20.8h3.2" stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"/><path d="M17.5 30.5c2.6 3 10.4 3 13 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/>`),
  // ── 재료 친구들 ──
  tomato: `<path d="M24 12c0-3 3-4 5-3-1 2-1 3 0 4M24 12c0-3-3-4-5-3 1 2 1 3 0 4" fill="#8ca86e" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="24" cy="27" r="14" fill="#d47f6c" stroke="${OL}" stroke-width="2"/><path d="M24 13c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3Z" fill="#8ca86e" stroke="${OL}" stroke-width="1.3"/>${face(24, 28, 4, 2.4)}`,
  egg: `<path d="M14 25c-4-3-1-10 5-10 3 0 3.5 2 6.5 1.5 3.5-.6 4-5 8.5-3.5 4.2 1.4 4 6 2.5 8.5 3.5 1.5 3 7-1 8.5 1.5 3-1 6-5 6.5-3 .4-4.5-1.6-7.5-1-3.5.7-4.5 3.5-8.5 2.6-3.4-.8-3.6-3.8-6.4-4.6-3.5-1-5.4 1-7.5-1.5-1.7-2 .4-5 2-6Z" fill="#faf6ec" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><circle cx="26" cy="25" r="8.6" fill="#e7c268" stroke="#cfa64f" stroke-width="1.4"/>${face(26, 24, 3.2, 2)}`,
  carrot: `<g fill="#8ca86e" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"><path d="M24 16c-2-4-5-5-8-5 0 3 2 6 6 7Z"/><path d="M24 16c0-4 2-7 6-8 1 3-1 7-4 8Z"/><path d="M24 16c2-3 5-4 8-3-1 3-4 5-7 5Z"/></g><path d="M17.5 18c1-2 12-2 13 0l-4.5 21c-.6 2.6-3.4 2.6-4 0Z" fill="#d9925a" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><g stroke="#b5713f" stroke-width="1.2" stroke-linecap="round"><path d="M20.5 25h7"/><path d="M21.5 31h5"/></g>${face(24, 22, 3, 1.9)}`,
  onion: `<path d="M24 10c1 3 3 3.5 3 5.5" stroke="#8ca86e" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 15c-9 0-14 8-14 15 0 6 6 10 14 10s14-4 14-10c0-7-5-15-14-15Z" fill="#cdb1c0" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M18 19c-3 4-3 12 0 18M30 19c3 4 3 12 0 18" stroke="#b592a6" stroke-width="1.3" fill="none"/>${face(24, 29, 3.4, 2.2)}`,
  mushroom: `<path d="M8 25.5c0-10 7-15.5 16-15.5s16 5.5 16 15.5c0 2.4-2.2 3.7-5 3.7H13C10.2 29.2 8 27.9 8 25.5Z" fill="#cb9c74" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="17.5" cy="18" rx="3.1" ry="2.5" fill="#ecd4ba"/><ellipse cx="30" cy="16.5" rx="3.8" ry="3" fill="#ecd4ba"/><ellipse cx="25" cy="22" rx="2" ry="1.6" fill="#ecd4ba"/><path d="M16.5 29.2h15l-1.7 8.4c-.35 1.8-1.5 2.8-3 2.8h-4.6c-1.5 0-2.65-1-3-2.8Z" fill="#f7f0e2" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>${face(24, 34, 3.4, 2.4)}`,
  chili: `<path d="M22 11c0-2 4-3 5-1 1 2-1 3-2 4" fill="none" stroke="#8ca86e" stroke-width="2.4" stroke-linecap="round"/><path d="M25 14c-9 1-17 9-17 19 0 4 3 6 6.5 4.6C22 34 29 26 29 17c0-2-2-3-4-3Z" fill="#cf6f5a" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>${face(21, 24, 3, 1.9)}`,
  avocado: `<path d="M24 8c-8 0-13 8-13 17s5 15 13 15 13-6 13-15S32 8 24 8Z" fill="#7f9a5f" stroke="${OL}" stroke-width="2"/><path d="M24 15c-5 0-8.5 6-8.5 12S19 37 24 37s8.5-4 8.5-10S29 15 24 15Z" fill="#e8e0a6" stroke="#b6a86a" stroke-width="1.3"/><circle cx="24" cy="30" r="5" fill="#a5764a" stroke="${OL}" stroke-width="1.3"/>${face(24, 21, 2.8, 1.7)}`,
  broccoli: `<g fill="#82a05f" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"><circle cx="17" cy="18" r="6.5"/><circle cx="26" cy="14.5" r="6.5"/><circle cx="31" cy="21" r="6.5"/><circle cx="22.5" cy="23" r="6.5"/></g><path d="M18.5 27h11l-1.8 9.5c-.3 1.6-1.4 2.4-2.7 2.4h-2c-1.3 0-2.4-.8-2.7-2.4Z" fill="#c7d3ad" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>${face(24, 32, 2.8, 1.7)}`,
  // ── 부엌 도구 ──
  pot: `<path d="M13 19c-2.6-2-1.4-3 1-3M35 19c2.6-2 1.4-3-1-3" stroke="${OL}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M9 20h30l-2.2 16c-.4 3-3 5-6 5H17.2c-3 0-5.6-2-6-5Z" fill="#b9b0a0" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><rect x="7" y="16.5" width="34" height="5.5" rx="2.7" fill="#cfc7b6" stroke="${OL}" stroke-width="2"/><path d="M20 10c-2 2 2 3 0 5M27 9c-2 2 2 3 0 5" stroke="#c9c1b0" stroke-width="2.2" fill="none" stroke-linecap="round"/>${face(24, 30, 3.4, 2.1)}`,
  pan: `<rect x="30" y="24" width="16" height="5" rx="2.5" fill="#7a5a3f" stroke="${OL}" stroke-width="1.8"/><circle cx="20" cy="26" r="14" fill="#8f887b" stroke="${OL}" stroke-width="2"/><circle cx="20" cy="26" r="9.5" fill="#b3ab9a"/><circle cx="20" cy="26" r="5" fill="#f4ecdb"/><circle cx="20" cy="26" r="2.7" fill="#e7c268"/>`,
  ladle: `<rect x="22" y="6" width="4.6" height="22" rx="2.3" fill="#bcb4a3" stroke="${OL}" stroke-width="1.7"/><path d="M13 28c0-5 5-8 11-8s11 3 11 8-5 9-11 9-11-4-11-9Z" fill="#c8c0af" stroke="${OL}" stroke-width="2"/><path d="M17 29c1.5 3 11.5 3 14 0" stroke="#a49c8b" stroke-width="1.4" fill="none"/>`,
  spatula: `<rect x="21" y="22" width="5" height="19" rx="2.4" fill="#7a5a3f" stroke="${OL}" stroke-width="1.7"/><path d="M15 8h17a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z" fill="#bcb4a3" stroke="${OL}" stroke-width="2"/><path d="M19 12v6M23.5 12v6M28 12v6" stroke="${OL}" stroke-width="1.3"/>`,
  board: `<rect x="7" y="19" width="25" height="20" rx="4.5" fill="#d7bd92" stroke="${OL}" stroke-width="2"/><circle cx="29" cy="22.5" r="1.5" fill="none" stroke="${OL}" stroke-width="1.3"/><path d="M31 8l9 9-3.5 3.5-9-9c-.8-.8 2.7-4.3 3.5-3.5Z" fill="#cbc3b2" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><path d="M29.5 15.5l3.5 3.5" stroke="${OL}" stroke-width="1.3"/>`,
  cup: `<path d="M14 16h18l-1.4 20c-.15 2.1-1.9 3.7-4 3.7H19.4c-2.1 0-3.85-1.6-4-3.7Z" fill="#eef1f4" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M14.7 29c6 2.8 11.6 2.8 16.6 0l-1 7c-.15 2.1-1.9 3.4-3.8 3.4H19.5c-1.9 0-3.65-1.3-3.8-3.4Z" fill="#cfe0ee"/><g stroke="#9aa9b3" stroke-width="1.3"><path d="M18 21h5"/><path d="M18 25h3.5"/></g>`,
  // ── 소스병 ──
  ketchup: `<path d="M21 5.5h6v5h-6z" fill="#e6ded0" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 10.5h10c1.5 0 2.6 1.2 2.6 2.9l-.35 24.3c-.03 2.2-1.85 3.8-4.05 3.8h-6.4c-2.2 0-4.02-1.6-4.05-3.8L16.4 13.4C16.4 11.7 17.5 10.5 19 10.5Z" fill="#cf6f5a" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><rect x="17.6" y="22" width="12.8" height="12" rx="2.5" fill="#f6efe0" stroke="${OL}" stroke-width="1.3"/>${face(24, 27, 2.6, 1.7)}`,
  soy: `<rect x="20.8" y="5" width="6.4" height="6" rx="1.5" fill="#8a6f4f" stroke="${OL}" stroke-width="1.6"/><path d="M20 11h8c1.4 0 2.5 1.1 2.5 2.6v24c0 2-1.6 3.6-3.6 3.6h-5.8c-2 0-3.6-1.6-3.6-3.6v-24C17.5 12.1 18.6 11 20 11Z" fill="#ead9bd" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M17.7 27c4.2 2 8.4 2 12.6 0v10.6c0 2-1.6 3.6-3.6 3.6h-5.4c-2 0-3.6-1.6-3.6-3.6Z" fill="#5f4526"/><rect x="18.4" y="17.5" width="11.2" height="7.5" rx="1.8" fill="#faf6ec" stroke="${OL}" stroke-width="1.2"/><path d="M22 21.2h4" stroke="#a98a5a" stroke-width="1.4" stroke-linecap="round"/>`,
  hotsauce: `<rect x="21.5" y="5.5" width="5" height="4.5" rx="1.2" fill="#b24a38" stroke="${OL}" stroke-width="1.5"/><path d="M20 10h8c1.2 0 2.1.9 2.1 2.1l-.5 25.5c-.04 2.1-1.8 3.4-3.6 3.4h-4c-1.8 0-3.56-1.3-3.6-3.4L17.9 12.1C17.9 10.9 18.8 10 20 10Z" fill="#d97b53" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><rect x="18.6" y="21" width="10.8" height="13" rx="2" fill="#faf3e6" stroke="${OL}" stroke-width="1.2"/><path d="M23 8c0-1 2-1 2.4 0" fill="none" stroke="#8ca86e" stroke-width="1.6" stroke-linecap="round"/><path d="M24.5 24c2.2 0 3.2 1.8 2.1 4-.9 1.8-2.9 2.8-4.6 3.2.6-2.8 0-5.5 2.5-7.2Z" fill="#cf5a44"/>`,
  oil: `<rect x="22" y="4" width="4" height="6" rx="1.2" fill="#b7af9f" stroke="${OL}" stroke-width="1.5"/><path d="M22 10c0 2.2-3 3.2-3 6.2v21.6c0 2 1.6 3.6 3.6 3.6h2.8c2 0 3.6-1.6 3.6-3.6V16.2c0-3-3-4-3-6.2Z" fill="#c3d4a6" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M19 25c3.2 1.7 6.8 1.7 10 0v12.8c0 2-1.6 3.6-3.6 3.6h-2.8c-2 0-3.6-1.6-3.6-3.6Z" fill="#9cb87a"/><path d="M28 13.5c2.2-1 4.3-.2 5 1.4-1.7 1.1-3.9.9-5-1.4Z" fill="#8ca86e" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>`,
  // ── 디저트·음료 ──
  cake: `<path d="M10 27l14-8 14 8v7c0 1.4-6 4-14 4s-14-2.6-14-4Z" fill="#ecd0a0" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M10 27c0-1.4 6-4 14-4s14 2.6 14 4-6 4-14 4-14-2.6-14-4Z" fill="#f6efe0" stroke="${OL}" stroke-width="1.6"/><path d="M11 32c4 2.4 8 2.4 12 0" stroke="#d9925a" stroke-width="1.4" fill="none"/><path d="M24 12c-2.5 2.5 0 4.5 0 6 0-1.5 2.5-3.5 0-6Z" fill="${CORAL}"/><circle cx="24" cy="18.5" r="3" fill="${CORAL}" stroke="${OL}" stroke-width="1.3"/>`,
  coffee: `<rect x="14" y="12" width="20" height="5.5" rx="2.2" fill="#b98a5a" stroke="${OL}" stroke-width="2"/><path d="M16 17.5h16l-1.7 20.5c-.16 2.1-1.9 3.5-4 3.5h-4.6c-2.1 0-3.84-1.4-4-3.5Z" fill="#f2ead9" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M17.2 24h13.6l-.5 7c-.16 2.1-1.9 3-3.7 3h-5.2c-1.8 0-3.54-.9-3.7-3Z" fill="#c9a06a"/><path d="M22 5.5c-1.6 1.6 1 2.6 0 4.3M26 5.5c-1.6 1.6 1 2.6 0 4.3" stroke="#c3bbaa" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  icecream: `<path d="M18 23h12l-4.8 17c-.4 1.5-1.8 1.5-2.4 0Z" fill="#e0c187" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M20.5 26.5l5 5M27 26l-5 5" stroke="#c2a05a" stroke-width="1.2"/><circle cx="24" cy="16.5" r="9" fill="#e7b7c2" stroke="${OL}" stroke-width="2"/><circle cx="24" cy="9" r="2.2" fill="${CORAL}" stroke="${OL}" stroke-width="1.3"/>${face(24, 17, 3, 1.9)}`,
  cheese: `<path d="M8 31L35 18c2.2-1 4.5.4 4.5 2.6v7.4c0 1.6-1.1 2.8-2.8 2.8H10.5C8.8 38.2 7 35 8 31Z" fill="#e6c161" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><circle cx="31" cy="28" r="2.2" fill="#d3a742"/><circle cx="21" cy="30" r="1.7" fill="#d3a742"/><circle cx="14" cy="32" r="1.3" fill="#d3a742"/>${face(30, 23.5, 2.6, 1.6)}`,
  // ── 심볼 ──
  heart: `<path d="M24 41C8 29.5 8.5 16.5 16 13c4.3-2 8 .9 8 4.6 0-3.7 3.7-6.6 8-4.6 7.5 3.5 8 16.5-8 28Z" fill="#dd918a" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>${face(24, 22.5, 4.3, 2.4)}`,
  star: `<path d="M24 5.5l5.2 10 11.2 1.6-8.1 7.8 1.9 11.1L24 32.6 13.8 38l1.9-11.1L7.6 19l11.2-1.6z" fill="#d7b15f" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="23.5" r="1.8" fill="${EYE}"/><path d="M26.5 23.5q1.6 0 2.8-1.4" stroke="${EYE}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M21.5 27.5q2 1.8 4 0" stroke="${EYE}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  sparkle: `<path d="M24 5C25.4 17 30.8 22.6 44 24 30.8 25.4 25.4 31 24 44 22.6 31 17.2 25.4 4 24 17.2 22.6 22.6 17 24 5Z" fill="#d7b15f" stroke="${OL}" stroke-width="1.9" stroke-linejoin="round"/>`,
  fire: `<path d="M25 5c1 6.5-5 9.5-6.8 15.2-1.2 3.6-.5 7.8 2.2 7.8 2 0 2.8-1.5 2.8-2.8 2.8 1.9 4.8 4.7 4.8 8.5 0 5.7-4.7 9.5-10.5 9.5S7 44.7 7 38c0-8.5 7.6-11.5 7.6-19 0-5.7 5.6-10 10.4-14Z" fill="#cd7a4f" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M24.5 24.5c1.9 1.9 2.9 3.8 2.9 6.2 0 2.8-1.9 4.7-4.7 4.7s-4.7-1.9-4.7-4.7c0-2.7 3.5-3.3 6.5-6.2Z" fill="#e6b26f"/><circle cx="19.5" cy="31.5" r="1.5" fill="${EYE}"/><circle cx="26" cy="31.5" r="1.5" fill="${EYE}"/><path d="M21.6 34.4q1.4 1.3 2.9 0" stroke="${EYE}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  crown: `<path d="M9 35L7 17l9 7 8-11 8 11 9-7-2 18Z" fill="#d7b15f" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><rect x="9" y="34" width="30" height="5.5" rx="2.5" fill="#c49f48" stroke="${OL}" stroke-width="1.6"/><circle cx="24" cy="13.5" r="2.2" fill="#d99cad" stroke="${OL}" stroke-width="1.1"/><circle cx="16" cy="24" r="1.6" fill="#8ca86e"/><circle cx="32" cy="24" r="1.6" fill="#8ca86e"/>`,
  thumb: `<path d="M18 23l5-11.5c.6-1.5 3.2-1 3.1.7l-.5 7.3h8.2c2.1 0 3.6 1.9 3.1 3.9l-2.2 9.6c-.4 1.9-2.1 3.2-4 3.2H18Z" fill="#e6c49c" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><rect x="9" y="23" width="9" height="17.5" rx="3.2" fill="#dab88c" stroke="${OL}" stroke-width="2"/>`,
  // 브이(✌️) — 손가락 두 개 쫙, 반짝이 포인트
  vhand: `<g fill="#e6c49c" stroke="${OL}" stroke-width="2" stroke-linejoin="round"><path d="M20.8 26 16.6 14.2a2.4 2.4 0 0 1 4.5-1.6l3.4 9.6"/><path d="M24.3 22.2l3.4-9.6a2.4 2.4 0 0 1 4.5 1.6L28.1 26"/><path d="M15.8 25.4c-2 1.1-3 3.4-2.3 6 1.2 4.5 4.8 7.6 10.6 7.6 5.3 0 8.9-2.8 10-7 .7-2.7-.3-5-2.3-6.1l-3.4-1.9c-2.9-1.6-6.7-1.6-9.6 0Z"/></g><path d="M9.5 8.5l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1Z" fill="#e0b64e" opacity=".85"/><path d="M39 10l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8Z" fill="#e0b64e" opacity=".7"/>`,
  bow: `<path d="M24 24c-4-7-9-9-13-6-3 2.2-3 8 0 10 4 2.6 9 2 13-4Z" fill="#d99cad" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M24 24c4-7 9-9 13-6 3 2.2 3 8 0 10-4 2.6-9 2-13-4Z" fill="#d99cad" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M24 19v10" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`,
}

// 말풍선(가로 비율 다름)
const YUM_BUBBLE = `<rect x="3" y="3" width="68" height="30" rx="15" fill="#faf6ec" stroke="${OL}" stroke-width="2"/><path d="M24 32l-6 10 15-9Z" fill="#faf6ec" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><text x="37" y="24" text-anchor="middle" font-family="'Gowun Dodum','Pretendard',sans-serif" font-size="16" fill="#c2704a">맛있어</text>`

const BUDDY_IDS = new Set(['bear', 'rabbit', 'catpot', 'chick', 'dog', 'gecko', 'hamster'])

// 스티커 렌더러 — 드로잉 아트는 인라인 SVG, 친구들은 Buddy 그대로.
export function StickerArt({ id, style }) {
  if (BUDDY_IDS.has(id)) {
    return (
      <span style={{ display: 'block', width: '100%', height: '100%', ...style }}>
        <Buddy id={id} size="100%" />
      </span>
    )
  }
  const isBubble = id === 'yum'
  const svg = `<svg viewBox="${isBubble ? '0 0 74 46' : '0 0 48 48'}" width="100%" height="100%" style="display:block">${isBubble ? YUM_BUBBLE : ART[id] || ''}</svg>`
  return <span style={{ display: 'block', width: '100%', height: '100%', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
}

// 스티커별 가로:세로 비율(레이아웃용). 말풍선만 넓다.
export const stickerRatio = (id) => (id === 'yum' ? 74 / 46 : 1)

export const STICKER_GROUPS = [
  { key: 'buddies', label: '친구들', items: ['bear', 'rabbit', 'catpot', 'chick', 'dog', 'gecko', 'hamster'] },
  { key: 'faces', label: '표정', items: ['smile', 'happy', 'hearteyes', 'wink', 'mlem', 'cool', 'surprised', 'boing', 'cry', 'yumface'] },
  { key: 'symbols', label: '심볼', items: ['heart', 'star', 'sparkle', 'fire', 'yum', 'crown', 'thumb', 'vhand', 'bow'] },
  { key: 'ingredients', label: '재료', items: ['tomato', 'egg', 'carrot', 'onion', 'mushroom', 'chili', 'avocado', 'broccoli'] },
  { key: 'tools', label: '도구', items: ['pot', 'pan', 'ladle', 'spatula', 'board', 'cup'] },
  { key: 'sauce', label: '소스', items: ['ketchup', 'soy', 'hotsauce', 'oil'] },
  { key: 'dessert', label: '디저트', items: ['cake', 'coffee', 'icecream', 'cheese'] },
]

// 포스트잇 색 팔레트(차분한 종이 톤) — bg / 접힘 / 글자
export const NOTE_COLORS = [
  { key: 'butter', bg: '#efe4bd', fold: '#ddce9a', text: '#5f5647' },
  { key: 'rose', bg: '#ecd4d1', fold: '#d8bcb8', text: '#6a5350' },
  { key: 'sage', bg: '#dbe3ca', fold: '#c6d1b0', text: '#4f5a44' },
  { key: 'sky', bg: '#d5dee7', fold: '#bfccd8', text: '#47545f' },
]

// 글자 스티커 색 — 사진 위에서도 읽히도록 반대 톤 외곽선(stroke)을 함께 준다
export const TEXT_COLORS = [
  { key: 'white', color: '#ffffff', stroke: 'rgba(55,45,32,.6)' },
  { key: 'charcoal', color: '#463a2c', stroke: 'rgba(255,255,255,.75)' },
  { key: 'coral', color: '#d67f6c', stroke: 'rgba(255,255,255,.7)' },
  { key: 'mustard', color: '#cc9f45', stroke: 'rgba(60,48,30,.5)' },
]

// 글자 스티커 글씨체 — 또박체(고운돋움) / 귀염체(개구체). 오프라인이면 다음 폰트로 자연 대체.
export const TEXT_FONTS = [
  { key: 'gowun', label: '또박체', family: "'Gowun Dodum','Pretendard',sans-serif", weight: 800 },
  { key: 'gaegu', label: '귀염체', family: "'Gaegu','Gowun Dodum','Pretendard',sans-serif", weight: 700 },
]

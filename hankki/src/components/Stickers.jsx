import { useState, useEffect } from 'react'
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
  // 이목구비 공식: 크고 동그란 눈 + 흰 반짝이(하이라이트) + 작은 입 = 아기같이 귀엽게
  smile: fb(`<circle cx="17.2" cy="23" r="3.1" fill="${EYE}"/><circle cx="16.2" cy="21.9" r="1.1" fill="#fff" opacity=".92"/><circle cx="30.8" cy="23" r="3.1" fill="${EYE}"/><circle cx="29.8" cy="21.9" r="1.1" fill="#fff" opacity=".92"/><path d="M20.5 29.4q3.5 3 7 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/>`),
  happy: fb(`<path d="M13.8 23.4q3.4 -4 6.8 0" fill="none" stroke="${EYE}" stroke-width="2.5" stroke-linecap="round"/><path d="M27.4 23.4q3.4 -4 6.8 0" fill="none" stroke="${EYE}" stroke-width="2.5" stroke-linecap="round"/><path d="M19.8 28.6c1.7 3.8 6.7 3.8 8.4 0Z" fill="${CORAL}" stroke="${EYE}" stroke-width="1.5" stroke-linejoin="round"/>`),
  hearteyes: fb(`<path d="M17.4 18.8c-2.5-1.8-5.5.4-5.5 2.9 0 2.5 3.2 4.2 5.5 6.3 2.3-2.1 5.5-3.8 5.5-6.3 0-2.5-3-4.7-5.5-2.9Z" fill="${CORAL}"/><path d="M30.6 18.8c-2.5-1.8-5.5.4-5.5 2.9 0 2.5 3.2 4.2 5.5 6.3 2.3-2.1 5.5-3.8 5.5-6.3 0-2.5-3-4.7-5.5-2.9Z" fill="${CORAL}"/><path d="M21 30.6c1.4 2.4 4.6 2.4 6 0Z" fill="${CORAL}" stroke="${EYE}" stroke-width="1.4" stroke-linejoin="round"/>`),
  wink: fb(`<circle cx="17.2" cy="23" r="3.1" fill="${EYE}"/><circle cx="16.2" cy="21.9" r="1.1" fill="#fff" opacity=".92"/><path d="M27.2 23.4q3.2 2.8 6.4 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/><path d="M20.5 29.2q3.5 3.2 7 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/>`),
  surprised: fb(`<circle cx="17.4" cy="22.4" r="4.4" fill="#fff" stroke="${EYE}" stroke-width="1.6"/><circle cx="17.8" cy="23" r="2.3" fill="${EYE}"/><circle cx="16.9" cy="21.6" r="1" fill="#fff"/><circle cx="30.6" cy="22.4" r="4.4" fill="#fff" stroke="${EYE}" stroke-width="1.6"/><circle cx="30.2" cy="23" r="2.3" fill="${EYE}"/><circle cx="29.3" cy="21.6" r="1" fill="#fff"/><ellipse cx="24" cy="31.6" rx="2.2" ry="2.7" fill="${EYE}"/><path d="M12 13.5l2.4 1.8M36 13.5l-2.4 1.8" stroke="${EYE}" stroke-width="1.7" stroke-linecap="round"/>`),
  boing: fb(`<circle cx="17.2" cy="22.4" r="5" fill="#fff" stroke="${EYE}" stroke-width="1.6"/><circle cx="18.6" cy="23.4" r="2.2" fill="${EYE}"/><circle cx="17.7" cy="22.2" r=".9" fill="#fff"/><circle cx="30.8" cy="22.4" r="5" fill="#fff" stroke="${EYE}" stroke-width="1.6"/><circle cx="29.4" cy="23.4" r="2.2" fill="${EYE}"/><circle cx="28.5" cy="22.2" r=".9" fill="#fff"/><path d="M20.5 31.2q1.75 -1.6 3.5 0 q1.75 1.6 3.5 0" fill="none" stroke="${EYE}" stroke-width="1.9" stroke-linecap="round"/>`),
  // 엉엉 — 눈물을 크고 진하게, 입은 삐죽삐죽
  cry: fb(`<path d="M13.8 21.8q4 3.8 8 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/><path d="M26.2 21.8q4 3.8 8 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/><path d="M15.1 24.6c-2.5 3.8-2.5 7.4 0 7.4s2.5-3.6 0-7.4Z" fill="#6ea7dd" stroke="#4f86bd" stroke-width="1.1" stroke-linejoin="round"/><circle cx="14.2" cy="28.8" r="1" fill="#fff" opacity=".85"/><path d="M32.9 24.6c-2.5 3.8-2.5 7.4 0 7.4s2.5-3.6 0-7.4Z" fill="#6ea7dd" stroke="#4f86bd" stroke-width="1.1" stroke-linejoin="round"/><circle cx="32" cy="28.8" r="1" fill="#fff" opacity=".85"/><path d="M20.5 32.4q1.75 -2 3.5 0 q1.75 2 3.5 0" fill="none" stroke="${EYE}" stroke-width="2" stroke-linecap="round"/>`),
  yumface: fb(`<path d="M13.8 23.4q3.4 -3.8 6.8 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/><path d="M27.4 23.4q3.4 -3.8 6.8 0" fill="none" stroke="${EYE}" stroke-width="2.4" stroke-linecap="round"/><path d="M19.5 28.8q4.5 3.6 9 0" fill="none" stroke="${EYE}" stroke-width="2.3" stroke-linecap="round"/><path d="M26.2 30.2c2.5 2 5-.3 3.6-2.4" fill="none" stroke="${CORAL}" stroke-width="2.6" stroke-linecap="round"/>`),
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

const BUDDY_IDS = new Set([
  'bear', 'rabbit', 'catpot', 'chick', 'dog', 'gecko', 'hamster', 'penguin',
  'lbear', 'lchick', 'lcat', 'lgecko', 'lrabbit', 'ldog', 'lhamster',
  'fchick', 'fbear', 'frabbit', 'fcat', 'fdog', 'fgecko', 'fhamster',
])

// ── 🎁 부엌 식구들 (낱개 투명 PNG 스티커) — 3세트: 오리지널·캔디·라인 ──
// 창업자가 그린 전신 캐릭터를 배경제거(플러드필)한 스티커. SVG가 아니라 PNG라 <img>로 렌더.
// id 규칙: kf_<name>(오리지널) · kf_c_<name>(캔디) · kf_l_<name>(라인).
const KF_URLS = import.meta.glob(
  ['../assets/stickers/kitchen/*.png', '../assets/stickers/candy/*.png', '../assets/stickers/line/*.png'],
  { eager: true, query: '?url', import: 'default' },
)
const kfU = (folder, name) => KF_URLS[`../assets/stickers/${folder}/${name}.png`]
const KF_NAMES = [
  ['gomgom', '곰곰'], ['toto', '토토'], ['nyangi', '냄비냥이'], ['ppyak', '삐약'],
  ['mongmong', '몽몽'], ['hodu', '호두'], ['pengpeng', '펭펭'], ['hamzzi', '햄찌'],
]
const KF_RATIO = {
  kitchen: { gomgom: 622 / 834, toto: 612 / 923, nyangi: 606 / 858, ppyak: 643 / 847, mongmong: 685 / 885, hodu: 607 / 844, pengpeng: 741 / 976, hamzzi: 625 / 868 },
  candy: { gomgom: 384 / 462, toto: 334 / 494, nyangi: 302 / 449, ppyak: 376 / 461, mongmong: 368 / 432, hodu: 383 / 430, pengpeng: 339 / 415, hamzzi: 303 / 418 }, // 2026-07-20 원본 시트에서 전체 재컷(소품·꼬리 잘림 수정)
  line: { gomgom: 350 / 486, toto: 330 / 457, nyangi: 318 / 476, ppyak: 357 / 470, mongmong: 364 / 445, hodu: 408 / 453, pengpeng: 311 / 422, hamzzi: 336 / 437 },
}
export const KITCHEN_FAMILY = {}
for (const [folder, prefix] of [['kitchen', 'kf_'], ['candy', 'kf_c_'], ['line', 'kf_l_']]) {
  for (const [name, label] of KF_NAMES) {
    KITCHEN_FAMILY[prefix + name] = { src: kfU(folder, name), ratio: KF_RATIO[folder][name], label }
  }
}

// 🍬 캔디 친구들 표정·포즈 확장(2026-07-22) — 대표 8포즈는 위 kf_c_(고화질) 그대로 쓰고, 여기 캐릭터당 1포즈씩 더한다.
// (다꾸본 낱개컷: docs/stickers/낱개/캔디-표정 → src/assets/stickers/candy2. 나머지 포즈는 다음 업뎃 때 추가.)
const CC_URLS = import.meta.glob('../assets/stickers/candy2/*.png', { eager: true, query: '?url', import: 'default' })
const CC_RATIO = {
  // cc17(곰)·cc20(고양이) = 모자 잘린 컷 → 온전한 컷으로 교체(2026-07-23), cc40(펭) = 하단 흰조각 제거. 비율 갱신.
  cc17: 0.9035, cc42: 0.9669, cc11: 0.7771, cc20: 0.9077,
  cc13: 0.9939, cc30: 0.9679, cc47: 0.7937, cc40: 0.8632,
}
const CC_LABEL = {
  cc17: '곰곰', cc42: '삐약', cc11: '토토', cc20: '냄비냥이',
  cc13: '몽몽', cc30: '호두', cc47: '햄찌', cc40: '펭펭',
}
for (const key of Object.keys(CC_RATIO)) {
  KITCHEN_FAMILY[key] = { src: CC_URLS[`../assets/stickers/candy2/${key}.png`], ratio: CC_RATIO[key], label: CC_LABEL[key] }
}
export const KITCHEN_IDS = new Set(Object.keys(KITCHEN_FAMILY))

// ── 🍱 음식·재료·데코·라이프 사진스티커 (2026-07-22 요리별 대량, blob 깨끗컷) ──
// 정적 투명 PNG(모션·효과 없음). docs/stickers/음식라이프-이모티콘-2507/낱개 → src/assets/stickers/photo.
// key 접두어 = 그룹(fh한식·fb분식·fy양식·fj중식·fi일식·fd디저트·ig재료·dc데코·ch응원·lf라이프·cp곰펭). 요리 탭 서브칩으로 씀.
const PHOTO_URLS = import.meta.glob('../assets/stickers/photo/*.png', { eager: true, query: '?url', import: 'default' })
const PHOTO_RATIO = {
  fh_hnc03: 1.0867, fh_htj13: 1.1181, fh_hnc04: 1.1256, fh_hnb01: 1.0252, fh_htj01: 1.0218, fh_hnc01: 1.1092, fh_hnc10: 1.2081, fh_hnc06: 1.3209, fh_hnb08: 1.2864, fh_htj05: 1.1992,
  // 🍚 한식 완성요리 뉴세트(2026-07-23·37종, 진짜 음식같은 아이콘 → 레시피 썸네일 자동매칭용). docs/stickers/음식아이콘-2507
  fh_k01: 1.0883, fh_k02: 1.0958, fh_k03: 1.0226, fh_k04: 1.1515, fh_k05: 1.0338, fh_k06: 1.1154,
  fh_k07: 1.1579, fh_k08: 1.0068, fh_k09: 0.9868, fh_k10: 0.9667, fh_k11: 1.0616, fh_k12: 1.1014,
  fh_k13: 1.2678, fh_k14: 1.2983, fh_k15: 1.2282, fh_k16: 1.1719, fh_k17: 1.2075, fh_k18: 1.3575,
  fh_k19: 1.2076, fh_k20: 1.12, fh_k21: 1.081, fh_k22: 1.2083, fh_k23: 1.0573, fh_k24: 1.125,
  fh_k25: 0.9708, fh_k26: 0.9903, fh_k27: 1.0448, fh_k28: 1.1984, fh_k29: 1.2222, fh_k30: 1.1858,
  fh_k31: 1.1295, fh_k32: 1.1714, fh_k33: 1.1942, fh_k34: 1.1079, fh_k35: 1.2179, fh_k36: 1.0281, fh_k37: 1.2418,
  // 🍝🥢🍣🥟 양식·중식·일식·분식 완성요리 뉴세트(2026-07-23·51종, blob 깨끗컷 → 레시피 썸네일 자동매칭용). docs/stickers/음식아이콘-2507
  fy_y01: 1.2961, fy_y02: 1.3017, fy_y03: 1.3047, fy_y04: 1.3289, fy_y05: 1.2026, fy_y06: 0.9962, fy_y07: 1.309,
  fy_y08: 1.3229, fy_y09: 1.1826, fy_y10: 1.3094, fy_y11: 1.1717, fy_y12: 1.348, fy_y13: 1.3519, fy_y14: 1.2465,
  fj_c01: 1.093, fj_c02: 1.0632, fj_c03: 1.2887, fj_c04: 1.3207, fj_c05: 1.1492, fj_c06: 1.3038, fj_c07: 1.0909,
  fj_c08: 1.0989, fj_c09: 1.272, fj_c10: 1.098, fj_c11: 1.3013, fj_c12: 1.1225, fj_c13: 1.3106, fj_c14: 1.322,
  fi_j01: 1.2933, fi_j02: 1.1, fi_j03: 1.1004, fi_j04: 1.0625, fi_j05: 1.4286, fi_j06: 1.0855, fi_j07: 1.2402,
  fi_j08: 1.187, fi_j09: 1.2403, fi_j10: 1.4222, fi_j11: 1.346, fi_j12: 1.0106, fi_j13: 1.0337, fi_j14: 1.25,
  fb_b01: 0.7125, fb_b02: 0.9547, fb_b03: 1.2362, fb_b04: 1.1811, fb_b05: 1.256, fb_b06: 1.3054, fb_b07: 1.1975, fb_b08: 1.1749, fb_b09: 0.8229,
  // 🍱 예시 레시피 보충 세트(2026-07-24·15종, 덮밥·포케·불고기·전골·스무디 등 → 예시 레시피 전용 아이콘). 창업자 생성·blob 컷.
  fe_01: 0.9641, fe_02: 0.9643, fe_03: 0.9563, fe_04: 1.0079, fe_05: 1.0316, fe_06: 0.9057, fe_07: 0.9094, fe_08: 1.0612,
  fe_09: 1.0458, fe_10: 1.0833, fe_11: 1.0333, fe_12: 1.042, fe_13: 1.1209, fe_14: 1.038, fe_15: 0.6739,
  // 🍱 예시 보충 2차(2026-07-24·6종, 창업자 생성). 카레·크루키·불닭냉면·요거트아이스크림·김치볶음밥·참치김치감태주먹밥.
  fe_16: 1.1336, fe_17: 1.573, fe_18: 1.0853, fe_19: 0.9571, fe_20: 1.1475, fe_21: 1.3462,
  // 🍱 예시 보충 3차(2026-07-24·2종, 창업자 생성). 대구뭉티기·육회(생고기).
  fe_22: 1.1475, fe_23: 1.157,
  // 🍱 예시 보충 4차(2026-07-24·4종, 창업자 생성). 새우크림파스타·양배추돼지고기볶음·치즈샌드위치·로제파스타.
  fe_24: 1.3084, fe_25: 1.2963, fe_26: 1.2727, fe_27: 1.2903,
  // 🍱 예시 보충 5차(2026-07-24·24종, 창업자 생성·빈칸 리스트 완성). 국탕·반찬·면·간식·양식·일중식·디저트.
  fe_28: 1.0811, fe_29: 1.1523, fe_30: 1.0256, fe_31: 1.0938, fe_32: 1.2444, fe_33: 1.3725,
  fe_34: 1.2844, fe_35: 1.2963, fe_36: 1.2785, fe_37: 1.1475, fe_38: 1.129, fe_39: 1.3397,
  fe_40: 1.3023, fe_41: 1.3023, fe_42: 1.2963, fe_43: 1.3084, fe_44: 1.3084, fe_45: 1.3397,
  fe_46: 1.1523, fe_47: 1.393, fe_48: 1.0332, fe_49: 0.9714, fe_50: 0.9107, fe_51: 1.2903,
  // 🍱 예시 보충 6차(2026-07-25·2종, 창업자 생성). 묵은지파스타·베이컨크림파스타(얼굴 있는 새 버전 — 옛 faceless fy_y03 대체).
  fe_52: 1.4213, fe_53: 1.393,
  // 🌏 태국·베트남 음식 9종 (2026-07-26 창업자 제공, item④) — 쌀국수·뿌팟퐁커리·분짜·월남쌈·분보싸오·스프링롤·쏨땀·반미·반쎄오 (팟타이는 기존 fe_09)
  fe_54: 1.0986, fe_55: 1.3114, fe_56: 1.1702, fe_57: 1.227, fe_58: 1.0825, fe_59: 1.1957, fe_60: 1.2737, fe_61: 1.3118, fe_62: 1.3311,
  // 🍱 추가 32종 (2026-07-28 창업자 제공) — 인식 안 되던 것 대응(덮밥·조림·치킨·전복·볶음) + 범용 조리법(무침·국·장류) + 양식·중식·빵·음료
  fe_63: 1.1307, fe_64: 1.2319, fe_65: 1.1559, fe_66: 1.1271, fe_67: 1.0831, fe_68: 1.096, fe_69: 1.1221, fe_70: 1.1151,
  fe_71: 1.2179, fe_72: 1.1358, fe_73: 1.2628, fe_74: 1.0994, fe_75: 1.1875, fe_76: 1.1869, fe_77: 1.1903, fe_78: 1.1626,
  fe_79: 1.058, fe_80: 1.0909, fe_81: 1.0565, fe_82: 1.0326, fe_83: 1.1378, fe_84: 1.2798, fe_85: 1.0067, fe_86: 1.1857,
  fe_87: 1.2238, fe_88: 1.3448, fe_89: 1.2462, fe_90: 1.1103, fe_91: 1.169, fe_92: 1.0828, fe_93: 0.6398, fe_94: 0.5788,
  fe_95: 1.2092, fe_96: 1.2125, // 간장장아찌·고추장장아찌 (2026-07-28 창업자 제공)
  fb_bun03: 1.4272, fb_bun08: 1.3436, fb_bun05: 1.1297, fb_bun04: 1.4844, fb_bun02: 0.9498, fb_bun11: 1.351,
  fy_yng01: 1.335, fy_yng02: 1.3465, fy_yng05: 0.9915, fy_yng07: 1.3614, fy_yng09: 1.2161, fy_yng12: 1.3594,
  fj_jsk03: 1.1511, fj_jsk01: 1.0866, fj_jsk04: 1.3317, fj_jsk05: 1.1705, fj_jsk02: 1.0714, fj_jsk15: 1.3058,
  fi_isk03: 1.3454, fi_isk05: 1.0705, fi_isk02: 1.1087, fi_isk07: 1.2735, fi_isk06: 1.0921, fi_isk13: 1.0338,
  ig_jae06: 0.9892, ig_jae08: 1.1215, ig_jae10: 1.0221, ig_jae19: 1.3432, ig_jae20: 1.024, ig_jae07: 1.1017, ig_jae09: 1.1304, ig_jae03: 1.2457, ig_jae12: 1.2778, ig_frb01: 1.0508, ig_frb03: 0.9623, ig_frb07: 0.8879, ig_frb13: 0.9945, ig_ggi03: 1.0711, ig_ggi16: 1.2129, ig_hsm01: 1.1898,
  dc_dhb04: 1.0957, dc_dhb01: 0.9561, dc_dsy04: 0.8326, dc_dhb10: 1.1893, dc_dhb06: 0.8061, dc_dhb09: 1.1214, dc_dhb14: 1.0, dc_dhb05: 1.3728, dc_dsy16: 1.3971, dc_dsy13: 1.1591, dc_dhb13: 1.0158, dc_dmn02: 0.9219, dc_dmn06: 1.0207, dc_dmn07: 1.1012,
  // 🎀 꾸미기 소품(데코) 보강 (2026-07-26, 창업자 "꾸미기 재료 늘리자" · 적당히 — 나머지 하트·심볼·미니는 다음 업뎃용으로 라이브러리 보존) — 프레임·메모(dma) 10 + 여름 제철 귀여운 식재료(꾸미기용) 5
  dc_dma01: 0.9635, dc_dma03: 1.0362, dc_dma05: 1.1588, dc_dma06: 1.0841, dc_dma07: 1.1805, dc_dma10: 1.0047, dc_dma11: 1.5723, dc_dma13: 1.0795, dc_dma14: 1.2406, dc_dma16: 0.9613,
  ig_frb02: 0.8451, ig_frb04: 1.0149, ig_frb08: 0.4769, ig_jcb19: 0.9741, ig_jae16: 1.4359,
  // 🌈 귀여운 컬러 소품 4 (창업자 픽: 무지개·꽃다발·풍선 + 케이크) — 범용·화사
  dc_nd08: 1.3063, dc_nd01: 0.7226, dc_nd05: 0.6505, dc_nd16: 1.1921,
  // 🎀 창업자 시트 신규 반영 (2026-07-29) — 데코 10·프레임 5·워시테이프 4
  dn_ribbon: 1.0988, dn_cherry: 0.94, dn_peach: 0.9522, dn_star: 1.2455, dn_sparkle: 1.1803,
  dn_shoot: 1.2453, dn_coffee: 0.9728, dn_plant: 0.6419, dn_bunting: 1.7484, dn_sachet: 0.8829,
  fn_speech: 1.2273, fn_daisy: 0.9889, fn_bow: 0.9414, fn_night: 1.0327, fn_gingham: 1.0419,
  ws_pinkdot: 1.3596, ws_greendot: 1.731, ws_bluedot: 1.4091, ws_pinkstripe: 1.8105,
  // 🍳 주방도구 (2026-07-29) — 라이프 탭이 운동용품뿐이라 요리앱과 안 맞았다.
  tk_apron: 0.8407, tk_hat: 0.9762, tk_pot_pink: 1.3318, tk_pot_green: 1.2639, tk_bowl: 0.9553,
  tk_batter: 1.0119, tk_board_knife: 0.9924, tk_board: 0.8468, tk_cup: 1.057, tk_scale: 0.8356,
  tk_mitt: 0.7828, tk_mitt_purple: 0.8537, tk_book: 1.2, tk_bag: 0.8034, tk_basket: 0.9278,
  tk_salt: 1.2769, tk_sugar: 0.8462, tk_clip: 1.0339,
  // 🎗 창업자 직접 제작 마스킹테이프 (2026-07-29, 시트 3장 36종 중 17종 반영)
  //   A=얇은 외곽선·아기자기 / B=굵은 외곽선·여름 / C=외곽선 없음·깔끔
  wt_ribbon_pink: 2.5758, wt_dot_lavender: 2.4624, wt_tulip: 2.4824, wt_ribbon_red: 2.4854, wt_cherry: 2.509,
  wt_flower_mauve: 2.4477, wt_grid_black: 2.4737, wt_lemon: 2.7927, wt_gingham: 2.821, wt_cloud: 2.7975,
  wt_watermelon: 2.8924, wt_daisy_lavender: 2.7515, wt_daisy_yellow: 2.7862, wt_ribbon_lavender: 2.8442,
  wt_heart_cream: 2.8291, wt_grid_white: 3.3119, wt_sparkle: 3.0929,
  // 🖼 손그림 프레임 48종 (창업자 제공 시트 14장 → 낱개 110 중 6세트 선별, 2026-07-29 반영).
  //    ⛔뺀 것 = B·C·E(선이 너무 연해 캔버스에서 안 보임) · J(투명·얇음) · D(연함)
  //             · K(F와 **픽셀 단위로 완전 동일** — 평균차 0.0으로 확인) · 여름B(상단 글자 쓰레기 + 다른 IP 펭귄).
  //    ⚠️ 원본 294~418px 래스터라 아주 크게 키우면 흐려진다. 소품(꽃·리본·조개)이 그려져 있어 SVG로는 못 만드는 것들이라 PNG로 간다.
  //       순수 도형 프레임이 필요하면 벡터 `FRAMES`(fr_pola·scallop·round·arch)를 쓸 것.
  pf_f01: 0.624, pf_f02: 0.7018, pf_f03: 0.7243, pf_f04: 0.791, pf_f05: 0.6624, pf_f06: 0.7527, pf_f07: 0.8394, pf_f08: 0.7696,
  pf_i01: 0.6652, pf_i02: 0.7878, pf_i03: 0.8045, pf_i04: 0.925, pf_i05: 0.7407, pf_i06: 0.846, pf_i07: 0.8987, pf_i08: 0.8719,
  pf_h01: 0.8303, pf_h02: 0.8685, pf_h03: 0.8421, pf_h04: 0.9344, pf_h05: 0.8488, pf_h06: 0.8759, pf_h07: 1.0419, pf_h08: 0.9807,
  pf_a01: 0.5694, pf_a02: 0.5857, pf_a03: 0.5954, pf_a04: 0.6209, pf_a05: 0.6471, pf_a06: 0.6673, pf_a07: 0.7079, pf_a08: 0.6724,
  pf_g01: 0.7841, pf_g02: 0.74, pf_g03: 0.7379, pf_g04: 0.8589, pf_g05: 0.7495, pf_g06: 0.8782, pf_g07: 0.8303, pf_g08: 0.8472,
  pf_s01: 0.9273, pf_s02: 0.8976, pf_s03: 0.7668, pf_s04: 1.1058, pf_s05: 0.8662, pf_s06: 0.8608, pf_s07: 0.8273, pf_s08: 0.9487,
  // 🏖 여름 세트 43종 (2026-07-29 창업자 재제작분) — **시트 한 장에 12~16컷**이라 컷당 231~341px.
  //    앞서 90~100컷 시트로 만든 172종이 컷당 85px밖에 안 돼 캔버스에서 뭉갰던 것(당일 롤백)의 제대로 된 대체본.
  //    ⛔ 뺀 것 = 선글라스 낀 곰 1컷(셰프모자·계란후라이 앞치마가 없다 = **우리 꼬르곰이 아님**)
  //             · 수채톤 세트 12컷(같은 구성 중복 + 우리 마감과 톤이 다름 → `docs/_아껴둠`).
  sf_01: 0.769, sf_02: 0.9273, sf_03: 0.9241, sf_04: 0.8947, sf_05: 0.8503, sf_06: 1.0069, sf_07: 0.8229, sf_08: 0.9965,
  sf_09: 0.9341, sf_10: 0.9278, sf_11: 0.9526, sf_12: 1.0075, sf_13: 0.8328, sf_14: 0.7855, sf_15: 0.8861, sf_16: 0.9601,
  sk_01: 0.9015, sk_02: 1.0468, sk_03: 0.996, sk_04: 0.987, sk_05: 0.9665, sk_06: 0.9289, sk_07: 1.0628, sk_08: 0.9742,
  sk_09: 1.0039, sk_10: 0.9881, sk_11: 0.622, sk_12: 1.5886, sk_13: 1.0308, sk_14: 1.2443, sk_15: 1.3454, sk_16: 1.9456,
  st_01: 0.9018, st_02: 0.8929, st_03: 0.8899, st_04: 0.8988, st_05: 1.0365, st_06: 0.897, st_07: 1.0132, st_08: 0.9381,
  st_09: 0.9967, st_10: 1.0466, st_11: 1.1154,
  // 🏖 여름 프레임 재제작 12컷 (2026-07-30) — 옛 `sf_` 16컷을 대체한다. 아래 그룹 주석 참고.
  pf_sm01: 0.9155, pf_sm02: 0.9627, pf_sm03: 1.0416, pf_sm04: 0.9157, pf_sm05: 1.0327, pf_sm06: 0.9789,
  pf_sm07: 0.965, pf_sm08: 0.9337, pf_sm09: 1.027, pf_sm10: 1.0432, pf_sm11: 0.8318, pf_sm12: 0.9849,
  // ⛔ **여기 있던 여름다꾸 37(`sd_`)·미니아이콘 92(`mn_`)·파스텔 43(`ps_`)은 도로 뺐다** (2026-07-29 당일 롤백).
  //    창업자 폰 제보: "우리 꾸미기에 추가한 데코에 여름 스티커들 다 깨져."
  //    **원인 = 소스 해상도 부족.** 원본 시트(1254px) 한 장에 아이템이 90~100개라 하나당 긴변이
  //    여름다꾸 85px·미니 94px·파스텔 141px 뿐인데, 캔버스엔 `s=0.22` → **1080×0.22 = 238px**로 올라간다.
  //    즉 **2~3배 확대** = 뭉갬. 업스케일해도 없는 정보는 안 살아난다.
  //    ⚠️ 이건 우리 문서에 이미 있던 규칙 위반이다 — `docs/자랑공유-캐릭터리뉴얼.md`:
  //       "작게 붙는 소품·음식·효과 = **25컷 격자**(200~300px 충분). 6컷↑ 금지(흐림)."
  //    ⚠️ 검수도 잘림·투명만 봤고 **해상도를 안 봤다**. 서랍(피커)은 56px로 작게 보여 멀쩡해 보였다.
  //    → 이제 `npm run smoke`가 `scripts/check-sticker-res.mjs`로 **캔버스 표시크기보다 작은 소스**를 먼저 잡는다.
  //    낱개 컷은 `docs/stickers/…/낱개-*`에 그대로 있다. **창업자가 25컷 격자로 다시 뽑아주면 되살린다.**
  //             (우리 글자 스티커는 한글 48종이라 톤이 안 맞는다).
  //             (창업자가 글자 스티커에서 숫자를 뺀 것과 같은 이유 — 레꾸는 표지 한 장이라 순서를 매길 자리가 없다).
  // 🏖 여름 한정 (2026-07-29) — 곰펭 여름 씬 6 + 여름 마테 6
  sm_gom_beach: 0.733, sm_gom_tube: 0.8545, sm_gom_bbq: 0.7644, sm_gom_chair: 0.9671,
  sm_peng_beach: 0.9866, sm_peng_tube: 0.9893, sm_peng_shop: 0.7049, sm_peng_night: 0.894,
  sm_duo_watergun: 1.2209, sm_duo_tube: 1.1469, sm_duo_watermelon: 0.9643, sm_duo_icecream: 1.0781,
  wt_wave: 2.7939, wt_shell: 2.8182, wt_palm: 2.7605, wt_stripe_blue: 2.9423,
  wt_starfish: 2.8457, wt_wave_mint: 2.8282,
  // 🍂 가을·추석·핼러윈·크리스마스 (창업자 2026-07-30 제공 112컷) — 실제 PNG 크기로 계산
  au_b01: 0.8667, au_b02: 0.8985, au_b03: 0.8163, au_b04: 0.9513, au_b05: 0.9532, au_b06: 0.8279,
  au_b07: 0.8417, au_b08: 0.8285, au_b09: 0.8825, au_b10: 0.8296, au_b11: 0.9242, au_b12: 0.8576,
  au_b13: 0.6927, au_b14: 0.5966, au_b15: 0.8915, au_b16: 0.9555, au_b17: 0.7652, au_b18: 0.6462,
  au_t01: 2.9949, au_t02: 3.0573, au_t03: 3.0515, au_t04: 3.0306, au_t05: 2.9746, au_t06: 2.955,
  au_s01: 0.9938, au_s02: 0.9752, au_s03: 0.9753, au_s04: 1.0,
  au_i01: 1.3945, au_i02: 1.0703, au_i03: 0.9415, au_i04: 0.9015, au_i05: 1.2535, au_i06: 1.2308,
  au_i07: 1.2521, au_i08: 1.0912, au_i09: 1.3051, au_i10: 1.137, au_i11: 0.9398, au_i12: 0.983,
  au_i13: 0.6944, au_i14: 1.1274, au_i15: 0.7067, au_i16: 0.5123, au_i17: 0.8148, au_i18: 0.9199,
  au_i19: 0.9713, au_i20: 0.82,
  cs_b01: 0.7309, cs_b02: 0.7152, cs_b03: 1.0491, cs_b23: 0.9734, cs_b29: 0.9071,
  cs_i01: 1.0079, cs_i08: 1.7105, cs_i14: 0.9775,
  hw_01: 1.1072, hw_04: 0.9547, hw_09: 0.8632,
  hw_13: 0.9522,
  xm_01: 0.7759, xm_02: 0.718, xm_03: 0.9472, xm_04: 0.615,
  ch_che01: 0.7928, ch_che04: 1.4278, ch_che06: 1.0683, ch_che08: 1.3098, ch_che05: 0.9231,
  lf_fit12: 1.6056, lf_fit11: 1.487, lf_fit08: 1.2486, lf_fit07: 1.2056, lf_fit02: 1.089, lf_fit13: 0.6872, lf_fit14: 1.1852, lf_fit06: 0.662,
  cp_cpf01: 0.8659, cp_cpf02: 0.9215, cp_cpf03: 0.8136, cp_cpf04: 0.8604, cp_cpf05: 0.9968, cp_cpf06: 1.0358, cp_cpf07: 0.9139, cp_cpf08: 0.8815,
  // 🐻🐧 뉴 물결 곰펭(2026-07-23·정본) — 곰4·펭5·콤비4. 띠부씰(흰 다이컷 테두리·2026-07-23) 반영 → 비율 갱신.
  // (plain 원본은 docs/stickers/곰펭-물결-신규-2507/낱개/ 아카이브. cp_cpf 옛 파이팅은 저장표지 호환용으로만 남김.)
  gp_gomft: 0.8171, gp_gomtb: 0.8312, gp_gomv: 0.8265, gp_gomhi: 0.8891, gp_pengft: 0.7982, gp_pengtb: 0.7902, gp_pengv: 0.8336, gp_penghi: 0.82, gp_pengym: 0.7945, gp_duohi: 1.0608, gp_duoht: 1.0253, gp_duoh5: 1.1873, gp_duotb: 1.1303,
  // ✏️ 글자 스티커 (2026-07-29) — 다꾸의 절반이 글자인데 앱엔 응원 문구 6개뿐이고
  //    숫자·요일은 0개였다. 창업자가 스타일별로 18장 뽑아준 것 중 **우리 마감과 같은 4장**만 채택
  //    (진갈색 굵은 외곽선 + 파스텔 채움 + 흰 다이컷). 라인 계열은 톤도 다르고 자동 오림도
  //    안 돼서(속 흰색이 배경과 이어짐) 심플 다꾸 세트로 미룸. → docs/stickers/글자-창업자-2507/
  tw_haenaem: 1.2683, tw_night: 1.2686, tw_first: 1.1859, tw_5min: 1.3789, tw_again: 1.4286,
  tw_wow: 1.3384, tw_salty: 1.2747, tw_better: 1.3665, tw_really: 1.5054, tw_daebak: 1.1381,
  tw_today: 1.1008, tw_success: 1.2969, tw_more: 1.1255, tw_tasty: 1.3571, tw_welldone: 0.9597,
  tw_fav: 1.0923, tw_honey: 1.0894, tw_easy: 1.1358, tw_hearty: 1.3762, tw_mom: 1.1472,
  tw_nexttime: 0.9755, tw_fail: 1.5283, tw_yummy: 1.2615, tw_best: 1.068, tw_ourhankki: 1.3762,
  tw_goodday: 1.4591,
  tn_mon: 1.0227, tn_tue: 1.0274, tn_wed: 1.032, tn_thu: 1.0182, tn_fri: 1.0411,
  tn_sat: 1.0043, tn_sun: 1.0043, tn_cal: 1.113, tn_ribbon: 1.9451, tn_circle: 0.98,
  ta_right: 1.9118, ta_left: 1.845, ta_up: 0.6372, ta_down: 0.7062, ta_curve: 1.6712,
  ta_loop: 2.1587, ta_dash: 6.7674, ta_wave: 5.2712, ta_leaf: 3.2124, ta_check: 1.0412,
  ta_checkc: 1.0288, ta_star: 1.0321,
}
export const PHOTO_FAMILY = {}
for (const key of Object.keys(PHOTO_RATIO)) {
  PHOTO_FAMILY[key] = { src: PHOTO_URLS[`../assets/stickers/photo/${key}.png`], ratio: PHOTO_RATIO[key] }
}
export const PHOTO_IDS = new Set(Object.keys(PHOTO_FAMILY))

// ── ✨ 캐릭터 움직임(모션) · 효과(양념) — 스티커마다 골라 얹는다 ──
// 전부 그림 1장으로 되는 CSS 모션. item.motion / item.fx 에 key 저장.
//
// ⭐ **팩당 모션 1개 + 효과 1개** (창업자 확정 2026-07-30:
//    *"우리 이모지팩에 새모션1개 넣자. 모션이랑 효과는 유료팩당 1개씩 넣자 그래야 골고루 사지"*)
//    → 팩을 사는 이유가 **그림 몇 장**이 아니라 **그 팩에만 있는 움직임**이 되게 한다.
//      그림은 다른 팩과 비슷해 보일 수 있어도 움직임은 눈에 확 띄고, 한 번 쓰면 계속 쓰게 된다.
//    ⚠️ 그래서 **모션·효과를 한 팩에 몰아 넣지 않는다.** 한 팩에 3개 주면 그 팩만 팔린다.
//    📋 어느 팩이 뭘 받는지 = `docs/모션-효과-설계.md` 배분표. **거기와 여기가 항상 같아야 한다.**
//
// 필드
//   base: true  = 무료(지금 피커에 보임)
//   pack: '키'  = 그 팩을 가진 사람만 보임. 결제 붙기 전까진 CSS·코드만 있고 피커엔 안 뜬다.
//   sheet       = 창업자 시안(2026-07-30) 어느 항목에서 왔는지 — 시안과 코드를 대조할 때 쓴다.
export const MOTIONS = [
  { key: 'none', label: '가만히', base: true },
  { key: 'tongtong', label: '통통', base: true },
  { key: 'tilt', label: '갸웃', base: true },
  // 🏖 출시기념 여름팩 = **무료**라 base:true. "새 모션 1개 넣자"(창업자)의 그 한 개.
  { key: 'wave', label: '찰랑', base: true, pack: 'summer2026', sheet: '02 떠다니기 / 03 액체' },
  { key: 'kong', label: '콩콩', pack: 'spring2027', sheet: '10 인터랙션' },
  { key: 'sway', label: '살랑', pack: 'autumn2026', sheet: '05 바람 ②식물 흔들림' },
  { key: 'float', label: '둥실', pack: 'winter2026', sheet: '02 떠다니기 ①구름 둥실' },
  { key: 'drop', label: '쿵착지', pack: 'cafe', sheet: '06 붙이는 느낌 ③착 붙기' },
  { key: 'nyam', label: '냠냠', pack: 'chuseok2026', sheet: '08 캐릭터 ③냠냠 먹기' },
  { key: 'flutter', label: '펄럭', pack: 'simple', sheet: '05 바람 ③메모지 펄럭' },
]
export const motionClass = (m) => (m && m !== 'none' ? `hk-m-${m}` : '')
export const FX_KINDS = [
  { key: 'none', label: '없음', base: true },
  { key: 'spark', label: '반짝이', base: true },
  { key: 'heart', label: '하트', base: true },
  { key: 'bubble', label: '뽀글', base: true },
  { key: 'water', label: '물방울', base: true, pack: 'summer2026', sheet: '03 액체 ①물방울 맺힘' },
  { key: 'leaf', label: '낙엽', pack: 'autumn2026', sheet: '04 계절 ②낙엽 떨어짐' },
  { key: 'snow', label: '눈', pack: 'winter2026', sheet: '04 계절 ③눈 내리는 효과' },
  { key: 'petal', label: '꽃잎', pack: 'spring2027', sheet: '04 계절 ①꽃잎 흩날림' },
  { key: 'steam', label: '김모락', pack: 'cafe', sheet: '08 캐릭터 ④김이 모락모락' },
  { key: 'food', label: '맛있는것들', pack: 'chuseok2026', sheet: '08 캐릭터 ③냠냠 먹기' },
]
// 🔓 지금 열려 있는 팩 = 없다(결제 미구현 · #54). 팩을 팔기 시작하면 **여기 한 줄만** 채우면
//    피커에 바로 뜬다. 소유 판정을 여기저기 흩뿌리지 않으려고 한 곳에 모아 둔다.
export const ownedPacks = () => new Set()
export const pickableMotions = (owned = ownedPacks()) => MOTIONS.filter((m) => m.base || owned.has(m.pack))
export const pickableFx = (owned = ownedPacks()) => FX_KINDS.filter((f) => f.base || owned.has(f.pack))
// 효과 파티클 — 이모지 대신 뮤트 톤 커스텀 도형(세련되게), 머리 위쪽에 작게 배치.
const SVG_SPARK = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <path d="M12 1.5c.85 6.9 3.6 9.65 10.5 10.5C15.6 12.85 12.85 15.6 12 22.5 11.15 15.6 8.4 12.85 1.5 12 8.4 11.15 11.15 8.4 12 1.5Z" fill="#d8b673" />
  </svg>
)
const SVG_HEART = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <path d="M12 20.3C4.7 14.4 4.9 8.9 8 7.3c2.1-1.05 3.6.95 4 1.55.4-.6 1.9-2.6 4-1.55 3.1 1.6 3.3 7.1-4 13Z" fill="#dc9aa1" />
  </svg>
)
// 🫧 뽀글 — 크림/화이트 반투명 방울(골드·핑크와 안 겹치고 뮤트 배경서도 톡 뜸). 흰 하이라이트로 몽글.
const SVG_BUBBLE = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <circle cx="12" cy="12" r="8.5" fill="rgba(255,255,255,.5)" stroke="#f1e8d6" strokeWidth="2.4" />
    <circle cx="9" cy="9" r="2" fill="#ffffff" />
  </svg>
)
// 💧 물방울 — 여름팩. 물방울 모양(위 뾰족·아래 둥근) + 흰 하이라이트.
const SVG_WATER = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <path d="M12 2.5c4.2 5.4 6.5 8.5 6.5 11.4A6.5 6.5 0 0 1 5.5 13.9C5.5 11 7.8 7.9 12 2.5Z" fill="#a9c6d4" opacity=".9" />
    <ellipse cx="9.6" cy="13.4" rx="1.5" ry="2.1" fill="#ffffff" opacity=".75" />
  </svg>
)
// 🍁 낙엽 — 가을팩. 잎맥 한 줄만(작게 줄면 뭉개져서 디테일은 최소로).
const SVG_LEAF = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <path d="M20 4c0 8.8-5.2 15-11 16-2.6-6 1.4-14.2 11-16Z" fill="#d69a63" />
    <path d="M19 5C14 9 11 13.5 9.4 19.4" stroke="#b57c49" strokeWidth="1.3" fill="none" strokeLinecap="round" />
  </svg>
)
// ❄️ 눈 — 겨울팩. 흰 배경 카드에서도 보이게 **연회색 테두리**를 준다(흰 위 흰색은 안 보인다).
const SVG_SNOW = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <circle cx="12" cy="12" r="7" fill="#ffffff" stroke="#d8e3ea" strokeWidth="2" />
  </svg>
)
// 🌸 꽃잎 — 봄팩. 한쪽으로 휜 타원(꽃잎 한 장).
const SVG_PETAL = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <path d="M12 2.5c6 3.4 8 8.6 5.4 13.2-2.6 4.6-8 5.4-11.4 2.6C2.6 15.4 5 6.6 12 2.5Z" fill="#f0c3ce" />
  </svg>
)
// 맛있는것들 효과 = 우리가 그린 음식(이모지 대신). 캔디 톤이라 캐릭터랑 딱 맞음.
const FX_FOOD_URLS = import.meta.glob('../assets/stickers/fx/*.png', { eager: true, query: '?url', import: 'default' })
const FX_FOOD = ['strawberry', 'burger', 'cupcake', 'cake', 'icecream', 'ramen'].map((n) => FX_FOOD_URLS[`../assets/stickers/fx/${n}.png`])
// [x%, y%, delay] — spark/heart 는 머리 위쪽에 모으고 작게. food 는 머리 위로 크게 떠다님.
const FX_DEF = {
  spark: { size: 16, items: [[15, -2, 0], [50, -10, .5], [85, 0, .9], [28, 16, 1.3], [72, 14, .7]], node: SVG_SPARK },
  heart: { size: 16, items: [[25, 0, 0], [63, -10, .8], [45, 12, 1.5]], node: SVG_HEART },
  bubble: { size: 15, items: [[15, 2, 0], [48, -10, .9], [80, -1, .5], [32, 15, 1.7], [66, 12, 1.2]], node: SVG_BUBBLE },
  food: { size: 26, items: [[12, -10, 0], [84, -14, .9], [30, -24, 1.6], [66, -22, 2.3]], food: true },
  steam: { size: 11, items: [[42, 6, 0], [52, 2, .9], [47, 10, 1.7]], puff: true },
  // ⬇️ 아래 넷은 **떨어지는** 효과 — 스티커 위쪽에서 출발해 아래로 지나간다.
  //    그래서 y 를 음수(머리 위)로 두고, 낙하는 CSS(`hk-fx-<kind>`)가 맡는다.
  //    ⚠️ 화면 전체에 뿌리지 않는다 — 스티커 한 장 크기 안에서만. 표지 전체에 눈을 뿌리면
  //       스티커가 아니라 '앱 효과'가 되고, 여러 장 붙였을 때 서로 겹쳐 지저분해진다.
  water: { size: 13, items: [[22, -14, 0], [58, -22, .8], [80, -10, 1.6], [40, -6, 2.2]], node: SVG_WATER },
  leaf: { size: 18, items: [[18, -20, 0], [55, -28, 1.1], [82, -16, 2.1]], node: SVG_LEAF },
  snow: { size: 12, items: [[14, -18, 0], [42, -26, .7], [68, -14, 1.4], [88, -24, 2.1]], node: SVG_SNOW },
  petal: { size: 15, items: [[20, -18, 0], [52, -26, .9], [78, -12, 1.8]], node: SVG_PETAL },
}
export function StickerFx({ kind }) {
  const def = FX_DEF[kind]
  if (!def) return null
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {def.items.map(([x, y, d], i) => (
        <span key={i} className={`hk-fx hk-fx-${kind}`}
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: def.size, height: def.size, lineHeight: 1, animationDelay: `${d}s` }}>
          {def.food
            ? <img src={FX_FOOD[i % FX_FOOD.length]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            : def.puff ? null : def.node}
        </span>
      ))}
    </span>
  )
}

// ── 스티커 색 바꾸기(리컬러) — '곱셈기' ──
// 단일 몸통색 스티커만 대상. 기본색 → 고른 색으로 문자열 치환(ART 원본은 안 건드림).
// 눈·볼·외곽선은 유지되고 몸통색만 바뀐다. 대상이 아닌 스티커는 color를 무시.
export const STICKER_DEFAULT = { heart: '#dd918a', star: '#d7b15f', sparkle: '#d7b15f', bow: '#d99cad', vhand: '#e6c49c' }
// 🎨 PNG 데코 리컬러 대상 — 크레용 외곽선 + 단일 포인트 컬러 손그림(하트·별·리본·튤립·달·음표 등).
// 캔버스로 '채도 있는 포인트 픽셀'의 색조(hue)만 팔레트 색으로 치환 → 검정 외곽선·흰색은 그대로 유지.
export const RECOLOR_PNG = new Set([
  'dc_dhb04', 'dc_dhb01', 'dc_dsy04', 'dc_dhb10', 'dc_dhb06', 'dc_dhb09', 'dc_dhb14',
  'dc_dhb05', 'dc_dsy16', 'dc_dsy13', 'dc_dhb13', 'dc_dmn02', 'dc_dmn06', 'dc_dmn07',
])
// 🖼 벡터 프레임 — 꼬르곰·펭펭 넣고 꾸미는 범용 액자틀(창업자 item③). SVG라 무한 확대해도 안 깨짐(PNG 프레임은 크게 키우면 흐려져서 벡터로 만듦). def 색만 리컬러(SVG hex 치환), 카드·창·그림자는 뉴트럴 고정. 프레임 먼저 놓고 위에 꼬르곰·펭펭 얹으면 '액자 속 캐릭터'.
const FR_C = '#c98f7f' // 프레임 기본색(= 리컬러 대상 hex)
export const FRAMES = {
  fr_pola: { vb: '0 0 88 104', ratio: 88 / 104, def: FR_C, art:
    '<rect x="11" y="12" width="68" height="84" rx="4" fill="#00000010"/>'
    + '<rect x="8" y="8" width="70" height="86" rx="4.5" fill="#fffdf9" stroke="#e7e1d5" stroke-width="1.3"/>'
    + '<rect x="15" y="16" width="56" height="56" rx="2.5" fill="#f3efe6"/>'
    + `<g transform="rotate(-7 44 9)"><rect x="28" y="3" width="32" height="11" rx="1.5" fill="${FR_C}" opacity="0.82"/></g>` },
  fr_scallop: { vb: '0 0 100 100', ratio: 1, def: FR_C, art:
    `<path d="M89.0,50.0 Q92.7,60.5 84.5,68.1 Q82.9,79.2 72.2,82.1 Q65.6,91.1 54.7,88.7 Q44.7,93.7 36.2,86.5 Q25.0,86.2 20.8,75.9 Q11.0,70.4 12.1,59.3 Q6.0,50.0 12.1,40.7 Q11.0,29.6 20.8,24.1 Q25.0,13.8 36.2,13.5 Q44.7,6.3 54.7,11.3 Q65.6,8.9 72.2,17.9 Q82.9,20.8 84.5,31.9 Q92.7,39.5 89.0,50.0 Z" fill="${FR_C}"/>`
    + '<circle cx="50" cy="50" r="37" fill="#fffdf9"/>'
    + `<circle cx="50" cy="50" r="37" fill="none" stroke="${FR_C}" stroke-width="2" stroke-dasharray="1.5 4" stroke-linecap="round" opacity="0.7"/>` },
  fr_round: { vb: '0 0 100 90', ratio: 100 / 90, def: FR_C, art:
    '<rect x="7" y="7" width="86" height="76" rx="13" fill="#fffdf9"/>'
    + `<rect x="7" y="7" width="86" height="76" rx="13" fill="none" stroke="${FR_C}" stroke-width="3"/>`
    + `<rect x="12.5" y="12.5" width="75" height="65" rx="9" fill="none" stroke="${FR_C}" stroke-width="1.3" opacity="0.6"/>`
    + `<path d="M50 3.2c1.4-2 4.6-1 4.6 1.4 0 1.8-2.6 3.6-4.6 5-2-1.4-4.6-3.2-4.6-5 0-2.4 3.2-3.4 4.6-1.4z" fill="${FR_C}"/>` },
  fr_arch: { vb: '0 0 84 104', ratio: 84 / 104, def: FR_C, art:
    '<path d="M10,82 L10,40.0 A32.0,32.0 0 0 1 74,40.0 L74,82 Q74,96 60,96 L24,96 Q10,96 10,82 Z" fill="#fffdf9"/>'
    + `<path d="M10,82 L10,40.0 A32.0,32.0 0 0 1 74,40.0 L74,82 Q74,96 60,96 L24,96 Q10,96 10,82 Z" fill="none" stroke="${FR_C}" stroke-width="3"/>`
    + `<path d="M15,81 L15,40.0 A27.0,27.0 0 0 1 69,40.0 L69,81 Q69,91 59,91 L25,91 Q15,91 15,81 Z" fill="none" stroke="${FR_C}" stroke-width="1.2" opacity="0.55"/>` },
}
export const RECOLORABLE = new Set([...Object.keys(STICKER_DEFAULT), ...RECOLOR_PNG, ...Object.keys(FRAMES)])
// 색 팔레트 — 뮤트 톤 전 스펙트럼(라이트→미드→진한). 2026-07-26 정리+보강(창업자 "색이 다 비슷비슷" → 겹치는 웜핑크 3개 정리, 청록·테라코타 미드 + 파인·네이비·와인 진한 뮤트 추가). '기본'은 color 비우면 원래색.
// ⚠️ 진한 색(밝기<0.5)은 recolorToDataURL이 채움 밝기를 목표 쪽으로 끌어내려(음영 유지) '진한 뮤트'로 렌더. SVG 스티커는 hex 그대로 채움.
export const STICKER_COLORS = [
  { key: 'coral', color: '#d78e86' },   // 코랄(라이트 웜핑크)
  { key: 'rose', color: '#cc7d96' },    // 로즈(선명한 핑크 — coral과 구분)
  { key: 'gold', color: '#c9a250' },    // 머스타드 골드
  { key: 'olive', color: '#8a9a63' },   // 올리브
  { key: 'teal', color: '#4f948c' },    // 청록(미드·신규)
  { key: 'sky', color: '#7b9ac6' },     // 하늘
  { key: 'lilac', color: '#a98cc4' },   // 라일락
  { key: 'brown', color: '#a9754f' },   // 테라코타 브라운(미드·신규)
  { key: 'pine', color: '#3f6b4e' },    // 파인그린(진한·신규)
  { key: 'navy', color: '#3f5878' },    // 네이비(진한·신규)
  { key: 'wine', color: '#83495d' },    // 와인(진한·신규)
  { key: 'charcoal', color: '#514840' },// 차콜(진한 뉴트럴)
  { key: 'cream', color: '#e6dcc7' },   // 크림(라이트 뉴트럴)
]

// ── PNG 리컬러 (캔버스 색조 치환) ──
// HSL 변환(colorsys HLS와 동일). 채도 있는 포인트 픽셀만 목표 색조로, 밝기(음영)는 보존.
function rgbToHls(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  let h = 0, s = 0
  if (mx !== mn) {
    const d = mx - mn
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return [h, l, s]
}
function hue2rgb(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p }
function hlsToRgb(h, l, s) {
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)]
}
function hexToHls(hex) {
  return rgbToHls(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255)
}
const RECOLOR_CACHE = new Map() // `${src}|${color}` → dataURL (한 번만 계산)
function recolorToDataURL(img, hex) {
  const thl = hexToHls(hex), th = thl[0], tl = thl[1], ts = thl[2]
  const cv = document.createElement('canvas')
  cv.width = img.naturalWidth; cv.height = img.naturalHeight
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const idata = ctx.getImageData(0, 0, cv.width, cv.height)
  const d = idata.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 20) continue
    const hls = rgbToHls(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255)
    const l = hls[1], s = hls[2]
    if (s > 0.16 && l > 0.16 && l < 0.93) { // 포인트 컬러만(검정 외곽선·흰색 제외)
      const ns = Math.min(0.9, Math.max(ts * 0.9, s * 0.55))
      // 진한 뮤트 색(목표 밝기<0.5)은 채움 밝기를 목표 쪽으로 끌어내려 '진한' 느낌 — 내부 음영(명암 차)은 유지, 밝게는 안 함. 라이트 색은 기존 그대로(밝기 보존).
      const nl = tl < 0.5 ? Math.max(0.12, Math.min(l, tl + (l - 0.72) * 0.55)) : l
      const rgb = hlsToRgb(th, nl, ns)
      d[i] = rgb[0] * 255; d[i + 1] = rgb[1] * 255; d[i + 2] = rgb[2] * 255
    }
  }
  ctx.putImageData(idata, 0, 0)
  return cv.toDataURL('image/png')
}
// color 있으면 캔버스로 리컬러(캐시), 없으면 원본. 계산 전엔 원본을 잠깐 보여줌.
function RecolorImg({ src, color, className }) {
  const [out, setOut] = useState(() => (color ? (RECOLOR_CACHE.get(src + '|' + color) || src) : src))
  useEffect(() => {
    if (!color) { setOut(src); return }
    const key = src + '|' + color
    const hit = RECOLOR_CACHE.get(key)
    if (hit) { setOut(hit); return }
    let alive = true
    const img = new Image()
    img.onload = () => {
      let url
      try { url = recolorToDataURL(img, color) } catch (e) { url = src }
      RECOLOR_CACHE.set(key, url)
      if (alive) setOut(url)
    }
    img.onerror = () => { if (alive) setOut(src) }
    img.src = src
    return () => { alive = false }
  }, [src, color])
  return <img src={out} alt="" draggable={false} className={className} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
}

// 스티커 렌더러 — 드로잉 아트는 인라인 SVG, 친구들은 Buddy 그대로. color 주면 몸통색 리컬러.
export function StickerArt({ id, color, style, motion }) {
  const kf = KITCHEN_FAMILY[id]
  if (kf) {
    // 🎁 부엌 식구들 — 투명 PNG. motion 클래스로 움직임(기본 통통). 아래를 딛고 튀는 느낌(origin bottom).
    return (
      <span style={{ display: 'block', width: '100%', height: '100%', ...style }}>
        <img
          src={kf.src}
          alt={kf.label}
          draggable={false}
          className={motionClass(motion === undefined ? 'tongtong' : motion)}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </span>
    )
  }
  const pf = PHOTO_FAMILY[id]
  if (pf) {
    // 🍱 음식·재료·데코 = 정적 / 🐻🐧 **친구들 탭 전부** = 모션 적용. 음식류는 motion 미설정→motionClass '' 자동 정적.
    // 🎨 데코 PNG(RECOLOR_PNG)는 color 주면 캔버스로 포인트색만 팔레트 색조로 치환.
    // ⚠️ **`gp_` 접두어로 판정하던 걸 그룹(친구들 탭)으로 바꿨다** (창업자 2026-07-30
    //    *"여름의꼬르곰펭펭(모션,효과 없어)"*). 여름 곰펭은 `sm_`, 가을 곰펭은 `au_b` 라서
    //    접두어 검사에 안 걸려 **캐릭터인데 안 움직였다.** 앞으로 새 계절 곰펭이 또 다른
    //    접두어로 들어와도 **친구들 탭에 넣기만 하면** 자동으로 움직인다.
    //    📌 교훈: **이름 규칙(접두어)으로 분류하지 말고, 이미 있는 분류(탭)를 쓴다.**
    const cls = motionClass(motion === undefined && FRIEND_IDS.has(id) ? 'tongtong' : motion)
    return (
      <span style={{ display: 'block', width: '100%', height: '100%', ...style }}>
        {color && RECOLOR_PNG.has(id)
          ? <RecolorImg src={pf.src} color={color} className={cls} />
          : <img src={pf.src} alt="" draggable={false} className={cls} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />}
      </span>
    )
  }
  const fr = FRAMES[id]
  if (fr) {
    // 🖼 벡터 프레임 — def 색만 리컬러(hex 치환). preserveAspectRatio 기본(meet)이라 어떤 칸에도 비율 유지.
    let art = fr.art
    if (color) art = art.split(fr.def).join(color)
    const svg = `<svg viewBox="${fr.vb}" width="100%" height="100%" style="display:block">${art}</svg>`
    return <span style={{ display: 'block', width: '100%', height: '100%', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
  }
  if (BUDDY_IDS.has(id)) {
    return (
      <span style={{ display: 'block', width: '100%', height: '100%', ...style }}>
        <Buddy id={id} size="100%" plate={false} />
      </span>
    )
  }
  const isBubble = id === 'yum'
  let art = isBubble ? YUM_BUBBLE : ART[id] || ''
  if (color && STICKER_DEFAULT[id]) art = art.split(STICKER_DEFAULT[id]).join(color)
  const svg = `<svg viewBox="${isBubble ? '0 0 74 46' : '0 0 48 48'}" width="100%" height="100%" style="display:block">${art}</svg>`
  return <span style={{ display: 'block', width: '100%', height: '100%', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
}

// 스티커별 가로:세로 비율(레이아웃용). 말풍선은 넓고, 부엌 식구들은 세로가 길다.
export const stickerRatio = (id) => (id === 'yum' ? 74 / 46 : FRAMES[id] ? FRAMES[id].ratio : KITCHEN_FAMILY[id] ? KITCHEN_FAMILY[id].ratio : PHOTO_FAMILY[id] ? PHOTO_FAMILY[id].ratio : 1)

const kfItems = (prefix) => KF_NAMES.map(([n]) => prefix + n)
// ── 스티커 피커 그룹 (2026-07-22 재편) — 다꾸 리서치 기반 6탭 IA + 음식 서브칩 ──
// tab: 'buddies'(친구들)·'food'(음식,서브칩)·'deco'(데코)·'life'(라이프). notetext/bgtape는 에디터에서 별도.
// chip: 음식 탭의 요리별 서브칩 라벨. 옛 약한 SVG(표정·재료·도구·소스·디저트)는 피커에서 제외(코드는 남아 저장표지 호환).
export const STICKER_GROUPS = [
  // 🐻🐧 꼬르곰·펭펭 (물결 정본·2026-07-23) — 친구들 탭 맨 위 = 우리 애기들이 메인. 곰4·펭5·콤비4.
  {
    key: 'gompeng', tab: 'buddies', label: '꼬르곰·펭펭', items: [
      'gp_gomft', 'gp_gomtb', 'gp_gomv', 'gp_gomhi',
      'gp_pengft', 'gp_pengtb', 'gp_pengv', 'gp_penghi', 'gp_pengym',
      'gp_duohi', 'gp_duoht', 'gp_duoh5', 'gp_duotb',
    ],
  },
  { key: 'kitchen', tab: 'buddies', label: '부엌 식구들', items: kfItems('kf_') },
  // ⚠️ 캔디(kf_c_)·라인(kf_l_)은 **부엌 식구들과 같은 8캐릭터를 색·선만 바꾼 것**이라
  //    셋을 다 두면 친구들 탭 41종 중 24종이 같은 애들이었다(창업자 2026-07-29 "넣을 거
  //    넣고 뺄 거 빼자"). 오리지널만 남긴다. 자산·PHOTO 매핑은 그대로라 **저장된 표지는
  //    계속 정상 렌더**되고, 나중에 업데이트 소재로 되살릴 수 있다(피커 등록만 하면 됨).
  //    📅 **라인(kf_l_) = '심플 다꾸' 세트로 나중에 함께 출시**(창업자 2026-07-29 확정).
  //       선만 있는 그림체라 무선 파스텔 자산(`파스텔무선-창업자-2507`)과 묶으면 한 세트가 된다.
  // 🍱 음식 (요리별 서브칩)
  // 🥕 재료 — 여름 제철 귀여운 식재료(꾸미기용) 몇 개 추가(복숭아·수박·체리·옥수수·가지). 분기별 제철로 교체 예정(사계절용은 픽스).
  { key: 'f_ing', tab: 'food', label: '재료', items: ['ig_frb02', 'ig_frb04', 'ig_frb08', 'ig_jcb19', 'ig_jae16', 'ig_jae06', 'ig_jae08', 'ig_jae10', 'ig_jae19', 'ig_jae20', 'ig_jae07', 'ig_jae09', 'ig_jae03', 'ig_jae12', 'ig_frb01', 'ig_frb03', 'ig_frb07', 'ig_frb13', 'ig_ggi03', 'ig_ggi16', 'ig_hsm01'] },
  // ✨ 데코 (색 바꾸는 SVG 심볼 유지 + 새 데코 PNG + 응원)
  // 🏖 꼬르곰·펭펭의 여름 (2026-07-29) — 콤비 4(물총·튜브·수박·아이스크림) + 곰 솔로 4 + 펭 솔로 4.
  //   ⚠️ 처음엔 에피소드 씬컷을 넣었는데 **배경(하늘·바다·모래)이 통째로 붙어 있어** 표지에
  //      작게 붙이면 네모 배경째 올라갔다. 창업자가 **흰 배경으로 다시 뽑아** 줘서 전부 교체했다.
  { key: 'buddies_summer', tab: 'buddies', season: 'summer', label: '꼬르곰·펭펭의 여름', items: ['sm_duo_watergun', 'sm_duo_tube', 'sm_duo_watermelon', 'sm_duo_icecream', 'sm_gom_tube', 'sm_gom_beach', 'sm_gom_bbq', 'sm_gom_chair', 'sm_peng_tube', 'sm_peng_beach', 'sm_peng_shop', 'sm_peng_night'] },
  // ═══════════════════════════════════════════════════════════════════════════
  // 🧹 데코 탭 정리 (2026-07-30) — 창업자 *"걍 이미 넣어놓은거 넘 많으니까 정리해서 무료출시하자"*
  //
  // 정리 전 = 그룹 18개·201컷이 **종류가 아니라 들어온 순서**로 쌓여 있었다. 실제 문제 3개:
  //   ① **프레임이 7그룹에 흩어짐**(73컷) — 프레임 하나 찾으려고 서랍 7군데를 뒤져야 했다.
  //      게다가 이름이 제각각이라 같은 종류로 안 보였다(`프레임(꼬르곰·펭펭 넣기)` · `여름 프레임`).
  //   ② **`여름 한정` 10컷은 사실 마스킹테이프**(`wt_`) — 이름만 보면 뭔지 알 수 없었다.
  //   ③ **`데코` 28컷** — 탭 이름과 똑같아서 이름이 아무 정보를 주지 않았다.
  //
  // → **이름을 「종류 · 갈래」로 통일하고, 종류끼리 붙여 놓았다.** 자산은 하나도 안 늘리고 안 뺐다.
  //   ⚠️ `key` 는 바꾸지 않았다 — 코치마크·스크롤 위치가 참조한다(꾸민 결과물은 아이템 id 로 저장돼 무관).
  //   ⚠️ 배열 순서는 **같은 계절 안에서만** 의미가 있다. 제철 그룹은 `seasonRank` 로 위로 올라간다(안정 정렬).
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 사철 ──
  // 🎨 색 바꾸기 = 맨 위 고정. 색을 바꿀 수 있다는 걸 여기서 알아채야 나머지도 눌러본다(발견성).
  // 🎨 **색 바꾸기 = 한 그룹으로 모았다** (창업자 2026-07-30 *"각 탭별로 리컬러는 한정판 아래 배치"*)
  //   예전엔 SVG 심볼 5컷만 이 그룹이었고 **리컬러 PNG 13컷은 `소품` 속에 흩어져** 있었다.
  //   `recolor: true` 를 달면 **탭 안에서 한정판(제철) 바로 아래**로 정렬된다(`DecorEditor` 참고).
  { key: 'deco_recolor', tab: 'deco', recolor: true, label: '색 바꾸기', items: ['heart', 'star', 'sparkle', 'bow', 'vhand', 'dc_dhb04', 'dc_dhb01', 'dc_dsy04', 'dc_dhb10', 'dc_dhb06', 'dc_dhb14', 'dc_dhb05', 'dc_dsy16', 'dc_dsy13', 'dc_dhb13', 'dc_dmn02', 'dc_dmn06', 'dc_dmn07'] },
  // 🖼 프레임 — 손그림 프레임 48종 (창업자 시트 14장 → 낱개 110 중 6세트 선별, 2026-07-29).
  //   선별 기준 = **캔버스에 얹었을 때 실제로 보이는가.** 연한 선(B·C·E·J·D)은 배경에 묻혀 안 보였고,
  //   K는 F와 픽셀 단위로 완전 같았다(평균차 0.0). 여름B는 상단 글자가 깨져 있고 다른 IP 펭귄이 섞여 제외.
  //   ⚠️ 순서 = 진한 것 먼저. 첫 그룹이 제일 또렷해야 "프레임 = 예쁜 것"으로 읽힌다.
  // 🖼 **기본 프레임 = 한 그룹, 모양이 전부 다른 11컷** (창업자 2026-07-30)
  //   *"전체에서 봄느낌 나는거 다빼고. 기본위주로 12컷 맞춰서 넣자"* → 원래 49컷이라 정원(24)의 두 배였다.
  //   *"좋아. 겹치는건 제외하고"* → 아치·물결·캡슐·클립·팔각이 **같은 모양으로 두세 번씩** 있었다.
  //   *"굳이 글씨쓰기로 나눌필요는없을 것 같아"* → 두 그룹을 하나로 합쳤다.
  //
  //   ⚠️ **왜 나눠져 있었나 = 이름이 실제와 안 맞았다.** 창업자가 눈으로 잡아냈다
  //   (*"내부 투명도 있고, 흰색도 있어"* · *"아래도 투명이 2컷이 있어(글씨쓰기에 들어있지만)"*).
  //   픽셀로 재보니 `글씨 쓰기` 8컷 중 **3컷(`i02`·`i03`·`i06`)이 실제로는 안이 뚫려 있었다.**
  //   → **그룹 이름을 성질로 믿으면 안 된다.** 안이 뚫렸는지 흰 판인지는 그림마다 다르고,
  //     둘 다 쓸모가 있다(뚫린 것 = 사진이 비침 / 흰 판 = 글씨 얹기). 그래서 **섞어서 한 그룹.**
  //
  //   ⭐ 고른 기준 = **모양이 하나도 안 겹치게** — 아치·물결·캡슐·클립보드·클립사각·팔각·
  //     따옴표·책갈피·스캘럽·태그·카드 = 11가지. 같은 모양의 다른 버전은 전부 보관으로 뺐다.
  //   ⚠️ 뺀 것도 **파일·비율은 남긴다** — 이미 그걸로 꾸며 저장한 표지가 깨지면 안 된다.
  //   ⚠️ 창업자 폰 제보 2026-07-30 *"기본프레임 투명 이래ㅋㅋ 못씀ㅋㅋ"* →
  //   내가 **"흰 판이 필요하다"로 잘못 알아듣고** 뺐던 흰 판 4컷을 되살렸다가, 창업자 정정
  //   *"프레임뚫린게 지저분하게 잘려서 못쓴다는 의미였어 흰판이 필요하다는게 아니라"* → **되돌렸다.**
  //   진짜 원인은 **가장자리가 계단처럼 각져 있던 것**(알파가 0/255뿐) → `tools/soften-edges.py` 로 해결.
  //   📌 교훈: **증상을 내 가설로 바꿔 읽지 말 것.** 먼저 픽셀을 재고, 그다음 고친다.
  { key: 'deco_pf_bold', tab: 'frame', label: '기본', items: ['pf_f01', 'pf_f02', 'pf_f05', 'pf_f06', 'pf_i06', 'pf_f08', 'pf_a06', 'pf_a08', 'pf_i07', 'pf_a07', 'pf_a05'] },
  // 🖼 글씨 얹기 좋은 손그림 프레임 (2026-07-29) — 위 48종과 별개로 큼직한 것들.
  // 🌸 **소품·꽃 계열 = 기본에서 빼서 봄으로 미뤘다** (창업자 2026-07-30
  //    *"이거 다 이쁜데… 그냥 풀기엔 너무 이쁘네. 소품+꽃은 봄에 주자. 이건 다 빼고"*
  //    *"전체에서 봄느낌 나는거 다빼고"* · *"식물이나 예쁜것들은 봄에 레이스랑 같이 하면 예쁠 듯"*)
  //    리본·꽃·잎이 붙은 것들이라 **봄 분위기와 딱 맞고**, 봄 세트가 그때까지 0컷이었다.
  //    ⚠️ 지금이니까 뺄 수 있다 — **아직 공개 전(테스터 12명)이라 일반 유저는 본 적이 없다.**
  //    공개 뒤였다면 *"한 번 준 것은 빼앗지 않는다"* 에 걸려 못 뺐다.
  //    ⚠️ 23컷이라 계절 정원(12)을 넘는다 — **봄이 올 때 레이스와 함께 12컷으로 고른다**(8개월 여유).
  { key: 'deco_pf_soft', tab: 'frame', season: 'spring', from: '2027-03-01', label: '소품·꽃', items: ['pf_h01', 'pf_h02', 'pf_h03', 'pf_h04', 'pf_h05', 'pf_h06', 'pf_h07', 'pf_h08', 'pf_g01', 'pf_g02', 'pf_g03', 'pf_g04', 'pf_g05', 'pf_g06', 'pf_g07', 'pf_g08', 'pf_f03', 'pf_f04', 'pf_f07', 'pf_a01', 'pf_a03', 'pf_i03', 'pf_i04'] },
  { key: 'deco_frame2', tab: 'frame', label: '말풍선·격자', items: ['fn_speech', 'fn_bow', 'fn_daisy', 'fn_gingham', 'fn_night'] },
  // 📷 벡터 프레임 (2026-07-26 · item③) — 꼬르곰·펭펭 얹어 꾸미는 액자틀. SVG라 크게 키워도 안 깨짐 + 🎨색 바꾸기.
  //   (⚠️캐릭터명 = 꼬르곰·펭펭 풀네임, '곰펭' 금지)
  // 🏷 라벨은 **데코 탭의 `색 바꾸기` 그룹과 같은 이름**이어야 한다 (창업자 2026-07-30
  //    *"프레임에서 리컬러프레임->색바꾸기로 바꿔줘 (데코랑 이름 같아야지)"*).
  //    같은 기능인데 탭마다 다른 이름이면 **같은 기능인 줄 모른다.** '리컬러'는 우리끼리 쓰는 말이고,
  //    유저가 보는 글자는 `색 바꾸기` 하나로 통일한다.
  { key: 'deco_vframe', tab: 'frame', recolor: true, label: '색 바꾸기', items: ['fr_pola', 'fr_scallop', 'fr_round', 'fr_arch'] },
  // 🎀 소품 — 리본·체리·별·커피 등 얹는 작은 것들. (옛 이름 `데코` = 탭 이름과 겹쳐서 정보가 0이었다)
  // 🎀 사철 소품 = **26컷.** 28컷에서 **딱 2컷만** 뺐다.
  //   ⛔ 뺀 2컷 (창업자 2026-07-30 *"암것도 없는 말풍선이랑 별에 무지개달린거만 뺄까?"*):
  //      `dc_dhb09` 빈 말풍선 — **`응원·말풍선` 그룹에 이미 말풍선이 6컷** 있어 겹쳤다.
  //      `dn_shoot` 별똥별+무지개 — 별이 이미 둘(`dn_star`·`dc_dhb01`)이고 무지개도 따로 있다(`dc_nd08`).
  //
  //   ⭐⭐ **소품은 프레임과 성질이 달라서 많아도 된다** (창업자 *"스티커는 꾸미기라 사실 많아도..
  //   여기저기 붙이기 좋아서"*). **프레임은 한 장에 하나만 깔아서** 많으면 고르기가 힘들지만,
  //   **소품은 여러 개를 여기저기 붙이는 재료라 가짓수가 많을수록 좋다.** → 정원도 다르게 잡았다
  //   (기본 프레임 24 vs 기본 소품 32 · `scripts/asset-map.mjs`).
  //
  //   ⚠️⚠️ **내가 두 번 잘못 뺐다가 되돌렸다.**
  //   ① "겹친다"고 `dc_dsy04`(작은 반짝)·`dc_dhb10`(작은 리본)·`dc_dmn07`(하트 말풍선)을 빼고
  //      `dc_dhb06`(튤립)·`dc_dhb14`(클로버)를 봄으로 보냈다 → 창업자 *"네가 뺀거 다 리컬러아냐?"*
  //      **맞았다.** 5컷 전부 `RECOLOR_PNG`(색 바꾸기 14컷 세트)라 빼면 세트가 9컷으로 쪼그라든다.
  //      ⭐**색을 바꿀 수 있으면 작은 리본과 큰 리본은 겹치는 게 아니라 다른 물건이다.**
  //   ② `dc_nd01` 꽃다발·`dn_plant` 화분을 봄으로 보냈다 → *"사실 나는 꽃다발 자주쓰는데 ㅎㅎ"*
  //      **실제로 쓰는 것보다 센 근거는 없다.** 둘 다 사철로 되돌렸다.
  //   📌 **교훈: 모양이 비슷하다고 빼기 전에 ①어떤 기능에 묶여 있는지 ②실제로 쓰는지 본다.**
  { key: 'deco_png', tab: 'deco', label: '소품', items: ['dn_ribbon', 'dn_cherry', 'dn_peach', 'dn_star', 'dn_sparkle', 'dn_coffee', 'dn_plant', 'dn_bunting', 'dn_sachet', 'dc_nd08', 'dc_nd01', 'dc_nd05', 'dc_nd16'] },
  // 📝 메모·라벨 (2026-07-26) — 다꾸 감성 손그림 메모지·라벨. 글씨 얹어 꾸미기 좋음(작게~중간 크기용, 크게 키우면 흐려짐).
  { key: 'deco_frame', tab: 'deco', label: '메모·라벨', items: ['dc_dma01', 'dc_dma03', 'dc_dma06', 'dc_dma05', 'dc_dma10', 'dc_dma14', 'dc_dma16', 'dc_dma07', 'dc_dma13', 'dc_dma11'] },
  { key: 'deco_cheer', tab: 'deco', label: '응원·말풍선', items: ['ch_che06', 'ch_che08', 'ch_che01', 'ch_che04', 'ch_che05', 'yum'] },
  // 🎗 마스킹테이프 — 창업자 직접 제작(2026-07-29). 배경·테이프 탭의 CSS 마테와 달리 갈색 외곽선 +
  //   양끝 톱니가 있는 '스티커 워시'라 다꾸 감성이 그대로 산다. **사철 쓰는 것만 12종 엄선**("엄선해서 12개").
  //   여름 무늬(레몬·수박·구름·파도·조개…)는 아래 `마스킹테이프 · 여름` 으로 뺐다.
  { key: 'deco_washi', tab: 'tape', label: '마스킹테이프', items: ['wt_ribbon_pink', 'wt_dot_lavender', 'wt_daisy_lavender', 'wt_ribbon_lavender', 'wt_flower_mauve', 'wt_grid_white', 'wt_heart_cream', 'wt_daisy_yellow', 'wt_sparkle', 'wt_cherry', 'wt_ribbon_red', 'wt_grid_black'] },

  // ── 여름 (2026-07-29 재제작) ── 제철(6~8월)이면 데코 탭 맨 위로 올라간다.
  //   ⚠️ 철이 지나도 **숨기지 않는다** — 순서만 밀린다. 유저가 쓰던 걸 못 찾게 되는 게 더 나쁘다.
  // 🏖 여름 프레임 = **24컷 → 12컷** (창업자 2026-07-30 *"여름 프레임 정리하자. 너무 많아…"*)
  //   ⛔ 뺀 것 ①`sf_` 16컷 — **`nsf_` 재제작본과 1:1로 같은 그림의 흐린 구버전**이었다(270~317px,
  //      프레임 표시 크기 626px 기준 2.0~2.3배 확대). 이게 "중복이 많다"의 정체.
  //      게다가 `sf_` 는 `pf_` 접두어가 아니라 **프레임 취급을 못 받아**(s=0.22로 작게, 밑판 배치 안 됨)
  //      쓰려면 손으로 키워야 했고 키우면 뭉갰다. → 재제작본을 **`pf_sm` 으로 넣어 프레임으로 동작**시킨다.
  //   ⛔ 뺀 것 ②`pf_s` 폴라로이드 8컷 — **톤이 다르다.** 우리 건 손그림 파스텔인데 이건 납작한 벡터고
  //      `Summer`·`Good Vibes` **영문 글자**가 박혀 있다(우리 글자 스티커는 전부 한글).
  //   ⭐ 12컷 고른 기준 = **색이 골고루.** 재제작본 16컷 중 하늘·파랑이 7개나 돼서 갈매기·게·복어를 빼고,
  //      노랑이 겹치는 선글라스를 뺐다. 남은 12 = 초록2·핑크2·하늘3·노랑1·베이지2·보라1 + 아치·조개로 모양도 갈림.
  //   ⚠️ **뺀 컷의 파일과 비율은 그대로 둔다** — 이미 그걸로 꾸며 저장한 표지가 계속 정상 렌더돼야 한다.
  //      (서랍에서만 안 보이는 것 · `kf_c_`·`kf_l_` 때와 같은 방식)
  // 🎁 **출시기념 = 이 12종** (창업자 확정 2026-07-30 *"여름프레임은 출시기념으로 풀자(12종)"*)
  //   따로 새 팩을 만들지 않는다 — *"또 뽑을 아이템이 없어.. 걍 이미 넣어놓은거 넘 많으니까
  //   정리해서 무료출시하자"* → **이미 가진 것 중 제일 좋은 것을 골라 선물로 준다.**
  //   ⛔ '한정'이라고 쓰지 않는다 — 빼앗을 계획이 없다(*"한 번 준 것은 빼앗지 않는다"*).
  { key: 'deco_sf', tab: 'frame', season: 'summer', label: '출시기념 여름', items: ['pf_sm01', 'pf_sm02', 'pf_sm03', 'pf_sm04', 'pf_sm05', 'pf_sm06', 'pf_sm07', 'pf_sm08', 'pf_sm09', 'pf_sm10', 'pf_sm11', 'pf_sm12'] },
  { key: 'deco_sk', tab: 'deco', season: 'summer', label: '소품 · 여름', items: ['sk_01', 'sk_02', 'sk_03', 'sk_04', 'sk_05', 'sk_06', 'sk_07', 'sk_08', 'sk_09', 'sk_10', 'sk_11', 'sk_12', 'sk_13', 'sk_14', 'sk_15', 'sk_16'] },
  { key: 'deco_st', tab: 'deco', season: 'summer', label: '메모·씰 · 여름', items: ['st_01', 'st_02', 'st_03', 'st_04', 'st_05', 'st_06', 'st_07', 'st_08', 'st_09', 'st_10', 'st_11'] },
  // ⚠️ 옛 이름은 `여름 한정` 이었는데 **내용은 전부 마스킹테이프**(`wt_`)라 이름이 내용을 안 알려줬다.
  { key: 'deco_summer', tab: 'tape', season: 'summer', label: '여름', items: ['wt_wave', 'wt_wave_mint', 'wt_shell', 'wt_starfish', 'wt_palm', 'wt_stripe_blue', 'wt_watermelon', 'wt_lemon', 'wt_cloud', 'wt_gingham'] },
  // 🍂 가을 = **계절 기본이라 무료.** 48컷을 **9월·10월·11월 세 번에 나눠** 넣는다.
  //
  // ⭐ 창업자 확정 2026-07-30:
  //   · *"가을안에 할로윈 명절은 다 빼고 단풍이나 이런 가을 느낌 기본만 3개월에 나눠서 넣자"*
  //   · *"한번에 다주면 또 별로니까 쪼개서 매달 조금씩"*
  //   · 기준 = **계절 기본은 무료, 이벤트 테마(명절·핼러윈·크리스마스·여행·우주…)는 유료 팩(한정판).**
  //     → 전문 = `docs/_아껴둠/꾸미기팩-아이디어.md` 맨 위
  //
  // ⚠️ 그래서 **추석 44 · 핼러윈 16 · 크리스마스 4 = 64컷은 여기 등록하지 않는다**(유료 팩 후보).
  //    파일은 `src/assets/stickers/photo/`에 그대로 있다 — **카드 뽑기 풀이 참조**하기 때문(팩 홍보).
  //    ⛔ 맛보기도 지금은 안 넣는다 — **팩을 아직 팔 수 없어서**(결제 미구현) 유도할 목적지가 없다.
  //       팩을 실제로 낼 때 맛보기를 같이 켜는 게 맞는 순서다.
  // ⚠️ 라벨에 '9월분'처럼 달을 쓰지 않는다 — 유저는 달을 알 필요가 없고, 내용으로 갈라야 자연스럽다.
  { key: 'deco_autumn_a', tab: 'deco', season: 'autumn', from: '2026-09-01', label: '가을 단풍·낙엽', items: ['au_i03', 'au_i04', 'au_i12', 'au_i15', 'au_i16', 'au_i19', 'au_i01', 'au_t06', 'au_t02', 'au_s02'] },
  { key: 'buddies_autumn_a', tab: 'buddies', season: 'autumn', from: '2026-09-01', label: '꼬르곰·펭펭의 가을', items: ['au_b01', 'au_b05', 'au_b09', 'au_b13', 'au_b14', 'au_b18'] },
  { key: 'deco_autumn_b', tab: 'deco', season: 'autumn', from: '2026-10-01', label: '가을 열매·수확', items: ['au_i02', 'au_i05', 'au_i06', 'au_i07', 'au_i08', 'au_i09', 'au_i18', 'au_t03', 'au_t04', 'au_s01'] },
  { key: 'buddies_autumn_b', tab: 'buddies', season: 'autumn', from: '2026-10-01', label: '꼬르곰·펭펭의 가을 나들이', items: ['au_b02', 'au_b03', 'au_b04', 'au_b10', 'au_b11', 'au_b12'] },
  { key: 'deco_autumn_c', tab: 'deco', season: 'autumn', from: '2026-11-01', label: '늦가을 소품', items: ['au_i10', 'au_i11', 'au_i13', 'au_i14', 'au_i17', 'au_i20', 'au_t01', 'au_t05', 'au_s03', 'au_s04'] },
  { key: 'buddies_autumn_c', tab: 'buddies', season: 'autumn', from: '2026-11-01', label: '꼬르곰·펭펭의 늦가을', items: ['au_b06', 'au_b07', 'au_b08', 'au_b15', 'au_b16', 'au_b17'] },
  // 💪 라이프
  // 🍳 주방도구 (2026-07-29) — 라이프 탭이 통째로 운동용품(아령·줄넘기·복싱)이라
  //   요리앱 표지를 꾸미는데 아령이 나왔다. 요리 도구를 맨 위로 올린다.
  { key: 'kitchen_tools', tab: 'food', label: '요리 도구', items: ['tk_apron', 'tk_hat', 'tk_pot_pink', 'tk_pot_green', 'tk_bowl', 'tk_batter', 'tk_board_knife', 'tk_board', 'tk_cup', 'tk_scale', 'tk_mitt', 'tk_mitt_purple', 'tk_book', 'tk_clip', 'tk_bag', 'tk_basket', 'tk_salt', 'tk_sugar'] },
  { key: 'life', tab: 'deco', label: '운동·라이프', items: ['lf_fit12', 'lf_fit11', 'lf_fit08', 'lf_fit07', 'lf_fit02', 'lf_fit13', 'lf_fit14', 'lf_fit06'] },
  // ✏️ 글자 (2026-07-29) — '글자' 탭엔 직접 쓰는 것만 있어서, 손글씨 문구 스티커가 없었다.
  //   맨 위 '한끼 문구' = 창업자가 직접 뽑은 우리만의 말들(다른 다꾸 앱엔 없는 것).
  { key: 'text_hankki', tab: 'notetext', label: '한끼 문구', items: ['tw_haenaem', 'tw_first', 'tw_5min', 'tw_again', 'tw_better', 'tw_really', 'tw_daebak', 'tw_wow', 'tw_salty', 'tw_night'] },
  { key: 'text_word', tab: 'notetext', label: '문구', items: ['tw_today', 'tw_success', 'tw_welldone', 'tw_tasty', 'tw_more', 'tw_fav', 'tw_honey', 'tw_hearty', 'tw_easy', 'tw_mom', 'tw_nexttime', 'tw_fail', 'tw_yummy', 'tw_best', 'tw_ourhankki', 'tw_goodday'] },
  // 📅 요일 = 무슨 요일에 해먹었는지 기록용. 빈 라벨 3종은 직접 글씨 얹으라고 둔다.
  //   ⚠️ 숫자 1~10 은 뺐다(창업자 2026-07-29) — 넣을 땐 '레시피 순서 매기기'를 생각했는데
  //      우리 레꾸는 **표지 한 장**이라 순서를 매길 자리가 없고(순서는 상세 화면에 이미 번호로 있음),
  //      날짜로 쓰기엔 10까지뿐이라 반쪽이었다. 파일(`tn_1`~`tn_10`)은 지우지 않고 남겨둠.
  { key: 'text_num', tab: 'notetext', label: '요일 · 라벨', items: ['tn_mon', 'tn_tue', 'tn_wed', 'tn_thu', 'tn_fri', 'tn_sat', 'tn_sun', 'tn_cal', 'tn_ribbon', 'tn_circle'] },
  { key: 'text_arrow', tab: 'notetext', label: '화살표 · 구분선', items: ['ta_right', 'ta_left', 'ta_up', 'ta_down', 'ta_curve', 'ta_loop', 'ta_dash', 'ta_wave', 'ta_leaf', 'ta_check', 'ta_checkc', 'ta_star'] },
]

// 🐻🐧 **모션·효과를 쓸 수 있는 스티커 = 친구들 탭에 든 것 전부.**
//   창업자 2026-07-30 *"여름의꼬르곰펭펭(모션,효과 없어)"* — 여름(`sm_`)·가을(`au_b`) 곰펭이
//   `gp_` 접두어가 아니라서 **캐릭터인데 안 움직였다.** 접두어 대신 **그룹(탭)** 으로 판정한다.
//   → 새 계절 곰펭을 어떤 이름으로 넣든 **친구들 탭에만 넣으면** 모션·효과가 자동으로 붙는다.
//   (부엌 식구들 `kf_` 도 친구들 탭이라 여기 포함된다 — 예전 `KITCHEN_IDS` 검사를 이게 대체한다)
export const FRIEND_IDS = new Set(
  STICKER_GROUPS.filter((g) => g.tab === 'buddies').flatMap((g) => g.items),
)

// 포스트잇 색 팔레트(차분한 종이 톤) — bg / 접힘 / 글자 / line(무늬 선 색)
// 포스트잇 색 — 새 배경 뮤트 팔레트에 맞춰 통일(쨍하지 않게). 키는 유지(저장표지 호환), 색만 뮤트로. + 라벤더·클레이 추가.
export const NOTE_COLORS = [
  { key: 'butter', bg: '#f0e8d5', fold: '#ddceb0', text: '#5f5647', line: '#cdbd97' }, // 크림(웜)
  { key: 'rose', bg: '#f1dcd3', fold: '#ddc2b7', text: '#6a5350', line: '#d0afa5' },   // 피치
  { key: 'sage', bg: '#dde5cf', fold: '#c8d3b4', text: '#4f5a44', line: '#b0bf97' },   // 세이지
  { key: 'sky', bg: '#d9e2eb', fold: '#c2cfdb', text: '#47545f', line: '#acbdcf' },    // 하늘
  { key: 'lavender', bg: '#e5dcea', fold: '#d1c6da', text: '#574f60', line: '#bbafc8' }, // 라벤더(신규)
  { key: 'clay', bg: '#e9ddc9', fold: '#d5c5a9', text: '#5f5343', line: '#c8b48f' },   // 클레이(신규·웜뉴트럴)
]

// 포스트잇 무늬(패턴) — 종이 위에 은은하게. 선 색은 각 색의 line 을 쓴다.
export const NOTE_PATTERNS = [
  { key: 'plain', label: '민무늬' },
  { key: 'grid', label: '모눈' },
  { key: 'check', label: '체크' },
  { key: 'lined', label: '줄노트' },
]

// 무늬별 배경 스타일(오버레이 div 에 적용). line = 색상별 선 색.
export function notePatternStyle(pattern, line) {
  switch (pattern) {
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${line} 0.8px, transparent 0.8px), linear-gradient(90deg, ${line} 0.8px, transparent 0.8px)`,
        backgroundSize: '15% 15%', opacity: 0.6,
      }
    case 'check':
      return {
        backgroundImage: `linear-gradient(${line} 50%, transparent 50%), linear-gradient(90deg, ${line} 50%, transparent 50%)`,
        backgroundSize: '24% 24%', backgroundBlendMode: 'multiply', opacity: 0.32,
      }
    case 'lined':
      return {
        backgroundImage: `linear-gradient(180deg, ${line} 0.8px, transparent 0.8px)`,
        backgroundSize: '100% 20%', backgroundPosition: '0 18%', opacity: 0.6,
      }
    default:
      return null
  }
}

// 포스트잇 모양(쉐입) — 사각 계열(기본·둥근·테이프·핀) + 실루엣(원·타원·하트·별·구름·꽃·곰)
export const NOTE_SHAPES = [
  { key: 'fold', label: '기본' },
  { key: 'round', label: '둥근' },
  { key: 'circle', label: '동그라미' },
  { key: 'oval', label: '타원' },
  { key: 'heart', label: '하트' },
  { key: 'star', label: '별' },
  { key: 'cloud', label: '구름' },
  { key: 'flower', label: '꽃' },
  { key: 'bear', label: '곰' },
  { key: 'tape', label: '테이프' },
  { key: 'pin', label: '핀' },
]

// 실루엣(하트·별·구름·꽃·곰)은 clip-path 로 오려낸다.
// clipPathUnits="objectBoundingBox"(0~1 좌표)라 포스트잇 크기에 맞춰 자동 스케일되고,
// 여러 도형(타원·사각)을 합집합으로 넣을 수 있어 별·곰·구름도 깔끔하다.
// (CSS mask 는 일부 렌더 환경에서 동작하지 않아 clip-path 로 통일.)
export const NOTE_CLIP_SHAPES = ['heart', 'star', 'cloud', 'flower', 'bear']
export const noteIsClip = (shape) => NOTE_CLIP_SHAPES.includes(shape)
export const noteClip = (shape) => (noteIsClip(shape) ? `url(#hk-note-${shape})` : null)

// 문서에 한 번 심는 clipPath 정의 — DecorLayer/DecorEditor 가 필요할 때 렌더한다.
export function NoteShapeDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        <clipPath id="hk-note-heart" clipPathUnits="objectBoundingBox">
          <path d="M0.5 0.88 C0.5 0.88 0.08 0.6 0.08 0.33 C0.08 0.16 0.24 0.08 0.37 0.18 C0.43 0.22 0.5 0.32 0.5 0.32 C0.5 0.32 0.57 0.22 0.63 0.18 C0.76 0.08 0.92 0.16 0.92 0.33 C0.92 0.6 0.5 0.88 0.5 0.88 Z" />
        </clipPath>
        {/* 통통한 별 — 뾰족한 정오각별(안쪽R 작음) 대신 안쪽 반지름을 키우고(글자공간↑)
            열 모서리를 전부 둥글려(Q곡선) 말랑한 젤리 스티커 느낌. 창업자 피드백(뾰족·작음). */}
        <clipPath id="hk-note-star" clipPathUnits="objectBoundingBox">
          <path d="M0.544 0.103 L0.603 0.214 Q0.647 0.298 0.740 0.314 L0.864 0.335 Q0.957 0.352 0.891 0.419 L0.803 0.510 Q0.738 0.577 0.751 0.671 L0.769 0.795 Q0.782 0.888 0.697 0.847 L0.585 0.791 Q0.500 0.750 0.415 0.791 L0.303 0.847 Q0.218 0.888 0.231 0.795 L0.249 0.671 Q0.262 0.577 0.197 0.510 L0.109 0.419 Q0.043 0.352 0.136 0.335 L0.260 0.314 Q0.353 0.298 0.397 0.214 L0.456 0.103 Q0.500 0.020 0.544 0.103 Z" />
        </clipPath>
        <clipPath id="hk-note-cloud" clipPathUnits="objectBoundingBox">
          <ellipse cx="0.30" cy="0.60" rx="0.20" ry="0.26" /><ellipse cx="0.52" cy="0.44" rx="0.25" ry="0.32" /><ellipse cx="0.73" cy="0.58" rx="0.18" ry="0.24" /><rect x="0.26" y="0.54" width="0.52" height="0.32" rx="0.1" />
        </clipPath>
        <clipPath id="hk-note-flower" clipPathUnits="objectBoundingBox">
          <ellipse cx="0.5" cy="0.26" rx="0.18" ry="0.18" /><ellipse cx="0.75" cy="0.44" rx="0.18" ry="0.18" /><ellipse cx="0.66" cy="0.74" rx="0.18" ry="0.18" /><ellipse cx="0.34" cy="0.74" rx="0.18" ry="0.18" /><ellipse cx="0.25" cy="0.44" rx="0.18" ry="0.18" /><ellipse cx="0.5" cy="0.52" rx="0.22" ry="0.22" />
        </clipPath>
        <clipPath id="hk-note-bear" clipPathUnits="objectBoundingBox">
          <ellipse cx="0.26" cy="0.27" rx="0.16" ry="0.16" /><ellipse cx="0.74" cy="0.27" rx="0.16" ry="0.16" /><ellipse cx="0.5" cy="0.58" rx="0.32" ry="0.35" />
        </clipPath>
      </defs>
    </svg>
  )
}

export const noteRadius = (shape) => {
  switch (shape) {
    case 'round': return '9%'
    case 'circle': return '50%'
    case 'oval': return '50%'
    case 'fold': return '3% 3% 3% 12%'
    default: return '5%' // tape, pin, (mask 모양은 radius 무시)
  }
}

// 글자 스티커 색 — 사진 위에서도 읽히도록 반대 톤 외곽선(stroke)을 함께 준다
// 🎨 **자유글자 색 = 리컬러 팔레트와 같은 색** (창업자 2026-07-30 *"글자를 리컬러로 하면 좋겠는데"*)
//   예전엔 흰·차콜·코랄·머스타드 **4색뿐**이라 *"글씨가 별로 안예뻐서 사실 쓸게 별로 없긴해..ㅠ"* 였다.
//   → 스티커 리컬러 13색을 **한 톤 진하게** 옮겨 담고 흰·차콜을 더해 **15색.**
//   ⚠️ 글자는 사진 위에 얹히니 **반대 톤 외곽선이 필수** — 색마다 손으로 정하지 않고
//      밝기(휘도)로 자동 판단한다(밝은 글자엔 어두운 선, 어두운 글자엔 밝은 선).
//   ⚠️ 앞의 4색 키(white·charcoal·coral·mustard)는 **그대로 둔다** — 이미 그 색으로 저장한 표지가 있다.
const deepen = (hex, f = 0.72) => {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
const strokeFor = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const lum = (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255
  return lum > 0.6 ? 'rgba(55,45,32,.6)' : 'rgba(255,255,255,.6)'
}
export const TEXT_COLORS = [
  { key: 'white', color: '#ffffff', stroke: 'rgba(55,45,32,.6)' },
  { key: 'charcoal', color: '#382d21', stroke: 'rgba(255,255,255,.68)' },
  { key: 'coral', color: '#b34a37', stroke: 'rgba(255,255,255,.5)' },    // 옛 4색 — 저장 호환
  { key: 'mustard', color: '#b78a30', stroke: 'rgba(60,48,30,.5)' },
  ...STICKER_COLORS.filter((c) => !['coral', 'charcoal'].includes(c.key))
    .map((c) => ({ key: `t_${c.key}`, color: deepen(c.color), stroke: strokeFor(deepen(c.color)) })),
]

// ✒️ 글자 굵기 — ⚠️**`font-weight` 로는 안 된다.** 우리 글씨체는 전부 **400 한 종류만** 담은
//   웹폰트라(`styles.css`) 굵게 하면 브라우저가 가짜 볼드를 그리고, 그 모양이 폰트마다 들쭉날쭉하다.
//   → **외곽선 두께**로 살찌운다. `paint-order: stroke fill` 로 선을 글자 뒤에 깔아
//      **획을 갉아먹지 않고 바깥으로만** 두꺼워지게 한다.
// ⚠️⚠️ **1차 시도는 실패했다** — 외곽선(대비색) 두께만 키웠더니 값은 바뀌는데 **눈에 안 보였다**
//   (창업자 *"굵기는 조절이 안되네 ㅎㅎ"*). 대비색 테두리가 두꺼워질 뿐 **글자 자체는 그대로**였다.
//   → `fat` = **글자와 같은 색으로 두른 두께**(진짜 살이 붙는다) · `out` = 사진 위 가독용 대비 테두리(고정).
//   `paint-order: stroke fill` 이라 획을 안 갉고 바깥으로만 붙는다.
export const TEXT_WEIGHTS = [
  { key: 'thin', label: '얇게', fat: 0 },
  { key: 'mid', label: '보통', fat: 0.055 },
  { key: 'bold', label: '굵게', fat: 0.16 },
]

// 글자 스티커 글씨체 — 또박체(고운돋움) / 귀염체(개구체). 오프라인이면 다음 폰트로 자연 대체.
// ✏️ 글씨체 — `bw` = **굵기 보정.** 창업자 2026-07-30 *"글씨체자체가 두꺼운 애들도 있는데
//   얇은 애들도 있어서 안맞아서 더 그런 듯"* → **맞는 진단.** 임팩트는 원래 아주 굵고 펜글씨는
//   아주 얇아서, 같은 외곽선 두께를 주면 하나는 뭉치고 하나는 사라진다.
//   → 글씨체마다 기준 두께를 달리 줘서 **'보통'일 때 다 비슷하게 보이도록** 맞춘다.
//   `ls` = 자간 보정(비워두면 기본).
export const TEXT_FONTS = [
  // `bw` = **가독 테두리** 보정(얇은 글씨일수록 크게) · `fw` = **굵기(살)** 보정 · `ls` = 자간
  // ⚠️⚠️ 처음엔 둘을 **하나(`bw`)로 같이** 썼다가 사고가 났다 — 창업자 *"굵게하면 저 글씨체만 이상하고"*.
  //   펜글씨는 얇아서 `bw`를 2로 줬는데 그 값이 살에도 곱해져 **획이 서로 붙어 초록 덩어리**가 됐다.
  //   → **얇다고 살을 많이 붙이면 안 된다.** 획 간격이 좁은 글씨(펜글씨)는 오히려 **적게** 붙여야 한다.
  { key: 'gaegu', label: '귀염체', family: "'Gaegu','Gowun Dodum','Pretendard',sans-serif", weight: 700, bw: 0.9, fw: 0.85 },
  // ⚠️ 펜글씨 = 획이 제일 얇고 글자끼리 붙는다 → 테두리는 두껍게(bw), **살은 얇게**(fw), 자간은 넓게
  { key: 'nanumpen', label: '펜글씨', family: "'Nanum Pen Script','Gowun Dodum','Pretendard',sans-serif", weight: 400, bw: 2, fw: 0.5, ls: '0.1em' },
  { key: 'jua', label: '통통체', family: "'Jua','Gowun Dodum','Pretendard',sans-serif", weight: 400, bw: 0.9, fw: 0.8 },
  { key: 'gowun', label: '또박체', family: "'Gowun Dodum','Pretendard',sans-serif", weight: 800, bw: 1.5, fw: 1, ls: '0.01em' },
  { key: 'blackhan', label: '임팩트', family: "'Black Han Sans','Pretendard',sans-serif", weight: 400, bw: 0.55, fw: 0.45 },
  { key: 'dohyeon', label: '라운드', family: "'Do Hyeon','Pretendard',sans-serif", weight: 400, bw: 1.1, fw: 0.9 },
]

// ── 표지 배경(배경지) ──
// 커버 전체 톤을 바꾼다 = '안 질림' 최고 지렛대. recipe.decorBg 에 key 저장.
// 패턴은 CSS만으로(이미지 없음), 크기는 %라 큰 커버·작은 썸네일 어디서든 같은 비율로 스케일된다.
// style 은 Thumb·에디터·칩에 그대로 spread 한다. key:'none' 은 기본(그라데이션 자동).
export const DECOR_BACKGROUNDS = [
  { key: 'none', label: '기본', style: null },
  { key: 'cream', label: '크림', style: { background: '#f9f4ec' } },
  { key: 'peach', label: '피치', style: { background: '#faeae1' } },
  { key: 'sky', label: '하늘', style: { background: '#e9f0f7' } },
  { key: 'lilac', label: '라일락', style: { background: '#f1ebf5' } },
  { key: 'kraft', label: '크라프트', style: { background: '#eee2d0' } },
  {
    key: 'grid', label: '모눈',
    style: {
      backgroundColor: '#f4efe4',
      backgroundImage: 'linear-gradient(#dcd3c0 1px, transparent 1px), linear-gradient(90deg, #dcd3c0 1px, transparent 1px)',
      backgroundSize: '16.66% 16.66%',
    },
  },
  {
    key: 'dot', label: '도트',
    style: {
      backgroundColor: '#f5ece0',
      // 도트 작게 + circle 로 동그랗게(비정사각 셀에서도 타원 안 되게)
      backgroundImage: 'radial-gradient(circle, #dcc9a9 26%, transparent 28%)',
      backgroundSize: '9% 9%',
    },
  },
  {
    key: 'stripe', label: '스트라이프',
    style: {
      backgroundColor: '#f4ede0',
      backgroundImage: 'repeating-linear-gradient(45deg, #eadfca 0, #eadfca 6%, transparent 6%, transparent 12%)',
    },
  },
  {
    key: 'sunset', label: '노을',
    style: { background: 'linear-gradient(160deg, #f7e2d3 0%, #f0d5da 55%, #e6d3ea 100%)' },
  },
  {
    key: 'sage', label: '세이지',
    style: { background: 'linear-gradient(160deg, #dfe9d8 0%, #d1e0d5 50%, #dae5e4 100%)' },
  },
  // 🍃 조금 진한 뮤트(중간톤·다크 아님) — 곰(웜)·펭(쿨) 둘 다 맞는 뉴트럴/브릿지 우선 + 웜·쿨 포인트 하나씩. (창업자 요청 2026-07-23, 클로드 셀렉)
  { key: 'msage', label: '딥세이지', style: { background: '#9aab9c' } },   // 그린 브릿지 — 둘 다 최고
  { key: 'mtaupe', label: '웜토프', style: { background: '#b5a695' } },    // 웜뉴트럴 브릿지 — 둘 다 부드럽게
  { key: 'mclay', label: '클레이', style: { background: '#c2a288' } },     // 웜 포인트 — 곰 감싸고 펭 톡
  { key: 'mrose', label: '더스티로즈', style: { background: '#c6a5a9' } }, // 로즈 — 둘 다 OK
  { key: 'mlav', label: '라벤더', style: { background: '#aca4bb' } },      // 퍼플 — 둘 다 OK
  { key: 'mblue', label: '스모키블루', style: { background: '#a2b0bc' } }, // 쿨 포인트 — 펭 톡 곰 대비
  // 🌙 딥(어두운) 배경지 — 반짝임·홀로·별이 사는 "밤하늘 다꾸" (창업자 픽: 딥플럼·미드나잇)
  { key: 'plum', label: '딥플럼', dark: true, style: { background: '#3e3442' } },
  { key: 'midnight', label: '미드나잇', dark: true, style: { background: '#2d3340' } },
]

export const bgStyle = (key) => (DECOR_BACKGROUNDS.find((b) => b.key === key) || DECOR_BACKGROUNDS[0]).style
// 딥(어두운) 배경지 여부 — 표지 글자·아이콘을 밝게 자동전환할 때 쓴다.
export const bgIsDark = (key) => !!DECOR_BACKGROUNDS.find((b) => b.key === key)?.dark

// ── 마스킹테이프(마테) ──
// 다꾸 시그니처. 반투명 종이 띠 + 패턴. 길이·각도 자유(무한 변형).
// item: { type:'tape', key(패턴), x, y, s(폭), r } — 폭:높이 ≈ 3.4:1 스트립.
export const TAPE_PATTERNS = [
  { key: 'kraft', label: '크라프트', style: { background: 'rgba(214,197,168,0.92)' } },
  {
    key: 'stripe', label: '스트라이프',
    style: { backgroundColor: 'rgba(240,224,205,0.92)', backgroundImage: 'repeating-linear-gradient(45deg, rgba(200,120,95,.4) 0, rgba(200,120,95,.4) 7%, transparent 7%, transparent 14%)' },
  },
  {
    // 도트 — %폭×%높이(radial)는 3.4:1 띠에서 타원으로 늘어남 → SVG 원 + auto높이로 항상 동그랗게
    key: 'dot', label: '도트',
    style: { backgroundColor: 'rgba(236,236,225,0.92)', backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'><circle cx='7' cy='7' r='2.7' fill='%23968060' opacity='0.42'/></svg>\")", backgroundSize: 'auto 46%' },
  },
  { key: 'rose', label: '로즈', style: { background: 'rgba(232,205,203,0.92)' } },
  {
    // 찢은 테이프 — 양쪽 끝이 손으로 뜯긴 듯 지그재그(clip-path)
    key: 'torn', label: '찢은테이프',
    style: {
      background: 'rgba(214,197,168,0.94)',
      clipPath: 'polygon(0% 0%, 100% 0%, 95% 12%, 100% 25%, 95% 37%, 100% 50%, 95% 62%, 100% 75%, 95% 87%, 100% 100%, 0% 100%, 5% 87%, 0% 75%, 5% 62%, 0% 50%, 5% 37%, 0% 25%, 5% 12%)',
      WebkitClipPath: 'polygon(0% 0%, 100% 0%, 95% 12%, 100% 25%, 95% 37%, 100% 50%, 95% 62%, 100% 75%, 95% 87%, 100% 100%, 0% 100%, 5% 87%, 0% 75%, 5% 62%, 0% 50%, 5% 37%, 0% 25%, 5% 12%)',
    },
  },
  {
    // 하트 — 파스텔 로즈 바탕에 작은 하트가 콕콕(SVG 패턴)
    key: 'heart', label: '하트',
    style: {
      backgroundColor: 'rgba(238,214,214,0.94)',
      backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><path d='M8 13C4.3 9.9 2 8 2 5.4 2 3.7 3.4 2.4 5 2.4c1.1 0 2.2.6 3 1.7.8-1.1 1.9-1.7 3-1.7 1.6 0 3 1.3 3 3C14 8 11.7 9.9 8 13z' fill='%23d98a92' opacity='0.55'/></svg>\")",
      // 하트가 안 찌그러지게 — 높이만 지정(auto=폭은 1:1 유지). %폭×%높이는 3.4:1 띠에서 하트를 옆으로 늘림.
      backgroundSize: 'auto 80%',
    },
  },
  {
    // 깅엄 체크 — 두 방향 반투명 줄이 겹쳐 자연스러운 체크
    key: 'gingham', label: '깅엄',
    style: {
      backgroundColor: 'rgba(245,238,236,0.94)',
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(206,138,146,.34) 0 7px, transparent 7px 14px), repeating-linear-gradient(90deg, rgba(206,138,146,.34) 0 7px, transparent 7px 14px)',
    },
  },
  {
    // 🌊 물결(여름) — 파스텔 블루 바탕 + 흰/블루 파도선
    key: 'wave', label: '물결',
    style: {
      backgroundColor: 'rgba(201,224,240,0.94)',
      backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='16'><path d='M0 5 q7.5 -4.5 15 0 t15 0' stroke='%23ffffff' fill='none' stroke-width='2' opacity='0.9'/><path d='M0 11 q7.5 -4.5 15 0 t15 0' stroke='%236fa6d2' fill='none' stroke-width='1.6' opacity='0.7'/></svg>\")",
      backgroundSize: 'auto 62%',
    },
  },
  {
    // 🍉 수박(여름) — 크림 바탕 + 수박 조각. 세로 타일링으로 잘리던 것 → 가로 한 줄(repeat-x)·세로 가운데.
    key: 'watermelon', label: '수박',
    style: {
      backgroundColor: 'rgba(246,239,232,0.95)',
      backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M5 8.6 A 7.3 7 0 0 0 19 8.6 Z' fill='%23e98a93'/><path d='M4.4 8.7 A 8 7.6 0 0 0 19.6 8.7' fill='none' stroke='%236f9d54' stroke-width='2.2' stroke-linecap='round'/><g fill='%234a3d2c'><circle cx='9.6' cy='11' r='0.8'/><circle cx='12' cy='12.4' r='0.8'/><circle cx='14.4' cy='11' r='0.8'/></g></svg>\")",
      backgroundRepeat: 'repeat-x',
      backgroundPosition: 'center',
      backgroundSize: 'auto 85%', // 수박 더 통통하게
    },
  },
  {
    // 🍋 레몬(여름) — 옅은 노랑 바탕 + 레몬 슬라이스
    key: 'lemon', label: '레몬',
    style: {
      backgroundColor: 'rgba(249,243,222,0.95)',
      backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='10' cy='10' r='6.2' fill='%23f3d75f' stroke='%23dcbb44' stroke-width='1.2'/><circle cx='10' cy='10' r='3.3' fill='%23f8ecab'/><g stroke='%23e3c455' stroke-width='0.9'><path d='M10 4.2v3'/><path d='M10 15.8v-3'/><path d='M4.2 10h3'/><path d='M15.8 10h-3'/><path d='M6 6l2 2'/><path d='M14 6l-2 2'/><path d='M6 14l2-2'/><path d='M14 14l-2-2'/></g></svg>\")",
      backgroundSize: 'auto 72%',
    },
  },
  {
    // 🟩 초록 깅엄 — 세이지 그린 깅엄 체크. 수박 마테가 밝은 배경에서 안 보여 '초록 들어간' 마테 추가.
    // 뮤트 올리브그린 반투명(검정 X → 안 촌스럽게). 크림~딥세이지 배경 어디서든 잘 보임.
    key: 'ggingham', label: '초록깅엄',
    style: {
      backgroundColor: 'rgba(200,214,188,0.94)',
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(122,145,99,.32) 0 7px, transparent 7px 14px), repeating-linear-gradient(90deg, rgba(122,145,99,.32) 0 7px, transparent 7px 14px)',
    },
  },
  {
    // 🌿 허브 — 통통한 새싹 스프리그(요리앱 감성). 뮤트 올리브그린 모티브.
    key: 'herb', label: '허브',
    style: {
      backgroundColor: 'rgba(196,208,182,0.94)',
      backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='27' height='27'><path d='M13.5 6 V22' stroke='%237a9163' stroke-width='1.5' fill='none' stroke-linecap='round'/><g fill='%237a9163'><ellipse cx='13.5' cy='5' rx='2.6' ry='3.4'/><ellipse cx='8.5' cy='10' rx='3.6' ry='2.7' transform='rotate(-28 8.5 10)'/><ellipse cx='18.5' cy='12.5' rx='3.6' ry='2.7' transform='rotate(28 18.5 12.5)'/><ellipse cx='8.5' cy='16.5' rx='3.6' ry='2.7' transform='rotate(-28 8.5 16.5)'/></g></svg>\")",
      backgroundSize: 'auto 84%',
    },
  },
]
export const tapeStyle = (key) => (TAPE_PATTERNS.find((t) => t.key === key) || TAPE_PATTERNS[0]).style

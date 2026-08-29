import { useState, useEffect } from 'react'
import Buddy from './Buddies'
import { packDrawerGroups } from '../data/paidPacks'
// 🌧 가을 유료팩 배경 — 우리 배경 중 «첫 사진». 표지가 1:1 이라 미리 1:1 로 잘라 뒀다.
import RAIN_STREET from '../assets/decorbg/rain-street.webp'

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
  // 🍱 2026-08-27 — 창업자 새 컷 119개(실제 PNG 를 재서 넣었다 · 검수 절대원칙 ④)
  gr_331: 1.0986,
  gr_332: 1.1444,
  gr_333: 1.1214,
  gr_334: 1.0654,
  gr_335: 1.0501,
  gr_336: 1.0745,
  gr_337: 1.1003,
  gr_338: 1.1050,
  gr_339: 1.0977,
  gr_340: 1.0662,
  gr_341: 1.0711,
  gr_342: 1.0784,
  gr_343: 1.2029,
  gr_344: 1.1719,
  gr_345: 1.2039,
  gr_346: 1.2099,
  gr_347: 1.1847,
  gr_348: 1.2005,
  gr_349: 1.1760,
  gr_350: 1.1960,
  gr_351: 1.1931,
  gr_352: 1.1671,
  gr_353: 1.1712,
  gr_354: 1.1721,
  gr_355: 1.1564,
  gr_356: 1.2016,
  gr_357: 1.1290,
  gr_358: 1.1219,
  gr_359: 1.1828,
  gr_360: 1.1429,
  gr_361: 1.1820,
  gr_362: 0.9596,
  gr_363: 0.9721,
  gr_364: 1.1560,
  gr_365: 1.1681,
  gr_366: 1.1643,
  gr_367: 1.1443,
  gr_368: 1.1054,
  gr_369: 1.1270,
  gr_370: 1.1353,
  gr_371: 1.1070,
  gr_372: 1.1197,
  gr_373: 1.1404,
  gr_374: 1.1977,
  gr_375: 1.1543,
  gr_376: 1.0871,
  gr_377: 1.0785,
  gr_378: 1.0775,
  gr_379: 1.4424,
  gr_380: 1.3639,
  gr_381: 1.1185,
  gr_382: 1.3889,
  gr_383: 1.1830,
  gr_384: 1.3908,
  gr_385: 1.2442,
  gr_386: 1.2135,
  gr_387: 1.2268,
  gr_388: 1.2288,
  gr_389: 1.2072,
  gr_390: 1.1057,
  gr_391: 1.1090,
  gr_392: 1.0955,
  gr_393: 1.0543,
  gr_394: 1.0656,
  gr_395: 1.0500,
  gr_396: 1.1299,
  gr_397: 1.1609,
  gr_398: 1.1194,
  gr_399: 1.1414,
  gr_400: 1.1969,
  gr_401: 1.1318,
  gr_402: 1.0342,
  gr_403: 1.0766,
  gr_404: 1.0605,
  gr_405: 1.0667,
  gr_406: 1.1145,
  gr_407: 1.1304,
  gr_408: 1.0875,
  gr_409: 1.1076,
  gr_410: 1.1102,
  gr_411: 1.0617,
  gr_412: 1.0846,
  gr_413: 1.0962,
  gr_414: 1.1888,
  gr_415: 1.0359,
  gr_416: 1.1794,
  gr_417: 1.1429,
  gr_418: 1.1328,
  gr_419: 1.1436,
  gr_420: 1.1135,
  gr_421: 1.1279,
  gr_422: 1.1353,
  gr_423: 1.1186,
  gr_424: 1.0597,
  gr_425: 1.1405,
  gr_426: 1.1212,
  gr_427: 1.1707,
  gr_428: 1.1536,
  gr_429: 1.1357,
  gr_430: 1.1758,
  gr_431: 1.0964,
  gr_432: 1.0926,
  gr_433: 1.0940,
  gr_434: 1.0851,
  gr_435: 1.0660,
  gr_436: 1.0857,
  gr_437: 1.2976,
  gr_438: 1.3153,
  gr_439: 1.4308,
  gr_440: 1.3297,
  gr_441: 1.1788,
  gr_442: 1.1721,
  gr_443: 1.0800,
  gr_444: 1.1102,
  gr_445: 1.1451,
  gr_446: 1.1200,
  gr_447: 1.1339,
  gr_448: 1.0777,
  gr_449: 1.1050,
  gr_453: 1.1579,
  gr_452: 1.0850,
  gr_451: 1.1122,
  gr_450: 1.1097,

  // 🥣 [2026-08-27] 창업자 시트27 — 죽 넷 ＋ 버섯볶음 ＋ 갈치국
  //    ⭐ 내가 「대체 컷이 아예 없다」고 한 둘(버섯볶음·갈치국)과,
  //       옛 카와이 `fh_k36` 하나가 떠맡던 죽 갈래를 통째로 덮는 컷이다.
  gr_454: 1.1839,   // 호박죽
  gr_455: 1.2021,   // 팥죽
  gr_456: 1.1463,   // 죽(흰죽)
  gr_457: 1.1161,   // 버섯볶음
  gr_458: 1.1784,   // 갈치국
  gr_459: 1.1310,   // 야채죽

  // 🍽 [2026-08-26] 창업자 「그릇」 컷 108개 — 새 세대 접두어 gr_ (시트 18장)
  gr_001: 1.1347,
  gr_220: 1.3079,
  gr_221: 1.305,
  gr_222: 1.2212,
  gr_223: 1.2395,
  gr_224: 1.1077,
  gr_225: 1.0891,
  gr_226: 1.0969,
  gr_227: 1.1425,
  gr_228: 1.1375,
  gr_229: 1.1398,
  gr_230: 1.1197,
  gr_231: 1.1096,
  gr_232: 1.1083,
  gr_233: 1.3994,
  gr_234: 1.1405,
  gr_235: 1.3891,
  gr_236: 1.3778,
  gr_237: 1.3726,
  gr_238: 1.3683,
  gr_239: 1.1005,
  gr_240: 1.1253,
  gr_241: 1.2439,
  gr_242: 1.2394,
  gr_243: 1.2455,
  gr_244: 1.2356,
  gr_245: 1.2175,
  gr_246: 1.2202,
  gr_247: 1.1212,
  gr_248: 1.1226,
  gr_249: 1.123,
  gr_250: 1.3052,
  gr_251: 1.0796,
  gr_252: 1.0792,
  gr_253: 1.2101,
  gr_254: 1.1982,
  gr_255: 1.1775,
  gr_256: 1.0071,
  gr_257: 1,
  gr_258: 1.0024,
  gr_259: 0.9882,
  gr_260: 0.9882,
  gr_261: 0.9953,
  gr_262: 1.0857,
  gr_263: 1.0987,
  gr_264: 1.1039,
  gr_265: 1.0807,
  gr_266: 1.0938,
  gr_267: 1.0964,
  gr_268: 1.0243,
  gr_269: 1.0219,
  gr_270: 1.0291,
  gr_271: 0.9952,
  gr_272: 1.0048,
  gr_273: 1.0119,
  gr_274: 1.2351,
  gr_275: 1.2769,
  gr_276: 1.2278,
  gr_277: 1.2425,
  gr_278: 1.244,
  gr_279: 1.1818,
  gr_280: 1.1565,
  gr_281: 1.1758,
  gr_282: 1.1671,
  gr_283: 1.1859,
  gr_284: 1.2079,
  gr_285: 1.1983,
  gr_286: 1.2269,
  gr_287: 1.1882,
  gr_288: 1.1878,
  gr_289: 1.163,
  gr_290: 1.163,
  gr_291: 1.1842,
  gr_292: 1.1425,
  gr_293: 1.153,
  gr_294: 1.2188,
  gr_295: 1.2017,
  gr_296: 1.1989,
  gr_297: 1.2006,
  gr_298: 1.1743,
  gr_299: 1.1966,
  gr_300: 1.0226,
  gr_301: 1.1538,
  gr_302: 1.0302,
  gr_303: 1.0075,
  gr_304: 1.02,
  gr_305: 1.025,
  gr_306: 1.2333,
  gr_307: 1.2789,
  gr_308: 1.2552,
  gr_309: 1.2077,
  gr_310: 1.2346,
  gr_311: 1.1444,
  gr_312: 1.1436,
  gr_313: 1.1283,
  gr_314: 1.1387,
  gr_315: 1.1915,
  gr_316: 1.1287,
  gr_317: 1.1359,
  gr_318: 1.1328,
  gr_319: 1.2073,
  gr_320: 1.2047,
  gr_321: 1.1711,
  gr_322: 1.1563,
  gr_323: 1.1608,
  gr_324: 1.2206,
  gr_325: 1.1818,
  gr_326: 1.0607,
  gr_327: 1.0665,
  gr_328: 1.0591,
  gr_329: 1.0699,
  gr_330: 1.0668, gr_002: 1.1624, gr_003: 1.2079, gr_004: 1.0925, gr_005: 1.1069, gr_006: 1.1041,
  gr_007: 1.1357, gr_008: 1.0974, gr_009: 1.1482, gr_010: 1.092, gr_011: 1.0922, gr_012: 1.1206,
  gr_013: 1.1736, gr_014: 0.4717, gr_015: 0.533, gr_016: 1.0818, gr_017: 1.1865, gr_018: 0.491,
  gr_019: 1.4887, gr_020: 1.4046, gr_021: 1.549, gr_022: 1.4199, gr_023: 1.4596, gr_024: 1.4408,
  gr_025: 1.1068, gr_026: 1.1429, gr_027: 1.1146, gr_028: 1.1053, gr_029: 1.1615, gr_030: 1.1801,
  gr_031: 1.112, gr_032: 1.1361, gr_033: 1.1757, gr_034: 1.1225, gr_035: 1.1171, gr_036: 1.0837,
  gr_037: 1.218, gr_038: 1.204, gr_039: 1.0567, gr_040: 1.1624, gr_041: 1.2812, gr_042: 1.1751,
  gr_043: 1.1483, gr_044: 1.1125, gr_045: 1.1008, gr_046: 1.0784, gr_047: 1.1814, gr_048: 1.1762,
  gr_049: 1.1039, gr_050: 1.1269, gr_051: 1.1399, gr_052: 1.0982, gr_053: 1.1151, gr_054: 1.1202,
  gr_055: 1.0914, gr_056: 1.1063, gr_057: 1.101, gr_058: 1.0673, gr_059: 1.0898, gr_060: 1.0998,
  gr_061: 1.0808, gr_062: 1.0977, gr_063: 1.1136, gr_064: 1.0734, gr_065: 1.0987, gr_066: 1.1013,
  gr_067: 1.0484, gr_068: 1.1083, gr_069: 1.0147, gr_070: 1.0651, gr_071: 1.4596, gr_072: 1.4408,
  gr_073: 1.1136, gr_074: 1.1224, gr_075: 1.0238, gr_076: 1.0571, gr_077: 1.0452, gr_078: 1.0142,
  gr_079: 1.1259, gr_080: 1.0948, gr_081: 1.1151, gr_082: 1.1179, gr_083: 1.082, gr_084: 1.1266,
  gr_085: 1.2136, gr_086: 1.1357, gr_087: 0.6333, gr_088: 1.2268, gr_089: 1.1045, gr_090: 0.5644,
  gr_091: 1.1374, gr_092: 1.0865, gr_093: 1.0521, gr_094: 1.1324, gr_095: 1.1179, gr_096: 1.144,
  gr_097: 1.1039, gr_098: 1.147, gr_099: 1.1564, gr_100: 1.1553, gr_101: 1.1325, gr_102: 1.0621,
  gr_103: 1.1593, gr_104: 1.1311, gr_105: 1.1495, gr_106: 1.1311, gr_107: 1.1098, gr_108: 1.1229,
  // 📌📌 **메모지(포스트잇) 16컷** (2026-08-20 창업자 시트 4장) — 「지난번 메모」가 쓴다
  //   📮 창업자 = *"귀여운게 많아서 **포스트잇을 랜덤으로 붙이는거 어때?**"* · *"버릴 컷 없다 · 다 써도 된다"*
  //   ⭐ 전부 **정사각에 가깝다**(0.956~1.041) — 창업자가 「포스트잇 비율」에 맞춰 다시 뽑아 줬다.
  //      그 전 시안은 가로÷세로 2.08~2.29 라 «라벨·배너»였고, 창업자가 *"가로가 너무 기니까 이상해보인다"* 고 잡았다.
  //   ⛔ 꾸미기 서랍엔 «안» 싣는다 — 이건 앱이 자동으로 붙여주는 종이다(유저가 붙이는 메모 스티커와 다르다).
  //      다만 `BOX_PAD` 에 값이 있어서 나중에 서랍에 실으면 그대로 «글 상자»가 된다.
  pn101: 0.9744, pn102: 0.9914, pn103: 1.0413, pn104: 0.9810,
  pn201: 0.9696, pn202: 0.9813, pn203: 0.9760, pn204: 0.9881,
  pn301: 0.9880, pn302: 0.9947, pn303: 0.9841, pn304: 1.0310,
  pn401: 0.9559, pn402: 0.9878, pn403: 1.0345, pn404: 0.9894,
  // 🐻😢🐧 **꼬르곰·펭펭 «감정» 36컷** (2026-08-15 창업자 시트 9장) — 비율 = 가로÷세로
  //   📮 창업자 *"그리고 보니 우리 꼬르곰 펭펭 슬픈 컷은 하나도 안 넣었어.."*
  //      실측이 맞았다 — 그때 앱의 곰펭 96컷이 «전부» 응원·기쁨이었고 우는·화난·지친 컷이 0개였다.
  //      한끼는 「한 끼 해낸 나를 위로하는 공간」인데 **위로할 감정 자체가 없었다.**
  //   ⭐ 앞치마는 **멜빵이 정본**(창업자 2026-08-15 *"멜빵이 정본이야"*).
  //      끈 앞치마 옛 컷도 그대로 둔다 — *"다양한 컷이 있으면 좋잖아"*.
  //   📔📔 **36컷 전부 일꾸 전용(`only: 'diary'`)** — 레시피 표지엔 안 넣는다.
  //      ⛔ 내 첫 안은 「감정=일꾸 · 부엌 장면=레꾸 · 위로=양쪽」이었는데 **창업자가 뒤집었다**:
  //         *"설거지 산더미·불 끄기·문 앞 이거는 일꾸가 더 나은 듯. **하루를 마감하고 힘들었던 거니까**"*
  //         *"탄 냄비·빈 냄비·국자 멍때림 … 사실 레꾸보다는 일꾸. **요리하면서 당황한거 적기에 좋아**"*
  //         *"**레시피에 들어갈 컷은 아닌 것 같아**"*
  //      ⭐ 갈래가 「무엇을 그렸나」(부엌이냐 감정이냐)가 아니라 **「무엇을 적는 자리냐」**였다.
  //         탄 냄비도 부엌 그림이 아니라 «그날 망한 기록»이다. 레꾸는 «완성한 것을 예쁘게»가 목적이라 결이 다르다.
  //      📌 레꾸 서랍은 이미 524컷이다 — 굳이 밀어 넣을 자리도 아니었다.
  ge_s201: 0.794, ge_s202: 0.7468, ge_s203: 0.7731, ge_s204: 1.6691, ge_s601: 0.6629, ge_s602: 0.5956,
  ge_s603: 0.643, ge_s604: 1.4439, ge_s901: 0.7174, ge_s902: 0.6746, ge_s903: 0.689, ge_s904: 1.26,
  ge_s101: 1.2133, ge_s801: 1.1538, ge_s503: 1.0302, ge_s703: 0.8357, ge_s504: 1.0873, ge_s704: 0.8026,
  ge_s501: 1.0, ge_s701: 0.7748, ge_s502: 0.9417, ge_s702: 0.8851,
  ge_s102: 0.9164, ge_s802: 0.9639, ge_s103: 0.7639, ge_s803: 0.7688, ge_s104: 0.9217, ge_s804: 0.7958,
  ge_s301: 1.0214, ge_s302: 1.1839, ge_s303: 1.0496, ge_s304: 1.0329,
  ge_s401: 1.0753, ge_s402: 1.1034, ge_s403: 1.0739, ge_s404: 1.1809,
  fe_305: 1.2353,  // 🍖 수제 떡갈비 (2026-08-15 창업자 · 레시피 넣은 그날 바로 뽑아줬다)
  // 🦀🍚 2026-08-18 창업자 시트 1장 → 2컷. 창업자가 «검수 중에» 바로 뽑아 보냈다.
  //    fe_306 = 꽃게간장조림(어머니 레시피 전용) · fe_307 = 나물비빔밥
  //    ⭐ fe_307 이 푸는 것 = 나물비빔밥이 「비빔밥」에 걸려 **돌솥비빔밥과 같은 컷**(fh_k01)이었다.
  fe_306: 1.144, fe_307: 1.0491,
  // 🍱 2026-08-18 창업자 시트2 — 조림 셋 · 샌드위치 둘 · 백순대볶음
  //    ⚠️ 라벨 지우개가 «백순대볶음 한 칸»을 못 잡았다(그릇 그림자가 라벨까지 이어져 «틈»이 없었다).
  //       옆 칸 둘과 같은 줄(y913~996)로 손으로 지우고 **열어서 그릇이 멀쩡한지 확인**했다(규칙 21).
  fe_308: 1.1452, fe_309: 1.1467, fe_310: 1.1636, fe_311: 1.1445, fe_312: 1.1270, fe_313: 1.2706,
  // 🍲 2026-08-18 창업자 시트 3장 ＋ 단독 재판 — 「지금 붙는 그림이 겹친다」고 알린 12편에 대한 답
  //    📮 창업자 *"대파듬뿍 다시뽑을게"* → **어슷썰기 판은 버리고 채썬 판(fe_314)으로.**
  //    ⛔ 「초간단 순살 갈비찜」은 여기 없다 — 창업자가 *"이건 갈비살이구나 내가 다시뽑아줄게"*
  fe_314: 1.1796, fe_315: 1.1919, fe_316: 1.1753, fe_317: 1.2711, fe_318: 1.1791, fe_319: 1.2277, fe_320: 1.1923,
  fe_321: 1.3211, fe_322: 1.1292, fe_323: 1.1257, fe_324: 1.1347, fe_325: 1.2123, fe_326: 1.1417, fe_327: 1.2049,
  fe_328: 1.247,   // 갈비살조림 — 창업자가 그 자리에서 다시 뽑아 준 컷
  // 🍱 [2026-08-19] 창업자 새 음식 아이콘 60컷 — 시트 10장(8/12 제공)
  //   ⚠️ fe_377~379(소스·양념·샐러드소스 «3개판»)은 비율이 **1.94~2.00** 이다 — 앱에서 제일 넓은 컷이 된다.
  //      📮 창업자가 알고 고른 것이다: *"소스는 3개 4개 다 넣어 골고루 원하는대로 쓰게"* (8/12·8/19 두 번 확정)
  fe_329: 1.2329, fe_330: 1.1825, fe_331: 1.4665, fe_332: 1.1915, fe_333: 1.4686, fe_334: 1.3531, fe_335: 1.2035,
  fe_336: 1.0493, fe_337: 1.0539, fe_338: 1.1662, fe_339: 1.0982, fe_340: 1.0848, fe_341: 1.2277, fe_342: 1.2901,
  fe_343: 1.2348, fe_344: 1.2237, fe_345: 1.2329, fe_346: 1.2409, fe_347: 1.1779, fe_348: 1.0516, fe_349: 1.2532,
  fe_350: 1.1818, fe_351: 1.2268, fe_352: 1.2658, fe_353: 1.2100, fe_354: 1.2868, fe_355: 1.2507, fe_356: 1.1079,
  fe_357: 1.2448, fe_358: 1.3075, fe_359: 1.2093, fe_360: 1.2960, fe_361: 1.2336, fe_362: 1.2147, fe_363: 1.2283,
  fe_364: 1.2095, fe_365: 1.0984, fe_366: 1.0812, fe_367: 1.1135, fe_368: 1.3388, fe_369: 1.2715, fe_370: 1.2601,
  fe_371: 1.1408, fe_372: 1.4069, fe_373: 1.2245, fe_374: 1.1859, fe_375: 1.2239, fe_376: 1.1890, fe_377: 1.9442,
  fe_378: 1.9918, fe_379: 2.0041, fe_380: 1.2448, fe_381: 1.2203, fe_382: 1.1343, fe_383: 1.1768, fe_384: 1.1658,
  fe_385: 1.2020, fe_386: 1.2846, fe_387: 1.3042, fe_388: 1.2108,
  // 🍽🍽 2026-08-24 창업자 실사 음식 시트 32장 → 낱개 192컷 중 **창업자 전수 검수를 통과한 106컷**
  //   📮 창업자 = *"아예 기존 이미지를 실사같은 새로운컷으로 갈아끼우려고 다 뽑은거야"*
  //             · *"넘 ai같고 질감이 징그러워서 갈아끼워야해"*
  //   ⭐ 94개는 «같은 이름의 옛 컷을 갈아끼운 것» · 12개는 전용 그림이 처음 생긴 것
  //   ⛔ 옛 파일은 «지우지 않았다» — 그 키로 저장한 레시피가 깨진다(픽커·규칙에서만 새 키를 가리킨다)
  fe_389: 1.3080, fe_390: 1.3050, fe_391: 1.2210, fe_392: 1.2400, fe_393: 1.1298, fe_394: 1.0890, fe_395: 1.108,
  fe_396: 1.0845, fe_397: 1.1263, fe_398: 1.1375, fe_399: 1.134, fe_400: 1.1221, fe_401: 1.1200, fe_402: 1.3990,
  fe_403: 1.3900, fe_404: 1.3890, fe_405: 1.3780, fe_406: 1.3730, fe_407: 1.3680, fe_408: 1.2440, fe_409: 1.2390,
  fe_410: 1.2450, fe_411: 1.2360, fe_412: 1.2180, fe_413: 1.2200, fe_414: 1.0360, fe_415: 1.2070, fe_416: 1.2100,
  fe_417: 1.2150, fe_418: 1.1980, fe_419: 1.2460, fe_420: 1.1780, fe_421: 1.0860, fe_422: 1.0990, fe_423: 1.1040,
  fe_424: 1.0810, fe_425: 1.0940, fe_426: 1.0960, fe_427: 1.2350, fe_428: 1.2770, fe_429: 1.2840, fe_430: 1.2280,
  fe_431: 1.2430, fe_432: 1.2440, fe_433: 1.1820, fe_434: 1.1710, fe_435: 1.1560, fe_436: 1.1250, fe_437: 1.1760,
  fe_438: 1.1670, fe_439: 1.1860, fe_440: 1.2080, fe_441: 1.1980, fe_442: 1.2270, fe_443: 1.1880, fe_444: 1.1880,
  fe_445: 1.1630, fe_446: 1.1630, fe_447: 1.1840, fe_448: 1.1420, fe_449: 1.1530, fe_450: 1.2190, fe_451: 1.2020,
  fe_452: 1.1990, fe_453: 1.2010, fe_454: 1.1740, fe_455: 1.1970, fe_456: 1.1830, fe_457: 1.0230, fe_458: 1.0300,
  fe_459: 1.0080, fe_460: 1.0200, fe_461: 1.0250, fe_462: 1.2330, fe_463: 1.2790, fe_464: 1.2550, fe_465: 1.2080,
  fe_466: 1.2930, fe_467: 1.2350, fe_468: 1.1440, fe_469: 1.1440, fe_470: 1.1280, fe_471: 1.1390, fe_472: 1.1370,
  fe_473: 1.1290, fe_474: 1.1360, fe_475: 1.1330, fe_476: 1.1380, fe_477: 1.0905, fe_478: 1.1364, fe_479: 1.0951,
  fe_480: 1.2070, fe_481: 1.2050, fe_482: 1.1710, fe_483: 1.1560, fe_484: 1.1610, fe_485: 1.1640, fe_486: 1.2210,
  fe_487: 1.2110, fe_488: 1.2270, fe_489: 1.1780, fe_490: 1.1820, fe_491: 1.2020, fe_492: 1.0610, fe_493: 1.0916,
  fe_494: 1.0670,
  // ⚠️ 단독 컷 둘(fe_314·fe_328)은 «다시 잘랐다» — diecut 8 → 13.
  //    ⭐ 원본이 크면(1200px대) 같은 px 두께라도 **앱에서 얇아진다** — 앱은 전부 238px 로 줄여 그린다.
  //       8px = 앱에서 1.5px 인데 시트 컷은 2.4px 였다(60% 두께라 눈에 띄게 얇았다).
  //    📌 흰 테는 «px»이 아니라 **긴변 대비 비율(≈1.0%)** 로 맞춘다. 그래야 나란히 놓았을 때 같다.
  //    ⛔ 다시 자르면 «비율도 바뀐다» — 여기 값을 같이 고쳐야 한다(검수 절대원칙 ④).
  fh_hnc03: 1.0867, fh_htj13: 1.1181, fh_hnc04: 1.1256, fh_hnb01: 1.0252, fh_htj01: 1.0218, fh_hnc01: 1.1092, fh_hnc10: 1.2081, fh_hnc06: 1.3209, fh_hnb08: 1.2864, fh_htj05: 1.1992,
  // 🍚 한식 완성요리 뉴세트(2026-07-23·37종, 진짜 음식같은 아이콘 → 레시피 썸네일 자동매칭용). docs/stickers/음식아이콘-2507
  fh_k01: 1.0883, fh_k02: 1.2421, fh_k03: 1.0226, fh_k04: 1.1515, fh_k05: 1.0338, fh_k06: 1.1436,
  fh_k07: 1.1026, fh_k08: 1.1921, fh_k09: 0.9868, fh_k10: 1.2436, fh_k11: 1.2654, fh_k12: 1.1014,
  fh_k13: 1.2678, fh_k14: 1.2322, fh_k15: 1.2282, fh_k16: 1.1719, fh_k17: 1.2075, fh_k18: 1.2523,
  fh_k19: 1.1038, fh_k20: 1.12, fh_k21: 1.081, fh_k22: 1.1386, fh_k23: 1.0573, fh_k24: 1.125,
  fh_k25: 0.9708, fh_k26: 1.0979, fh_k27: 1.0448, fh_k28: 1.1984, fh_k29: 1.0934, fh_k30: 1.1858,
  fh_k31: 1.1295, fh_k32: 1.1714, fh_k33: 1.1942, fh_k34: 1.2163, fh_k35: 1.2179, fh_k36: 1.0281, fh_k37: 1.2418,
  // 🍝🥢🍣🥟 양식·중식·일식·분식 완성요리 뉴세트(2026-07-23·51종, blob 깨끗컷 → 레시피 썸네일 자동매칭용). docs/stickers/음식아이콘-2507
  fy_y01: 1.2961, fy_y02: 1.3017, fy_y03: 1.3047, fy_y04: 1.3289, fy_y05: 1.2026, fy_y06: 0.9962, fy_y07: 1.309,
  fy_y08: 1.3229, fy_y09: 1.1826, fy_y10: 1.3094, fy_y11: 1.1717, fy_y12: 1.348, fy_y13: 1.3519, fy_y14: 1.2465,
  fj_c01: 1.1818, fj_c02: 1.0632, fj_c03: 1.2887, fj_c04: 1.3207, fj_c05: 1.1492, fj_c06: 1.3038, fj_c07: 1.0909,
  fj_c08: 1.0989, fj_c09: 1.272, fj_c10: 1.098, fj_c11: 1.3013, fj_c12: 1.1225, fj_c13: 1.3106, fj_c14: 1.322,
  fi_j01: 1.2933, fi_j02: 1.1, fi_j03: 1.1004, fi_j04: 1.0625, fi_j05: 1.4286, fi_j06: 1.0855, fi_j07: 1.2402,
  fi_j08: 1.187, fi_j09: 1.2403, fi_j10: 1.4222, fi_j11: 1.346, fi_j12: 1.0106, fi_j13: 1.0337, fi_j14: 1.25,
  fb_b01: 0.7125, fb_b02: 1.1545, fb_b03: 1.2362, fb_b04: 1.1678, fb_b05: 1.256, fb_b06: 1.3054, fb_b07: 1.1975, fb_b08: 1.1749, fb_b09: 0.5218,
  // 🍱 예시 레시피 보충 세트(2026-07-24·15종, 덮밥·포케·불고기·전골·스무디 등 → 예시 레시피 전용 아이콘). 창업자 생성·blob 컷.
  fe_01: 1.1393, fe_02: 1.1253, fe_03: 1.139, fe_04: 1.0079, fe_05: 1.0316, fe_06: 0.9057, fe_07: 1.15, fe_08: 1.0612,
  fe_09: 1.0458, fe_10: 1.0833, fe_11: 1.2184, fe_12: 1.042, fe_13: 1.1209, fe_14: 1.2063, fe_15: 0.6739,
  // 🍱 예시 보충 2차(2026-07-24·6종, 창업자 생성). 카레·크루키·불닭냉면·요거트아이스크림·김치볶음밥·참치김치감태주먹밥.
  fe_16: 1.1336, fe_17: 1.1483, fe_18: 1.0973, fe_19: 1.1274, fe_20: 1.1475, fe_21: 1.3462,
  // 🍱 예시 보충 3차(2026-07-24·2종, 창업자 생성). 대구뭉티기·육회(생고기).
  fe_22: 1.1831, fe_23: 1.157,
  // 🍱 예시 보충 4차(2026-07-24·4종, 창업자 생성). 새우크림파스타·양배추돼지고기볶음·치즈샌드위치·로제파스타.
  fe_24: 1.3084, fe_25: 1.2963, fe_26: 1.2727, fe_27: 1.2903,
  // 🍱 예시 보충 5차(2026-07-24·24종, 창업자 생성·빈칸 리스트 완성). 국탕·반찬·면·간식·양식·일중식·디저트.
  fe_28: 1.0811, fe_29: 1.1523, fe_30: 1.0256, fe_31: 1.0938, fe_32: 1.2444, fe_33: 1.3725,
  fe_34: 1.2844, fe_35: 1.2963, fe_36: 1.2785, fe_37: 1.1475, fe_38: 1.1501, fe_39: 1.3397,
  fe_40: 1.3023, fe_41: 1.3023, fe_42: 1.2963, fe_43: 1.3084, fe_44: 1.3084, fe_45: 1.3397,
  fe_46: 1.1523, fe_47: 1.393, fe_48: 1.0332, fe_49: 0.9714, fe_50: 0.9107, fe_51: 1.2903,
  // 🍱 예시 보충 6차(2026-07-25·2종, 창업자 생성). 묵은지파스타·베이컨크림파스타(얼굴 있는 새 버전 — 옛 faceless fy_y03 대체).
  fe_52: 1.4213, fe_53: 1.393,
  // 🌏 태국·베트남 음식 9종 (2026-07-26 창업자 제공, item④) — 쌀국수·뿌팟퐁커리·분짜·월남쌈·분보싸오·스프링롤·쏨땀·반미·반쎄오 (팟타이는 기존 fe_09)
  fe_54: 1.0986, fe_55: 1.3114, fe_56: 1.1702, fe_57: 1.227, fe_58: 1.0825, fe_59: 1.1957, fe_60: 1.2737, fe_61: 1.3118, fe_62: 1.3311,
  // 🍱 추가 32종 (2026-07-28 창업자 제공) — 인식 안 되던 것 대응(덮밥·조림·치킨·전복·볶음) + 범용 조리법(무침·국·장류) + 양식·중식·빵·음료
  fe_63: 1.1307, fe_64: 1.2319, fe_65: 1.2253, fe_66: 1.1271, fe_67: 1.0831, fe_68: 1.096, fe_69: 1.1221, fe_70: 1.1151,
  fe_71: 1.2179, fe_72: 1.1358, fe_73: 1.2628, fe_74: 1.0994, fe_75: 1.2107, fe_76: 1.3774, fe_77: 1.3648, fe_78: 1.1626,
  fe_79: 1.058, fe_80: 1.0909, fe_81: 1.0565, fe_82: 1.0326, fe_83: 1.1378, fe_84: 1.2798, fe_85: 1.0067, fe_86: 1.1857,
  fe_87: 1.2238, fe_88: 1.3448, fe_89: 1.2462, fe_90: 1.1103, fe_91: 1.1616, fe_92: 1.0828, fe_93: 0.6398, fe_94: 0.5788,
  fe_95: 1.2092, fe_96: 1.2125, // 간장장아찌·고추장장아찌 (2026-07-28 창업자 제공)
  fb_bun03: 1.4272, fb_bun08: 1.3436, fb_bun05: 1.1297, fb_bun04: 1.4844, fb_bun02: 0.9498, fb_bun11: 1.351,
  fy_yng01: 1.335, fy_yng02: 1.3465, fy_yng05: 0.9915, fy_yng07: 1.3614, fy_yng09: 1.2161, fy_yng12: 1.3594,
  fj_jsk03: 1.1511, fj_jsk01: 1.0866, fj_jsk04: 1.3317, fj_jsk05: 1.1705, fj_jsk02: 1.0714, fj_jsk15: 1.3058,
  fi_isk03: 1.3454, fi_isk05: 1.0705, fi_isk02: 1.1087, fi_isk07: 1.2735, fi_isk06: 1.0921, fi_isk13: 1.0338,
  ig_jae06: 0.9851, ig_jae08: 1.1218, ig_jae10: 1.0221, ig_jae19: 1.1359, ig_jae20: 1.0164, ig_jae07: 1.0625, ig_jae09: 1.1304, ig_jae03: 1.3143, ig_jae12: 1.2778, ig_frb01: 1.0513, ig_frb03: 0.9609, ig_frb07: 0.9087, ig_frb13: 0.9945, ig_ggi03: 1.0652, ig_ggi16: 1.19, ig_hsm01: 1.1803,
  dc_dhb04: 1.0887, dc_dhb01: 0.9545, dc_dsy04: 0.8439, dc_dhb10: 1.1667, dc_dhb06: 0.8208, dc_dhb09: 1.1047, dc_dhb14: 0.9951, dc_dhb05: 1.3441, dc_dsy16: 1.3618, dc_dsy13: 1.1571, dc_dhb13: 1.0243, dc_dmn02: 0.9204, dc_dmn06: 1.0154, dc_dmn07: 1.1019,
  // 🎀 꾸미기 소품(데코) 보강 (2026-07-26, 창업자 "꾸미기 재료 늘리자" · 적당히 — 나머지 하트·심볼·미니는 다음 업뎃용으로 라이브러리 보존) — 프레임·메모(dma) 10 + 여름 제철 귀여운 식재료(꾸미기용) 5
  dc_dma01: 0.9692, dc_dma03: 1.0251, dc_dma05: 1.1474, dc_dma06: 1.0861, dc_dma07: 1.1689, dc_dma10: 0.9871, dc_dma11: 1.5288, dc_dma13: 1.1135, dc_dma14: 1.2251, dc_dma16: 0.9598,
  ig_frb02: 0.8601, ig_frb04: 1.0184, ig_frb08: 0.4769, ig_jcb19: 0.9668, ig_jae16: 1.4359,
  // 🌈 귀여운 컬러 소품 4 (창업자 픽: 무지개·꽃다발·풍선 + 케이크) — 범용·화사
  dc_nd08: 1.2941, dc_nd01: 0.737, dc_nd05: 0.6689, dc_nd16: 1.1796,
  // 🎀 창업자 시트 신규 반영 (2026-07-29) — 데코 10·프레임 5·워시테이프 4
  // 🆕 2026-07-31 재료 재고 보충 — 창업자 *"재료종류별로 재고 추가"*
  //   고기 = ⛔뼈·막대 붙은 컷(갈비·닭다리·양갈비) 빼고 «한눈에 뭔지 아는 것»만
  //   해산물 = 많이 쓰는 것 위주 (새우·연어·오징어·홍합)
  ni_01: 1.0825, ni_02: 1.027, ni_03: 1.1446, ni_04: 1.1524, ni_05: 1.0188, ni_06: 1.296, ni_07: 1.0619, ni_08: 1.1421,
  ni_09: 0.973, ni_10: 1.2767, ni_11: 1.1379, ni_12: 1.2132, ni_13: 0.6247, ni_14: 0.6853, ni_15: 0.7017, ni_16: 0.772,
  ni_17: 0.9029, ni_18: 0.6846, ni_19: 0.7513, ni_20: 0.8586, ni_21: 0.7535, ni_22: 1.2081, ni_23: 1.0381, ni_24: 1.0809,
    // 🆕 2026-07-31 창업자 시트 — 데코 소품/메모라벨/마테 + 요리 도구·재료 (컷 289~371px)
  dp_01: 1.0976, dp_02: 1.0808, dp_03: 0.7182, dp_04: 1.3571, dp_05: 1.2618, dp_06: 0.6284,
  dp_07: 0.7091, dp_08: 0.9789, dp_09: 1.4627, dp_10: 1.16, dp_11: 1.0229, dp_12: 0.9427,
  dp_13: 1.0161, dp_14: 0.9145, dp_15: 0.9229, dp_16: 0.7911, dp_17: 0.8737, dp_18: 0.8808,
  dp_19: 1.0138, dp_20: 0.9687, dp_21: 1.1429, dp_22: 0.9872, dp_23: 0.8291, dp_24: 0.9919,
  dp_25: 1.0154, dp_26: 1.0377, dp_27: 2.4965, dp_28: 1.2022, dp_29: 0.674, dp_30: 0.9476,
  dp_31: 1.0343,
  dl_01: 1.3531, dl_02: 1.0111, dl_03: 1.1433, dl_04: 0.8987, dl_05: 1.4749, dl_06: 1.0511,
  dl_07: 1.0088, dl_08: 1.2145, dl_09: 1.0183, dl_10: 1.4419, dl_11: 1.0101, dl_12: 1.1133,
  dl_13: 1.0601, dl_14: 0.9504, dl_15: 1.1661, dl_16: 0.9699, dl_17: 1.3147, dl_18: 1.0063,
  dl_19: 0.9335, dl_20: 1.2838, dl_21: 1.061, dl_22: 1.1312, dl_23: 1.1741, dl_24: 0.983,
  dl_25: 1.2305,
  // 📔📔 「한끼 일기」 속지 패키지 — 기본템 48 (2026-08-06 · 창업자 시트 4장)
  //   ⭐ 앞으로 속지 세트는 **12 × 4 = 48컷** 이 구성으로 낸다(창업자 확정
  //      *"이렇게 구성하는 걸로 할까봐 앞으로 (속지에 이런 패키지로)"*).
  //   ⛔ 자를 땐 **`--drop 0`** — 기본값이면 눈·볼터치·입이 「떨어진 잔챙이」로 지워져
  //      **얼굴이 사라지고 구멍 뚫린 도장**이 된다(표정 씰 12컷 중 3컷이 실제로 그랬다).
  //   전문 = 🗄docs/_archive/반영완료-이미지-2026-08/한끼일기-기본템-2026-08-06/README.md (앱에 다 들어가서 보관소로)
  wt_dg01: 2.3978,
  wt_dg02: 2.5581,
  // 🎂 기념일 태그 12 (2026-08-06 · 창업자 시트) — 케이크·선물·액자·하트·화환·반지·태그
  //    ·풍경엽서·티켓＋나침반·머그둘·테이블·하트둘
  //    ⭐ 창업자 *"그냥 넣자 **일기로 쓰고싶은사람도 있을지도. 딱 요리에 맞춰야하나?**"* → 넣는다.
  //       우리 컨셉이 「요리하는 나를 위한 **감정·기록 공간**」이고, 요리는 «계기»지 «전부»가 아니다.
  //       ⚠️ 단 **자산은 넓게, 정체성은 요리에** — 홈·탭·앱 설명까지 범용 다이어리로 가지 않는다.
  dga01: 0.9444,
  dga02: 0.8991,
  dga03: 0.7666,
  dga04: 0.9650,
  dga05: 1.0287,
  dga06: 0.9740,
  dga07: 0.6149,
  dga08: 0.9932,
  dga09: 1.0860,
  dga10: 1.1146,
  dga11: 1.0116,
  dga12: 1.2022,
  dgc01: 1.9212,
  dgc02: 1.1409,
  dgc03: 0.9920,
  dgc04: 0.8679,
  dgc05: 0.9722,
  dgc06: 0.9398,
  dgl01: 11.6395,
  dgl02: 10.7957,
  dgl03: 13.3067,
  dgl04: 10.4839,
  dgf01: 1.0000,
  dgf02: 1.0069,
  dgf03: 0.9709,
  dgf04: 1.0035,
  dgf05: 0.9804,
  dgf06: 1.0171,
  dgf07: 1.0033,
  dgf08: 0.9709,
  dgf09: 0.9744,
  dgf10: 0.9728,
  dgf11: 0.9492,
  dgf12: 0.9903,
  dgm01: 0.9694,
  dgm02: 0.9848,
  dgm03: 1.0197,
  dgm04: 0.9656,
  dgm05: 0.9601,
  dgm06: 0.9626,
  dgm07: 0.9966,
  dgm08: 0.9716,
  dgm09: 0.9903,
  dgm10: 0.9396,
  dgm11: 0.9474,
  dgm12: 0.9692,
  dgn01: 0.9881,
  dgn02: 0.9972,
  dgn03: 0.9588,
  dgn04: 1.1678,
  dgn05: 1.1701,
  dgn06: 1.1410,
  dgn07: 1.4661,
  dgn08: 1.1626,
  dgn09: 1.1279,
  dgn10: 1.1767,
  dgn11: 1.2165,
  dgn12: 1.2397,  wtn_01: 1.4098, wtn_02: 1.3477, wtn_03: 1.2857,
  // 🏷 라벨지 12 (`dlb`) ＋ 찢은 종이 5 (`dtp`) — 「글 상자」용 (2026-08-07)
  //   창업자 *"레꾸에도 글쓸 수 있는 라벨지들 분명있을거야. 우리 자산에도 있을거고"* — **맞았다.**
  //   `다이어리꾸미기-2026-08-06/낱개` 에 80컷이 통째로 앱에 안 들어가 있었다.
  //   (그 폴더는 지금 다 반영돼서 🗄docs/_archive/반영완료-이미지-2026-08/ 안에 있다)
  //   ⭐ 이 17컷만 **안이 비어 글을 얹을 수 있다**(나머지 63은 꽃·사진프레임·손글씨장식·도장씰).
  //   ⚠️ `dtp` 로 이름을 바꿨다 — 원본은 마테 시트에서 나와 `dta07`·`dtb05` 였는데
  //      **이름이 내용을 안 말한다**(마테가 아니라 찢은 종이다). 대응표는 그 폴더 README 에.
  //   🔍 3단계 검수 통과 — 격자 찌꺼기 0% · 갇힌 흰 판 0 · 잘림 0 · 알파 품질 OK.
  dlb01: 1.8042, dlb02: 2.7037, dlb03: 1.3660, dlb04: 3.2500, dlb05: 1.2230, dlb06: 2.8404,
  dlb07: 1.9889, dlb08: 1.4812, dlb09: 1.6599, dlb10: 1.3047, dlb11: 1.7807, dlb12: 0.5952,
  dtp01: 1.4854, dtp02: 1.4362, dtp03: 2.4276, dtp04: 2.8923, dtp05: 2.4923,
  // 🍚 「오늘의 한끼」 속지에 딸려 온 낱개 24 (2026-08-06 · 창업자 시트 한 장)
  //   ⭐ 접두어가 `dc_` 인 이유 = **크기 등급**이다. `DecorEditor.addSticker` 가 `dc_`·`ch_` 면 s 0.15(=162px),
  //      아니면 0.22(=238px) 를 준다. 이 컷들은 긴변 107~292px 라 238px 로 올리면 위치핀이 **1.74배**로
  //      확대돼 해상도 게이트(1.7배)에 걸린다. 162px 이면 전부 «줄여서» 그려지니 선이 산다.
  //   ⚠️ `dc_dma` 로 시작하면 «밑판(isBacking)» 취급이라 이름을 `dc_td` 로 뗐다.
  dc_td01: 0.9333, dc_td02: 0.9000, dc_td03: 0.9121, dc_td04: 0.9042, dc_td05: 0.9339, dc_td06: 0.9004,
  dc_td07: 1.0071, dc_td08: 1.2768, dc_td09: 0.9225, dc_td10: 0.9013, dc_td11: 1.0922, dc_td12: 1.0863,
  dc_td13: 1.1007, dc_td14: 1.1000, dc_td15: 0.7810, dc_td16: 0.9943, dc_td17: 1.7108, dc_td18: 1.7485,
  dc_td19: 0.9706, dc_td20: 1.1322, dc_td21: 0.9810,
  wt_td01: 3.5500, wt_td02: 2.1894, wt_td03: 2.0775,
  kt_01: 0.925, kt_02: 1.2031, kt_03: 0.8915, kt_04: 1.1283, kt_05: 0.8384, kt_06: 0.9378,
  kt_07: 0.8135, kt_08: 0.8477, kt_09: 0.862, kt_10: 0.8617, kt_11: 0.8383, kt_12: 1.3684,
  kt_13: 1.3344, kt_14: 1.2297, kt_15: 0.789, kt_16: 1.0521, kt_17: 0.9918, kt_18: 0.7165,
  kt_19: 0.7413, kt_20: 0.7907, kt_21: 0.801, kt_22: 0.8514, kt_23: 1.0212, kt_24: 1.3082,
  kt_25: 1.0171, kt_26: 0.8293, kt_27: 0.9659, kt_28: 0.6704, kt_29: 0.6759, kt_30: 0.9407,
  kt_31: 1.0495, kt_32: 1.016, kt_33: 0.9433,
  dn_ribbon: 1.0881, dn_cherry: 0.9474, dn_peach: 0.959, dn_star: 1.2282, dn_sparkle: 1.0236,
  dn_shoot: 1.2453, dn_coffee: 0.9742, dn_plant: 0.6928, dn_bunting: 1.5667, dn_sachet: 0.8861,
  fn_speech: 1.1762, fn_daisy: 0.9861, fn_bow: 0.9443, fn_night: 1.0305, fn_gingham: 1.0517,
  ws_pinkdot: 1.3596, ws_greendot: 1.731, ws_bluedot: 1.4091, ws_pinkstripe: 1.8105,
  // 🍳 주방도구 (2026-07-29) — 라이프 탭이 운동용품뿐이라 요리앱과 안 맞았다.
  tk_apron: 0.8407, tk_hat: 0.9762, tk_pot_pink: 1.3318, tk_pot_green: 1.2639, tk_bowl: 0.9553,
  tk_batter: 1.0119, tk_board_knife: 0.9924, tk_board: 0.8468, tk_cup: 1.057, tk_scale: 0.8356,
  tk_mitt: 0.7828, tk_mitt_purple: 0.8537, tk_book: 1.2, tk_bag: 0.812, tk_basket: 0.9331,
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
  sk_01: 0.9071, sk_02: 1.0433, sk_03: 0.9963, sk_04: 0.988, sk_05: 0.9684, sk_06: 0.9333, sk_07: 1.0706, sk_08: 0.9839,
  sk_09: 1.0109, sk_10: 0.9888, sk_11: 0.6458, sk_12: 1.555, sk_13: 1.0282, sk_14: 1.2269, sk_15: 1.3365, sk_16: 1.8303,
  st_01: 0.9054, st_02: 0.8997, st_03: 0.8973, st_04: 0.9027, st_05: 1.0388, st_06: 0.9099, st_07: 1.0119, st_08: 0.9469,
  st_09: 0.994, st_10: 1.0385, st_11: 1.1024,
  // 🏖 여름 프레임 재제작 12컷 (2026-07-30) — 옛 `sf_` 16컷을 대체한다. 아래 그룹 주석 참고.
  pf_sm01: 0.8764, pf_sm02: 0.9681, pf_sm03: 1.0197, pf_sm04: 0.9016, pf_sm05: 0.9548, pf_sm06: 0.9585,
  pf_sm07: 0.9854, pf_sm08: 1.0125, pf_sm09: 1.0281, pf_sm10: 1.0263, pf_sm11: 0.8223, pf_sm12: 0.9649,
  // 🎉 출시기념 축하 3컷 (2026-08-01) — 원본 `여름-창업자-2507/낱개-콤비축하`.
  //    ⛔ 같은 시트의 `04`(맥주 건배)는 **안 쓴다** — 콘텐츠 등급이 전체 이용가다.
  // 🦫🐧 카롱 × 펭펭 «부녀 케미» 12컷 (창업자 2026-08-01 *"얘들은 부녀케미가 있네"*)
  //    ⭐ 2026-08-01 확정한 「가을 = 펭펭 × 카롱」의 그 짝이다.
  //    카롱 = 온천수건＋코랄 트레이닝복(체력왕) · 펭펭 = 베이지 트렌치＋베레모.
  //
  // ⚠️⚠️ **2026-08-03 카롱을 통째로 다시 그렸다** — 옛 컷은 창업자 판정 *"카롱이 좀 곰같지 않아?"*.
  //    크림색 몸에 둥근 귀라 **꼬르곰과 종이 안 갈렸다.** 새 컷은 갈색＋네모 주둥이＋온천수건.
  //    ⛔ 옛 12장(서랍 9·씬 3)은 지우지 않고 옮겼다 — 2026-08-15 부터 🗄보관소 안이다
  //       (docs/_archive/옛컷-2026-08/_옛컷-백업-2026-08-03-카롱/ · 창업자 지시가 있어야 열린다).
  //    ⭐ **갈아끼워도 안전했던 이유** = 서랍 그룹이 `from: '2026-09-01'` 이라 **아직 아무도 못 썼다**
  //       (꾸며 저장한 표지가 깨질 일이 없다 — `kf_c_`·`sf_` 때와 상황이 다르다).
  //    ⛔⛔ **씬 3컷은 달랐다** — `scenepool` 은 **날짜 게이트가 없어서** 폴라로이드 카드에
  //       **이미 나가고 있었다.** 📌 자산을 갈 땐 「날짜로 잠긴 곳」과 「그냥 열린 곳」을 따로 센다.
  kp_run: 1.2739, kp_salad: 1.4823, kp_chill: 1.3441, kp_yoga: 1.4393,
  kp_shoulder: 0.5339, kp_hug: 0.7167, kp_muscle: 0.8435, kp_bench: 1.0398,
  kp_walk: 1.4447, kp_dumbbell: 1.3239, kp_leafsit: 1.6530, kp_rake: 1.4189,
  // 🍱 2026-08-01 창업자 시트 8장 → 새 음식 37컷 (`docs/stickers/음식-창업자-2608/`)
  //    ⭐ 그중 4컷은 **기존이 「SVG 도형」이라 그림이 아니던 자리**(무생채·스튜·소스)와
  //       **제목이 엉뚱한 아이콘에 걸리던 자리**(두루치기·깍두기·김치전)를 메운다.
  fe_97: 1.0491, fe_98: 1.0281, fe_99: 1.0581, fe_100: 1.2100, fe_101: 1.2159, fe_102: 0.9467,
  fe_103: 1.1019, fe_104: 1.0782, fe_105: 1.1575, fe_106: 1.3010, fe_107: 1.2322, fe_108: 1.1218,
  fe_109: 0.9399, fe_110: 1.0435, fe_111: 1.1228, fe_112: 1.1975, fe_113: 1.1914, fe_114: 1.1443,
  fe_115: 1.1798, fe_116: 1.1222, fe_117: 1.1348, fe_118: 1.1277, fe_119: 1.1651, fe_120: 1.1222,
  fe_121: 1.2164, fe_122: 1.1234, fe_123: 1.1433, fe_124: 1.0979, fe_125: 1.1306, fe_126: 1.0623,
  fe_127: 1.2283, fe_128: 1.2632, fe_129: 1.2351, fe_130: 1.0403, fe_131: 1.1742, fe_132: 1.2107,
  fe_133: 1.245,
  // 🍳 2026-08-02 창업자 시트 6컷 — 8월 주간 레시피용(범용 「볶음·회·파전」으로 때우던 자리)
  fe_134: 1.2547, fe_135: 1.1808, fe_136: 1.1328, fe_137: 1.2995, fe_138: 1.2575, fe_139: 1.1747,
  // 🍱 2026-08-05 창업자 시트 6장(35칸) → **16컷만** 반영.
  //   ⛔ 13칸은 앱에 이미 같은 그림이 있어 뺐고(탕수육·튀김·오이소박이·짜장면·동파육·육개장·스프·
  //      회덮밥·연어장·새우장(간장)·어묵탕·꼬막비빔밥·간장찜닭), A장·D장이 5칸을 겹쳐 그려 하나씩만 썼다.
  //   📌 대조는 손으로 안 셌다 — ICON_RULES·FOOD_NAMES ＋ photo/*.png 존재 여부를 코드로 맞추고 눈으로 확인.
  //      ⚠️ 그러다 두 번 틀렸는데 둘 다 «방식»이 틀린 것이었다(규칙 18) →
  //         ⑴별칭을 나중 것으로 덮어써 범용 도형이 이겼다(앱은 «처음» 걸리는 규칙을 쓴다)
  //         ⑵「이름이 걸린다」를 「진짜 그림이 있다」로 읽었다(범용 도형은 png 가 없다)
  //   자세히 = docs/stickers/음식아이콘-창업자-2026-08-05/README.md
  fe_140: 1.0934, fe_141: 1.2597, fe_142: 1.0929, fe_143: 1.093, fe_144: 1.3445, fe_145: 1.0646,
  fe_146: 1.0401, fe_147: 1.2468, fe_148: 1.2168, fe_149: 1.2571, fe_150: 1.3114, fe_151: 1.06,
  fe_152: 1.087, fe_153: 1.0723, fe_154: 1.1308, fe_155: 1.182,
  // 🍱 2026-08-11 창업자 새 시트 8장 → 48컷
  fe_156: 1.0905, fe_157: 1.1483, fe_158: 1.1214, fe_159: 1.1932,
  fe_160: 1.0728, fe_161: 1.038, fe_162: 1.1279, fe_163: 1.1875,
  fe_164: 1.155, fe_165: 1.0823, fe_166: 1.0925, fe_167: 1.1204,
  fe_168: 1.1555, fe_169: 1.1084, fe_170: 1.1019, fe_171: 1.2315,
  fe_172: 1.0914, fe_173: 1.2564, fe_174: 1.1579, fe_175: 1.1843,
  fe_176: 1.0769, fe_177: 1.0743, fe_178: 1.0962, fe_179: 1.1316,
  fe_180: 1.2397, fe_181: 1.2402, fe_182: 1.2515, fe_183: 1.11,
  fe_184: 1.1705, fe_185: 1.1123, fe_186: 0.6632, fe_187: 1.027,
  fe_188: 1.3003, fe_189: 1.1028, fe_190: 1.4274, fe_191: 1.1178,
  fe_192: 1.0643, fe_193: 1.0847, fe_194: 1.0581, fe_195: 1.1262,
  fe_196: 1.1429, fe_197: 1.1166, fe_198: 1.1588, fe_199: 1.1757,
  fe_200: 1.3642, fe_201: 1.1709, fe_202: 1.17, fe_203: 1.1557,
  // 🍱 2026-08-12 창업자 새 시트 10장 → 57컷. ⚠️ PNG 를 갈아끼우면 이 비율도 «같이» 고칠 것.
  fe_204: 1.2329, fe_205: 1.1825, fe_206: 1.4665, fe_207: 1.1573,
  fe_208: 1.2284, fe_209: 1.3531, fe_210: 1.2035, fe_211: 1.0493,
  fe_212: 1.0539, fe_213: 1.1662, fe_214: 1.0982, fe_215: 1.0848,
  fe_216: 1.2277, fe_217: 1.2901, fe_218: 1.2348, fe_219: 1.2237,
  fe_220: 1.2329, fe_221: 1.2409, fe_222: 1.1779, fe_223: 1.0516,
  fe_224: 1.1928, fe_225: 1.1818, fe_226: 1.2268, fe_227: 1.2658,
  fe_228: 1.2100, fe_229: 1.2868, fe_230: 1.2507, fe_231: 1.1079,
  fe_232: 1.2448, fe_233: 1.3075, fe_234: 1.2093, fe_235: 1.2960,
  fe_236: 1.2336, fe_237: 1.2147, fe_238: 1.2283, fe_239: 1.2095,
  fe_240: 1.0984, fe_241: 1.0812, fe_242: 1.1135, fe_243: 1.3388,
  fe_244: 1.2715, fe_245: 1.2601, fe_246: 1.1408, fe_247: 1.4069,
  fe_248: 1.1256, fe_249: 1.1859, fe_250: 1.2239, fe_251: 1.1890,
  fe_252: 1.9442, fe_253: 1.9918, fe_254: 2.0041, fe_255: 1.1768,
  fe_256: 1.1658, fe_257: 1.2020, fe_258: 1.2046, fe_259: 1.3042,
  fe_260: 1.2108,
  // 🍱 2026-08-14 창업자 새 시트 3장(15컷) ＋ 「줬는데 안 넣었던」 8컷
  fe_261: 1.2121, fe_262: 1.1833, fe_263: 1.3348, fe_264: 1.1449,
  fe_265: 1.1459, fe_266: 1.2600, fe_267: 1.0918, fe_268: 1.4078,
  fe_269: 0.7244, fe_270: 1.11, fe_271: 1.1232, fe_272: 1.1818,
  fe_273: 1.1404, fe_274: 1.2225, fe_275: 1.3644, fe_276: 0.9833,
  fe_277: 1.2987, fe_278: 1.1790, fe_279: 1.0192, fe_280: 1.0518,
  fe_281: 1.0217, fe_282: 1.2321, fe_283: 1.2539, fe_284: 1.3629,
  // 🍱 2026-08-15 창업자 시트 4장 → 20컷 (fe_285~fe_304)
  //   ⭐ 비율이 전부 1.00~1.28 — 정사각에 가까워 아이콘 칸에 꽉 찬다(1.9 넘으면 얇은 띠가 된다)
  // ⚠️ 2026-08-15 «네 번째» 재컷으로 다시 잰 값 — 📮 *"소스 바닥잘렸어"* → *"수정할 거 다 끝난거야?"* → *"솥 아래 흰색 부분 잘렸어"*
  //    ⛔ PNG 를 갈아끼우면 «비율도 반드시 같이» 고친다(v8.90 에 59개가 어긋난 적이 있다).
  //    ✅ 지금 판 = 19컷이 v10.79 와 «픽셀 단위로 동일» · fe_290 만 「솥」 글자 조각 18px 이 빠졌다
  fe_285: 1.0955, fe_286: 1.123, fe_287: 1.1647, fe_288: 1.1082, fe_289: 1.0853,
  fe_290: 1.0501, fe_291: 1.1307, fe_292: 1.0587, fe_293: 1.0702, fe_294: 0.9974,
  fe_295: 1.1300, fe_296: 1.0158, fe_297: 1.1611, fe_298: 1.1424, fe_299: 1.1139,
  fe_300: 1.0516, fe_301: 1.0525, fe_302: 1.1497, fe_303: 1.2292, fe_304: 1.0782,
  ce_manse: 0.7471, ce_pokjuk: 0.5848, ce_cheers: 1.0923,
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
  sm_gom_beach: 0.745, sm_gom_tube: 0.8614, sm_gom_bbq: 0.7759, sm_gom_chair: 1.0375,
  sm_peng_beach: 0.9909, sm_peng_tube: 0.9875, sm_peng_shop: 0.7225, sm_peng_night: 0.9295,
  sm_duo_watergun: 1.1719, sm_duo_tube: 1.1434, sm_duo_watermelon: 1.0156, sm_duo_icecream: 1.0527,
  wt_wave: 2.7939, wt_shell: 2.8182, wt_palm: 2.7605, wt_stripe_blue: 2.9423,
  wt_starfish: 2.8457, wt_wave_mint: 2.8282,
  // 🍂 가을·추석·핼러윈·크리스마스 (창업자 2026-07-30 제공 112컷) — 실제 PNG 크기로 계산
  au_b01: 0.8654, au_b02: 0.8985, au_b03: 0.7329, au_b04: 0.9581, au_b05: 0.8163, au_b06: 0.913,
  au_b07: 0.9887, au_b08: 0.7875, au_b09: 0.8825, au_b10: 0.8296, au_b11: 0.9242, au_b12: 0.8576,
  au_b13: 0.6927, au_b14: 0.5966, au_b15: 0.8954, au_b16: 0.9555, au_b17: 0.7652, au_b18: 0.6462,
  au_t01: 2.8194, au_t02: 2.8774, au_t03: 2.8645, au_t04: 2.8341, au_t05: 2.7926, au_t06: 2.7909,
  au_s01: 0.9938, au_s02: 0.9752, au_s03: 0.9753, au_s04: 1.0,
  au_i01: 1.3945, au_i02: 1.0682, au_i03: 0.9429, au_i04: 0.9072, au_i05: 1.2409, au_i06: 1.2265,
  au_i07: 1.248, au_i08: 1.0925, au_i09: 1.2857, au_i10: 1.0867, au_i11: 0.9421, au_i12: 0.9862,
  au_i13: 0.7011, au_i14: 1.1185, au_i15: 0.7067, au_i16: 0.5123, au_i17: 0.8249, au_i18: 0.9167,
  au_i19: 0.9698, au_i20: 0.8324, au_i21: 0.9659,
  // 🍁 2026-08-03 창업자 보충 21컷 — **유료팩에 뺏긴 16컷 자리를 다시 채운 것**
  //   ⭐ 다꾸 톤(굵은 갈색 선)으로 뽑았다 — 수채 톤은 유료팩이 가져갔으니 겹치지 않는다.
  //   ✅ `tools/dupart.py` 로 유료팩·앱 전체와 대조 = 겹침 0
  //      (앱과 닮았다고 뜬 5컷은 전부 헛것이었다 — 솔방울↔토마토·단풍잎↔잡채. 눈으로 확인)
  //   ⛔ 시트끼리 겹친 6컷은 뺐다 = ax_02·04·11 · ay_04·05·11 (열매가지·도토리·편지·머그·노트·은행잎)
  au_i22: 0.8453, au_i23: 0.9754, au_i24: 1.1757, au_i25: 1.0112, au_i26: 1.1597, au_i27: 0.8946,
  au_i28: 1.0391, au_i29: 0.9439, au_i30: 0.7937, au_i31: 1.48, au_i32: 1.0971, au_i33: 1.148,
  au_i34: 1.1402, au_i35: 1.4059, au_i36: 1.1231, au_i37: 1.2462, au_i38: 0.9628, au_i39: 1.5528,
  au_i40: 0.6912, au_i41: 1.0159, au_i42: 1.3405,
  // 🍂 [2026-08-29] 가을 소품 8컷 — 창업자 시트 `가을-창업자-2026-08-26`(담요·머그·호박·도토리·초·장화·바구니·버섯)
  //    ⛔ PNG 는 진작 들어와 있었는데 이 줄이 없어서 **어디서도 못 쓰는 유령**이었다.
  au_i43: 1.1348, au_i44: 1.0512, au_i45: 1.1881, au_i46: 1.0000,
  au_i47: 0.9943, au_i48: 1.0179, au_i49: 1.0432, au_i50: 1.0938,
  // 🖼 [2026-08-29] 가을 프레임 4컷 — 창업자 시트 `가을-창업자-2026-08-26/원본시트/가을프레임-진한배경.png`
  //    ⛔ 이름이 `pf_` 로 시작해야 한다 — `DecorEditor.isBacking` 이 접두어로 «밑판»을 가른다.
  pf_au01: 1.2509, pf_au02: 1.3953, pf_au03: 1.2784, pf_au04: 1.3090,
  // 🍽 9월 선물 = 가을 접시 4컷 (창업자 확정 2026-08-29 · A1·A4·B1·B4)
  //    ⛔ 안 고른 넷(pf_ad02·03·06·07)은 «파일도 안 넣었다» — 유료 그릇팩에 들어갈 것이라
  //       docs/stickers/그릇-창업자-2026-08-29/낱개-가을접시-2차/ 에만 있다.
  pf_ad01: 1.2401, pf_ad04: 1.2880, pf_ad05: 1.3221, pf_ad08: 1.3402,
  // 🐧 2026-07-31 창업자 재생성 — 옛 펭펭은 트렌치가 «흰색»이라 다시 뽑았다(au_b05~08은 덮어씀)
  au_b19: 0.9676, au_b20: 0.8307, au_b21: 1.1627, au_b22: 0.9625,
  // 🐻🐧 [2026-08-29] 가을 곰펭 8컷 — 창업자 시트 `가을곰펭-창업자-2026-08-27`. 같은 유령이었다.
  au_b23: 1.1867, au_b24: 0.7712, au_b25: 0.9692, au_b26: 1.1053,
  au_b27: 1.0220, au_b28: 0.8442, au_b29: 1.2063, au_b30: 1.1978,
  cs_b01: 0.7309, cs_b02: 0.7008, cs_b03: 1.0491, cs_b29: 0.9071,
  cs_i01: 1.0077, cs_i08: 1.7105, cs_i14: 0.9775,
  hw_01: 1.1072, hw_04: 0.9547, hw_09: 0.8685,
  hw_13: 0.9522,
  xm_01: 0.7759, xm_02: 0.718, xm_03: 0.9472, xm_04: 0.615,
  ch_che01: 0.806, ch_che04: 1.399, ch_che06: 1.0724, ch_che08: 1.285, ch_che05: 0.9354,
  lf_fit12: 1.5443, lf_fit11: 1.436, lf_fit08: 1.2205, lf_fit07: 1.1709, lf_fit02: 1.0825, lf_fit13: 0.7045, lf_fit14: 1.1691, lf_fit06: 0.697,
  cp_cpf01: 0.8659, cp_cpf02: 0.9215, cp_cpf03: 0.8136, cp_cpf04: 0.8604, cp_cpf05: 0.9968, cp_cpf06: 1.0358, cp_cpf07: 0.9139, cp_cpf08: 0.8815,
  // 🐻🐧 뉴 물결 곰펭(2026-07-23·정본) — 곰4·펭5·콤비4. 띠부씰(흰 다이컷 테두리·2026-07-23) 반영 → 비율 갱신.
  // (plain 원본은 docs/stickers/곰펭-물결-신규-2507/낱개/ 아카이브. cp_cpf 옛 파이팅은 저장표지 호환용으로만 남김.)
  gp_gomft: 0.8171, gp_gomtb: 0.8312, gp_gomv: 0.8265, gp_gomhi: 0.8891, gp_pengft: 0.7982, gp_pengtb: 0.7902, gp_pengv: 0.8336, gp_penghi: 0.82, gp_pengym: 0.7945, gp_duohi: 1.0608, gp_duoht: 1.0253, gp_duoh5: 1.1873, gp_duotb: 1.1303,
  // 🦫 카롱 «솔로» (2026-08-10 창업자 시트) — 앱의 `kp_*` 12컷은 전부 «카롱＋펭펭 콤비»라 솔로가 0컷이었다.
  //    ⏳9/1 에 「카롱과 펭펭」 12컷과 «같이» 열린다 — 가을 = 카롱 데뷔(뾰미는 겨울 · 창업자 2026-08-10 확정).
  ka_g02: 0.8003, ka_g03: 0.7828, ka_c02: 0.7203, ka_c04: 0.8942,
  // ✏️ 글자 스티커 (2026-07-29) — 다꾸의 절반이 글자인데 앱엔 응원 문구 6개뿐이고
  //    숫자·요일은 0개였다. 창업자가 스타일별로 18장 뽑아준 것 중 **우리 마감과 같은 4장**만 채택
  //    (진갈색 굵은 외곽선 + 파스텔 채움 + 흰 다이컷). 라인 계열은 톤도 다르고 자동 오림도
  //    안 돼서(속 흰색이 배경과 이어짐) 심플 다꾸 세트로 미룸. → docs/stickers/글자-창업자-2507/
  // 📔 다이어리 꾸미기 (2026-08-06 · 창업자 9시트 → 낱개 84 중 80컷)
  //   ⚠️ 마테 두 시트가 절반 겹쳐서 창업자 판정으로 4컷을 내렸다(빨강·X자·파랑접힘·초록체크).
  //   ⚠️ `wt_dy10` 은 «없다» — 내린 컷 자리라 번호가 하나 빈다. 빈 게 정상이다.
  pf_dy01: 0.7224, pf_dy02: 1.1053, pf_dy03: 1.2893, pf_dy04: 0.9909, pf_dy05: 0.673, pf_dy06: 0.6492, pf_dy07: 1.2055, pf_dy08: 0.7785, pf_dy09: 1.0899, pf_dy10: 1.0247, pf_dy11: 1.6812, pf_dy12: 0.9662,
  dyf01: 0.8179, dyf02: 0.9369, dyf03: 0.6534, dyf04: 0.9744, dyf05: 0.8148, dyf06: 0.8431, dyf07: 0.9839, dyf08: 0.8975, dyf09: 0.9902, dyf10: 1.0102, dyf11: 2.1637, dyf12: 0.8191,
  wt_dy01: 2.0833, wt_dy02: 1.9554, wt_dy03: 2.6825, wt_dy04: 1.9427, wt_dy05: 3.3304, wt_dy06: 2.0263, wt_dy07: 1.4854, wt_dy08: 1.4362, wt_dy09: 3.0067,
  wt_dy11: 3.0156, wt_dy12: 2.38, wt_dy13: 5.0403, wt_dy14: 2.4276, wt_dy15: 3.8095, wt_dy16: 2.8923, wt_dy17: 2.4923, wt_dy18: 1.0389, wt_dy19: 1.2008, wt_dy20: 1.5347, wt_dy21: 5.9167,
  dys01: 1.8439, dys02: 2.1507, dys03: 1.0, dys04: 0.9892, dys05: 0.7559, dys06: 0.8098, dys07: 1.4798, dys08: 2.2589, dys09: 1.486, dys10: 1.5769, dys11: 0.8232, dys12: 1.0704,
  dyl01: 1.8042, dyl02: 2.7037, dyl03: 1.366, dyl04: 3.25, dyl05: 1.223, dyl06: 2.8404, dyl07: 1.9889, dyl08: 1.4812, dyl09: 1.6599, dyl10: 1.3047, dyl11: 1.7807, dyl12: 0.5952,
  dyh01: 1.2945, dyh02: 2.2167, dyh03: 1.3102, dyh04: 2.6703, dyh05: 3.2959, dyh06: 1.7509, dyh07: 0.9677, dyh08: 1.1484, dyh09: 0.9744, dyh10: 1.7097, dyh11: 2.0938, dyh12: 2.7112,
  tw_haenaem: 1.1838, tw_night: 1.1641, tw_first: 1.2218, tw_5min: 1.3668, tw_again: 1.4059,
  tw_wow: 1.1411, tw_salty: 1.0695, tw_better: 1.3389, tw_really: 1.4009, tw_daebak: 1.1982,
  tw_today: 1.1, tw_success: 1.2739, tw_more: 1.1199, tw_tasty: 1.3453, tw_welldone: 0.9582,
  tw_fav: 1.1074, tw_honey: 0.9929, tw_easy: 1.124, tw_hearty: 1.2652, tw_mom: 1.1347,
  tw_nexttime: 0.9883, tw_fail: 1.3548, tw_yummy: 1.2424, tw_best: 1.1221, tw_ourhankki: 1.3498,
  tw_goodday: 1.4292,
  tn_mon: 1.0261, tn_tue: 1.0306, tn_wed: 1.0306, tn_thu: 1.0216, tn_fri: 1.0433,
  tn_sat: 1.0041, tn_sun: 1.0165, tn_cal: 1.1084, tn_ribbon: 1.8966, tn_circle: 0.9808,
  ta_right: 1.8101, ta_left: 1.6918, ta_up: 0.6718, ta_down: 0.7962, ta_curve: 1.4158,
  ta_loop: 1.7158, ta_dash: 5.5455, ta_wave: 1.2442, ta_leaf: 2.9841, ta_check: 1.1043,
  ta_checkc: 0.9958, ta_star: 1.2197,
  // ✏️ 창업자 문구 시트 2026-07-31 신규 6종
  tw_itsme: 1.4038, tw_bland: 1.2773, tw_funfun: 1.5385, tw_kidpick: 1.4194, tw_hubbypick: 1.4324, tw_admit: 1.551,
  // 🍳 레꾸 상황·평가 스티커 99컷 (2026-08-08 창업자 시트 14장 · 그림+캡션이 한 컷)
  //   변형쌍 판정 = 창업자 2026-08-08: 조리법 귀요미(rs_q)·식사 노랑(rs_m)·건강 그린(rs_g)·상황 아이콘(rs_i)
  //   탈락 벌(사실화 rs_c·초록 rs_n·사람손 rs_h·블루 rs_b)은 docs 낱개에만 있고 앱엔 안 들였다
  rs_t01: 0.9184, rs_t02: 0.9491, rs_t03: 0.8401, rs_t04: 0.9152, rs_t05: 0.8057, rs_t06: 0.6901,
  rs_t07: 0.6342, rs_t08: 0.9065, rs_t09: 0.845, rs_t10: 0.9174, rs_t11: 1.0063, rs_t12: 0.7485,
  rs_r01: 0.8635, rs_r02: 0.8063, rs_r03: 0.9452, rs_r04: 1.1727, rs_r05: 1.0069, rs_r06: 0.94,
  rs_r07: 0.9211, rs_r08: 0.9363, rs_r09: 0.8313, rs_r10: 1.0093, rs_r11: 0.678, rs_r12: 1.0651,
  rs_q01: 0.9177, rs_q02: 0.8671, rs_q03: 0.9915, rs_q04: 1.0194, rs_q05: 0.8818, rs_q06: 0.9307,
  rs_q07: 1.0286, rs_q08: 1.1603, rs_q09: 0.8612, rs_q10: 0.8915, rs_q11: 0.7912, rs_q12: 0.8817,
  rs_m01: 1.1644, rs_m02: 1.1086, rs_m03: 1.0541, rs_m04: 1.0976, rs_m05: 1.0068, rs_m06: 1.0977,
  rs_m07: 1.214, rs_m08: 1.5175, rs_m09: 1.4286, rs_m10: 1.8479, rs_m11: 1.4801, rs_m12: 1.6766,
  rs_i01: 0.9366, rs_i02: 1.07, rs_i03: 1.0162, rs_i04: 1.0915, rs_i05: 1.1703, rs_i06: 1.12,
  rs_i07: 1.0304, rs_i08: 1.0305, rs_i09: 1.0209, rs_i10: 1.1037, rs_i11: 1.1222, rs_i12: 1.124,
  rs_i13: 1.0502, rs_i14: 1.254, rs_i15: 1.2509,
  rs_p01: 0.8555, rs_p02: 0.912, rs_p03: 0.7514, rs_p04: 0.7007, rs_p05: 0.806, rs_p06: 0.7994,
  rs_p07: 0.8222, rs_p08: 0.858, rs_p09: 0.8121, rs_p10: 0.9048, rs_p11: 0.72, rs_p12: 0.9203,
  rs_s01: 1.0259, rs_s02: 1.0592, rs_s03: 1.0705, rs_s04: 0.9524, rs_s05: 1.0, rs_s06: 0.9876,
  rs_s07: 0.9375, rs_s08: 0.9753, rs_s09: 1.0958, rs_s10: 0.9189, rs_s11: 0.9184, rs_s12: 1.1053,
  rs_g01: 0.9479, rs_g02: 0.8257, rs_g03: 0.8087, rs_g04: 0.9, rs_g05: 0.949, rs_g06: 0.8576,
  rs_g07: 1.0459, rs_g08: 0.9763, rs_g09: 1.0739, rs_g10: 0.8209, rs_g11: 0.8196, rs_g12: 0.8801,
  // 🐻🐧 레꾸 캐릭터 32컷 (2026-08-12 창업자 시트 2장 · 레꾸 전용 · `only: 'cover'`)
  //   ⚠️ 위 `rs_*` 보다 세로로 길다(0.54~1.01) — 칸 «아래»에 캡션이 붙은 채로 잘랐기 때문이다.
  //   ⚠️ 2026-08-12 재컷(띠부씰 흰 테 2px)으로 비율이 조금 달라졌다 — PNG 를 바꾸면 여기도 «반드시» 같이.
  rs_v01: 1.069, rs_v02: 1.4777, rs_v03: 0.6217, rs_v04: 1.0356, rs_v05: 1.0919, rs_v06: 0.732,
  rs_v07: 0.9435, rs_v08: 0.9695, rs_v09: 0.9203, rs_v10: 0.8664, rs_v11: 1.1081, rs_v12: 0.7786,
  rs_v13: 1.0289, rs_v14: 0.995, rs_v15: 0.9048, rs_v16: 1.0443,
  rs_k01: 0.9368, rs_k02: 1.036, rs_k03: 0.8423, rs_k04: 1.0299, rs_k05: 0.9404, rs_k06: 0.9903,
  rs_k07: 0.9883, rs_k08: 1.0043, rs_k09: 1.019, rs_k10: 0.8817, rs_k11: 0.846, rs_k12: 0.9457,
  rs_k13: 0.9124, rs_k14: 0.8591, rs_k15: 1.0514, rs_k16: 1.127,

  // ══════════════════════════════════════════════════════════════════════════
  // 💰 **유료팩 154컷 — 2026-08-05 결제 준비로 앱에 들였다**
  //
  // ⛔⛔ **이 컷들은 여기 «있어도» 서랍에 안 보인다.** 서랍 그룹에 안 올려 뒀기 때문이다.
  //    올리는 건 `paidPacks.js` 의 `sellable: true` 가 되는 날 — 그때 **자물쇠 그룹**으로 올린다.
  //    (창업자 2026-08-03 *"결제붙는날 전체를 다 보여줘야지. 이런게 있으니 사라고"*)
  //
  // ⭐ 왜 미리 넣나 = **그림이 앱 안에 있어야 자물쇠로 «보여줄» 수 있다.**
  //    2026-08-05 에 세어 보니 팔기로 한 192컷 중 **154컷(80%)이 앱에 아예 없었다.**
  //    할 일 목록에도 이 단계가 빠져 있었다 — 자물쇠 UI 를 먼저 만들었으면 빈 칸만 나왔다.
  //
  // ⚠️ **웹앱이라 파일 자체는 번들에 들어간다** — 자물쇠는 «화면에서» 막는 것이지
  //    파일을 못 받게 막는 게 아니다. 990원 스티커에 서버를 붙이는 건 과하다고 보고 이 선을 택했다.
  //
  // 📌 넣기 전에 확인한 것 ⑴이름 충돌 0(전에 `pf_a` 로 무료 프레임 6컷이 잠긴 사고가 있었다)
  //    ⑵원본이 여러 군데인 것 0 ⑶전부 RGBA(투명) ⑷ratio = 가로÷세로 (기존 120장으로 규칙 확인)
  //    검사 = `scripts/check-packassets.mjs`
  // ══════════════════════════════════════════════════════════════════════════
  // 👻 **파일만 있고 등록이 없던 32컷** — 새 검사(`check-packassets.mjs`)가 잡았다
  //   ⛔ 「앱에 파일이 있다」고 세면 38컷이 있는 걸로 보였는데,
  //      **그중 32컷은 `PHOTO_RATIO` 에 없어서 어디서도 못 쓰는 유령**이었다.
  //      예전에 복사만 해 두고 등록을 잊은 것이다 — 파일이 있으니 아무도 몰랐다.
  //   📌 그래서 검사가 «파일»과 «등록»을 따로 센다. 하나만 봐선 못 잡는다.
  cs_b06: 0.7305, cs_b07: 0.9413, cs_b08: 0.8102, cs_b09: 0.9797, cs_b10: 0.8327, cs_b19: 0.9624,
  cs_b20: 0.774, cs_b21: 1.0078, cs_b28: 0.9071, cs_b05: 1.0344, cs_b11: 0.7709, cs_b13: 1.0068,
  cs_b17: 0.8701, cs_b18: 0.8946, cs_b04: 1.0589, cs_i02: 0.8263, cs_i03: 1.0491, cs_i04: 1.0475,
  cs_i07: 1.114, cs_i09: 0.7287, cs_i16: 0.4731, hw_03: 1.0252, hw_05: 0.7695, hw_06: 1.2945,
  hw_07: 0.7017, hw_08: 0.7654, hw_10: 0.8907, hw_11: 0.8977, hw_12: 0.9258, hw_14: 0.785,
  hw_15: 0.9382, hw_16: 0.9266,
  // 🎑 추석 유료팩 — 37컷
  hb01: 0.7424, hb03: 0.7374, hb04: 0.9336, hb07: 0.9606, hd01: 1.0084, hd02: 1.1135,
  cp_01: 0.5765, cp_02: 0.75, cp_03: 0.6467, cp_04: 0.9585, cp_05: 0.9525, cp_06: 0.9296,
  cp_07: 0.9624, cp_11: 0.8688, ct_01: 5.9373, ct_02: 6.2822, ct_03: 6.4701, ct_04: 6.6696,
  cm_01: 5.278, cm_02: 5.2984, cm_03: 5.2984, cm_04: 6.4178, cf2_01: 0.9865, cf2_02: 0.95,
  cf2_06: 1.0406, cf2_07: 0.9622, ci_01: 0.9805, ci_12: 1.418, ci_14: 0.752, ci_15: 1.152,
  ci_23: 0.4, ci_25: 1.0174, ci_27: 1.5507, ci_28: 0.845, ci_30: 0.7599, ci_31: 1.4017,
  ci_32: 0.9854,
  // 🎃 핼러윈 유료팩 — 51컷
  hp_01: 1.533, hp_02: 1.7308, hp_03: 0.8191, hp_04: 0.6578, hp_06: 0.8477, hp_07: 0.8506,
  hp_08: 1.1825, hp_09: 1.1398, hp_10: 0.8913, hp_11: 1.4722, hp_12: 0.8163, hp_13: 1.0579,
  hp_14: 1.1709, hp_15: 0.9623, hp_16: 1.2283, hp_17: 0.7944, hp_18: 1.6163, hp_19: 1.1205,
  hp_20: 0.4904, hp_21: 1.0526, hs_01: 1.0695, hs_02: 0.8728, hs_03: 0.8337, hs_04: 0.9089,
  hs_05: 0.7561, hs_06: 0.9162, hs_07: 0.9357, hs_08: 0.9091, hs_09: 1.054, hs_10: 0.8091,
  hs_11: 1.2378, hs_12: 1.652, hf_01: 0.7844, hf_02: 0.7391, hf_03: 0.726, hf_04: 0.8404,
  hf_05: 0.7402, hf_06: 0.7265, hf_07: 0.7189, hf_08: 0.7273, ht_01: 4.5217, ht_02: 4.6357,
  ht_03: 4.8941, ht_04: 5.0894, ht_05: 6.4592, ht_06: 6.7793, ht_07: 6.8767, ht_08: 7.1038,
  ht_09: 4.6234, ht_10: 5.1395, ht_11: 5.7801,
  // 🍂 가을 유료팩(다꾸＋수채) — 66컷
  pi_01: 1.0187, pi_02: 1.0632, pi_03: 1.0681, pi_04: 1.0772, pi_05: 0.8716, pi_06: 1.2197,
  pi_07: 0.8799, pi_09: 1.1278, pi_10: 0.7133, pi_11: 1.2177, pi_12: 0.8889, ws_01: 0.9796,
  ws_02: 0.685, ws_03: 1.1283, ws_04: 1.0212, ws_05: 0.8093, ws_06: 0.8991, ws_07: 0.9676,
  ws_08: 0.7198, pp_03: 1.5819, pp_04: 0.7227, pp_05: 0.6724, pp_06: 2.4195, pp_08: 1.2095,
  pp_11: 1.6, pp_12: 1.5409, pp_14: 2.9295, pp_15: 2.4381, pp_16: 1.184, pp_18: 1.0127,
  pp_19: 0.8, pp_20: 1.0352, wh_01: 1.0694, wh_02: 0.927, wh_03: 0.8952, wh_04: 1.2482,
  wh_05: 1.249, wh_06: 1.2588, wh_07: 0.7752, wh_08: 1.313, wh_09: 1.0925, wh_10: 0.9474,
  pt_01: 8.1196, pt_02: 8.7368, pt_03: 9.2222, pt_04: 7.5455, pt_05: 7.7407, pt_06: 8.1333,
  pt_07: 7.315, pt_08: 2.9404, wm_01: 3.3976, wm_02: 3.4506, wm_03: 3.3274, wm_04: 3.369,
  wm_05: 3.3095, wm_06: 3.2733, wm_07: 0.9932, wm_10: 1.0, pf_02: 1.0718, pf_04: 1.0674,
  pf_08: 1.1368, wf_02: 0.7099, wf_03: 0.6972, wf_06: 0.6828, wf_07: 0.7157, wf_08: 0.6925,
  fe_495: 1.2137,
  fe_496: 1.1648,
  fe_497: 1.0868,
  fe_498: 1.1648,
  fe_499: 1.2017,
  fe_500: 1.1759,
  fe_501: 1.125,
  fe_502: 1.1417,
  fe_503: 1.0979,
  fe_504: 1.1695,
  fe_505: 1.1694,
  fe_506: 1.2492,
  fe_507: 1.2446,
  fe_508: 0.5392,
  fe_509: 1.2287,
  fe_510: 1.1551,
  fe_511: 1.1421,
  fe_512: 1.2545,
  fe_513: 1.1131,
  fe_514: 1.1025,
  fe_515: 1.2017,
  fe_516: 1.1486,
  fe_517: 1.1648,
  fe_518: 1.1896,
  fe_519: 1.1935,
  fe_520: 1.2219,
  fe_521: 1.0839,
  fe_522: 1.7746,
  fe_523: 1.1257,
  fe_524: 1.1206,
  fe_525: 1.0948,
  fe_526: 1.1944,
  fe_527: 1.2034,
  fe_528: 1.0886,
}
export const PHOTO_FAMILY = {}
for (const key of Object.keys(PHOTO_RATIO)) {
  PHOTO_FAMILY[key] = { src: PHOTO_URLS[`../assets/stickers/photo/${key}.png`], ratio: PHOTO_RATIO[key] }
}
export const PHOTO_IDS = new Set(Object.keys(PHOTO_FAMILY))

// ── ✨ 캐릭터 움직임(모션) · 효과(양념) — 스티커마다 골라 얹는다 ──
// 전부 그림 1장으로 되는 CSS 모션. item.motion / item.fx 에 key 저장.
//
// ⭐⭐ **팩 하나당 딱 하나 — 모션이거나 효과이거나** (창업자 확정 2026-07-30)
//    처음엔 "팩당 모션 1 + 효과 1"로 잡았는데 창업자가 바로 잡아 줬다:
//    *"유료팩당 효과나 모션 1개. 각각 1개 총 2개가 아니라 그냥 1개씩.
//      왜냐면 **매달 나오는건데** 모션이나 효과가 부족해. 가을유료팩에 모션 1 / 핼러윈에 효과 1 이런식으로"*
//    → 팩은 **매달** 나온다. 1+1로 주면 재고가 **두 배로 빨리** 바닥난다.
//      지금 만들어 둔 모션 7 + 효과 6 = 13개 → 팩당 1개면 **딱 1년치**가 나온다(1+1이면 6개월).
//    → 그리고 **모션인 달 / 효과인 달을 번갈아** 둔다. 매달 결이 달라 보여서 덜 질린다.
//
//    팩을 사는 이유가 **그림 몇 장**이면 하나 사고 만다. 그림은 다음 팩과 비슷해 보여도
//    **움직임은 눈에 확 띄고 한 번 쓰면 계속 쓴다.** 그래서 팩마다 그 팩에만 있는 걸 하나 넣는다.
//
//    ⛔ 한 팩에 두 개 넣지 말 것(그 팩만 팔린다) · ⛔ 이미 무료로 준 걸 팩에 다시 넣지 말 것
//    📋 어느 달에 뭐가 나가는지 = `docs/모션-효과-설계.md` 배분표(12개월).
//       **거기와 여기가 항상 같아야 한다** — `scripts/test-motion.mjs` 가 팩당 1개를 강제한다.
//
// 필드
//   base: true  = 무료(지금 피커에 보임)
//   pack: '키'  = 그 팩을 가진 사람만 보임. 결제 붙기 전까진 CSS·코드만 있고 피커엔 안 뜬다.
//   sheet       = 창업자 시안(2026-07-30) 어느 항목에서 왔는지 — 시안과 코드를 대조할 때 쓴다.
// ⚠️⚠️ **모션은 '축'으로 관리한다 — 속도로 늘리면 다 비슷해 보인다.**
//    창업자 2026-07-30: *"냠냠도 둥실도 콩콩도 통통이랑 비슷. 살랑 갸웃 비슷."*
//    세어 보니 맞았다 — 9개 중 **5개가 '위아래'**(통통·콩콩·냠냠·둥실·쿵착지), **2개가 '기울기'**(갸웃·살랑).
//    **축이 3가지뿐인데 시간만 달라서** 늘려도 늘어난 것처럼 안 보였다.
//    → 팩에 넣는 모션은 **축이 서로 겹치지 않게** 고른다. `axis` 가 그 축이다.
//    → 겹치는 것들은 지우지 않고 **예비(pack 없음)** 로 둔다 — 저장된 표지가 계속 쓰고 있다.
export const MOTIONS = [
  { key: 'none', label: '가만히', axis: '없음', base: true },
  { key: 'tongtong', label: '통통', axis: '위아래', base: true },
  { key: 'tilt', label: '갸웃', axis: '기울기', base: true },
  // 🏖 출시기념 여름팩 = **무료 선물**이라 base:true. "새 모션 1개 넣자"(창업자)의 그 한 개. ✅확정
  { key: 'wave', label: '찰랑', axis: '물 위 부유', base: true, pack: 'summer2026', sheet: 'B-03③ 잔물결' },
  // ✅✅ **배분 = 창업자가 2026-08-05 에 직접 고른 것** (그 전까지는 «내 초안»이었다)
  //   *"추석은 아장아장, 할로윈은 빙글, 가을은 슝, 크리스마스는 부르르, 겨울은 물방울(눈으로 바꿔서)"*
  //   ⛔⛔ 그 전엔 `docs/모션-효과-설계.md` 에 **「⏳창업자 최종 확정 대기」** 라고 적혀 있는데도
  //      내가 초안을 코드에 넣어뒀고, 나중에 그 코드를 보고 *"이미 정해져 있었다"* 며 확정으로 굳혔다.
  //      창업자: *"추석에 아장아장은 처음들어. 할로윈 빙글도.."* → **처음 듣는 게 맞았다.**
  //   📌 «대기»인 것을 코드에 먼저 넣지 않는다. 넣어야 하면 `pack` 없이 예비로.
  { key: 'ajang', label: '아장아장', axis: '좌우 이동', pack: 'chuseok2026', sheet: '(새로 만듦)' },   // 26-09 추석 ✅확정
  { key: 'bingle', label: '빙글', axis: '한 바퀴 회전', pack: 'halloween2026', sheet: 'D-02⑧ 나뭇잎 회전' }, // 26-10 핼러윈 ✅확정
  { key: 'bureu', label: '부르르', axis: '미세 진동', pack: 'xmas2026', sheet: 'B Flow ⑥ Wiggle' },    // 26-12 크리스마스 ✅확정
  // 🅿️ 두리번 — 팩에서 내렸다. 잠겨 있던 `watercolor2026`(가을 수채화)이 **가을 팩에 통합돼 영영 안 나온다.**
  //    ⛔ 그대로 뒀으면 「돈 내도 안 열리는 모션」이 된다(`check-packmeta.mjs` 가 잡았다).
  //    가을 팩엔 이미 효과 「슝」이 있어 여기 넣으면 «팩당 하나» 규칙을 깬다 → **예비로 아껴 둔다.**
  { key: 'durib', label: '두리번', axis: '좌우 반전', sheet: '(새로 만듦)' },
  { key: 'kongdak', label: '콩닥', axis: '크기만(심장)', pack: 'spring2027', sheet: 'D-06③ 좋아요 팝' }, // 27-03 봄
  { key: 'flutter', label: '펄럭', axis: '종이 3D', pack: 'simple2027', sheet: 'B-05③ 메모지 펄럭' },   // 27-04 심플 다꾸
  // 🅿️ 예비 — **축이 위(통통·기울기)와 겹쳐서** 팩에 안 넣는다. 코드·CSS는 그대로 두고
  //    저장된 표지도 계속 정상 동작한다. 나중에 축을 바꿔 살리거나 다른 데 쓸 수 있다.
  { key: 'kong', label: '콩콩', axis: '위아래', sheet: 'B-10 인터랙션' },
  { key: 'nyam', label: '냠냠', axis: '위아래', sheet: 'B-08③ 냠냠 먹기' },
  { key: 'float', label: '둥실', axis: '위아래', sheet: 'B-02① 구름 둥실' },
  { key: 'drop', label: '쿵착지', axis: '위아래', sheet: 'B-06③ 착 붙기' },
  { key: 'sway', label: '살랑', axis: '기울기', sheet: 'B-05② 식물 흔들림' },
]
export const motionClass = (m) => (m && m !== 'none' ? `hk-m-${m}` : '')
// 🙅 **상하체 분리 모션은 만들었다가 뺐다** (2026-07-30)
//   같은 그림을 두 겹으로 깔고 clip-path 로 허리에서 잘라 상체만 움직이는 방식이었다.
//   자산이 안 늘고 훨씬 액티브해서 좋아 보였는데 창업자가 바로 잡았다:
//   *"들썩 끄덕 너무 잘라서 붙인거 티나"*
//   ⛔ **원인은 이음새 틈이 아니라 「무늬」였다.** 아래 조각을 겹쳐 그려 틈은 메웠지만,
//      꼬르곰은 **앞치마 로고가 딱 허리에 걸쳐 있다.** 위쪽만 기울면 그 무늬가 어긋난다.
//      그림은 휘지 않고 통째로 도니까 **무늬 어긋남은 겹쳐 덮어도 못 가린다.**
//   📌 교훈: 이 방식은 **자르는 선에 무늬가 없는 캐릭터**에만 쓸 수 있다. 우리 캐릭터엔 안 맞는다.
// ⚠️⚠️ **효과는 '방향'으로 관리한다 — 그림만 바꾸면 다 비슷해 보인다.**
//    창업자 2026-07-30: *"효과들은 다 거기서 거기 ㅠㅠ"* — 맞았다.
//    9개 중 **위로 뜨는 게 4개**(하트·뽀글·김모락·맛있는것들), **아래로 떨어지는 게 4개**(눈·꽃잎·낙엽·물방울).
//    **방향이 3가지뿐**이라 그림(하트냐 꽃잎이냐)만 다르고 인상이 같았다.
//    → 팩에 넣는 효과는 **방향이 겹치지 않게** 고른다. `dir` 이 그 방향이다.
//    📌 계절 낙하(눈·낙엽·꽃잎)는 셋이 서로 닮을 수밖에 없다 — **떨어져야 눈이고 낙엽이다.**
//       그래서 이건 스티커 효과 슬롯을 쓰지 말고 **배경 한 겹**으로 돌리는 게 낫다(→ 문서 4️⃣ 후보 2).
export const FX_KINDS = [
  { key: 'none', label: '없음', dir: '없음', base: true },
  { key: 'spark', label: '반짝이', dir: '제자리 깜빡', base: true },
  { key: 'heart', label: '하트', dir: '위로 뜸', base: true },
  { key: 'bubble', label: '뽀글', dir: '위로 뜸', base: true },
  { key: 'zoom', label: '슝', dir: '가로지름', pack: 'autumn2026', sheet: '(새로 만듦) D-02 바람' },   // 26-10 가을 다꾸 ✅확정
  // 🅿️ 팡! — 크리스마스가 **모션 「부르르」**로 확정돼서(창업자 2026-08-05) 여기서 내렸다.
  //    ⭐ 버리는 게 아니다 — **설날 팩**에 딱이다(같은 「터짐」 축에 복주머니·엽전 조각만 새로 그리면 된다).
  { key: 'pop', label: '팡!', dir: '바깥으로 터짐', sheet: 'D-08② 폭죽' },
  { key: 'halo', label: '후광', dir: '뒤에 깔림', pack: 'cafe2027', sheet: 'D-09③ 소프트 글로우' },    // 27-02 카페
  { key: 'orbit', label: '빙빙', dir: '머리 둘레 궤도', pack: 'picnic2027', sheet: '(새로 만듦)' },     // 27-05 소풍
  { key: 'water', label: '물방울', dir: '아래로 낙하', pack: 'summer2027', sheet: 'B-03① 물방울 맺힘' }, // 27-06 여름
  // 🅿️ 예비 — 방향이 위(뜸/낙하)와 겹쳐서 팩에 안 넣는다. 배경 효과로 돌릴 후보들.
  { key: 'steam', label: '김모락', dir: '위로 뜸', sheet: 'B-08④ 김이 모락모락' },
  { key: 'food', label: '맛있는것들', dir: '위로 뜸', sheet: 'B-08③ 냠냠 먹기' },
  // ❄️ 눈 — 겨울 팩 확정(창업자 2026-08-05 *"겨울은 물방울(눈으로 바꿔서)"*).
  //   ⭐⭐ 이게 우리 «재고 해법»의 첫 사례다 — **같은 축(낙하)에 그림만 바꾸면 새 효과가 된다.**
  //      물방울 코드를 그대로 두고 조각만 눈으로. 새로 만들 게 없다. (`docs/모션-효과-설계.md` 답②)
  //   ⚠️ 물방울(여름 27년 6월)과 축이 같지만 **계절이 반대**라 한 철에 같이 안 나온다.
  { key: 'snow', label: '눈', dir: '아래로 낙하', pack: 'winter2027', sheet: 'B-04③ 눈 내리는 효과' },
  { key: 'leaf', label: '낙엽', dir: '아래로 낙하', sheet: 'B-04② 낙엽 떨어짐' },
  { key: 'petal', label: '꽃잎', dir: '아래로 낙하', sheet: 'B-04① 꽃잎 흩날림' },
]
// 🔓 지금 열려 있는 팩 = 없다(결제 미구현 · #54). 팩을 팔기 시작하면 **여기 한 줄만** 채우면
//    피커에 바로 뜬다. 소유 판정을 여기저기 흩뿌리지 않으려고 한 곳에 모아 둔다.
export const ownedPacks = () => new Set()
export const pickableMotions = (owned = ownedPacks()) => MOTIONS.filter((m) => m.base || owned.has(m.pack))
export const pickableFx = (owned = ownedPacks()) => FX_KINDS.filter((f) => f.base || owned.has(f.pack))
// 🔒 서랍에 실제로 그릴 그룹 = 무료 그룹 ＋ 유료팩 그룹(자물쇠거나 열린 것)
//   ⛔ `sellable` 이 false 인 팩은 `packDrawerGroups` 가 아예 안 준다 → **지금은 화면이 안 바뀐다.**
//   ⚠️ `STICKER_GROUPS` 를 직접 쓰지 말고 이걸 쓴다 — 직접 쓰면 유료팩이 조용히 빠진다.
export const drawerGroups = (owned = ownedPacks()) => [...STICKER_GROUPS, ...packDrawerGroups(owned)]

// 🕗🕗 「최근 쓴 것」 — 서랍이 400컷을 넘어가면서 **찾는 게 일이 됐다.**
//   ⭐ 우리는 이 문제를 이미 한 번 풀었다 — 음식 아이콘 299개일 때 v8.81 의 「최근 쓴 것 8개 맨 위」.
//      **같은 처방을 서랍에도 쓴다**(근거 = `docs/서랍-감당되나-2026-08-01.md` 추천 ①).
//   ⭐ 유저가 아무것도 «안 해도» 된다 — 즐겨찾기를 손으로 등록시키는 건 정리 시키는 일이고,
//      다꾸는 노는 것이지 파일 정리가 아니다(그래서 접기·숨기기는 뒤로 미뤘다).
//   ⛔ 여기서 «지우지» 않는다 — 목록에서 밀려날 뿐 원래 자리엔 그대로 있다.
const RECENT_KEY = 'hankki:decorRecent'
const RECENT_MAX = 40 // 탭별로 걸러 8개씩 보여주려면 통 목록은 넉넉해야 한다
export function recentStickers() {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function pushRecentSticker(key) {
  if (!key) return
  const arr = [key, ...recentStickers().filter((k) => k !== key)].slice(0, RECENT_MAX)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(arr)) } catch { /* 용량 초과 무시 */ }
}
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
// 🎊 색종이 — '팡!' 용. 반짝이(별)와 달리 **모서리 둥근 네모**라 터질 때 종이 조각처럼 보인다.
//   두 겹(살짝 어긋나게)이라 돌아갈 때 두께가 있는 것처럼 느껴진다.
const SVG_CONFETTI = (
  <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
    <rect x="4" y="7" width="16" height="9" rx="3" fill="#dc9aa1" transform="rotate(-14 12 12)" />
    <rect x="7" y="9" width="11" height="6" rx="2.4" fill="#e8bfa2" transform="rotate(10 12 12)" opacity=".9" />
  </svg>
)
// 맛있는것들 효과 = 우리가 그린 음식(이모지 대신). 캔디 톤이라 캐릭터랑 딱 맞음.
const FX_FOOD_URLS = import.meta.glob('../assets/stickers/fx/*.png', { eager: true, query: '?url', import: 'default' })
const FX_FOOD = ['strawberry', 'burger', 'cupcake', 'cake', 'icecream', 'ramen'].map((n) => FX_FOOD_URLS[`../assets/stickers/fx/${n}.png`])
// ⚠️⚠️ **조각이 얼마나 움직이는지는 `rel()` 로 계산한다. 손으로 % 를 쓰지 말 것.**
//   창업자 2026-07-30: *"효과가 좀 작아 살짝 움직이는 애들을 조금만 더 크게... 잘 안보여"*
//   *"바깥으로 터진다 / 머리둘레를 돈다 / 뒤에깔려서 숨쉰다 먹통"*
//   원인은 **하나**였다 — transform 의 `%` 는 **제 몸 크기 기준**이다.
//   16px 짜리 하트에 `translateY(-85%)` 를 주면 13.6px 뜬다 = **238px 스티커의 5.7%.**
//   그래서 "떠오른다"가 아니라 "제자리에서 깜빡"으로 보였다. 떨어지는 것들도 전부 같았다.
//   → `rel(조각크기, 스티커기준%)` 이 필요한 % 를 계산해 CSS 변수로 넣는다.
//     **조각 크기를 바꿔도 이동 거리가 안 변한다.** (전엔 크기를 키우면 거리도 같이 커져 버렸다)
const STICKER_PX = 238            // 캔버스에 붙는 스티커 기본 폭(= defaultScale 0.22 기준)
const rel = (size, pct) => `${Math.round(pct / (size / STICKER_PX))}%`

// [x%, y%, delay, 조각별 CSS변수] — spark/heart 는 머리 위쪽에. food 는 머리 위로 크게 떠다님.
// 📏 조각 크기는 창업자 요청으로 **약 1.5배** 키웠다 (작아서 티가 안 났다).
const RISE = (size, pct) => ({ '--rise': rel(size, -pct) })          // 위로 뜨는 거리
const FALL = (size, down, side) => ({ '--fy': rel(size, down), '--sx': rel(size, side) })
const FX_DEF = {
  spark: { size: 23, items: [[15, -2, 0], [50, -12, .5], [85, 0, .9], [28, 16, 1.3], [72, 14, .7]], node: SVG_SPARK },
  heart: { size: 23, items: [[25, 0, 0, RISE(23, 70)], [63, -12, .8, RISE(23, 70)], [45, 12, 1.5, RISE(23, 70)]], node: SVG_HEART },
  bubble: { size: 22, items: [[15, 2, 0], [48, -12, .9], [80, -1, .5], [32, 15, 1.7], [66, 12, 1.2]].map((it) => [...it.slice(0, 3), RISE(22, 78)]), node: SVG_BUBBLE },
  food: { size: 32, items: [[12, -10, 0], [84, -16, .9], [30, -26, 1.6], [66, -24, 2.3]].map((it) => [...it, RISE(32, 55)]), food: true },
  steam: { size: 17, items: [[42, 6, 0], [52, 2, .9], [47, 10, 1.7]].map((it) => [...it, RISE(17, 85)]), puff: true },
  // ⬇️ 아래 넷은 **떨어지는** 효과 — 스티커 위쪽에서 출발해 아래로 지나간다.
  //    그래서 y 를 음수(머리 위)로 두고, 낙하 거리는 `FALL()` 이 스티커 기준으로 계산한다.
  //    ⚠️ 화면 전체에 뿌리지 않는다 — 스티커 한 장 크기 안에서만. 표지 전체에 눈을 뿌리면
  //       스티커가 아니라 '앱 효과'가 되고, 여러 장 붙였을 때 서로 겹쳐 지저분해진다.
  //       (표지 전체 연출은 **배경 레이어**로 따로 한다 → `docs/모션-효과-설계.md` 배경 항목)
  water: { size: 19, items: [[22, -16, 0], [58, -26, .8], [80, -12, 1.6], [40, -8, 2.2]].map((it) => [...it, FALL(19, 120, 4)]), node: SVG_WATER },
  leaf: { size: 26, items: [[18, -22, 0], [55, -32, 1.1], [82, -18, 2.1]].map((it) => [...it, FALL(26, 118, 16)]), node: SVG_LEAF },
  snow: { size: 18, items: [[14, -20, 0], [42, -30, .7], [68, -16, 1.4], [88, -28, 2.1]].map((it) => [...it, FALL(18, 120, 10)]), node: SVG_SNOW },
  petal: { size: 22, items: [[20, -20, 0], [52, -30, .9], [78, -14, 1.8]].map((it) => [...it, FALL(22, 118, 18)]), node: SVG_PETAL },
  // ── 🆕 뜨지도 떨어지지도 않는 것들 (창업자 "효과들은 다 거기서 거기") ──
  // 💥 팡 — 전부 같은 자리(가운데)에서 시작해 **제각각 다른 방향**으로 날아간다.
  // ⚠️ 값이 세 자리인 이유 = `rel()` 이 「스티커 기준 %」를 「조각 제 몸 기준 %」로 바꿔 주기 때문.
  //    조각이 스티커의 9%밖에 안 되니, 스티커 폭의 58%를 가려면 조각 기준으론 658% 다.
  pop: { size: 21, node: SVG_CONFETTI, items: [
    [-58, -48, -140], [55, -53, 160], [-71, 9, -80], [69, 5, 110], [-16, -76, 60], [23, -72, -120],
  ].map(([x, y, spin], i) => [50, 34, i * 0.03,
    { '--dx': rel(21, x), '--dy': rel(21, y), '--spin': `${spin}deg` }]) },
  // 🪐 빙빙 — 셋 다 가운데에 두고 **딜레이를 음수로** 줘서 처음부터 궤도 위 다른 자리에 있게 한다.
  orbit: { size: 19, node: SVG_SPARK, items: [0, -1.47, -2.93].map((d) => [50, 34, d, { '--r': rel(19, 55) }]) },
  // 💨 슝 — 왼쪽 밖에서 들어와 오른쪽 밖으로 나간다(스티커 폭의 1.4배를 건넌다).
  zoom: { size: 22, node: SVG_SPARK, items: [[0, 12, 0], [0, 40, .9], [0, -12, 1.7]].map((it) => [...it, { '--go': rel(22, 140) }]) },
  // 🌕 후광 — 조각이 아니라 **뒤에 깔리는 큰 원 하나.**
  //    ⚠️ 처음에 132px(스티커의 55%)로 만들었다가 **그림 뒤에 완전히 가려져 안 보였다.**
  //       후광은 반드시 **그림보다 커야** 한다. 340px ≒ 스티커의 1.43배.
  halo: { size: 340, items: [[50, 46, 0]] },
}
// ⬆️ `lift` = **글자에 붙일 때** 효과가 나오는 자리를 «글자 위»로 올린다 (창업자 2026-08-07
//    *"하트효과가 글자 윗부분부터 시작해야하지 않아?"*)
//    ⛔ 조각의 y 는 «퍼센트»다(`top: ${y}%`). 캐릭터 상자는 세로로 길어서 y=12% 가 «위쪽»이지만,
//       **글자 상자는 납작해서**(글자 높이) 같은 12% 가 «글자 한가운데»가 된다 → 하트가 글자 속에서 나온다.
//    ⭐ 그래서 글자일 때만 효과 판을 «글자 윗변 언저리»에 놓는다 — 조각 좌표는 그대로 두고 판만 옮긴다.
// 📏📏 `px` = **이 효과가 얹히는 상자의 진짜 크기(px).** 안 주면 238 = 지금까지와 픽셀 하나 안 달라진다.
//    ⛔⛔ 왜 필요한가 — `rel()` 이 위에서 **「스티커 = 238px」을 못 박고 있다**(꾸미기 캔버스 기준이라 거기선 맞다).
//       그런데 그보다 «작은» 자리에 그대로 쓰면 **이동 거리가 그 비율만큼 통째로 튄다.**
//       실측(2026-08-08): 완성 칸의 46px 꼬르곰에 얹었더니 조각이 **128px** 날아가
//       칸을 벗어나 **레시피 단계 글자를 덮었다**(창업자 폰 캡처 · `_repro-완성칸조각-0808.mjs`).
//    ⭐ 창업자는 *"위로 올라가는 거라 어쩔 수 없긴한데.."* 라고 했지만 **어쩔 수 없는 게 아니었다.**
//       238 을 46 으로 바꾸면 거리가 1/5.2 로 줄어 칸 안에서 논다.
//    ⭐⭐ v9.94 의 *"퍼센트 좌표는 상자 «모양»을 탄다"*(→ `lift` 신설) 와 **같은 계열**이다.
//       그땐 «모양»이었고 이번엔 «크기»다. 📌 **효과를 새 자리에 쓸 땐 「그 자리가 238px 인가」를 먼저 본다.**
const fitVars = (vars, k) => {
  if (!vars || k === 1) return vars
  const out = {}
  for (const key in vars) {
    const n = parseFloat(vars[key])
    out[key] = Number.isFinite(n) ? `${Math.round(n * k)}%` : vars[key]
  }
  return out
}
// 📐 `size` = 조각 «한 장»의 크기(px). 안 주면 FX_DEF 의 기본값.
//   ⛔ 기본 크기는 **238px 스티커에 얹는 것을 전제**로 정해졌다(32px = 스티커의 13%).
//      46px 짜리 곰에 그대로 얹으면 조각이 곰의 **70%** 라 덩어리처럼 보이고 칸 아래에서 잘린다.
//   ⚠️ `px` 로 자동 계산하지 «않는다» — 비례로 줄이면 6px 이 돼 아예 안 보인다.
//      **거리는 비례로, 크기는 눈으로.** 둘은 다른 문제다.
export function StickerFx({ kind, lift, px, size }) {
  const def = FX_DEF[kind]
  if (!def) return null
  const k = px ? px / STICKER_PX : 1
  const sz = size || def.size
  const box = lift
    ? { position: 'absolute', left: 0, right: 0, bottom: '60%', height: '140%' }
    : { position: 'absolute', inset: 0 }
  return (
    <span aria-hidden="true" style={{ ...box, pointerEvents: 'none', overflow: 'visible' }}>
      {/* 4번째 값(vars) = 조각마다 다른 CSS 변수. 터지는 방향(--dx/--dy)·궤도 반지름(--r)·
          가로 이동 거리(--go) 처럼 **조각마다 달라야 하는 것**을 여기서 준다.
          (하나로 고정하면 '터졌다'가 아니라 '커졌다'로 보인다)
          ⚠️ 이 값들이 전부 `rel()` 로 계산된 「이동 거리」라 px 배율은 **여기에** 곱한다. */}
      {def.items.map(([x, y, d, vars], i) => (
        <span key={i} className={`hk-fx hk-fx-${kind}`}
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: sz, height: sz, lineHeight: 1, animationDelay: `${d}s`, ...(fitVars(vars, k) || {}) }}>
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
  // 🎬🎬 **모션이 여기만 빠져 있었다** (창업자 2026-08-12 *"색을 넣고 모션하니까 안되던데"*)
  //   ⛔ 위 PNG 분기(`PHOTO_FAMILY`)·부엌 식구들은 `motionClass` 를 붙이는데
  //      **벡터 스티커(하트·별·반짝이·리본·브이손)는 그게 없어 모션을 골라도 안 움직였다.**
  //   📌 하필 이 다섯이 **리컬러 되는 벡터 전부**라, 창업자에겐 「색을 넣은 것만 모션이 안 된다」로 보였다.
  //      원인은 색이 아니라 «벡터라서»다 — 색은 처음부터 상관이 없었다.
  //   ⚠️ 프레임(`FRAMES`)엔 일부러 안 준다 — 밑판이라 흔들리면 그 위 스티커와 따로 논다.
  return <span className={motionClass(motion)} style={{ display: 'block', width: '100%', height: '100%', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
}

// 스티커별 가로:세로 비율(레이아웃용). 말풍선은 넓고, 부엌 식구들은 세로가 길다.
export const stickerRatio = (id) => (id === 'yum' ? 74 / 46 : FRAMES[id] ? FRAMES[id].ratio : KITCHEN_FAMILY[id] ? KITCHEN_FAMILY[id].ratio : PHOTO_FAMILY[id] ? PHOTO_FAMILY[id].ratio : 1)

const kfItems = (prefix) => KF_NAMES.map(([n]) => prefix + n)
// ── 스티커 피커 그룹 (2026-07-22 재편) — 다꾸 리서치 기반 6탭 IA + 음식 서브칩 ──
// tab: 'buddies'(친구들)·'food'(음식,서브칩)·'deco'(데코)·'life'(라이프). notetext/bgtape는 에디터에서 별도.
// chip: 음식 탭의 요리별 서브칩 라벨. 옛 약한 SVG(표정·재료·도구·소스·디저트)는 피커에서 제외(코드는 남아 저장표지 호환).
export const STICKER_GROUPS = [
  // 🐻🐧 꼬르곰·펭펭 (물결 정본·2026-07-23) — 친구들 탭 맨 위 = 우리 애기들이 메인. 곰4·펭5·콤비4.
  // 🐻🐧 `bigCell` = 서랍 칸을 **글자 픽커와 같은 110px** 로 (창업자 2026-08-28
  //    *"레꾸에서 친구들에 꼬르곰 펭펭을 글자에 있는 꼬르곰 펭펭만큼 크기를 키웠으면 좋겠어. 잘 안보여."*
  //     → *"글자픽커에있는 꼬르곰 펭펭크기만큼 키우면 될 것 같아"*)
  //    ⛔ `wordy` 를 돌려 쓰지 않는다 — 그건 «캡션이 그려진 그룹»이라는 뜻이다(DecorEditor 주석 참조).
  //    ⛔ 부엌 식구들·카롱은 «안» 건드렸다 — 창업자가 콕 집은 것은 꼬르곰·펭펭이다.
  //       (창업자 말의 «범위»를 넓히지 않는다 — v11.17 교훈)
  {
    key: 'gompeng', tab: 'buddies', bigCell: true, label: '꼬르곰·펭펭', items: [
      'gp_gomft', 'gp_gomtb', 'gp_gomv', 'gp_gomhi',
      'gp_pengft', 'gp_pengtb', 'gp_pengv', 'gp_penghi', 'gp_pengym',
      'gp_duohi', 'gp_duoht', 'gp_duoh5', 'gp_duotb',
    ],
  },
  { key: 'kitchen', tab: 'buddies', bigCell: true, label: '부엌 식구들', items: kfItems('kf_') },
  // ⚠️ 캔디(kf_c_)·라인(kf_l_)은 **부엌 식구들과 같은 8캐릭터를 색·선만 바꾼 것**이라
  //    셋을 다 두면 친구들 탭 41종 중 24종이 같은 애들이었다(창업자 2026-07-29 "넣을 거
  //    넣고 뺄 거 빼자"). 오리지널만 남긴다. 자산·PHOTO 매핑은 그대로라 **저장된 표지는
  //    계속 정상 렌더**되고, 나중에 업데이트 소재로 되살릴 수 있다(피커 등록만 하면 됨).
  //    📅 **라인(kf_l_) = '심플 다꾸' 세트로 나중에 함께 출시**(창업자 2026-07-29 확정).
  //       선만 있는 그림체라 무선 파스텔 자산(`파스텔무선-창업자-2507`)과 묶으면 한 세트가 된다.
  // 🍱 음식 (요리별 서브칩)
  // 🥕 재료 — 여름 제철 귀여운 식재료(꾸미기용) 몇 개 추가(복숭아·수박·체리·옥수수·가지). 분기별 제철로 교체 예정(사계절용은 픽스).
  // ⏸ **흰 테가 두껍게 뭉친 4컷은 피커에서 뺐다** (창업자 2026-07-31 *"4개는 빼자 그냥 없어도 되자나"*)
  //   `ig_hsm01`(새우) · `ig_jae03`(계란후라이) · `tk_bag`(장바구니 봉투) · `tk_basket`(장바구니)
  //   왜 = 이 넷은 **그림 자체에 흰 부분이 많아**(장바구니 천·계란 흰자·새우 배)
  //        「어디까지가 그림이냐」 판정이 헐거워지고, 거기에 흰 테를 두르니 **두 겹**이 됐다.
  //        여름 프레임과 같은 뿌리 — 흰 그림에 흰 테를 두르면 경계가 사라진다.
  //   ⛔ **PNG 와 `PHOTO_RATIO` 는 지우지 않는다** — 이미 이걸로 꾸며 저장한 레꾸가 깨진다.
  //      나중에 시트를 다시 뽑거나 흰 테 없이 자르면 이 줄들에 도로 넣으면 된다.
  { key: 'f_ing', tab: 'food', label: '재료', items: ['ig_jcb19', 'ig_jae06', 'ig_jae08', 'ig_jae10', 'ig_jae19', 'ig_jae20', 'ig_jae07', 'ig_jae09', 'ig_jae12'] },
  // ✨ 데코 (색 바꾸는 SVG 심볼 유지 + 새 데코 PNG + 응원)
  // 🏖 꼬르곰·펭펭의 여름 (2026-07-29) — 콤비 4(물총·튜브·수박·아이스크림) + 곰 솔로 4 + 펭 솔로 4.
  //   ⚠️ 처음엔 에피소드 씬컷을 넣었는데 **배경(하늘·바다·모래)이 통째로 붙어 있어** 표지에
  //      작게 붙이면 네모 배경째 올라갔다. 창업자가 **흰 배경으로 다시 뽑아** 줘서 전부 교체했다.
  { key: 'buddies_summer', tab: 'buddies', bigCell: true, season: 'summer', label: '꼬르곰·펭펭의 여름', items: ['sm_duo_watergun', 'sm_duo_tube', 'sm_duo_watermelon', 'sm_duo_icecream', 'sm_gom_tube', 'sm_gom_beach', 'sm_gom_bbq', 'sm_gom_chair', 'sm_peng_tube', 'sm_peng_beach', 'sm_peng_shop', 'sm_peng_night'] },
  // 🎉 출시기념 축하 3컷 — 출시기념 팩(#65)의 나머지 반쪽. 프레임 12 + 이 3 = 15컷.
  //    ⛔ 같은 시트의 맥주 건배 컷은 **안 넣는다**(전체 이용가) → 주스 건배로 대체돼 있다.
  //    계절을 안 붙였다 = 사철. 「출시 기념」은 여름이 지나도 남는 이야기다.
  { key: 'buddies_celebrate', tab: 'buddies', bigCell: true, gift: true, label: '출시 축하', items: ['ce_manse', 'ce_pokjuk', 'ce_cheers'] },
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
  // 🗣🗣 **`fn_*` 다섯은 프레임이 «아니었다»** (창업자 2026-08-09 *"말풍선 격자(레꾸)에 왜 프레임에 들어가있어?"*)
  //   ⭐ 코드로 확인 = `frameOf()` 는 `FRAMES[key]` 이거나 `pf_` 로 시작할 때만 프레임으로 본다.
  //      `fn_` 은 둘 다 아니라 **사진을 못 끼운다** — `FRAME_WINDOW`(실측 창 표)에도 한 줄도 없다.
  //      프레임 탭에 있으면서 프레임이 하는 일을 하나도 안 했다. 창업자 질문이 정확했다.
  //   ✅ 창업자 확정 = *"2번은 글자써지는 판으로"* → 가운데가 «빈» 셋은 **글 상자**(`BOX_GROUPS`)로 옮겼다.
  //   ⛔ **둘은 못 옮겼다** — `fn_daisy`(가운데 데이지 꽃) · `fn_night`(달·구름) 는 **가운데에 그림이 그려져 있다.**
  //      글을 얹으면 주황 꽃술·달 위에 글자가 앉는다(시안으로 눈으로 확인). 그래서 **데코 탭의 그림**으로 남긴다.
  //   📌 「프레임이 아니다」와 「글 상자가 된다」는 다른 말이다 — 다섯이 한 덩어리가 아니었다.
  { key: 'deco_frame2', tab: 'deco', label: '말풍선 판', items: ['fn_daisy', 'fn_night'] },
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
  // 🆕 2026-07-31 창업자 시트 데코 — 굵은 진갈색 외곽선 + 파스텔 채움(우리 마감과 한 세트).
  //   ⛔ 크리스마스 스노글로브 2컷은 겨울에 낸다. 선이 끊겨 속이 안 채워진 구름 말풍선은 버렸다.
  { key: 'deco_new_prop', tab: 'deco', label: '소품 · 새로 나온', items: ['dp_12', 'dp_16', 'dp_11', 'dp_02', 'dp_24', 'dp_26', 'dp_27', 'dp_28', 'dp_07', 'dp_25'] },
  // 🍳 요리 도구·재료 — 그동안 라이프 탭이 운동용품뿐이었고 재료·도구 컷은 흰 테가 뭉쳐 빼둔 상태였다.
  { key: 'f_sauce', tab: 'food', label: '양념', items: ['kt_28', 'kt_29', 'kt_30', 'kt_31', 'kt_11'] },
  // ⛔ 마늘(kt_32)·양파(kt_33)는 「재료」에 이미 있어서 안 넣는다(ig_jae08·ig_jae06).
  { key: 'deco_kitchen', tab: 'food', label: '요리 도구 · 새로 나온', items: ['kt_01', 'kt_02', 'kt_03', 'kt_04', 'kt_05', 'kt_06', 'kt_07', 'kt_08', 'kt_09', 'kt_10', 'kt_12', 'kt_13', 'kt_14', 'kt_15', 'kt_16', 'kt_17', 'kt_18', 'kt_19', 'kt_20', 'kt_21', 'kt_22', 'kt_23', 'kt_24', 'kt_25', 'kt_26', 'kt_27'] },
  { key: 'deco_cheer', tab: 'deco', label: '응원·말풍선', items: ['ch_che06', 'ch_che08', 'ch_che01', 'ch_che04', 'ch_che05', 'yum'] },

  // ── 🍚 「오늘의 한끼」 낱개 24 (2026-08-06 · 창업자 시트 한 장 → 24컷 전부 씀) ────────────
  //
  // ⭐ 창업자 원문 = *"유저들한테 보여줄때는 저대로 보여주고 **다 잘라서 넣어주면** 깔끔할 것 같아"*
  //    같은 날 붙인 속지 「오늘의 한끼」와 **한 세트**다 — 속지에 인쇄된 아이콘(함께·장소·날씨·기분·시간)과
  //    **같은 그림체**라 유저가 옆에 하나 더 붙여도 따로 놀지 않는다.
  //
  // ⚠️ **계절을 안 붙인다.** 해·달·하트·시계는 사철 쓰는 것이다(단풍·수박과 다르다).
  // ⚠️ **날짜(`from`)도 안 붙인다** — 속지가 오늘 나가는데 스티커만 9월에 열면 세트가 갈린다.
  //    (9/1·10/1·11/1 로 나눠 여는 건 아래 「다이어리 꾸미기」 80컷 얘기다. 그건 속지와 무관한 별개 팩)
  //
  // 🏷 이름 = `dc_td*`. **`dy` 는 이미 다이어리 꾸미기 팩이 쓰고 있다**(`pf_dy`·`wt_dy`·`dyf`·`dys`…)
  //    → 겹치면 어느 팩 것인지 못 가른다. `td` = today(오늘의 한끼).
  // 🏷 **이름 앞에 「한끼 일기」를 붙인다** (창업자 2026-08-06
  //    *"데코아래 (한끼일기다이어리용은 따로 이름 붙여주자) 한끼일기- 우표 이런 식으로."*)
  //    ⭐ 서랍에 그룹이 40개가 넘어서 **어느 게 한 세트인지**가 안 보인다 — 앞에 붙이면 줄줄이 모여 읽힌다.
  //    ⚠️ 이름은 «출처»를 말하는 것이지 **제한이 아니다** — 표지 꾸미기에서도 그대로 쓴다
  //       (계절 세트가 「소품 · 여름」인데 겨울에도 쓰는 것과 같다).
  //    ⚠️ 탭 이름과 같은 「한끼 일기」(띄어쓰기 있음)로 쓴다 — 화면 말은 하나여야 한다.
  // 📔 `diary: true` = **일기를 꾸밀 땐 이 세트가 맨 위로 올라온다**(창업자 2026-08-06
  //    *"다이어리꾸밀때는 다이어리용 꾸미기 먼저 보이게 하면 안되나?"*).
  //    ⛔ `only: 'diary'` 가 **아니다** — 표지 꾸미기에서도 그대로 쓴다. 순서만 바뀐다.
  //    ⛔ 라벨(「한끼 일기 ·」)로 가르지 말 것 — **표시용 글자를 분류 기준으로 쓰면 라벨을 다듬는 순간 깨진다**
  //       (v9.07 에 `CAT()` 이 라벨로 분류하다 표가 통째로 틀어진 전례).
  //    📌 창업자가 「일기용 / 레꾸용」 버튼 두 개로 가르는 것도 물었는데(2026-08-06),
  //       지금은 62 그룹 중 일기 전용이 5개뿐이라 왼쪽 칸이 텅 빈다 → **순서만 바꾼다.**
  //       세트가 쌓여 20~30개가 되면 그때 가른다(그 장치가 위 `only` 다).
  { key: 'deco_td_stamp', tab: 'deco', diary: true, label: '한끼 일기 · 우표', items: ['dc_td01', 'dc_td02', 'dc_td03', 'dc_td04', 'dc_td05', 'dc_td06'] },
  { key: 'deco_td_sky', tab: 'deco', diary: true, label: '한끼 일기 · 날씨', items: ['dc_td07', 'dc_td08', 'dc_td09', 'dc_td10'] },
  { key: 'deco_td_heart', tab: 'deco', diary: true, label: '한끼 일기 · 하트', items: ['dc_td11', 'dc_td12', 'dc_td13', 'dc_td14'] },
  { key: 'deco_td_label', tab: 'deco', diary: true, label: '한끼 일기 · 라벨·소품', items: ['dc_td15', 'dc_td16', 'dc_td17', 'dc_td18', 'dc_td19', 'dc_td20', 'dc_td21'] },
  // 🎗 마테 탭 안이라 종류는 안 적는다 — 「한끼 일기」만으로 어느 세트인지 안다
  { key: 'deco_td_tape', tab: 'tape', diary: true, label: '한끼 일기', items: ['wt_td01', 'wt_td02', 'wt_td03'] },
  // 📔📔 **「한끼 일기」 속지 패키지 — 기본템 48컷** (2026-08-06 · 창업자 시트 4장)
  //   창업자 *"내가 준 4장은 딱 다이어리용이야. 감정 스템프랑 프레임꾸미기, 작은 메모까지.
  //   **이렇게 구성하는 걸로 할까봐 앞으로 (속지에 이런 패키지로)**"*
  //   → ⭐**앞으로 속지 세트의 표준 구성 = 12 × 4 = 48컷.**
  //
  // ⛔⛔ **`only: 'diary'` = 레시피 꾸미기 서랍엔 «아예 안 나온다»** (창업자 2026-08-06
  //   *"이건 다이어리에서만 쓰자. 꾸미기말고 **레시피꾸미기용은 아니야**"*).
  //   ⚠️ 「한 번 준 건 안 빼앗는다」와 안 부딪힌다 — **처음부터 안 주는 것**이라 빼앗을 게 없다.
  // 📔 `diary: true` = 일기 꾸미기의 **「일꾸」 칸**에 들어간다(레꾸 칸엔 안 보인다).
  //
  // 🎨 왜 이게 「기본템」인가 = **색이 뮤트 뉴트럴**(베이지·세이지·더스티블루·라벤더)이라
  //   우리 종이 다섯 색 어디에도 안 부딪히고, **계절이 없어** 사철 쓴다.
  //   기존 `dl_`(굵은 검정 외곽선＋쨍한 파스텔)과 결이 달라 **겹치는 컷이 0**이다(대조판 확인).
  { key: 'dg_face', tab: 'deco', diary: true, only: 'diary', label: '한끼 일기 · 표정', items: ['dgf01','dgf02','dgf03','dgf04','dgf05','dgf06','dgf07','dgf08','dgf09','dgf10','dgf11','dgf12'] },
  { key: 'dg_mood', tab: 'deco', diary: true, only: 'diary', label: '한끼 일기 · 감정·상태', items: ['dgm01','dgm02','dgm03','dgm04','dgm05','dgm06','dgm07','dgm08','dgm09','dgm10','dgm11','dgm12'] },
  { key: 'dg_note', tab: 'deco', diary: true, only: 'diary', label: '한끼 일기 · 메모지', items: ['dgn01','dgn02','dgn03','dgn04','dgn05','dgn06','dgn07','dgn08','dgn09','dgn10','dgn11','dgn12'] },
  { key: 'dg_corner', tab: 'deco', diary: true, only: 'diary', label: '한끼 일기 · 코너', items: ['dgc01','dgc02','dgc03','dgc04','dgc05','dgc06'] },
  { key: 'dg_line', tab: 'deco', diary: true, only: 'diary', label: '한끼 일기 · 구분선', items: ['dgl01','dgl02','dgl03','dgl04'] },
  { key: 'dg_day', tab: 'deco', diary: true, only: 'diary', label: '한끼 일기 · 기념일', items: ['dga01','dga02','dga03','dga04','dga05','dga06','dga07','dga08','dga09','dga10','dga11','dga12'] },
  { key: 'dg_tape', tab: 'tape', diary: true, only: 'diary', label: '한끼 일기 · 기본', items: ['wt_dg01','wt_dg02'] },
  // 🎗 마스킹테이프 — 창업자 직접 제작(2026-07-29). 배경·테이프 탭의 CSS 마테와 달리 갈색 외곽선 +
  //   양끝 톱니가 있는 '스티커 워시'라 다꾸 감성이 그대로 산다. **사철 쓰는 것만 12종 엄선**("엄선해서 12개").
  //   여름 무늬(레몬·수박·구름·파도·조개…)는 아래 `마스킹테이프 · 여름` 으로 뺐다.
  // 🎀 **`wtn_03` 을 서랍에서 내렸다** — 창업자 2026-08-03 *"마스킹테이프 젤 아래 핑크 중복임.(하나 삭제)"*
  //    🔎 픽셀로 확인: `wtn_02` ↔ `wtn_03` 은 **분홍 바탕＋흰 물방울로 사실상 같은 그림**이다
  //       (차이 = 02 에만 종이 잔무늬가 있고 03 은 매끈 · 물방울이 조금 더 큼).
  //    ⭐ **02 를 남긴 이유** = 잔무늬가 있어 종이 질감이 산다(우리 톤이 수채·크래프트).
  //    ⛔ 파일과 `PHOTO_RATIO` 는 **안 지운다** — 이미 `wtn_03` 으로 꾸며 저장한 표지가 깨지면 안 된다
  //       (`kf_c_`·`sf_` 때와 같은 방식 · 서랍에서만 안 보인다).
  { key: 'deco_washi', tab: 'tape', label: '마스킹테이프', items: ['wt_ribbon_pink', 'wt_dot_lavender', 'wt_daisy_lavender', 'wt_ribbon_lavender', 'wt_flower_mauve', 'wt_grid_white', 'wt_heart_cream', 'wt_daisy_yellow', 'wt_sparkle', 'wt_cherry', 'wt_ribbon_red', 'wt_grid_black', 'wtn_01', 'wtn_02'] },

  // ── 📔 다이어리 꾸미기 (2026-08-06 · 창업자 9시트 → 80컷) ────────────────────
  //
  // ⭐ 창업자 원문 = *"새다이어리꾸미기야. **3달치**라서 **한달에 종류별로 4개씩** 넣으면 될것같아"*
  //
  // ⚠️ **계절이 없다.** 단풍·수박처럼 철 타는 그림이 아니라 «사철 쓰는 다이어리 기본»이다
  //    → `season` 을 안 붙인다(붙이면 철 지나면 순서가 뒤로 밀린다).
  // ⚠️ **라벨에 「9월분」처럼 달을 쓰지 않는다** — 유저는 달을 알 필요가 없다.
  //    가을 세트(`deco_autumn_a/b`)와 같은 방식으로 **내용으로** 가른다.
  // 📅 9/1·10/1·11/1 = **이미 열려 있는 문**이다(가을 세트와 같은 날) — 새 습관을 안 만든다.
  //    ⛔ 자동 공개 전날 검수는 절대원칙 → `node scripts/release-calendar.mjs --on 2026-09-01`
  //
  // ⚠️⚠️ 마테 두 시트가 **절반 겹쳐서** 왔다(픽셀 대조 ＋ 눈으로 확인).
  //    창업자 판정으로 4컷을 내렸다 — *"2번째줄 빨강 엑스자 파랑접힌거 3번째줄초록체크빼자"*
  //    → 24 → **20컷.** 아직 겹치는 4쌍(노랑무지·파랑도트·흰종이·크라프트종이)은 **다른 달로 갈랐다** —
  //      같은 달에 나란히 놓이면 «같은 게 두 개»로 보이지만 달이 다르면 «새로 나온 것»으로 읽힌다.
  //    ⚠️ `wt_dy10` 은 **없다**(내린 컷 자리). 번호가 비는 게 정상이다.
  //
  // 🖼 프레임은 `pf_` 로 시작해야 한다 — `DecorEditor.isBacking` 이 접두어로 «밑판»을 가른다.
  //    안 그러면 탭할 때 맨 앞으로 튀어나와 안에 꾸민 스티커를 다 덮는다(v8.59·v9.01 사고).
  // 📔 `diary: true` = **일기 꾸미기 서랍의 「일기 아이템」 칸**에 들어간다(아래 「한끼 일기」 세트와 한 선반).
  //    ⛔ 표지 꾸미기에서 «못 쓰게» 막는 게 아니다 — 거긴 전부 다 나온다. **선반만 따로** 있는 것이다.
  // ⛔ [창업자 검수 2026-08-29] 9/1 「폴라로이드·리본」 4컷 = **다 뺐다** (*"다 뺀다,"*).
  //    ⛔ PNG(`pf_dy01`·`pf_dy09`·`pf_dy10`·`pf_dy02`)·`PHOTO_RATIO` 는 «지우지 않는다» — 10/1·11/1 세트와 한 가족이다.
  // 🍂 [창업자 2026-08-29] *"내가 뽑아준 가을프레임은..?"* → 그 자리를 이 넷이 채운다.
  //    ⛔ 시트를 받아만 두고 «자르지 않아» 앱에 없었다(`가을-창업자-2026-08-26/원본시트`).
  //    🕳 자르는 길 = **시트가 이미 투명이라 흰 테가 안 붙었다** → 흰 배경으로 한 번 눌러 굽고(`/tmp/프레임-흰배경`)
  //       `--grid 2x2 --diecut auto --punch 0.02` 로 창을 뚫었다. 절대원칙 셋(흰 테·조각·해상도) 다 통과.
  //    ✂️ 창업자 판정 = *"1.3.4번 3개하자"* → `pf_au02`(리본 넝쿨) 뺌. ⛔PNG·`PHOTO_RATIO` 는 남긴다
  { key: 'deco_autumn_frame', tab: 'frame', season: 'autumn', from: '2026-09-01', label: '가을 프레임', items: ['pf_au01', 'pf_au03', 'pf_au04'] },
  // 🎁🍽 [창업자 확정 2026-08-29] **9월 선물 = 가을 접시 4컷.** 무료다.
  //    📮 창업자 = *"9월 기념으로는 접시세트를 하나 풀까? 유저선물로"* → 음식 넣은 판을 보고 *"좋아 이거하자. 맘에들어 :)"*
  //    ⛔⛔ **「그릇팩(유료 상품)」과 «다른 것»이다** — 유료 세트는 *"접시도 지금 열지말고 결제켤때 같이"*.
  //       8컷 중 «둥근 것 넷»만 9월 선물로 먼저 푼다(A1·A4·B1·B4). 나머지 넷은 유료팩 몫.
  //    ⭐ 왜 둥근 것만인가(실측) = 오벌은 정사각 사진의 위아래가 잘리고,
  //       비스듬한 접시(pf_ad06)는 사진이 정면이라 원근이 안 맞아 붕 뜬다.
  //    ⏰ **도장(「9월에 온 사람만」)은 «안» 만들었다** — 창업자 = *"일단 멈춰봐 도장은. 빨리못하니까"*
  //       → *"11월부턴 도장파지뭐"*. 그래서 **10월에 오는 유저도 그대로 받는다.** 설계는 할일 문서에 저장됨.
  //    ⛔ 열쇠가 `pf_` 라야 한다 — `DecorEditor.isBacking` 이 접두어로 «밑판»을 가른다.
  //       안 그러면 탭할 때 앞으로 튀어나와 사진을 덮는다(v8.59·v9.01 사고).
  //    ⚠️ 정직하게 = 「사진이 창에 저절로 담기는」 기능은 «아직 없다». 유저가 두 손가락으로 맞춘다.
  //       그 기능은 **유료 그릇팩을 팔기 «전»에** 만든다(할일 문서).
  //    ⛔⛔ **`season` 을 «일부러» 안 붙였다** — 창업자 = *"가을팩에 끼워넣지말고 단독으로"*
  //       `season` 은 서랍 «정렬 순서»에만 쓰인다(`DecorEditor.jsx:653` `seasonRank`).
  //       붙이면 가을 세트 사이에 끼어 「가을팩의 일부」로 보인다. 안 붙이면 **선물 택이 붙은 단독 세트**로 선다.
  //    🎁 **택 = 「오픈 기념 선물」** (창업자 = *"접시를 오픈기념 특별선물로 예쁘게 만들어서 올리자."*)
  //       `giftLabel` 이 없으면 그냥 「선물」로 뜬다 — 이 그룹만 특별한 글자를 준다.
  //    💬 `hint` = 서랍에 뜨는 한 줄 안내. 창업자 = *"처음보는 사람들은 저 구멍뚤린게 뭔가 할 것 같은데 ㅋ"*
  //    📐 `bigCell` = 칸을 크게. 창업자 = *"크기가 작아서 다른 건줄알았어"*
  //       ⭐ 접시는 «납작한 고리»라 정사각 칸에 넣으면 위아래가 비어 실제보다 작아 보인다.
  { key: 'deco_gift_dish_autumn', tab: 'frame', gift: true, giftLabel: '오픈 기념 선물', bigCell: true, from: '2026-09-01', label: '가을 접시 세트', hint: '사진 위에 얹으면 접시에 담겨요', items: ['pf_ad01', 'pf_ad04', 'pf_ad05', 'pf_ad08'] },
  { key: 'deco_dy_frame_b', tab: 'frame', diary: true, from: '2026-10-01', label: '필름·라인', items: ['pf_dy03', 'pf_dy06', 'pf_dy11', 'pf_dy05'] },
  { key: 'deco_dy_frame_c', tab: 'frame', diary: true, from: '2026-11-01', label: '종이 액자·레이스', items: ['pf_dy04', 'pf_dy07', 'pf_dy08', 'pf_dy12'] },

  // ⛔ [창업자 검수 2026-08-29] 9/1 「꽃다발」 4컷 = **다 뺐다** (*"꽃다발 4컷도 다빼고"*).
  //    ⛔ PNG(`dyf01`·`dyf02`·`dyf03`·`dyf07`)·`PHOTO_RATIO` 는 «지우지 않는다» — 10/1·11/1 세트와 한 가족이다.
  { key: 'deco_dy_flower_b', tab: 'deco', diary: true, from: '2026-10-01', label: '들꽃', items: ['dyf04', 'dyf05', 'dyf06', 'dyf11'] },
  { key: 'deco_dy_flower_c', tab: 'deco', diary: true, from: '2026-11-01', label: '화분·잎', items: ['dyf08', 'dyf09', 'dyf10', 'dyf12'] },

  // ⛔ [창업자 검수 2026-08-29] 9/1 「도장·씰」 = **다 뺐다** (*"도장씰도 다 빼자."*).
  //    처음엔 *"3번 뺀다"*(`dys05`) 였는데 서랍을 다시 보고 넷 다 내렸다.
  //    ⛔ PNG(`dys03`·`dys04`·`dys05`·`dys11`)·`PHOTO_RATIO` 는 «지우지 않는다» — 10/1·11/1 세트와 한 가족이다.
  { key: 'deco_dy_stamp_b', tab: 'deco', diary: true, from: '2026-10-01', label: '선·화살표', items: ['dys01', 'dys02', 'dys07', 'dys08'] },
  { key: 'deco_dy_stamp_c', tab: 'deco', diary: true, from: '2026-11-01', label: '붓칠·햇살', items: ['dys06', 'dys09', 'dys10', 'dys12'] },

  // ⛔ [창업자 검수 2026-08-29] 9/1 「메모지」 = **다 뺐다** (*"메모지도 다빼자."*).
  //    처음엔 *"3번,4번 뺀다."*(`dyl06`·`dyl10`) 였는데 서랍을 다시 보고 넷 다 내렸다.
  //    ⭐ 이로써 9/1 에 열리는 일기 세트(`dy*`)는 **「무늬 테이프」 하나만** 남는다.
  //    ⛔ PNG(`dyl01`·`dyl05`·`dyl06`·`dyl10`)·`PHOTO_RATIO` 는 «지우지 않는다» — 10/1·11/1 세트와 한 가족이다.
  { key: 'deco_dy_label_b', tab: 'deco', diary: true, from: '2026-10-01', label: '이름표·태그', items: ['dyl03', 'dyl09', 'dyl11', 'dyl08'] },
  { key: 'deco_dy_label_c', tab: 'deco', diary: true, from: '2026-11-01', label: '띠·배너', items: ['dyl02', 'dyl04', 'dyl07', 'dyl12'] },

  // ⛔ [창업자 검수 2026-08-29] 9/1 「강조 표시」 4컷 = **다 뺐다** (*"4개다 뺀다."*).
  //    ⛔ PNG(`dyh01`·`dyh03`·`dyh12`·`dyh06`)·`PHOTO_RATIO` 는 «지우지 않는다» — 10/1·11/1 세트와 한 가족이다.
  { key: 'deco_dy_hand_b', tab: 'deco', diary: true, from: '2026-10-01', label: '손그림 도장', items: ['dyh07', 'dyh08', 'dyh09', 'dyh05'] },
  { key: 'deco_dy_hand_c', tab: 'deco', diary: true, from: '2026-11-01', label: '점·붓칠', items: ['dyh02', 'dyh04', 'dyh10', 'dyh11'] },

  // ✂️ [창업자 검수 2026-08-29] *"1.2.3번 뺀다."* → `wt_dy02`·`wt_dy04`·`wt_dy03` 내림
  //    ➕ 그리고 「가을 단풍·낙엽」에 섞여 있던 **테이프 두 줄을 이리로 옮겼다**
  //       (창업자 *"12,13은 테이프로"* — `au_t06`·`au_t02`).
  //    ⭐ 모양이 테이프인데 데코 탭에 있으면 유저가 마테 탭에서 찾다 못 찾는다. 자리가 맞아졌다.
  { key: 'deco_dy_tape_a', tab: 'tape', diary: true, from: '2026-09-01', label: '무늬 테이프', items: ['wt_dy05', 'wt_dy06', 'wt_dy09', 'wt_dy21', 'au_t06', 'au_t02'] },
  // 🎗 [2026-08-12] `wt_dy07` 을 «내렸다» — 창업자 *"1.6중에 네가 보고 하나 빼."*
  //   🔬 25컷을 픽셀로 재니 «같은 그림»은 0쌍인데, `wt_dy07`↔`wt_dy16` 만 **같은 크림 한지·같은 질감**이고
  //      길이만 달랐다(1.49 ↔ 2.89). 눈으로 보고 골랐다 —
  //      ⭐ **짧은 한지는 `wt_dy08`(갈색)이 대신한다.** 긴 크림 한지는 `wt_dy16` 하나뿐이라 빼면 그 자리가 빈다.
  //   ⛔ **파일은 안 지운다.** 서랍에서만 내린다 — 이미 이 마테로 꾸며 저장한 일기가 깨지면 안 된다.
  { key: 'deco_dy_tape_b', tab: 'tape', diary: true, from: '2026-10-01', label: '민무늬·종이', items: ['wt_dy01', 'wt_dy11', 'wt_dy14', 'wt_dy18', 'wt_dy08', 'wt_dy16'] },
  { key: 'deco_dy_tape_c', tab: 'tape', diary: true, from: '2026-11-01', label: '격자·도트·겹침', items: ['wt_dy12', 'wt_dy13', 'wt_dy15', 'wt_dy17', 'wt_dy19', 'wt_dy20'] },

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
  // ✅ **2026-07-31 되살림** — 원본 시트에서 **띠부씰 8px**으로 다시 잘랐다(선 끊김 해결).
  // ⛔ 아래는 내렸던 날의 기록: **2026-07-31 서랍에서 내림** — 창업자 폰 확인 *"이 프레임은 버리자ㅠ 다시뽑던지 할게ㅠ"*
  //   ⚠️ 두 가지가 겹쳤다: ①테두리에 **가짜 투명 격자 찌꺼기**(검은 점선)가 남았고
  //      ②원본이 **455~600px** 인데 프레임 표시크기는 **626px** 이라 어차피 확대다.
  //   ②는 고칠 수 있는 게 아니라서(없는 정보는 안 살아난다) **다시 뽑는 게 맞다.**
  //   📌 마테는 같은 격자 찌꺼기였지만 **띠 색만 속살 색으로 덮어 살렸다**(모양이 단순해서 됨).
  //      프레임은 모양이 복잡하고 해상도까지 모자라 같은 수술이 안 통한다. **증상이 같아도 처방이 다르다.**
  //   ⚠️ 파일과 `PHOTO_RATIO` 는 그대로 둔다 — 이걸로 꾸며 저장한 표지가 계속 정상 렌더돼야 한다.
  //   🎁 그래서 **출시기념 팩이 지금 비어 있다.** 새 컷 받으면 이 줄을 되살리면 된다.
  // 🎁🎁 `gift: true` = **서랍에 「선물」 택이 붙고 그 탭 맨 위로 올라간다.** (창업자 2026-08-03)
  //   *"여름출시기념팩 표시없으니까 뭔지 모름. 스티커나, 컬러택이라도 붙이고… 친구들 제일 아래있어 잘 모름"*
  //   ⛔ 전엔 안내가 **서랍을 처음 열 때 한 번 뜨는 시트**뿐이었다 — 닫고 나면 다시는 안 보이고,
  //      서랍 어디에도 「이게 선물이다」가 안 적혀 있었다. **한 번 스치는 안내는 없는 것과 같다.**
  //   ⭐ 그래서 «물건 옆»에 표시를 박는다. 시트는 상단 줄에서 언제든 다시 열 수 있다.
  { key: 'deco_sf', tab: 'frame', season: 'summer', gift: true, label: '출시기념 여름', items: ['pf_sm01', 'pf_sm02', 'pf_sm03', 'pf_sm04', 'pf_sm05', 'pf_sm06', 'pf_sm07', 'pf_sm08', 'pf_sm09', 'pf_sm10', 'pf_sm11', 'pf_sm12'] },
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
  // 🍁🍁 **2026-08-03 — 무료 가을 데코에서 16컷을 내렸다. 「파는 그림」이라서다.**
  //   ⛔⛔ 사고의 모양 — `au_i*`(무료 계절 자산) 과 `wh_*`·`ws_*`(가을 유료팩 후보)가
  //      **같은 그림인데 이름만 달랐다.** 그림이 두 벌 들어왔기 때문이다:
  //        `docs/stickers/가을-창업자-2507/`      → 앱에 무료로 등록 (au_i)
  //        `docs/stickers/신규-2607-수채화팩/`    → 유료팩 후보로 보관 (wh·ws)
  //      누수 검사(`check-packmix.mjs`)는 **이름으로만** 보니까 *"✅ 안 샌다"* 고 통과시켰다.
  //      그대로 뒀으면 **990원에 파는 그림 16컷이 9/1·10/1·11/1 에 저절로 공짜로 열렸다.**
  //   🔎 찾은 법 = `python3 tools/leak-art.py` — **이름 말고 픽셀로** 맞대본다.
  //   ⭐ 창업자 판정 2026-08-03: *"큰일날뻔했네"* → **ⓐ 무료에서 뺀다(유료팩을 지킨다).**
  //      근거 = *"그래야 유료를 사지 주면 누가사"* (8/3) — 같은 그림이면 안 팔린다.
  //   ⛔ 파일은 안 지운다. 서랍 목록에서만 내린다.
  //   ⚠️ 되돌리려면 `src/data/paidPacks.js` 의 가을 팩 `alias` 를 «먼저» 지워야 한다 — 안 그러면 검사가 막는다.
  //   내린 것 = au_i02·03·04·05·06·07·09·10·11·12·13·14·17·18·19·20 (16컷)
  // ✂️ [창업자 검수 2026-08-29] 14컷 → **6컷** (*"1.2.3.4.,10 14뺀다. 12,13은 테이프로"*)
  //    · 뺀 것 = `au_i15`·`au_i16`·`au_i21`(잎＋열매 섞인 것) · `au_i01`(해·구름) · `au_i30`(열매 가지) · `au_s02`(원형 풍경)
  //    · 옮긴 것 = `au_t06`·`au_t02` → 마스킹테이프 탭(`deco_dy_tape_a`)
  //    ⭐ 남은 여섯은 전부 «잎 한 장»이라 서랍이 한 결로 보인다.
  //    ⛔ 뺀 컷의 PNG·`PHOTO_RATIO` 는 지우지 않는다(10/1·11/1 가을 세트와 한 가족).
  { key: 'deco_autumn_a', tab: 'deco', season: 'autumn', from: '2026-09-01', label: '가을 단풍·낙엽', items: ['au_i24', 'au_i28', 'au_i38', 'au_i39', 'au_i29', 'au_i42'] },
  // 🍂 [창업자 판정 2026-08-29] **가을 소품 8컷 — 데코 탭 · 9/1** (창업자 시트 `가을-창업자-2026-08-26`)
  //    ⛔ 파일은 `au_i43`~`au_i50` 으로 앱에 «이미 들어와 있었는데» `STICKER_GROUPS` 에도 `PHOTO_RATIO` 에도
  //       한 줄이 없어 **어디서도 못 쓰는 유령**이었다(2026-08-01 에 32컷이 같은 꼴이었다).
  //    🕳 넣으면서 다시 잘랐다 — 바구니 손잡이·머그 손잡이 «안»에 흰 판이 갇혀 있었다(`cut.py --punch`).
  { key: 'deco_autumn_props', tab: 'deco', season: 'autumn', from: '2026-09-01', label: '가을 소품', items: ['au_i43', 'au_i44', 'au_i45', 'au_i46', 'au_i47', 'au_i48', 'au_i49', 'au_i50'] },
  // 🍂 **겹치는 컷 4개를 서랍에서 내렸다** (창업자 2026-08-01 눈으로 잡음 — *"펭펭, 꼬르곰 겹쳐. 단풍 들고 있는 거"*)
  //    내린 것 = `au_b01`·`au_b05`(9/1) · `au_b04`(10/1) · `au_b06`(11/1)
  //    ⭐ 픽셀로도 확인했다 — `au_b05`↔`au_b20` 이 13.74 로 압도적으로 닮았고(다음이 33) 나머지는
  //       **구도가 닮아 나란히 놓으면 같아 보이는** 것들이었다.
  //    📌 **숫자는 「어디를 볼지」만 정하고 「같나 다르나」는 눈이 정한다**(v9.16 교훈 그대로) —
  //       내 지표는 13.74 하나만 집었는데 창업자 눈은 넷을 잡았다.
  //    ⛔ 파일은 안 지운다. 서랍에서만 내린다(이미 그걸로 꾸민 표지가 깨지면 안 된다).
  // ✂️➕ [창업자 검수·판정 2026-08-29]
  //    · 뺀 것 = *"3.4.5뺀다"* → `au_b13`(앞치마 하트)·`au_b14`(커피)·`au_b18`
  //    · 넣은 것 = 창업자 시트 `가을곰펭-창업자-2026-08-27` **8컷**(`au_b23`~`au_b30`)
  //      ⛔ 이 여덟도 PNG 는 앱에 있었는데 그룹·`PHOTO_RATIO` 에 한 줄이 없어 **유령**이었다.
  //      창업자 = *"9/1 에 같이"* → 카롱 데뷔와 «같은 날» 곰펭 가을도 온다.
  //    ⛔ 그중 둘은 창업자가 서랍을 보고 바로 잡아 **뺐다** (*"저 홀로있는 밤송이와 혼자 누워있는 펭펭은 뭐야?"* → *"빼자"*)
  //       · `au_b25`(밤송이) = **캐릭터가 한 마리도 없다.** 게다가 그림체가 혼자 사실적(명암·하이라이트)이라 튄다.
  //         ⭐ 내가 여덟 장을 «어디에 넣을지»는 안 묻고 통째로 친구들 그룹에 넣은 게 뿌리다.
  //       · `au_b23`(펭펭 혼자 낙엽 더미) = 낙엽 더미 컷이 셋이라 겹쳤다(`au_b26`·`au_b30` 이 남는다).
  //    ⛔ 둘 다 PNG·`PHOTO_RATIO` 는 지우지 않는다 — 나중에 딴 자리에 쓸 수 있다.
  { key: 'buddies_autumn_a', tab: 'buddies', bigCell: true, season: 'autumn', from: '2026-09-01', label: '꼬르곰·펭펭의 가을', items: ['au_b20', 'au_b09', 'au_b24', 'au_b26', 'au_b27', 'au_b28', 'au_b29', 'au_b30'] },
  // 🍁 유료팩과 겹치는 6컷(au_i02·05·06·07·09·18)을 내렸다 → 10 → 4컷 (위 2026-08-03 주석 참고)
  { key: 'deco_autumn_b', tab: 'deco', season: 'autumn', from: '2026-10-01', label: '가을 열매·수확', items: ['au_i08', 'au_i26', 'au_i32', 'au_i23', 'au_i35', 'au_i36', 'au_i37', 'au_i33', 'au_t03', 'au_t04', 'au_s01'] },
  // 🦫🐧 **친구 데뷔 ①** — 가을은 카롱이다(꼬르곰은 겨울·봄 친구와 짝을 짓는다).
  //    창업자 *"둘이 덩치가 있어서 케미가 별루야… 카롱이랑 꼬르곰둘은 별로 안어울림"* → 짝을 펭펭으로 바꿨다.
  //    ⛔ 5명을 한꺼번에 안 내보낸다 — 「새 친구 등장」은 한 번밖에 못 쓰는 카드라 셋으로 쪼갠다.
  //    ⭐ 2026-08-03 카롱 재제작으로 9 → **12컷**. 늘어난 3컷은 씬 풀에서 빠진 3컷의 몫이라
  //       가을 캐릭터 총량은 그대로다(⛔정원을 새로 넘기지 않았다).
  { key: 'buddies_karong', tab: 'buddies', bigCell: true, season: 'autumn', from: '2026-09-01', label: '카롱과 펭펭', items: ['kp_run', 'kp_yoga', 'kp_dumbbell', 'kp_bench', 'kp_muscle', 'kp_shoulder', 'kp_hug', 'kp_salad', 'kp_chill', 'kp_walk', 'kp_leafsit', 'kp_rake'] },
  // 🦫 **카롱 «솔로» 4컷** (2026-08-10 창업자 시트 · 창업자 확정 *"무료로 풀자"* · *"카롱은 가을에"*)
  //    ⭐⭐ **위 12컷은 전부 「카롱＋펭펭」이라 카롱 솔로가 앱에 0컷이었다**(2026-08-04 창업자가 잡았다).
  //       단독팩 「카롱의 ○○」 을 만들 재료가 없던 자리이자, 카롱을 «혼자» 붙이고 싶을 때 쓸 게 없던 자리다.
  //    ⛔ **뾰미(`xb_*` 8컷)는 지금 안 넣는다 — 겨울 데뷔다**(창업자 2026-08-10 *"뾰미는 지금말구 겨울에"*).
  //       「새 친구 등장」은 한 번밖에 못 쓰는 카드라 가을=카롱 · 겨울=뾰미 · 봄=꼬비로 쪼개 쓴다.
  //    ⭐ 고른 넷 = 성격(요가·아령 = 「여유로운 체력왕」) 반 ＋ 요리(볶기·엄지척) 반.
  //       ⛔ 남은 4컷(매트 들기·물 마시기·손질·소스)은 파일에 그대로 있다 — 나중에 단독팩 재료.
  { key: 'buddies_karong_solo', tab: 'buddies', bigCell: true, season: 'autumn', from: '2026-09-01', label: '카롱', items: ['ka_g02', 'ka_g03', 'ka_c02', 'ka_c04'] },
  { key: 'buddies_autumn_b', tab: 'buddies', bigCell: true, season: 'autumn', from: '2026-10-01', label: '꼬르곰·펭펭의 가을 나들이', items: ['au_b02', 'au_b03', 'au_b19', 'au_b21', 'au_b10', 'au_b11', 'au_b12'] },
  // 🍁 유료팩과 겹치는 6컷(au_i10·11·13·14·17·20)을 내렸다 → 10 → 4컷 (위 2026-08-03 주석 참고)
  { key: 'deco_autumn_c', tab: 'deco', season: 'autumn', from: '2026-11-01', label: '늦가을 소품', items: ['au_i22', 'au_i25', 'au_i27', 'au_i31', 'au_i34', 'au_i40', 'au_i41', 'au_t01', 'au_t05', 'au_s03', 'au_s04'] },
  { key: 'buddies_autumn_c', tab: 'buddies', bigCell: true, season: 'autumn', from: '2026-11-01', label: '꼬르곰·펭펭의 늦가을', items: ['au_b07', 'au_b08', 'au_b22', 'au_b15', 'au_b16', 'au_b17'] },
  // 💪 라이프
  // 🍳 주방도구 (2026-07-29) — 라이프 탭이 통째로 운동용품(아령·줄넘기·복싱)이라
  //   요리앱 표지를 꾸미는데 아령이 나왔다. 요리 도구를 맨 위로 올린다.
  // 🥩🦐🍞🥤🥦🍓 2026-07-31 재료 종류별 보충 (창업자 *"재료에 종류별로 3.4개씩은 넣자"*)
  //   ⛔ 고기에서 **뼈·막대 붙은 컷**(갈비·닭다리·양갈비)은 뺐다 — 창업자 *"막대기 달린고기빼고 식별 쉬운걸로"*
  //   해산물도 **많이 쓰는 것**만 (새우·연어·오징어·홍합) — 성게·소라는 우리 집밥에 안 나온다
  { key: 'f_meat', tab: 'food', label: '고기', items: ['ni_01', 'ni_02', 'ni_03', 'ni_04'] },
  { key: 'f_sea', tab: 'food', label: '해산물', items: ['ni_05', 'ni_06', 'ni_07', 'ni_08'] },
  { key: 'f_veg', tab: 'food', label: '채소', items: ['ni_17', 'ni_18', 'ni_19', 'ni_20'] },
  { key: 'f_fruit', tab: 'food', label: '과일', items: ['ni_21', 'ni_22', 'ni_23', 'ni_24', 'ig_frb03', 'ig_frb13'] },
  { key: 'f_bakery', tab: 'food', label: '빵', items: ['ni_09', 'ni_10', 'ni_11', 'ni_12'] },
  { key: 'f_drink', tab: 'food', label: '음료', items: ['ni_13', 'ni_14', 'ni_15', 'ni_16'] },
  { key: 'kitchen_tools', tab: 'food', label: '요리 도구', items: ['tk_apron', 'tk_hat', 'tk_pot_pink', 'tk_pot_green', 'tk_bowl', 'tk_batter', 'tk_board_knife', 'tk_board', 'tk_cup', 'tk_scale', 'tk_mitt', 'tk_mitt_purple', 'tk_book', 'tk_clip', 'tk_salt', 'tk_sugar'] },
  { key: 'life', tab: 'deco', label: '운동·라이프', items: ['lf_fit12', 'lf_fit11', 'lf_fit08', 'lf_fit07', 'lf_fit02', 'lf_fit13', 'lf_fit14', 'lf_fit06'] },
  // ✏️ 글자 (2026-07-29) — '글자' 탭엔 직접 쓰는 것만 있어서, 손글씨 문구 스티커가 없었다.
  //   맨 위 '한끼 문구' = 창업자가 직접 뽑은 우리만의 말들(다른 다꾸 앱엔 없는 것).
  // ✏️ 2026-07-31 **시트를 새로 받아 16종으로 되살렸다.** 전에 10컷을 잠깐 뺐던 이유 =
  //   옛 시트에 흰 다이컷이 그려져 있는데 `--diecut auto` 를 또 둘러 **테두리가 두 겹**이었다.
  //   → 새 시트는 `--diecut keep`(그려진 흰 테 두께를 실측해 그대로)로 잘랐다. 두 겹도 지글거림도 없다.
  //   ⭐ 새로 6종 — It's me · 싱거워.. · 레꾸 재밌어 · 아이 원픽! · 남편 원픽! · 이건 인정!
  //     「아이 원픽!」「남편 원픽!」 = 가족 반응 기록 — 우리 앱 성격에 딱 맞는 말.
  // 🐻🐧 **레꾸 캐릭터 32컷 (2026-08-12 창업자 시트 2장 · 레꾸 «전용»)**
  //   창업자 *"글자있는 버전도 넣자"* — 그림 밑에 캡션이 붙은 채로 한 컷이다.
  //   ⭐ 왜 글자를 넣나 = 창업자 *"직관적이지 않는 것도 있어서"*. 「저당」과 「저염」은
  //      그림만으로 못 가른다 — **뜻이 글자에 있다**(2026-08-08 rs_ 99컷과 같은 판단).
  //   ⛔ 「글자 뗀 판」도 잘라 뒀지만 «안 들인다» — 같은 그림이 서랍에 두 번 나온다
  //      (창업자 *"왜 같은그림이 나와?"*). 파일은 docs 에 그대로 있다.
  // 🐻 창업자 2026-08-12 *"꼬르곰도 제발 넣어줘."* — 레꾸 «전용»이라 일기를 꾸미는 동안엔 못 봤다.
  //    ⭐ only 를 뺀다 → 레꾸 「글자」 탭과 일꾸 「기록」 탭 «둘 다»에 뜬다.
  //    ⛔ 일꾸 「기록」의 기존 99컷과 안 겹친다 — 그건 «도구·재료» 그림이고 이건 «꼬르곰·펭펭이 하는 모습»이다.
  //    ⚠️ 「일꾸」 선반은 diary 표시가 있어야 뜬다(onShelf) — tabs 만 넣고 이걸 빠뜨려 안 보였다.
  { key: 'rs_star', wordy: true, tab: 'notetext', tabDiary: 'record', diary: true, both: true, label: '반응 · 별점', items: ['rs_v01', 'rs_v02', 'rs_v03', 'rs_v04', 'rs_v05', 'rs_v06', 'rs_v07', 'rs_v08', 'rs_v09', 'rs_v10', 'rs_v11', 'rs_v12', 'rs_v13', 'rs_v14', 'rs_v15', 'rs_v16'] },
  { key: 'rs_way', wordy: true, tab: 'notetext', tabDiary: 'record', diary: true, both: true, label: '조리법 · 기록', items: ['rs_k01', 'rs_k02', 'rs_k03', 'rs_k04', 'rs_k05', 'rs_k06', 'rs_k07', 'rs_k08', 'rs_k09', 'rs_k10', 'rs_k11', 'rs_k12', 'rs_k13', 'rs_k14', 'rs_k15', 'rs_k16'] },
  { key: 'text_hankki', wordy: true, tab: 'notetext', label: '한끼 문구', items: ['tw_haenaem', 'tw_first', 'tw_5min', 'tw_again', 'tw_better', 'tw_really', 'tw_daebak', 'tw_wow', 'tw_salty', 'tw_night', 'tw_kidpick', 'tw_hubbypick', 'tw_admit', 'tw_funfun', 'tw_itsme', 'tw_bland'] },
  { key: 'text_word', wordy: true, tab: 'notetext', label: '문구', items: ['tw_today', 'tw_success', 'tw_welldone', 'tw_tasty', 'tw_more', 'tw_fav', 'tw_honey', 'tw_hearty', 'tw_easy', 'tw_mom', 'tw_nexttime', 'tw_fail', 'tw_yummy', 'tw_best', 'tw_ourhankki', 'tw_goodday'] },
  // 🍳 레꾸 상황·평가 8그룹 (2026-08-08 창업자 시트 · 그림+캡션 스티커)
  //   「요리 기록에 실제로 도움이 되는 스티커」 — 스티커-방향 문서의 「없는 6묶음」을 채운다.
  //   변형쌍은 창업자 판정분만(귀요미·노랑·그린·아이콘) — 탈락 벌은 앱에 안 들였다.
  //
  // 📔📔 **[2026-08-12 창업자 확정] 이 여덟은 «일꾸로 보낸다» — 레꾸 서랍엔 안 나온다.**
  //   창업자 원문 = *"맛평가부터 반응 조리법,요리상황 식사상황미리준비보관 건강태그까지는 일꾸로
  //   보내는데 좋을 것 같아"* · *"레꾸 그 자리를 오늘뽑은 꼬르곰이 채워주면 좋을 것 같아.
  //   **어차피 레꾸자리는 많은 양이 스티커를 붙일 수 없으니**.."*
  //   ⭐⭐ 마지막 줄이 근거다 — 레꾸는 **표지 한 장**이라 스티커 몇 개면 꽉 찬다.
  //      99컷을 다 펼쳐 봐야 고르기만 힘들다. 일꾸(속지)는 넓어서 이만큼이 값을 한다.
  //   ⛔⛔ **그리고 안 가르면 「같은 게 두 번」 나온다** — 새 32컷과 이름이 실제로 겹친다(실측):
  //      조리법 **8개 완전 일치**(썰기·볶기·끓이기·굽기·찌기·튀기기·에어프라이어·오븐)
  //      반응 평가 **4개 완전 일치**(칭찬받음·간이 딱·저장 필수·실패 없는 메뉴) ＋ 뜻만 같은 것 4개
  //      갈래는 **그림**이다 — 기존은 «도구·재료», 새것은 «꼬르곰·펭펭이 하는 모습».
  //   ⚠️ `only` 는 **서랍(고르는 목록)만** 거른다. 이미 붙여 저장한 표지는 그대로 그려진다(안 사라진다).
  { key: 'rs_taste', wordy: true, tab: 'record', diary: true, only: 'diary', label: '맛 평가', items: ['rs_t01', 'rs_t02', 'rs_t03', 'rs_t04', 'rs_t05', 'rs_t06', 'rs_t07', 'rs_t08', 'rs_t09', 'rs_t10', 'rs_t11', 'rs_t12'] },
  { key: 'rs_react', wordy: true, tab: 'record', diary: true, only: 'diary', label: '반응 평가', items: ['rs_r01', 'rs_r02', 'rs_r03', 'rs_r04', 'rs_r05', 'rs_r06', 'rs_r07', 'rs_r08', 'rs_r09', 'rs_r10', 'rs_r11', 'rs_r12'] },
  { key: 'rs_cook', wordy: true, tab: 'record', diary: true, only: 'diary', label: '조리법', items: ['rs_q01', 'rs_q02', 'rs_q03', 'rs_q04', 'rs_q05', 'rs_q06', 'rs_q07', 'rs_q08', 'rs_q09', 'rs_q10', 'rs_q11', 'rs_q12'] },
  { key: 'rs_scene', wordy: true, tab: 'record', diary: true, only: 'diary', label: '요리 상황', items: ['rs_i01', 'rs_i02', 'rs_i03', 'rs_i04', 'rs_i05', 'rs_i06', 'rs_i07', 'rs_i08', 'rs_i09', 'rs_i10', 'rs_i11', 'rs_i12', 'rs_i13', 'rs_i14', 'rs_i15'] },
  { key: 'rs_meal', wordy: true, tab: 'record', diary: true, only: 'diary', label: '식사 상황', items: ['rs_m01', 'rs_m02', 'rs_m03', 'rs_m04', 'rs_m05', 'rs_m06', 'rs_m07', 'rs_m08', 'rs_m09', 'rs_m10', 'rs_m11', 'rs_m12'] },
  { key: 'rs_prep', wordy: true, tab: 'record', diary: true, only: 'diary', label: '미리 준비', items: ['rs_p01', 'rs_p02', 'rs_p03', 'rs_p04', 'rs_p05', 'rs_p06', 'rs_p07', 'rs_p08', 'rs_p09', 'rs_p10', 'rs_p11', 'rs_p12'] },
  { key: 'rs_store', wordy: true, tab: 'record', diary: true, only: 'diary', label: '보관', items: ['rs_s01', 'rs_s02', 'rs_s03', 'rs_s04', 'rs_s05', 'rs_s06', 'rs_s07', 'rs_s08', 'rs_s09', 'rs_s10', 'rs_s11', 'rs_s12'] },
  { key: 'rs_health', wordy: true, tab: 'record', diary: true, only: 'diary', label: '건강 태그', items: ['rs_g01', 'rs_g02', 'rs_g03', 'rs_g04', 'rs_g05', 'rs_g06', 'rs_g07', 'rs_g08', 'rs_g09', 'rs_g10', 'rs_g11', 'rs_g12'] },

  // 🐻😢🐧 **꼬르곰·펭펭 «감정» 36컷 — 일꾸 전용** (2026-08-15 창업자 시트 9장)
  //   📮 창업자 *"그리고 보니 우리 꼬르곰 펭펭 슬픈 컷은 하나도 안 넣었어.."*
  //   🔢 그때 실측 = 앱의 곰펭 96컷이 **전부 응원·기쁨**이었다(하이파이브·엄지척·만세·박수·불꽃·파티…).
  //      **우는·화난·지친·자는 컷이 0개.** 한끼는 「한 끼 해낸 나를 위로하는 공간」인데
  //      **위로할 감정 자체가 앱에 없었다.**
  //   ⛔ `tab: 'buddies'` 라야 모션·효과가 붙는다 — `FRIEND_IDS` 가 그 탭으로 정해진다.
  //      (2026-07-30 에 여름·가을 곰펭이 접두어 검사에 안 걸려 모션이 통째로 안 붙은 적이 있다)
  //   ⭐ 앞치마는 **멜빵이 정본**. 끈 앞치마 옛 컷도 남긴다 — 창업자 *"다양한 컷이 있으면 좋잖아"*.
  { key: 'ge_mood', tab: 'buddies', bigCell: true, diary: true, only: 'diary', label: '꼬르곰 · 마음', items: ['ge_s901', 'ge_s202', 'ge_s602', 'ge_s203', 'ge_s603', 'ge_s601', 'ge_s902', 'ge_s903', 'ge_s201', 'ge_s204', 'ge_s604', 'ge_s904'] },
  { key: 'ge_tired', tab: 'buddies', bigCell: true, diary: true, only: 'diary', label: '꼬르곰 · 지친 날 · 아픈 날', items: ['ge_s101', 'ge_s801', 'ge_s504', 'ge_s704', 'ge_s503', 'ge_s703'] },
  // 🍳 부엌 컷도 «일꾸»다 — 창업자 *"사실 레꾸보다는 일꾸. 요리하면서 당황한거 적기에 좋아"*
  { key: 'ge_oops', tab: 'buddies', bigCell: true, diary: true, only: 'diary', label: '꼬르곰 · 요리하다 당황', items: ['ge_s102', 'ge_s802', 'ge_s103', 'ge_s803', 'ge_s104', 'ge_s804'] },
  // 🌙 하루 끝도 «일꾸» — 창업자 *"하루를 마감하고 힘들었던 거니까"*
  { key: 'ge_endday', tab: 'buddies', bigCell: true, diary: true, only: 'diary', label: '꼬르곰×펭펭 · 하루 끝', items: ['ge_s301', 'ge_s302', 'ge_s303', 'ge_s304'] },
  // ⭐⭐ 위로 4컷 = 한끼 컨셉의 한가운데. 앱에 「위로하는 장면」이 한 장도 없었다.
  //   🐧 펭펭은 네 컷 다 «무표정»이다 — 표정이 아니라 «행동»으로 다정함을 낸다(정본 그대로).
  { key: 'ge_comfort', tab: 'buddies', bigCell: true, diary: true, only: 'diary', label: '꼬르곰×펭펭 · 위로', items: ['ge_s401', 'ge_s402', 'ge_s403', 'ge_s404'] },
  { key: 'ge_write', tab: 'buddies', bigCell: true, diary: true, only: 'diary', label: '꼬르곰 · 기록하는 날', items: ['ge_s501', 'ge_s701', 'ge_s502', 'ge_s702'] },
  // 📅 요일 = 무슨 요일에 해먹었는지 기록용. 빈 라벨 3종은 직접 글씨 얹으라고 둔다.
  //   ⚠️ 숫자 1~10 은 뺐다(창업자 2026-07-29) — 넣을 땐 '레시피 순서 매기기'를 생각했는데
  //      우리 레꾸는 **표지 한 장**이라 순서를 매길 자리가 없고(순서는 상세 화면에 이미 번호로 있음),
  //      날짜로 쓰기엔 10까지뿐이라 반쪽이었다. 파일(`tn_1`~`tn_10`)은 지우지 않고 남겨둠.
  { key: 'text_num', tab: 'notetext', label: '요일 · 라벨', items: ['tn_mon', 'tn_tue', 'tn_wed', 'tn_thu', 'tn_fri', 'tn_sat', 'tn_sun', 'tn_cal', 'tn_ribbon', 'tn_circle'] },
  // 🎗 「글자」 → 「마테」 로 옮김 — 창업자 2026-08-09
  //    *"화살표 구분선 부분 이게 글자에 있을필요가 있나 싶어서. 데코나 마테로 가는게 맞지않아?"*
  //    → *"데코는 너무 많아서 구분선 보려면 한참 스크롤해야하니까 마테로 보내야하나 했어."*
  //    ⭐ **기준이 「성격」이 아니라 「찾기 쉬움」이다** — 그리고 세어보니 창업자 말이 맞았다:
  //       데코 **255컷** · 글자 153 · 재료 82 · 프레임 67 · **마테 49** · 친구들 46.
  //       데코는 마테의 **5.2배**라 거기 넣으면 정말 한참 굴려야 한다. 마테가 제일 적어 제일 빨리 찾는다.
  //    ⭐ 성격도 맞다 — 구분선은 «줄»이라 가로로 눕히는 마스킹테이프와 한 결이다.
  //    ⛔ 글자 탭에 둘 이유가 없었다 — 이건 «쓰는 글»이 아니라 «긋는 줄»이다.
  { key: 'text_arrow', tab: 'tape', label: '화살표 · 구분선', items: ['ta_right', 'ta_left', 'ta_up', 'ta_down', 'ta_curve', 'ta_loop', 'ta_dash', 'ta_wave', 'ta_leaf', 'ta_check', 'ta_checkc', 'ta_star'] },
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
// 🏷🏷 **글 상자 서랍** — 「글자 올릴 수 있는 것」을 한자리에 (창업자 2026-08-07)
//   ⭐ 전부 **이미 우리 것**이다. 새로 그린 게 하나도 없다 —
//      · 라벨지 12·찢은 종이 5 = 재고에 있던 것(`다이어리꾸미기-2026-08-06` · 지금은 다 반영돼 🗄보관소)
//      · 메모지 12·메모라벨 10 = 앱에 이미 있었는데 **데코 탭에 흩어져** 있었다
//      · 글쓰기 프레임 = 안이 흰 판이라 원래 글 얹기용(`기본 프레임` 그룹에 섞여 있었다)
//   ⭐⭐ **레꾸·일꾸 둘 다 나온다** — `only:'diary'` 를 안 붙인다.
//      레꾸엔 속지 글칸이 «아예 없어» 글 상자가 유일한 글쓰기 수단이다(재현으로 확인).
//   ⚠️ 데코 탭에서 그 그림들을 «빼지 않는다» — 그냥 그림으로 붙이고 싶을 수도 있다.
//      한 번 준 것은 빼앗지 않는다.
// ✂️✂️ **44 → 26컷** — 창업자가 «번호로» 짚어 열아홉을 뺐다 (2026-08-07)
//   판정판 = 44컷을 HTML 격자로 뽑아(번호 알약) 폰에서 고르게 했다.
//   ⛔ **파일은 안 지운다** — 서랍에서 내리기만. 이미 그 컷으로 꾸며 저장한 일기가 깨지면 안 된다
//      (`kf_c_`·`sf_` 를 내릴 때와 같은 방식). `BOX_PAD`·`PHOTO_RATIO` 값도 그대로 남긴다.
//   📌 뺀 것(18) = dlb03 dlb08 · dtp03 dtp05 · dgn01 dgn03 dgn04 dgn06 dgn07 dgn09 dgn11
//             · dc_dma07 dc_dma13 · pf_a07 pf_a05 pf_a08 pf_i07 pf_f08
//   ⭐ 프레임은 8 → 3 으로 줄었다 — 창업자가 «프레임 탭과 같은 컷»임을 눈으로 알아채고 골라냈다
//      (코드 대조 결과 8컷 전부 `deco_pf_bold` 와 겹쳤다). 남긴 셋은 글이 예쁘게 앉는 것들.
export const BOX_GROUPS = [
  { key: 'box_label', label: '라벨지 · 배너', items: ['dlb02', 'dlb04', 'dlb09', 'dlb12', 'dlb11', 'dlb01', 'dlb07', 'dlb10', 'dlb05', 'dlb06'] },
  { key: 'box_paper', label: '찢은 종이', items: ['dtp04', 'dtp01', 'dtp02'] },
  { key: 'box_memo', label: '메모지', items: ['dgn02', 'dgn05', 'dgn08', 'dgn10', 'dgn12'] },
  // ⛔ 도장(dc_dma16)은 뺐다 — 손잡이가 커서 글 자리가 거의 안 나온다. 데코 탭엔 그대로 있다.
  // ⭐ dc_dma05 는 창업자가 뺐다가 «다시 넣었다»(2026-08-07 *"31번 하나만 더 넣자"*)
  { key: 'box_dma', label: '메모 · 라벨', items: ['dc_dma01', 'dc_dma05', 'dc_dma11', 'dc_dma14', 'dc_dma06'] },
  { key: 'box_frame', label: '글쓰기 프레임', items: ['pf_f06', 'pf_i06', 'pf_a06'] },
  // 🗣 프레임 탭에서 옮겨 온 셋 (2026-08-09 · 위 `deco_frame2` 주석 참고)
  //   말풍선·리본 판·체크 판 — 셋 다 가운데가 비어 있어 글이 그대로 앉는다.
  { key: 'box_board', label: '말풍선 · 판', items: ['fn_speech', 'fn_bow', 'fn_gingham'] },
]

// 🏷 **글 상자 값** = 포스트잇에 «배경 그림»을 깐 것 (창업자 2026-08-07
//   *"글자올릴수있는 스티커들을 다같이 배치해서 쓰자. 포스트잇이랑 여러가지 라벨들."*)
//   ⭐ 새 구조를 안 만들었다 — `type:'note'` 에 `art` 한 칸만 붙였다.
//      글·크기·글씨체·이동·되돌리기가 **이미 되던 것 그대로** 따라온다.
//
// 📐 안쪽 여백 [위, 오른쪽, 아래, 왼쪽] % — `tools/measure-inner.py` 로 **재서** 뽑았다.
//   ⛔⛔ 그 도구를 «네 번» 고쳤다. 앞의 셋이 왜 틀렸는지는 도구 주석에 다 적었다 —
//      ⑴ 「밝은 곳=바탕」 → 크라프트·파랑 라벨은 바탕이 어둡다(9컷 «없다»)
//      ⑵ 「색이 고른 곳=바탕」 → 종이 «질감»이 기울기를 만든다(11컷 «없다»)
//      ⑶ 알파를 봤지만 **두 축에 같은 고정 문턱** → 가로로 긴 라벨은 어떤 «열»도 86% 를 못 채운다(15컷 «없다»)
//      ✅ ⑷ 그 축의 «최대 채움» 대비 상대 문턱 → **17컷 전부** 제자리. 판을 눈으로 봐서 확인했다.
//   ⚠️ **구석 장식은 자동으로 못 피한다** — 네 컷은 눈으로 잡아 손으로 넓혔다(아래 ⛔ 표시).
export const BOX_PAD = {
  // 📌 메모지 16컷 (2026-08-20) — 「글이 들어갈 자리」. 도구가 재고 판(`--panel`)을 눈으로 봤다.
  //   ⚠️ 구석 소품(앞치마·냄비·거품기·오븐장갑)에 초록 네모가 살짝 걸치는 컷이 있다.
  //      메모 글은 «세로 가운데 두 줄»이라 구석까지 안 내려간다 — 실물로 확인하고 그대로 뒀다.
  pn101: [20.5, 17.5, 15.9, 19.5],
  pn102: [17.9, 18.5, 14.4, 16.5],
  pn103: [16.9, 17.7, 15.7, 21.6],
  pn104: [19.6, 16.8, 15.0, 16.0],
  pn201: [17.8, 14.4, 13.2, 14.0],
  pn202: [18.6, 14.7, 14.4, 15.5],
  pn203: [16.4, 13.7, 13.0, 13.7],
  pn204: [12.6, 15.5, 16.1, 15.5],
  pn301: [19.9, 19.8, 16.0, 17.1],
  pn302: [16.4, 16.1, 15.2, 15.8],
  pn303: [17.8, 16.2, 14.3, 16.2],
  pn304: [17.7, 16.0, 15.3, 15.6],
  pn401: [18.9, 17.4, 15.9, 18.6],
  pn402: [18.0, 15.6, 15.0, 17.9],
  pn403: [16.4, 15.4, 15.2, 15.0],
  pn404: [22.3, 19.8, 17.6, 19.4],

  // ⛔ 손으로 고침 — 왼쪽 달력 아이콘과 아래 밑줄을 덮었다
  dlb01: [17.0, 11.7, 30.0, 30.0],
  dlb02: [38.2, 14.1, 34.0, 14.5],
  dlb03: [23.4, 17.5, 21.9, 17.1],
  dlb04: [22.6, 11.2, 22.6, 11.6],
  dlb05: [26.9, 24.2, 25.9, 23.1],
  // ⛔ 손으로 고침 — 왼쪽 위 마테 조각을 덮었다
  dlb06: [27.3, 8.4, 18.5, 22.0],
  dlb07: [25.9, 17.2, 25.9, 17.6],
  dlb08: [18.1, 17.6, 17.6, 11.4],
  dlb09: [34.5, 10.3, 29.4, 33.0],
  dlb10: [36.4, 34.0, 13.3, 34.4],
  // ⛔ 손으로 고침 — 오른쪽 아래 하트를 덮었다
  dlb11: [26.9, 26.0, 27.6, 16.2],
  // ⛔ 손으로 고침 — 오른쪽 아래 잎사귀를 덮었다
  dlb12: [10.8, 19.5, 34.0, 19.5],
  dtp01: [21.0, 14.1, 18.7, 14.5],
  dtp02: [23.0, 19.9, 19.1, 14.5],
  dtp03: [21.1, 9.1, 21.1, 8.7],
  dtp04: [22.4, 6.9, 21.3, 6.9],
  dtp05: [25.6, 13.7, 21.7, 10.6],

  // 📔 일기 메모지 12 — 이미 앱에 있던 것(데코 탭에 흩어져 있었다)
  dgn01: [16.4, 15.8, 16.0, 26.0],   // ⛔ 손으로 — 왼쪽 위 해를 덮었다(실물 판에서 눈으로 잡았다)
  dgn02: [28.0, 15.2, 15.5, 14.8],   // ⛔ 손으로 — 위쪽 마테를 덮었다
  dgn03: [15.8, 17.4, 17.0, 16.1],
  dgn04: [22.4, 25.6, 30.5, 27.2],
  dgn05: [26.0, 20.9, 22.2, 13.2],   // ⛔ 손으로 — 왼쪽 위 하트를 덮었다
  dgn06: [30.0, 16.4, 14.8, 14.1],   // ⛔ 손으로 — 위쪽 집게를 덮었다
  dgn07: [21.6, 16.3, 20.5, 17.0],
  dgn08: [16.4, 14.5, 17.3, 14.9],
  dgn09: [16.9, 15.0, 18.2, 14.2],
  dgn10: [30.0, 25.8, 30.9, 25.8],
  dgn11: [27.8, 22.0, 27.8, 24.7],
  dgn12: [18.7, 12.4, 15.9, 30.0],   // ⛔ 손으로 — 왼쪽 위 리본을 덮었다

  // 📝 메모·라벨 (`dc_dma`) — 이것도 이미 앱에 있던 것
  dc_dma01: [22.8, 18.5, 15.5, 20.9],
  dc_dma05: [34.0, 26.3, 21.0, 36.7], // ⛔ 손으로 — 위쪽 마테를 덮었다
  dc_dma11: [26.7, 19.0, 25.5, 19.0],
  dc_dma07: [30.4, 32.1, 35.8, 25.2],
  dc_dma14: [34.8, 31.5, 32.0, 27.6],
  dc_dma13: [33.3, 22.4, 28.5, 41.7],
  dc_dma06: [32.4, 30.9, 30.7, 31.3],

  // 🖼 글쓰기 프레임 — 안이 흰 판이라 원래 글 얹기용
  //   ⛔⛔ **프레임은 이 도구로 못 잰다** — 가운데가 «뚫려»(투명) 있으면 알파로는 「테두리만 채워짐」이 된다.
  //      `pf_f06`(클립보드)이 그랬다 — 잰 값이 아래 85.7% 라 초록 네모가 **맨 위 얇은 띠**에 앉았다.
  //      나머지 일곱은 안이 «흰 판»이라 제대로 나왔다. 📌 같은 그룹이라고 같은 성질이 아니다(v9.07 교훈).
  pf_a07: [18.8, 15.2, 10.4, 15.2],
  pf_f06: [17.0, 12.0, 14.0, 10.0],   // ⛔ 손으로 — 가운데가 뚫려 있어 자동 측정이 통째로 빗나갔다
  pf_i06: [20.5, 15.2, 13.2, 15.6],
  pf_a05: [14.7, 17.4, 14.7, 17.4],
  pf_a06: [11.1, 15.0, 10.7, 15.0],
  pf_a08: [13.1, 15.0, 12.3, 15.0],
  pf_i07: [15.6, 17.0, 15.2, 17.0],
  pf_f08: [11.4, 14.8, 11.4, 14.8],

  // 🗣 말풍선 · 판 (2026-08-09) — 프레임 탭에서 옮겨 온 셋
  //   ⛔ 자동 측정값을 그대로 안 썼다 — `fn_speech` 는 **꼬리가 아래에 붙어 있어** 잰 자리가
  //      말풍선 «몸통»보다 아래로 밀렸다(위 35.1 / 아래 30.2 = 위가 더 넓은데 아래가 좁게 나왔다).
  //      실제 글을 얹어 보고 위로 올렸다. ⭐ 꼬리 달린 것은 자동 측정이 늘 아래로 쏠린다.
  //   ⛔ `fn_daisy`·`fn_night` 는 **여기 넣지 않는다** — `BOX_PAD` 에 키가 있으면 `addSticker` 가
  //      어느 탭에서 붙여도 글 상자로 보낸다(v9.99). 가운데에 꽃·달이 있어 글이 그 위에 앉는다.
  fn_speech: [26.0, 24.0, 34.0, 24.0],
  fn_bow: [36.1, 31.7, 31.1, 33.8],     // ⭐ 위 36% = 리본 꼬리를 피한 값이다. 더 올리면 리본에 글이 걸린다
  fn_gingham: [18.1, 17.6, 17.6, 18.0],
}

// 📎📎 **포스트잇 색 6 → 12** (창업자 2026-08-07 *"포스트잇도 색 좀 늘리고 뮤트톤으로 잡던가.."*)
//
// ⭐⭐ 재보고 알았다 — **「별로」의 정체는 «색이 적은 것»이 아니었다.**
//   ⓐ **채도 37.8% = 우리 스티커 색(37.9%)과 이미 같다.** 톤은 안 건드려도 됐다.
//   ⓑ ⛔ **밝기가 여섯 다 85~89% 한 덩어리** — 속지(아이보리 87%)와 «구분이 안 된다».
//      종이 위에 놓아도 안 뜨니 밋밋해 보인다. **이게 제일 컸다.**
//   ⓒ ⛔ **색상(hue)이 몰려 있다** — 18°·38°·42° 셋이 웜톤 안에 겹쳐 **사실상 4색**.
//      게다가 82°~210° **128° 가 통째로 비어** 청록이 아예 없다.
//   📌 눈으로 「별로다」만 보고 색을 더 넣었으면 **몰린 데 더 몰렸을 것**이다.
//
// ✅ 그래서 = **밝은 여섯 ＋ «진한» 여섯.** 채도는 그대로 두고 **밝기를 벌리고 빈 색상을 채웠다.**
//   · 밝은 줄(85~89%) = 종이에 은은히 얹히는 것 — 기존 여섯 그대로(이미 쓴 표지가 안 바뀐다)
//   · 진한 줄(76~80%) = **종이 위에서 또렷하게 뜨는 것** — 없던 자리다
//   · 새로 채운 색상 = 청록 172° · 올리브 68° · 모카 28° · 더스티로즈 348°
// ⚠️ 기존 여섯의 key·색을 **하나도 안 바꿨다** — 이미 그 색으로 꾸며 저장한 표지가 깨지면 안 된다.
// ⚠️ 진한 줄은 글자색(`text`)을 더 진하게 준다 — 안 그러면 바탕에 묻힌다.
export const NOTE_COLORS = [
  // ── 밝은 여섯 (그대로) ──
  { key: 'butter', bg: '#f0e8d5', fold: '#ddceb0', text: '#5f5647', line: '#cdbd97' }, // 크림(웜)
  { key: 'rose', bg: '#f1dcd3', fold: '#ddc2b7', text: '#6a5350', line: '#d0afa5' },   // 피치
  { key: 'sage', bg: '#dde5cf', fold: '#c8d3b4', text: '#4f5a44', line: '#b0bf97' },   // 세이지
  { key: 'sky', bg: '#d9e2eb', fold: '#c2cfdb', text: '#47545f', line: '#acbdcf' },    // 하늘
  { key: 'lavender', bg: '#e5dcea', fold: '#d1c6da', text: '#574f60', line: '#bbafc8' }, // 라벤더
  { key: 'clay', bg: '#e9ddc9', fold: '#d5c5a9', text: '#5f5343', line: '#c8b48f' },   // 클레이(웜뉴트럴)
  // ── 진한 여섯 (신규 · 종이 위에서 «뜬다») ──
  { key: 'mint', bg: '#bfd8d2', fold: '#a5c2bb', text: '#334742', line: '#8fb0a8' },   // 민트 172° — 비어 있던 자리
  { key: 'olive', bg: '#cdd2b2', fold: '#b5bb96', text: '#454a33', line: '#a3aa83' },  // 올리브 68°
  { key: 'mocha', bg: '#d9c7ac', fold: '#c2ad8e', text: '#4f4433', line: '#b09a78' },  // 모카 28° — 크라프트 느낌
  { key: 'dusty', bg: '#dfc2c4', fold: '#c9a6a9', text: '#523c3f', line: '#bd9497' },  // 더스티 로즈 348°
  { key: 'denim', bg: '#bcccdb', fold: '#a2b5c6', text: '#37454f', line: '#8fa5b7' },  // 데님 205°
  { key: 'grape', bg: '#cdc2d9', fold: '#b4a7c3', text: '#443b52', line: '#a496b6' },  // 그레이프 268°
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

// 📏📏 **글자 크기** — 「글 상자」와 「글자 스티커」 공통 (창업자 2026-08-12)
//   📮 *"글에 비해 글자상자가 너무 작아(스티커-돌밥돌밥쓴거) **스티커를 줄이면 글자가 너무 작아져**"* ·
//      *"일꾸 글자는 크기 조절이 없어"* · *"레꾸도 마찬가지.. 글자크기조절되는거 넣어야 할 듯"*
//   ⛔⛔ **없던 게 맞다** — 컨텍스트바 갈래가 글자 스티커는 「색·굵기·글씨」, 글 상자는 「색·글씨」뿐이었다.
//      글자 크기를 바꾸는 유일한 길이 **상자 크기(손잡이)** 라, 글 상자에선 **그림까지 같이 커졌다.**
//      창업자 말이 정확하다 — 「스티커를 줄이면 글자가 너무 작아진다」가 그 구조 그대로다.
//   ⭐ 그래서 **상자와 글자를 갈랐다**:
//      · 글 상자(`note`) = 상자는 그대로 두고 **글자만** 이 배율로 (`it.tz`)
//      · 글자 스티커(`text`) = 상자가 글자에 맞춰지므로 결과적으로 둘 다 커진다(같은 뜻)
//   ⚠️ 값은 「한 단계가 눈에 보이되 확 튀지 않게」 — 1.28 은 보통 대비 한눈에 크고, 1.6 은 제목용이다.
//   ⚠️ 빈 값(`undefined`)이 **보통**이다 — 이미 쓴 일기·표지가 한 글자도 안 바뀐다.
export const TEXT_SIZES = [
  { key: 'sm', label: '작게', v: 0.82 },
  { key: 'md', label: '보통', v: 1 },
  { key: 'lg', label: '크게', v: 1.28 },
  // ⚠️⚠️ 키를 「엑스엘」로 뒀다가 **유료팩 게이트에 걸려 배포가 막혔다**(2026-08-12).
  //   `paidPacks.js` 의 **겨울 팩 접두어에 그 두 글자가 실제로 있다** — 우연히 같은 이름을 지은 것이다.
  //   ⛔ 게다가 고친 뒤에도 계속 걸렸는데, 이번엔 **내가 쓴 이 주석 안의 따옴표 낱말**이 범인이었다.
  //      `check-packmix.mjs` 는 소스에서 «따옴표 낱말»을 전부 키로 보고, 주석도 소스다.
  //   📌 새 상수 키를 지을 땐 **팩 접두어(x·au·ci·hw…)로 시작하지 말 것** ＋
  //      **주석에도 그 키를 따옴표로 쓰지 말 것.**
  { key: 'hg', label: '아주 크게', v: 1.6 },
]
export const textSizeV = (k) => (TEXT_SIZES.find((t) => t.key === k) || TEXT_SIZES[1]).v

// 글자 스티커 글씨체 — 또박체(고운돋움) / 귀염체(개구체). 오프라인이면 다음 폰트로 자연 대체.
// ✏️ 글씨체 — `bw` = **굵기 보정.** 창업자 2026-07-30 *"글씨체자체가 두꺼운 애들도 있는데
//   얇은 애들도 있어서 안맞아서 더 그런 듯"* → **맞는 진단.** 임팩트는 원래 아주 굵고 펜글씨는
//   아주 얇아서, 같은 외곽선 두께를 주면 하나는 뭉치고 하나는 사라진다.
//   → 글씨체마다 기준 두께를 달리 줘서 **'보통'일 때 다 비슷하게 보이도록** 맞춘다.
//   `ls` = 자간 보정(비워두면 기본).
export const TEXT_FONTS = [
  // `fw` = **굵기(살)** 보정 · `ls` = 자간 · `sz` = **크기 보정**
  // 📏📏 `sz` — 같은 크기로 놓아도 글씨체마다 «보이는 크기»가 다르다 (창업자 2026-08-07
  //   *"글씨크기를 다 비슷하게 조정해서 보통으로 두고 작게 보통 크게로 올려줄수는 없어?"*)
  //   ⭐ **눈대중이 아니라 재서** 넣었다 — `scripts/_measure-글씨크기.mjs` 가 캔버스에 그려
  //      «잉크가 실제로 차지하는 높이»를 잰다(글꼴이 «선언한» 값이 아니라 그려진 픽셀).
  //      실측: 또박체 0.975 ~ 납작체 0.650 — **1.5배 차이**다. 그래서 납작체가 작아 보였다.
  //   ⭐ 기준 = 귀염체(=1.00). 지금까지 본문이 쓰던 글씨체라 **지금 모습이 안 바뀐다.**
  //   ⚠️ 0.8~1.35 로 묶는다 — 납작체는 잰 값이 1.42 라 묶였다(다 맞추면 그 글씨체가 안 납작해진다).
  //   📌 **본문에만 쓴다.** 글자 스티커는 손잡이로 키우니 보정이 필요 없다.
  // ⚠️ `bw` 는 **아무도 안 읽는다** — 옛 시도의 흔적이다(`TextDeco` 는 `fw`·`ls` 만 쓴다).
  //    지우면 저장된 값과 무관하니 안전하지만, 새 줄엔 «넣지 말 것».
  // ⚠️⚠️ 처음엔 둘을 **하나(`bw`)로 같이** 썼다가 사고가 났다 — 창업자 *"굵게하면 저 글씨체만 이상하고"*.
  //   펜글씨는 얇아서 `bw`를 2로 줬는데 그 값이 살에도 곱해져 **획이 서로 붙어 초록 덩어리**가 됐다.
  //   → **얇다고 살을 많이 붙이면 안 된다.** 획 간격이 좁은 글씨(펜글씨)는 오히려 **적게** 붙여야 한다.
  // 🔤🔤 **귀여운 글씨체 여섯을 더했다 → 열둘** — 후보 14개를 실물로 찍어 창업자가 «번호로» 골랐다
  //   (2026-08-07 *"귀여운글씨체 예쁜걸로 추가하자"* · *"더많았음좋겠어"* → *"1.2.3.4.7.8. 넣어줘"*)
  //   ⭐ 고른 기준 = **우리에 없는 톤.** 붓글씨·아주 굵은 제목·명조·고딕은 지금 여섯과 겹쳐 뺐다.
  //   ✒️ `fw`(살) 는 **눈으로** 정했다 — `scripts/_shot-글씨굵기.mjs` 로 얇게·보통·굵게를 나란히 찍어 견줬다.
  //      ⛔⛔ 숫자로 세 번 시도했고 세 번 다 «엉뚱한 걸» 쟀다(그 기록은 그 스크립트 맨 위에).
  //         우리 규칙이 맞았다 — **숫자는 「어디를 볼지」만 정하고 「맞나 틀리나」는 눈이 정한다**(v9.16).
  //      📌 첫 시안(0.6~0.85)은 **굵게가 굵어 보이지 않았다** — 새 여섯이 다 얇은 글씨라 살을 아끼니
  //         「보통」과 구분이 안 갔다. 올려도 획이 뭉치는 건 없어서 0.8~1 로 확정.
  //
  // 🧭🧭 **순서 = 「손글씨」 먼저, 「또렷한 글씨」 나중** (창업자 2026-08-07 *"안빼면 어떻게 할수있어?"*)
  //   ⛔ 창업자가 겹치는 걸 «빼자» 했다가 되돌렸다(*"펜글씨빼지말자 ㅋ"* — 일기엔 펜글씨가 예쁘다).
  //      **빼는 게 답이 아니었다** — 빼면 그 글씨체로 이미 쓴 일기 글자가 다른 글씨로 바뀐다
  //      (스티커를 서랍에서 내릴 때 파일·비율을 남기는 것과 같은 이유).
  //   ⭐ 대신 **순서**로 푼다. 꾸미기 바의 「글씨」 줄은 **가로 한 줄 스크롤**이라 뒤쪽은 안 보인다
  //      → 비슷한 것끼리 붙여 두면 밀면서 고르기가 쉽다. 아무것도 안 뺐고 되돌리기도 쉽다.
  //   ⚠️⚠️ **`gaegu` 를 맨 앞에서 옮기지 말 것** — 모르는 값이 오면 `TEXT_FONTS[0]` 으로 떨어지고,
  //      포스트잇 기본값도 `'gaegu'` 다. 자리를 바꾸면 «옛 글자가 딴 글씨로» 바뀐다.
  //
  // ── ✍️ 손글씨(직접 쓴 느낌) ──
  { key: 'gaegu', label: '귀염체', family: "'Gaegu','Gowun Dodum','Pretendard',sans-serif", weight: 700, bw: 0.9, fw: 0.85, sz: 1 },
  { key: 'gamja', label: '삐뚤체', family: "'Gamja Flower','Gowun Dodum','Pretendard',sans-serif", weight: 400, fw: 0.9, sz: 1.08 },
  { key: 'poorstory', label: '연필체', family: "'Poor Story','Gowun Dodum','Pretendard',sans-serif", weight: 400, fw: 0.9, sz: 1.02 },
  // ⚠️ 얇고 흘리는 글씨(몽글체·가는체)는 `ls` 를 조금 준다 — 굵게 하면 옆 글자와 닿는다(펜글씨 0.1em 과 같은 이유)
  { key: 'himelody', label: '몽글체', family: "'Hi Melody','Gowun Dodum','Pretendard',sans-serif", weight: 400, fw: 0.8, ls: '0.04em', sz: 1.13 },
  { key: 'singleday', label: '가는체', family: "'Single Day','Gowun Dodum','Pretendard',sans-serif", weight: 400, fw: 0.9, ls: '0.02em', sz: 1.04 },
  // ⚠️ 펜글씨 = 획이 제일 얇고 글자끼리 붙는다 → **살은 얇게**(fw), 자간은 넓게
  { key: 'nanumpen', label: '펜글씨', family: "'Nanum Pen Script','Gowun Dodum','Pretendard',sans-serif", weight: 400, bw: 2, fw: 0.5, ls: '0.1em', sz: 1.12 },
  // ── 🔠 또렷한 글씨(활자) ──
  { key: 'jua', label: '통통체', family: "'Jua','Gowun Dodum','Pretendard',sans-serif", weight: 400, bw: 0.9, fw: 0.8, sz: 1.07 },
  { key: 'cutefont', label: '동글체', family: "'Cute Font','Gowun Dodum','Pretendard',sans-serif", weight: 400, fw: 0.9, ls: '0.02em', sz: 1.21 },
  // ⚠️ 납작체(Dongle)는 **글자 자체가 납작해서** 같은 크기로 놓으면 다른 글씨체보다 작아 보인다.
  //    글씨체 성격이라 그대로 둔다 — 크게 쓰고 싶으면 손잡이로 키우면 된다.
  { key: 'dongle', label: '납작체', family: "'Dongle','Gowun Dodum','Pretendard',sans-serif", weight: 400, fw: 1, sz: 1.35 },
  { key: 'dohyeon', label: '라운드', family: "'Do Hyeon','Pretendard',sans-serif", weight: 400, bw: 1.1, fw: 0.9, sz: 1.17 },
  { key: 'gowun', label: '또박체', family: "'Gowun Dodum','Pretendard',sans-serif", weight: 800, bw: 1.5, fw: 1, ls: '0.01em', sz: 0.94 },
  { key: 'blackhan', label: '임팩트', family: "'Black Han Sans','Pretendard',sans-serif", weight: 400, bw: 0.55, fw: 0.45, sz: 1.18 },
]

// 🏷🏷 **고르는 칸에 쓸 «아주 작은» 벌** — 이름 몇 글자만 든 글꼴로 이름표를 그린다.
//   ⛔⛔ 왜 = 칸은 이름을 «그 글씨체로» 보여준다 → 「글자」 탭을 여는 순간 **열두 벌을 다 받았다.
//      실측 4.45MB**(`scripts/_measure-글씨무게.mjs`). 아직 그 글씨로 아무것도 안 썼는데.
//      창업자가 *"무거워진다며 또 다른 버그생기는거 아냐?"* 라고 물어 **재 보고** 찾았다.
//   ⭐ 칩 벌 12개 합쳐 **80KB.** 진짜 글씨체는 «그 글씨로 글자를 놓을 때» 받는다.
//   ⭐ 이름을 «계산»한다 — 줄마다 손으로 적으면 하나 빠뜨려도 아무도 모른다(그럼 그 칸만 4.45MB 를 부른다).
//   ⚠️ 뒤에 원래 글꼴을 남겨 둔다 — 칩에 없는 글자가 오면 «틀린 글씨»가 아니라 원래 글씨로 나온다.
//      (그 대신 그 순간 큰 파일을 받는다 → `scripts/check-fontchip.mjs` 가 미리 잡는다)
export const chipFamily = (f) => {
  const first = (f.family.match(/^'([^']+)'/) || [])[1]
  return first ? `'${first} Chip',${f.family}` : f.family
}

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
  // ⛔ **모눈·도트·스트라이프는 피커에서 뺐다** (창업자 2026-07-30:
  //    *"색·그라데이션 이거 넣으려면 우리 기본배경에 있는거 빼야해. 지금 레꾸에 있는 모눈 도트
  //      스프라이트 다 겹쳐. 기본배경에는 색깔만 있는 배경 줘야할 듯"*)
  //    왜 = **마스킹테이프에 이미 모눈·도트·스트라이프가 있다.** 배경에도 있으면 표지가 무늬 천지가 된다.
  //    → 기본 배경은 **단색만.** 무늬 배경은 **종이 질감 팩**으로 돌린다(창업자 확정: "b가 좋아").
  //    ⭐ 단 **모눈은 예외로 무료**다 — 이건 장식이 아니라 **「노트」**이기 때문.
  //       우리는 레시피를 **적는** 앱이라 모눈종이는 기본 도구에 가깝다. 이걸 팔면 쪼잔해 보인다.
  //    📌 기준: **무료로 줄지는 「아까운가」가 아니라 「없으면 앱을 못 쓰나」로 정한다.**
  //       모눈 = 없으면 노트 느낌이 안 남 → 준다 / 도트·스트라이프 = 없어도 됨 → 판다
  //    📌 그리고 **무료가 초라하면 유료도 안 팔린다.** 단색만 14개면 "다 그냥 색이네"가 되고,
  //       그 인상이면 팩을 살 마음이 안 생긴다. 모눈 한 장이 그 인상을 바꾼다.
  //    ⚠️ `hidden: true` 는 **피커에서만 안 보이게** 하는 것이다. `bgStyle()` 은 그대로 찾아 주므로
  //       **이 배경으로 이미 저장한 표지는 계속 정상으로 보인다**(한 번 준 것은 빼앗지 않는다).
  {
    key: 'grid', label: '모눈',
    style: {
      backgroundColor: '#f4efe4',
      backgroundImage: 'linear-gradient(#dcd3c0 1px, transparent 1px), linear-gradient(90deg, #dcd3c0 1px, transparent 1px)',
      backgroundSize: '16.66% 16.66%',
    },
  },
  {
    key: 'dot', label: '도트', pack: 'bgpaper', hidden: true,
    style: {
      backgroundColor: '#f5ece0',
      // 도트 작게 + circle 로 동그랗게(비정사각 셀에서도 타원 안 되게)
      backgroundImage: 'radial-gradient(circle, #dcc9a9 26%, transparent 28%)',
      backgroundSize: '9% 9%',
    },
  },
  {
    key: 'stripe', label: '스트라이프', pack: 'bgpaper', hidden: true,
    style: {
      backgroundColor: '#f4ede0',
      backgroundImage: 'repeating-linear-gradient(45deg, #eadfca 0, #eadfca 6%, transparent 6%, transparent 12%)',
    },
  },
  // 🎨 그라데이션 = **유료 배경 팩 재고**라 기본에 안 넣는다.
  //    창업자 2026-07-30: *"유료 배경효과에 그라 넣으려면 우리 기본으로 준 노을, 세이지 빼야한단 뜻이야"*
  //    ⭐ **팔 것을 먼저 공짜로 주면 안 된다.** 이미 준 걸 나중에 회수하는 건 더 안 되니까,
  //       **정식 출시 전인 지금이 정리할 마지막 타이밍**이다(출시 후엔 못 뺀다).
  //    → 코드·CSS 는 만들어 두고 `pack: 'bg'` 로 잠가 둔다.
  // 📌 **2026-08-05 확인 — 뺀 이유가 «둘 다»다** (창업자 *"두개다야. 설명하기 길다"*)
  //    ⑴ **기본과 비슷해서** — 창업자 *"저거는 비슷해서 뺀거였어."*
  //    ⑵ **유료 재고로 두려고** — 위 7/30 원문 그대로
  //    ⭐ 그리고 **나중에 재고로 쓴다** — 창업자 *"저것도 나중에 재고로 활용하자."*
  //       ⚠️ 배경 «단독 팩»은 7/31 에 접혔다(*"나는 안팔릴거 같애 ㅋㅋ"* · 배경은 팩의 부속).
  //         그러니 이 다섯은 **어느 계절 팩엔가 딸려 나갈 재고**로 본다. 팩이 정해지면 `pack` 을 그 팩으로 바꾼다.
  //    ⛔ 지금은 `hidden: true` 라 피커에 안 나오고, `pack: 'bg'` 는 «자리표시»다.
  //    ⛔ 지우지 않는다 — 이걸로 저장한 표지가 그대로 보여야 한다.
  // ✅ 그라데이션 중 **하나만 무료**(창업자 2026-07-30 *"모눈이랑 그라 한개는 주자"*).
  //    웜크림을 고른 이유 = **제일 중립적**이라 어떤 스티커를 얹어도 안 싸우고,
  //    눈에 띄는 것들(파스텔·노을·민트·세이지)은 **팔 것으로 남겨야** 하기 때문.
  { key: 'gwarm', label: '웜크림',
    style: { background: 'linear-gradient(160deg, #fcf2e3 0%, #f2e0cb 100%)' } },
  { key: 'gmint', label: '민트', pack: 'bg', hidden: true,
    style: { background: 'linear-gradient(150deg, #e6f5f0 0%, #cbe7ee 100%)' } },
  { key: 'grainbow', label: '파스텔', pack: 'bg', hidden: true,
    style: { background: 'linear-gradient(135deg, #fde3e6 0%, #fdf0d9 28%, #ddf0e4 56%, #dde7f5 80%, #e9dff3 100%)' } },
  // ⛔ **노을·세이지도 기본에서 뺀다** — 이 둘이 그라데이션이라서다.
  //    창업자 2026-07-30: *"유료 배경효과에 그라 넣으려면 우리 기본으로 준 노을, 세이지 빼야한단 뜻이야"*
  //    ⭐ 기본 배경 = **단색만.** 그라데이션·질감·빛·계절은 전부 유료 배경 팩 몫이다.
  //    ⚠️ 지우는 게 아니라 **숨김**이라 이걸로 저장한 표지는 그대로 보인다.
  //       (그리고 이건 **정식 출시 전이라 가능한 정리**다 — 출시 후엔 쓰던 사람이 생겨서 못 뺀다)
  { key: 'sunset', label: '노을', pack: 'bg', hidden: true,
    style: { background: 'linear-gradient(160deg, #f7e2d3 0%, #f0d5da 55%, #e6d3ea 100%)' } },
  { key: 'sage', label: '세이지', pack: 'bg', hidden: true,
    style: { background: 'linear-gradient(160deg, #dfe9d8 0%, #d1e0d5 50%, #dae5e4 100%)' } },
  // 🍃 조금 진한 뮤트(중간톤·다크 아님) — 곰(웜)·펭(쿨) 둘 다 맞는 뉴트럴/브릿지 우선 + 웜·쿨 포인트 하나씩. (창업자 요청 2026-07-23, 클로드 셀렉)
  { key: 'msage', label: '딥세이지', style: { background: '#9aab9c' } },   // 그린 브릿지 — 둘 다 최고
  { key: 'mtaupe', label: '웜토프', style: { background: '#b5a695' } },    // 웜뉴트럴 브릿지 — 둘 다 부드럽게
  { key: 'mclay', label: '클레이', style: { background: '#c2a288' } },     // 웜 포인트 — 곰 감싸고 펭 톡
  { key: 'mrose', label: '더스티로즈', style: { background: '#c6a5a9' } }, // 로즈 — 둘 다 OK
  { key: 'mlav', label: '라벤더', style: { background: '#aca4bb' } },      // 퍼플 — 둘 다 OK
  { key: 'mblue', label: '스모키블루', style: { background: '#a2b0bc' } }, // 쿨 포인트 — 펭 톡 곰 대비
  // 🌊 **여름 물결 — 출시기념 선물** (창업자 2026-07-31 · 색 B「아쿠아」 · 움직임 켬)
  //   ⭐ 배경은 **팩을 완성시킨다** — 스티커만 주는 것보다 표지가 통째로 여름이 된다
  //      (`docs/모션-효과-설계.md` 배경 절: *"지금(출시) = 무료 배경 + 출시기념 여름 물결 1종"*).
  //   ⚠️ **물결은 한 겹이면 벽지가 된다** (창업자 *"물결이 너무 일차원적이야"*).
  //      → ⒜타일 하나에 이미 물결 여러 줄(진폭·굵기·위상·투명도 전부 다르게)
  //        ⒝**세 겹**(뒤 작고 연함 / 앞 크고 진함) ⒞겹마다 흐르는 속도가 달라 **앞뒤 깊이**가 생긴다
  //   🎨 **색은 여름 꾸미기가 사는 쪽으로** (창업자 *"우리 여름 꾸미기가 잘보이는 색이어야해. 촌스럽지 않은"*).
  //      실제로 곰펭·소품·마테를 얹어 여섯 색을 비교했다. 아쿠아가 이긴 이유 =
  //      ⓐ꼬르곰이 **웜 갈색**이라 **쿨톤 위에서 제일 뜬다** ⓑ위가 밝아 **흰 스티커**(아이스크림·구름·돛)도 안 묻힌다
  //      ⓒ채도가 낮아 안 촌스럽다. ⛔모래·크림 계열은 **곰이 배경에 붙어서** 탈락했다.
  { key: 'sea', label: '여름 물결', anim: 'hk-bg-wave',
    style: {
      backgroundImage: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27420%27%20height%3D%27150%27%20viewBox%3D%270%200%20420%20150%27%3E%3Cpath%20d%3D%27M-420%2034%20Q-255.0%2025%20-150.0%2034%20T60%2034%20Q165.0%2025%20270.0%2034%20T480%2034%20Q585.0%2025%20690.0%2034%20T900%2034%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.30%29%27%20stroke-width%3D%272.9%27%20stroke-linecap%3D%27round%27%2F%3E%3Cpath%20d%3D%27M-420%2078%20Q-135.0%2065%20-30.0%2078%20T180%2078%20Q285.0%2065%20390.0%2078%20T600%2078%20Q705.0%2065%20810.0%2078%20T1020%2078%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.35%29%27%20stroke-width%3D%273.3%27%20stroke-linecap%3D%27round%27%2F%3E%3Cpath%20d%3D%27M-420%20122%20Q-15.0%20112%2090.0%20122%20T300%20122%20Q405.0%20112%20510.0%20122%20T720%20122%20Q825.0%20112%20930.0%20122%20T1140%20122%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.27%29%27%20stroke-width%3D%272.7%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E"),url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27560%27%20height%3D%27210%27%20viewBox%3D%270%200%20560%20210%27%3E%3Cpath%20d%3D%27M-560%2048%20Q-330.0%2028%20-190.0%2048%20T90%2048%20Q230.0%2028%20370.0%2048%20T650%2048%20Q790.0%2028%20930.0%2048%20T1210%2048%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.56%29%27%20stroke-width%3D%274.6%27%20stroke-linecap%3D%27round%27%2F%3E%3Cpath%20d%3D%27M-560%20112%20Q-160.0%2086%20-20.0%20112%20T260%20112%20Q400.0%2086%20540.0%20112%20T820%20112%20Q960.0%2086%201100.0%20112%20T1380%20112%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.47%29%27%20stroke-width%3D%275.0%27%20stroke-linecap%3D%27round%27%2F%3E%3Cpath%20d%3D%27M-560%20176%20Q-410.0%20154%20-270.0%20176%20T10%20176%20Q150.0%20154%20290.0%20176%20T570%20176%20Q710.0%20154%20850.0%20176%20T1130%20176%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.40%29%27%20stroke-width%3D%277.6%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E"),url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27760%27%20height%3D%27300%27%20viewBox%3D%270%200%20760%20300%27%3E%3Cpath%20d%3D%27M-760%2070%20Q-570.0%2036%20-380.0%2070%20T0%2070%20Q190.0%2036%20380.0%2070%20T760%2070%20Q950.0%2036%201140.0%2070%20T1520%2070%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.56%29%27%20stroke-width%3D%276.6%27%20stroke-linecap%3D%27round%27%2F%3E%3Cpath%20d%3D%27M-760%20160%20Q-250.0%20114%20-60.0%20160%20T320%20160%20Q510.0%20114%20700.0%20160%20T1080%20160%20Q1270.0%20114%201460.0%20160%20T1840%20160%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.62%29%27%20stroke-width%3D%277.6%27%20stroke-linecap%3D%27round%27%2F%3E%3Cpath%20d%3D%27M-760%20250%20Q-410.0%20212%20-220.0%20250%20T160%20250%20Q350.0%20212%20540.0%20250%20T920%20250%20Q1110.0%20212%201300.0%20250%20T1680%20250%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.54%29%27%20stroke-width%3D%276.2%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E"),linear-gradient(180deg,#d4e5e4 0%,#8fb2b3 100%)',
      backgroundSize: '26% auto,38% auto,55% auto,cover',
      backgroundRepeat: 'repeat,repeat,repeat,no-repeat',
    },
    // 🔎 **피커 스와치(42px)용 덮어쓰기.** 표지에선 타일이 281px인데 42px 스와치에선 11px이 된다
    //   → 물결이 **잔털처럼** 뭉쳐 「이게 물결인지」 안 읽힌다. 스와치에서만 타일을 키워 **선이 3~4가닥**만 보이게.
    //   ⚠️ 이 크기에선 한 바퀴가 이음매 없이 안 맞지만, 42px에선 그 어긋남이 안 보인다.
    swatch: { backgroundSize: '150% auto,220% auto,320% auto,cover' } },
  // 🌧 **비 오는 창 — 가을 유료팩 배경** (창업자 그림 · 2026-08-05 창업자가 ①번으로 확정)
  //   ⭐ 우리 배경 중 **첫 사진 배경**이다. 나머지는 전부 CSS(그라데이션·SVG)다.
  //      표지가 1:1 이라 **미리 1:1 로 잘라** 넣었다 — `cover` 로 맡기면 기기마다 다르게 잘린다.
  //   🌧 창업자 *"비내리는 효과 넣어줘"* → 사진 위에 **빗줄기 두 겹**을 얹어 흘린다.
  //   ⚠️⚠️ **이동은 «세로만»** 한다. 가로로도 옮기려면 타일 폭의 정수배를 맞춰야 하는데
  //      그러면 비가 너무 눕는다 → **선 자체를 기울여 그리고 아래로만** 흘린다.
  //   ⚠️ 세로는 **px** 로 준다 — %는 「컨테이너 − 타일」 기준이라 타일 높이가 auto 면 계산이 안 선다
  //      (여름 물결에서 *"물결은 안움직여"* 사고가 정확히 이것이었다).
  //   ⭐ 뒤는 한 주기에 1타일(180px), 앞은 2타일(520px) → **같은 시간에 다른 거리 = 앞뒤 깊이.**
  { key: 'rainstreet', label: '비 오는 창', anim: 'hk-bg-rain', pack: 'autumn2026',
    style: {
      backgroundImage: 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27140%27%20height%3D%27180%27%20viewBox%3D%270%200%20140%20180%27%3E%3Cpath%20d%3D%27M45%2023%20l-4%2026%20M91%2011%20l-4%2026%20M75%2056%20l-4%2026%20M8%2078%20l-4%2026%20M5%2067%20l-4%2026%20M10%2014%20l-4%2026%20M59%20127%20l-4%2026%20M17%2034%20l-4%2026%20M88%20146%20l-4%2026%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.2%29%27%20stroke-width%3D%271.1%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E"),url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27200%27%20height%3D%27260%27%20viewBox%3D%270%200%20200%20260%27%3E%3Cpath%20d%3D%27M52%20151%20l-7%2040%20M137%20187%20l-7%2040%20M37%2051%20l-7%2040%20M29%2050%20l-7%2040%20M147%2029%20l-7%2040%20M106%2047%20l-7%2040%20M59%2095%20l-7%2040%27%20fill%3D%27none%27%20stroke%3D%27rgba%28255%2C255%2C255%2C0.34%29%27%20stroke-width%3D%271.7%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E"),url(' + RAIN_STREET + ')',
      backgroundSize: '140px 180px,200px 260px,cover',
      backgroundRepeat: 'repeat,repeat,no-repeat',
      backgroundPosition: '0 0,0 0,center',
    },
    // 🔎 42px 스와치에선 빗줄기가 «먼지»로 뭉친다 → 타일을 키워 몇 가닥만 보이게
    swatch: { backgroundSize: '70px 90px,100px 130px,cover' } },

  // 🌙 딥(어두운) 배경지 — 반짝임·홀로·별이 사는 "밤하늘 다꾸" (창업자 픽: 딥플럼·미드나잇)
  { key: 'plum', label: '딥플럼', dark: true, style: { background: '#3e3442' } },
  { key: 'midnight', label: '미드나잇', dark: true, style: { background: '#2d3340' } },
]

export const bgStyle = (key) => (DECOR_BACKGROUNDS.find((b) => b.key === key) || DECOR_BACKGROUNDS[0]).style
// 딥(어두운) 배경지 여부 — 표지 글자·아이콘을 밝게 자동전환할 때 쓴다.
// 배경에 붙는 움직임 클래스(없으면 빈 문자열). ⚠️`hk-` 접두어라 「움직임 끄기」에 같이 걸린다.
export const bgAnim = (key) => DECOR_BACKGROUNDS.find((b) => b.key === key)?.anim || ''
export const bgIsDark = (key) => !!DECOR_BACKGROUNDS.find((b) => b.key === key)?.dark

// ── 마스킹테이프(마테) ──
// 다꾸 시그니처. 반투명 종이 띠 + 패턴. 길이·각도 자유(무한 변형).
// item: { type:'tape', key(패턴), x, y, s(폭), r } — 폭:높이 ≈ 3.4:1 스트립.
export const TAPE_PATTERNS = [
  { key: 'kraft', label: '크라프트', style: { background: 'rgba(214,197,168,0.92)' } },
  {
    key: 'stripe', label: '스트라이프', pack: 'bgpaper', hidden: true,
    style: { backgroundColor: 'rgba(240,224,205,0.92)', backgroundImage: 'repeating-linear-gradient(45deg, rgba(200,120,95,.4) 0, rgba(200,120,95,.4) 7%, transparent 7%, transparent 14%)' },
  },
  {
    // 도트 — %폭×%높이(radial)는 3.4:1 띠에서 타원으로 늘어남 → SVG 원 + auto높이로 항상 동그랗게
    key: 'dot', label: '도트', pack: 'bgpaper', hidden: true,
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

// 🖍🖍 **형광펜** — 다꾸에서 형광펜은 «스티커»가 아니라 «행동»이다. 쓴 글 위에 쭉 긋는 것.
//   (남의 앱 「감성 꾸미기 PRO」 유료 항목 · `docs/꾸미기-기능-대조표-2026-08-06.md`)
//
// ⛔ **손으로 긋는 펜은 안 만든다** — 대조표에 이미 판단이 서 있다:
//    *"펜은 손가락으로 긋는 거라 폰에서 잘 안 예쁘다"*.
// ⭐ 그래서 **띠**로 만든다 — 마스킹테이프와 «같은 문법»(붙이고·끌고·손잡이로 늘린다).
//    새 조작을 안 가르쳐도 되고, 우리 손잡이·되돌리기·순서 바꾸기가 전부 그대로 걸린다.
//
// ⭐⭐ **`multiply` 라 밑에 있는 글자가 그대로 비친다** — 덮는 게 아니라 «칠하는 것».
//    그래서 하나로 셋이 다 된다: 글자 스티커 강조 · 속지에 직접 쓴 글 강조 · 여백 색띠.
//    같은 처방을 이미 쓰고 있다 — `PaperSheet.jsx` 의 「고른 표시」(창업자가 후보 여섯 중 고른 것).
//
// 🎨🎨 **색 = 「C. 맑은 여섯」** (창업자 2026-08-06 후보 넷 → *"a,c둘중하나"* → 재고 C 로 확정)
//
//   ⛔ 처음엔 「고른 표시」의 노랑(`#f0d98a`)을 «기준»으로 두고 나머지를 거기 맞췄는데,
//      창업자가 바로 풀어줬다 — *"색깔 노랑아니어도 돼.."*.
//      📌 그 노랑은 **그 자리(아이콘 위 표시) 색**이지 형광펜이 따라야 할 이유가 없었다.
//      ⭐ 내가 스스로 만든 제약이었다 — 규칙 18 그대로, «왜 그 값인가»부터 의심할 것.
//
//   ⭐⭐ **A(파스텔) 대신 C 를 고른 근거 = 「색끼리 구분」.** 눈이 아니라 재서 골랐다.
//      가장 어두운 종이(크라프트 `#E8D9BD`)에 multiply 0.5 로 칠했을 때 색끼리 최소 거리 —
//        A **12.1** (노랑↔살구 12.1 · 분홍↔살구 13.2 · 민트↔하늘 13.8 = **세 짝이 거의 같다**)
//        C **15.7** (겹치는 건 코랄↔자몽 하나뿐)
//      📌 여섯을 주는 이유는 «골라 쓰라»는 것인데, A 는 크라프트에서 사실상 넷이 된다.
//      ⚠️ 칠한 티는 A 가 조금 진하다(21.6 vs 19.3)지만 **11% 차이라 눈에 안 띄고**,
//         「진하기」 단추가 이미 그걸 메운다.
//
// ⛔ **형광색(네온)은 안 쓴다** — 우리 톤이 뮤트다(`ShopScreen.jsx` 에 이미 박힌 판단).
//    ✅ 기준을 재서 확인했다 — `STICKER_COLORS` 13색이 **채도 평균 39%(최고 60%)** 인데
//       이 여섯은 **평균 29%(최고 50% 레몬)** 라 오히려 더 낮다. 톤을 안 깬다.
//    📌 「뮤트인가」를 감으로 말하지 않는다 — 우리가 이미 쓰는 색을 기준으로 잰다.
export const HL_COLORS = [
  { key: 'lemon', label: '레몬', color: '#f5e07a' },
  { key: 'lime', label: '라임', color: '#cfe89a' },
  { key: 'aqua', label: '아쿠아', color: '#a8dfdf' },
  { key: 'coral', label: '코랄', color: '#f7bcb0' },
  { key: 'grape', label: '자몽', color: '#f6c8d8' },
  { key: 'violet', label: '바이올렛', color: '#c7bbe8' },
]
export const hlColor = (key) => (HL_COLORS.find((c) => c.key === key) || HL_COLORS[0]).color

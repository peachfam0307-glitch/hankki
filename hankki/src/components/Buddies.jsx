// 요리사 친구들 — 프로필 아바타용 커스텀 캐릭터. 요리사 모자를 쓴 동물들.
// 두 세트: ① 클로즈업(인형 스타일 — 얼굴 꽉, 점눈, 포인트 하나 과장, 말랑 광택)
//          ② 오리지널 전신(꺅 버전 — 소품 든 아이들). 둘 다 아바타로 고를 수 있다.
// 호두 셰프 = 사장님네 크레스티드 게코 호두 실물(크림 몸·앰버 눈·미소) 반영.

// 아바타 공통 배경 — 채도 있는 파스텔은 촌스러워서, 캐릭터가 살도록 깔끔한 화이트톤으로 통일.
const BG = '#f5f3ee'

// (Eye·Happy SVG 헬퍼는 어디서도 안 써서 제거 — 2026-07 청소.)

// ---------- 오리지널 세트(48 뷰박스) — 최초 원본(9fe14fe) 그대로 복원 ----------
// 까만콩 눈(r 1.35, 반짝이 없음) · 발 없음 · 호두만 왕눈.
// 원본에서 딱 3가지만 수정: ① 호두 꼬리 추가 ② 냄비냥이 눈을 콩눈으로 ③ 토토 국자→당근.
const B = {
  bear: (
    <g>
      <circle cx="14.5" cy="18" r="4.6" fill="#b98a63" /><circle cx="33.5" cy="18" r="4.6" fill="#b98a63" />
      <circle cx="14.5" cy="18" r="2.2" fill="#d9b593" /><circle cx="33.5" cy="18" r="2.2" fill="#d9b593" />
      <circle cx="24" cy="28" r="13" fill="#b98a63" />
      <ellipse cx="24" cy="32.5" rx="6.4" ry="4.6" fill="#ecd9bd" />
      <rect x="22.6" y="30" width="2.8" height="2.2" rx="1.1" fill="#5f4632" />
      <path d="M24 32.4v1.6M24 34c-.9.9-2 .9-2.8.2M24 34c.9.9 2 .9 2.8.2" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="18.6" cy="27.5" r="1.35" fill="#3d3830" /><circle cx="29.4" cy="27.5" r="1.35" fill="#3d3830" />
      <circle cx="15.6" cy="31" r="2.1" fill="#f0b9a6" opacity="0.75" /><circle cx="32.4" cy="31" r="2.1" fill="#f0b9a6" opacity="0.75" />
      <circle cx="16.8" cy="12.6" r="3.4" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="24" cy="10.6" r="3.9" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="31.2" cy="12.6" r="3.4" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <rect x="15.5" y="14.6" width="17" height="3.6" rx="1.8" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      {/* 대파 — 귀 아래 오른쪽에 비스듬히(토토 당근처럼 몸 밖으로). 흰 줄기는 테두리로 살린다 */}
      <g transform="rotate(14 39.5 30)">
        <rect x="38.4" y="28" width="2.2" height="7.6" rx="1.1" fill="#f7f3e4" stroke="#d5cbaa" strokeWidth="0.6" />
        <path d="M39.5 28.2c-.8-1.9-.8-3.8-.1-5.7M38.8 28.1c-1.4-1.2-2.2-2.8-2.5-4.6M40.2 28.1c1.1-1.4 1.7-3 1.8-4.9" stroke="#7fa05a" strokeWidth="1.25" fill="none" strokeLinecap="round" />
      </g>
    </g>
  ),
  rabbit: (
    <g>
      <ellipse cx="18" cy="12" rx="3.4" ry="8" fill="#f0e9dd" /><ellipse cx="18" cy="12.5" rx="1.6" ry="5.6" fill="#f4c9ba" />
      <ellipse cx="30" cy="12" rx="3.4" ry="8" fill="#f0e9dd" /><ellipse cx="30" cy="12.5" rx="1.6" ry="5.6" fill="#f4c9ba" />
      <circle cx="24" cy="28" r="12.5" fill="#f0e9dd" />
      <circle cx="19" cy="27" r="1.35" fill="#3d3830" /><circle cx="29" cy="27" r="1.35" fill="#3d3830" />
      <path d="M22.6 31.6c.9.9 1.9.9 2.8 0M24 29.6v2" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M22.9 29.2h2.2l-1.1 1.2z" fill="#f4a992" />
      <circle cx="16" cy="30.5" r="2.1" fill="#f0b9a6" opacity="0.75" /><circle cx="32" cy="30.5" r="2.1" fill="#f0b9a6" opacity="0.75" />
      <rect x="18.4" y="15.2" width="11.2" height="3.2" rx="1.6" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="21" cy="12.8" r="2.7" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="26.8" cy="12.4" r="3" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      {/* 국자 → 당근 (원본 국자 자리 그대로) */}
      <g transform="rotate(14 38 28)">
        <path d="M38 24.8c1.6 0 2.5 1.1 2.2 2.8l-1.1 6c-.2 1-1.8 1-2 0l-1.1-6c-.3-1.7.4-2.8 2-2.8z" fill="#e58a42" />
        <path d="M36.9 27.4l2.3.5M37.2 29.6l1.8.4" stroke="#d3742f" strokeWidth="0.7" strokeLinecap="round" />
        <path d="M37.1 24.2c-1.1-.9-2.5-1.2-3.8-.8M38 24c-.2-1.3.2-2.5 1.1-3.4M38.9 24.2c1.2-.7 2.6-.8 3.8-.3" stroke="#87ad5c" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
    </g>
  ),
  catpot: (
    <g>
      <path d="M14.8 15.2l5 4.4-6.4 2.4z" fill="#cbb59a" /><path d="M33.2 15.2l-5 4.4 6.4 2.4z" fill="#cbb59a" />
      <path d="M16.4 17.2l3 2.6-3.9 1.4z" fill="#f4c9ba" /><path d="M31.6 17.2l-3 2.6 3.9 1.4z" fill="#f4c9ba" />
      <circle cx="24" cy="25" r="10.8" fill="#e9dcc4" />
      {/* ^^ 눈 → 친구들과 같은 까만콩 눈 (간격도 친구들처럼 넓게) */}
      <circle cx="19.4" cy="24.2" r="1.35" fill="#3d3830" /><circle cx="28.6" cy="24.2" r="1.35" fill="#3d3830" />
      <path d="M22.8 27.4c.8.7 1.6.7 2.4 0M24 26v1.4" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M12 24.5l4 .9M12.4 27l3.8-.2M36 24.5l-4 .9M35.6 27l-3.8-.2" stroke="#cbb59a" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="17.4" cy="27.2" r="2" fill="#f0b9a6" opacity="0.75" /><circle cx="30.6" cy="27.2" r="2" fill="#f0b9a6" opacity="0.75" />
      {/* 냄비 — 원본 실루엣을 살리되 더 둥글고 예쁘게(뚜껑테 하이라이트·통통한 손잡이) */}
      <ellipse cx="24" cy="31.3" rx="12" ry="2.2" fill="#c9974f" />
      <path d="M12 31.3h24c0 6.6-4.7 10.2-12 10.2S12 37.9 12 31.3z" fill="#a5723f" />
      <ellipse cx="24" cy="33.6" rx="8.6" ry="1.3" fill="#e8c288" opacity="0.4" />
      <rect x="8" y="31.9" width="4.6" height="2.8" rx="1.4" fill="#8c5f33" />
      <rect x="35.4" y="31.9" width="4.6" height="2.8" rx="1.4" fill="#8c5f33" />
      <ellipse cx="18.7" cy="32" rx="2.4" ry="1.3" fill="#e9dcc4" />
      <ellipse cx="29.3" cy="32" rx="2.4" ry="1.3" fill="#e9dcc4" />
      <path d="M31.5 12.5c-1-1.6-1-3 0-4.4M35.6 14.4c-1-1.6-1-3 0-4.4" stroke="#cdd3ce" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  chick: (
    <g>
      <circle cx="23" cy="26.5" r="11.5" fill="#f4d87e" />
      <circle cx="18.6" cy="25.5" r="1.35" fill="#3d3830" /><circle cx="27.4" cy="25.5" r="1.35" fill="#3d3830" />
      <path d="M21.6 28h2.8l-1.4 1.7z" fill="#e8a13c" />
      <circle cx="15.8" cy="29" r="2" fill="#f2b092" opacity="0.8" /><circle cx="30.2" cy="29" r="2" fill="#f2b092" opacity="0.8" />
      <rect x="16.2" y="13.9" width="13.6" height="3.4" rx="1.7" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="19.6" cy="11.3" r="2.9" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="26" cy="10.9" r="3.2" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <path d="M31.6 32.8l7.4-3.4" stroke="#a5723f" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="28.6" cy="36" rx="5.6" ry="3" fill="#4e463c" />
      <ellipse cx="28.6" cy="35.3" rx="5.6" ry="2.6" fill="#655a4c" />
      <circle cx="28.2" cy="35.2" r="1.7" fill="#f2e9cf" /><circle cx="28.5" cy="35.3" r="0.85" fill="#e0a83a" />
      <path d="M14.2 29.6c-1.8.3-3 1.3-3.6 2.8" stroke="#e8c25a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  ),
  dog: (
    <g>
      <circle cx="24" cy="27.5" r="12" fill="#e6d3b3" />
      <path d="M13.6 19.5c-2.6 2.2-3.4 6.6-2 9.8 1 2.2 3.6 2.4 5 .6 1-1.3 1.2-3.6.8-5.8z" fill="#b98a63" />
      <path d="M34.4 19.5c2.6 2.2 3.4 6.6 2 9.8-1 2.2-3.6 2.4-5 .6-1-1.3-1.2-3.6-.8-5.8z" fill="#b98a63" />
      <circle cx="19" cy="26.5" r="1.35" fill="#3d3830" /><circle cx="29" cy="26.5" r="1.35" fill="#3d3830" />
      <ellipse cx="24" cy="31.5" rx="5" ry="3.6" fill="#f4ecdc" />
      <rect x="22.7" y="29.4" width="2.6" height="2.1" rx="1" fill="#5f4632" />
      <path d="M24 31.5v1.2M24 32.7c-.8.8-1.8.8-2.5.2M24 32.7c.8.8 1.8.8 2.5.2" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="16.2" cy="30" r="2" fill="#f0b9a6" opacity="0.75" /><circle cx="31.8" cy="30" r="2" fill="#f0b9a6" opacity="0.75" />
      <rect x="15.8" y="14.8" width="16.4" height="3.5" rx="1.75" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="19.4" cy="12.2" r="3.1" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="26" cy="11" r="3.6" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="31" cy="13" r="2.7" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      {/* 포도 — 동글동글 뮤트 퍼플 송이 + 잎 */}
      <g>
        <path d="M38.2 24.6c-.3-1.4.1-2.7 1-3.7" stroke="#7fa05a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M38.6 24.4c-1.5-.7-3.1-.6-4.3.2 1 .9 2.6 1 4.3-.2z" fill="#87ad5c" />
        <circle cx="36.9" cy="26.6" r="1.55" fill="#a184b0" /><circle cx="40" cy="26.6" r="1.55" fill="#a184b0" />
        <circle cx="35.4" cy="29.2" r="1.55" fill="#96789f" /><circle cx="38.5" cy="29.3" r="1.55" fill="#a184b0" /><circle cx="41.5" cy="29.2" r="1.55" fill="#96789f" />
        <circle cx="36.9" cy="31.8" r="1.55" fill="#a184b0" /><circle cx="40" cy="31.8" r="1.55" fill="#96789f" />
        <circle cx="38.5" cy="34.2" r="1.55" fill="#a184b0" />
        <circle cx="37.3" cy="26.2" r="0.5" fill="#cbb6d4" opacity="0.9" />
      </g>
    </g>
  ),
  gecko: (
    <g>
      <path d="M24 39c-8 0-13.5-5.2-13.5-11.5 0-6.8 5.5-10.5 13.5-10.5s13.5 3.7 13.5 10.5C37.5 33.8 32 39 24 39z" fill="#d8b077" />
      <path d="M11.6 24.6l1.5-3 1.5 2.2 1.6-2.8 1.5 2.3 1.7-2.4 1 2.5z" fill="#c9975c" />
      <path d="M36.4 24.6l-1.5-3-1.5 2.2-1.6-2.8-1.5 2.3-1.7-2.4-1 2.5z" fill="#c9975c" />
      <circle cx="24" cy="20.5" r="0.8" fill="#c9975c" /><circle cx="21" cy="22.5" r="0.6" fill="#c9975c" /><circle cx="27" cy="22.5" r="0.6" fill="#c9975c" />
      <circle cx="16.8" cy="27" r="4.7" fill="#f7f0dd" />
      <circle cx="31.2" cy="27" r="4.7" fill="#f7f0dd" />
      <circle cx="16.8" cy="27" r="2.7" fill="#4a3f31" />
      <circle cx="31.2" cy="27" r="2.7" fill="#4a3f31" />
      <circle cx="17.7" cy="26" r="1" fill="#fff" />
      <circle cx="32.1" cy="26" r="1" fill="#fff" />
      <path d="M21 34.2c1.9 1.3 4.1 1.3 6 0" stroke="#5f4632" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="13.6" cy="32.5" r="1.9" fill="#f0b9a6" opacity="0.7" /><circle cx="34.4" cy="32.5" r="1.9" fill="#f0b9a6" opacity="0.7" />
      <rect x="16.4" y="13.2" width="15.2" height="3.4" rx="1.7" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="20" cy="10.6" r="2.9" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="26.4" cy="10.2" r="3.2" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      {/* 토마토 요리타이머 🍅 — 다이얼·바늘·잎꼭지 (세트 유일한 빨간 포인트) */}
      <g transform="rotate(9 38.3 31.8)">
        <circle cx="38.3" cy="31.8" r="3.7" fill="#dd7f68" />
        <circle cx="38.3" cy="32.1" r="1.95" fill="#f7ede0" />
        <path d="M38.3 32.1v-1.45" stroke="#5f4632" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M38.3 32.1l.95.65" stroke="#5f4632" strokeWidth="0.65" strokeLinecap="round" />
        <circle cx="38.3" cy="32.1" r="0.4" fill="#5f4632" />
        <path d="M38.3 27.9c-1.3-.75-2.7-.85-3.7-.25.85.95 2.3 1.05 3.7.25z" fill="#87ad5c" />
        <path d="M38.3 27.9c1.3-.75 2.7-.85 3.7-.25-.85.95-2.3 1.05-3.7.25z" fill="#7a9d52" />
        <path d="M38.3 28v-1.1" stroke="#7fa05a" strokeWidth="0.9" strokeLinecap="round" />
      </g>
    </g>
  ),
  // 펭귄 셰프 — 여름 친구. 튜브(코랄 도넛)를 배에 두른 뮤트 슬레이트 펭귄.
  penguin: (
    <g>
      <circle cx="24" cy="28" r="13" fill="#6d8090" />
      <ellipse cx="24" cy="30.5" rx="8.2" ry="9.8" fill="#f4efe6" />
      <ellipse cx="12.4" cy="27" rx="2.5" ry="6" fill="#5c6e7d" transform="rotate(16 12.4 27)" />
      <ellipse cx="35.6" cy="27" rx="2.5" ry="6" fill="#5c6e7d" transform="rotate(-16 35.6 27)" />
      <circle cx="20.4" cy="24.5" r="1.35" fill="#2e2a25" /><circle cx="27.6" cy="24.5" r="1.35" fill="#2e2a25" />
      <path d="M22.5 26.8h3l-1.5 2.1z" fill="#eb9a3c" />
      <circle cx="17.4" cy="27.5" r="2" fill="#f0b9a6" opacity="0.75" /><circle cx="30.6" cy="27.5" r="2" fill="#f0b9a6" opacity="0.75" />
      {/* 발 — 튜브 아래로 빼꼼 */}
      <path d="M19 40.6c-.2 1.2-2.4 1.3-3.1.3.5-1 .9-1.6 1.6-2.1z" fill="#eb9a3c" />
      <path d="M29 40.6c.2 1.2 2.4 1.3 3.1.3-.5-1-.9-1.6-1.6-2.1z" fill="#eb9a3c" />
      {/* 배에 두른 튜브(코랄 도넛) + 흰 포인트 */}
      <ellipse cx="24" cy="34.5" rx="11" ry="5.2" fill="#ef9d86" />
      <ellipse cx="24" cy="34.5" rx="6.6" ry="2.8" fill="#f4efe6" />
      <ellipse cx="16.5" cy="33.6" rx="1.3" ry="1.9" fill="#f4efe6" transform="rotate(20 16.5 33.6)" />
      <ellipse cx="31.5" cy="33.6" rx="1.3" ry="1.9" fill="#f4efe6" transform="rotate(-20 31.5 33.6)" />
      {/* 요리사 모자 */}
      <circle cx="16.8" cy="12.6" r="3.2" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="24" cy="10.8" r="3.7" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="31.2" cy="12.6" r="3.2" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <rect x="16" y="14.4" width="16" height="3.5" rx="1.75" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
    </g>
  ),
  hamster: (
    <g>
      <circle cx="16" cy="17.5" r="3.6" fill="#e3c8a0" /><circle cx="32" cy="17.5" r="3.6" fill="#e3c8a0" />
      <circle cx="16" cy="17.5" r="1.7" fill="#f4c9ba" /><circle cx="32" cy="17.5" r="1.7" fill="#f4c9ba" />
      <circle cx="24" cy="28" r="12.5" fill="#e3c8a0" />
      <ellipse cx="24" cy="33" rx="7.5" ry="4.8" fill="#f6eedd" />
      <circle cx="18.8" cy="26.5" r="1.35" fill="#3d3830" /><circle cx="29.2" cy="26.5" r="1.35" fill="#3d3830" />
      <path d="M23 30.4h2l-1 1.1z" fill="#5f4632" />
      <path d="M22.2 32.6c.6.5 1.2.7 1.8.7s1.2-.2 1.8-.7" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="15.4" cy="30.5" r="2.3" fill="#f0b9a6" opacity="0.8" /><circle cx="32.6" cy="30.5" r="2.3" fill="#f0b9a6" opacity="0.8" />
      <rect x="16.6" y="15" width="14.8" height="3.4" rx="1.7" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="20.2" cy="12.4" r="2.9" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="26.6" cy="12" r="3.2" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <path d="M37.6 27l1.6 7.4" stroke="#a5723f" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="37.2" cy="24.6" rx="2.8" ry="3.6" fill="#c9974f" />
    </g>
  ),
}

// ---------- 클로즈업 세트(64 뷰박스) 공용 파츠 ----------
// 반들반들 점눈: 세로 타원 + 큰 광택 + 아래 잔광
// 인형 눈: 일부러 콩알만 하게, 낮게 — 무심해야 귀엽다
const FEye = ({ x, y }) => (
  <>
    <ellipse cx={x} cy={y} rx="2.35" ry="3.25" fill="#241c17" />
    <circle cx={x - 0.85} cy={y - 1.2} r="1.0" fill="#fff" />
    <circle cx={x + 0.95} cy={y + 1.35} r="0.5" fill="#fff" opacity="0.8" />
  </>
)

// 도톰한 요리사 모자(살짝 삐딱)
const FToque = ({ tilt = -9, x = 32, y = 9 }) => (
  <g transform={`rotate(${tilt} ${x} ${y + 4})`}>
    <rect x={x - 10} y={y + 3} width="20" height="5" rx="2.5" fill="#fff" stroke="#e7e0d0" strokeWidth="1" />
    <path d={`M${x - 9.4} ${y + 3.4}c-3.6-1.3-3.6-6.8.4-7.2.6-3.6 5.2-4.8 7.6-2.3 1.7-3 6.7-3 8.4 0 2.4-2.5 7-1.3 7.6 2.3 4 .4 4 5.9.4 7.2z`} fill="#fff" stroke="#e7e0d0" strokeWidth="1" />
    <circle cx={x - 4} cy={y - 1.6} r="1.1" fill="#f3ede0" />
  </g>
)

// 에어브러시 볼터치(그라데이션은 각 캐릭터 defs에)
const FBlush = ({ id, x, y, r = 5.2 }) => <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />

const FaceGrad = ({ id, light, base }) => (
  <radialGradient id={id} cx="50%" cy="36%" r="72%">
    <stop offset="0%" stopColor={light} /><stop offset="100%" stopColor={base} />
  </radialGradient>
)

const BlushGrad = ({ id, c = '#ff9d8a' }) => (
  <radialGradient id={id}>
    <stop offset="0%" stopColor={c} stopOpacity="0.85" />
    <stop offset="70%" stopColor={c} stopOpacity="0.45" />
    <stop offset="100%" stopColor={c} stopOpacity="0" />
  </radialGradient>
)

const FClip = ({ id }) => <clipPath id={id}><circle cx="32" cy="32" r="32" /></clipPath>

const F = {
  fchick: (
    <g>
      <defs>
        <FaceGrad id="hk1g" light="#fff3ae" base="#ffdf6e" /><BlushGrad id="hk1b" c="#ff9d5c" /><FClip id="hk1c" />
        <radialGradient id="hk1k" cx="42%" cy="30%" r="80%"><stop offset="0%" stopColor="#ffc25e" /><stop offset="100%" stopColor="#ff9d2e" /></radialGradient>
      </defs>
      <g clipPath="url(#hk1c)">
        <circle cx="32" cy="40" r="30" fill="url(#hk1g)" />
        <path d="M40 12c2.6-3.2 6.6-3.6 8.4-2" stroke="#e8b93e" strokeWidth="1.7" strokeLinecap="round" fill="none" />
        <FToque tilt={-10} x={27} y={7} />
        <FEye x={16.5} y={38.5} /><FEye x={47.5} y={38.5} />
        <ellipse cx="32" cy="45.5" rx="10" ry="6.6" fill="url(#hk1k)" />
        <path d="M22.8 47.2c3 2.3 15.4 2.3 18.4 0 .9 3.6-2.8 7.4-9.2 7.4s-10.1-3.8-9.2-7.4z" fill="#f57f17" />
        <path d="M23 45.9c3.2 1.7 14.8 1.7 18 0" stroke="#e0740f" strokeWidth="1.1" strokeLinecap="round" fill="none" />
        <circle cx="27" cy="42.6" r="1.6" fill="#ffd98f" opacity="0.85" />
        <FBlush id="hk1b" x={9.5} y={46} /><FBlush id="hk1b" x={54.5} y={46} />
      </g>
    </g>
  ),
  fbear: (
    <g>
      <defs>
        <FaceGrad id="hk2g" light="#f9cd8a" base="#ec9f4e" /><BlushGrad id="hk2b" c="#f0764a" /><FClip id="hk2c" />
        <radialGradient id="hk2m" cx="50%" cy="34%" r="75%"><stop offset="0%" stopColor="#fff8e8" /><stop offset="100%" stopColor="#fbe3ba" /></radialGradient>
      </defs>
      <g clipPath="url(#hk2c)">
        {/* 귀 — 원형 클립(r32) 안에 들어오게 안쪽으로 당기고 살짝 작게(모서리 잘림 방지) */}
        <circle cx="15" cy="16" r="8" fill="#dd8b3d" /><circle cx="15" cy="16" r="4.3" fill="#f9d29a" />
        <circle cx="49" cy="16" r="8" fill="#dd8b3d" /><circle cx="49" cy="16" r="4.3" fill="#f9d29a" />
        <circle cx="32" cy="40" r="28.5" fill="url(#hk2g)" />
        <FToque tilt={-9} x={32} y={6.5} />
        <FEye x={17.5} y={37.5} /><FEye x={46.5} y={37.5} />
        <ellipse cx="32" cy="47.5" rx="12" ry="9" fill="url(#hk2m)" />
        {/* 코 하나로 끝 — 입은 생략(무심) */}
        <path d="M28.4 45.2c1.3-1.9 5.9-1.9 7.2 0 .8 1.3 0 3-3.6 3s-4.4-1.7-3.6-3z" fill="#3f2a1f" />
        <circle cx="30.6" cy="45.1" r="0.85" fill="#75543f" />
        <path d="M32 48.4v1.7" stroke="#3f2a1f" strokeWidth="1.2" strokeLinecap="round" />
        <FBlush id="hk2b" x={11} y={45} /><FBlush id="hk2b" x={53} y={45} />
      </g>
    </g>
  ),
  frabbit: (
    <g>
      <defs>
        <FaceGrad id="hk3g" light="#ffffff" base="#fdf2ee" /><BlushGrad id="hk3b" c="#ff7d9d" /><FClip id="hk3c" />
      </defs>
      <g clipPath="url(#hk3c)">
        <rect x="13.5" y="-7" width="11.5" height="27" rx="5.7" fill="#fffdf9" stroke="#f3e0d6" strokeWidth="0.8" />
        <rect x="16.4" y="-3" width="5.8" height="19.5" rx="2.9" fill="#ff9fb9" />
        <g transform="rotate(40 45 8)">
          <rect x="39.5" y="-9" width="11.5" height="25" rx="5.7" fill="#fffdf9" stroke="#f3e0d6" strokeWidth="0.8" />
          <rect x="42.4" y="-5" width="5.8" height="17.5" rx="2.9" fill="#ff9fb9" />
        </g>
        <circle cx="32" cy="42" r="27.5" fill="url(#hk3g)" />
        <FToque tilt={8} x={36} y={8} />
        <FEye x={17.5} y={40} /><FEye x={46.5} y={40} />
        <path d="M29.8 45.4c.9-1.3 3.5-1.3 4.4 0 .7 1.1-.3 2.3-2.2 2.3s-2.9-1.2-2.2-2.3z" fill="#ff6f91" />
        <path d="M32 47.7v1.6" stroke="#e8879d" strokeWidth="1" strokeLinecap="round" />
        <rect x="27.6" y="49.1" width="4.3" height="6" rx="1.4" fill="#fff" stroke="#dcc9bc" strokeWidth="0.8" />
        <rect x="32.1" y="49.1" width="4.3" height="6" rx="1.4" fill="#fff" stroke="#dcc9bc" strokeWidth="0.8" />
        <FBlush id="hk3b" x={10.5} y={47} /><FBlush id="hk3b" x={53.5} y={47} />
      </g>
    </g>
  ),
  fcat: (
    <g>
      <defs>
        <FaceGrad id="hk4g" light="#ffd089" base="#ff9f3e" /><BlushGrad id="hk4b" c="#f2653a" /><FClip id="hk4c" />
      </defs>
      <g clipPath="url(#hk4c)">
        <path d="M8 22 12 3.5l12.5 9z" fill="#f79440" /><path d="M10.8 18 13 8.6l6.8 5z" fill="#ffc3d2" />
        <path d="M56 22 52 3.5 39.5 12.5z" fill="#f79440" /><path d="M53.2 18 51 8.6l-6.8 5z" fill="#ffc3d2" />
        <circle cx="32" cy="42" r="28" fill="url(#hk4g)" />
        <path d="M25.6 16.5c1.7 3.5 1.7 5.5 0 8.8M32 15.3c1.3 4 1.3 6.3 0 10.2M38.4 16.5c-1.7 3.5-1.7 5.5 0 8.8" stroke="#d97522" strokeWidth="2.1" strokeLinecap="round" fill="none" />
        <FToque tilt={-11} x={26} y={7} />
        <FEye x={17.5} y={39.5} /><FEye x={46.5} y={39.5} />
        {/* 코 + 짧은 인중만 — w입 삭제(무심) */}
        <path d="M30 45.6c.8-1.2 3.2-1.2 4 0 .6 1-.3 2.1-2 2.1s-2.6-1.1-2-2.1z" fill="#f2695c" />
        <path d="M32 47.5v1.4" stroke="#8a4a20" strokeWidth="1.15" strokeLinecap="round" />
        <g fill="#c9853f">
          <circle cx="11.5" cy="42.5" r="0.9" /><circle cx="9.5" cy="46.8" r="0.9" />
          <circle cx="52.5" cy="42.5" r="0.9" /><circle cx="54.5" cy="46.8" r="0.9" />
        </g>
        <FBlush id="hk4b" x={10.5} y={47} /><FBlush id="hk4b" x={53.5} y={47} />
      </g>
    </g>
  ),
  fdog: (
    <g>
      <defs>
        <FaceGrad id="hk5g" light="#fff6e0" base="#f5ddb0" /><BlushGrad id="hk5b" c="#f0774e" /><FClip id="hk5c" />
      </defs>
      <g clipPath="url(#hk5c)">
        <path d="M4 18c-2.2 12.5 2 22.8 8.4 24.8 3.1-6.2 3.1-16.6 0-24.8-2.7-4.6-7.3-4.2-8.4 0z" fill="#a9713d" />
        <path d="M60 18c2.2 12.5-2 22.8-8.4 24.8-3.1-6.2-3.1-16.6 0-24.8 2.7-4.6 7.3-4.2 8.4 0z" fill="#a9713d" />
        <circle cx="32" cy="41" r="27.5" fill="url(#hk5g)" />
        <ellipse cx="46" cy="34" rx="9.4" ry="8" fill="#d8a86b" opacity="0.8" />
        <FToque tilt={9} x={36} y={7.5} />
        <FEye x={17.5} y={39.5} /><FEye x={46.5} y={39.5} />
        {/* 큰 코에서 바로 혀 낼름 — 중간 입 곡선 삭제(무심) */}
        <ellipse cx="32" cy="47" rx="4.9" ry="3.7" fill="#3f2c24" />
        <circle cx="30.4" cy="45.9" r="1.15" fill="#78584a" />
        <path d="M28.9 50.2c0 3.4 6.2 3.4 6.2 0v-1.4h-6.2z" fill="#ff7d99" />
        <path d="M32 50v2" stroke="#e85f83" strokeWidth="0.9" strokeLinecap="round" />
        <g fill="#bd8a4e"><circle cx="23.5" cy="49" r="0.85" /><circle cx="40.5" cy="49" r="0.85" /></g>
        <FBlush id="hk5b" x={11} y={46} /><FBlush id="hk5b" x={53} y={46} />
      </g>
    </g>
  ),
  fgecko: (
    <g>
      <defs>
        <FaceGrad id="hk6g" light="#f9f0d4" base="#efdfb2" /><BlushGrad id="hk6b" c="#f0a86e" /><FClip id="hk6c" />
        <radialGradient id="hk6i" cx="38%" cy="30%" r="80%"><stop offset="0%" stopColor="#f7c96a" /><stop offset="100%" stopColor="#dd8f2a" /></radialGradient>
      </defs>
      <g clipPath="url(#hk6c)">
        <path d="M3 34C5 16 17 8.5 32 8.5S59 16 61 34c1.6 9-1 24-9 28H12C4 58 1.4 43 3 34z" fill="url(#hk6g)" />
        <g fill="#eccf8e" stroke="#d6b26c" strokeWidth="0.6" strokeLinejoin="round">
          <path d="M9 25 11.6 19.6l2.5 4.2z" /><path d="M15 18.6l2.1-4.5 2.5 3.7z" /><path d="M21.8 14.2l1.8-4 2.3 3.3z" />
          <path d="M55 25 52.4 19.6l-2.5 4.2z" /><path d="M49 18.6l-2.1-4.5-2.5 3.7z" /><path d="M42.2 14.2l-1.8-4-2.3 3.3z" />
        </g>
        <FToque tilt={-8} x={32} y={5.2} />
        <g>
          <circle cx="16" cy="32" r="10" fill="#a86f33" /><circle cx="16" cy="32" r="8.8" fill="url(#hk6i)" />
          <ellipse cx="16" cy="32.4" rx="3.3" ry="6" fill="#2e211a" />
          <circle cx="12.9" cy="28.6" r="2.3" fill="#fff" /><circle cx="19" cy="35.6" r="1.15" fill="#fff" opacity="0.9" />
          <circle cx="18.4" cy="29.4" r="0.7" fill="#fff" opacity="0.7" />
        </g>
        <g>
          <circle cx="48" cy="32" r="10" fill="#a86f33" /><circle cx="48" cy="32" r="8.8" fill="url(#hk6i)" />
          <ellipse cx="48" cy="32.4" rx="3.3" ry="6" fill="#2e211a" />
          <circle cx="44.9" cy="28.6" r="2.3" fill="#fff" /><circle cx="51" cy="35.6" r="1.15" fill="#fff" opacity="0.9" />
          <circle cx="50.4" cy="29.4" r="0.7" fill="#fff" opacity="0.7" />
        </g>
        <g fill="#c7a468"><circle cx="28.6" cy="41.6" r="0.95" /><circle cx="35.4" cy="41.6" r="0.95" /></g>
        <path d="M12.5 47c8 5.5 31 5.5 39 0" stroke="#b3905c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M13 47.9c8 5 30 5 38 0 .2 3-1.8 4.5-4 5-9.4 2-21.6 2-31 0-2.2-.5-4.2-2-4-5z" fill="#fdf8e9" />
        <path d="M36.5 52.6c0 2.6 4.8 2.6 4.8 0v-1.4h-4.8z" fill="#f29aa8" />
        <FBlush id="hk6b" x={8} y={43} r={5.8} /><FBlush id="hk6b" x={56} y={43} r={5.8} />
      </g>
    </g>
  ),
  fhamster: (
    <g>
      <defs>
        <FaceGrad id="hk7g" light="#ffdc94" base="#ffb95e" /><BlushGrad id="hk7b" c="#f2653a" /><FClip id="hk7c" />
        <radialGradient id="hk7k" cx="50%" cy="38%" r="75%"><stop offset="0%" stopColor="#ffedc4" /><stop offset="100%" stopColor="#ffd694" /></radialGradient>
      </defs>
      <g clipPath="url(#hk7c)">
        {/* 귀 — 원형 클립 안으로 당겨 모서리 잘림 방지 */}
        <circle cx="16" cy="14" r="6.8" fill="#ed9840" /><circle cx="16" cy="14" r="3.6" fill="#ffd9a0" />
        <circle cx="48" cy="14" r="6.8" fill="#ed9840" /><circle cx="48" cy="14" r="3.6" fill="#ffd9a0" />
        <circle cx="32" cy="40" r="27.5" fill="url(#hk7g)" />
        <circle cx="11.5" cy="47" r="13" fill="url(#hk7k)" />
        <circle cx="52.5" cy="47" r="13" fill="url(#hk7k)" />
        <FToque tilt={-10} x={29} y={6.5} />
        <FEye x={19.5} y={37.5} /><FEye x={44.5} y={37.5} />
        {/* 콩코만 — 씨앗 문 게 입 역할(오물오물) */}
        <path d="M30.3 43.6c.8-1.1 2.6-1.1 3.4 0 .5.9-.2 1.9-1.7 1.9s-2.2-1-1.7-1.9z" fill="#f2695c" />
        <g transform="rotate(38 39.5 50)">
          <ellipse cx="39.5" cy="50" rx="2.1" ry="3.4" fill="#7d5a3e" /><ellipse cx="39.5" cy="50" rx="1.2" ry="2.3" fill="#b58a5e" />
        </g>
        <ellipse cx="36.5" cy="53.8" rx="2.8" ry="2.1" fill="#ffb95e" /><ellipse cx="27.5" cy="53.8" rx="2.8" ry="2.1" fill="#ffb95e" />
        <FBlush id="hk7b" x={10} y={49} r={5.6} /><FBlush id="hk7b" x={54} y={49} r={5.6} />
      </g>
    </g>
  ),
}

// ---------- 라인 세트(64 뷰박스) — 펜 라인 · 미니멀 ----------
const LN = '#6b4f3a'
const LHat = ({ x = 32, y = 13 }) => (
  <>
    <path d={`M${x - 8} ${y}c-3-1.2-2.6-5.4.8-5.8.5-2.7 4-3.8 5.9-1.9 1.4-2.4 5.3-2.4 6.5.2 3.1-.7 5.3 2.7 2.9 5.2`} fill="none" stroke={LN} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    <path d={`M${x - 8.2} ${y}h16.4`} stroke={LN} strokeWidth="2" strokeLinecap="round" />
  </>
)
const LEyes = ({ lx = 26, rx = 38, y = 34 }) => (
  <>
    <circle cx={lx} cy={y} r="1.9" fill={LN} /><circle cx={rx} cy={y} r="1.9" fill={LN} />
  </>
)

const L = {
  lbear: (
    <g>
      <circle cx="19" cy="24" r="4.5" fill="none" stroke={LN} strokeWidth="2" />
      <circle cx="45" cy="24" r="4.5" fill="none" stroke={LN} strokeWidth="2" />
      <circle cx="32" cy="35" r="15" fill="none" stroke={LN} strokeWidth="2" />
      <LHat x={32} y={12} />
      <LEyes lx={26} rx={38} y={34} />
      <path d="M29 40q3 2.5 6 0" fill="none" stroke={LN} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="38.5" r="1.3" fill={LN} />
    </g>
  ),
  lchick: (
    <g>
      <circle cx="32" cy="35" r="15" fill="none" stroke={LN} strokeWidth="2" />
      <LHat x={28} y={12} />
      <path d="M45 15c2-1.5 4.5-1.2 5.5.6" fill="none" stroke={LN} strokeWidth="2" strokeLinecap="round" />
      <LEyes lx={26} rx={38} y={33} />
      <path d="M29 37.6c1.7-1.4 4.3-1.4 6 0-.3 2.6-1.9 3.8-3 3.8s-2.7-1.2-3-3.8z" fill="none" stroke={LN} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  ),
  lcat: (
    <g>
      <path d="M17 26l1-9 8 5z" fill="none" stroke={LN} strokeWidth="2" strokeLinejoin="round" />
      <path d="M47 26l-1-9-8 5z" fill="none" stroke={LN} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="35" r="15" fill="none" stroke={LN} strokeWidth="2" />
      <LHat x={32} y={11} />
      <LEyes lx={26} rx={38} y={33} />
      <path d="M30.6 38c.5-.7 2.3-.7 2.8 0 .3.5-.3 1.1-1.4 1.1s-1.7-.6-1.4-1.1z" fill={LN} />
      <path d="M32 39.1v.9m0 0q-1 1-2 0m2 0q1 1 2 0" fill="none" stroke={LN} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 34h5M14 37h5M45 34h5M45 37h5" stroke={LN} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  lgecko: (
    <g>
      <path d="M47 40c4 1 6.5 3.4 6 6.2-.4 2.4-2.6 3.6-4.3 2.7-1.4-.7-1.7-2.6-.6-3.6.8-.7 2-.5 2.4.3" fill="none" stroke={LN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 33c0-9 7.5-14 17-14s17 5 17 14-7.5 14-17 14-17-5-17-14z" fill={BG} stroke={LN} strokeWidth="2" />
      <path d="M15.5 25.5l1.4-2.4 1.4 2M21 22.5l1.3-2.2 1.4 1.9M43 22.5l-1.3-2.2-1.4 1.9M48.5 25.5l-1.4-2.4-1.4 2" fill="none" stroke={LN} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <LHat x={32} y={11} />
      <circle cx="24" cy="32" r="3.4" fill="none" stroke={LN} strokeWidth="2" />
      <circle cx="40" cy="32" r="3.4" fill="none" stroke={LN} strokeWidth="2" />
      <circle cx="24" cy="32" r="1.3" fill={LN} /><circle cx="40" cy="32" r="1.3" fill={LN} />
      <g fill={LN}><circle cx="30" cy="38.4" r="0.7" /><circle cx="34" cy="38.4" r="0.7" /></g>
      <path d="M26 40q6 4 12 0" fill="none" stroke={LN} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  lrabbit: (
    <g>
      <ellipse cx="23.5" cy="15" rx="3" ry="8" fill="none" stroke={LN} strokeWidth="2" transform="rotate(-12 23.5 15)" />
      <ellipse cx="40.5" cy="15" rx="3" ry="8" fill="none" stroke={LN} strokeWidth="2" transform="rotate(12 40.5 15)" />
      <circle cx="32" cy="36" r="14.5" fill="none" stroke={LN} strokeWidth="2" />
      <LHat x={32} y={13} />
      <LEyes lx={26.5} rx={37.5} y={35} />
      <path d="M30.8 38.4c.5-.7 1.9-.7 2.4 0 .3.45-.25 1-1.2 1s-1.5-.55-1.2-1z" fill={LN} />
      <path d="M32 39.4v1" stroke={LN} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30.4 40.4h1.6v2.4M33.6 40.4h-1.6" fill="none" stroke={LN} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  ),
  ldog: (
    <g>
      <path d="M18.5 30c-3.5-.5-6-4.5-5.5-9.3.3-2.6 2.3-3.2 3.9-1.4 1.7 1.9 2.7 5 2.6 8z" fill="none" stroke={LN} strokeWidth="2" strokeLinejoin="round" />
      <path d="M45.5 30c3.5-.5 6-4.5 5.5-9.3-.3-2.6-2.3-3.2-3.9-1.4-1.7 1.9-2.7 5-2.6 8z" fill="none" stroke={LN} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="35.5" r="14.3" fill="none" stroke={LN} strokeWidth="2" />
      <LHat x={32} y={13} />
      <LEyes lx={26.5} rx={37.5} y={34} />
      <ellipse cx="32" cy="38.6" rx="2" ry="1.5" fill={LN} />
      <path d="M32 40.1v1.4m0 0q-1.2 1.1-2.3 0m2.3 0q1.2 1.1 2.3 0" fill="none" stroke={LN} strokeWidth="1.7" strokeLinecap="round" />
    </g>
  ),
  lhamster: (
    <g>
      <circle cx="22.5" cy="22.5" r="3.6" fill="none" stroke={LN} strokeWidth="2" />
      <circle cx="41.5" cy="22.5" r="3.6" fill="none" stroke={LN} strokeWidth="2" />
      <circle cx="32" cy="36" r="15" fill="none" stroke={LN} strokeWidth="2" />
      <LHat x={32} y={13} />
      <LEyes lx={26} rx={38} y={35} />
      <path d="M30.9 38.8h2.2l-1.1 1.2z" fill={LN} />
      <path d="M32 40v.9m0 0q-.9.8-1.6 0m1.6 0q.9.8 1.6 0" fill="none" stroke={LN} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16.5 37c1.6 1.6 3.2 1.6 4.8 0M47.5 37c-1.6 1.6-3.2 1.6-4.8 0" fill="none" stroke={LN} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
}

// ⭐ 우리 캐릭터 5인 — 얼굴 컷 PNG. 아바타는 32~56px 동그라미라 전신은 얼굴이 12px밖에 안 된다.
// 그래서 정본 얼굴 시트(⭐정본-5인-얼굴.png)를 외접원 기준으로 잘라 원 안에 꽉 차게 했다.
const OURS = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/avatars/*.png', { eager: true, query: '?url', import: 'default' }))
    .map(([k, url]) => [k.split('/').pop().replace('.png', ''), url]),
)

// 🏷🏷 [창업자 확정 2026-09-02] 프로필 아이콘 자리의 이름 = **「한끼 친구들」**
//   📮 창업자 = *"우리애들이라는 말은 지우자."* → *"**한끼친구들**이라고 하면 좋을 듯"*
//   ⭐ 이 이름이 «말을 안 가르는» 이유 = 꾸미기 서랍의 그 탭이 이미 **「친구들」**(`tab: 'buddies'`)이다.
//      같은 애들이 두 화면에서 같은 말로 불린다(규칙 = 같은 기능은 탭이 달라도 같은 이름).
//   ⛔ 이름을 «한 곳»에만 둔다 — v11.30 「레시피열쇠」에서 배운 것. 또 바뀌면 이 한 줄만 고친다.
export const BUDDY_TITLE = '한끼 친구들'

// ⛔⛔ [창업자 확정 2026-09-02] 픽커엔 **정본 5인만** 남긴다.
//   📮 창업자 = *"저기 우리애들 ㅋㅋㅋ 지금봤어 ㅋㅋ 그리고 **나머지애들은 지우자. 오리지널이랑..**"*
//   ⭐ 이건 곰펭 정본 락(2026-07-23 *"앞으로 모든 꼬르곰·펭펭은 물결만"*)의 «마지막 남은 자리»였다 —
//      「곰돌이 셰프」·「펭귄 셰프」·「꿀곰 셰프」가 정본 다섯 바로 아래에 나란히 서 있었다.
//   🚨🚨 **파일도 코드도 «지우지 않는다» — 목록에서만 내린다**(원칙 = 한 번 준 것은 빼앗지 않는다).
//      아래 `ORIGIN/LINE/CANDY` 세트와 `Buddy` 렌더는 그대로 살아 있다 →
//      **이미 그 아이콘을 프로필로 쓰던 사람은 그대로 보인다.** 내린 것은 «고를 수 있는 목록»뿐이다.
//      📌 v11.14(음식 아이콘 75컷)·v10.96(재료 픽커)에서 쓴 그 방식과 같다.
export const BUDDY_GROUPS = [
  {
    key: 'ours',
    // ⛔ 라벨을 «빈 칸»으로 둔다 — 그룹이 하나뿐이라 이름표가 두 번 나온다(위 제목과 겹친다).
    //    ⭐ 그룹 구조는 남긴다: 나중에 갈래가 다시 늘면 라벨만 채우면 된다.
    label: '',
    items: [
      { id: 'av_gom', name: '꼬르곰' },
      { id: 'av_peng', name: '펭펭' },
      { id: 'av_capy', name: '카롱' },
      { id: 'av_fox', name: '뾰미' },
      { id: 'av_gecko', name: '꼬비' },
    ],
  },
]

// 🗄 아래 셋은 «픽커에서 내린» 세트다 — 렌더는 살아 있다(위 설명 참조).
//    ⛔ `BUDDY_GROUPS` 에 도로 넣지 말 것(창업자 확정 2026-09-02).
export const BUDDY_GROUPS_내림 = [
  {
    key: 'origin',
    label: '오리지널',
    items: [
      // ⚠️ 우리 5인(위 'ours')과 이름이 겹치면 안 된다 — 옛 '곰곰 셰프'·'펭펭 셰프'는
      //    진짜 꼬르곰·펭펭이 바로 위에 붙으면서 같은 화면에 이름이 두 번 나왔다(창업자 결정 2026-07-29).
      { id: 'bear', name: '곰돌이 셰프' },
      { id: 'rabbit', name: '토토 셰프' }, // 당근을 든다
      { id: 'catpot', name: '냄비 냥이' }, // 까만콩 눈 + 예쁜 냄비
      { id: 'chick', name: '삐약 셰프' },
      { id: 'dog', name: '몽몽 셰프' },
      { id: 'gecko', name: '호두 셰프' }, // 크레스티드 게코 — 꼬리 있음
      { id: 'hamster', name: '햄찌 셰프' },
      { id: 'penguin', name: '펭귄 셰프' }, // 여름 친구 — 튜브 두른 펭귄
    ],
  },
  {
    key: 'line',
    label: '라인',
    items: [
      { id: 'lbear', name: '곰 셰프' },
      { id: 'lchick', name: '병아리 셰프' },
      { id: 'lcat', name: '냥이 셰프' },
      { id: 'lgecko', name: '호두 셰프' }, // '호두 라인' → 다른 라인 친구들처럼 'OO 셰프'로 통일
      { id: 'lrabbit', name: '토끼 셰프' },
      { id: 'ldog', name: '강아지 셰프' },
      { id: 'lhamster', name: '햄찌 셰프' },
    ],
  },
  {
    key: 'candy',
    label: '캔디',
    items: [
      { id: 'fchick', name: '삐약 셰프' },
      { id: 'fbear', name: '꿀곰 셰프' },
      { id: 'frabbit', name: '깡총 셰프' },
      { id: 'fcat', name: '나비 셰프' },
      { id: 'fdog', name: '몽실 셰프' },
      { id: 'fgecko', name: '호두 셰프' },
      { id: 'fhamster', name: '볼통 셰프' },
    ],
  },
]

export default function Buddy({ id, size = 48, plate = true }) {
  if (OURS[id]) {
    // 우리 5인 — 이미 원 안에 딱 맞게 잘라둔 얼굴이라 그대로 꽉 채운다.
    return (
      <img
        src={OURS[id]}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', background: plate ? BG : 'transparent' }}
      />
    )
  }
  if (L[id]) {
    // 라인 세트 — 아바타/피커엔 흰톤 배경판, 스티커(plate=false)엔 투명.
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        {plate && <rect width="64" height="64" fill={BG} />}
        {L[id]}
      </svg>
    )
  }
  if (F[id]) {
    // 아바타/피커: 흰톤 배경 원 + 살짝 줄인 캐릭터(세트 톤 통일, #26).
    // 스티커(plate=false): 배경 없이 캐릭터만 꽉 차게 → 표지에 투명하게 얹힘.
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        {plate ? (
          <>
            <circle cx="32" cy="32" r="32" fill={BG} />
            <g transform="translate(32 33.5) scale(0.72) translate(-32 -32)">{F[id]}</g>
          </>
        ) : F[id]}
      </svg>
    )
  }
  const body = B[id] || B.bear
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      {/* 원본 그대로 렌더 + 알맞게 확대(1.18) — 적용 시 작아 보이지 않게, 귀·모자·소품 잘림 없이 */}
      <g transform="translate(24 24.6) scale(1.18) translate(-24 -24)">{body}</g>
    </svg>
  )
}

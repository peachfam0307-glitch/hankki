// 요리사 친구들 — 프로필 아바타용 커스텀 캐릭터. 요리사 모자를 쓴 동물들.
// 한끼 아이콘과 같은 채도 낮은 팔레트 + 아기 비율(큰 얼굴·낮은 눈)로 최대한 귀엽게.

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
      <path d="M37.5 24.5l3.2 8.2" stroke="#a5723f" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="37" cy="23" r="3.2" fill="#c9974f" />
      <circle cx="37" cy="22.4" r="2" fill="#e8c288" />
    </g>
  ),
  catpot: (
    <g>
      <path d="M14.8 15.2l5 4.4-6.4 2.4z" fill="#cbb59a" /><path d="M33.2 15.2l-5 4.4 6.4 2.4z" fill="#cbb59a" />
      <path d="M16.4 17.2l3 2.6-3.9 1.4z" fill="#f4c9ba" /><path d="M31.6 17.2l-3 2.6 3.9 1.4z" fill="#f4c9ba" />
      <circle cx="24" cy="25" r="10.8" fill="#e9dcc4" />
      <path d="M19.4 24.4c1-.9 2-.9 2.7 0M25.9 24.4c1-.9 2-.9 2.7 0" stroke="#3d3830" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M22.8 27.4c.8.7 1.6.7 2.4 0M24 26v1.4" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M12 24.5l4 .9M12.4 27l3.8-.2M36 24.5l-4 .9M35.6 27l-3.8-.2" stroke="#cbb59a" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="17.4" cy="27.2" r="2" fill="#f0b9a6" opacity="0.75" /><circle cx="30.6" cy="27.2" r="2" fill="#f0b9a6" opacity="0.75" />
      <path d="M13.5 31h21a1 1 0 0 1 1 1.1c-.4 5.6-4.4 8.9-11.5 8.9s-11.1-3.3-11.5-8.9a1 1 0 0 1 1-1.1z" fill="#a5723f" />
      <ellipse cx="24" cy="31.4" rx="11.6" ry="2.1" fill="#c9974f" />
      <rect x="9.6" y="31.4" width="4.4" height="2.7" rx="1.35" fill="#8c5f33" />
      <rect x="34" y="31.4" width="4.4" height="2.7" rx="1.35" fill="#8c5f33" />
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

export const BUDDY_LIST = [
  { id: 'bear', name: '곰곰 셰프' },
  { id: 'rabbit', name: '토토 셰프' },
  { id: 'catpot', name: '냄비 냥이' },
  { id: 'chick', name: '삐약 셰프' },
  { id: 'dog', name: '몽몽 셰프' },
  { id: 'gecko', name: '크레 셰프' },
  { id: 'hamster', name: '햄찌 셰프' },
]

export default function Buddy({ id, size = 48 }) {
  const body = B[id] || B.bear
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      {body}
    </svg>
  )
}

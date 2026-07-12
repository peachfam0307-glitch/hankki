// 요리사 친구들 — 프로필 아바타용 커스텀 캐릭터. 요리사 모자를 쓴 동물들.
// 한끼 팔레트 + 아기 비율(큰 얼굴·낮은 눈) + 반짝이는 눈망울.
// 호두 셰프는 사장님네 크레스티드 게코 '호두' 실물(크림 몸·앰버 눈·미소)을 참고해 그렸다.

// 반짝이는 눈 — 모든 친구 공용
const Eye = ({ x, y, r = 1.5 }) => (
  <>
    <circle cx={x} cy={y} r={r} fill="#3d3830" />
    <circle cx={x + 0.55} cy={y - 0.6} r="0.6" fill="#fff" />
  </>
)

const B = {
  bear: (
    <g>
      <circle cx="14.5" cy="18" r="4.6" fill="#b98a63" /><circle cx="33.5" cy="18" r="4.6" fill="#b98a63" />
      <circle cx="14.5" cy="18" r="2.2" fill="#d9b593" /><circle cx="33.5" cy="18" r="2.2" fill="#d9b593" />
      <circle cx="24" cy="28" r="13" fill="#b98a63" />
      <path d="M17 38.6q7 3.6 14 0l-1.6 3q-5.4 2.6-10.8 0z" fill="#c2703f" />
      <path d="M22.6 40.2l1.4 2 1.4-2z" fill="#a85a2e" />
      <ellipse cx="24" cy="32.5" rx="6.4" ry="4.6" fill="#ecd9bd" />
      <rect x="22.6" y="30" width="2.8" height="2.2" rx="1.1" fill="#5f4632" />
      <path d="M24 32.4v1.6M24 34c-.9.9-2 .9-2.8.2M24 34c.9.9 2 .9 2.8.2" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Eye x={18.6} y={27.5} /><Eye x={29.4} y={27.5} />
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
      <Eye x={19} y={27} /><Eye x={29} y={27} />
      <path d="M22.9 29.2h2.2l-1.1 1.2z" fill="#f4a992" />
      <path d="M24 30.2v1.2M24 31.4c-.9.8-1.9.8-2.7.1M24 31.4c.9.8 1.9.8 2.7.1" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <rect x="22.5" y="31.6" width="1.4" height="2" rx="0.5" fill="#fff" />
      <rect x="24.1" y="31.6" width="1.4" height="2" rx="0.5" fill="#fff" />
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
      <circle cx="18" cy="32" r="0.45" fill="#d8b8a5" /><circle cx="19.4" cy="32" r="0.45" fill="#d8b8a5" />
      <circle cx="28.6" cy="32" r="0.45" fill="#d8b8a5" /><circle cx="30" cy="32" r="0.45" fill="#d8b8a5" />
      <ellipse cx="33.2" cy="30" rx="2.3" ry="1.3" fill="#9db4c0" transform="rotate(-18 33.2 30)" />
      <path d="M35.2 29l1.8-1.4-.3 2.1 1.6 1-2.2.4z" fill="#8aa3b0" />
      <circle cx="32.4" cy="29.6" r="0.4" fill="#3d3830" />
      <circle cx="30.8" cy="27.2" r="0.55" fill="#c3d2da" /><circle cx="32" cy="25.6" r="0.4" fill="#c3d2da" />
      <path d="M31.5 12.5c-1-1.6-1-3 0-4.4M35.6 14.4c-1-1.6-1-3 0-4.4" stroke="#cdd3ce" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  chick: (
    <g>
      <circle cx="23" cy="26.5" r="11.5" fill="#f4d87e" />
      <Eye x={18.6} y={25.5} r={1.4} /><Eye x={27.4} y={25.5} r={1.4} />
      <path d="M21.6 28h2.8l-1.4 1.7z" fill="#e8a13c" />
      <circle cx="15.8" cy="29" r="2" fill="#f2b092" opacity="0.8" /><circle cx="30.2" cy="29" r="2" fill="#f2b092" opacity="0.8" />
      <path d="M18.6 37.4l1 1.9 1-1.9M23 38l1 1.9 1-1.9" stroke="#e8a13c" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
      <Eye x={19} y={26.5} /><Eye x={29} y={26.5} />
      <ellipse cx="24" cy="31.5" rx="5" ry="3.6" fill="#f4ecdc" />
      <rect x="22.7" y="29.4" width="2.6" height="2.1" rx="1" fill="#5f4632" />
      <path d="M24 31.5v1.2M24 32.7c-.8.8-1.8.8-2.5.2M24 32.7c.8.8 1.8.8 2.5.2" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M22.9 33.4q1.1 2.8 2.2 0z" fill="#f4a992" />
      <circle cx="17.2" cy="29.2" r="0.4" fill="#c9a06b" /><circle cx="18.4" cy="30.4" r="0.4" fill="#c9a06b" /><circle cx="16.6" cy="30.8" r="0.4" fill="#c9a06b" />
      <circle cx="30.8" cy="29.2" r="0.4" fill="#c9a06b" /><circle cx="29.6" cy="30.4" r="0.4" fill="#c9a06b" /><circle cx="31.4" cy="30.8" r="0.4" fill="#c9a06b" />
      <circle cx="16.2" cy="30" r="2" fill="#f0b9a6" opacity="0.6" /><circle cx="31.8" cy="30" r="2" fill="#f0b9a6" opacity="0.6" />
      <rect x="15.8" y="14.8" width="16.4" height="3.5" rx="1.75" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="19.4" cy="12.2" r="3.1" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="26" cy="11" r="3.6" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
      <circle cx="31" cy="13" r="2.7" fill="#fff" stroke="#e2ded2" strokeWidth="1" />
    </g>
  ),
  gecko: (
    <g>
      <path d="M24 39c-8 0-13.5-5.2-13.5-11.5 0-6.8 5.5-10.5 13.5-10.5s13.5 3.7 13.5 10.5C37.5 33.8 32 39 24 39z" fill="#eae0c2" />
      <path d="M11.6 24.6l1.5-3 1.5 2.2 1.6-2.8 1.5 2.3 1.7-2.4 1 2.5z" fill="#dfc48e" />
      <path d="M36.4 24.6l-1.5-3-1.5 2.2-1.6-2.8-1.5 2.3-1.7-2.4-1 2.5z" fill="#dfc48e" />
      <circle cx="24" cy="20.3" r="0.7" fill="#dcc79b" /><circle cx="21" cy="22.3" r="0.55" fill="#dcc79b" /><circle cx="27" cy="22.3" r="0.55" fill="#dcc79b" />
      <circle cx="16.8" cy="27" r="4.9" fill="#c08d55" />
      <circle cx="31.2" cy="27" r="4.9" fill="#c08d55" />
      <circle cx="16.8" cy="27" r="4.1" fill="#d3a56b" />
      <circle cx="31.2" cy="27" r="4.1" fill="#d3a56b" />
      <rect x="16" y="23.9" width="1.7" height="6.2" rx="0.85" fill="#3a3128" />
      <rect x="30.4" y="23.9" width="1.7" height="6.2" rx="0.85" fill="#3a3128" />
      <circle cx="18.3" cy="25.2" r="1.1" fill="#fff" opacity="0.95" /><circle cx="15.4" cy="28.6" r="0.55" fill="#fff" opacity="0.7" />
      <circle cx="32.7" cy="25.2" r="1.1" fill="#fff" opacity="0.95" /><circle cx="29.8" cy="28.6" r="0.55" fill="#fff" opacity="0.7" />
      <circle cx="22.9" cy="31.6" r="0.4" fill="#d8a8a0" /><circle cx="25.1" cy="31.6" r="0.4" fill="#d8a8a0" />
      <path d="M17.5 33.4q6.5 3.4 13 0 -.8 1.8-6.5 1.8t-6.5-1.8z" fill="#f8f2e2" />
      <path d="M17.5 33.4q6.5 3.4 13 0" stroke="#a08b66" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M28.4 34.6q1.3 1.4 0 2.2 -1.1-.6-.8-2z" fill="#f4a992" />
      <circle cx="13.6" cy="32.2" r="1.9" fill="#f0b9a6" opacity="0.6" /><circle cx="34.4" cy="32.2" r="1.9" fill="#f0b9a6" opacity="0.6" />
      <ellipse cx="18.8" cy="38.7" rx="2.3" ry="1.4" fill="#eae0c2" />
      <ellipse cx="29.2" cy="38.7" rx="2.3" ry="1.4" fill="#eae0c2" />
      <path d="M17.8 38.3v1.6M18.9 38.5v1.6M20 38.3v1.5M28.2 38.3v1.6M29.3 38.5v1.6M30.4 38.3v1.5" stroke="#d3bd8e" strokeWidth="0.7" strokeLinecap="round" />
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
      <Eye x={18.8} y={26.5} /><Eye x={29.2} y={26.5} />
      <path d="M23 30.4h2l-1 1.1z" fill="#5f4632" />
      <circle cx="15.4" cy="30.5" r="2.3" fill="#f0b9a6" opacity="0.8" /><circle cx="32.6" cy="30.5" r="2.3" fill="#f0b9a6" opacity="0.8" />
      <circle cx="13.9" cy="28.2" r="0.4" fill="#c9a87e" /><circle cx="13.2" cy="29.6" r="0.4" fill="#c9a87e" />
      <circle cx="34.1" cy="28.2" r="0.4" fill="#c9a87e" /><circle cx="34.8" cy="29.6" r="0.4" fill="#c9a87e" />
      <ellipse cx="24" cy="36.8" rx="1.3" ry="1.9" fill="#7a6248" transform="rotate(24 24 36.8)" />
      <path d="M23.3 35.3l1.4 3" stroke="#d9c6a8" strokeWidth="0.55" />
      <circle cx="21.6" cy="36.6" r="1.5" fill="#e3c8a0" /><circle cx="26.4" cy="36.6" r="1.5" fill="#e3c8a0" />
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
  { id: 'gecko', name: '호두 셰프' }, // 크레스티드 게코 — 사장님네 호두
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

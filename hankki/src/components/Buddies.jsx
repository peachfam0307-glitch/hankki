// 요리사 친구들 — 프로필 아바타용 커스텀 캐릭터. 요리사 모자를 쓴 동물들.
// '보자마자 꺅' 버전: 얼굴 꽉 찬 아기 비율, 반짝 왕눈이(이중 하이라이트),
// 캐릭터마다 개성 소품(당근·생선·음표·꼬리…). 채도는 브랜드 톤에서 +10%만.
// 호두 셰프 = 사장님네 크레스티드 게코 호두 실물(크림 몸·앰버 눈·미소) 반영.

const Eye = ({ x, y, r = 2 }) => (
  <>
    <circle cx={x} cy={y} r={r} fill="#3a332b" />
    <circle cx={x + r * 0.38} cy={y - r * 0.42} r={r * 0.45} fill="#fff" />
    <circle cx={x - r * 0.45} cy={y + r * 0.35} r={r * 0.2} fill="#fff" opacity="0.9" />
  </>
)

const Happy = ({ x, y, w = 3.6 }) => (
  <path d={`M${x - w / 2} ${y}q${w / 2} -${w * 0.62} ${w} 0`} stroke="#3a332b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
)

const B = {
  bear: (
    <g>
      <circle cx="13.6" cy="16.5" r="5" fill="#c08a58" /><circle cx="34.4" cy="16.5" r="5" fill="#c08a58" />
      <circle cx="13.6" cy="16.5" r="2.4" fill="#e0b98e" /><circle cx="34.4" cy="16.5" r="2.4" fill="#e0b98e" />
      <circle cx="24" cy="27.5" r="14" fill="#c08a58" />
      <path d="M16.6 38.9q7.4 3.8 14.8 0l-1.7 3.2q-5.7 2.7-11.4 0z" fill="#cc6f38" />
      <path d="M22.5 40.6l1.5 2.1 1.5-2.1z" fill="#b25627" />
      <ellipse cx="24" cy="32.6" rx="7" ry="5" fill="#f2ddb8" />
      <rect x="22.5" y="29.8" width="3" height="2.4" rx="1.2" fill="#5f4632" />
      <ellipse cx="24" cy="34.6" rx="1.9" ry="1.4" fill="#7a5642" />
      <ellipse cx="24" cy="35.2" rx="1.05" ry="0.65" fill="#f4a992" />
      <Eye x={18.2} y={27} /><Eye x={29.8} y={27} />
      <circle cx="14.8" cy="30.8" r="2.5" fill="#f5b19b" opacity="0.8" /><circle cx="33.2" cy="30.8" r="2.5" fill="#f5b19b" opacity="0.8" />
      <g transform="rotate(-5 24 13.5)">
        <circle cx="16.8" cy="12.2" r="3.5" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="24" cy="10.2" r="4" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="31.2" cy="12.2" r="3.5" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <rect x="15.4" y="14.2" width="17.2" height="3.7" rx="1.85" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      </g>
    </g>
  ),
  rabbit: (
    <g>
      <ellipse cx="17" cy="10.5" rx="3.5" ry="8.2" fill="#f5ecdc" /><ellipse cx="17" cy="11" rx="1.7" ry="5.8" fill="#f7c4ae" />
      <g transform="rotate(30 31.5 11)">
        <ellipse cx="31.5" cy="10.5" rx="3.4" ry="7.8" fill="#f5ecdc" /><ellipse cx="31.5" cy="11" rx="1.6" ry="5.4" fill="#f7c4ae" />
      </g>
      <circle cx="24" cy="28" r="13.5" fill="#f5ecdc" />
      <Eye x={18.4} y={27} /><Eye x={29.6} y={27} />
      <path d="M22.7 29.6h2.6l-1.3 1.4z" fill="#f4a992" />
      <path d="M24 30.9v1.1M24 32c-.9.9-2 .9-2.8.1M24 32c.9.9 2 .9 2.8.1" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <rect x="22.4" y="32.3" width="1.5" height="2.2" rx="0.55" fill="#fff" />
      <rect x="24.1" y="32.3" width="1.5" height="2.2" rx="0.55" fill="#fff" />
      <circle cx="15.2" cy="31" r="2.5" fill="#f5b19b" opacity="0.8" /><circle cx="32.8" cy="31" r="2.5" fill="#f5b19b" opacity="0.8" />
      <rect x="18" y="14.6" width="12" height="3.4" rx="1.7" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      <circle cx="20.8" cy="12" r="2.8" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      <circle cx="27" cy="11.6" r="3.1" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      <path d="M35.4 28.8l5.4 7.8-7.3-2.1z" fill="#e58a42" />
      <path d="M40 27.2c-1.2-1.4-2.9-1.8-4.4-1.2M40.8 28.4c-.2-1.8-1.3-3.2-2.9-3.8M41 29.6c.8-1.6.7-3.4-.3-4.8" stroke="#87ad5c" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <circle cx="34.6" cy="32.2" r="2" fill="#f5ecdc" />
    </g>
  ),
  catpot: (
    <g>
      <path d="M14 14l5.6 4.8-7 2.7z" fill="#c4a87e" /><path d="M34 14l-5.6 4.8 7 2.7z" fill="#c4a87e" />
      <path d="M15.8 16.2l3.4 2.9-4.3 1.6z" fill="#f7c4ae" /><path d="M32.2 16.2l-3.4 2.9 4.3 1.6z" fill="#f7c4ae" />
      <circle cx="24" cy="24.5" r="11.4" fill="#f0dfbe" />
      <Happy x={21} y={24.2} /><Happy x={27.4} y={24.2} />
      <path d="M22.5 26.9q.75 1 1.5 0 q.75 1 1.5 0" stroke="#5f4632" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M24 25.7v1.2" stroke="#5f4632" strokeWidth="1" strokeLinecap="round" />
      <path d="M11.4 24l4.4 1M11.8 26.8l4.2-.2M36.6 24l-4.4 1M36.2 26.8l-4.2-.2" stroke="#c4a87e" strokeWidth="1" strokeLinecap="round" />
      <circle cx="16.8" cy="27.4" r="2.4" fill="#f5b19b" opacity="0.8" /><circle cx="31.2" cy="27.4" r="2.4" fill="#f5b19b" opacity="0.8" />
      <path d="M13 31h22a1 1 0 0 1 1 1.1c-.4 5.8-4.6 9.2-12 9.2s-11.6-3.4-12-9.2a1 1 0 0 1 1-1.1z" fill="#ad713a" />
      <ellipse cx="24" cy="31.4" rx="12.1" ry="2.2" fill="#d19a48" />
      <rect x="8.8" y="31.4" width="4.6" height="2.8" rx="1.4" fill="#94602e" />
      <rect x="34.6" y="31.4" width="4.6" height="2.8" rx="1.4" fill="#94602e" />
      <ellipse cx="18.4" cy="32" rx="2.5" ry="1.4" fill="#f0dfbe" />
      <ellipse cx="29.6" cy="32" rx="2.5" ry="1.4" fill="#f0dfbe" />
      <circle cx="17.6" cy="32" r="0.5" fill="#d8b8a5" /><circle cx="19.2" cy="32" r="0.5" fill="#d8b8a5" />
      <circle cx="28.8" cy="32" r="0.5" fill="#d8b8a5" /><circle cx="30.4" cy="32" r="0.5" fill="#d8b8a5" />
      <ellipse cx="33.6" cy="29.8" rx="2.4" ry="1.4" fill="#93b7c9" transform="rotate(-18 33.6 29.8)" />
      <path d="M35.7 28.7l1.9-1.5-.3 2.2 1.7 1-2.3.5z" fill="#7fa3b6" />
      <circle cx="32.8" cy="29.4" r="0.45" fill="#3d3830" />
      <circle cx="31.2" cy="26.8" r="0.6" fill="#c3d2da" /><circle cx="32.4" cy="25.2" r="0.45" fill="#c3d2da" />
      <path d="M30.8 11.5c-1-1.7-1-3.1 0-4.6M34.9 13.4c-1-1.7-1-3.1 0-4.6" stroke="#cdd3ce" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  chick: (
    <g>
      <circle cx="23.5" cy="27" r="12.2" fill="#f7d766" />
      <Eye x={18.4} y={26.2} r={1.9} /><Eye x={28.6} y={26.2} r={1.9} />
      <path d="M21.9 28.6h3.2l-1.6 1.8z" fill="#f0a132" />
      <circle cx="15.2" cy="29.8" r="2.4" fill="#f5ab88" opacity="0.85" /><circle cx="31.8" cy="29.8" r="2.4" fill="#f5ab88" opacity="0.85" />
      <path d="M19 38.2l1 2 1-2M23.5 38.9l1 2 1-2" stroke="#f0a132" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="rotate(-9 23 14.5)">
        <rect x="15.6" y="13.9" width="14.8" height="3.6" rx="1.8" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="19.2" cy="11.2" r="3" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="26" cy="10.8" r="3.4" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      </g>
      <circle cx="35" cy="19.8" r="1" fill="#c9a87e" />
      <path d="M36 19.8v-4.8l2 1.1" stroke="#c9a87e" strokeWidth="0.95" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32.4 33.6l7-3.2" stroke="#ad713a" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="29.4" cy="36.6" rx="5.6" ry="3" fill="#4e463c" />
      <ellipse cx="29.4" cy="35.9" rx="5.6" ry="2.6" fill="#655a4c" />
      <circle cx="29" cy="35.8" r="1.7" fill="#f2e9cf" /><circle cx="29.3" cy="35.9" r="0.85" fill="#e0a83a" />
      <path d="M13.4 30.4c-1.9.3-3.2 1.4-3.8 3" stroke="#edbf4a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  ),
  dog: (
    <g>
      <circle cx="24" cy="27.5" r="13" fill="#ecd5ab" />
      <path d="M12.8 18.6c-2.8 2.4-3.7 7.2-2.2 10.6 1.1 2.4 3.9 2.6 5.4.7 1.1-1.4 1.3-3.9.9-6.3z" fill="#c08a58" />
      <path d="M35.2 18.6c2.8 2.4 3.7 7.2 2.2 10.6-1.1 2.4-3.9 2.6-5.4.7-1.1-1.4-1.3-3.9-.9-6.3z" fill="#c08a58" />
      <Eye x={18.4} y={26.8} /><Eye x={29.6} y={26.8} />
      <path d="M16.9 22.9q1.5 -1 3 0M28.1 22.9q1.5 -1 3 0" stroke="#c9a06b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="24" cy="32" rx="5.4" ry="3.9" fill="#f4ecdc" />
      <rect x="22.6" y="29.7" width="2.8" height="2.3" rx="1.1" fill="#5f4632" />
      <path d="M24 32v1.2M24 33.2c-.85.85-1.9.85-2.6.2M24 33.2c.85.85 1.9.85 2.6.2" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M22.7 33.9q1.3 3.4 2.6 0z" fill="#f4a992" />
      <circle cx="15.4" cy="30.4" r="2.4" fill="#f5b19b" opacity="0.7" /><circle cx="32.6" cy="30.4" r="2.4" fill="#f5b19b" opacity="0.7" />
      <g transform="rotate(4 24 13.5)">
        <rect x="15.6" y="14.4" width="16.8" height="3.6" rx="1.8" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="19.2" cy="11.8" r="3.2" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="26" cy="10.6" r="3.7" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="31.2" cy="12.6" r="2.8" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      </g>
    </g>
  ),
  gecko: (
    <g>
      <path d="M33.6 39.6c2.9-.5 5 .8 5.2 2.4.2 1.4-1 2.3-2.3 2-1-.2-1.5-1.2-1-1.9.3-.5 1-.6 1.3-.2" fill="none" stroke="#e4d3a4" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M24 39.5c-8.3 0-14-5.4-14-11.9 0-7 5.7-10.9 14-10.9s14 3.9 14 10.9c0 6.5-5.7 11.9-14 11.9z" fill="#f0e4c0" />
      <path d="M10.9 24.4l1.6-3.2 1.6 2.3 1.7-3 1.6 2.5 1.8-2.6 1.1 2.7z" fill="#e6c886" />
      <path d="M37.1 24.4l-1.6-3.2-1.6 2.3-1.7-3-1.6 2.5-1.8-2.6-1.1 2.7z" fill="#e6c886" />
      <circle cx="16.4" cy="27.2" r="5.4" fill="#c98e4c" />
      <circle cx="31.6" cy="27.2" r="5.4" fill="#c98e4c" />
      <circle cx="16.4" cy="27.2" r="4.6" fill="#e0ae66" />
      <circle cx="31.6" cy="27.2" r="4.6" fill="#e0ae66" />
      <ellipse cx="16.4" cy="27.2" rx="1.9" ry="3.2" fill="#3a3128" />
      <ellipse cx="31.6" cy="27.2" rx="1.9" ry="3.2" fill="#3a3128" />
      <circle cx="17.1" cy="25.6" r="1.05" fill="#fff" /><circle cx="15.6" cy="29.3" r="0.55" fill="#fff" opacity="0.9" />
      <circle cx="32.3" cy="25.6" r="1.05" fill="#fff" /><circle cx="30.8" cy="29.3" r="0.55" fill="#fff" opacity="0.9" />
      <circle cx="22.9" cy="32" r="0.42" fill="#d8a8a0" /><circle cx="25.1" cy="32" r="0.42" fill="#d8a8a0" />
      <path d="M17.2 33.8q6.8 3.6 13.6 0 -.9 1.9-6.8 1.9t-6.8-1.9z" fill="#f8f2e2" />
      <path d="M17.2 33.8q6.8 3.6 13.6 0" stroke="#a08b66" strokeWidth="1.15" fill="none" strokeLinecap="round" />
      <path d="M28.6 35.1q1.35 1.45 0 2.3 -1.15-.6-.85-2.1z" fill="#f4a992" />
      <circle cx="13" cy="32.4" r="2.2" fill="#f5b19b" opacity="0.65" /><circle cx="35" cy="32.4" r="2.2" fill="#f5b19b" opacity="0.65" />
      <ellipse cx="18.6" cy="39.2" rx="2.4" ry="1.45" fill="#f0e4c0" />
      <ellipse cx="29.4" cy="39.2" rx="2.4" ry="1.45" fill="#f0e4c0" />
      <path d="M17.5 38.8v1.7M18.7 39v1.7M19.9 38.8v1.6M28.3 38.8v1.7M29.5 39v1.7M30.7 38.8v1.6" stroke="#d9bf84" strokeWidth="0.7" strokeLinecap="round" />
      <g transform="rotate(-6 23.5 13)">
        <rect x="16" y="12.9" width="15.6" height="3.5" rx="1.75" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="19.8" cy="10.3" r="3" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
        <circle cx="26.4" cy="9.9" r="3.3" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      </g>
    </g>
  ),
  hamster: (
    <g>
      <circle cx="15.2" cy="16.8" r="3.9" fill="#e9ca96" /><circle cx="32.8" cy="16.8" r="3.9" fill="#e9ca96" />
      <circle cx="15.2" cy="16.8" r="1.9" fill="#f7c4ae" /><circle cx="32.8" cy="16.8" r="1.9" fill="#f7c4ae" />
      <circle cx="24" cy="27.5" r="13.2" fill="#e9ca96" />
      <circle cx="13.8" cy="31.4" r="4.4" fill="#e9ca96" />
      <circle cx="34.2" cy="31.4" r="4.4" fill="#e9ca96" />
      <ellipse cx="24" cy="33" rx="8" ry="5.2" fill="#f9f0da" />
      <Eye x={18.4} y={26.4} r={1.9} /><Eye x={29.6} y={26.4} r={1.9} />
      <path d="M22.9 30.2h2.2l-1.1 1.2z" fill="#5f4632" />
      <path d="M22.4 32.6c.7.6 1.3.8 1.6.8s.9-.2 1.6-.8" stroke="#5f4632" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="31.2" r="2.6" fill="#f5b19b" opacity="0.85" /><circle cx="34" cy="31.2" r="2.6" fill="#f5b19b" opacity="0.85" />
      <circle cx="12.3" cy="28.6" r="0.45" fill="#c9a87e" /><circle cx="11.6" cy="30.2" r="0.45" fill="#c9a87e" />
      <circle cx="35.7" cy="28.6" r="0.45" fill="#c9a87e" /><circle cx="36.4" cy="30.2" r="0.45" fill="#c9a87e" />
      <ellipse cx="24" cy="37.2" rx="1.35" ry="2" fill="#7a6248" transform="rotate(22 24 37.2)" />
      <path d="M23.3 35.6l1.5 3.1" stroke="#d9c6a8" strokeWidth="0.55" />
      <circle cx="21.5" cy="37" r="1.6" fill="#e9ca96" /><circle cx="26.5" cy="37" r="1.6" fill="#e9ca96" />
      <rect x="16.2" y="14.4" width="15.6" height="3.5" rx="1.75" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      <circle cx="20" cy="11.8" r="3" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
      <circle cx="26.6" cy="11.4" r="3.3" fill="#fff" stroke="#dcd5c3" strokeWidth="1" />
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

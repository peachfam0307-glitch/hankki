import { useState } from 'react'
import FoodIcon, { guessFoodIcon } from './FoodIcon'
import DecorLayer from './DecorLayer'
import { bgStyle } from './Stickers'
import { graphemes } from '../utils'

// 카드 썸네일. recipe.thumb 로 표시 방식을 고른다:
//   'icon'  — 브랜드 커스텀 아이콘(이름 자동매칭 or 직접 선택)  ← 기본
//   'emoji' — 이모지
//   'label' — 글자 타일
//   'photo' — 사진 (있을 때만)
// 예전 레시피(thumb 없음)는 이미지가 있으면 사진, 없으면 아이콘으로 자연스럽게 보인다.
// 크림 배경과 어울리는 '뮤트 팔레트' 큐레이션 — 웜 크림에 얹어도 안 붕 뜨는
// 저채도 톤들(크림·테라코타·허니·세이지·더스티로즈·세이지블루). 그냥 회색 아님, 의도된 변주.
const GRADS = [
  'linear-gradient(135deg,#f5efe3,#e9dcc8)', // 크림/베이지
  'linear-gradient(135deg,#f2e0d3,#e6c7b2)', // 테라코타/클레이
  'linear-gradient(135deg,#f1e6c9,#e3d0a3)', // 허니
  'linear-gradient(135deg,#e8ecdc,#d5dcbe)', // 세이지(뮤트)
  'linear-gradient(135deg,#f1e2e1,#e2ccc9)', // 더스티 로즈
  'linear-gradient(135deg,#e3eae8,#cdd9d5)', // 세이지블루(뮤트)
]

function gradFor(seed = '') {
  let n = 0
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % GRADS.length
  return GRADS[n]
}

export default function Thumb({ recipe, radius = 16, ratio, style, emojiSize = '2rem', iconSize = '56%', showDecor = false }) {
  const [failed, setFailed] = useState(false)
  const thumb = recipe.thumb || (recipe.image ? 'photo' : 'icon') // 예전 레시피 호환
  const showImg = thumb === 'photo' && recipe.image && !failed
  // 표지 배경(배경지) — 정하면 기본 그라데이션 대신 그 배경으로. 패턴은 %라 어느 크기든 스케일된다.
  const bg = recipe.decorBg ? bgStyle(recipe.decorBg) : null
  const base = {
    position: 'relative',
    width: '100%',
    borderRadius: radius,
    overflow: 'hidden',
    ...(bg || { background: gradFor(recipe.title || recipe.id) }),
    ...(ratio ? { aspectRatio: ratio } : {}),
    ...style,
  }
  const center = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }

  let inner
  if (showImg) {
    inner = (
      <img
        src={recipe.image}
        alt={recipe.title}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
      />
    )
  } else if (thumb === 'emoji') {
    inner = <div style={center}><span style={{ fontSize: emojiSize, lineHeight: 1 }}>{recipe.emoji || '🍽️'}</span></div>
  } else if (thumb === 'label') {
    const txt = (recipe.label || recipe.title || '한끼').trim()
    const chars = graphemes(txt) // 이모지도 1글자로 — 중간에 잘리지 않게
    const shown = chars.length > 6 ? chars.slice(0, 5).join('') + '…' : txt
    const n = chars.length > 6 ? 6 : chars.length
    inner = (
      <div style={center}>
        {/* viewBox 안에 그려 컨테이너 크기에 맞춰 자동으로 커지고 작아진다. */}
        <svg viewBox="0 0 48 48" width="76%" height="76%" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
          <text
            x="24"
            y="25"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Pretendard, sans-serif"
            fontWeight="800"
            fill="#5f5a50"
            fontSize="18"
            letterSpacing="-1"
            textLength={Math.min(46, n * 11)}
            lengthAdjust="spacingAndGlyphs"
          >
            {shown}
          </text>
        </svg>
      </div>
    )
  } else {
    inner = <div style={center}><FoodIcon name={recipe.icon || guessFoodIcon(recipe.title)} size={iconSize} /></div>
  }

  // 꾸민 표지를 목록 썸네일에도 보여준다(showDecor). 꾸민 레시피만 — 안 꾸민 건 깔끔한 아이콘 유지.
  // DecorLayer는 위치를 비율로 잡아 어느 크기 박스든 그대로 축소된다.
  const decorated = showDecor && recipe.decor?.length > 0

  return (
    <div style={base}>
      {inner}
      {decorated && <DecorLayer items={recipe.decor} />}
    </div>
  )
}

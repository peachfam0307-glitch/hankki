import { useState } from 'react'
import FoodIcon, { guessFoodIcon } from './FoodIcon'

// 사진이 있으면 사진을, 없거나 로드 실패하면 쿨톤 그라데이션 + 브랜드 커스텀 아이콘(이름 자동매칭).
// PWA 를 오프라인 설치해도 항상 자연스럽고 통일감 있게 보이도록 하기 위한 폴백.
const GRADS = [
  'linear-gradient(135deg,#eef0ec,#e1e5de)',
  'linear-gradient(135deg,#ecefeb,#dce1db)',
  'linear-gradient(135deg,#f0f1ee,#e4e7e0)',
  'linear-gradient(135deg,#e9ece8,#d9ded7)',
]

function gradFor(seed = '') {
  let n = 0
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % GRADS.length
  return GRADS[n]
}

export default function Thumb({ recipe, radius = 16, ratio, style, emojiSize, iconSize = '56%' }) {
  const [failed, setFailed] = useState(false)
  const showImg = recipe.image && !failed
  const base = {
    position: 'relative',
    width: '100%',
    borderRadius: radius,
    overflow: 'hidden',
    background: gradFor(recipe.title || recipe.id),
    ...(ratio ? { aspectRatio: ratio } : {}),
    ...style,
  }
  return (
    <div style={base}>
      {showImg ? (
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FoodIcon name={recipe.icon || guessFoodIcon(recipe.title)} size={iconSize} />
        </div>
      )}
    </div>
  )
}

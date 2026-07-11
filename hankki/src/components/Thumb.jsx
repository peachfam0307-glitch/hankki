import { useState } from 'react'

// 사진이 있으면 사진을, 없거나 로드 실패하면 따뜻한 크림톤 그라데이션 + 이모지 썸네일.
// PWA 를 오프라인 설치해도 항상 자연스럽게 보이도록 하기 위한 폴백.
const GRADS = [
  'linear-gradient(135deg,#f6ecdd,#ecdcc4)',
  'linear-gradient(135deg,#f3e7d6,#e7d3b6)',
  'linear-gradient(135deg,#f7efe3,#eaddc8)',
  'linear-gradient(135deg,#f2e4d0,#e3ceac)',
]

function gradFor(seed = '') {
  let n = 0
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % GRADS.length
  return GRADS[n]
}

export default function Thumb({ recipe, radius = 16, ratio, style, emojiSize }) {
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
            fontSize: emojiSize || '2.4rem',
            filter: 'saturate(0.9)',
          }}
        >
          {recipe.emoji || '🍽️'}
        </div>
      )}
    </div>
  )
}

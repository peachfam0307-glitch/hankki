// 레시피를 예쁜 카드 이미지로 그려 공유(Web Share)하거나 내려받는다.
// 커스텀 아이콘 SVG 문자열을 받아 캔버스에 얹는다.

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapLines(ctx, text, maxW) {
  const words = String(text).split('')
  const lines = []
  let line = ''
  for (const ch of words) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      lines.push(line)
      line = ch
    } else {
      line += ch
    }
  }
  if (line) lines.push(line)
  return lines
}

function loadSvg(svg) {
  // React가 만든 svg에는 xmlns가 없어 data URL 로 못 불러온다 — 넣어준다.
  let s = svg
  if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s)
  })
}

export async function shareRecipeCard({ title, info = [], ingredients = [], iconSvg }) {
  const W = 1080
  const H = 1500
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const F = "'Pretendard', 'Apple SD Gothic Neo', sans-serif"

  // 배경
  ctx.fillStyle = '#eef0ec'
  ctx.fillRect(0, 0, W, H)

  // 흰 카드
  ctx.save()
  ctx.shadowColor = 'rgba(107,79,58,0.12)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  roundRect(ctx, 64, 72, W - 128, H - 144, 56)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // 아이콘 타일
  const tileSize = 260
  const tileX = (W - tileSize) / 2
  const tileY = 150
  const grad = ctx.createLinearGradient(tileX, tileY, tileX + tileSize, tileY + tileSize)
  grad.addColorStop(0, '#edeee9')
  grad.addColorStop(1, '#dfe2da')
  roundRect(ctx, tileX, tileY, tileSize, tileSize, 44)
  ctx.fillStyle = grad
  ctx.fill()
  const icon = iconSvg ? await loadSvg(iconSvg) : null
  if (icon) {
    const s = tileSize * 0.62
    ctx.drawImage(icon, tileX + (tileSize - s) / 2, tileY + (tileSize - s) / 2, s, s)
  }

  // 제목
  ctx.textAlign = 'center'
  ctx.fillStyle = '#3d3830'
  ctx.font = `800 68px ${F}`
  const titleLines = wrapLines(ctx, title, W - 260).slice(0, 2)
  let y = tileY + tileSize + 96
  titleLines.forEach((ln) => { ctx.fillText(ln, W / 2, y); y += 84 })

  // 정보 (시간·인분·난이도)
  if (info.length) {
    ctx.font = `600 34px ${F}`
    ctx.fillStyle = '#8e8f88'
    ctx.fillText(info.join('   ·   '), W / 2, y + 6)
    y += 60
  }

  // 구분선
  y += 34
  ctx.strokeStyle = '#e8e9e4'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(150, y)
  ctx.lineTo(W - 150, y)
  ctx.stroke()
  y += 66

  // 재료
  ctx.textAlign = 'left'
  ctx.fillStyle = '#6b4f3a'
  ctx.font = `800 38px ${F}`
  ctx.fillText('재료', 150, y)
  y += 58
  ctx.font = `400 36px ${F}`
  ctx.fillStyle = '#3d3830'
  const shown = ingredients.slice(0, 8)
  shown.forEach((ing) => {
    ctx.fillStyle = '#c7ac82'
    ctx.fillText('•', 150, y)
    ctx.fillStyle = '#3d3830'
    const line = wrapLines(ctx, ing, W - 360)[0]
    ctx.fillText(line, 188, y)
    y += 56
  })
  if (ingredients.length > shown.length) {
    ctx.fillStyle = '#8e8f88'
    ctx.fillText(`외 ${ingredients.length - shown.length}가지`, 188, y)
  }

  // 푸터 브랜딩
  ctx.textAlign = 'center'
  ctx.fillStyle = '#6b4f3a'
  ctx.font = `800 40px ${F}`
  ctx.fillText('한끼', W / 2, H - 150)
  ctx.fillStyle = '#a9a99f'
  ctx.font = `500 30px ${F}`
  ctx.fillText('흩어진 레시피를, 한곳에', W / 2, H - 108)

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) return { ok: false }
  const file = new File([blob], 'hankki-recipe.png', { type: 'image/png' })

  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title })
      return { ok: true, shared: true }
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: true, shared: false }
  }
  // 폴백 — 다운로드
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hankki-recipe.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { ok: true, shared: false }
}

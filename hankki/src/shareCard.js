// 레시피를 예쁜 카드 이미지로 그려 공유(Web Share)하거나 내려받는다.
// 카드는 레시피를 다 보여주고 '한끼' 브랜딩을 얹는다. (앱 링크는 공유 메시지로 함께 전달)

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
  const lines = []
  let line = ''
  for (const ch of String(text)) {
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

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function loadSvg(svg) {
  let s = svg
  if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s))
}

export async function shareRecipeCard({ title, info = [], ingredients = [], steps = [], iconSvg, appUrl }) {
  const W = 1080
  const F = "'Pretendard', 'Apple SD Gothic Neo', sans-serif"

  // ── 측정(높이 계산) ──
  const m = document.createElement('canvas').getContext('2d')
  m.font = `800 66px ${F}`
  const titleLines = wrapLines(m, title, 770).slice(0, 2)
  const shown = ingredients.slice(0, 8)
  m.font = `400 33px ${F}`
  const shownSteps = steps.slice(0, 6).map((s) => {
    const all = wrapLines(m, s, W - 420)
    const lines = all.slice(0, 2)
    if (all.length > 2) lines[1] = lines[1].slice(0, -1) + '…' // 잘리면 말줄임표
    return lines
  })

  const cardTop = 72
  const tile = 232
  const brandY = cardTop + 84
  const tileTop = brandY + 34
  const titleTop = tileTop + tile + 90
  let y = titleTop + (titleLines.length - 1) * 82 + 68
  const infoY = y
  y += info.length ? 56 : 6
  const dividerY = y + 34
  const ingHeadY = dividerY + 60
  const ingTop = ingHeadY + 58
  y = ingTop + shown.length * 55 + (ingredients.length > shown.length ? 50 : 0)
  // 만드는 법
  const stepHeadY = shownSteps.length ? y + 52 : y
  const stepTop = shownSteps.length ? stepHeadY + 58 : y
  if (shownSteps.length) {
    y = stepTop
    shownSteps.forEach((lines) => { y += lines.length * 46 + 18 })
    if (steps.length > shownSteps.length) y += 44
  }
  const footerTop = y + 40
  const cardBottom = footerTop + 120
  const H = cardBottom + 72

  // ── 그리기 ──
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#eef0ec'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.shadowColor = 'rgba(107,79,58,0.12)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  roundRect(ctx, 64, cardTop, W - 128, H - cardTop - 72, 56)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // 브랜드 워드마크
  ctx.textAlign = 'center'
  ctx.fillStyle = '#6b4f3a'
  ctx.font = `800 40px ${F}`
  ctx.fillText('한끼', W / 2, brandY)

  // 아이콘 타일
  const tileX = (W - tile) / 2
  const g = ctx.createLinearGradient(tileX, tileTop, tileX + tile, tileTop + tile)
  g.addColorStop(0, '#edeee9')
  g.addColorStop(1, '#dfe2da')
  roundRect(ctx, tileX, tileTop, tile, tile, 42)
  ctx.fillStyle = g
  ctx.fill()
  const icon = iconSvg ? await loadSvg(iconSvg) : null
  if (icon) {
    const s = tile * 0.62
    ctx.drawImage(icon, tileX + (tile - s) / 2, tileTop + (tile - s) / 2, s, s)
  }

  // 제목
  ctx.fillStyle = '#3d3830'
  ctx.font = `800 66px ${F}`
  let ty = titleTop
  titleLines.forEach((ln) => { ctx.fillText(ln, W / 2, ty); ty += 82 })

  // 정보
  if (info.length) {
    ctx.font = `600 33px ${F}`
    ctx.fillStyle = '#8e8f88'
    ctx.fillText(info.join('   ·   '), W / 2, infoY)
  }

  // 구분선
  ctx.strokeStyle = '#e8e9e4'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(150, dividerY)
  ctx.lineTo(W - 150, dividerY)
  ctx.stroke()

  // 재료
  ctx.textAlign = 'left'
  ctx.fillStyle = '#6b4f3a'
  ctx.font = `800 37px ${F}`
  ctx.fillText('재료', 150, ingHeadY)
  ctx.font = `400 35px ${F}`
  let iy = ingTop
  shown.forEach((ing) => {
    ctx.fillStyle = '#c7ac82'
    ctx.fillText('•', 150, iy)
    ctx.fillStyle = '#3d3830'
    ctx.fillText(wrapLines(ctx, ing, W - 360)[0], 186, iy)
    iy += 55
  })
  if (ingredients.length > shown.length) {
    ctx.fillStyle = '#a9a99f'
    ctx.fillText(`외 ${ingredients.length - shown.length}가지`, 186, iy)
  }

  // 만드는 법
  if (shownSteps.length) {
    ctx.fillStyle = '#6b4f3a'
    ctx.font = `800 37px ${F}`
    ctx.fillText('만드는 법', 150, stepHeadY)
    let sy = stepTop
    shownSteps.forEach((lines, i) => {
      // 번호 동그라미
      ctx.fillStyle = '#edeee9'
      ctx.beginPath()
      ctx.arc(168, sy - 11, 21, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6b4f3a'
      ctx.font = `800 25px ${F}`
      ctx.textAlign = 'center'
      ctx.fillText(String(i + 1), 168, sy - 2)
      ctx.textAlign = 'left'
      ctx.font = `400 33px ${F}`
      ctx.fillStyle = '#3d3830'
      lines.forEach((ln) => { ctx.fillText(ln, 210, sy); sy += 46 })
      sy += 18
    })
    if (steps.length > shownSteps.length) {
      ctx.fillStyle = '#a9a99f'
      ctx.fillText(`… 나머지 ${steps.length - shownSteps.length}단계는 한끼 앱에서`, 210, sy)
    }
  }

  // ── 푸터: 브랜드 + 슬로건 ──
  ctx.strokeStyle = '#e8e9e4'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(150, footerTop - 22)
  ctx.lineTo(W - 150, footerTop - 22)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#6b4f3a'
  ctx.font = `800 50px ${F}`
  ctx.fillText('한끼', W / 2, footerTop + 44)
  ctx.fillStyle = '#a29a8d'
  ctx.font = `600 30px ${F}`
  ctx.fillText('모으고 · 만들고 · 살림까지', W / 2, footerTop + 92)

  // ── 공유/다운로드 ──
  const url = appUrl || 'https://claude.ai'
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) return { ok: false }
  const file = new File([blob], 'hankki-recipe.png', { type: 'image/png' })
  const payload = { files: [file], title, text: `『${title}』 레시피 · 한끼 🍳\n한끼 앱에서 더 보기 → ${url}`, url }

  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share(payload)
      return { ok: true, shared: true }
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: true, shared: false }
  }
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objUrl
  a.download = 'hankki-recipe.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
  return { ok: true, shared: false }
}

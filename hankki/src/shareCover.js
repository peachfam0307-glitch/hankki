// "내가 꾸민 표지(레꾸) 그대로" 공유 — 앱 화면의 표지(배경지+스티커+포스트잇+글씨)를
// 통째로 사진으로 떠서, 따뜻한 액자(브랜드·제목·링크)에 얹어 Web Share로 내보낸다.
// (클로드가 따로 그린 카드 ❌ — 유저가 꾸민 그 모습이 주인공. 2026-07-19 창업자 방향)

import { toPng } from 'html-to-image'

const DISPLAY = "'Jua', 'Apple SD Gothic Neo', sans-serif" // 통통 귀여운 브랜드/제목
const BODY = "'Gowun Dodum', 'Apple SD Gothic Neo', sans-serif" // 부드러운 본문

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// 예쁜 글씨가 캔버스에 확실히 실리도록 먼저 로드
async function ensureFonts() {
  if (!document.fonts) return
  try {
    await Promise.all(['46px Jua', '58px Jua', "30px 'Gowun Dodum'"].map((f) => document.fonts.load(f, '한끼가나다')))
    await document.fonts.ready
  } catch (e) { /* 실패해도 기본 글씨로 그린다 */ }
}

export async function shareDecoratedCover({ coverEl, title, info = [], appUrl, recipeEl = null }) {
  await ensureFonts()

  // ── 1) 화면의 표지를 그대로 사진으로 (버튼 등 data-nocapture는 제외) ──
  const rect = coverEl.getBoundingClientRect()
  const scale = Math.min(3, 1080 / Math.max(1, rect.width)) // 1080px급 고해상도
  let coverUrl
  try {
    coverUrl = await toPng(coverEl, {
      pixelRatio: scale,
      filter: (node) => !(node.dataset && 'nocapture' in node.dataset),
    })
  } catch (e) {
    return { ok: false, error: 'capture' }
  }
  const coverImg = await loadImage(coverUrl)
  if (!coverImg) return { ok: false, error: 'capture' }

  // ── 2) 따뜻한 액자에 얹기 (레꾸가 주인공 — 크게, 글은 최소) ──
  const W = 1080
  const M = 46 // 좌우 여백
  const coverW = W - M * 2
  const coverH = Math.round((coverW * coverImg.height) / coverImg.width)
  const brandY = 96
  const coverTop = 128
  const titleTop = coverTop + coverH + 86
  const infoY = titleTop + 46
  const footerTop = infoY + (info.length ? 44 : 10) + 46
  const H = footerTop + 150

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f4f2ee' // 확정 배경 톤(곰·펭 다 어울리는 밝은 중립)
  ctx.fillRect(0, 0, W, H)

  // 브랜드
  ctx.textAlign = 'center'
  ctx.fillStyle = '#6b4f3a'
  ctx.font = `46px ${DISPLAY}`
  ctx.fillText('한끼 🧡', W / 2, brandY)

  // 표지(레꾸) — 둥근 모서리 + 은은한 그림자
  ctx.save()
  ctx.shadowColor = 'rgba(107,79,58,0.18)'
  ctx.shadowBlur = 42
  ctx.shadowOffsetY = 16
  roundRect(ctx, M, coverTop, coverW, coverH, 44)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()
  ctx.save()
  roundRect(ctx, M, coverTop, coverW, coverH, 44)
  ctx.clip()
  ctx.drawImage(coverImg, M, coverTop, coverW, coverH)
  ctx.restore()

  // 제목 + 정보(작게)
  ctx.fillStyle = '#3d3830'
  ctx.font = `58px ${DISPLAY}`
  ctx.fillText(String(title).length > 16 ? String(title).slice(0, 15) + '…' : title, W / 2, titleTop)
  if (info.length) {
    ctx.fillStyle = '#a08d74'
    ctx.font = `30px ${BODY}`
    ctx.fillText(info.join('  ·  '), W / 2, infoY)
  }

  // 푸터: 슬로건 + 링크 알약 (이미지 혼자 퍼져도 어디서 왔는지 알게 — 바이럴 루프)
  const url = appUrl || 'https://peachfam0307-glitch.github.io/hankki/'
  ctx.fillStyle = '#a89c88'
  ctx.font = `29px ${BODY}`
  ctx.fillText('오늘도 한 끼 해냈다 🧡', W / 2, footerTop)
  const prettyUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const pillLabel = '나도 꾸미러 가기  ·  ' + prettyUrl
  const pillW = 720
  roundRect(ctx, W / 2 - pillW / 2, footerTop + 34, pillW, 58, 29)
  ctx.fillStyle = '#eae6de'
  ctx.fill()
  ctx.fillStyle = '#8a7a63'
  let pf = 28
  do { ctx.font = `${pf}px ${BODY}`; if (ctx.measureText(pillLabel).width <= pillW - 60) break; pf -= 1 } while (pf > 22)
  ctx.fillText(pillLabel, W / 2, footerTop + 72)

  // ── 3) 2장째: 실제 레시피카드(재료·만드는 법) — 친구가 진짜 해먹을 수 있게(랜덤 카드와 동일) ──
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) return { ok: false }
  const file = new File([blob], 'hankki-cover.png', { type: 'image/png' })
  const files = [file]
  if (recipeEl) {
    try {
      const ru = await toPng(recipeEl, { pixelRatio: 2, cacheBust: true })
      const rb = await (await fetch(ru)).blob()
      files.push(new File([rb], 'hankki-recipe.png', { type: 'image/png' }))
    } catch (e) { /* 레시피카드 실패해도 표지 1장은 보낸다 */ }
  }

  // ── 4) 공유 / 다운로드 ──
  const has2 = files.length > 1
  const payload = { files, title, text: `『${title}』 · 내가 꾸민 레시피 🧡 한끼${has2 ? ' · 재료·레시피 같이!' : ''}\n나도 만들기 → ${url}`, url }
  try {
    if (navigator.canShare && navigator.canShare({ files })) {
      await navigator.share(payload)
      return { ok: true, shared: true }
    }
    if (has2 && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ ...payload, files: [file] })
      return { ok: true, shared: true }
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: true, shared: false }
  }
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objUrl
  a.download = 'hankki-cover.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
  return { ok: true, shared: false }
}

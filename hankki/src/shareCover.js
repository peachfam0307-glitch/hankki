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

  // 2장째(레시피카드) 캡처를 표지 캡처와 '동시에' 시작한다 — 전체 대기시간을 줄여
  // 폰의 공유 허용 시간(user activation) 안에 navigator.share가 뜨게 한다.
  const recipeFilePromise = recipeEl
    ? toPng(recipeEl, { pixelRatio: 1.6, cacheBust: true })
        .then((u) => fetch(u))
        .then((r) => r.blob())
        .then((b) => new File([b], 'hankki-recipe.png', { type: 'image/png' }))
        .catch(() => null)
    : null

  // ── 1) 화면의 표지를 그대로 사진으로 (버튼 등 data-nocapture는 제외) ──
  const rect = coverEl.getBoundingClientRect()
  const scale = Math.min(3, 1080 / Math.max(1, rect.width)) // 1080px급 고해상도
  let coverUrl
  try {
    // ⏱ **12초 제한** — 캡처가 안 끝나면 로딩만 돌고 아무 말이 없다. 그게 유저에겐 먹통이다
    //    (창업자 2026-08-03 *"로딩은 돌아가. 그다음이 안돼"*). 끝나든 못 끝나든 **말은 한다.**
    coverUrl = await Promise.race([
      toPng(coverEl, {
        pixelRatio: scale,
        filter: (node) => !(node.dataset && 'nocapture' in node.dataset),
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('capture timeout')), 12000)),
    ])
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

  // 푸터: 슬로건 + 설치 유도 알약 (이미지 혼자 퍼져도 어디서 왔는지 알게 — 바이럴 루프)
  //
  // ⛔⛔ **2026-08-04 고침 — 여기 «깃허브 주소»가 그대로 찍히고 있었다.**
  //    창업자 *"내레시피자랑 아래주소 깃허브"*. `appUrl` 은 지금 앱이 떠 있는 주소라
  //    `peachfam0307-glitch.github.io/hankki` 가 카드에 박혔다 — **받는 사람이 읽을 주소가 아니다**
  //    (개발자 계정 아이디가 그대로 노출되고, 앱을 깔라는 말로도 안 읽힌다).
  //    ⭐ **랜덤 카드는 이미 v8.41 에 「Play스토어 '한끼' 검색」으로 바꿨는데 이쪽만 안 바꿨다.**
  //       📌 같은 성격의 자리는 **두 곳을 같이 고쳐야 한다** — 한쪽만 고치면 이렇게 오래 남는다.
  //    ⚠️ `url` 자체는 그대로 둔다 — 공유 payload 의 `url` 로 쓰이고, 웹으로 여는 사람에겐 유효하다.
  //       **카드에 «찍는 글자»만** 스토어 안내로 바꾼다.
  const url = appUrl || 'https://peachfam0307-glitch.github.io/hankki/'
  ctx.fillStyle = '#a89c88'
  ctx.font = `29px ${BODY}`
  ctx.fillText('오늘도 한 끼 해냈다 🧡', W / 2, footerTop)
  const pillLabel = '나도 꾸미러 가기  ·  Play스토어 ‘한끼’ 검색'
  const pillW = 720
  roundRect(ctx, W / 2 - pillW / 2, footerTop + 34, pillW, 58, 29)
  ctx.fillStyle = '#5d3410'          // ⭐ 채운 알약 — 연한 판＋갈색 글자는 카드 배경에 묻혔다
  ctx.fill()
  ctx.fillStyle = '#fffdf8'
  let pf = 28
  do { ctx.font = `${pf}px ${BODY}`; if (ctx.measureText(pillLabel).width <= pillW - 60) break; pf -= 1 } while (pf > 22)
  ctx.fillText(pillLabel, W / 2, footerTop + 72)

  // ── 3) 2장째(레시피카드)를 함께 — 친구가 진짜 해먹을 수 있게(랜덤 카드와 동일) ──
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) return { ok: false }
  const file = new File([blob], 'hankki-cover.png', { type: 'image/png' })
  const recipeFile = recipeFilePromise ? await recipeFilePromise : null // 이미 병렬로 뜨는 중 → 거의 즉시
  const files = recipeFile ? [file, recipeFile] : [file]

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
  // 폴백(공유 불가·시간초과) — 표지+레시피 둘 다 저장(레시피가 빠지지 않게)
  const dl = (b, name) => {
    const u = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = u; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(u), 1500)
  }
  dl(blob, 'hankki-cover.png')
  if (recipeFile) setTimeout(() => dl(recipeFile, 'hankki-recipe.png'), 400)
  return { ok: true, shared: false }
}

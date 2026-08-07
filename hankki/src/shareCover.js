// "내가 꾸민 표지(레꾸) 그대로" 공유 — 앱 화면의 표지(배경지+스티커+포스트잇+글씨)를
// 통째로 사진으로 떠서, 따뜻한 액자(브랜드·제목·링크)에 얹어 Web Share로 내보낸다.
// (클로드가 따로 그린 카드 ❌ — 유저가 꾸민 그 모습이 주인공. 2026-07-19 창업자 방향)

import { toPng, toJpeg } from 'html-to-image'
import { fontCSS, fontOptFrom } from './fontEmbed'

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

// 🖼🖼 **표지를 사진으로 떠서 「보낼 꾸러미」까지 만든다 — 보내진 않는다.**
//   ⭐ 이걸 따로 뗀 이유 = **미리 캡처**. 유저가 「꾸민 표지 / 랜덤 카드」를 고르는 «동안»
//      백그라운드로 미리 그려두면, 고를 때쯤엔 다 돼 있어서 «누른 직후»에 바로 공유창이 열린다.
//      (랜덤 카드는 v9.63부터 이렇게 하고 있었는데 꾸민 표지에만 없었다 — 창업자 2026-08-05)
//   ⛔ 여기서 navigator.share 를 부르지 말 것. 공유는 «사용자가 누른 순간»에만 열린다.
export async function buildCoverPayload({ coverEl, title, info = [], appUrl, recipeEl = null }) {
  if (!coverEl) return null
  await ensureFonts()
  // 🔤 글꼴 꾸러미 — 안 넘기면 캡처마다 글꼴 8개·1.7MB 를 처음부터 다시 만든다.
  //   ⛔⛔ 그게 창업자 *"내가 꾸민 건 다운로드로 떨어진다"* 의 뿌리였다: 캡처가 너무 느려
  //      폰의 공유 허가(user activation)가 그 사이 만료되고 → 저장으로 밀렸다.
  //   실측 2026-08-05 = 글꼴 포함 15.3초 vs 빼면 1.4초. → `src/fontEmbed.js`
  //   ⛔⛔ v9.66 에 **뺐었다** — 꾸러미에 글꼴이 «일부만» 실려 글자 폭이 어긋났다(창업자 캡처).
  //   ⭐ v9.73 에 다시 켠다 — «왜 일부만 실렸나»를 찾았다: 라이브러리가 «만들 때 쓴 조각이
  //      실제로 쓰는 글꼴»만 담는다.
  //   ⭐⭐ 2026-08-07 — **찍을 조각을 그대로 넘긴다.** 글씨체가 열둘이 돼서 「전부 담기」를 하면
  //      4.7MB 가 되고, 글씨체 하나만 쓴 사람도 열두 벌을 다 받는다. 이 두 장이 쓰는 것만 담는다.
  //      🔒 부르기로 한 게 다 안 들어 있으면 `fontEmbed.js` 가 «안 쓴다»(느려도 정확한 옛 길로).
  const fontOpt = fontOptFrom(await fontCSS([coverEl, recipeEl]))

  // 2장째(레시피카드) 캡처를 표지 캡처와 '동시에' 시작한다 — 전체 대기시간을 줄여
  // 폰의 공유 허용 시간(user activation) 안에 navigator.share가 뜨게 한다.
  //   ⛔ `cacheBust` 를 껐다 — 켜면 카드 안 그림을 «전부 다시» 내려받는다(같은 출처라 안전).
  const recipeFilePromise = recipeEl
    ? toJpeg(recipeEl, { pixelRatio: 1.6, quality: 0.92, backgroundColor: '#ffffff', ...fontOpt })
        .then((u) => fetch(u))
        .then((r) => r.blob())
        .then((b) => new File([b], 'hankki-recipe.jpg', { type: 'image/jpeg' }))
        .catch(() => null)
    : null

  // ── 1) 화면의 표지를 그대로 사진으로 (버튼 등 data-nocapture는 제외) ──
  const rect = coverEl.getBoundingClientRect()
  // ⚠️ 예전엔 3배까지 키웠다 — 폭 360px 화면이면 픽셀이 «9배»가 되어 캡처가 하염없이 느렸다.
  //    2 로 낮춰도 액자 안에서 1080px 폭을 채운다(창업자 *"너무 느려졌어 한참기다려야해"*).
  const scale = Math.min(2, 1080 / Math.max(1, rect.width))
  let coverUrl
  try {
    // ⏱ **12초 제한** — 캡처가 안 끝나면 로딩만 돌고 아무 말이 없다. 그게 유저에겐 먹통이다
    //    (창업자 2026-08-03 *"로딩은 돌아가. 그다음이 안돼"*). 끝나든 못 끝나든 **말은 한다.**
    coverUrl = await Promise.race([
      toPng(coverEl, {
        pixelRatio: scale,
        ...fontOpt,
        filter: (node) => !(node.dataset && 'nocapture' in node.dataset),
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('capture timeout')), 40000)),
    ])
  } catch (e) {
    return null
  }
  const coverImg = await loadImage(coverUrl)
  if (!coverImg) return null

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
  // 🚀 PNG → JPEG. 표지는 «그림»이라 무손실일 이유가 없는데 1.38MB 였다(창업자 캡처).
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92))
  if (!blob) return null
  const file = new File([blob], 'hankki-cover.jpg', { type: 'image/jpeg' })
  const recipeFile = recipeFilePromise ? await recipeFilePromise : null // 이미 병렬로 뜨는 중 → 거의 즉시
  const files = recipeFile ? [file, recipeFile] : [file]
  const has2 = files.length > 1
  return { files, title, text: `『${title}』 · 내가 꾸민 레시피 🧡 한끼${has2 ? ' · 재료·레시피 같이!' : ''}\n나도 만들기 → ${url}`, url }
}

// 📤 「내가 꾸민 표지 그대로」 보내기.
//   `prepared` = 미리 캡처가 돌려준 약속(Promise). 있으면 그걸 기다린다 — 이미 끝나 있으면 «즉시» 공유창이 열린다.
export async function shareDecoratedCover({ coverEl, title, info = [], appUrl, recipeEl = null, prepared = null }) {
  let payload = null
  try {
    payload = prepared ? await prepared : null
  } catch (e) {
    payload = null // 미리 캡처가 실패했으면 아래에서 지금 다시 만든다
  }
  if (!payload) payload = await buildCoverPayload({ coverEl, title, info, appUrl, recipeEl })
  if (!payload) return { ok: false, error: 'capture' }
  const { files, url } = payload
  const file = files[0]
  const has2 = files.length > 1
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
    // 📮📮 **허가가 끊긴 것이다 — 저장으로 밀지 않는다.** (창업자 2026-08-05 *"내가만든표지는안돼"*)
    //   폰 공유는 «누른 직후»에만 열리는데 표지 캡처가 십수 초 걸려 그 사이 허가가 만료된다.
    //   ⭐ 만든 파일을 그대로 돌려주면, 화면이 「지금 보내기」 버튼을 띄운다 —
    //      그 버튼은 «새 터치»라 허가가 살아 있어 공유창이 반드시 열린다.
    return { ok: true, shared: false, pending: payload }
  }
  // 이 폰은 파일 공유 자체가 안 된다 → 저장 (표지＋레시피 둘 다)
  saveShareFiles(files)
  return { ok: true, shared: false }
}

// 📮 다 만들어 둔 파일을 «지금» 보낸다 — 반드시 «사용자가 누른 순간»에 부를 것.
export function sharePendingNow(payload) {
  const { files } = payload
  if (!(navigator.canShare && navigator.share)) return null
  if (navigator.canShare({ files })) return navigator.share(payload)
  if (files.length > 1 && navigator.canShare({ files: [files[0]] })) return navigator.share({ ...payload, files: [files[0]] })
  return null
}

// 💾 저장 — ⛔ `<a>` 를 DOM 에 «붙여야» click 이 먹는다(안 붙이면 아무 일도 안 일어난다).
export function saveShareFiles(files) {
  files.forEach((f, i) =>
    setTimeout(() => {
      const u = URL.createObjectURL(f)
      const a = document.createElement('a')
      a.href = u; a.download = f.name
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(u), 1500)
    }, i * 400)
  )
}

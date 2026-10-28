// 🍎 iOS 공유 다리 (2026-09-13) — Share Extension(ios-app/ios/App/ShareExtension) 이 App Group inbox 에 둔 것을
// 앱이 열릴 때 꺼내 온다. 돌려주는 모양은 안드로이드 shareIntake.js 와 «같다» → App.jsx 의 공유담기를 그대로 쓴다.
//
// ⛔ Apple 원문(open(_:completionHandler:) · 포럼 764570, 2026-09-13 열람): 공유 부품은 앱을 «직접 못 연다».
//    그래서 ①앱 시작 ②앱이 켜진 채 다시 앞으로 올 때(visibilitychange) ③hankki://share 로 깨어났을 때 — 세 자리에서 꺼낸다.
//    부품 쪽 consume 은 읽는 즉시 폴더를 지우므로 두 자리가 겹쳐 불러도 두 번 담기지 않는다.
// ⛔ nativeAuth.js 와 같은 규칙 — @capacitor/core 없이 window.Capacitor 만 쓴다(갤럭시·웹에선 조용히 빈 배열).

function 부품() {
  try {
    const w = window
    if (!w.Capacitor || !w.Capacitor.isNativePlatform || !w.Capacitor.isNativePlatform()) return null
    return (w.Capacitor.Plugins && w.Capacitor.Plugins.ShareIntake) || null
  } catch {
    return null
  }
}

export function iOS공유부품있나() {
  return !!부품()
}

// 🖼🖼 **[2026-09-13 22:31 · 17판 딸 폰 실물] 같은 캡처를 네 번 공유했더니 네 번 담기고 열쇠가 «셋» 깎였다(29→26).**
//   ⛔ 서버 지문 장부는 «바이트»가 같아야 한 번만 깎는데, 아이폰은 공유할 때마다 사진을 새로 내보내 바이트가 조금씩 다르다.
//   ✅ 그래서 앱이 «그림»으로 본다 — 작게 그려 픽셀을 비교해 한 번에 들어온 것 중 같은 그림은 하나만 담는다.
//      (유저가 「반응이 없네」 하고 또 누르는 게 제일 흔한 모양이다 — 그때 두 번 내게 두면 안 된다)
//   ⛔ 다른 사진 두 장(재료 장＋만드는 법 장)은 픽셀이 다르니 둘 다 담긴다.
async function 사진지문(dataUrl) {
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = dataUrl })
    const c = document.createElement('canvas'); c.width = 16; c.height = 16
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 16, 16)
    const d = g.getImageData(0, 0, 16, 16).data
    let s = ''
    for (let i = 0; i < d.length; i += 4) s += String.fromCharCode(32 + (((d[i] + d[i + 1] + d[i + 2]) / 3) >> 3))   // 회색 32단계
    return s + '|' + img.naturalWidth + 'x' + img.naturalHeight
  } catch { return null }
}
async function 같은그림빼기(items) {
  const 본것 = new Set(); const out = []
  for (const m of items) {
    const 첫장 = m.imageDataUrls && m.imageDataUrls[0]
    if (!첫장) { out.push(m); continue }
    const f = await 사진지문(첫장)
    if (f && 본것.has(f)) continue
    if (f) 본것.add(f)
    out.push(m)
  }
  return out
}

/** inbox 를 비우며 전부 돌려준다 — 오래된 것부터. 없으면 []. 같은 그림은 하나만. */
export async function consumeIosShared() {
  const p = 부품()
  if (!p) return []
  try {
    const r = await p.consume()
    const items = (r && Array.isArray(r.items)) ? r.items : []
    const 고른 = await 같은그림빼기(items.map((m) => ({ ...m, imageDataUrls: Array.isArray(m.imageDataUrls) ? m.imageDataUrls.filter(Boolean) : [] })))
    return 고른.map((m) => {
      const urls = Array.isArray(m.imageDataUrls) ? m.imageDataUrls.filter(Boolean) : []
      return {
        title: m.title || '',
        text: m.text || '',
        url: m.url || '',
        ts: Number(m.ts) || Date.now(),
        hasImage: urls.length > 0,
        imageCount: urls.length,
        imageDataUrl: urls[0] || null,
        imageDataUrls: urls,
      }
    })
  } catch {
    return []
  }
}

/** hankki://share 로 앱이 깨어났을 때 부른다. 돌려주는 함수로 해제. */
export function onIosShare(cb) {
  const p = 부품()
  if (!p || typeof p.addListener !== 'function') return () => {}
  let h = null
  try { h = p.addListener('shareReceived', () => { try { cb() } catch { /* noop */ } }) } catch { h = null }
  return () => {
    try {
      if (h && typeof h.then === 'function') h.then((x) => x && x.remove && x.remove())
      else if (h && h.remove) h.remove()
    } catch { /* noop */ }
  }
}

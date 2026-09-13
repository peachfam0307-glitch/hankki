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

/** inbox 를 비우며 전부 돌려준다 — 오래된 것부터. 없으면 []. */
export async function consumeIosShared() {
  const p = 부품()
  if (!p) return []
  try {
    const r = await p.consume()
    const items = (r && Array.isArray(r.items)) ? r.items : []
    return items.map((m) => {
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

// 서비스워커가 CacheStorage 에 넣어둔 '공유받기' 데이터를 앱 시작 시 꺼내온다.
const SHARE_CACHE = 'hankki-shared'

export async function consumeSharedIntake() {
  if (typeof caches === 'undefined') return null
  try {
    const cache = await caches.open(SHARE_CACHE)
    const metaRes = await cache.match('shared-meta')
    if (!metaRes) return null
    const meta = await metaRes.json()

    // 📄📄 [2026-08-28] 여러 장을 «순서대로» 꺼낸다 — 2장짜리 레시피(재료 장 ＋ 만드는 법 장)를 위해.
    //   ⛔ 옛 판은 `'shared-image'` 한 장만 봤다. 그래서 두 장을 공유해도 한 장만 담겼다.
    //   ⭐ `imageDataUrl` 은 **첫 장**으로 그대로 둔다 — 이걸 쓰는 자리(표지 사진)가 있어서
    //      배열만 새로 더하는 편이 안전하다(있는 걸 없애면 조용히 깨진다).
    const imageDataUrls = []
    if (meta.hasImage) {
      const n = Number(meta.imageCount) || 1
      for (let i = 0; i < n; i++) {
        // ⚠️ 옛 서비스워커가 넣어둔 게 남아 있을 수 있다 — 그때 키는 `shared-image` 였다.
        const imgRes = (await cache.match(`shared-image-${i}`)) || (i === 0 ? await cache.match('shared-image') : null)
        if (!imgRes) continue
        const du = await blobToDataUrl(await imgRes.blob())
        if (du) imageDataUrls.push(du)
      }
    }
    // 한 번 소비하면 정리
    await cache.delete('shared-meta')
    await cache.delete('shared-image')
    for (let i = 0; i < 12; i++) await cache.delete(`shared-image-${i}`)
    return { ...meta, imageDataUrl: imageDataUrls[0] || null, imageDataUrls }
  } catch {
    return null
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => resolve(null)
    r.readAsDataURL(blob)
  })
}

// 공유 텍스트/URL 안에서 링크와 출처를 추론
export function detectSource(url = '', text = '') {
  const hay = (url + ' ' + text).toLowerCase()
  if (hay.includes('instagram.com')) return 'instagram'
  if (hay.includes('youtube.com') || hay.includes('youtu.be')) return 'youtube'
  if (url) return 'link'
  return 'manual'
}

export function firstUrl(...vals) {
  for (const v of vals) {
    if (!v) continue
    const m = v.match(/https?:\/\/[^\s]+/)
    if (m) return m[0]
  }
  return ''
}

// 공유된 텍스트에서 링크를 뺀 캡션만 추출 (인스타 캡션 등)
export function captionFrom(text = '') {
  return String(text || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 캡션 첫 줄을 제목 후보로 (너무 길면 잘라줌)
export function firstLine(s = '', max = 40) {
  const line = String(s || '')
    .split('\n')
    .map((x) => x.trim())
    .find(Boolean)
  if (!line) return ''
  return line.length > max ? line.slice(0, max).trim() + '…' : line
}

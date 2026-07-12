// 서비스워커가 CacheStorage 에 넣어둔 '공유받기' 데이터를 앱 시작 시 꺼내온다.
const SHARE_CACHE = 'hankki-shared'

export async function consumeSharedIntake() {
  if (typeof caches === 'undefined') return null
  try {
    const cache = await caches.open(SHARE_CACHE)
    const metaRes = await cache.match('shared-meta')
    if (!metaRes) return null
    const meta = await metaRes.json()

    let imageDataUrl = null
    if (meta.hasImage) {
      const imgRes = await cache.match('shared-image')
      if (imgRes) {
        const blob = await imgRes.blob()
        imageDataUrl = await blobToDataUrl(blob)
      }
    }
    // 한 번 소비하면 정리
    await cache.delete('shared-meta')
    await cache.delete('shared-image')
    return { ...meta, imageDataUrl }
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

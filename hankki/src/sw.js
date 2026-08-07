// 한끼 커스텀 서비스워커
// - 앱 자산 프리캐시(오프라인)
// - 폰트/이미지 런타임 캐시
// - '공유받기(share_target)': 안드로이드 공유 시트 → 한끼 로 들어온 링크/사진을 가로채 저장
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

precacheAndRoute(self.__WB_MANIFEST || [])

// 새 버전이 배포되면 즉시 반영되도록: 대기 없이 활성화 + 모든 탭 장악
self.skipWaiting()
clientsClaim()

// 🖼🖼 **우리 그림(스티커·배경·아이콘) — 「미리 다 받기」가 아니라 「본 것만 갖고 있기」**
//
// ⛔ 2026-08-05 이전엔 이 그림들이 전부 precache 에 있었다.
//    앱을 처음 켜면 **1418장 · 212MB** 를 먼저 내려받고 나서야 화면이 떴다.
//    쓰지도 않을 계절 스티커까지 전부. (`vite.config.js` 의 globIgnores 주석에 자세히)
//
// ✅ 지금은 여기서 받는다 — **CacheFirst** 라 한 번 받은 그림은 캐시에서 바로 나온다.
//    ⭐ 오프라인도 산다: 한 번이라도 본 그림은 계속 뜬다. 안 본 그림만 못 뜬다.
//    ⚠️ maxEntries 는 지금 스티커 수(약 1420)보다 넉넉히 잡는다 — 모자라면
//       오래된 것부터 지워져서 «봤던 그림이 다시 사라진다».
//    ⚠️ purgeOnQuotaError = 저장공간이 꽉 차면 이 캐시부터 비운다. 안 넣으면
//       브라우저가 «앱 데이터 전체»를 날릴 수 있다(저장한 레시피까지).
registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === 'image',
  new CacheFirst({
    cacheName: 'hankki-art',
    plugins: [new ExpirationPlugin({ maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365, purgeOnQuotaError: true })],
  })
)

// 🔤🔤 **꾸미기 글씨체 — 그림과 «같은 처방»** (2026-08-07)
//
// ⛔ woff2 는 `globPatterns` 에서 일부러 빠져 있다 — 설치할 때 1.7MB 를 미리 받지 않으려고.
//    그건 맞는 판단인데, **런타임 캐시가 없어서 「받은 뒤에도 오프라인이면 못 쓰는」** 상태였다.
//    (그림은 `hankki-art` 로 이미 이렇게 하고 있었다. 폰트만 빠져 있었다)
//
// ✅ 그림과 똑같이 — 한 번 쓴 글씨체는 캐시에서 나온다. 안 쓴 건 안 받는다.
//    ⚠️ 판정은 `request.destination === 'font'` — @font-face 로 부르면 이 값이 온다.
//       ⛔ `fetch(url)` 로 부르면 `''` 라 안 걸린다(그림에서 이미 겪은 함정).
//    ⚠️⚠️ maxEntries 는 **글꼴 수 × 2(라틴·한글)보다 넉넉히** 잡는다.
//       딱 맞게 잡으면 파일 하나만 더 들어와도 오래된 것부터 지워져 **쓰던 글씨체가 다시 사라진다**
//       (그림 캐시에 이미 적어둔 함정이다). 지금 글씨체 **열둘 → 24개** ＋ 여유 → 40.
registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === 'font',
  new CacheFirst({
    cacheName: 'hankki-font',
    plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365, purgeOnQuotaError: true })],
  })
)

// Pretendard 폰트
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: 'jsdelivr-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
)

// 레시피 사진
registerRoute(
  ({ url }) => url.origin === 'https://images.unsplash.com',
  new CacheFirst({
    cacheName: 'recipe-images',
    plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 60 })],
  })
)

// OCR(tesseract.js) 워커·코어·언어데이터 — 첫 사용 후 오프라인에서도 동작하도록 캐시
registerRoute(
  ({ url }) =>
    url.origin === 'https://tessdata.projectnaptha.com' ||
    url.origin === 'https://unpkg.com' ||
    (url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('tesseract')),
  new CacheFirst({
    cacheName: 'ocr-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
)

const SHARE_CACHE = 'hankki-shared'

// 공유로 들어온 데이터는 CacheStorage 에 잠깐 넣고, 앱을 열어(리다이렉트) 앱이 꺼내가도록 한다.
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShare(req))
  }
})

async function handleShare(req) {
  try {
    const form = await req.formData()
    const meta = {
      title: (form.get('title') || '').toString(),
      text: (form.get('text') || '').toString(),
      url: (form.get('url') || '').toString(),
      ts: Date.now(),
      hasImage: false,
    }
    const image = form.get('image')
    const cache = await caches.open(SHARE_CACHE)
    if (image && typeof image !== 'string' && image.size > 0) {
      const buf = await image.arrayBuffer()
      await cache.put(
        'shared-image',
        new Response(buf, { headers: { 'Content-Type': image.type || 'image/*' } })
      )
      meta.hasImage = true
    }
    await cache.put(
      'shared-meta',
      new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } })
    )
  } catch (e) {
    // 공유 파싱 실패 시에도 앱은 그냥 정상 실행
  }
  // 앱을 열고, 앱이 공유 데이터를 꺼내 처리하도록 신호.
  return Response.redirect('./?share=1', 303)
}

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

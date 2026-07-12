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

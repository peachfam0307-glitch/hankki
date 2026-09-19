// 한끼 커스텀 서비스워커
// - 앱 자산 프리캐시(오프라인)
// - 폰트/이미지 런타임 캐시
// - '공유받기(share_target)': 안드로이드 공유 시트 → 한끼 로 들어온 링크/사진을 가로채 저장
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
// 🧊 [2026-09-19] 유통기한 «얹기» — 거울(hankki-shared/pantry-expiry)을 «그리는 순간» 읽어 남은 날을 다시 센다(낡지 않는다)
import { 거울읽어문장, 거울캐시 } from './pantryExpiry.js'

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
    // 📄📄 [2026-08-28] **여러 장을 «전부» 받는다.**
    //   📮 창업자 실물 = 두 장짜리 레시피(탕수육)를 «한 번에» 공유했는데 **둘째 장만** 담겼다.
    //      첫 장의 재료 6개와 걸음 1~7 이 통째로 사라져서 제목이 「풀리게 저어주다가」가 됐다.
    //   ⛔⛔ 뿌리가 «둘»이었다 —
    //      ⑴ `form.get('image')` 는 **첫 장 하나**만 준다(`getAll` 이 아니다)
    //      ⑵ 담는 자리가 `'shared-image'` **고정 키 하나**라, 설령 여러 장을 꺼내도 **서로 덮는다**
    //   ⭐ 안드로이드 인텐트는 «이미» 도착하고 있다 — 창업자가 두 장을 한 번에 공유했을 때 앱이 열렸다.
    //      그러니 받는 쪽만 고치면 된다(⛔AAB 를 다시 굽는 일이 아니다).
    const images = form.getAll('image').filter((f) => f && typeof f !== 'string' && f.size > 0)
    const cache = await caches.open(SHARE_CACHE)
    for (let i = 0; i < images.length; i++) {
      const buf = await images[i].arrayBuffer()
      await cache.put(
        `shared-image-${i}`,
        new Response(buf, { headers: { 'Content-Type': images[i].type || 'image/*' } })
      )
    }
    meta.hasImage = images.length > 0
    meta.imageCount = images.length
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

// 🔔🔔 **폰 알림(웹 푸시)** — 2026-09-19 · 설계 = `docs/알림-설계-2026-09-19.md`
//
// 📮 창업자 = *"월,수 레시피 토 장바구니 올라갈때 · 새 꾸미기 오픈 · 유통기한임박 이렇게 알람보내는거 어때"*
//
// ⛔⛔ **왜 필요했나 — 우리는 유저를 «부를 길»이 하나도 없었다.**
//    🔢 실측 2026-09-19 = 푸시 코드 **0줄** · 30일 활성 242명인데 **하루 활성 8명**(3.3%).
//       즉 «스스로 기억해서» 아이콘을 눌러야만 돌아온다. 한 달에 한 번 여는 앱이 된 게 당연하다.
//    ⭐ 그래서 「앱이 별로라 안 돌아온다」는 **아직 관측된 적이 없다** — 「부를 길이 없다」만 확인된 사실이다.
//       이 둘을 «가르는 실험»이 이 코드다.
//
// ⛔⛔⛔ **이 파일은 유저 242명 폰에서 «지금 돌고 있다».** 그래서 규칙이 하나 —
//    **여기 아래 두 리스너만 더한다. 위의 `fetch`·공유받기(share_target)·캐시 규칙은 «한 글자도» 안 건드린다.**
//    🔢 까닭 = 위 `skipWaiting()`＋`clientsClaim()` 때문에 새 판이 «즉시» 모든 탭을 장악한다.
//       잘못되면 흰 화면이 뜨고, 유저는 앱을 지워야 복구된다. 우리는 배포 초록불만 보고 나간다.
//    🔒 지키는 판 = `scripts/_repro-푸시-0919.mjs` (「공유받기가 여전히 돈다」를 같이 본다)
//
// 🍎 **아이폰은 이 길로 «못 온다»** — 우리 아이폰 앱은 Capacitor(WKWebView)다.
//    🔢 근거 = WKWebView 엔 서비스워커·PushManager 가 아예 없다(열람 2026-09-19 · magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide).
//       iOS 의 Push API 는 「사파리 → 공유 → 홈 화면에 추가」한 PWA 전용이다.
//    ⭐ 그래서 아이폰은 **2판에서 APNs(@capacitor/push-notifications)**로 간다. 이 리스너는 웹·안드로이드(TWA) 몫이다.
//    ⛔ 부르는 쪽(앱)에서 `PushManager` 가 없으면 **권한 시트를 아예 안 띄운다** — 거짓 약속을 하지 않는다.

/** 📨 알림 하나를 그린다.
 *  ⛔ 보내는 쪽이 이상한 걸 보내도 «앱이 멎으면 안 된다» — 못 읽으면 기본 문구로 띄운다(절대원칙 34).
 *  ⭐ `tag` 를 쓰면 같은 이름의 알림이 «덮어써진다» — 혹시 두 번 와도 폰에는 하나만 남는다.
 *     (두 번 보내는 것 자체는 워커가 막는다. 이건 «마지막 그물»이다.)
 */
// 📨 워커는 «빈 푸시»를 보낸다(암호화 0줄 · worker-push.js 머리 참조) → 문구는 여기서 /today 로 가져온다.
//    ⛔ 가져오기가 실패해도 «반드시» 하나는 띄운다 — 크롬은 push 를 받고 알림을 안 띄우면 다음 푸시를 조용히 끊는다.
const PUSH_URL = 'https://hankki-push.annyeong-hankki.workers.dev'
async function 오늘문구(event) {
  try { if (event.data) { const v = event.data.json(); if (v && v.본문) return v } } catch (e) { /* 아래로 */ }
  try {
    const r = await fetch(PUSH_URL + '/today', { cache: 'no-store' })
    if (r.ok) return await r.json()
  } catch (e) { /* 아래로 */ }
  return {}
}
self.addEventListener('push', (event) => {
  event.waitUntil(Promise.all([오늘문구(event), 거울읽어문장(new Date())]).then(([값, 얹을줄]) => {
  const 제목 = String(값.제목 || '한끼')
  // 🧊 임박 재료가 있으면 한 줄 «얹는다» — 없거나 못 읽으면 원래 본문 그대로(추가 푸시 0 · 하루 한 번 그대로)
  const 본문 = String(값.본문 || '새로운 소식이 있어요') + (얹을줄 ? ' · ' + 얹을줄 : '')
  const 길 = String(값.길 || './')
  const 표 = String(값.표 || 'hankki')
  return self.registration.showNotification(제목, {
      body: 본문,
      // 🖼 아이콘은 매니페스트가 쓰는 «그 파일»이다 — 두 곳에 적지 않는다.
      icon: new URL('icons/icon-192-v7.png', self.registration.scope).href,
      badge: new URL('icons/icon-192-v7.png', self.registration.scope).href,
      tag: 표,
      renotify: false,
      data: { 길 },
    })
  }))
})

/** 👆 알림을 누르면 — 이미 열려 있는 한끼가 있으면 «그걸» 띄우고, 없으면 새로 연다.
 *  ⛔ 무조건 새 창을 열면 탭이 쌓인다(유저가 누를 때마다 하나씩).
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const 길 = new URL((event.notification.data && event.notification.data.길) || './', self.registration.scope).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((창들) => {
      for (const 창 of 창들) {
        if (창.url.startsWith(self.registration.scope) && 'focus' in 창) {
          if ('navigate' in 창) { try { 창.navigate(길) } catch (e) { /* 못 옮겨도 띄우기는 한다 */ } }
          return 창.focus()
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(길) : undefined
    })
  )
})

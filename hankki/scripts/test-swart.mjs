// 🖼 «그림이 진짜 뜨나 · 오프라인에서도 뜨나» — 서비스워커 런타임 캐시 재현 검증
//
// ⛔⛔ **왜 필요한가 (2026-08-05)**
//   스티커 그림을 precache(설치할 때 미리 다 받기)에서 빼고
//   `src/sw.js` 의 CacheFirst 런타임 캐시(쓸 때 받기)로 옮겼다. 215MB → 4.1MB.
//   ⚠️ 그런데 **크기만 재면 「아무것도 안 받게」 만들어 놓고도 통과한다.**
//      그림이 안 뜨는 앱이 되는 것이다. 그래서 «실제로 띄워서» 본다.
//
// 세 가지를 순서대로 재현한다
//   ① 서비스워커가 진짜 켜지나 (controller 가 붙나)
//   ② 온라인에서 스티커 그림이 뜨나 (naturalWidth > 0 — src 만 있고 안 뜨는 걸 가려낸다)
//   ③ **오프라인으로 끊고** 새로 고쳐도 «봤던» 그림이 그대로 뜨나 ← 런타임 캐시가 사는지
//
// ⚠️ ③이 핵심이다. precache 를 뺐으니 「오프라인에서 다 죽는 것 아니냐」가 당연한 걱정인데,
//    CacheFirst 는 한 번 받은 것을 캐시에 남긴다 — 그걸 눈이 아니라 기계로 확인한다.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
if (!existsSync(join(ROOT, 'dist/index.html'))) {
  console.log('⏭  서비스워커 그림 검사 건너뜀 — dist 가 없다 (먼저 `npm run build`)')
  process.exit(0)
}

const HOST = '127.0.0.1'
const PORT = 4179                      // ⚠️ smoke(4173) 와 겹치지 않게
const BASE = `http://${HOST}:${PORT}/`
const CHROMIUM = process.env.SMOKE_CHROMIUM || undefined

let out = ''
const waitHttp = async (url, timeout = 45000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    try { const r = await fetch(url); if (r.status < 500) return } catch { /* 아직 */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`preview 안 뜸\n${out.slice(-800)}`)
}

let server, browser
const fails = []
const done = (code) => {
  try { browser?.close() } catch { /* noop */ }
  try { if (server && !server.killed) server.kill('SIGTERM') } catch { /* noop */ }
  process.exit(code)
}

try {
  server = spawn('npx', ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, env: process.env })
  server.stdout?.on('data', (d) => { out += d })
  server.stderr?.on('data', (d) => { out += d })
  await waitHttp(BASE)

  browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => {
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
      'hankki:coach:myrecipes', 'hankki:coach:editor'].forEach((k) => {
      try { localStorage.setItem(k, '1') } catch { /* noop */ }
    })
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(12000)

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // ── ① 서비스워커가 켜지나
  const swOn = await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null, null, { timeout: 25000 },
  ).then(() => true).catch(() => false)
  if (!swOn) fails.push('서비스워커가 안 켜졌다 (navigator.serviceWorker.controller 가 없다)')
  else console.log('  ✅ ① 서비스워커가 켜졌다')

  // ⭐⭐ **첫 방문엔 그림이 «서비스워커보다 먼저» 로드된다** — 그래서 SW 를 안 거치고,
  //    런타임 캐시가 텅 빈다. 2026-08-05 에 이걸 몰라서 «캐시가 안 먹는다»고 잘못 읽을 뻔했다.
  //    (캐시 저장소를 직접 열어 보니 hankki-art 가 «아예 없었다» → 새로고침하니 12개가 들어왔다)
  //    실사용에선 앱을 두 번째 켤 때부터 쌓인다. 검사도 똑같이 한 번 새로고침하고 본다.
  await page.waitForTimeout(2000)
  // ⚠️ 새로고침은 서비스워커를 한 번 거치느라 느리다 — 기본 12초로는 모자란다
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 })

  // ── ② 온라인에서 우리 그림이 뜨나
  //    ⚠️ src 가 박혀 있어도 «안 뜬» 그림이 있다 → naturalWidth 로 «진짜 그려졌나»를 본다.
  await page.waitForTimeout(3000)
  const shot = () => page.evaluate(() => {
    const imgs = [...document.images].filter((i) => {
      try { return new URL(i.currentSrc || i.src, location.href).origin === location.origin } catch { return false }
    })
    return {
      total: imgs.length,
      ok: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      urls: imgs.filter((i) => i.complete && i.naturalWidth > 0).map((i) => i.currentSrc || i.src).slice(0, 40),
    }
  })
  const on = await shot()
  if (on.total === 0) fails.push('화면에 우리 그림이 한 장도 없다 — 검사가 의미 없어졌다(선택자·화면이 바뀌었나)')
  else if (on.ok === 0) fails.push(`그림 ${on.total}장이 다 안 떴다 (naturalWidth=0)`)
  else console.log(`  ✅ ② 온라인 — 우리 그림 ${on.ok}/${on.total}장이 실제로 그려졌다`)

  // ── ③ 런타임 캐시(`hankki-art`)에 «실제로» 들어갔나 — 저장소를 직접 열어 센다
  const artN = await page.evaluate(async () => {
    if (!(await caches.keys()).includes('hankki-art')) return -1
    return (await (await caches.open('hankki-art')).keys()).length
  })
  if (artN < 0) fails.push("런타임 캐시 'hankki-art' 가 «아예 없다» — src/sw.js 의 CacheFirst 라우트가 안 걸린다")
  else if (artN === 0) fails.push("'hankki-art' 가 비어 있다 — 라우트는 있는데 그림이 안 담긴다")
  else console.log(`  ✅ ③ 런타임 캐시 'hankki-art' 에 ${artN}장 담겼다`)

  // ── ④ 오프라인으로 끊고, 봤던 그림이 캐시에서 나오나
  //    ⚠️ **`fetch(url)` 로 재면 안 된다** — fetch 요청은 request.destination 이 '' 라
  //       `destination === 'image'` 조건에 안 걸린다. 2026-08-05 에 이걸로 «캐시가 죽었다»고
  //       잘못 읽을 뻔했다. 실제 화면과 똑같이 **`new Image()`** 로 재야 한다.
  if (on.ok > 0) {
    await ctx.setOffline(true)
    const cached = await page.evaluate(async (urls) => {
      const one = (u) => new Promise((res) => {
        const im = new Image()
        im.onload = () => res(im.naturalWidth > 0)
        im.onerror = () => res(false)
        im.src = u
      })
      const r = await Promise.all(urls.map(one))
      return { n: r.length, ok: r.filter(Boolean).length }
    }, on.urls.slice(0, 8))
    await ctx.setOffline(false)
    if (cached.ok === 0) fails.push(`오프라인에서 봤던 그림 ${cached.n}장이 전부 안 나온다 — 런타임 캐시가 안 먹는다`)
    else if (cached.ok < cached.n) console.log(`  ⚠️ ④ 오프라인 — ${cached.ok}/${cached.n}장만 캐시에서 나왔다`)
    else console.log(`  ✅ ④ 오프라인 — 봤던 그림 ${cached.ok}/${cached.n}장이 캐시에서 그대로 나온다`)
  }
} catch (e) {
  fails.push(`검사 자체가 죽었다 — ${String(e.message || e).split('\n')[0]}`)
}

if (fails.length) {
  console.error('\n⛔ 서비스워커 그림 검사 실패')
  for (const f of fails) console.error('   · ' + f)
  console.error('\n👉 볼 곳 — `src/sw.js` 의 CacheFirst 라우트(우리 그림) ＋ `vite.config.js` 의 globIgnores')
  console.error('   그림을 precache 에서 뺐으니 «런타임 캐시»가 그 자리를 대신해야 한다. 둘 중 하나가 빠지면 여기서 죽는다.')
  done(1)
}
console.log('✅ 서비스워커 그림 검사 통과 — 켜지고 · 뜨고 · 오프라인에서도 남는다')
done(0)

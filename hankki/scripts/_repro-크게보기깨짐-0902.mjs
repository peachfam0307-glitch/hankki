// 🔍🔍 「채우러 가기 → 크게 보기」에서 캡처가 «깨져» 보인다 — 창업자 폰 제보 2026-09-02 〔조사판〕
//
// 📮 창업자 = *"채우러가기 눌렀는데 이래"* ＋ 캡처 — 「크게 보기」가 열렸는데
//    사진 자리에 **깨진 이미지 아이콘**만 있다(alt 「캡처 1」이 글자로 보인다).
//
// ⭐ 짐작 = 사진 이사(v12.24) 뒤로 `editing.image` 가 쪽지(`idb://…`)라
//    `refs` 가 그 쪽지를 «날것으로» `<img src>` 에 넣는다(`EditorScreen.jsx:840·1316`).
//    ⛔ 그런데 `:234` 의 꺼내기 효과가 있으니 «걸려야» 한다. 그래서 재현으로 «사실»을 본다.
//
// 실행: node scripts/_repro-크게보기깨짐-0902.mjs
// 🏷 이름표 = 조사판 (원인을 확정하면 재현판으로 옮긴다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4498, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

// ⭐ 창업자 것과 «같은 모양»으로 심는다 = 정리 전(unsorted) ＋ 캡처 사진이 표지에 들어 있다
const 캡처 = 'data:image/png;base64,' + readFileSync(join(ROOT, 'src/assets/ui/key_one.png')).toString('base64')

const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4498/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1500)
await p0.evaluate((그림) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  s.recipes = [{
    id: 'zz-1', title: '사진 레시피', status: 'unsorted', source: 'photo',
    image: 그림, savedAt: Date.now(), ingredients: [], steps: [],
  }, ...(s.recipes || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 캡처)
await p0.close()

// ── 이사를 한 번 돌린다(껐다 켜기) ──
const p1 = await ctx.newPage()
await p1.goto('http://127.0.0.1:4498/hankki/', { waitUntil: 'networkidle' })
await p1.waitForTimeout(3500)
const 저장모양 = await p1.evaluate(() => {
  const r = (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).find((x) => x.id === 'zz-1')
  return { image앞: String(r?.image || '').slice(0, 24), status: r?.status }
})
console.log('① 이사 뒤 서랍에 든 값 =', JSON.stringify(저장모양))
await p1.close()

// ── 임시보관함 → 채우러 가기 ──
const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => { if (!/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(e.message)) 오류.push(e.message) })
await p.goto('http://127.0.0.1:4498/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)

// 홈 → 임시보관함
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '').includes('임시보관함'))
  if (b) b.click()
})
await p.waitForTimeout(1200)
console.log('② 임시보관함 열렸나 =', await p.evaluate(() => /임시보관함/.test(document.body.innerText)))

// 「채우러 가기」
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /채우러/.test(x.innerText || ''))
  if (b) b.click()
})
await p.waitForTimeout(2500)

const 본것 = await p.evaluate(() => {
  const 그림들 = [...document.querySelectorAll('img')]
    .filter((i) => /캡처/.test(i.getAttribute('alt') || '') || i.closest('[class*=shot]'))
    .map((i) => ({
      alt: i.getAttribute('alt'),
      앞: String(i.getAttribute('src') || '').slice(0, 24),
      떴나: i.naturalWidth > 0,
    }))
  return { 편집화면인가: /레시피 정리|썸네일/.test(document.body.innerText), 그림들 }
})
console.log('③ 편집 화면인가 =', 본것.편집화면인가)
console.log('④ 캡처 그림들 =', JSON.stringify(본것.그림들, null, 1))
console.log('   pageerror =', 오류.length ? 오류.join(' · ') : 0)
await p.close()

// ══ 2번 판 — 「쪽지는 남았는데 창고가 비었다」 ═══════════════════════════
//   ⭐ 1번 판이 «멀쩡히 통과»했으므로 보통 길엔 문제가 없다. 그러면 남은 갈래는 이것이다:
//      이사 «전»에 축소 루프가 지웠거나, 옛날 저장 공간이 꽉 차 못 담겼던 편.
//   ⛔ 창업자에게 물어서는 못 가른다 — 사진으로 가져온 편은 «캡처를 표지로 안 쓰므로»
//      상세 화면이 사진 유무와 무관하게 아이콘을 그린다(`store.jsx` 의 `기본표지`).
//      📌 그래서 내가 직접 만들어 본다(규칙 8 — 창업자 시간을 안 쓴다).
console.log('\n══ 2번 판: 쪽지만 남고 창고가 비었을 때 ══')
const p2 = await ctx.newPage()
await p2.goto('http://127.0.0.1:4498/hankki/', { waitUntil: 'networkidle' })
await p2.waitForTimeout(2000)
// 창고를 비운다 — 서랍의 쪽지는 그대로 둔다
await p2.evaluate(() => new Promise((res) => {
  const req = indexedDB.deleteDatabase('hankki-photos')
  req.onsuccess = () => res(true); req.onerror = () => res(false); req.onblocked = () => res(false)
  setTimeout(() => res(false), 4000)
}))
await p2.close()

const p3 = await ctx.newPage()
const 오류3 = []
p3.on('pageerror', (e) => { if (!/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(e.message)) 오류3.push(e.message) })
await p3.goto('http://127.0.0.1:4498/hankki/', { waitUntil: 'networkidle' })
await p3.waitForTimeout(2500)
await p3.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '').includes('임시보관함'))
  if (b) b.click()
})
await p3.waitForTimeout(1200)
await p3.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /채우러/.test(x.innerText || ''))
  if (b) b.click()
})
await p3.waitForTimeout(3000)
const 본것2 = await p3.evaluate(() => [...document.querySelectorAll('img')]
  .filter((i) => /캡처/.test(i.getAttribute('alt') || ''))
  .map((i) => ({ alt: i.getAttribute('alt'), 앞: String(i.getAttribute('src') || '').slice(0, 24), 떴나: i.naturalWidth > 0 })))
console.log('⑤ 캡처 그림들 =', JSON.stringify(본것2, null, 1))
console.log('   pageerror =', 오류3.length ? 오류3.join(' · ') : 0)
console.log(본것2.some((x) => x.앞.startsWith('idb://') && !x.떴나)
  ? '\n🎯 재현됐다 — 쪽지가 그대로 <img> 에 들어가 «깨진 아이콘»이 된다 (창업자 화면과 같은 증상)'
  : '\n❓ 이 판으로도 재현이 안 된다 — 다른 갈래를 더 봐야 한다')

await b.close(); srv.close()

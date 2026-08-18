// 🔖 「책갈피가 무언가에 가려지나」 — **지금 코드 그대로** 잰다 (2026-08-18)
//
// ⛔⛔ 앞선 `_probe-인덱스걸침-0818.mjs` 는 **옛 놓기(B·C·D)를 얹어» 재는 판**이라
//    지금 코드(G3 · 26px · 카드 밖으로 14px)의 답이 아니다. 규칙 18 ⓘ —
//    「검사가 통과했나」가 아니라 «무엇을 보고 통과했나».
//
// 🎯 재는 것 셋 — 전부 **카드 밖으로 나가서** 생기는 것들이다
//    ⑴ **맨 윗줄**이 필터 칩 줄(`.hscroll`)에 가려지나 — 위로 14px 나가는데 그 위가 칩 줄이다
//    ⑵ 위 칸의 **이름표 글자**를 덮나
//    ⑶ 화면 **오른쪽 밖**으로 나가나
//
// ⭐ 아무것도 안 얹는다. `dist/` 를 그대로 띄워 «진짜 화면»을 잰다(규칙 30).
//
// 실행: node scripts/_probe-책갈피가림-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4393, r))

const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
const 샘플 = allBasicRecipes.find((r) => r.decor?.length)
const now = Date.now()
const 아이콘 = ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04']
// ⭐ 제목이 «긴 것»을 섞는다 — 이름표가 오른쪽 끝까지 오는 칸에서만 겹침이 생긴다
const 요리 = ['들깨나물무침', '돼지고기 김치찌개', '제육볶음', '소고기 미역국', '김치찌개', '오징어 애호박 덮밥', '두부조림', '무생채', '계란말이']
const R = (t, i) => (i === 0
  ? { ...샘플, id: 'x'.repeat(i + 1), title: t, savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0, sample: false }
  : { id: 'x'.repeat(i + 1), title: t, category: '한식', time: 15, thumb: 'icon', icon: 아이콘[i % 9], ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: i % 2 === 0, cooked: 0 })
const state = { recipes: 요리.map(R), diary: [], seedV: BASICS_VERSION }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
let 나쁨 = 0
console.log('\n📐 책갈피가 가려지나 — 지금 코드 그대로\n')
console.log('격자        책갈피  칩줄에 가림  이름표 덮음  화면밖   판정')
for (const [격자, 이름] of [['big', '큰(2열)'], ['small', '작은(3열)']]) {
  const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
  await page.addInitScript(({ s, g }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, { s: state, g: 격자 })
  await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1100)

  const 잰것 = await page.evaluate(() => {
    const 겹침 = (a, c) => Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left)) *
                            Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top))
    const 칩줄 = [...document.querySelectorAll('.hscroll')].find((e) => /전체/.test(e.textContent))
    const cr = 칩줄?.getBoundingClientRect()
    let 책갈피 = 0, 칩가림 = 0, 이름덮음 = 0, 화면밖 = 0
    for (const c of document.querySelectorAll('.grid-card')) {
      const img = c.querySelector('.fav-dot img')
      if (!img) continue
      const r = img.getBoundingClientRect()
      if (r.width === 0) continue
      책갈피++
      // ⑴ 칩 줄에 가리나 — 칩 줄이 «위에» 그려지면 그만큼 안 보인다
      if (cr && 겹침(r, cr) > 0) 칩가림++
      // ⑵ 다른 칸의 «이름표 글자»를 덮나
      //    ⛔⛔ 첫 판은 `.name` div 의 상자로 쟀는데 **그건 카드 폭 전체**라
      //       이름표가 왼쪽 정렬이면 오른쪽 빈칸에 걸쳐도 「덮었다」로 세어졌다(49건).
      //    ✅ Range 로 **글자가 실제로 차지하는 상자**를 잰다. 규칙 18 ⓘ.
      for (const g of document.querySelectorAll('.grid-card .name')) {
        if (c.contains(g)) continue
        const rg = document.createRange(); rg.selectNodeContents(g)
        if (겹침(r, rg.getBoundingClientRect()) > 0) { 이름덮음++; break }
      }
      // ⑶ 화면 오른쪽 밖
      if (r.right > window.innerWidth + 0.5) 화면밖++
    }
    return { 책갈피, 칩가림, 이름덮음, 화면밖 }
  })
  const ok = 잰것.칩가림 === 0 && 잰것.화면밖 === 0
  if (!ok) 나쁨++
  console.log(`${이름.padEnd(11)} ${String(잰것.책갈피).padStart(4)}  ${String(잰것.칩가림).padStart(9)}  ${String(잰것.이름덮음).padStart(10)}  ${String(잰것.화면밖).padStart(6)}   ${ok ? '✅' : '⛔'}`)
  await page.close()
}
await b.close(); srv.close()
console.log(나쁨
  ? '\n⛔ 가려지는 자리가 있다 — 위로 나가는 양(14px)이나 첫 줄 여백을 손봐야 한다\n'
  : '\n✅ 칩 줄에도 안 가리고 화면 밖으로도 안 나간다\n')
process.exit(나쁨 ? 1 : 0)

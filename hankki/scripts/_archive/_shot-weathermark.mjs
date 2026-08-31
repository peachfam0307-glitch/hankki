// ☀️ 날씨 「고른 표시」 후보 — 창업자 판정용 (2026-08-06)
//   창업자 *"그 동그라미 너무 별로야 ㅋㅋ 다른 방법을 생각해봐"*
//
// ⛔ 제약 = **아이콘 넷이 틀 «그림»에 인쇄돼 있다.** 개별로 흐리게·색칠 못 한다.
//    → 「안 고른 걸 흐리게」 같은 방법은 아예 불가능. **위에 얹는 것** 중에서만 고른다.
// ⭐ 그래서 후보는 넷 — 지금(동그라미) · 형광펜 · 밑줄 · 아래 점.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4349, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: [{ id: 'u1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user' }],
  diary: [{ id: 'dd', kind: 'diary', at: now, paper: { rule: 'lined', skin: 'ivory', art: 'photo' }, decor: [], note: '', weather: 'partly' }],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4349/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)

// 표시를 갈아끼운다 — 고른 버튼(aria-pressed=true) 안의 표시만 바꾼다
const MARKS = {
  '1-지금-동그라미': null, // 그대로
  // 📐 크기의 근거 — 버튼 폭 = 13.4cqw 인데 **그림의 아이콘은 4.0~4.6%** 다(papers.js 실측).
  //    지금 동그라미(10.5cqw)는 아이콘의 **2.3배**라 「갇힌」 것처럼 보였다(창업자 *"너무 커"*).
  //    → 아이콘을 살짝 감싸려면 버튼 폭의 **45~55%** 가 맞다.
  '2-형광펜': `
    el.style.cssText = 'position:absolute;left:50%;top:52%;width:52%;height:46%;'
      + 'transform:translate(-50%,-50%) rotate(-4deg);border-radius:48% 52% 50% 50%/50%;'
      + 'background:#f0d98a;opacity:.5;mix-blend-mode:multiply;'`,
  '3-밑줄': `
    el.style.cssText = 'position:absolute;left:50%;top:78%;width:74%;height:2.5px;'
      + 'transform:translateX(-50%) rotate(-1.5deg);'
      + 'background:#5b4436;opacity:.6;border-radius:2px;'`,
  '4-아래-점': `
    el.style.cssText = 'position:absolute;left:50%;top:84%;width:16%;aspect-ratio:1;'
      + 'transform:translateX(-50%);background:#5b4436;opacity:.55;border-radius:50%;'`,
  '5-얇은-손그림-원': `
    el.style.cssText = 'position:absolute;left:50%;top:50%;width:52%;height:50%;'
      + 'transform:translate(-50%,-50%) rotate(-6deg);border-radius:52% 48% 47% 53%/50%;'
      + 'border:1.3px solid #8a7a63;opacity:.75;'`,
  // ⭐ 「방식」이 아니라 「크기」가 문제였을 수도 — 지금 것을 아이콘에 맞춰 줄인 판
  '6-작은-동그라미': `
    el.style.cssText = 'position:absolute;left:50%;top:50%;width:56%;height:54%;'
      + 'transform:translate(-50%,-50%) rotate(-7deg) scaleX(1.08);border-radius:50%;'
      + 'border:1.6px solid #5b4436;opacity:.6;'`,
}

const clips = []
for (const [name, css] of Object.entries(MARKS)) {
  if (css) {
    await page.evaluate((code) => {
      const btn = document.querySelector('[aria-label^="날씨"][aria-pressed="true"]')
      if (!btn) return
      let el = btn.querySelector('span')
      if (!el) { el = document.createElement('span'); btn.appendChild(el) }
      // eslint-disable-next-line no-new-func
      new Function('el', code)(el)
    }, css)
  }
  await page.waitForTimeout(250)
  // 날씨 줄만 잘라 찍는다 — 크게 봐야 판정된다
  const paper = await page.locator('.paper').first().boundingBox()
  // ⚠️ 처음엔 y0.565~0.65 만 잘라 **밑줄·점이 클립 밖으로 나가 «안 보였다»** — 「없다」가 아니라 캡처가 틀렸다
  const clip = { x: paper.x + paper.width * 0.5, y: paper.y + paper.height * 0.545, width: paper.width * 0.48, height: paper.height * 0.12 }
  const p = join(OUT, `weather-${name}.png`)
  await page.screenshot({ path: p, clip })
  clips.push([name, p])
  console.log('   찍음', name)
}
await b.close(); srv.close()
console.log(JSON.stringify(clips.map(([n]) => n)))

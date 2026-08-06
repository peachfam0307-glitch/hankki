// 🍱 표지 버튼 — 「표지 «밖»으로 빼는 안」 (창업자 2026-08-06 *"표지밖으로 아이콘들을 빼는 건.?"*)
//
// ⛔ 어제 문서에 3안(표지 밖)을 «클로드 판단»으로 미리 쳐냈다 — *"찾기가 더 어려워져 뺀다"*.
//    그러면 안 된다. 규칙 = **후보로 올려 창업자 판정을 받는다.** (2026-08-01 꼬막 때와 같은 실수)
//
// ⭐ 표지 밖이 맞을 이유 = 창업자가 7/28 에 이미 두 번 말한 원칙 —
//    *"버튼이 7개야 그림 속에 · 간섭이 심해"* · 「레꾸가 주인공이라 표지를 최대한 안 가린다」
//    ＋ 표지는 **공유 카드로 찍혀 나가는 그림**이다. 밖으로 빼면 «가릴 일 자체»가 없어진다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-coverbtn2.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4342, r))

const { BASICS_VERSION, basicRecipes } = await import('../src/data/basics.js')
const now = Date.now()
const kong = basicRecipes.find((r) => r.title === '콩국수')
const recipes = [
  { id: 'u1', title: '오징어볶음', category: '한식', time: 20, servings: 2, difficulty: '보통', thumb: 'icon', icon: 'fe_75',
    ingredients: ['오징어 2마리'], steps: ['볶는다.'], tags: ['제철', '매운맛'], savedAt: now + 9e4, source: 'user', cooked: 1 },
  { id: 'u2', title: '들깨나물무침', category: '한식', time: 15, servings: 2, thumb: 'icon', icon: 'fe_143',
    decorBg: kong?.decorBg, decor: kong?.decor, ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: ['제철'], savedAt: now + 8e4, source: 'user', cooked: 3 },
]

// 시안 — `out` 이 true 면 버튼을 표지 «밖»(표지 바로 아래 줄)으로 옮긴다
const VARIANTS = [
  { key: 'C', name: 'C. 표지 안 · 아이콘만', note: '지금 크기 그대로 · 글자 없음',
    out: 'none', left: { pill: false, label: '', icon: 22 }, right: { label: '레시피 꾸미기' } },
  { key: 'E', name: 'E. 둘 다 표지 밖', note: '표지가 통째로 깨끗해진다',
    out: 'both', left: { pill: true, label: '아이콘 바꾸기', icon: 20 }, right: { label: '레시피 꾸미기' } },
  { key: 'F', name: 'F. 아이콘만 밖 · 꾸미기는 표지 안', note: '주 동작은 표지에 남긴다',
    out: 'left', left: { pill: true, label: '아이콘 바꾸기', icon: 20 }, right: { label: '레시피 꾸미기' } },
]

const W = 360
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 3 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes, diary: [], seedV: BASICS_VERSION })

const shots = {}
for (const [ci, rc] of recipes.entries()) {
  for (const v of VARIANTS) {
    await page.goto('http://127.0.0.1:4342/hankki/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    // ⛔ 순번(nth)으로 누르지 말 것 — 한 번 엉뚱한 레시피가 찍혔다. **제목으로** 누른다.
    await page.locator('.grid-card', { hasText: rc.title }).first().click()
    await page.waitForTimeout(900)
    const opened = (await page.locator('.h-title').last().innerText()).trim()
    if (opened !== rc.title) throw new Error(`엉뚱한 레시피가 열렸다 — 원한 것 「${rc.title}」 · 열린 것 「${opened}」`)

    await page.evaluate((vv) => {
      const L = document.querySelector('[aria-label="표지 아이콘 바꾸기"]')
      const R = document.querySelector('[aria-label="레시피 꾸미기"]')
      const cover = L.parentElement
      const icoHTML = L.innerHTML.match(/<(img|svg)[\s\S]*?<\/\1>|<img[^>]*>/)[0]

      // 표지 밖 줄 — 표지 바로 아래, 제목 위
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;gap:8px;align-items:center;padding:12px 20px 0;'
      cover.after(row)

      const outStyle = (el, filled) => {
        el.style.cssText = `position:static;display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 13px 0 ${filled ? 13 : 9}px;`
          + `border-radius:999px;font-size:12.5px;font-weight:800;border:none;`
          + (filled ? 'background:var(--brown);color:#fff;' : 'background:var(--cream);color:var(--brown);')
      }

      // ── 왼쪽 ──
      L.innerHTML = icoHTML + (vv.left.label || '')
      const ico = L.querySelector('img, svg')
      if (ico) { ico.style.width = vv.left.icon + 'px'; ico.style.height = vv.left.icon + 'px' }
      if (vv.out === 'both' || vv.out === 'left') { row.appendChild(L); outStyle(L, false) }
      else if (!vv.left.pill) Object.assign(L.style, { width: '34px', height: '34px', padding: '0', gap: '0', fontSize: '0px', justifyContent: 'center' })

      // ── 오른쪽 ──
      if (vv.out === 'both') { row.appendChild(R); outStyle(R, true) }

      if (!row.children.length) row.remove()
    }, v)
    await page.waitForTimeout(300)

    // 표지 ＋ 그 아래 줄 ＋ 제목까지 담는다 (밖으로 뺀 게 어떻게 보이는지 봐야 하니까)
    const box = await page.locator('.h-title').last().boundingBox()
    await page.screenshot({ path: join(OUT, `_cb2-${ci}${v.key}.png`), clip: { x: 0, y: 56, width: W, height: Math.min(880 - 56, box.y + box.height + 14 - 56) } })
    shots[`${ci}${v.key}`] = 'data:image/png;base64,' + readFileSync(join(OUT, `_cb2-${ci}${v.key}.png`)).toString('base64')
  }
}

const cssHref = (readFileSync(join(DIST, 'index.html'), 'utf8').match(/href="[^"]*?(assets\/[^"]+\.css)"/) || [])[1]
const card = (ci, v) => `<div class="v"><div class="vh"><b>${v.name}</b><span>${v.note}</span></div><div class="vs"><img src="${shots[`${ci}${v.key}`]}"></div></div>`
const html = `<meta charset="utf-8"><link rel="stylesheet" href="/hankki/${cssHref}">
<style>
  body{margin:0;background:#e9e5dd;font-family:'Pretendard',system-ui,sans-serif;padding:22px}
  h2{font-size:19px;margin:0 0 4px;color:#3a322a}
  .sub{font-size:13px;color:#7b7168;margin:0 0 18px}
  .row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:26px;align-items:flex-start}
  .v{width:330px}
  .vh{margin-bottom:7px}
  .vh b{display:block;font-size:14px;color:#3a322a}
  .vh span{font-size:11.5px;color:#8b8177}
  .vs{border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,.13)}
  .vs img{display:block;width:100%}
</style>
<h2>🍱 표지 «밖»으로 빼는 안 — 폭 360px 실물</h2>
<p class="sub">진짜 앱에서 버튼을 실제로 표지 밖으로 옮겨 찍은 것. 표지는 공유 카드로 찍혀 나가는 그림이라, 밖으로 빼면 가릴 일이 아예 없어진다.</p>
<h2>ⓐ 안 꾸민 표지</h2>
<div class="row">${VARIANTS.map((v) => card(0, v)).join('')}</div>
<h2>ⓑ 꾸민 표지</h2>
<div class="row">${VARIANTS.map((v) => card(1, v)).join('')}</div>`
writeFileSync(join(OUT, '_coverbtn2.html'), html)

const sheet = await b.newPage({ viewport: { width: 1120, height: 900 }, deviceScaleFactor: 2 })
await sheet.goto('http://127.0.0.1:4342/hankki/')
await sheet.setContent(html, { waitUntil: 'networkidle' })
await sheet.waitForTimeout(900)
await sheet.screenshot({ path: join(OUT, '표지버튼-밖으로.png'), fullPage: true })
console.log('→ /표지버튼-밖으로.png')
await b.close(); srv.close()

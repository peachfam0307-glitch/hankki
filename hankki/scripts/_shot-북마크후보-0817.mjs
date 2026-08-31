// 🔖 북마크 그림 후보 — 창업자 판정용 (2026-08-17)
//
// 📮 창업자 *"북마크(이미지를) **예쁜걸로** 바꾸고"* · *"클립모양 인덱스나.. 아님.. 음식으로 뭐가 예쁠까"*
// 📮 → 만들어 보여주니 *"**북마크아이콘 안예뻐.**"*
//
// ⭐ 「예쁜가」는 내가 못 정한다(규칙 11) — **실제 카드 위에 얹어** 나란히 보여주고 창업자가 고른다.
//    ⛔ 앱 코드에 후보를 심지 않는다 — 판정용 그림 여섯을 코드에 넣으면 하나만 남기고 다 죽은 코드가 된다.
//       대신 **화면에 뜬 svg 의 `d` 를 그 자리에서 갈아끼운다.** 앱은 한 글자도 안 바뀐다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-북마크후보-0817.mjs
import './_fresh.mjs'
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
await new Promise((r) => srv.listen(4366, r))

// 🎨 후보 여섯 — 전부 24×24 기준. **작아도 실루엣이 읽히는 것**만 골랐다(카드 위에서 19px 다).
//    ⛔ 우리 데코 PNG(리본·클립·꽃)는 원본이 289~418px 이라 19px 로 줄이면 형태가 뭉개진다 → SVG 로 그렸다.
const 후보 = [
  ['① 지금 것', 'M6 4h12v16l-6-4-6 4z'],
  ['② 깊은 리본', 'M6.6 3.4h10.8a1.1 1.1 0 0 1 1.1 1.1v16.1l-6.5-5.1-6.5 5.1V4.5a1.1 1.1 0 0 1 1.1-1.1z'],
  ['③ 하트', 'M12 20.6C7 17.1 4 14.3 4 10.9A4.3 4.3 0 0 1 12 8.4a4.3 4.3 0 0 1 8 2.5c0 3.4-3 6.2-8 9.7z'],
  ['④ 인덱스 탭', 'M5.4 3.6h13.2v14.6l-3.3-2.6-3.3 2.6-3.3-2.6-3.3 2.6z'],
  ['⑤ 둥근 라벨', 'M12 3.2l7.4 3.1v6.5c0 4.3-3.1 7-7.4 8.6-4.3-1.6-7.4-4.3-7.4-8.6V6.3z'],
  ['⑥ 통통 책갈피', 'M8 3h8a2.4 2.4 0 0 1 2.4 2.4v14.2c0 .9-1 1.4-1.7.8L12 16.4l-4.7 4c-.7.6-1.7.1-1.7-.8V5.4A2.4 2.4 0 0 1 8 3z'],
]

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const R = (id, title, icon) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0 })
const state = {
  recipes: [
    R('a', '들깨나물무침', 'fe_143'), R('bb', '콩나물국', 'fh_k02'), R('ccc', '제육볶음', 'fe_18'),
    R('dddd', '된장찌개', 'fe_133'), R('eeeee', '김치찌개', 'fe_128'), R('ffffff', '어묵탕', 'fh_k18'),
  ],
  diary: [], seedV: BASICS_VERSION,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'big')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4366/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)

// ⭐ 카드마다 «다른 후보»를 얹는다 — 한 화면에서 나란히 견준다. ＋ 이름표를 카드 위에 박는다.
const 붙였나 = await page.evaluate((cands) => {
  const dots = [...document.querySelectorAll('.fav-dot')]
  dots.forEach((d, i) => {
    const c = cands[i % cands.length]
    const p = d.querySelector('svg path')
    if (p) p.setAttribute('d', c[1])
    const tag = document.createElement('span')
    tag.textContent = c[0]
    tag.style.cssText = 'position:absolute;left:8px;top:10px;background:rgba(255,255,255,.92);border-radius:8px;padding:2px 7px;font-size:11px;font-weight:800;color:#5d3410;z-index:5'
    d.parentElement.appendChild(tag)
  })
  return dots.length
}, 후보)
console.log(`   🔢 카드 ${붙였나}개에 후보를 얹었다`)
await page.waitForTimeout(300)
await page.screenshot({ path: join(OUT, '북마크후보-1-카드위.png') })

// 🔍 3배 확대 판 — 작으면 판정이 안 된다(검수 원칙 ⑥과 같은 이유)
await page.evaluate((cands) => {
  document.body.innerHTML = ''
  document.body.style.cssText = 'background:#f2ede3;margin:0;padding:20px;font-family:sans-serif'
  const wrap = document.createElement('div')
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:14px'
  for (const [name, d] of cands) {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:14px'
    const label = document.createElement('span')
    label.textContent = name
    label.style.cssText = 'width:96px;font-size:14px;font-weight:800;color:#5d3410'
    const svgs = document.createElement('span')
    svgs.style.cssText = 'display:flex;align-items:center;gap:16px'
    for (const [size, bg] of [[19, '#fff'], [57, '#fff'], [57, '#5d3410']]) {
      const box = document.createElement('span')
      box.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:${size + 16}px;height:${size + 16}px;border-radius:50%;background:${bg}`
      box.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${bg === '#fff' ? '#5d3410' : '#fff'}" stroke="${bg === '#fff' ? '#5d3410' : '#fff'}" stroke-width="1.6" stroke-linejoin="round"><path d="${d}"/></svg>`
      svgs.appendChild(box)
    }
    row.appendChild(label); row.appendChild(svgs); wrap.appendChild(row)
  }
  const head = document.createElement('div')
  head.textContent = '실제 크기(19px) · 3배 · 어두운 바탕'
  head.style.cssText = 'font-size:13px;font-weight:800;color:#8a7a68;margin:0 0 12px 110px'
  document.body.appendChild(head); document.body.appendChild(wrap)
}, 후보)
await page.waitForTimeout(300)
await page.screenshot({ path: join(OUT, '북마크후보-2-확대.png'), fullPage: true })

await b.close(); srv.close()
console.log('\n✅ 후보 판 완료 →', OUT, '\n')

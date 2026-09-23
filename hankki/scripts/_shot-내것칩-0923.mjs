// 👤 「내 것」 칩 — 창업자 판정용 실물 (2026-09-23)
//
// 📮 한끼연구소 폼 = *"제가쓴 레시피는 따로 폴더나 그런것도 만들어주세요 헷갈려요"*
// 📮 창업자 = *"내가 가져온 것 내가쓴건 전부. 따로 하나 만들어야 할 것 같아"*
//
// ⭐ 물어야 할 것 = 「칩이 뜨나」가 아니라 **「눌렀을 때 «내 것만» 나오나」**(규칙 21).
//    그래서 씨앗(basic-)과 내 것을 «섞어» 담고, 누른 «뒤»를 다시 찍는다.
//    ＋ 이름 후보 셋을 각각 찍는다 — 창업자가 글자를 보고 고른다(앱 글자는 창업자 것).
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_shot-내것칩-0923.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp/claude-0/내것칩'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4377, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const R = (id, title, icon, extra = {}) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 90000, status: 'sorted', favorite: false, cooked: 0, ...extra })
const state = {
  recipes: [
    // 🏠 한끼가 넣은 것 (basic-) — ⛔「내 것」에 «안» 들어야 한다. 하나는 출처 링크가 있어 SNS 칩엔 든다
    R('basic-1', '꽃게탕', 'fh_k02'),
    R('basic-2', '어남선생 오징어볶음', 'fe_18', { sourceUrl: 'https://www.youtube.com/watch?v=aaaa' }),
    R('basic-3', '된장찌개', 'fe_133'),
    // 👤 유저가 담은 것 — 직접 쓴 것 ＋ 가져온 것 «둘 다» 내 것이다
    R('u_1', '돼지고기 김치찌개', 'fh_k02'),
    R('u_22', '제육볶음', 'gr_387'),
    R('u_333', '릴스에서 본 마늘파스타', 'fh_k18', { sourceUrl: 'https://www.instagram.com/reel/bbbb/' }),
  ],
  diary: [],
  seedV: BASICS_VERSION,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const 이름들 = ['내 것', '내가 담은 것', '내 레시피']
for (let i = 0; i < 이름들.length; i++) {
  const 이름 = 이름들[i]
  const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:nudge:cloudgate', '1')
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, state)
  await page.goto('http://127.0.0.1:4377/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)

  // 🏷 이름 후보를 화면 글자에만 갈아 끼운다 (⛔코드는 안 바꾼다 — 고르고 나서 한 곳만 고친다)
  await page.evaluate((nm) => {
    for (const el of document.querySelectorAll('.pill')) {
      const m = el.textContent.trim().match(/^내 것 (\d+)$/)
      if (!m) continue
      // 글자 노드를 «전부» 지우고 하나만 다시 쓴다 (아이콘 <svg> 는 남긴다)
      for (const n of [...el.childNodes]) if (n.nodeType === 3) n.remove()
      el.appendChild(document.createTextNode(` ${nm} ${m[1]}`))
    }
  }, 이름)
  await page.waitForTimeout(200)
  await page.screenshot({ path: join(OUT, `내것칩-${i + 1}-${이름.replace(/ /g, '')}-누르기전.png`) })

  // 👆 눌러 본다 — 「내 것만 나오나」
  await page.evaluate(() => { for (const el of document.querySelectorAll('.pill')) if (el.querySelector('svg') && /\d/.test(el.textContent) && !/SNS|자주|모두/.test(el.textContent)) { el.click(); break } })
  await page.waitForTimeout(700)
  const 보이는제목 = await page.evaluate(() => [...document.querySelectorAll('.card-title, .t-title, h3')].map((e) => e.textContent.trim()).filter(Boolean))
  await page.screenshot({ path: join(OUT, `내것칩-${i + 1}-${이름.replace(/ /g, '')}-누른뒤.png`) })
  console.log(`[${이름}] 누른 뒤 목록 =`, 보이는제목.join(' · '), '| pageerror', errors.length)
  await page.close()
}
await b.close(); srv.close()
console.log('저장 →', OUT)

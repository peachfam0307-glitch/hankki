// 📏 「여섯 자가 한 줄에」 되는 «가장 큰» 글씨 비율 — 글씨체 열둘 전부로
//   창업자 2026-08-07 *"여섯자가 한줄에 들어가게 예쁜크기 네가 정해줘."*
//   ⛔ 귀염체 하나로 정하면 «넓은 글씨체»에서 또 넘친다 — v9.92 에서 글씨체마다 보이는 크기가
//      1.5배까지 다른 걸 이미 쟀다. 그러니 **열둘 전부에서** 한 줄이 되는 값을 고른다.
//   ⭐ 시험 문장 = 「오늘 김치찌개」(6자·공백 1) — 창업자가 말한 「여섯 자」.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4430, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')
// ⛔ 노드는 .jsx 를 못 읽는다 → 파일에서 글씨체 목록만 뽑는다
const src = readFileSync('/home/user/hankki/hankki/src/components/Stickers.jsx', 'utf8')
const blk = src.slice(src.indexOf('export const TEXT_FONTS'))
const TEXT_FONTS = [...blk.slice(0, blk.indexOf(String.fromCharCode(10) + ']')).matchAll(/key: '([a-z0-9]+)'[^}]*?label: '([^']+)'/g)].map((m) => ({ key: m[1], label: m[2] }))
if (TEXT_FONTS.length < 6) { console.log('⛔ 글씨체 목록을 못 뽑았다 — 검사 방식부터 볼 것', TEXT_FONTS.length); process.exit(1) }

const SENT = '오늘 김치찌개'
const CQW = [15, 14.5, 14, 13.5, 13, 12.5, 12, 11.5, 11]
// 글씨체 열둘을 한 판에 깐다 — 크기(s)는 지금 기본값 0.34 그대로
const decor = TEXT_FONTS.map((f, i) => ({
  id: `f${i}`, type: 'note', key: 'butter', text: SENT, font: f.key,
  x: 0.2 + (i % 3) * 0.3, y: 0.1 + Math.floor(i / 3) * 0.22, s: 0.34, r: 0,
}))

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })
await page.goto('http://127.0.0.1:4430/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1600)
await page.mouse.click(8, 300); await page.waitForTimeout(500)

// 🔒 글꼴이 «진짜 떴는지» 먼저 본다 — v9.92 에 CORS 로 글꼴이 하나도 안 떴는데
//    숫자는 그럴듯하게 나온 적이 있다(전부 같은 값인 게 유일한 신호였다).
const ready = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.status })
const rows = await page.evaluate(({ cqws, labels }) => {
  const notes = [...document.querySelectorAll('.decor-stage [style*="rotate"]')]
  const txt = (n) => [...n.querySelectorAll('div')].find((d) => getComputedStyle(d).whiteSpace === 'pre-wrap')
  const lineCount = (t) => { const r = document.createRange(); r.selectNodeContents(t); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size }
  const out = []
  notes.forEach((n, i) => {
    const t = txt(n); if (!t) { out.push({ font: labels[i], fam: '?', ok: null }); return }
    const fam = getComputedStyle(t).fontFamily.split(',')[0].replace(/["']/g, '')
    const per = {}
    for (const c of cqws) { t.style.fontSize = `clamp(7px, ${c}cqw, 72px)`; per[c] = lineCount(t) }
    t.style.fontSize = ''
    out.push({ font: labels[i], fam, per })
  })
  return out
}, { cqws: CQW, labels: TEXT_FONTS.map((f) => f.label) })

console.log(`🔤 글꼴 상태 = ${ready}`)
console.log('    (1 = 여섯 자가 한 줄에 들어감 · 2 이상 = 쪼개짐)\n')
console.log(['글씨체'.padEnd(10), ...CQW.map((c) => String(c).padStart(5))].join(''))
for (const r of rows) {
  if (!r.per) { console.log(`${r.font.padEnd(10)} ⛔ 글자 칸 못 찾음`); continue }
  console.log([r.font.padEnd(10), ...CQW.map((c) => String(r.per[c]).padStart(5))].join(''))
}
const fams = new Set(rows.map((r) => r.fam))
console.log(`\n🔎 실제로 쓰인 글꼴 ${fams.size}가지 — ${fams.size < 6 ? '⛔ 글꼴이 안 떴을 수 있다(값을 믿지 말 것)' : '✅ 제각각 = 정상'}`)
const safe = CQW.find((c) => rows.every((r) => r.per && r.per[c] === 1))
console.log(`\n⭐ 열둘 «전부» 한 줄이 되는 가장 큰 값 = ${safe ? safe + 'cqw' : '없음(더 낮춰야 함)'}`)
console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()

// 🔬 「더오담만 줄바꿈이 튄다」 — **왜 그런지 자로 잰다** (2026-09-11)
// 📮 창업자 = *"더오담은 왜 혼자 줄바꿈이 튀는 것 같지"*
// ⛔ 짐작 금지 — 줄마다 «실제 폭»과 «남은 자리»를 재서 답한다.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = '/home/user/hankki/hankki'
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4433, r))
const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, timezoneId: 'Asia/Seoul' })
const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  const 진짜 = Date
  const 옮김 = new 진짜('2026-09-12T10:00:00+09:00').getTime() - 진짜.now()
  window.Date = class extends 진짜 { constructor(...a) { if (a.length === 0) super(진짜.now() + 옮김); else super(...a) }
    static now() { return 진짜.now() + 옮김 } }
})
await p.goto('http://127.0.0.1:4433/', { waitUntil: 'networkidle' })
await p.click('text=장보기'); await p.waitForTimeout(900)
for (let i = 0; i < 8; i++) { const d = p.locator('text=더보기').first(); if (!(await d.count())) break; try { await d.click({ timeout: 900 }) } catch { break } await p.waitForTimeout(120) }
await p.waitForTimeout(400)

// 📏 «줄마다» 실제 폭을 잰다 — Range 로 각 줄의 사각형을 뽑는다
const 잰것 = await p.evaluate(() => {
  const 답 = []
  for (const c of document.querySelectorAll('.cur-card')) {
    const 이름 = c.innerText.split('\n')[0].trim()
    const el = [...c.querySelectorAll('span')].find((s) => s.firstChild?.nodeType === 3 && s.textContent.length > 20)
    if (!el) continue
    const 칸폭 = el.getBoundingClientRect().width
    const cs = getComputedStyle(el)
    const node = el.firstChild
    if (!node || node.nodeType !== 3) continue
    const 글 = node.textContent
    const r = document.createRange()
    // 한 글자씩 재서 «줄이 바뀌는 자리»를 찾는다
    const 줄 = []
    let 시작 = 0, 앞top = null
    for (let i = 0; i < 글.length; i++) {
      r.setStart(node, i); r.setEnd(node, i + 1)
      const t = Math.round(r.getBoundingClientRect().top)
      if (앞top === null) 앞top = t
      else if (t !== 앞top) { 줄.push({ 글자: 글.slice(시작, i), 시작, 끝: i }); 시작 = i; 앞top = t }
    }
    줄.push({ 글자: 글.slice(시작), 시작, 끝: 글.length })
    // 줄마다 폭 ＋ 「다음 낱말이 들어갈 자리가 있었나」
    const 줄정보 = 줄.map((L, i) => {
      r.setStart(node, L.시작); r.setEnd(node, L.끝)
      const 폭 = Math.round(r.getBoundingClientRect().width)
      const 다음줄 = 줄[i + 1]
      let 다음낱말 = '', 다음낱말폭 = 0
      if (다음줄) {
        const m = 다음줄.글자.trimStart().match(/^\S+/)
        if (m) {
          const s0 = 다음줄.시작 + (다음줄.글자.length - 다음줄.글자.trimStart().length)
          r.setStart(node, s0); r.setEnd(node, s0 + m[0].length)
          다음낱말 = m[0]; 다음낱말폭 = Math.round(r.getBoundingClientRect().width)
        }
      }
      return { 줄: i + 1, 글자: L.글자.trim(), 폭, 남은자리: Math.round(칸폭 - 폭), 다음낱말, 다음낱말폭 }
    })
    답.push({ 이름, 칸폭: Math.round(칸폭), wordBreak: cs.wordBreak, textWrap: cs.textWrap || cs.textWrapStyle, 줄정보 })
  }
  return 답
})

console.log('잰 카드', 잰것.length, '장 —', 잰것.map((x) => x.이름).slice(0, 8).join(' / '))
for (const c of 잰것) {
  if (!/더오담|기버터|버섯피자/.test(c.이름)) continue
  console.log(`\n▉ ${c.이름}  (칸폭 ${c.칸폭}px · word-break:${c.wordBreak} · text-wrap:${c.textWrap})`)
  for (const L of c.줄정보) {
    const 넘침 = L.다음낱말 && L.다음낱말폭 <= L.남은자리
    console.log(`   ${L.줄}줄 «${L.글자}» — 폭 ${L.폭} · 남은자리 ${L.남은자리}px` +
      (L.다음낱말 ? ` · 다음 낱말 「${L.다음낱말}」 ${L.다음낱말폭}px ${넘침 ? '⛔들어갈 수 있었는데 안 들어갔다' : '✅자리 없음(정상)'}` : ''))
  }
}
await b.close(); srv.close()

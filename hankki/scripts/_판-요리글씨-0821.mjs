// 🍳🔠 [판정용 · 2026-08-21] 요리 모드 글씨 크기 — «보통 걸음»으로 공정하게
//
// 📮 창업자 = *"폰에 글씨가 너무 큰데? ㅋㅋ **짧은건 좋을 것 같은데** 저건 글이 왤케 길어??"*
//    ＋ *"**문장이 끊어지질않네**"*
//
// ⛔⛔ **내가 판정을 불공정하게 만들었다** — 32px 을 보여줄 때 **145편 중 «제일 긴» 걸음(76자)**
//    하나만 찍어 보냈다. 창업자는 그 한 장으로 글씨 크기를 판정하게 됐다.
//    🔢 실제 분포 = 가운데 **24자** · 상위10% 44자 · 상위1% 61자.
//       즉 **거의 모든 걸음은 그 캡처보다 훨씬 짧다.**
//    📌 오늘 두 번째 같은 실수다(아침엔 캡처 세로 길이가 달라 2칸이 작아 보이게 만들었다).
//       **「제일 나쁜 것」만 보여주면 「보통」을 판정할 수 없다.**
//
// ✅ 그래서 이 판은 **길이 셋 × 크기 셋**을 같은 캔버스에 나란히 놓는다.
//    · 짧은(가운데값 24자) · 보통(40자) · 긴(76자 · 제일 긴 것)
//    · 26px · 28px · 32px
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-요리글씨-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/요리글씨'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4424, r))

// ⭐ 보기 글은 «진짜 레시피»에서 뽑는다 — 내가 지어내지 않는다(절대원칙 30)
const B = await import('../src/data/basics.js')
const 전체 = Array.isArray(B.allBasicRecipes) ? B.allBasicRecipes : (B.default || [])
const 걸음 = []
전체.forEach((r) => (r.steps || []).forEach((s, i) => {
  const t = (typeof s === 'string' ? s : (s.text || s.t || '')).trim()
  if (t) 걸음.push({ 편: r.title, 번: i + 1, 글: t })
}))
걸음.sort((a, b) => a.글.length - b.글.length)
const 가까운 = (n) => 걸음.reduce((best, x) => (Math.abs(x.글.length - n) < Math.abs(best.글.length - n) ? x : best))
const 보기 = [
  { 이름: '짧은 걸음', 설명: '가운데값 — 거의 다 이 정도다', ...가까운(24) },
  { 이름: '보통 걸음', 설명: '상위 10% 길이', ...가까운(44) },
  { 이름: '제일 긴 걸음', 설명: '964개 중 «최악» 하나', ...걸음[걸음.length - 1] },
]
const 크기들 = [26, 28, 32]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4424/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(700)

// 요리 모드를 «한 번» 연다
const T = await p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes?.find((r) => (r.steps || []).length >= 2)?.title || '')
await p.evaluate(() => {
  const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
  bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
})
await p.waitForTimeout(500)
await p.evaluate((t) => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(t))?.click(), T)
await p.waitForTimeout(600)
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('요리 시작'))?.click())
await p.waitForTimeout(600)
await p.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /시작 →|다음 →/.test(x.innerText || ''))?.click())
await p.waitForTimeout(400)

console.log('\n🍳 요리 모드 글씨 — 길이 셋 × 크기 셋 (390×844)\n')
const 찍힌 = []
for (const 글감 of 보기) {
  for (const fs of 크기들) {
    const 잰값 = await p.evaluate(({ 글, fs }) => {
      const el = document.querySelector('.cook-steptext')
      const body = document.querySelector('.cook-body')
      el.style.fontSize = fs + 'px'
      el.textContent = 글
      const 한줄 = parseFloat(getComputedStyle(el).lineHeight)
      return {
        줄: Math.round(el.getBoundingClientRect().height / 한줄),
        스크롤: body.scrollHeight > body.clientHeight + 1,
      }
    }, { 글: 글감.글, fs })
    await p.waitForTimeout(200)
    const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 844 } })
    찍힌.push({ ...글감, fs, ...잰값, buf })
    console.log(`  ${글감.이름.padEnd(7, ' ')} ${글감.글.length}자 · ${fs}px → ${잰값.줄}줄${잰값.스크롤 ? ' ⛔스크롤' : ''}`)
  }
}
await p.evaluate(() => { const el = document.querySelector('.cook-steptext'); el.style.fontSize = ''; el.textContent = '' })
await ctx.close()

// 한 장으로 — ⛔따로 보내면 세로 길이가 달라 크기가 왜곡된다(2026-08-21 아침 사고)
const page = await (await b.newContext({ viewport: { width: 1300, height: 1180 }, deviceScaleFactor: 2 })).newPage()
const d = (buf) => `data:image/png;base64,${buf.toString('base64')}`
const 줄HTML = 보기.map((g) => `
  <section>
    <h2>${g.이름} <em>${g.글.length}자 · ${g.설명}</em></h2>
    <p class="glue">${g.글}</p>
    <div class="row">
      ${크기들.map((fs) => {
        const t = 찍힌.find((x) => x.이름 === g.이름 && x.fs === fs)
        return `<figure><figcaption>${fs}px <b>${t.줄}줄</b>${t.스크롤 ? ' <s>스크롤</s>' : ''}</figcaption><img src="${d(t.buf)}"></figure>`
      }).join('')}
    </div>
  </section>`).join('')

await page.setContent(`
<style>
  body{margin:0;background:#f6f3ec;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;padding:22px;box-sizing:border-box;color:#2a2622}
  section{margin-bottom:26px}
  h2{font-size:19px;margin:0 0 3px;letter-spacing:-.02em}
  h2 em{font-style:normal;font-size:13.5px;color:#6b6055;font-weight:400;margin-left:6px}
  .glue{font-size:13px;color:#6b6055;margin:0 0 10px;line-height:1.6;word-break:keep-all}
  .row{display:flex;gap:14px}
  figure{margin:0;flex:1;min-width:0;text-align:center}
  figcaption{font-size:14px;color:#3f6ea8;font-weight:700;margin-bottom:6px}
  figcaption s{color:#b4622c;text-decoration:none}
  img{width:100%;height:auto;display:block;border-radius:10px;border:1px solid #e3dccf;background:#fff}
</style>
${줄HTML}`)
await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, '⭐요리글씨-길이셋x크기셋.png'), fullPage: true })
await b.close(); srv.close()
console.log(`\n🖼 ${join(OUT, '⭐요리글씨-길이셋x크기셋.png')}\n`)

// 📏 주부의 장바구니 — 설명 두 줄 ＋ 「올리고당」 설명을 재고 찍는다 (2026-08-23)
//
// 📮 창업자 = *"장바구니 설명줄바꿈없이 크기작게"* · *"올리고당설명줄바꿈되게"*
//
// ⛔ 「어디의 무엇인지」를 내가 정하지 않는다(규칙 25) — 재고 찍어서 «실물»로 물어본다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-장바구니설명-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'docs/시안/장바구니설명-0823')
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4395, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
await page.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click()
await page.waitForTimeout(900)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

// ① 설명 두 줄 — 몇 줄로 흐르나 · 몇 px 인가
const 두줄 = await page.evaluate(() => {
  const 찾기 = (조각) => [...document.querySelectorAll('.t-sub')].find((e) => e.textContent.includes(조각))
  return ['계속 올라와요', '외부 쇼핑몰로 이어져요'].map((조각) => {
    const e = 찾기(조각)
    if (!e) return { 조각, 없다: true }
    const cs = getComputedStyle(e)
    const lh = parseFloat(cs.lineHeight)
    const r = e.getBoundingClientRect()
    return {
      조각,
      글자: Math.round(parseFloat(cs.fontSize) * 10) / 10,
      줄간: cs.lineHeight,
      칸폭: Math.round(r.width),
      높이: Math.round(r.height),
      줄수: Math.round(r.height / lh),
      // 한 줄에 담으려면 몇 px 이어야 하나 = 지금 «글자 전체 폭» ÷ 칸 폭
      한줄폭: (() => {
        const s = document.createElement('span')
        s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing}`
        s.textContent = e.innerText
        document.body.appendChild(s)
        const w = s.getBoundingClientRect().width
        s.remove()
        return Math.round(w)
      })(),
    }
  })
})
console.log('\n📏 ① 주부의 장바구니 설명 두 줄')
for (const d of 두줄) {
  if (d.없다) { console.log(`   ⛔ 「${d.조각}」 못 찾음`); continue }
  const 필요 = (d.글자 * d.칸폭) / d.한줄폭
  console.log(`   「${d.조각}」  ${d.글자}px · 줄간 ${d.줄간} · 칸 ${d.칸폭}px · **${d.줄수}줄**(높이 ${d.높이})`)
  console.log(`      └ 한 줄로 담으려면 글자 ≤ ${Math.floor(필요 * 10) / 10}px  (지금 한 줄 폭 ${d.한줄폭}px)`)
}

// ② 올리고당 설명
const 올 = await page.evaluate(() => {
  const 카드 = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() === '우리밀 올리고당')[0]
  if (!카드) return { 없다: true }
  카드.scrollIntoView({ block: 'center' })
  const box = 카드.closest('div[class]') || 카드.parentElement
  const 설명 = [...(box.closest('li,div[style]')?.parentElement?.querySelectorAll('.t-sub') || [])]
  const 내설명 = [...document.querySelectorAll('.t-sub')].find((e) => e.textContent.includes('무난하게 잘 어울려요'))
  const e = 내설명 || 설명[0]
  if (!e) return { 이름은있다: true }
  const cs = getComputedStyle(e)
  const r = e.getBoundingClientRect()
  return {
    글: e.innerText.trim(),
    글자: Math.round(parseFloat(cs.fontSize) * 10) / 10,
    줄간: cs.lineHeight,
    칸폭: Math.round(r.width),
    높이: Math.round(r.height),
    줄수: Math.round(r.height / parseFloat(cs.lineHeight)),
    clamp: cs.webkitLineClamp,
    넘침: e.scrollHeight > e.clientHeight + 1,
    가로넘침: e.scrollWidth > e.clientWidth + 1,
    wordBreak: cs.wordBreak,
  }
})
console.log('\n🍯 ② 올리고당 설명')
console.log('   ', JSON.stringify(올, null, 2).replace(/\n/g, '\n    '))

await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '올리고당.png') })
await page.evaluate(() => { document.querySelector('.screen')?.scrollTo(0, 0) })
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '설명두줄.png') })
console.log(`\n📁 ${OUT}\n`)

await b.close(); srv.close()

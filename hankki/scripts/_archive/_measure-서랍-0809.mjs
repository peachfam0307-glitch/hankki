// 📏 꾸미기 서랍 — 「스크롤 칸」이 몇 px 인가 (창업자 폰 360×780 기준)
//
// 📮 창업자 2026-08-08 — *"6번 서랍이 좀 더 넓었으면 좋겠어. 설명버튼 높이를 조금씩만 줄이는 것도.."*
// ⛔ 눈으로 「좁다」를 고치면 또 어긋난다 — **어디가 몇 px 먹는지** 재고 고친다.
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
await new Promise((r) => srv.listen(4378, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 780 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await page.addInitScript((s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0)
  s.diary.forEach((x) => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4378/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1100)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(900)

const m = await page.evaluate(() => {
  const r = (el) => el ? Math.round(el.getBoundingClientRect().height) : null
  // 서랍 = 스티커 목록을 담은 스크롤 상자
  const scroll = [...document.querySelectorAll('div')]
    .filter((d) => d.scrollHeight > d.clientHeight + 8 && d.clientHeight > 40 && d.getBoundingClientRect().top > 300)
    .sort((a, b) => b.clientHeight - a.clientHeight)[0]
  const out = { 화면: window.innerHeight, 스크롤칸: scroll ? Math.round(scroll.clientHeight) : null }
  // 아래쪽 조각들 높이 — 「설명(안내) 줄」을 찾아 잰다
  for (const d of document.querySelectorAll('div')) {
    const t = (d.innerText || '').trim()
    if (!t || d.children.length > 2) continue
    if (/누르면|끌어서|골라|일꾸 =|레꾸 =|붙이/.test(t) && t.length < 70) {
      out.안내줄 = { 글: t.slice(0, 46), 높이: r(d) }
    }
  }
  return out
})
console.log('\n📏 꾸미기 서랍 실측 (360×780)')
console.log(JSON.stringify(m, null, 1))
await page.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/서랍-지금.png' })

// 🅱️ 종이를 줄인 판 — 서랍은 «남는 공간»을 쓰므로 종이가 줄어야 넓어진다(창업자 판정용)
for (const pad of [26, 34, 42]) {
  await page.addStyleTag({ content: '.decor-stage{padding:4px ' + pad + 'px 0 !important}' })
  await page.waitForTimeout(500)
  const h = await page.evaluate(() => {
    const s = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 8 && d.clientHeight > 40 && d.getBoundingClientRect().top > 300).sort((a, b) => b.clientHeight - a.clientHeight)[0]
    const p = document.querySelector('.decor-stage > div')
    return { 스크롤칸: s ? Math.round(s.clientHeight) : null, 종이폭: p ? Math.round(p.getBoundingClientRect().width) : null }
  })
  console.log('   좌우 여백 ' + pad + 'px →', JSON.stringify(h))
  await page.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/서랍-' + pad + '.png' })
}
await b.close(); srv.close()

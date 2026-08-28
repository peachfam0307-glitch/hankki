// 📸 2026-08-28 할 일 결과 실물 — 창업자 시안용
//   ① 가져오기 목록(네 갈래) ② 「보다가 캡처」 안내 ③ 「여기서 사진 고르기」 안내
//   ④ 일기 넘겨보기(‹ ›) ⑤ 포스트잇 글자·별점
// ⛔ 숫자만 보고 보내지 않는다(절대원칙 21) — 뽑아서 내가 «열어본다».
// 🏷 이름표 = 시안 뽑기
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.env.SHOT_OUT || '/tmp/shot7'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4457, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })

// ── 일기 세 장 ＋ 「한 줄」 메모를 심는다 (⛔새 탭으로 연다 · reload 금지 · check-mistakes ⑧)
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4457/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1200)
await p0.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 하루 = 86400000
  const 이제 = Date.now()
  const 첫레시피 = (s.recipes || [])[0]
  s.diary = [
    { id: 'dg1', kind: 'diary', at: 이제 - 9 * 하루, title: '비 오는 날', note: '' },
    { id: 'dg2', kind: 'diary', at: 이제 - 4 * 하루, title: '국수 삶은 날', note: '' },
    { id: 'dg3', kind: 'diary', at: 이제 - 하루, title: '어제', note: '' },
    ...(첫레시피 ? [{ id: 'dm1', kind: 'cook', at: 이제 - 2 * 하루, recipeId: 첫레시피.id, title: 첫레시피.title, note: '간장 반만 · 면 1분 덜 삶기', rating: 4 }] : []),
    ...(s.diary || []),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
const 첫레시피 = await p0.evaluate(() => { try { return (JSON.parse(localStorage.getItem('hankki:v1')).recipes || [])[0]?.title || '' } catch { return '' } })
await p0.close()

const p = await ctx.newPage()
const 실패 = []
p.on('pageerror', (e) => { if (!/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(e.message)) 실패.push(e.message) })
await p.goto('http://127.0.0.1:4457/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(4000)

const 찍기 = async (이름) => { await p.screenshot({ path: join(OUT, `${이름}.png`) }); console.log(`  📸 ${이름}.png`) }

// ── ① 가져오기 목록
await p.getByRole('button', { name: /가져오기/ }).last().click()
await p.waitForTimeout(900)
await 찍기('1-가져오기-네갈래')
const 줄들 = await p.evaluate(() => [...document.querySelectorAll('.opt-row .a')].map((e) => e.innerText))
console.log(`  목록 = ${줄들.join(' · ')}`)

// ── ② 「보다가 캡처」 안내 (히어로)
await p.getByText('보다가 캡처해서 담기').first().click()
await p.waitForTimeout(700)
await 찍기('2-안내-보다가캡처')

// 뒤로
await p.getByRole('button', { name: '닫기' }).first().click()
await p.waitForTimeout(600)

// ── ③ 「여기서 사진 고르기」 안내
await p.getByText('여기서 사진 고르기').first().click()
await p.waitForTimeout(700)
await 찍기('3-안내-여기서사진고르기')

// ── ④ 일기 넘겨보기
// ⛔ 「가져오기」는 전체화면이라 하단 탭이 «없다» — 목록으로 한 번, 화면 밖으로 또 한 번 닫는다
//    (2026-08-24 열쇠이름 판에서 같은 자리에 걸렸다)
await p.getByRole('button', { name: '닫기' }).first().click()
await p.waitForTimeout(500)
await p.getByRole('button', { name: '닫기' }).first().click()
await p.waitForTimeout(700)
await p.locator('.nav-item', { hasText: '일기' }).first().click().catch(() => {})
await p.waitForTimeout(900)
// 달력에서 「썼다」 표시가 있는 날 하나를 연다
const 열림 = await p.evaluate(() => {
  const 후보 = [...document.querySelectorAll('button')].filter((b) => b.querySelector('svg') && /^\d+$/.test((b.innerText || '').trim()))
  return 후보.length
})
console.log(`  달력 날짜 단추 ${열림}개`)
await 찍기('4-일기-달력')
// 쓴 날 하나를 열고 ‹ › 를 확인한다
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.querySelector('svg') && /^\d+$/.test((x.innerText || '').trim()))
  b?.click()
})
await p.waitForTimeout(900)
await 찍기('4b-일기-넘김')
const 넘김 = await p.evaluate(() => [...document.querySelectorAll('.diary-flip')].map((b) => ({ 이름: b.getAttribute('aria-label'), 꺼짐: b.disabled })))
console.log(`  넘김 단추 = ${JSON.stringify(넘김, null, 0)}`)
// 오른쪽(다음 일기)을 눌러 «정말 넘어가나» 본다
const 전날 = await p.evaluate(() => document.querySelector('.detail-bar span')?.innerText || '')
await p.locator('.diary-flip').last().click().catch(() => {})
await p.waitForTimeout(700)
const 뒷날 = await p.evaluate(() => document.querySelector('.detail-bar span')?.innerText || '')
console.log(`  넘기기: ${전날} → ${뒷날}`)
await 찍기('4c-일기-넘긴뒤')

// ── ⑤ 포스트잇 (레시피 상세)
if (첫레시피) {
  await p.locator('.nav-item', { hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(800)
  await p.getByText(첫레시피, { exact: false }).first().click().catch(() => {})
  await p.waitForTimeout(1200)
  await p.evaluate(() => document.querySelector('.memo-note.stick')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(500)
  const 잰것 = await p.evaluate(() => {
    const n = document.querySelector('.memo-note.stick')
    if (!n) return null
    const body = n.querySelector('.memo-note-body')
    const star = n.querySelector('.memo-note-stars svg')
    const cs = (el) => (el ? getComputedStyle(el) : null)
    return {
      종이폭: Math.round(n.getBoundingClientRect().width),
      본문: cs(body)?.fontSize,
      머리줄: cs(n.querySelector('.memo-note-head'))?.fontSize,
      별: star ? Math.round(star.getBoundingClientRect().width) : 0,
    }
  })
  console.log(`  포스트잇 = ${JSON.stringify(잰것)}`)
  await 찍기('5-포스트잇')
}

console.log(실패.length ? `\n⛔ 화면 오류 ${실패.length}건 — ${실패[0]}` : '\n✅ 화면 오류 0')
console.log(`\n📂 ${OUT}`)
await b.close()
srv.close()

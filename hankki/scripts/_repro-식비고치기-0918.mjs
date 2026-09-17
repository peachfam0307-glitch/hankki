// ✏️🔬 식비 «줄 고치기» ＋ 장보기 «금액 안내» 재현판 (2026-09-18)
//   📮 창업자 = *"1.저기도 수정가능하게 2.장보기입력시 금액 적는 안내나 양식이 없어 유저들은 모를듯해
//                 다 적고나면 연하게 값이라고 되어있어서 이부분수정"*
//   ⭐ 무엇을 재나 = ①적은 줄을 눌러 고칠 수 있나(값·메모·날짜) ②고쳐도 «자리»가 안 바뀌고 줄 수도 그대로인가
//      ③적는 칸 안내가 「두부 1990」을 보여주나 ④값 안 적은 줄 글자가 「값」이 아니라 「＋ 금액」인가
//      ⑤일부러 0 으로 고치려 하면 아무 일도 안 나나(지우기는 X 가 맡는다)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4538, r))
let 통과 = 0; const 실패 = []
const 본다 = (이름, 참, 덧 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 덧) } else { 실패.push(이름); console.log('  ✗', 이름, 덧) } }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) 오류.push(m.text()) })
await p.goto('http://127.0.0.1:4538/hankki/?%EC%8B%9D%EB%B9%84=1', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600)
async function 치우기() { for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(500) } catch { break } } }
await 치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click()
await p.waitForTimeout(1000); await 치우기()

// ③ 적는 칸 안내 — 「두부 1990」이 «적는 자리»에 보이나
// ⛔ `.searchbar input` 은 큐레이션 «찾기» 칸도 잡는다 — 담는 칸은 「살 재료/1990」 쪽이다(첫 판이 여기서 헛방을 쳤다)
const 안내 = await p.locator('input[placeholder*="1990"], input[placeholder*="살 재료"]').first().getAttribute('placeholder')
본다('적는 칸이 「두부 1990」 꼴을 알려준다', /두부\s*1990/.test(안내 || ''), 안내 || '(없음)')

// 한 줄로 이름＋값 담기 (창업자 «두부를 적고 값을 눌러 또 금액을 적고 좀 번거로워»)
await p.locator('input[placeholder*="1990"], input[placeholder*="살 재료"]').first().fill('두부 1990')
await p.keyboard.press('Enter'); await p.waitForTimeout(500)
await p.locator('input[placeholder*="1990"], input[placeholder*="살 재료"]').first().fill('대파')
await p.keyboard.press('Enter'); await p.waitForTimeout(500)

// ④ 값 안 적은 줄 글자
const 빈값글 = ((await p.locator('.shop-row').filter({ hasText: '대파' }).first().locator('button[aria-label*="값 적기"]').textContent()) || '').trim()
본다('값 안 적은 줄은 「＋ 금액」이라고 말한다', 빈값글 === '＋ 금액', 빈값글)

// 식비로 옮기기
await p.locator('button:has-text("값 적은 것 식비로 적기")').first().click()
await p.waitForTimeout(900)
await p.locator('.seg', { hasText: '식비' }).first().click().catch(() => {})
await p.locator('button.seg:has-text("식비")').first().click().catch(() => {})
await p.waitForTimeout(900)
본다('식비에 한 줄 생겼다', await p.locator('.fc-row').count() === 1, `${await p.locator('.fc-row').count()}줄`)

// ① 줄을 눌러 고치기
await p.locator('.fc-row .fc-hit').first().click()
await p.waitForTimeout(700)
본다('고치기 시트가 «그 줄 값»을 물고 열린다', ((await p.locator('.fc-in').first().textContent()) || '').includes('1,990'))
본다('큰 단추가 「고쳤어요」다', (await p.locator('.fc-save').first().textContent() || '').includes('고쳤어요'))

// ⑤ 0 으로 고치려 하면 — 「지움」 누르고 저장 단추가 잠기나
await p.locator('.fc-key.bk:has-text("지움")').first().click()
await p.waitForTimeout(300)
본다('0 이면 저장이 잠긴다 (지우기는 X 가 맡는다)', await p.locator('.fc-save').first().isDisabled())

// 값 5,500 으로 고치고 메모도 바꾼다
for (const k of ['5', '5', '00']) { await p.locator(`.fc-key:text-is("${k}")`).first().click(); await p.waitForTimeout(150) }
await p.locator('.fc-memo').first().fill('이마트')
await p.locator('.fc-save').first().click()
await p.waitForTimeout(900)

// ② 고쳐도 줄 수는 그대로 · 값과 메모가 바뀐다
본다('줄이 늘지 않았다 (지우고 새로 넣지 않는다)', await p.locator('.fc-row').count() === 1, `${await p.locator('.fc-row').count()}줄`)
const 줄글 = ((await p.locator('.fc-row').first().innerText()) || '').replace(/\s+/g, ' ')
본다('값이 5,500원으로 바뀌었다', 줄글.includes('5,500원'), 줄글)
본다('메모가 「이마트」로 바뀌었다', 줄글.includes('이마트'), 줄글)

// 새로고침해도 남나
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600); await 치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click()
await p.waitForTimeout(900); await 치우기()
await p.locator('button.seg:has-text("식비")').first().click().catch(() => {})
await p.waitForTimeout(800)
본다('새로고침 뒤에도 고친 값이 남는다', ((await p.locator('.fc-row').first().innerText()) || '').includes('5,500'))

본다('콘솔 오류 0', 오류.length === 0, 오류.slice(0, 2).join(' | '))
await b.close(); srv.close()
console.log(`\n${실패.length ? '⛔' : '✅'} ${통과}/${통과 + 실패.length}`)
if (실패.length) { console.log('실패:', 실패.join(' · ')); process.exit(1) }

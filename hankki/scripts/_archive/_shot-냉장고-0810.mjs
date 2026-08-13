// 📸 검수판 — 「냉장고」 화면을 다시 짠 것 (창업자 2026-08-10)
//    *"영수증스캔이 버튼이 더 커서. 영수증 스캔하는 탭이라고 생각할 것 같아"*
//    *"재료를 넣으면 레시피를 추천해주는게 주가 되어야 할 듯. 안내도 해야하고."*
//    *"영수증은 스캔할때 베타버전으로 인식률떨어질 수 있다고 … (대신 잘보이는 색상으로)"*
//
// 세 판을 찍는다 — ①빈 냉장고 ②재료 있음(추천이 맨 위) ③영수증 스캔 시트(베타 안내)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()

const PORT = Number(process.env.PORT || 4343)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
const url = `http://127.0.0.1:${PORT}/`

const 열기 = async (pantry) => {
  await page.goto(url)
  await page.evaluate((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
    sessionStorage.setItem('hankki:shopView', 'pantry')
  }, {
    recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
    pantry,
    seedV: BASICS_VERSION,
  })
  await page.goto(url)
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '장보기', exact: true }).first().click()
  await page.waitForTimeout(700)
  // ⛔ `sessionStorage` 로 냉장고를 미리 골라두려 했는데 «안 먹었다» — 첫 판이 통째로
  //    「장보기」 화면을 재고 `null` 을 뱉었다(앱이 아니라 검사가 거기까지 못 간 것 · 규칙 18).
  //    ✅ 유저가 하는 그대로 **「냉장고」를 누른다.**
  await page.getByRole('button', { name: '냉장고', exact: true }).first().click()
  await page.waitForTimeout(900)
}

console.log('\n① 빈 냉장고')
await 열기([])
await page.screenshot({ path: `${OUT}/pantry-1-empty.png` })

console.log('② 재료 넣은 냉장고 — 추천이 맨 위인가')
await 열기([
  { id: 'p1', name: '양파', icon: null, expiry: null, addedAt: now },
  { id: 'p2', name: '대파', icon: null, expiry: '2026-08-14', addedAt: now },
  { id: 'p3', name: '두부', icon: null, expiry: null, addedAt: now },
  { id: 'p4', name: '돼지고기 앞다리살', icon: null, expiry: null, addedAt: now },
])
await page.screenshot({ path: `${OUT}/pantry-2-full.png` })

// 🔢 실측 — 「추천」이 「재료함」보다 «위»에 있나 (눈 말고 숫자로)
const 자리 = await page.evaluate(() => {
  const y = (글) => {
    const el = [...document.querySelectorAll('.h-section')].find((x) => x.textContent.includes(글))
    return el ? Math.round(el.getBoundingClientRect().top) : null
  }
  const lead = document.querySelector('.pantry-lead')
  const 담기 = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('재료 담기'))
  const 영수증 = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('영수증'))
  return {
    안내줄: lead ? Math.round(lead.getBoundingClientRect().top) : null,
    추천: y('만들 수 있어요'),
    재료함: y('냉장고 재료함'),
    담기폭: 담기 ? Math.round(담기.getBoundingClientRect().width) : null,
    영수증폭: 영수증 ? Math.round(영수증.getBoundingClientRect().width) : null,
  }
})
console.log('   ', JSON.stringify(자리))
let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }
칸(자리.안내줄 !== null, '맨 위에 「무엇을 하는 곳인가」 한 줄이 있다')
칸(자리.추천 !== null && 자리.재료함 !== null && 자리.추천 < 자리.재료함,
  '「가진 재료로 만들 수 있어요」가 「냉장고 재료함」보다 위다', `추천 y${자리.추천} · 재료함 y${자리.재료함}`)
칸(자리.담기폭 > 자리.영수증폭, '「재료 담기」가 「영수증」보다 크다 (주·보조가 뒤집혔다)',
  `담기 ${자리.담기폭}px vs 영수증 ${자리.영수증폭}px`)

console.log('③ 영수증 스캔 시트 — 베타 안내가 보이나')
await page.evaluate(() => {
  // 1×1 투명 PNG 를 넣어 자르기 시트를 띄운다 (실제 OCR 은 안 돈다)
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAYAAAA2P9yZAAAAKklEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAHwbSAAAAeVYmVwAAAAASUVORK5CYII='
  const bin = atob(png)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  const f = new File([arr], 'receipt.png', { type: 'image/png' })
  const i = [...document.querySelectorAll('input[type=file]')].find((x) => (x.accept || '').includes('image'))
  const dt = new DataTransfer()
  dt.items.add(f)
  i.files = dt.files
  i.dispatchEvent(new Event('change', { bubbles: true }))
})
await page.waitForTimeout(1600)
const 베타 = await page.evaluate(() => {
  const el = [...document.querySelectorAll('span')].find((x) => x.textContent.includes('잘못 읽을 수 있어요'))
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { 색: getComputedStyle(el).color, 보임: r.width > 0 && r.top >= 0 && r.top < innerHeight, y: Math.round(r.top) }
})
칸(!!베타 && 베타.보임, '스캔 시트에 베타 안내가 «보인다»', 베타 ? `${베타.색} · y${베타.y}` : '못 찾음')
await page.screenshot({ path: `${OUT}/pantry-3-scan.png` })

칸(errs.length === 0, '런타임 크래시 0', errs.slice(0, 2).join(' / '))
await browser.close()
stop()
console.log(fail ? `\n⛔ ${fail}칸 어긋남` : '\n✅ 냉장고 화면 검수 통과')
process.exit(fail ? 1 : 0)

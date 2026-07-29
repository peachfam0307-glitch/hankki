import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4199, HOST = '127.0.0.1', BASE = `http://${HOST}:${PORT}/`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
async function waitHttp(u, t = 45000) { const s = Date.now(); while (Date.now() - s < t) { try { const r = await fetch(u); if (r.status < 500) return } catch {} await new Promise(r => setTimeout(r, 400)) } throw new Error('preview 안 뜸') }
let fail = 0
const chk = (ok, label, extra='') => { if (!ok) fail++; console.log(`${ok?'  ok':'FAIL'}  ${label}${extra?'  · '+extra:''}`) }
let server, browser
try {
  server = spawn('npx', ['vite','preview','--host',HOST,'--port',String(PORT),'--strictPort'], { cwd: '/home/user/hankki/hankki', env: process.env })
  await waitHttp(BASE)
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { ['hankki:onboarded','hankki:coach:home2','hankki:coach:shop','hankki:coach:brag','hankki:coach:mine','hankki:coach:detail'].forEach(k => { try { localStorage.setItem(k,'1') } catch {} }) })
  const page = await ctx.newPage(); page.setDefaultTimeout(15000)
  const errs = []; page.on('pageerror', e => errs.push(String(e)))
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(1400)
  await page.locator('.grid2 .grid-card button').first().click(); await page.waitForTimeout(900)
  await page.locator('button[aria-label="표지 아이콘 바꾸기"]').click(); await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/f-1-sheet.png` })

  // 가나다순인지 — 한식 그룹 첫 6개 라벨
  const koLabels = await page.evaluate(() => {
    const cats = [...document.querySelectorAll('.emoji-cat')]
    const c = cats.find(e => e.textContent.trim() === '한식')
    return [...c.nextElementSibling.querySelectorAll('.ficon-name')].slice(0, 6).map(e => e.textContent)
  })
  const sorted = [...koLabels].sort((a,b)=>a.localeCompare(b,'ko'))
  chk(JSON.stringify(koLabels) === JSON.stringify(sorted), '한식 그룹 가나다순', koLabels.join(' · '))

  const search = page.locator('.ficon-search input')
  // 1) 이름 검색
  await search.fill('김치'); await page.waitForTimeout(500)
  const n1 = await page.locator('.ficon-cell').count()
  const names1 = await page.locator('.ficon-name').evaluateAll(e=>e.map(x=>x.textContent))
  chk(n1 > 0 && names1.every(n => n.includes('김치') || n === ''), `'김치' 검색 = ${n1}개`, names1.slice(0,5).join(' · '))
  await page.screenshot({ path: `${OUT}/f-2-search.png` })
  // 2) 별칭 검색 (이름은 '제육', 별칭에 '두루치기')
  await search.fill('두루치기'); await page.waitForTimeout(500)
  const names2 = await page.locator('.ficon-name').evaluateAll(e=>e.map(x=>x.textContent))
  chk(names2.includes('제육'), "별칭 검색 '두루치기' → 제육", names2.join(' · '))
  // 3) 초성 검색
  await search.fill('ㄱㅊㅉㄱ'); await page.waitForTimeout(500)
  const names3 = await page.locator('.ficon-name').evaluateAll(e=>e.map(x=>x.textContent))
  chk(names3.some(n => n.includes('김치찌개')), "초성 'ㄱㅊㅉㄱ' → 김치찌개", names3.slice(0,4).join(' · '))
  await page.screenshot({ path: `${OUT}/f-3-chosung.png` })
  // 4) 없는 것
  await search.fill('없는음식이름'); await page.waitForTimeout(500)
  chk((await page.evaluate(()=>document.body.innerText)).includes('찾은 아이콘이 없어요'), '결과 없을 때 안내')
  // 5) 지우기 → 목록 복귀
  await page.locator('button[aria-label="검색어 지우기"]').click(); await page.waitForTimeout(500)
  chk((await page.evaluate(()=>document.body.innerText)).includes('한식'), '지우면 전체 목록 복귀')

  // 6) 고르면 최근에 남는지
  await search.fill('육개장'); await page.waitForTimeout(500)
  await page.locator('.ficon-cell').first().click(); await page.waitForTimeout(900)
  await page.locator('button[aria-label="표지 아이콘 바꾸기"]').click(); await page.waitForTimeout(700)
  const body = await page.evaluate(()=>document.body.innerText)
  chk(body.includes('최근에 쓴 것'), '최근에 쓴 것 줄 생김')
  const recentNames = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.emoji-cat')].find(e=>e.textContent.includes('최근'))
    return [...c.nextElementSibling.querySelectorAll('.ficon-name')].map(e=>e.textContent)
  })
  chk(recentNames.includes('육개장'), '방금 고른 게 최근 맨 앞', recentNames.join(' · '))
  await page.screenshot({ path: `${OUT}/f-4-recent.png` })
  chk(errs.length === 0, 'pageerror 없음', errs.slice(0,2).join(' | '))
  console.log(fail ? `\n❌ 실패 ${fail}건` : '\n✅ 전부 통과')
} catch (e) { console.error('ERR', e.message) } finally { try { if (browser) await browser.close() } catch {} try { if (server && !server.killed) server.kill('SIGTERM') } catch {} console.log('END') }

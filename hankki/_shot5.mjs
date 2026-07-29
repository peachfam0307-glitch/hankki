import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4201, HOST = '127.0.0.1', BASE = `http://${HOST}:${PORT}/`
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
  const names = () => page.locator('.ficon-name').evaluateAll(e=>e.map(x=>x.textContent))

  for (const label of ['한식','양식','일식','중식']) {
    const got = await page.evaluate((L) => {
      const c = [...document.querySelectorAll('.emoji-cat')].find(e => e.textContent.trim() === L)
      return c ? [...c.nextElementSibling.querySelectorAll('.ficon-name')].map(e => e.textContent) : null
    }, label)
    const sorted = [...got].sort((a,b)=>a.localeCompare(b,'ko'))
    chk(JSON.stringify(got)===JSON.stringify(sorted), `${label} 가나다순 (${got.length}개)`, got.slice(0,4).join(' · '))
  }

  const search = page.locator('.ficon-search input')
  await search.fill('김치'); await page.waitForTimeout(500)
  const n1 = await names()
  // 별칭까지 걸리므로 김치볶음밥·김치찌개는 반드시 있고, 무관한 스테이크는 없어야 한다
  chk(n1.includes('김치찌개') && n1.includes('김치볶음밥'), `'김치' 검색에 김치찌개·김치볶음밥 포함 (${n1.length}개)`, n1.join(' · '))
  chk(!n1.some(x=>x.includes('스테이크')||x.includes('피자')), '무관한 음식은 안 걸림')
  await page.screenshot({ path: `${OUT}/f-2-search.png` })

  await search.fill('두루치기'); await page.waitForTimeout(500)
  chk((await names()).includes('제육'), "별칭 '두루치기' → 제육")
  await search.fill('솥밥'); await page.waitForTimeout(500)
  chk((await names()).length > 0, "별칭 '솥밥' 검색됨", (await names()).join(' · '))
  await search.fill('ㄱㅊㅉㄱ'); await page.waitForTimeout(500)
  chk((await names()).some(n=>n.includes('김치찌개')), "초성 'ㄱㅊㅉㄱ' → 김치찌개", (await names()).join(' · '))
  await page.screenshot({ path: `${OUT}/f-3-chosung.png` })
  await search.fill('ㄸㅂㅇ'); await page.waitForTimeout(500)
  chk((await names()).some(n=>n.includes('떡볶이')), "초성 'ㄸㅂㅇ' → 떡볶이", (await names()).slice(0,4).join(' · '))
  await search.fill('없는음식이름'); await page.waitForTimeout(500)
  chk((await page.evaluate(()=>document.body.innerText)).includes('찾은 아이콘이 없어요'), '결과 없을 때 안내')
  await page.locator('button[aria-label="검색어 지우기"]').click(); await page.waitForTimeout(500)
  chk((await page.evaluate(()=>document.body.innerText)).includes('한식'), '지우면 전체 목록 복귀')

  await search.fill('육개장'); await page.waitForTimeout(500)
  await page.locator('.ficon-cell').first().click(); await page.waitForTimeout(900)
  await page.locator('button[aria-label="표지 아이콘 바꾸기"]').click(); await page.waitForTimeout(700)
  chk((await page.evaluate(()=>document.body.innerText)).includes('최근에 쓴 것'), '최근에 쓴 것 줄 생김')
  const recentNames = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.emoji-cat')].find(e=>e.textContent.includes('최근'))
    return [...c.nextElementSibling.querySelectorAll('.ficon-name')].map(e=>e.textContent)
  })
  chk(recentNames[0]==='육개장', '방금 고른 게 최근 맨 앞', recentNames.join(' · '))
  await page.screenshot({ path: `${OUT}/f-4-recent.png` })
  chk(errs.length === 0, 'pageerror 없음', errs.slice(0,2).join(' | '))
  console.log(fail ? `\n❌ 실패 ${fail}건` : '\n✅ 전부 통과')
} catch (e) { console.error('ERR', e.message) } finally { try { if (browser) await browser.close() } catch {} try { if (server && !server.killed) server.kill('SIGTERM') } catch {} console.log('END') }

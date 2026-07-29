import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4209, HOST = '127.0.0.1', BASE = `http://${HOST}:${PORT}/`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const KEYS = ['hankki:onboarded','hankki:coach:home2','hankki:coach:shop','hankki:coach:brag','hankki:coach:myrecipes','hankki:coach:profile','hankki:coach:detail']
async function waitHttp(u, t = 45000) { const s = Date.now(); while (Date.now() - s < t) { try { const r = await fetch(u); if (r.status < 500) return } catch {} await new Promise(r => setTimeout(r, 400)) } throw new Error('preview 안 뜸') }
let server, browser
try {
  server = spawn('npx', ['vite','preview','--host',HOST,'--port',String(PORT),'--strictPort'], { cwd: '/home/user/hankki/hankki', env: process.env })
  await waitHttp(BASE)
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript((ks) => { ks.forEach(k => { try { localStorage.setItem(k,'1') } catch {} }) }, KEYS)
  const page = await ctx.newPage(); page.setDefaultTimeout(20000)
  const errs=[]; page.on('pageerror', e=>errs.push(String(e)))
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(1500)
  // 레시피 상세 → 레시피 꾸미기 → 배경·테이프 탭
  await page.locator('.grid2 .grid-card button').first().click(); await page.waitForTimeout(900)
  await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1500)
  await page.getByText('배경', { exact: false }).first().click().catch(()=>{}); await page.waitForTimeout(700)
  // 테이프 섹션까지 스크롤
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.decor-sec-label')].find(e => /테이프|마스킹/.test(e.textContent))
    if (el) el.scrollIntoView({ block: 'start' })
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/tape-1.png` })
  const labels = await page.evaluate(() => [...document.querySelectorAll('.decor-scroll button')].map(b=>b.getAttribute('aria-label')||'').filter(x=>x.includes('테이프')||x.includes('마스킹')))
  console.log('테이프 버튼:', labels.slice(0,20).join(' / ') || '(aria-label 없음)')
  console.log('pageerror:', errs.length ? errs.slice(0,2) : '없음')
  console.log('DONE')
} catch (e) { console.error('ERR', e.message) } finally { try { if (browser) await browser.close() } catch {} try { if (server && !server.killed) server.kill('SIGTERM') } catch {} }

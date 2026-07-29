import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4213, HOST = '127.0.0.1', BASE = `http://${HOST}:${PORT}/`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const KEYS = ['hankki:onboarded','hankki:coach:home2','hankki:coach:shop','hankki:coach:brag','hankki:coach:myrecipes','hankki:coach:profile','hankki:coach:detail']
async function waitHttp(u, t = 45000) { const s = Date.now(); while (Date.now() - s < t) { try { const r = await fetch(u); if (r.status < 500) return } catch {} await new Promise(r => setTimeout(r, 400)) } throw new Error('preview 안 뜸') }
let server, browser
try {
  server = spawn('npx', ['vite','preview','--host',HOST,'--port',String(PORT),'--strictPort'], { cwd: '/home/user/hankki/hankki', env: process.env })
  await waitHttp(BASE)
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2 })
  await ctx.addInitScript((ks) => { ks.forEach(k => { try { localStorage.setItem(k,'1') } catch {} }) }, KEYS)
  const page = await ctx.newPage(); page.setDefaultTimeout(20000)
  const errs=[]; page.on('pageerror', e=>errs.push(String(e)))
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(1500)
  await page.locator('.grid2 .grid-card button').first().click(); await page.waitForTimeout(900)
  await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1600)
  await page.getByText('데코', { exact: true }).first().click(); await page.waitForTimeout(900)
  await page.evaluate(() => { const e=[...document.querySelectorAll('.decor-sec-label')].find(x=>x.textContent.includes('마스킹')); if(e) e.scrollIntoView({block:'start'}) })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/wt-1.png` })
  const n = await page.evaluate(() => {
    const e=[...document.querySelectorAll('.decor-sec-label')].find(x=>x.textContent.includes('마스킹'))
    return e ? e.nextElementSibling.querySelectorAll('img').length : -1
  })
  const broken = await page.evaluate(() => [...document.querySelectorAll('.decor-scroll img')].filter(i=>!i.complete||i.naturalWidth===0).length)
  console.log(`마스킹테이프 ${n}종 · 깨진 것 ${broken}개`)
  // 실제로 하나 붙여보기
  await page.evaluate(() => { const e=[...document.querySelectorAll('.decor-sec-label')].find(x=>x.textContent.includes('마스킹')); e.nextElementSibling.querySelectorAll('button')[1].click() })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/wt-2.png` })
  console.log('pageerror:', errs.length ? errs.slice(0,2) : '없음')
  console.log('DONE')
} catch (e) { console.error('ERR', e.message) } finally { try { if (browser) await browser.close() } catch {} try { if (server && !server.killed) server.kill('SIGTERM') } catch {} }

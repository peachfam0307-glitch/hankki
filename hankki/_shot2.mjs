import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4195, HOST = '127.0.0.1', BASE = `http://${HOST}:${PORT}/`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
async function waitHttp(u, t = 45000) { const s = Date.now(); while (Date.now() - s < t) { try { const r = await fetch(u); if (r.status < 500) return } catch {} await new Promise(r => setTimeout(r, 400)) } throw new Error('preview 안 뜸') }
let server, browser
try {
  server = spawn('npx', ['vite','preview','--host',HOST,'--port',String(PORT),'--strictPort'], { cwd: '/home/user/hankki/hankki', env: process.env })
  await waitHttp(BASE)
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => { ['hankki:onboarded','hankki:coach:home2','hankki:coach:shop','hankki:coach:brag','hankki:coach:mine','hankki:coach:detail'].forEach(k => { try { localStorage.setItem(k,'1') } catch {} }) })
  const page = await ctx.newPage(); page.setDefaultTimeout(9000)
  const errs = []; page.on('pageerror', e => errs.push(String(e)))
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(1300)
  const home0 = await page.evaluate(() => document.body.innerText)
  console.log('미정리 0일 때 칩 숨김?', !/정리 안 한 레시피/.test(home0))
  await page.screenshot({ path: `${OUT}/n-0-home-empty.png` })

  // 유튜브 화면
  await page.getByRole('button', { name: '가져오기' }).first().click(); await page.waitForTimeout(700)
  await page.getByText('YouTube', { exact: false }).first().click(); await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/n-1-yt.png` })
  await page.getByText('링크만 저장해두기').first().click(); await page.waitForTimeout(500)
  await page.locator('input[inputmode="url"]').first().fill('https://youtu.be/dQw4w9WgXcQ')
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${OUT}/n-2-yt-link.png` })
  await page.getByText('바로가기로 저장').first().click(); await page.waitForTimeout(1200)
  console.log('저장 후 미정리 목록 감?', (await page.evaluate(() => document.body.innerText)).includes('Inbox'))

  // 인스타 화면
  await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1200)
  const home1 = await page.evaluate(() => document.body.innerText)
  console.log('저장 후 홈에 칩 뜸?', /정리 안 한 레시피 1개/.test(home1))
  await page.screenshot({ path: `${OUT}/n-3-home-chip.png` })
  await page.getByRole('button', { name: '가져오기' }).first().click(); await page.waitForTimeout(700)
  await page.getByText('Instagram', { exact: false }).first().click(); await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/n-4-ig.png` })
  console.log('pageerror:', errs.length ? errs.slice(0,2) : '없음')
  console.log('DONE')
} catch (e) { console.error('ERR', e.message) } finally { try { if (browser) await browser.close() } catch {} try { if (server && !server.killed) server.kill('SIGTERM') } catch {} }

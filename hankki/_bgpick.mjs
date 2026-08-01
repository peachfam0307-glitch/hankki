// 🔎 배경 피커 스와치가 «실제로» 움직이나 — 42px에서 두 프레임을 떠서 픽셀로 잰다.
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
const SC = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 })).newPage()
p.on('pageerror', (e) => console.log('❌ pageerror', e.message))
await p.goto('http://127.0.0.1:4173/')
await p.evaluate(() => { ;['hankki:onboarded','hankki:coach:home2','hankki:coach:detail','hankki:coach:decor'].forEach(k=>localStorage.setItem(k,'1')) })
await p.reload(); await p.waitForTimeout(2500)
console.log('버튼 수 =', await p.locator('button').count())
console.log('본문 =', (await p.locator('body').innerText()).slice(0,180).replace(/\n/g,' | '))
await p.waitForTimeout(1500)
const card = p.locator('.grid-card, .grid2 button, [class*=card] button').first()
await card.waitFor({timeout:15000}).catch(async()=>{ console.log('HTML:', (await p.content()).slice(0,400)) })
await card.click(); await p.waitForTimeout(900)
await p.getByText('레시피 꾸미기').first().click(); await p.waitForTimeout(1400)
const bgTab = p.getByRole('button', { name: '배경', exact: true }).first()
if (await bgTab.isVisible().catch(()=>false)) { await bgTab.click(); await p.waitForTimeout(700) }
const sw = p.locator('button[aria-label^="배경"] > span').first()
const lbl = await p.locator('button[aria-label^="배경"]').first().getAttribute('aria-label')
console.log('맨 앞 스와치 =', lbl)
const cls = await sw.getAttribute('class')
console.log('클래스 =', JSON.stringify(cls))
await sw.screenshot({ path: SC + 'sw_a.png' }); await p.waitForTimeout(1750)   // 7s 주기의 1/4
await sw.screenshot({ path: SC + 'sw_b.png' })
await p.locator('.decor-sec').filter({ hasText: '배경지' }).first().screenshot({ path: SC + 'bgrow.png' }).catch(()=>{})
await b.close()

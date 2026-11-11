// 🎬 [2026-11-11] 11/30 업뎃 예고 릴스 ③ — 크리스마스 홈 배경 → 꾸미기 서랍의 크리스마스 스티커를 «탁탁» 넘겨 보여준다
//    📮 창업자 = 「1번도 탁탁 넘어가게(스티커랑 홈배경 보여주고)」 · 앞은 꾸미기릴스-녹화.mjs 두 편(어묵탕·스키야키)
//    시계 = 2026-12-01(크리스마스 홈이 저절로 열리는 날) · 고화질 = 뷰포트 1080×2340 ＋ zoom (꾸미기릴스-녹화와 같은 길)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const 앱 = join(dirname(fileURLToPath(import.meta.url)), '..'); const DIST = join(앱, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4622, r))
const 밖 = process.env.OUT || '/tmp/claude-0/릴스-크리스마스예고-홈서랍'; mkdirSync(밖, { recursive: true })
// 🏠 홈은 zoom 고화질에서 칸이 깨진다(2026-11-11 실측 · 글자가 세로로 쌓임) → HQ=0 DSF=2.7692 로 «정지 화면»(홈.png)만 따로 찍는다
const HQ = process.env.HQ !== '0'; const 배율 = HQ ? 1080 / 390 : 1
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: HQ ? { width: 1080, height: 2340 } : { width: 390, height: 844 }, deviceScaleFactor: HQ ? 1 : Number(process.env.DSF || 2), locale: 'ko-KR', recordVideo: { dir: 밖, size: HQ ? { width: 1080, height: 2340 } : { width: 390, height: 844 } } })
await ctx.clock.setFixedTime(new Date('2026-12-01T11:00:00Z'))
await ctx.addInitScript(() => { try { for (const k of ['hankki:nudge:giftpack', 'hankki:nudge:cloudgate', 'hankki:onboarded', 'hankki:news:off']) localStorage.setItem(k, '1'); localStorage.setItem('hankki-theme', 'apricot'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch {} })
if (HQ) await ctx.addInitScript((z) => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = String(z) }) }, 배율)
const p = await ctx.newPage()
const 시작 = Date.now(); const 자막 = []; const 적기 = (w) => { 자막.push([((Date.now() - 시작) / 1000).toFixed(2), w]); console.log('  ⏱', 자막.at(-1)[0], w) }
const 안내치우기 = async () => { for (let i = 0; i < 12; i++) { const x = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await x.count() && await x.isVisible().catch(() => false)) { await x.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(250) } else return } }
await p.goto('http://127.0.0.1:4622/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); await 안내치우기()
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000); await 안내치우기()
적기('홈 (크리스마스)')
await p.waitForTimeout(2200); await p.screenshot({ path: join(밖, '홈.png') })
await p.mouse.wheel(0, 500 * 배율); await p.waitForTimeout(1200); await p.mouse.wheel(0, -500 * 배율); await p.waitForTimeout(900)
적기('홈 끝')
// 🎨 꾸미기 서랍 — 어묵탕 레시피 꾸미기를 열어 탭을 넘긴다
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(1000); await 안내치우기()
const 그것 = p.locator('text=어묵탕').first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
await 그것.scrollIntoViewIfNeeded(); await 그것.click({ force: true }); await p.waitForTimeout(1300); await 안내치우기()
await p.locator('[data-coach="decor"]').first().click({ force: true }); await p.waitForTimeout(1500); await 안내치우기()
적기('서랍 열림')
for (const 탭 of ['배경', '프레임', '마테', '데코', '친구들']) {
  await p.locator('button').filter({ hasText: new RegExp(`^${탭}$`) }).first().click(); await p.waitForTimeout(1100)
  적기(`탭 ${탭}`); await p.screenshot({ path: join(밖, `탭-${탭}.png`) })
  const 서랍 = p.locator('.decor-drawer, .decor-cells, .decor-sheet').first()
  if (탭 === '데코' || 탭 === '친구들') { await p.mouse.move(250 * 배율, 1250 * 배율 / 1.0 > 2300 ? 2200 : 700 * 배율); await p.mouse.wheel(0, 600 * 배율); await p.waitForTimeout(1100) }
}
적기('끝')
writeFileSync(join(밖, '자막.json'), JSON.stringify(자막, null, 2))
await ctx.close(); await b.close(); srv.close()
const v = readdirSync(밖).find((f) => f.endsWith('.webm')); renameSync(join(밖, v), join(밖, '녹화.webm')); console.log('✅ 녹화 →', join(밖, '녹화.webm'))

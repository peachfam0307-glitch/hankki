// 📸 ①편 「레시피 모으기」 대답 장면용 앱 화면 — 가져오기 · 레시피 목록 · 인덱스 (2026-10-21) · 크림 테마 고정
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4663, r))
const 밖 = process.env.OUT || '/tmp/①대답'; mkdirSync(밖, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR', hasTouch: true, ignoreHTTPSErrors: true })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki-theme', 'cream'); const 원래 = Element.prototype.setAttribute; Element.prototype.setAttribute = function (k, v) { if (k === 'data-season') return; return 원래.call(this, k, v) }; localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch { /* noop */ } })
if (process.env.FAKE_DAY) await ctx.clock.setFixedTime(new Date(process.env.FAKE_DAY))   // 🎃 핼러윈 철을 피해 평상시 화면으로 찍는다(창업자 2026-10-21 「갑자기 할로윈 나오니까 이상해」)
// 🖼 유튜브 썸네일(i.ytimg.com)은 브라우저가 프록시를 못 타서 curl 로 받아 넘긴다
await ctx.route(/i\.ytimg\.com/, async (r) => { try { r.fulfill({ body: execFileSync('curl', ['-sS', r.request().url()]), contentType: 'image/jpeg' }) } catch { r.abort() } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4663/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
const 탭 = async (이름) => { await p.locator('.bottom-nav .nav-item, nav button').filter({ hasText: 이름 }).first().click().catch(() => {}); await p.waitForTimeout(1300) }
await 탭('가져오기'); await p.screenshot({ path: join(밖, 'C1-가져오기.png') })
await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(500); await p.screenshot({ path: join(밖, 'C1-가져오기-아래.png') })
await p.keyboard.press('Escape').catch(() => {}); await p.locator('button[aria-label*="닫기"]').first().click().catch(() => {}); await p.waitForTimeout(800)
await 탭('레시피')
// 🎃 핼러윈 표지 샘플(통단호박)은 빼고 찍는다 — 창업자 2026-10-21 「갑자기 할로윈 나오니까 이상해」
// 🎃 상단바 핼러윈 컷 → 평상시 곰으로(날짜는 오늘 그대로 · 레시피 수가 오늘 값으로 나오게)
await p.evaluate(() => { const 곰 = [...document.querySelectorAll('img')].find((i) => /hw_\d+/.test(i.src)); const 원 = [...document.scripts].length; if (곰) { const 길 = performance.getEntriesByType('resource').map((x) => x.name).find((n) => n.includes('gom-header')); if (길) { 곰.src = 길; Object.assign(곰.style, { width: '42px', height: '42px', margin: '-4px 0' }) } else 곰.style.visibility = 'hidden' } return 원 })
await p.evaluate(() => { for (const e of document.querySelectorAll('.fav-dot')) { const 칸 = e.parentElement; if (칸 && 칸.textContent.includes('통단호박')) { 칸.remove(); break } } })
await p.waitForTimeout(400); await p.screenshot({ path: join(밖, 'C2-목록.png') })
const 클립 = p.locator('.fav-dot'); console.log('인덱스 단추', await 클립.count())
await 클립.nth(1).click().catch(() => {}); await p.waitForTimeout(400); await 클립.nth(2).click().catch(() => {}); await p.waitForTimeout(1500)
await p.screenshot({ path: join(밖, 'C4-인덱스.png') })
await p.locator('text=' + (process.env.YT || '어남선생 갈비치킨')).first().click().catch(() => {}); await p.waitForTimeout(2500)
await p.screenshot({ path: join(밖, 'C3-인스타레시피.png') })
await p.locator('text=영상으로 보기').first().evaluate((e) => e.scrollIntoView({ block: 'start' })).catch(() => {}); await p.mouse.wheel(0, -120); await p.waitForFunction(() => [...document.images].some((i) => i.src.includes('ytimg') && i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).catch(() => console.log('⚠️ 썸네일 못 받음')); await p.waitForTimeout(800); await p.screenshot({ path: join(밖, 'C3-재료.png') })
await b.close(); srv.close()

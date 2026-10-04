// 🎬🎃 10/14(수) 통단호박 릴스 — 앱을 «한 번에» 녹화해 끊김 없이 (2026-10-04)
//
// 📮 창업자 = *"1번에서 12에 꾸미기 스티커 열리는거 싹 지나가게 보여주자."* ＋ *"끊어지지않게 부드럽게 이어지게 만들어줘"*
// ⭐ 그래서 스샷 이어붙이기(슬라이드쇼)가 아니라 «녹화 한 줄기»다 — 꾸미기릴스-녹화.mjs 와 같은 얼개(뷰포트 1080×2340 ＋ CSS zoom).
//    글자는 녹화 위에 얹고(ffmpeg overlay · 페이드), 끝 장(두 스토어 알약)은 크로스페이드로 붙인다 — 툭 끊기는 곳이 없다.
//
// 흐름 (앱 부분은 녹화 길이를 «재서» 16초로 맞춘다)
//   0~3    통단호박 표지(핼러윈 펠트 샘플)            「통단호박 크림스프」
//   3~8    재료 → 순서 천천히 내려가기               「단호박 통째로, 40분」
//   8~12   다시 위로 → 꾸미기 열기
//   12~16  서랍을 쭉 훑기(친구들 → 프레임 → 데코 → 마테 → 배경)  「10월 16일, 할로윈 꾸미기가 열려요」
//   16~19  끝 장 = 앱 아이콘 ＋ App Store · Google Play 에서 「한끼 레시피북」 검색
//
// ⏰ 시계 = 2026-10-14 (통단호박 열리는 날) · 🔑 열쇠 ?할로윈=1 — 핼러윈 묶음이 10/16 전이라 열쇠 폰에서만 보인다(그리고 맨 위로 온다)
// 쓰는 법: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_릴스-통단호박-1004.mjs   (먼저 npm run build)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(앱, 'dist')
const FF = join(앱, 'node_modules/ffmpeg-static/ffmpeg')
const 밖 = process.env.OUT || '/tmp/claude-0/릴스-통단호박'
const 낼곳 = join(앱, 'design/promo/인스타-2610')
const 낼파일 = join(낼곳, '릴스-통단호박-2026-10-14.mp4')
rmSync(밖, { recursive: true, force: true }); mkdirSync(밖, { recursive: true }); mkdirSync(낼곳, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4622, r))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 배율 = 1080 / 390
const t0 = Date.now()   // ⏱ 녹화는 «컨텍스트를 만들 때» 시작한다 — 시계도 여기서 잰다
const ctx = await b.newContext({ viewport: { width: 1080, height: 2340 }, deviceScaleFactor: 1, locale: 'ko-KR', recordVideo: { dir: 밖, size: { width: 1080, height: 2340 } } })
await ctx.clock.setFixedTime(new Date('2026-10-14T11:00:00Z'))
await ctx.addInitScript((z) => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = String(z) }) }, 배율)
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:열쇠:할로윈', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')   // 🎁 받은 선물 시트가 덮으면 흐리고 탭이 안 눌린다(nudges.js K_GIFT)
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
  } catch { /* noop */ }
})
const p = await ctx.newPage()
// 🟥 싱크 표식 — 벽시계로 자르면 녹화가 밀려 장면이 엇갈린다(2026-10-04 실측 · 다섯 번). 그래서 «화면에» 표식을 찍고 영상에서 찾는다.
//    왼쪽 위 상태줄 자리(굽기에서 잘려 나가는 110px 안)에 장면마다 다른 색 네모를 띄운다.
const 색 = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff']
const 표 = {}; const 순서 = []
const 적기 = async (k) => {
  const i = 순서.length; 순서.push(k); 표[k] = (Date.now() - t0) / 1000; console.log('  ⏱', 표[k].toFixed(2), k)
  await p.evaluate((c) => { let d = document.getElementById('reel-sync'); if (!d) { d = document.createElement('div'); d.id = 'reel-sync'; d.style.cssText = 'position:fixed;left:0;top:0;width:14px;height:14px;z-index:2147483647;pointer-events:none'; document.body.appendChild(d) } d.style.background = c }, 색[i])
}
const 치우기 = async () => { for (let i = 0; i < 8; i++) { const x = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await x.count() && await x.isVisible().catch(() => false)) { await x.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(250) } else return } }
// 🖱 부드럽게 굴리기 — 한 번에 뛰지 않고 작은 걸음으로(녹화에 «흐름»이 보이게)
const 굴리기 = async (sel, dy, 걸음, 쉼 = 16) => { for (let i = 0; i < 걸음; i++) { await p.evaluate(([s, d]) => { const e = s ? document.querySelector(s) : document.scrollingElement; (e || document.scrollingElement).scrollBy(0, d) }, [sel, dy / 걸음]); await p.waitForTimeout(쉼) } }

await p.goto('http://127.0.0.1:4622/hankki/?할로윈=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); await 치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(1000); await 치우기()
const 찾기 = p.getByPlaceholder(/내 레시피에서 찾기/)
if (await 찾기.count()) { await 찾기.first().fill('통단호박'); await p.waitForTimeout(900) }
// 🎃 첫 장면 = 레시피 목록의 «큰 표지 카드»(상세 화면 표지는 작다 — 1차 녹화 실측) → 눌러 들어간다
//    통단호박은 「전체」 첫 줄 오른쪽에 있다(2026-10-04 실측) — 목록을 맨 위로 돌려 두고 보여 준다
const 맨위 = () => p.evaluate(() => { document.scrollingElement.scrollTop = 0; document.querySelectorAll('*').forEach((e) => { if (e.scrollTop > 0) e.scrollTop = 0 }) })
await 맨위(); await p.waitForTimeout(700)
await 적기('표지')
await p.waitForTimeout(1600)
// 🎃 고화질(zoom)에선 목록이 «한 줄»이라 통단호박이 꽃게탕 «아래»에 있다 — 그 카드까지 부드럽게 내려간다
const 카드 = p.getByText('통단호박 크림스프', { exact: false }).last()
const 카드y = await 카드.evaluate((e) => { const c = e.closest('button,a,[role=button]') || e; return c.getBoundingClientRect().top })
await p.mouse.move(540, 1400)
const 갈 = Math.max(0, 카드y - 360)   // 카드 머리가 위에서 360px 쯤 오게 (⛔ ×배율 하면 세 배 넘어간다 — 실측)
for (let i = 0; i < 45; i++) { await p.mouse.wheel(0, 갈 / 45); await p.waitForTimeout(20) }
await p.waitForTimeout(1300)
await 카드.click({ force: true }); await p.waitForTimeout(150); await 맨위(); await p.waitForTimeout(1200); await 치우기()
await 맨위()   // 상세는 목록의 스크롤 자리를 물려받는다 — 맨 위(표지·제목)부터
await 적기('내려가기')
// 🖱 레시피 화면은 window 가 아니라 안쪽 칸이 구른다 — 휠로 굴린다(2026-10-04 실측: scrollBy 는 안 먹고 wheel 은 먹는다)
await p.mouse.move(540, 1400)
for (let i = 0; i < 150; i++) { await p.mouse.wheel(0, 2600 / 150 * 배율); await p.waitForTimeout(18) }
await p.waitForTimeout(400)
await 적기('올라가기')
for (let i = 0; i < 60; i++) { await p.mouse.wheel(0, -2700 / 60 * 배율); await p.waitForTimeout(14) }
await p.waitForTimeout(700)
await 적기('꾸미기열기')
await p.locator('[data-coach="decor"]').first().click({ force: true }); await p.waitForTimeout(1600)
// 🎁 꾸미기를 열면 「받은 선물」 시트가 뜬다 — 덮인 채면 화면이 흐리고 탭이 안 눌린다(2026-10-04 1차 녹화 실측)
for (const 글 of ['나중에 볼게요', '닫기']) { const x = p.locator('button').filter({ hasText: 글 }).first(); if (await x.count() && await x.isVisible().catch(() => false)) { await x.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500); break } }
await 치우기()
await 적기('서랍')
const 탭 = async (라벨) => { const t = p.locator('button').filter({ hasText: new RegExp(`^${라벨}$`) }).first(); if (await t.count()) { await t.click({ timeout: 2500 }).catch(() => {}); await p.waitForTimeout(350) } }
for (const 라벨 of ['친구들', '프레임', '데코', '마테', '배경']) {
  await 탭(라벨)
  const 칸 = await p.evaluate(() => { document.querySelectorAll('[data-reel-drawer]').forEach((e) => e.removeAttribute('data-reel-drawer')); const d = document.querySelector('.decor-drawer'); if (!d) return null; const c = [...d.querySelectorAll('*')].find((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 40); if (!c) return null; c.setAttribute('data-reel-drawer', '1'); return '[data-reel-drawer]' })
  await p.waitForTimeout(500)   // 맨 위(핼러윈 묶음)를 먼저 보여 준다
  if (칸) await 굴리기(칸, 500, 30, 20)
  await p.waitForTimeout(200)
}
await 적기('끝')
await p.waitForTimeout(500)
const 영상 = await p.video().path()
await ctx.close(); const 벽끝 = (Date.now() - t0) / 1000; await b.close(); srv.close()
// ⏱ 녹화 시간 ≠ 벽시계 — 무거운 화면에선 녹화가 밀린다(2026-10-04 실측: 첫 장면이 엉뚱하게 잘렸다). 영상 길이로 «비례» 보정한다
const 영상길이 = (() => { try { execFileSync(FF, ['-i', 영상], { stdio: 'pipe' }) } catch (e) { const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr)); if (m) return m[1] * 3600 + m[2] * 60 + Number(m[3]) } return 벽끝 })()
console.log('영상', 영상길이.toFixed(2), '벽', 벽끝.toFixed(2))
{ // 🟥 영상에서 표식 색이 «처음 보인» 때를 찾는다 (10fps · 왼쪽 위 20px 평균)
  const 원 = execFileSync(FF, ['-v', 'error', '-i', 영상, '-vf', 'fps=10,crop=24:24:6:6,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 })
  const 가까운 = (r, g, bb) => 색.findIndex((c) => { const n = parseInt(c.slice(1), 16); return Math.abs((n >> 16) - r) < 70 && Math.abs(((n >> 8) & 255) - g) < 70 && Math.abs((n & 255) - bb) < 70 })
  const 찾은 = {}
  for (let f = 0; f * 3 + 2 < 원.length; f++) { const i = 가까운(원[f * 3], 원[f * 3 + 1], 원[f * 3 + 2]); if (i >= 0 && 순서[i] && 찾은[순서[i]] === undefined) 찾은[순서[i]] = f / 10 }
  for (const k of 순서) { if (찾은[k] === undefined) { console.error('⛔ 표식을 못 찾았다:', k); process.exit(1) } 표[k] = 찾은[k] }
  console.log('🟥 영상 속 자리', JSON.stringify(표))
}
console.log('🎥', 영상, JSON.stringify(표))

// ───────── 굽기 ─────────
// 앱 부분 = 「표지」부터 「끝」까지 → 16초로 배속. 위 110px(상태줄) 덜어 1080×1920 으로 자른다.
const 앱길이 = 16, 끝장 = 3, 겹침 = 0.6
const 배속 = (표['끝'] - 표['표지']) / 앱길이
const 맞춤 = (k) => (표[k] - 표['표지']) / 배속
console.log('배속', 배속.toFixed(2), '서랍 시작', 맞춤('서랍').toFixed(2))

// 🖼 글자 판 셋 ＋ 끝 장 — 앱과 같은 글꼴(고운돋움)로 Playwright 가 그린다
const 폰트 = readFileSync(join(앱, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(앱, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')
const 아이콘 = 'data:image/png;base64,' + readFileSync(join(앱, 'public/icons/icon-512-v7.png')).toString('base64')
const 머리 = `<style>@font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
@font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif}body{width:1080px;height:1920px;background:transparent;position:relative}
.띠{position:absolute;left:70px;right:70px;bottom:250px;background:rgba(48,34,66,.86);color:#fff;border-radius:40px;padding:38px 30px;text-align:center;font-size:66px;line-height:1.3;font-weight:700}
.끝{position:absolute;inset:0;background:#3b2c4f;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px;color:#fff}
.끝 .큰{font-size:84px;font-weight:700;text-align:center;line-height:1.3}
.알약{display:inline-flex;align-items:center;gap:16px;background:#fff;border-radius:999px;padding:24px 46px 24px 26px;font-size:42px;color:#5a4b6b;line-height:1.35}
.알약 img{width:90px;height:90px;border-radius:22px}</style>`
const 판들 = {
  t1: '<div class="띠">통단호박 크림스프</div>',
  t2: '<div class="띠">단호박 통째로, 40분</div>',
  t3: '<div class="띠" style="bottom:auto;top:150px">10월 16일,<br>할로윈 꾸미기가 열려요</div>',   // 서랍을 안 가리게 «위»에
  end: `<div class="끝"><div class="큰">10월 16일<br>할로윈 꾸미기 오픈</div><span class="알약"><img src="${아이콘}"><span>App Store · Google Play 에서<br><b style="color:#3b2c4f;font-size:52px">한끼 레시피북</b> 검색</span></span></div>`,
}
const b2 = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b2.newContext({ viewport: { width: 1080, height: 1920 } })).newPage()
for (const [k, h] of Object.entries(판들)) { await pg.setContent('<!doctype html><html><head>' + 머리 + '</head><body>' + h + '</body></html>'); await pg.waitForTimeout(300); await pg.screenshot({ path: join(밖, k + '.png'), omitBackground: k !== 'end' }) }
await b2.close()

const 창 = [[0.2, 3.0, 't1'], [3.2, 8.0, 't2'], [Math.max(맞춤('서랍'), 10).toFixed(2), 앱길이, 't3']]
let f = `[0:v]trim=start=${표['표지'].toFixed(2)}:end=${표['끝'].toFixed(2)},setpts=(PTS-STARTPTS)/${배속.toFixed(4)},crop=1080:1920:0:110,fps=30,format=yuva420p[a0]`
창.forEach(([s, e, k], i) => {
  f += `;[${i + 1}:v]format=rgba,fade=t=in:st=${s}:d=0.35:alpha=1,fade=t=out:st=${(e - 0.35).toFixed(2)}:d=0.35:alpha=1[o${i}]`
  f += `;[a${i}][o${i}]overlay=0:0:enable='between(t,${s},${e})'[a${i + 1}]`
})
f += `;[4:v]format=rgba,fade=t=in:st=${(앱길이 - 겹침).toFixed(2)}:d=${겹침}:alpha=1[eo]`
f += `;[a3]tpad=stop_mode=clone:stop_duration=${끝장}[ax];[ax][eo]overlay=0:0:enable='gte(t,${(앱길이 - 겹침).toFixed(2)})',trim=duration=${앱길이 + 끝장},format=yuv420p[v]`
execFileSync(FF, ['-y', '-i', 영상,
  '-loop', '1', '-t', String(앱길이 + 끝장), '-i', join(밖, 't1.png'),
  '-loop', '1', '-t', String(앱길이 + 끝장), '-i', join(밖, 't2.png'),
  '-loop', '1', '-t', String(앱길이 + 끝장), '-i', join(밖, 't3.png'),
  '-loop', '1', '-t', String(앱길이 + 끝장), '-i', join(밖, 'end.png'),
  '-filter_complex', f, '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', 낼파일], { stdio: 'inherit' })
console.log('✅', 낼파일)

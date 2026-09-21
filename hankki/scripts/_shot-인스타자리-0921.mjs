// 📸 [2026-09-21] 인스타 바로가기 «자리» 시안 — 앱 코드 안 건드리고 홈에 흉내만 얹어 찍는다(창업자가 고른다)
//    A = 상단바 오른쪽 아이콘 · B = 「한끼 소식」 카드 아래 한 줄 · C = 설정 목록 한 줄
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/hankki/hankki/dist'
const OUT = process.env.OUT || '/tmp'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { const b = readFileSync(join(DIST, p)); s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(b) } catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 아이콘 = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor"/></svg>'
async function 판(이름, 얹기, 설정으로 = false) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2000)
  for (let i = 0; i < 4; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(300) }
  if (설정으로) { await p.locator('.topbar [aria-label="설정"]').first().click(); await p.waitForTimeout(900) }   // 설정은 하단 탭이 아니라 상단바 톱니(BottomNav.jsx:8)
  await p.evaluate(얹기, 아이콘)
  await p.waitForTimeout(400)
  // 설정 판은 얹은 줄이 접힌 화면 아래에 있다 → 그 줄이 보이게 내린 뒤 찍는다(안 그러면 «빈 판»을 보낸다 · 절대원칙 21)
  if (설정으로) { await p.evaluate(() => { const e = [...document.querySelectorAll('*')].find((x) => x.childElementCount === 0 && (x.textContent || '').trim() === '인스타그램'); e && e.scrollIntoView({ block: 'center' }) }); await p.waitForTimeout(400) }
  await p.screenshot({ path: join(OUT, `인스타자리-${이름}.png`) })
  await ctx.close()
}
await 판('A-상단바', (svg) => {
  const bar = document.querySelector('.topbar'); if (!bar) throw new Error('topbar 없음')
  const right = bar.lastElementChild
  const btn = document.createElement('button'); btn.className = 'press'
  btn.style.cssText = 'width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border:none;background:transparent;color:var(--brown)'
  btn.innerHTML = svg; right.insertBefore(btn, right.firstChild)
})
await 판('B-소식아래', (svg) => {
  const t = [...document.querySelectorAll('.news-title')][0]; if (!t) throw new Error('한끼 소식 없음')
  // 카드 «바깥» = 글자에서 올라가며 처음으로 폭이 화면의 80% 넘는 조상 (안쪽 요소에 끼우면 카드 속에 박힌다 — 첫 판이 그랬다)
  let card = t; while (card.parentElement && card.getBoundingClientRect().width < window.innerWidth * 0.8) card = card.parentElement
  const row = document.createElement('button'); row.className = 'press'
  row.style.cssText = 'width:100%;margin-top:8px;display:flex;align-items:center;gap:10px;padding:11px 14px;border:1.5px solid var(--line);border-radius:14px;background:var(--surface);color:var(--text);font-size:15px;font-weight:700;text-align:left'
  row.innerHTML = `<span style="color:var(--brown);display:inline-flex">${svg}</span><span style="flex:1">인스타그램에서 한끼 보기 <span style="color:var(--text-sub);font-weight:600">@annyeong_hankki</span></span><span style="color:var(--text-sub)">›</span>`
  card.insertAdjacentElement('afterend', row)
})
await 판('C-설정', (svg) => {
  const star = [...document.querySelectorAll('*')].find((e) => e.childElementCount === 0 && (e.textContent || '').trim() === '스토어에 한마디')
  if (!star) throw new Error('스토어에 한마디 없음')
  const row = star.closest('button, .press, li, [role="button"]'); if (!row) throw new Error('줄 없음')
  const c = row.cloneNode(true)
  const 글 = [...c.querySelectorAll('*')].filter((e) => e.childElementCount === 0)
  for (const e of 글) { const s = (e.textContent || '').trim(); if (s === '스토어에 한마디') e.textContent = '인스타그램'; else if (s === '리뷰 남기기') e.textContent = '@annyeong_hankki' }
  const ic = c.querySelector('svg'); if (ic) ic.outerHTML = svg
  row.insertAdjacentElement('afterend', c)
}, true)
await b.close(); srv.close()
console.log('✅ 3장 →', OUT)

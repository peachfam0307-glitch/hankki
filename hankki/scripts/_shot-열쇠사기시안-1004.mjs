// 📸 열쇠 사기 시안 — 실제 앱 화면 위에 링크·시트를 «얹어서» 찍는다 (2026-10-04 창업자 「보여줘 시안」) · 앱 코드는 안 고친다
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/80070571-2b0b-555b-9e75-fec80b60b45e/scratchpad'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body) })
await new Promise((r) => srv.listen(4393, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const 링크 = `<a style="display:inline-block;margin-top:8px;font-size:13.5px;font-weight:700;color:var(--brown);text-decoration:underline;text-underline-offset:3px">레시피열쇠 더 받기</a>`
async function 새판(남은) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript((n) => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    for (const k of Object.keys(localStorage)) if (/ocr.*left|keyLeft|ocrLeft/i.test(k)) localStorage.removeItem(k) }, 남은)
  await p.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  return { ctx, p }
}
// Ⓒ 설정
{ const { ctx, p } = await 새판(3)
  await p.click('button[aria-label="설정"]'); await p.waitForTimeout(1200)
  // 🏪 [창업자 10/4 14:23] 설정은 글자 대신 «상점 아이콘 ＋ 아래 레꾸상점»
  const 상점 = `<button style="display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;color:var(--brown);padding:0">
    <span style="width:46px;height:46px;border-radius:14px;background:var(--cream);display:flex;align-items:center;justify-content:center">
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5V19a1.5 1.5 0 001.5 1.5h13A1.5 1.5 0 0020 19V9.5"/><path d="M3 9.5l1.6-5h14.8l1.6 5"/><path d="M3 9.5a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/><path d="M10 20.5v-5h4v5"/></svg></span>
    <span style="font-size:12.5px;font-weight:800">한끼상점</span></button>`
  const ok = await p.evaluate((h) => { const k = document.querySelector('.imp-key'); if (!k) return false; k.insertAdjacentHTML('afterend', h); return true }, 상점)
  console.log('설정 열쇠칸', ok)
  await p.screenshot({ path: join(OUT, '시안-C-설정.png') }); await ctx.close() }
// Ⓑ 가져오기 → 사진
{ const { ctx, p } = await 새판(3)
  await p.getByText('가져오기', { exact: true }).first().click(); await p.waitForTimeout(1000)
  await p.screenshot({ path: join(OUT, '시안-B0-가져오기목록.png') })
  const ok = await p.evaluate((h) => { const k = document.querySelector('.imp-key'); if (!k) return false; k.insertAdjacentHTML('afterend', `<div style="text-align:center">${h}</div>`); return true }, 링크)
  console.log('가져오기 열쇠칸', ok)
  await p.screenshot({ path: join(OUT, '시안-B-가져오기.png') })
  // Ⓐ 0개 시트
  await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', `<div class="sheet-mask"><div class="sheet" style="padding-bottom:calc(20px + var(--safe-bottom))">
    <div class="emoji-sheet-head"><span>레시피열쇠를 다 썼어요</span><button style="color:var(--text-sub);font-size:16px;font-weight:600">닫기</button></div>
    <div style="padding:4px 16px 0">
      <div style="display:flex;align-items:center;gap:10px;background:var(--cream);border-radius:13px;padding:14px;margin-bottom:11px;font-size:17px;font-weight:800">${document.querySelector('.imp-key img')?.outerHTML.replace('<img','<img style="height:34px;width:auto"') || ''}레시피열쇠 20개</div>
      <div style="font-size:15.5px;color:var(--text-sub);line-height:1.6;margin-bottom:11px">캡처한 레시피를 AI로 정리할 때 한 장에 하나씩 써요. 열쇠 없이도 사진은 그대로 담을 수 있어요.</div>
      <button style="width:100%;padding:13px 12px;border-radius:14px;border:none;background:#b5714a;color:#fff;font-size:17px;font-weight:800">990원 · 20개 받기</button>
      <button style="width:100%;padding:10px;border:none;background:none;color:var(--text-sub);font-size:15.5px;font-weight:600;margin-top:4px">열쇠 없이 담기</button>
    </div></div></div>`) })
  await p.waitForTimeout(300)
  await p.screenshot({ path: join(OUT, '시안-A-0개시트.png') }); await ctx.close() }
await b.close(); srv.close()

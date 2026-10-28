// 📁↕ [2026-09-24] 폴더 칩 «순서 바꾸기» 시안 A — 창업자 판정용
// 📮 창업자 2026-09-23 = *"폴더 위치를 조정할 수 있는건 내일 만들자"* → 2026-09-24 *"a시안 보여줘"*
// ⛔ 앱 소스는 안 고친다 — 진짜 레시피 화면을 열고 그 위에 시트를 «얹어» 찍는다.
//   ① 칩 줄 끝에 「순서」 칩 ② 누르면 뜨는 시트(위·아래 화살표) ③ 옮긴 뒤 칩 줄
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4510, r))
const OUT = process.env.SHOT_OUT || '/tmp/폴더순서'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4510/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600); await 치우기(p)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1500); await 치우기(p)
await p.screenshot({ path: join(OUT, '0-지금.png') })

// 칩 줄에서 이름을 읽는다(진짜 값)
const 칩 = await p.evaluate(() => {
  const 줄 = [...document.querySelectorAll('button')].filter((b) => /^(반찬|국|밥|면|간식|샐러드|소스|한식|양식|일식|중식|아시안|기타)/.test(b.innerText.trim()))
  return 줄.map((b) => b.innerText.trim().replace(/\s*\d+$/, '')).filter((n) => !/\s/.test(n))   // 레시피 제목(「국물 떡볶이」)이 섞이지 않게
})
const 목록 = [...new Set(칩)].concat(['우리집 반찬', '다이어트'])   // 시안용 «내가 만든 폴더» 둘
console.log('칩 =', 목록.join(' · '))

const 시트 = (items, 강조) => `
  <div id="mock" style="position:fixed;inset:0;z-index:99999;background:rgba(40,28,18,.42);display:flex;align-items:flex-end">
    <div style="width:100%;max-height:78%;overflow:auto;background:var(--surface,#fffaf3);border-radius:22px 22px 0 0;padding:18px 18px 26px;font-family:inherit">
      <div style="width:40px;height:4px;border-radius:9px;background:#d8cbb8;margin:0 auto 14px"></div>
      <div style="font-size:19px;font-weight:900;color:#5d3410;margin-bottom:4px">폴더 순서 바꾸기</div>
      <div style="font-size:14.5px;color:#9a8a76;margin-bottom:14px">화살표로 옮기면 레시피 칩 줄이 이 순서로 바뀌어요.<br>「전체 · 내 것 · 최애」는 늘 맨 앞이에요.</div>
      ${items.map((n, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:11px 12px;margin-bottom:8px;border-radius:14px;background:${n === 강조 ? 'color-mix(in srgb,#e0703a 14%,#f6efe4)' : '#f6efe4'};${n === 강조 ? 'box-shadow:inset 4px 0 0 #e0703a;' : ''}">
          <span style="width:22px;text-align:center;color:#b6a58f;font-weight:800;font-size:14px">${i + 1}</span>
          <span style="flex:1;font-size:16.5px;font-weight:800;color:#3d2a1a">${n}</span>
          <button style="width:40px;height:36px;border-radius:10px;border:1.5px solid #e2d5c2;background:#fff;color:${i === 0 ? '#d9cdbd' : '#5d3410'};font-size:18px;font-weight:900">↑</button>
          <button style="width:40px;height:36px;border-radius:10px;border:1.5px solid #e2d5c2;background:#fff;color:${i === items.length - 1 ? '#d9cdbd' : '#5d3410'};font-size:18px;font-weight:900">↓</button>
        </div>`).join('')}
      <div style="display:flex;gap:10px;margin-top:10px">
        <button style="flex:1;height:48px;border-radius:14px;border:1.5px solid #e2d5c2;background:#fff;font-size:16px;font-weight:800;color:#7a6650">처음 순서로</button>
        <button style="flex:1;height:48px;border-radius:14px;border:none;background:#5d3410;font-size:16px;font-weight:900;color:#fff">다 했어요</button>
      </div>
    </div>
  </div>`
await p.evaluate((h) => document.body.insertAdjacentHTML('beforeend', h), 시트(목록, null))
await p.waitForTimeout(300)
await p.screenshot({ path: join(OUT, '1-시트.png') })
// 「우리집 반찬」을 맨 앞으로 올린 모습
const 옮김 = ['우리집 반찬', ...목록.filter((n) => n !== '우리집 반찬')]
await p.evaluate((h) => { document.getElementById('mock').remove(); document.body.insertAdjacentHTML('beforeend', h) }, 시트(옮김, '우리집 반찬'))
await p.waitForTimeout(300)
await p.screenshot({ path: join(OUT, '2-옮긴뒤.png') })
console.log(`📂 ${OUT}`)
await b.close(); srv.close()

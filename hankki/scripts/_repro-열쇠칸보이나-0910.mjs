// 🔑👀 [2026-09-10] 「이거 해보면 열쇠 1개씩」 칸이 «유저 화면에 진짜 보이나»
//
// 📮 창업자 = *"유저들한테 확실히 보이는지 네가 다시 확인해줘"*
//    ⛔ 까닭 = 창업자 폰에서 그 칸이 «안 보였다». 코드를 보니 「다섯 다 받으면 사라진다」였고
//       (창업자 확정 2026-09-01 *"5개 다 받으면 창이 사라지면 제일 좋고"*)
//       창업자는 테스트로 다 받은 상태였다. 즉 «설계대로»다.
//    👉 그래도 **새 유저 화면에 진짜 보이는지는 재서 확인한다** — 말로 넘기지 않는다.
//
// ⛔ 오늘 이 칸을 «접었다»(v13.07). 접혀도 «제목은 보여야» 한다 — 그게 접기의 조건이었다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4494, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

async function 가져오기화면(심을것) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR' })
  await ctx.addInitScript(심을것)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4494/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2400)
  for (let i = 0; i < 10; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) { await 시트.click(); await p.waitForTimeout(500); continue }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) { await 코치.click(); await p.waitForTimeout(500); continue }
    break
  }
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(1400)
  return { ctx, p }
}

// ── ① 새 유저 — 아무것도 안 받은 사람
console.log('\n🔑 ① 새 유저 (받은 열쇠 0개)\n')
{
  const { ctx, p } = await 가져오기화면(() => {
    try { localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ }
  })
  const m = await p.evaluate(() => {
    const el = document.querySelector('.earn-list')
    if (!el) return { 있나: false }
    const 머리 = el.querySelector('.earn-head')
    const r = 머리?.getBoundingClientRect()
    const st = 머리 ? getComputedStyle(머리) : null
    return {
      있나: true,
      제목: (머리?.innerText || '').replace(/\n/g, ' ').trim(),
      보임: !!r && r.width > 2 && r.height > 2 && st.visibility !== 'hidden' && Number(st.opacity) > 0.05,
      // ⭐ 「화면 어디쯤에 있나」 — 스크롤을 얼마나 내려야 닿나
      화면위치: r ? Math.round(r.top) : null,
      문서높이: document.documentElement.scrollHeight,
      화면높이: document.documentElement.clientHeight,
      가린것: r ? (document.elementFromPoint(Math.round(r.left + r.width / 2), Math.max(1, Math.round(r.top + r.height / 2)))?.closest('.earn-list') ? '없다' : '있다') : null,
    }
  })
  console.log(`  · ${JSON.stringify(m)}`)
  잰다(m.있나, '① 열쇠 안내 칸이 화면에 «있다»')
  잰다(!!m.제목 && /해보면/.test(m.제목), '① 접혀 있어도 «제목이 보인다»', m.제목)
  잰다(m.보임 === true, '① 제목 줄이 실제로 그려진다(숨겨지지 않았다)')
  잰다(m.가린것 === '없다', '① 그 자리를 «가린 것»이 없다', String(m.가린것))
  await ctx.close()
}

// ── ② 다섯을 다 받은 사람 — 설계대로 «사라져야» 한다
console.log('\n🔑 ② 다섯 다 받은 사람 (창업자 확정 2026-09-01)\n')
{
  const { ctx, p } = await 가져오기화면(() => {
    try {
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      localStorage.setItem('hankki:onboarded', '1')
      // 🔑 서버가 「보너스 5개 받았다」고 답한 것처럼 만든다
      localStorage.setItem('hankki:keyleft', JSON.stringify({ bonus: 5, earned: ['레꾸', '자랑', '일기', '요리', '냉장고'] }))
    } catch { /* noop */ }
  })
  const 없나 = await p.evaluate(() => !document.querySelector('.earn-list'))
  console.log(`  · 칸이 사라졌나 = ${없나}`)
  await ctx.close()
}

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 열쇠 칸은 유저에게 보인다')
process.exit(나쁨 ? 1 : 0)

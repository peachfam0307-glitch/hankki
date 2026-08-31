// 💡 [2026-08-22] 홈 카드가 배경보다 «얼마나» 가라앉나 — 「칙칙하다」를 숫자로
//
// 📮 창업자 = *"**아직안해봤어요랑 추천도 칙칙한데**"*
//    (그 앞 = 톤D 로 배경을 «한 단 밝게» 했다 → 베이지 카드들이 상대적으로 가라앉았다)
//
// ⭐ 잣대 = **밝기(luminance) 차이.** 카드가 배경보다 «밝아야» 떠 보인다.
//    2026-08-21 에 「칙칙함」의 정체를 이 잣대로 찾았다(주간 카드가 −0.083 이었다).
// ⛔ 색 이름·CSS 변수로 짐작하지 않는다 — **화면에 실제로 칠해진 값**을 읽는다.
//    그라데이션은 `backgroundColor` 가 «투명»으로 나오므로 `backgroundImage` 도 같이 본다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-홈밝기-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4437, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
// 🎨 테마를 골라 잰다 — 배경을 바꾸면 그 위의 것을 «전부» 다시 재야 한다(v11.21 톤D 교훈).
//    THEME=apricot node scripts/_probe-홈밝기-0822.mjs
const 테마 = process.env.THEME || ''
await ctx.addInitScript((t) => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); if (t) localStorage.setItem('hankki-theme', t) } catch {} }, 테마)
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4437/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)

const 결과 = await p.evaluate(() => {
  const 밝기 = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  const 숫자 = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number)
  // ⭐ 그라데이션이면 «그 안의 색들»을 다 꺼내 제일 어두운 것을 쓴다 — 눈에 걸리는 건 어두운 쪽이다
  const 칠해진밝기 = (el) => {
    const cs = getComputedStyle(el)
    const 색들 = []
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') 색들.push(숫자(cs.backgroundColor))
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      for (const m of cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []) 색들.push(숫자(m))
    }
    if (!색들.length) return null
    const 값 = 색들.map((c) => 밝기(c[0], c[1], c[2]))
    return { 최소: Math.min(...값), 최대: Math.max(...값) }
  }
  const 바탕 = 칠해진밝기(document.querySelector('.app-frame') || document.body)
  const 것 = []
  const 후보 = ['.news-card', '.next-row', '.today-card', '.weekly-box']
  for (const sel of 후보) {
    const el = document.querySelector(sel)
    if (!el) { 것.push({ sel, 없음: true }); continue }
    const v = 칠해진밝기(el)
    const r = el.getBoundingClientRect()
    것.push({ sel, 최소: v?.최소 ?? null, 최대: v?.최대 ?? null, 키: Math.round(r.height), 글: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 18) })
  }
  return { 바탕: 바탕?.최소 ?? null, 것 }
})

console.log(`\n💡 홈 카드 밝기 — 배경(app-frame) = ${결과.바탕?.toFixed(3)}\n`)
console.log('  고르개            키    제일어두운   배경과 차이        내용')
for (const t of 결과.것) {
  if (t.없음) { console.log(`  ${t.sel.padEnd(16, ' ')} ⛔ 화면에 없다`); continue }
  if (t.최소 == null) { console.log(`  ${t.sel.padEnd(16, ' ')} ${String(t.키).padStart(4)}   (색 없음 — 부모 배경 그대로)  ${t.글}`); continue }
  const d = t.최소 - 결과.바탕
  const 말 = d >= 0.01 ? '떠 보인다 ✅' : d <= -0.01 ? '가라앉는다 ⛔' : '거의 같다 ⚠️'
  console.log(`  ${t.sel.padEnd(16, ' ')} ${String(t.키).padStart(4)}   ${t.최소.toFixed(3)}     ${(d >= 0 ? '+' : '') + d.toFixed(3)} ${말.padEnd(12, ' ')} ${t.글}`)
}
console.log('\n⭐ 읽는 법')
console.log('   · 카드는 배경보다 «밝아야» 떠 보인다. 마이너스면 배경에 가라앉아 「칙칙」해진다')
console.log('   · 그라데이션은 «제일 어두운 쪽»으로 본다 — 눈에 걸리는 건 그쪽이다')
console.log('   ⛔ 다만 「밝게」가 곧 「좋다」는 아니다 — 다 밝히면 «주인공»이 사라진다')

await b.close(); srv.close()

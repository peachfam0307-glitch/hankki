// 🐻🐧 프로필 아이콘 시트 — 「한끼 친구들」 다섯만 남았나 · 기본 썸네일이 카와이가 아닌가 (2026-09-02)
//
// 📮 창업자 = *"저기 우리애들 ㅋㅋㅋ 지금봤어 ㅋㅋ 그리고 **나머지애들은 지우자. 오리지널이랑..**"*
//    → *"**우리애들이라는 말은 지우자.**"* → *"**한끼친구들**이라고 하면 좋을 듯"*
//    → *"한끼아이콘으로 하기에 아이콘이 **뚝배기 카와이스타일**이라고"*
//
// ⭐ 왜 찍나 = 숫자로는 「무엇으로 보이나」를 못 잰다(절대원칙 21).
//    바꾼 게 «목록에서 셋을 내린 것»이라 **남은 줄의 여백·줄바꿈이 어떻게 되는지는 눈으로만 안다.**
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-프로필아이콘-0902.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4391, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4391/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)

// 설정은 홈 상단바에 있다(v11.21 부터 🔍검색 · 🗃임시보관함 · ⚙설정)
const 설정 = p.getByRole('button', { name: /설정/ }).first()
if (!(await 설정.count())) { console.error('⛔ 홈 상단바에서 「설정」을 못 찾았다'); process.exit(1) }
await 설정.click(); await p.waitForTimeout(1200)

// 프로필 아이콘 시트 열기 — 아바타 옆 카메라 단추
const 열기 = p.getByRole('button', { name: /프로필 아이콘 바꾸기/ }).first()
if (!(await 열기.count())) { console.error('⛔ 「프로필 아이콘 바꾸기」 단추를 못 찾았다'); process.exit(1) }
await 열기.click(); await p.waitForTimeout(1100)

// 🔢 시트가 «무엇을 말하고 있나»를 재서 같이 찍는다 — 눈과 숫자를 둘 다 남긴다
const 잰것 = await p.evaluate(() => {
  const 글 = document.body.innerText
  const 있나 = (t) => 글.includes(t)
  return {
    한끼친구들: 있나('한끼 친구들'),
    옛제목: 있나('요리사 친구들'),
    우리애들: 있나('우리 애들'),
    오리지널: 있나('오리지널'),
    라인: 있나('라인'),
    캔디: 있나('캔디'),
    다섯: ['꼬르곰', '펭펭', '카롱', '뾰미', '꼬비'].filter(있나).length,
    옛친구: ['곰돌이 셰프', '펭귄 셰프', '꿀곰 셰프', '냄비 냥이'].filter(있나).length,
  }
})
console.log('  🔢', JSON.stringify(잰것, null, 0))
await p.screenshot({ path: join(OUT, '50-프로필아이콘-위.png') })

// 아래쪽(「한끼 아이콘으로 하기」 줄)까지 굴려서 한 장 더 — 기본 썸네일이 여기 있다
await p.mouse.move(195, 600); await p.mouse.wheel(0, 700); await p.waitForTimeout(700)
await p.screenshot({ path: join(OUT, '51-프로필아이콘-아래.png') })
console.log(`\n📸 2장 → ${OUT}`)
await b.close(); srv.close()

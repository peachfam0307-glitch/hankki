// 🔗⛔ 「링크 붙여넣기」가 안 될 때 유저가 «무엇을 보나» — 실물 재현 (2026-08-21)
//
// 📮 창업자 = *"우리 링크는 넣어도 못읽잖아"* → *"**우리 링크는 아예 안돼 원래**"*
//
// ⭐ 왜 재현하나 = 「안 된다」는 걸 아는 것과 **「안 될 때 화면이 뭐라고 하나」**는 다른 문제다.
//    유저가 보는 게 ⑴친절한 안내 ⑵아무 일도 안 일어남 ⑶에러 중 무엇이냐에 따라 고칠 곳이 다르다.
//
// ⚠️⚠️ **정직하게 — 이 판은 「왜 안 되는지」를 못 밝힌다.**
//    이 컨테이너는 외부 웹이 막혀 있어(프록시) `r.jina.ai`·`api.allorigins.win` 이 무조건 실패한다.
//    → 그래서 여기서 재현되는 건 **「바깥이 안 될 때의 화면」**이고,
//      창업자 폰에서 «같은 화면»을 보는지는 **창업자가 확인해야 한다.**
//    ⛔ 원인(서비스가 죽었나 · CORS 인가 · 네이버가 막았나)은 여기서 못 가른다.
//
// 🔎 코드로 미리 아는 것 (`src/linkReader.js`)
//    · 120줄 = **유튜브는 아예 시도조차 안 한다** (`if (isYouTube(rawUrl)) return null`)
//      창업자 옛 제보 *"영어로 이상한 말만 복사됨"* 때문에 그렇게 막아둔 것
//    · 나머지는 세 단계 — jina reader → allorigins(HTML) → noembed(제목만)
//      셋 다 실패하면 무엇이 되나? ← **이 판이 답한다**
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-링크안됨-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/링크안됨'
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
await new Promise((r) => srv.listen(4404, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 시험 = [
  { 키: 'naver', 이름: '네이버 블로그', url: 'https://blog.naver.com/example/223456789' },
  { 키: 'youtube', 이름: '유튜브 (코드가 아예 안 읽는다)', url: 'https://www.youtube.com/watch?v=abcdefg' },
]

const 결과 = []
for (const t of 시험) {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const 나간요청 = []
  const 에러 = []
  page.on('pageerror', (e) => 에러.push(String(e.message).split('\n')[0]))
  // 🔢 «어디로 나가려 했나»를 기록한다 — 실패해도 시도는 보인다
  page.on('request', (r) => {
    const u = r.url()
    if (!u.includes('127.0.0.1')) 나간요청.push(u.slice(0, 70))
  })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  await page.goto('http://127.0.0.1:4404/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)

  await page.getByRole('button', { name: '가져오기' }).first().click()
  await page.waitForTimeout(700)
  await page.getByText('링크 붙여넣기', { exact: false }).first().click()
  await page.waitForTimeout(800)

  // ⛔ 첫 판은 `input[type=text]` 로 찾아 **한 글자도 안 들어갔다**(칸이 빈 채로 찍혔다).
  //    → placeholder 로 콕 집는다. 그리고 «진짜 들어갔나»를 확인하고 진행한다.
  const 넣음 = await page.evaluate((u) => {
    const el = [...document.querySelectorAll('input,textarea')]
      .find((x) => /https?:\/\/|주소|링크/.test(x.placeholder || ''))
    if (!el) return null
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    setter ? setter.call(el, u) : (el.value = u)          // ⭐ React 가 값을 되돌리지 않게 native setter 로
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return el.value
  }, t.url)
  await page.waitForTimeout(400)
  writeFileSync(join(OUT, `${t.키}-1-넣은직후.png`), await page.screenshot())
  if (!넣음) console.log('  ⛔ 링크 칸을 못 찾았다 — 아래 결과는 믿지 말 것')

  // ⭐ 창업자 물음 = *"링크로 저장하기 «자체»가 안되는 걸로 아는데"*
  //    → 「본문 읽기」가 아니라 **「Inbox 에 저장」** 을 누른다. 둘은 다른 단추다.
  const 눌림 = await page.evaluate(() => {
    const b2 = [...document.querySelectorAll('button')]
      .find((x) => /저장/.test(x.textContent || '') && !x.disabled)
    if (b2) { b2.click(); return (b2.textContent || '').trim().slice(0, 30) }
    return null
  })
  await page.waitForTimeout(2500)
  writeFileSync(join(OUT, `${t.키}-2-저장누른뒤.png`), await page.screenshot())

  // 🔢 «진짜로 저장됐나» — 화면 말고 저장소를 본다(토스트는 거짓말할 수 있다)
  const 저장됨 = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('hankki:v1')
      if (!raw) return { 키없음: true }
      const d = JSON.parse(raw)
      const 목록 = d.inbox || d.links || d.bookmarks || null
      return {
        inbox칸있나: !!목록,
        inbox개수: Array.isArray(목록) ? 목록.length : null,
        저장소칸들: Object.keys(d).slice(0, 14),
      }
    } catch (e) { return { 읽기실패: String(e).slice(0, 60) } }
  })
  console.log('  저장소 :', JSON.stringify(저장됨))

  // 화면에 무슨 글자가 떴나
  const 화면 = await page.evaluate(() => {
    const t2 = (document.body.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean)
    return t2.slice(0, 24)
  })

  결과.push({ 이름: t.이름, 누른단추: 눌림, 나간요청: [...new Set(나간요청)], 화면글자: 화면, pageerror: 에러 })
  console.log(`\n── ${t.이름} ──`)
  console.log('  누른 단추 :', 눌림 || '(못 찾음)')
  console.log('  밖으로 나간 요청 :', 나간요청.length ? [...new Set(나간요청)].join(' / ') : '⛔ 하나도 없음')
  console.log('  화면 글자 :', 화면.slice(0, 10).join(' | '))
  if (에러.length) console.log('  ⛔ pageerror :', 에러[0])
  await page.close()
}

await b.close(); srv.close()
writeFileSync(join(OUT, '_결과.json'), JSON.stringify(결과, null, 2))
console.log(`\n📁 ${OUT}`)
console.log('\n⚠️ 이 판은 「왜 안 되는지」를 못 밝힌다 — 이 컨테이너가 외부 웹을 막고 있어서')
console.log('   바깥 서비스가 무조건 실패한다. 창업자 폰과 같은 화면인지는 창업자가 확인해야 한다.')

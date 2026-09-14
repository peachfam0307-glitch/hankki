// 💾 백업이 «실패를 성공이라고» 말하지 않나 — 창업자 폰 캡처 재현 (2026-08-16 밤)
//   📮 창업자 캡처 둘 = 「파일을 다시 다운로드하시겠습니까?」 ＋ 「클립보드로 복사하지 못했습니다」
//   📮 *"이런거 뜨면안되는거잖아"*
//
//   ⭐⭐ 심장 = **「큰 백업일 때 `clipboard.writeText` 를 «부르는가»」**
//      ⛔ 「토스트 문구가 정직한가」를 묻는 건 반쪽이다 — 오전에 그걸 고쳤는데도
//         **시스템 실패 알림은 그대로 떴다.** `writeText()` 는 성공으로 resolve 되고도 실패하므로
//         `catch` 로는 못 잡는다. **애초에 안 부르는 것 말고 길이 없다.**
//      📌 그러니 재는 것도 「문구」가 아니라 **「불렀나」**여야 한다(규칙 18 ⓘ).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4389, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push(통과); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }

// ⛔⛔ 첫 판이 `hankki:recipes` 에 심었는데 **그런 키는 없다** — 앱은 `hankki:v1` 하나에 통째로 담는다.
//   그래서 「큰 데이터」가 40KB(＝시드 그대로)로 나왔다. 규칙 18 — 내가 딴 데를 심었다.
// ⭐ 그리고 그 키는 «앱이 처음 켜질 때» 만들어지므로 addInitScript 로는 못 늘린다.
//   → **한 컨텍스트 안에서 두 번 연다**: ①켜서 시드를 만들고 ②레시피를 복제해 늘린 뒤 ③새 탭으로 다시 연다.
//   ⛔ `page.reload()` 는 쓰지 않는다 — 시드가 덮어써서 늘린 게 사라진다(CLAUDE.md 옛 함정 사전 ①).
const HOOKS = () => {
  window.__clip = 0; window.__dl = []
  const nav = navigator.clipboard || {}
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { ...nav, writeText: async (t) => { window.__clip = t.length; return undefined } },
  })
  const click = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) { window.__dl.push(this.download); return }
    return click.apply(this, arguments)
  }
}

const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })

const 열기 = async () => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.addInitScript(HOOKS)
  await p.goto('http://127.0.0.1:4389/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1100)
  return p
}

// 레시피를 배로 늘려 백업을 «크게» 만든다 (창업자 폰 = 237편 ≈ 247KB)
const 불리기 = async (p, 배) => {
  const 잰것 = await p.evaluate((n) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    if (!Array.isArray(s.recipes) || !s.recipes.length) return { ok: false, len: 0 }
    const 원본 = s.recipes.slice()
    for (let i = 1; i < n; i++) s.recipes.push(...원본.map((r, j) => ({ ...r, id: `dup${i}_${j}` })))
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    return { ok: true, len: JSON.stringify(s).length }
  }, 배)
  return 잰것
}

// ⛔ 첫 판이 3칸 다 「못 열었다」로 나왔다 — 앱이 고장난 게 아니라 **내가 길을 몰랐다**(규칙 18).
//   ✅ 실제 경로 = 상단 「설정」 단추(aria-label) → 「백업 · 내보내기」 카드. `_shot-백업안내-0816` 이 쓰던 길이다.
const 백업시트열기 = async (p) => {
  const 설정 = p.getByLabel('설정').first()
  if (await 설정.count()) { await 설정.click().catch(() => {}); await p.waitForTimeout(900) }
  const 카드 = p.getByText('백업 · 내보내기', { exact: true }).first()
  if (!(await 카드.count())) return false
  await 카드.click().catch(() => {})
  await p.waitForTimeout(800)
  return (await p.getByText(/폰에 파일로 저장/).count()) > 0
}

console.log('💾 백업 — 「실패를 성공이라 말하지 않나」\n')

// ── ① 파일 이름에 «시각»이 붙어 같은 이름이 안 겹치나 ＋ ③ 작은 백업은 그대로 복사되나
const p1 = await 열기()
{
  const ok = await 백업시트열기(p1)
  if (!ok) 재('① 백업 시트', false, '못 열었다 — 화면 경로가 바뀌었나(규칙 18)')
  else {
    // ⛔ `getByText` 로 잡으니 «버튼»이 아니라 안내 문장(「안 되면 파일로 저장하세요」)을 눌렀다.
    //    누르긴 눌렀는데 아무 일도 안 일어나서 「다운로드가 안 일어났다」로 나왔다 — 규칙 18 그대로.
    await p1.getByRole('button', { name: /폰에 파일로 저장/ }).first().click()
    await p1.waitForTimeout(600)
    const 첫 = await p1.evaluate(() => window.__dl[0] || '')
    재('① 파일 이름에 «시각»이 붙나', /^한끼백업-\d{4}-\d{2}-\d{2}-\d{4}\.json$/.test(첫),
      첫 ? `${첫} — 같은 날 두 번 받아도 이름이 다르다` : '(다운로드가 안 일어났다)')

    await 백업시트열기(p1)
    await p1.getByText(/백업 코드 복사/).first().click()
    await p1.waitForTimeout(600)
    const clip = await p1.evaluate(() => window.__clip)
    재('③ 작은 백업은 그대로 복사되나', clip > 0,
      clip ? `${Math.round(clip / 1024)}KB 복사 — 고치다 반대로 막지 않았다` : '⛔ 작은 것까지 막혔다')
  }
}

// ── ② ⭐심장 — 큰 백업이면 clipboard 를 아예 안 부르나
{
  const 잰것 = await 불리기(p1, 8)   // 시드 ×8 ≈ 창업자 폰(247KB)보다 크게
  await p1.close()
  if (!잰것.ok) 재('② 큰 데이터 심기', false, '⛔ hankki:v1 에 recipes 가 없다 — 키가 또 바뀌었나')
  else {
    console.log(`   (심은 크기 ${Math.round(잰것.len / 1024)}KB)`)
    const p = await 열기()
    const ok = await 백업시트열기(p)
    if (!ok) 재('② 백업 시트(큰 데이터)', false, '못 열었다')
    else {
      await p.getByText(/백업 코드 복사/).first().click()
      await p.waitForTimeout(700)
      const { clip, dl } = await p.evaluate(() => ({ clip: window.__clip, dl: window.__dl }))
      재('② 큰 백업이면 클립보드를 아예 안 부르나', clip === 0,
        clip === 0 ? '한 번도 안 불렀다 — 시스템 실패 알림이 뜰 일이 없다'
                   : `⛔ ${Math.round(clip / 1024)}KB 를 복사하려 했다 — 폰에서 「복사하지 못했습니다」가 뜬다`)
      재('② 대신 파일로 저장하나', dl.length > 0,
        dl.length ? `파일 ${dl[dl.length - 1]}` : '⛔ 아무 일도 안 일어났다 = 유저는 백업이 없다')
    }
    await p.close()
  }
}

await b.close(); srv.close()
const 통과 = 결과.filter(Boolean).length
console.log(`\n${'─'.repeat(46)}\n통과 ${통과} / ${결과.length}`)
process.exit(통과 === 결과.length ? 0 : 1)

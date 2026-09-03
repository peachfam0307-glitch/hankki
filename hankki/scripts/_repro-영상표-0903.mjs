// 📺 «썸네일 ▶ 표가 «영상 편에만» 붙나» — 레시피 목록 (2026-09-03 · smoke)
//
// 📮 창업자 = 다른 앱 캡처 넉 장 ＋ *"이거 하던 중이었어. ㄱㄱ하자"*
//    그 앱은 목록 썸네일 «왼쪽 위»에 작은 ▶ 를 붙여 「이 줄은 영상 편」을 알려준다.
//
// ⭐ 이 판이 재는 것 = **개수가 아니라 «어느 카드에 붙었나»**.
//    ⛔ 「▶ 가 N개 있다」로만 재면 «엉뚱한 카드»에 붙어도 초록불이 난다(규칙 18 ⓘ).
//    그래서 카드 이름표를 읽어 **영상 편 이름과 정확히 맞는지** 본다.
//
// 🔢 재는 것 = ⑴칩의 「영상 N」 ⑵▶ 가 붙은 카드 이름들 ⑶둘이 같은가 ⑷영상 아닌 편엔 안 붙나
//              ⑸칩을 눌러 거르면 그 편들만 남나
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const K_CLOUDGATE = (readFileSync(join(뿌리, 'src/nudges.js'), 'utf8')
  .match(/const K_CLOUDGATE\s*=\s*['"]([^'"]+)['"]/) || [])[1]
if (!K_CLOUDGATE) { console.error('⛔ src/nudges.js 에서 K_CLOUDGATE 를 못 찾았다 — 이름이 바뀌었다'); process.exit(1) }
const { SEED_COACH_SEEN } = await import('../src/coach.js')

const PORT = Number(process.env.SMOKE_PORT || 4191)
// ⛔ 브라우저 «경로를 박지 마라» — 그 자리는 이 컨테이너에만 있고 CI 엔 없다(2026-09-03 run #2054).
const CHROMIUM = process.env.SMOKE_CHROMIUM

let bad = 0
const ok = (m, v) => console.log('  ✅', m, v !== undefined ? ` ${v}` : '')
const no = (m, v) => { bad++; console.log('  ⛔', m, v !== undefined ? ` ${v}` : '') }

// 🌱 씨앗 — 기본 레시피엔 유튜브 편이 «하나도 없다»(실측 0건)라 심어야 잰다.
//   ⛔⛔ 첫 판은 `hankki:v1` 을 통째로 «갈아끼웠다» — 앱이 켜지며 기본 62편으로 다시 채워
//      심은 편이 한 장도 안 보였다(진단에 그렇게 찍혔다). **덮지 말고, 앱이 채운 «뒤»에 두 편만 고친다.**
//   ⛔ `page.reload()` 는 쓰지 않는다 — addInitScript 가 다시 돌아 고친 값을 되돌린다(옛 함정 사전).
//      대신 **새 탭**을 연다.
const 영상편 = []   // 앱이 채운 «뒤» 여기에 실제 제목이 담긴다
const 글편 = []

const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: 뿌리, stdio: 'ignore' })
const 끝내기 = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', 끝내기)

await new Promise((r) => setTimeout(r, 4500))
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript({ content: `try { localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1'); localStorage.setItem(${JSON.stringify(K_CLOUDGATE)},'1') } catch (e) {}` })
let page = await ctx.newPage()
page.setDefaultTimeout(12000)

try {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // 🌱 앱이 기본 레시피를 채운 «뒤» — 맨 앞 두 편에 유튜브 주소를, 셋째엔 블로그 주소를 붙인다
  const 심은 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = s.recipes || []
    if (r.length < 3) return null
    r[0].sourceUrl = 'https://www.youtube.com/watch?v=aaaaaaaaaaa'
    r[1].sourceUrl = 'https://youtu.be/bbbbbbbbbbb'
    r[2].sourceUrl = 'https://blog.example.com/x'
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    return { 영상: [r[0].title, r[1].title], 글: [r[2].title] }
  })
  if (!심은) { no('레시피가 3편도 없다 — 여기서 멈춘다'); throw new Error('seed') }
  영상편.push(...심은.영상); 글편.push(...심은.글)

  const page2 = await ctx.newPage()
  page2.setDefaultTimeout(12000)
  await page2.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(2000)
  page = page2
  await page.getByRole('button', { name: '레시피', exact: true }).first().click({ force: true })
  await page.waitForTimeout(1200)

  // ⑴ 칩이 떴나 — 안 떴으면 여기서 멈춘다(안 떴는데 초록불 방지 · 규칙 18 ⓘ)
  const 칩 = page.locator('button.pill', { hasText: '영상' })
  if (await 칩.count() === 0) {
    const 진단 = await page.evaluate(() => ({
      알약: [...document.querySelectorAll('button.pill')].map((b) => b.innerText.trim()),
      카드: [...document.querySelectorAll('.name')].map((n) => n.textContent.trim()).slice(0, 6),
      저장: (localStorage.getItem('hankki:v1') || '').slice(0, 160),
    }))
    console.log('  🔎 진단 =', JSON.stringify(진단))
    no('「영상 N」 칩이 안 떴다 — 여기서 멈춘다'); throw new Error('chip')
  }
  const 칩글 = (await 칩.first().innerText()).trim()
  const 칩수 = Number((칩글.match(/(\d+)/) || [])[1] || 0)
  칩수 === 영상편.length ? ok('칩이 영상 편을 맞게 셌다', `「${칩글}」`) : no('칩 개수가 다르다', `${칩글} ≠ ${영상편.length}`)

  // ⑵⑶⑷ ▶ 표가 «어느 카드»에 붙었나 — 이름표로 확인한다
  const 붙은이름 = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('.name').forEach((n) => {
      const 카드 = n.parentElement
      const 표 = 카드?.querySelector('svg')
      // 썸네일 위 절대배치 표식만 센다(이름표 옆 아이콘이 아니라)
      const 뱃지 = [...(카드?.querySelectorAll('span') || [])].find((s) => getComputedStyle(s).position === 'absolute' && s.querySelector('svg'))
      if (뱃지) out.push(n.textContent.trim())
      void 표
    })
    return out
  })
  // 👀 숫자만 보면 「가려진 것」을 놓친다 — 찍어서 눈으로도 본다(절대원칙 21)
  if (process.env.SHOT) { await page.screenshot({ path: process.env.SHOT }); console.log('  📸', process.env.SHOT) }

  const 같나 = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])
  같나(붙은이름, 영상편)
    ? ok('▶ 표가 «영상 편에만» 붙었다', 붙은이름.join(' · '))
    : no('▶ 표가 붙은 카드가 다르다', `${붙은이름.join(' · ') || '(없다)'} ↔ ${영상편.join(' · ')}`)
  붙은이름.some((t) => 글편.includes(t)) ? no('⛔ 글 편에도 ▶ 가 붙었다') : ok('글 편엔 안 붙었다')

  // ⑸ 칩을 눌러 거르면 영상 편만 남나
  await 칩.first().click({ force: true })
  await page.waitForTimeout(700)
  const 남은 = await page.evaluate(() => [...document.querySelectorAll('.name')].map((n) => n.textContent.trim()))
  같나(남은, 영상편) ? ok('칩으로 거르면 영상 편만 남는다', 남은.join(' · ')) : no('걸러진 목록이 다르다', 남은.join(' · '))
} catch (e) {
  no('판이 도중에 죽었다', String(e.message || e))
} finally {
  await browser.close()
  끝내기()
}

console.log(bad ? `\n⛔ ${bad}칸 죽었다` : '\n✅ ▶ 표가 영상 편에만 붙는다 · 칩과 개수가 같다')
process.exit(bad ? 1 : 0)

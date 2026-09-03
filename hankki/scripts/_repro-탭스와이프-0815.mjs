// 👉👈 하단 탭 좌우로 밀기 — 「되나」와 「엉뚱한 데서 안 먹나」를 둘 다 본다
//   ⛔ 「있나」가 아니라 «되나»를 묻는다 (규칙 18 ⓘ — 2026-08-14 에 이걸로 네 판을 헛으로 냈다)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 🖥 preview 를 «스스로» 띄운다 — CI 엔 아무것도 안 떠 있다.
//   ⛔ 스모크가 쓰는 4173 을 피해 딴 포트를 쓴다(같이 돌면 부딪힌다).
//   ⛔ 그리고 `vite preview` 는 빌드를 «안» 한다 — dist 가 낡았으면 낡은 걸 잰다(smoke.mjs 머리말과 같은 함정).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.SWIPE_PORT || 4179)
// ⛔ base 가 './' 라 preview 는 «뿌리»로 뜬다. '/hankki/' 로 가면 빈 화면이고 pageerror 도 «안» 난다.
const BASE = 'http://127.0.0.1:' + PORT + '/'
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: ROOT, stdio: 'ignore' })
const bye = () => { try { server.kill('SIGTERM') } catch { /* noop */ } }
process.on('exit', bye); process.on('SIGINT', () => { bye(); process.exit(1) })
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(BASE); if (r.ok) break } catch { /* 아직 */ }
  await new Promise(r => setTimeout(r, 500))
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 412, height: 900 }, hasTouch: true, isMobile: true })
const errs = []
p.on('pageerror', e => errs.push(String(e)))
// ⛔⛔ 키를 «지어내지» 말 것 — 2026-08-15 에 'hankki_onboarded' 로 썼는데 진짜는 'hankki:onboarded' 였다.
//    온보딩이 떠 있으면 스와이프가 «꺼지도록» 만들어놨으므로, 검사는 「밀어도 안 넘어간다」로 나왔다.
//    📌 또 「되나」가 아니라 «내 흉내가 맞나»에서 틀린 것이다(규칙 18 ⓘ).
// ⭐ 키를 «소스에서 읽는다» — 손으로 적으면 반드시 낡는다(.jsx 는 노드가 import 못 한다)
import { readFileSync } from 'node:fs'
const ONBOARD_KEY = readFileSync(new URL('../src/components/Onboarding.jsx', import.meta.url), 'utf8')
  .match(/ONBOARD_KEY\s*=\s*'([^']+)'/)[1]
const { SEED_COACH_SEEN } = await import('../src/coach.js')
await p.addInitScript(new Function(SEED_COACH_SEEN))
// 📰 [2026-09-01] 소식 팝업도 끈다 — 9/1 에 꾸미기 51종이 «저절로» 열리며 팝업이 화면을
//    통째로 덮어(`sheet-mask` z=300) 밀기가 전부 「홈 → 홈」이 됐다. 앱이 아니라 판의 구멍이다.
await p.addInitScript((k) => { localStorage.setItem(k, '1'); localStorage.setItem('hankki:news:off', '1') }, ONBOARD_KEY)
// ⛔ base 가 './' 라 preview 는 «뿌리»로 뜬다 — '/hankki/' 로 가면 «빈 화면»이고 pageerror 도 안 난다.
//    📌 그러면 검사가 «아무것도 못 읽고» 전부 실패로 나온다(2026-08-15 에 그랬다).
await p.goto(BASE)
await p.waitForTimeout(1200)

const 지금탭 = () => p.evaluate(() => {
  const on = document.querySelector('.nav-item.on, .nav-item[aria-current="page"], nav [aria-selected="true"]')
  return on ? on.textContent.trim() : (document.querySelector('.screen h1,.screen h2')?.textContent || '?').trim()
})

async function 밀기(x0, y, dx, steps = 8) {
  // ⛔⛔ 여기서 «진짜 탭»을 먼저 하면 안 된다 — 레시피 카드가 눌려 상세 화면이 열리고
  //    하단바가 사라져 검사가 탭 이름을 «못 읽는다»(2026-08-15 에 그래서 전부 실패로 나왔다).
  await p.evaluate(([x0, y, dx, steps]) => {
    const el = document.elementFromPoint(x0, y) || document.body
    const mk = (type, cx) => {
      const t = new Touch({ identifier: 1, target: el, clientX: cx, clientY: y })
      return new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true })
    }
    el.dispatchEvent(mk('touchstart', x0))
    for (let i = 1; i <= steps; i++) el.dispatchEvent(mk('touchmove', x0 + dx * i / steps))
    el.dispatchEvent(mk('touchend', x0 + dx))
  }, [x0, y, dx, steps])
  await p.waitForTimeout(350)
}

const 결과 = []
const 순서 = ['홈', '레시피', '일기', '장보기', '레꾸자랑']

let t0 = await 지금탭()
결과.push(['시작', t0, '—'])

// ① 왼쪽으로 밀기 → 다음 탭
for (let i = 0; i < 4; i++) {
  const 전 = await 지금탭()
  await 밀기(300, 300, -140)
  const 후 = await 지금탭()
  결과.push([`왼쪽으로 ${i + 1}`, `${전} → ${후}`, 전 !== 후 ? '✅ 넘어감' : '⛔ 안 넘어감'])
}
// ② 끝에서 더 밀면 «감기지 않는다»
{
  const 전 = await 지금탭(); await 밀기(300, 300, -140); const 후 = await 지금탭()
  결과.push(['끝에서 더', `${전} → ${후}`, 전 === 후 ? '✅ 안 감김(맞다)' : '⛔ 감겼다'])
}
// ③ 오른쪽으로 되돌아오기
for (let i = 0; i < 4; i++) {
  const 전 = await 지금탭()
  await 밀기(120, 300, 140)
  const 후 = await 지금탭()
  결과.push([`오른쪽으로 ${i + 1}`, `${전} → ${후}`, 전 !== 후 ? '✅ 넘어감' : '⛔ 안 넘어감'])
}
// ④ ⭐ 가로로 구르는 줄 «위»에서 밀면 탭이 안 넘어가야 한다
{
  await p.evaluate(() => { document.querySelectorAll('.nav-item')[2]?.click() })  // 레시피
  await p.waitForTimeout(500)
  const box = await p.evaluate(() => {
    // ⭐ 클래스 이름에 기대지 않는다 — «실제로 가로로 구르는» 것을 찾는다
    const r = [...document.querySelectorAll('*')].find(e => {
      const ov = getComputedStyle(e).overflowX
      return (ov === 'auto' || ov === 'scroll') && e.scrollWidth > e.clientWidth + 4 && e.clientHeight > 30
    })
    if (!r) return null
    const b = r.getBoundingClientRect()
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  })
  if (!box) 결과.push(['가로 줄 위', '가로로 구르는 줄을 못 찾음', '⚠️ 확인 못 함'])
  else {
    const 전 = await 지금탭(); await 밀기(box.x, box.y, -140); const 후 = await 지금탭()
    결과.push(['가로 줄 위에서 밀기', `${전} → ${후}`, 전 === 후 ? '✅ 탭 안 넘어감(맞다)' : '⛔ 넘어갔다'])
  }
}
// ⑤ 세로로 밀면(스크롤) 탭이 안 넘어가야 한다
{
  const 전 = await 지금탭()
  await p.evaluate(() => {
    const el = document.querySelector('.screen') || document.body
    const mk = (type, cy) => {
      const t = new Touch({ identifier: 9, target: el, clientX: 200, clientY: cy })
      return new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true })
    }
    el.dispatchEvent(mk('touchstart', 600))
    for (let i = 1; i <= 8; i++) el.dispatchEvent(mk('touchmove', 600 - 30 * i))
    el.dispatchEvent(mk('touchend', 360))
  })
  await p.waitForTimeout(300)
  const 후 = await 지금탭()
  결과.push(['세로로 밀기', `${전} → ${후}`, 전 === 후 ? '✅ 탭 안 넘어감(맞다)' : '⛔ 넘어갔다'])
}

console.log('\n👉👈 하단 탭 밀기 재현\n')
for (const [a, c, d] of 결과) console.log(`  ${a.padEnd(18)} ${String(c).padEnd(28)} ${d}`)
const 나쁨 = 결과.filter(r => String(r[2]).startsWith('⛔'))
console.log(`\n  pageerror ${errs.length}`, errs.slice(0, 2))
console.log(나쁨.length ? `\n⛔ ${나쁨.length}칸 실패` : '\n✅ 전부 통과')
await b.close()
bye()
process.exit(나쁨.length || errs.length ? 1 : 0)

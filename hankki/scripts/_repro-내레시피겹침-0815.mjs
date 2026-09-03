// 🏷 「내가 쓴 레시피」와 제목이 같아도 우리 판이 «들어오나» — 창업자 확정 2026-08-15 「둘 다 놓기」
//
// 📮 창업자 *"나 레시피가 저장되어있는데(재료만 넣었잖아) 우리 레시피 하나씩 올라올때 내꺼도 반영되게 못해?
//    테스트를 해봐야 하는데 이미 레시피있어서 내레시피는 예전꺼니까 테스트를 할 수가 없어"*
//    ＋ *"얼마전에 너한테 문서만 쭉 주고 레시피 저장해달라고 한 것들. 100개정도. 그걸로 주간레시피 쓰고 했잖아."*
//
// ⛔⛔ 옛 동작 = 저장된 «모든» 레시피의 제목을 모아 막았다 →
//    유저가 「제육볶음」을 재료만 적어 저장해 두면 우리 「제육볶음」이 **영영 안 들어왔다.**
//    📌 창업자가 자기 레시피 100여 편을 줬기 때문에 **창업자 폰에서 가장 크게 났다.**
//
// ⭐⭐ 이 검사의 심장 = **「내가 쓴 것이 그대로 남아 있나」.**
//    「우리 판이 들어왔나」만 보면, 덮어써서 유저 글이 사라져도 초록불이 뜬다.
//
// ⛔ `page.reload()` 를 쓰지 않는다(CLAUDE.md 규칙 19 · 옛 함정 사전 ①) — 새 탭으로.
// ⛔ preview 서버를 «고정 시간»으로 기다리지 않는다 — CI 러너가 더 느리다(2026-08-15 배포 사고).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_COACH_SEEN } from '../src/coach.js'

const PORT = 4185
const URL = `http://127.0.0.1:${PORT}/`
const 겹치는제목 = '제육볶음' // basics.js 에 실제로 있는 제목(basic-jeyuk)
const 내메모 = '앞다리살 600g · 고추장 2큰술 (나중에 채우기)'

let bad = 0
const 칸 = (이름, ok, 덧말 = '') => {
  if (!ok) bad++
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${덧말 ? ' — ' + 덧말 : ''}`)
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 서버 = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: ROOT, stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
const 서버뜰때까지 = async () => {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(URL); if (r.ok) return true } catch { /* 아직 */ }
    await 잠깐(500)
  }
  return false
}

// 저장소를 읽어 「제목이 X 인 레시피」들을 돌려준다
const 제목으로 = (page, 제목) => page.evaluate(`(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.recipes || [])
    .filter((r) => (r.title || '').trim() === ${JSON.stringify(제목)})
    .map((r) => ({ id: r.id, source: r.source || '', ing: (r.ingredients || []).join(' | ').slice(0, 60) }))
})()`)

try {
  if (!(await 서버뜰때까지())) { console.log('  ⛔ preview 서버가 30초 안에 안 떴다 (포트 ' + PORT + ')'); process.exit(1) }
  const browser = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
  const ctx = await browser.newContext()
  await ctx.addInitScript(`${SEED_COACH_SEEN}\ntry { localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1') } catch(e){}`)
  const errs = []
  ctx.on('weberror', (e) => errs.push(String(e.error())))

  // ── ① 앱을 한 번 열어 시드를 받은 뒤, 「내가 쓴 레시피」를 심고 시계를 되감는다 ──
  //    ⭐ 창업자 상황 재현 = 우리 시드보다 «먼저» 내 메모가 있었던 상태
  let page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await 잠깐(700)
  await page.evaluate(`(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    s.recipes = (s.recipes || []).filter((r) => r.id !== 'basic-jeyuk')  // 우리 판을 뺀다
    s.recipes.unshift({
      id: 'mine-jeyuk', title: ${JSON.stringify(겹치는제목)},
      ingredients: [${JSON.stringify(내메모)}], steps: [], memo: '',
      thumb: 'icon', savedAt: Date.now(),
    })
    s.seedV = 0   // 시계를 되감아 마이그레이션이 다시 돌게
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  })()`)
  const 심은뒤 = await 제목으로(page, 겹치는제목)
  칸('내가 쓴 레시피가 심어졌다', 심은뒤.length === 1 && 심은뒤[0].id === 'mine-jeyuk')
  await page.close()

  // ── ② 새 탭(앱을 껐다 켠 것) → 우리 판이 «들어와야» 한다 ──
  page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto(URL, { waitUntil: 'networkidle' })
  await 잠깐(900)
  const 뒤 = await 제목으로(page, 겹치는제목)
  const 내것 = 뒤.find((r) => r.id === 'mine-jeyuk')
  const 우리것 = 뒤.find((r) => String(r.id).startsWith('basic-'))

  칸('⭐ 우리 판이 들어왔다', !!우리것, 우리것 ? 우리것.id : '안 들어옴')
  칸('⭐⭐ 내가 쓴 것이 «그대로» 남아 있다', !!내것, 내것 ? '있다' : '사라졌다')
  칸('내가 쓴 재료가 안 바뀌었다', 내것?.ing === 내메모, 내것?.ing || '(없음)')
  칸('둘이 나란히 있다(제목 같은 게 2개)', 뒤.length === 2, `지금 ${뒤.length}개`)
  칸('우리 판에 「한끼」 표시가 붙어 있다', 우리것?.source === 'hankki', 우리것?.source || '(없음)')

  // ── ③ 우리 시드끼리는 여전히 중복이 안 생겨야 한다 ──
  //    (이 줄의 «원래» 뜻 = 「예전 예시의 김치볶음밥 등과 중복 방지」)
  const 시드중복 = await page.evaluate(`(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const 제목별 = {}
    for (const r of (s.recipes || [])) {
      if (!String(r.id).startsWith('basic-')) continue
      const t = (r.title || '').trim()
      제목별[t] = (제목별[t] || 0) + 1
    }
    return Object.entries(제목별).filter(([, n]) => n > 1).map(([t, n]) => t + '×' + n)
  })()`)
  칸('우리 시드끼리는 제목 중복 0', 시드중복.length === 0, 시드중복.slice(0, 3).join(' · '))

  칸('런타임 오류 0', errs.length === 0, errs.slice(0, 2).join(' | '))
  await page.close()
  await browser.close()
} finally {
  서버.kill()
}

console.log(bad ? `\n⛔ 내 레시피 겹침 ${bad}칸 실패` : '\n✅ 제목이 같아도 «둘 다» 남는다 — 내가 쓴 것은 그대로')
process.exit(bad ? 1 : 0)

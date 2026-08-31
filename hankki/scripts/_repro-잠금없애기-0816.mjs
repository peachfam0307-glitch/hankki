// 🔓🔓 「잠금 없애기」가 **정문이 아닌가** — 창업자 판정 ⒜ 검사 (2026-08-16)
//   📮 창업자 *"일기잠금 의미없어. 비번 잊으면 잠금 풀게 해뒀잖아.
//      **누구든 비번 몇번 틀리면 잠금풀면 일기 다 봄**"*
//   ✅ 확정 ⒜ = **잠금을 없애려면 잠긴 일기를 «같이 지워야» 한다.**
//   돌리기 = node hankki/scripts/_repro-잠금없애기-0816.mjs
//
// ⭐⭐ 이 검사의 심장 = **「비번을 모르는 사람이 본문을 «볼 수» 있나」**.
//    잠금이 풀리기만 하고 글이 남으면 그건 잠금이 아니다 — 옛 판이 정확히 그랬다.
//
// ⛔ `page.reload()` 를 쓰지 않는다 — 저장값이 시드로 덮여 「안 남는다」로 잘못 나온다(규칙 19).
//    「앱을 껐다 켜기」는 **새 탭**으로 재현한다.
// ⛔ 일기를 localStorage 에 «심지» 않는다 — store 가 샘플로 덮어쓴다. UI 로 실제로 쓴다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_COACH_SEEN } from '../src/coach.js'

const PORT = 4187 // ⛔ 스모크(4173)·다른 재현판과 겹치면 서로 죽인다
const URL = `http://127.0.0.1:${PORT}/`
const 비번 = '1234'
const 본문 = '아무한테도 말 못한 이야기'

let bad = 0
const 칸 = (이름, ok, 덧말 = '') => { if (!ok) bad++; console.log(`  ${ok ? '✅' : '⛔'} ${이름}${덧말 ? ' — ' + 덧말 : ''}`) }

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

// 비번은 «시트 안»에서만 누른다 — 뒤에 깔린 달력 날짜 단추와 이름이 겹친다(실측 strict mode violation)
const 눌러 = async (page, pin) => {
  const 시트 = page.locator('.sheet')
  for (const c of pin) { await 시트.getByRole('button', { name: c, exact: true }).click(); await 잠깐(70) }
  await 잠깐(300)
}

const 일기열기 = async (ctx) => {
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await 잠깐(500)
  await page.getByRole('button', { name: '일기', exact: true }).first().click()
  await 잠깐(600)
  await page.getByRole('button', { name: /^오늘 일기 (보기|쓰기)$/ }).click()
  await 잠깐(800)
  return page
}

try {
  if (!(await 서버뜰때까지())) { console.log('  ⛔ preview 서버가 안 떴다'); process.exit(1) }
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  await ctx.addInitScript(`${SEED_COACH_SEEN}\ntry { localStorage.setItem('hankki:onboarded','1') } catch(e){}`)
  const errs = []
  ctx.on('weberror', (e) => errs.push(String(e.error())))

  // ── ① 일기를 쓰고 잠근다 ──
  let page = await 일기열기(ctx)
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.getByPlaceholder('여기에 써요').fill(본문)
  await 잠깐(700)
  await page.getByRole('button', { name: '일기 잠그기' }).click()
  await 잠깐(400)
  await 눌러(page, 비번)
  await 눌러(page, 비번)
  await page.locator('.sheet').getByRole('button', { name: '잠그기', exact: true }).click()
  await 잠깐(600)
  await page.close()

  // ── ② 앱을 껐다 켠다 → 가려진다 ──
  page = await 일기열기(ctx)
  칸('잠금 화면이 뜬다', (await page.content()).includes('잠가 둔 일기예요'))
  await page.getByRole('button', { name: '열기' }).click()
  await 잠깐(400)

  // ── ③ 「비번을 잊었어요」 — ⭐ 여기가 옛날의 «정문»이었다 ──
  await page.getByRole('button', { name: '비번을 잊었어요' }).click()
  await 잠깐(400)
  const 안내 = await page.locator('.sheet').innerText()
  칸('⭐ 「지운다」고 «미리» 말한다', /지워야|지우고/.test(안내), 안내.replace(/\n/g, ' ').slice(0, 90))
  칸('⛔ 「글은 그대로 남아요」 같은 말이 없다', !/그대로 남아/.test(안내))
  칸('몇 장이 지워지는지 숫자로 말한다', /\d+장/.test(안내))

  // ⭐⭐ 한 번 눌러서는 «안 지워져야» 한다
  const 지우기1 = page.locator('.sheet').getByRole('button', { name: /지우고 풀기/ }).first()
  칸('단추에 「지우기」가 박혀 있다', (await 지우기1.count()) > 0)
  await 지우기1.click()
  await 잠깐(400)
  칸('⭐ 한 번 누르면 «아직» 안 지운다 (한 번 더 묻는다)',
    /정말 지울까요/.test(await page.locator('.sheet').innerText()))

  // ── ④ 두 번째 누름 = 진짜 지운다 ──
  await page.locator('.sheet').getByRole('button', { name: /^\d+장 지우기$/ }).click()
  await 잠깐(1200)

  const st = await page.evaluate(`(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))()`)
  const 남은일기 = (st.diary || []).filter((d) => d.kind === 'diary')
  칸('⭐⭐ 잠겨 있던 일기가 «지워졌다»', !남은일기.some((d) => (d.note || '').includes(본문)))
  칸('비번 자국도 지워졌다', await page.evaluate(`(() => !localStorage.getItem('hankki:diaryPin'))()`))
  await page.close()

  // ── ⑤ 껐다 켜도 본문이 «없다» — 정문이 막혔나 ──
  page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await 잠깐(700)
  await page.getByRole('button', { name: '일기', exact: true }).first().click()
  await 잠깐(800)
  칸('⭐⭐⭐ 비번을 모르는 사람이 본문을 못 본다', !(await page.content()).includes(본문),
    '옛 판은 여기서 다 보였다 — 그게 창업자가 말한 「정문」이다')

  칸('런타임 오류 0', errs.length === 0, errs.slice(0, 2).join(' | '))
  await page.close()
  await browser.close()
} finally {
  서버.kill()
}

console.log(bad ? `\n⛔ 잠금 없애기 ${bad}칸 실패` : '\n✅ 잠금 없애기 = 지워야만 풀린다 · 정문이 막혔다')
process.exit(bad ? 1 : 0)

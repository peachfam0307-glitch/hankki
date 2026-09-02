// 🔒 일기 잠금 — 「진짜 가려지나」를 픽셀이 아니라 **DOM 으로** 재는 재현판.
//
// 📮 창업자 2026-08-15 *"일기에 나만볼 수 있는 자물쇠? 잠금기능 넣으면 좋겠어"*
//    확정 = **자물쇠 단추** · 잠기는 범위 = **그날 일기 한 장**
//
// ⭐⭐ 이 검사의 심장 = **「본문 글자가 화면에 «없나»」** — 흐리게 덮는 방식이면
//    글자가 DOM 에 그대로 남아 «흐릿하게 비치는 것»만으로 남이 대충 읽는다.
//    📌 눈으로 보면 둘 다 「가려진 것처럼」 보인다. 그래서 눈이 아니라 DOM 으로 잰다.
//
// ⛔ `page.reload()` 를 쓰지 않는다 — reload 때 저장값이 시드로 덮여
//    **앱이 멀쩡한데 「안 남는다」로 나온다**(CLAUDE.md 규칙 19 · 옛 함정 사전 ①).
//    「앱을 껐다 켜기」는 **새 탭**으로 재현한다.
//
// ⛔⛔ 일기를 localStorage 에 «심지» 않는다 — 심어 봤더니 store 가 샘플 일기로 덮어써서
//    **내가 심은 게 사라졌다**(2026-08-15 실측). UI 로 실제로 써야 진짜 상태가 된다.
//    📌 「심었으니 있겠지」가 아니라 「화면에 떴나」로 확인한다(규칙 18).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_COACH_SEEN } from '../src/coach.js'

const PORT = 4183 // ⛔ 스모크(4173)와 겹치면 서로 죽인다
const URL = `http://127.0.0.1:${PORT}/`
const 비번 = '1234'
const 본문 = '오늘은 아무한테도 말 못한 이야기'

let bad = 0
const 칸 = (이름, ok, 덧말 = '') => {
  if (!ok) bad++
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${덧말 ? ' — ' + 덧말 : ''}`)
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 서버 = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: ROOT, stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))

// ⛔⛔ 서버를 «고정 시간»으로 기다리지 않는다 — 2026-08-15 배포가 정확히 이걸로 죽었다.
//    2.6초는 이 컨테이너에선 넉넉했지만 **CI 러너는 더 느려서** `ERR_CONNECTION_REFUSED` 로 실패했다.
//    📌 어제 만든 `_repro-탭스와이프-0815.mjs` 는 이미 「뜰 때까지」로 돼 있었는데 **오늘 것만 고정으로 썼다.**
//    ⭐ 「내 기계에서 되니까 되겠지」가 아니라 **「떴나」를 실제로 물어본다**(규칙 18 ⓘ).
const 서버뜰때까지 = async () => {
  for (let i = 0; i < 60; i++) { // 최대 30초
    try { const r = await fetch(URL); if (r.ok) return true } catch { /* 아직 */ }
    await 잠깐(500)
  }
  return false
}

// 비번 네 자리를 우리 숫자판으로 누른다.
// ⚠️ 반드시 **시트 «안»에서만** 찾는다 — 일기 화면 뒤에 달력이 깔려 있어서
//    「1」·「2」 같은 이름이 «달력 날짜 단추»와 겹친다(실측 strict mode violation).
const 눌러 = async (page, pin) => {
  const 시트 = page.locator('.sheet')
  for (const c of pin) {
    await 시트.getByRole('button', { name: c, exact: true }).click()
    await 잠깐(70)
  }
  await 잠깐(300)
}

// 오늘 일기 화면을 연다. 새 탭 = 「앱을 껐다 켠 것」
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
  if (!(await 서버뜰때까지())) {
    console.log('  ⛔ preview 서버가 30초 안에 안 떴다 (포트 ' + PORT + ')')
    process.exit(1)
  }
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  await ctx.addInitScript(`${SEED_COACH_SEEN}\ntry { localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1') } catch(e){}`)
  const errs = []
  ctx.on('weberror', (e) => errs.push(String(e.error())))

  // ── ① 일기를 쓰고 잠근다 ──
  let page = await 일기열기(ctx)
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.getByPlaceholder('여기에 써요').fill(본문)
  await 잠깐(700) // 자동저장 350ms
  칸('일기 본문이 보인다(잠그기 전)', (await page.content()).includes(본문))

  const 자물쇠 = page.getByRole('button', { name: '일기 잠그기' })
  칸('자물쇠 단추가 있다', (await 자물쇠.count()) > 0)
  await 자물쇠.click()
  await 잠깐(400)
  await 눌러(page, 비번) // 처음
  await 눌러(page, 비번) // 한 번 더
  // ⚠️ exact — 상단 자물쇠 단추 이름이 「일기 잠그기」라 안 그러면 둘 다 걸린다
  await page.locator('.sheet').getByRole('button', { name: '잠그기', exact: true }).click()
  await 잠깐(600)

  const st = await page.evaluate(`(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))()`)
  const 오늘일기 = (st.diary || []).find((d) => d.kind === 'diary' && (d.note || '').includes(본문))
  칸('일기에 잠금 표시가 저장됐다', !!오늘일기?.locked)
  칸('비번을 원문으로 저장하지 않는다', await page.evaluate(`(() => {
    const v = localStorage.getItem('hankki:diaryPin') || ''
    return v.length > 8 && v !== '${비번}'
  })()`))
  // ⭐ 잠근 «그 자리»에서는 계속 쓸 수 있어야 한다 — 방금 비번 정했는데 또 물으면 짜증난다
  칸('잠근 직후엔 그 자리에서 계속 보인다', (await page.content()).includes(본문))
  await page.close()

  // ── ② 앱을 껐다 켠다(새 탭) → 가려져야 한다 ──
  page = await 일기열기(ctx)
  const 가린화면 = await page.content()
  const 가려졌나 = 가린화면.includes('잠가 둔 일기예요')
  칸('잠금 화면이 뜬다', 가려졌나)
  칸('⭐ 본문 글자가 화면에 «없다»', !가린화면.includes(본문), '흐리게 덮는 방식이면 여기서 걸린다')
  칸('지우기 단추가 숨겨졌다', (await page.getByRole('button', { name: '일기 삭제' }).count()) === 0)

  // ⛔ 안 가려졌으면 ③④⑤ 는 «물어볼 수가 없다» — 비번 시트가 아예 안 뜬다.
  //    그냥 두면 30초 타임아웃으로 죽어서 **왜 실패했는지가 안 읽힌다.**
  //    📌 게이트는 읽을 수 있어야 한다(규칙 12로 실제 그렇게 죽는 걸 보고 고쳤다).
  if (!가려졌나) {
    console.log('  ⏭ 잠금이 아예 안 걸려서 비번 검사(③④⑤)는 건너뜀')
  } else {
    // ── ③ 틀린 비번 ──
    await page.getByRole('button', { name: '열기' }).click()
    await 잠깐(400)
    await 눌러(page, '9999')
    칸('틀린 비번은 안 열린다', (await page.content()).includes('비번이 안 맞아요'))
    칸('틀린 뒤에도 본문이 «없다»', !(await page.content()).includes(본문))

    // ── ④ 맞는 비번 ──
    await 눌러(page, 비번)
    await 잠깐(700)
    칸('맞는 비번으로 열린다', (await page.content()).includes(본문))
    await page.close()

    // ── ⑤ 다시 껐다 켜면 또 잠긴다 (푼 것은 그 세션에만 산다) ──
    page = await 일기열기(ctx)
    칸('앱을 껐다 켜면 다시 잠긴다', (await page.content()).includes('잠가 둔 일기예요'))
    칸('그때도 본문이 «없다»', !(await page.content()).includes(본문))
  }
  await page.close()

  칸('런타임 오류 0', errs.length === 0, errs.slice(0, 2).join(' | '))
  await browser.close()
} finally {
  서버.kill()
}

console.log(bad ? `\n⛔ 일기 잠금 ${bad}칸 실패` : '\n✅ 일기 잠금 — 잠기고 · 가려지고 · 비번으로만 열린다')
process.exit(bad ? 1 : 0)

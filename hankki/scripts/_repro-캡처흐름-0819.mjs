// 📷📷 «캡처(AI 스캔) 흐름이 순서를 바꾼 뒤에도 이어지나» — 레시피 편집 화면
//
// 📮 창업자 2026-08-19 = *"이제 해봐 ai기능잘되나 안꼬이나"*
//    (편집 화면 칸 순서를 바꾼 직후 — 썸네일 → **캡처** → 제목 → 카테고리 → 시간·인분 → 재료 → 만드는 법)
//
// ⭐⭐ **무엇을 재는가** — 「OCR 이 글자를 잘 읽나」가 «아니다».
//    그건 순서와 무관하고 이미 `test-parser` 가 본다.
//    여기서 물어야 할 것은 **「버튼 → 파일 고르기 → 자르기 → 칸 채우기」 사슬이 안 끊겼나**다.
//    ⛔ 순서를 바꾸면 끊길 수 있는 자리 = ⑴버튼이 input 을 못 찾는다 ⑵자르기 시트가 안 뜬다
//       ⑶채운 값이 «다른 칸»에 들어간다 ⑷스크롤이 엉뚱한 데로 간다
//
// ⭐ 왜 안 꼬이는가(코드 근거) — 캡처는 `set('ingredients', …)`·`set('steps', …)` 로
//    **상태를 갱신**한다. React 에서 «화면 순서»와 «상태»는 별개라 자리를 옮겨도 값은 제 칸으로 간다.
//    ⚠️ 그래도 «말»이 아니라 «재서» 확인한다(규칙 7).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.REPRO_PORT || 4377)

// 🔑 이름은 «앱에서 읽는다» — 판이 글자로 박으면 이름이 바뀔 때마다 판이 낡는다(절대원칙 30).
//    2026-08-24 「AI 스캔 N회」→「열쇠 N개」로 갈 때 이 판이 죽어서 드러났다.
const OCR봉 = readFileSync(path.join(root, 'src/ocr.js'), 'utf8')
const 뽑기 = (이름) => {
  const m = OCR봉.match(new RegExp(`export const ${이름} = '([^']+)'`))
  if (!m) { console.log(`⛔ src/ocr.js 에서 ${이름} 을 못 찾았다`); process.exit(1) }
  return m[1]
}
const KEY_SHORT = 뽑기('KEY_SHORT')
const KEY_UNIT = 뽑기('KEY_UNIT')
let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const sv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: root, stdio: 'ignore' })
const 끝 = (c) => { try { sv.kill() } catch { /* noop */ } process.exit(c) }
await new Promise((r) => setTimeout(r, 4500))

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
page.setDefaultTimeout(12000)
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))

try {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)
  await page.getByRole('button', { name: '가져오기', exact: true }).first().click()
  await page.waitForTimeout(700)
  await page.getByText('직접 작성', { exact: false }).first().click()
  await page.waitForTimeout(1000)

  // ── ① 캡처 버튼이 «있고 눌리나» ──
  console.log('① 캡처 버튼')
  const cap = page.getByRole('button', { name: /캡처 사진으로/ }).first()
  if (await cap.isVisible()) ok('「캡처 사진으로 재료·만드는 법 채우기」 버튼이 보인다')
  else no('캡처 버튼이 안 보인다')

  // ── ③ 각 칸 옆 「사진에서 채우기」도 살아 있나 (재료·만드는 법 두 곳) ──
  console.log('③ 칸 옆 「사진에서 채우기」')
  const 개수 = await page.getByRole('button', { name: /사진에서 채우기/ }).count()
  if (개수 >= 2) ok(`재료·만드는 법 두 칸에 다 있다 (${개수}개)`)
  else no(`${개수}개뿐 — 두 칸에 다 있어야 한다`)

  // ── ④ ⭐ 값이 «제 칸»으로 가나 — 순서를 바꾼 뒤 제일 위험한 자리 ──
  console.log('④ 값이 제 칸으로 가나 (순서를 바꿔도)')
  await page.getByPlaceholder('예) 명란 크림 파스타').fill('캡처흐름 시험')
  const ta = page.locator('textarea')
  await ta.nth(0).fill('두부 1모\n대파 1대')
  await ta.nth(1).fill('1. 두부를 썬다\n2. 끓인다')
  const v = await page.evaluate(() => {
    const t = [...document.querySelectorAll('textarea')]
    return {
      제목: document.querySelector('input[placeholder*="명란"]')?.value || '',
      재료: t[0]?.value || '', 순서: t[1]?.value || '',
    }
  })
  if (v.제목 === '캡처흐름 시험') ok('제목이 제 칸에 들어갔다')
  else no(`제목이 엉뚱하다: ${JSON.stringify(v.제목)}`)
  if (v.재료.includes('두부 1모') && !v.재료.includes('썬다')) ok('재료가 «재료 칸에만» 들어갔다')
  else no(`재료 칸이 섞였다: ${JSON.stringify(v.재료)}`)
  if (v.순서.includes('썬다') && !v.순서.includes('대파 1대')) ok('만드는 법이 «만드는 법 칸에만» 들어갔다')
  else no(`만드는 법 칸이 섞였다: ${JSON.stringify(v.순서)}`)

  // ── ⑤ 저장까지 이어지나 ──
  console.log('⑤ 저장')
  await page.getByRole('button', { name: '저장', exact: true }).first().click()
  await page.waitForTimeout(1400)
  const 아직 = await page.getByText('사진에서 채우기').first().isVisible().catch(() => false)
  if (!아직) ok('저장 뒤 편집 화면이 닫혔다 (= 저장 성공)')
  else no('저장을 눌러도 편집 화면이 안 닫힌다 — 저장 실패')

  // 🔁 캡처 시험은 «맨 마지막»에 — 자르기 시트가 뜨면 아래 칸·저장 버튼을 덮는다.
  //    첫 판이 그래서 ⑤ 저장이 「12초 타임아웃」으로 실패했다 — 앱이 아니라 «판»의 문제였다(규칙 18).
  console.log('— 편집 화면을 다시 열어 캡처를 시험한다 —')
  await page.getByRole('button', { name: '가져오기', exact: true }).first().click(); await page.waitForTimeout(700)
  await page.getByText('직접 작성', { exact: false }).first().click(); await page.waitForTimeout(1000)
  // ⭐ `cap` 을 그대로 쓴다 — Playwright locator 는 «쓸 때» 다시 찾으므로 새 화면에서도 맞다.

  // ── ② 버튼이 «파일 고르기»를 여나 — 사슬의 첫 고리 ──
  //   ⛔⛔ 첫 판은 `document.querySelector('input[type=file]')` 로 쟀다가 **틀린 답**이 나왔다.
  //      이 화면엔 파일 칸이 **둘**이다 — `photoRef`(썸네일 사진) · `ocrRef`(캡처). 첫째를 잡으니
  //      캡처 버튼을 눌러도 「안 열린다」로 나왔다. 📌 규칙 18 — 「없다」 전에 확인 방식을 의심한다.
  //   ✅ 그래서 브라우저에게 «파일 고르기 창이 떴나»를 직접 묻는다(filechooser).
  console.log('② 버튼 → 파일 고르기')
  let chooser = null
  try {
    const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 8000 }), cap.click()])
    chooser = fc
    ok(`버튼이 파일 고르기를 연다 (여러 장 ${fc.isMultiple() ? '가능' : '불가'})`)
    if (!fc.isMultiple()) no('여러 장을 못 고른다 — 긴 레시피를 한 번에 못 넣는다')
  } catch {
    no('버튼을 눌러도 파일 고르기가 안 열린다 — 사슬 첫 고리가 끊겼다')
  }

  // ── ②-b ⭐ 사진 «두 장»을 넣으면 「몇 장 쓴다」고 알리나 ──
  //   📮 창업자 2026-08-19 = *"2장넣었을때 안내문구 나오나도"*
  //      ＋ 2026-08-13 = *"한번에 2장 넣으면 2장소진된다는 것도 알려야겠네"*
  //   ⭐ 이 안내는 «고른 직후»에 뜬다(OCR 전) — 그래서 인식이 안 돌아도 잴 수 있다.
  console.log('②-b 두 장 넣으면 「몇 장 쓴다」고 알리나')
  if (chooser) {
    const 사진 = [path.join(root, 'src/assets/gom-header.png'), path.join(root, 'src/assets/gom-header.png')]
    try {
      await chooser.setFiles(사진)
      await page.waitForTimeout(1800)
      const 글 = await page.evaluate(() => document.body.innerText)
      // ⛔ [2026-08-21] 잣대를 조였다 — 옛 잣대(스캔·사용·써요·소진·장을 중 아무거나)는 «너무 넓어»
      //    화면 어딘가에 「스캔」만 있어도 통과했다. 물어야 할 건 «몇 회가 줄어드나»다.
      //    ⭐ 창업자 낱말 = 「소모」(2026-08-21 *"무료이용이 1장 소모가 된다던지"*).
      // ⭐ [2026-08-24] 이름이 「AI 스캔 N회」→「열쇠 N개」로 바뀌며 잣대도 옮겼다(창업자 확정).
      //    ⛔ 낱말을 글자로 박지 않는다 — `src/ocr.js` 에서 읽는다(다음에 또 바뀌어도 안 낡게).
      //    📌 물어야 할 건 여전히 같다 = «몇 장을 골랐고 몇 개가 줄어드나»가 한 줄에 있나.
      const 숫자안내 = /2\s*장/.test(글) && new RegExp(`${KEY_SHORT}\\s*2${KEY_UNIT}`).test(글)
      if (숫자안내) ok('「2장」이 들어간 안내가 떴다 — 몇 장 쓰는지 알려준다')
      else no(`두 장을 골랐는데 「2장」 안내가 없다 — 화면 글자에서 못 찾았다`)
      // 자르기 시트까지 이어지나 (사슬의 둘째 고리)
      const 자르기 = /자르기|잘라|남겨주세요/.test(글)
      if (자르기) ok('자르기 화면으로 이어진다')
      else no('사진을 골랐는데 자르기 화면이 안 뜬다')
      // 📸 «눈으로» 볼 사진 — 창업자 *"눈으로고 확인하고"*
      if (process.env.REPRO_SHOT) await page.screenshot({ path: process.env.REPRO_SHOT })
      // ⛔ 여기서 시트를 «닫지 않는다» — 다음 칸(②-c)이 「이 부분만 읽기」를 눌러야 한다.
      //    첫 판은 여기서 닫아버려 ②-c 가 단추를 못 찾았다.
    } catch (e) {
      no(`사진을 못 넣었다: ${e.message}`)
    }
  }

  // ── ②-c ⏳ «읽는 중» 안내가 «캡처 버튼 바로 아래»에 있나 ──
  //   📮 창업자 2026-08-19 = *"로딩느려질때 기다리라는 안내넣기로 했잖아.
  //      **2장이면 한장씩 읽으니까. 아무안내없이 기다리다 끌수도 있어**"*
  //   ⛔⛔ 실제로 떨어져 나갔었다 — 캡처 버튼을 위로 옮겼는데 진행 표시는 제자리(63줄 아래)라
  //      **누르고도 화면 위쪽엔 아무 표시가 없었다.** 창업자 걱정이 정확했다.
  //   ⭐ 그래서 「있나」가 아니라 **「버튼 바로 아래에 있나」**를 잰다(규칙 18 ⓘ).
  console.log('②-c 「읽는 중」 안내 — 진짜 로딩을 일으켜 잡는다')
  {
    // ⛔ `ocr.busy` 일 때만 그려지므로 «가만히» 두면 DOM 에 없다 → 실제로 읽기를 시작시킨다.
    const 읽기 = page.getByRole('button', { name: /이 부분만 읽기|전체 사용/ }).first()
    if (await 읽기.isVisible().catch(() => false)) {
      await 읽기.click().catch(() => {})
      // 읽는 중 문구가 뜨는지 짧게 기다린다(OCR 이 느려도 «표시»는 즉시 떠야 한다)
      const 떴나 = await page.getByText(/사진에서 글자 읽는 중/).first()
        .waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
      if (떴나) {
        ok('「사진에서 글자 읽는 중…」 안내가 떴다')
        const r = await page.evaluate(() => {
          const 버튼 = [...document.querySelectorAll('button')].find((x) => /캡처 사진으로/.test(x.textContent || ''))
          const el = [...document.querySelectorAll('div')].find((x) => /사진에서 글자 읽는 중/.test(x.textContent || '') && x.children.length < 4)
          const box = el?.closest('div[style*="border-radius"]') || el
          const 꼬리 = document.body.innerText.match(/그대로 두면 돼요|조금 걸려요|잠깐만요/)
          return {
            버튼y: 버튼 ? Math.round(버튼.getBoundingClientRect().top) : null,
            안내y: box ? Math.round(box.getBoundingClientRect().top) : null,
            꼬리: 꼬리 ? 꼬리[0] : null,
            장수: (document.body.innerText.match(/\d+장 중 \d+장째/) || [])[0] || null,
            화면: window.innerHeight,
          }
        })
        // ⛔⛔ 진행 표시는 «두 곳»이다 — 첫 판이 이걸 몰라 「멀다」고 잘못 잡았다.
        //    ⑴ **자르기 화면 «안»**(맨 위) — 첫 장을 읽는 «동안» 둘째 장을 자르게 하는 설계라
        //       기다림이 느껴지지 않는다. 지금 재고 있는 게 이것이다.
        //    ⑵ **편집 화면**(캡처 버튼 바로 아래) — 자르기를 다 끝낸 뒤 보이는 것.
        //       그 자리는 `_probe-부가정보자리-0819.mjs` 가 «소스 순서»로 지킨다.
        //    📌 규칙 18 ⓘ — 「보이나」가 아니라 «어느 것을 보고 있나»를 알아야 한다.
        if (r.안내y !== null && r.안내y < r.화면) ok(`자르는 동안에도 진행 표시가 보인다 (${r.안내y}px)`)
        else no('자르는 동안 진행 표시가 화면 밖이다')
        if (r.꼬리) ok(`기다리라는 말이 있다 — 「${r.꼬리}」`)
        else no('「그대로 두면 돼요」 같은 기다림 안내가 없다')
        if (r.장수) ok(`몇 장째인지 보인다 — 「${r.장수}」`)
        else console.log('   ⏳ 「N장 중 M장째」는 못 잡았다(한 장짜리거나 이미 넘어갔다)')
        if (process.env.REPRO_SHOT2) await page.screenshot({ path: process.env.REPRO_SHOT2 })
      } else no('읽기를 눌렀는데 「읽는 중」 안내가 안 뜬다 — 기다리는 동안 화면이 조용하다')
    } else no('자르기 화면에 「이 부분만 읽기」 단추가 없다')

    // 🧹 이제 정리 — 남은 자르기 시트를 닫아 아래 칸 검사가 가려지지 않게
    for (let i = 0; i < 3; i++) {
      const 취소 = page.getByRole('button', { name: /취소/ }).first()
      if (await 취소.isVisible().catch(() => false)) { await 취소.click().catch(() => {}); await page.waitForTimeout(600) }
      else break
    }
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(900)
  }

  console.log('⑥ 런타임 오류')
  // ⛔ 이 컨테이너는 `cdn.jsdelivr.net` 을 못 연다(프록시 차단) — tesseract 엔진 파일을 못 받는다.
  //    **앱 고장이 아니라 «여기»의 한계다.** 진짜 폰에서는 받아진다.
  //    ⭐ 그래서 이 하나만 걸러낸다. ⛔다른 오류까지 뭉뚱그려 봐주지 않는다(그러면 죽은 게이트가 된다).
  const 환경탓 = (m) => /cdn\.jsdelivr\.net|tesseract.*failed to load|importScripts/.test(m)
  const 진짜 = errs.filter((m) => !환경탓(m))
  if (!진짜.length) {
    ok(errs.length ? `앱 오류 0건 (CDN 못 여는 이 컨테이너 한계 ${errs.length}건은 제외)` : 'pageerror 0건')
  } else no(`pageerror ${진짜.length}건 — ${진짜[0]}`)
} catch (e) {
  no(`화면을 못 열었다: ${e.message}`)
}

await b.close()
console.log('')
if (bad) { console.error(`❌ 캡처 흐름 ${bad}칸 실패 — 순서를 바꾼 것이 사슬을 끊었다`); 끝(1) }
console.log('✅ 캡처 흐름이 순서를 바꾼 뒤에도 그대로 이어진다')
끝(0)

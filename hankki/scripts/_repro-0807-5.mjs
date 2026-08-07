// 📱🐛 창업자 폰 제보 2026-08-07 (다섯 번째 묶음)
//   ① *"돌려서 오른쪽에 붙이면 삭제버튼이 오른쪽위에오니까 자꾸 지워져. 그래서 상하좌우반전이 있으면 좋겠어"*
//   ② *"속지든 글쓰기등 일꾸레꾸 «어디서든» 글씨수정가능하게 만들어줘. **이게가장 중요**"*
//      *"탭을 옮겨다니면서 수정해야하면 안쓰게돼"*
//   ③ *"글자색도 스티커처럼 추가되면 좋겠어"*   ④ *"글자에도 모션이나 효과가 들어가면 더 좋고"*
//   ⑤ *"무지속지에서 글자체 선택시 좀만 그 부분 키워줘"*
//
// ⛔⛔ 내가 ①을 「손잡이가 크기·회전을 동시라 돌리기가 어렵다」로 잘못 짚었고
//    창업자가 바로잡았다 — *"돌리는건 잘돼"*. **「불편하다」의 «이유»를 내가 정하면 안 된다**(규칙 18).
// ⛔ 이 검사 자체도 세 번 헛돌았다 —
//    ⑴ 포스트잇 단추엔 «글자»가 없다(aria-label 로 잡아야 한다)
//    ⑵ 「일꾸」로 돌아와도 «갈래 칩»은 그대로다(기본 갈래는 「마테」 · 「글자」 칸엔 그림이 없다)
//    ⑶ **앞 검사가 남긴 상태**(고른 아이템 → 컨텍스트 바)가 탭 단추를 가린다
//    📌 그래서 각 항목은 **화면을 새로 열고** 시작한다. 순서가 곧 검사 결과를 만든다.
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
await new Promise((r) => srv.listen(4406, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  // ⚠️ 창업자 화면 그대로 = **무지 속지**. 여기선 쓰는 칸이 종이 거의 전체다.
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
})
const openDecor = async () => {
  await page.goto('http://127.0.0.1:4406/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
}
const segOn = () => page.evaluate(() => [...document.querySelectorAll('.decor-drawer .seg.on')].map((s) => s.textContent.trim()).join(','))
// ⛔⛔ **꾸미기 아이템은 「저장」을 누르기 «전»엔 localStorage 에 없다** — 에디터가 쥐고 있다.
//    첫 판에 localStorage 를 봐서 «저장이 안 된다»·«스티커를 못 붙였다»고 잘못 찍었다(규칙 18).
//    ✅ 그래서 «화면에 그려진 것»으로 판정한다 — 어차피 우리가 확인할 것도 그쪽이다.
const first = () => page.evaluate(() => {
  const el = document.querySelector('.decor-stage [style*="rotate"]')
  if (!el) return null
  const p = document.querySelector('.decor-stage .paper').getBoundingClientRect()
  const r = el.getBoundingClientRect()
  return { x: (r.left + r.width / 2 - p.left) / p.width, y: (r.top + r.height / 2 - p.top) / p.height }
})
const tf = () => page.evaluate(() => {
  const el = document.querySelector('.decor-stage [style*="rotate"]')
  return el ? getComputedStyle(el).transform : ''
})

// ═══ ① 상하 뒤집기 ═══════════════════════════════════════════
console.log('\n── ① 상하 뒤집기 (돌리면 ✕ 가 따라 돌아 지워지던 것) ──')
await openDecor()
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(800)
{
  await page.locator('.decor-drawer .decor-sec img').first().click(); await page.waitForTimeout(900)
  const lr = page.locator('.decor-editor button').filter({ hasText: /^좌우 뒤집기$/ })
  const ud = page.locator('.decor-editor button').filter({ hasText: /^상하 뒤집기$/ })
  console.log(`   ℹ️ 좌우 ${await lr.count() ? '있다' : '없다'} · 상하 ${await ud.count() ? '있다' : '없다'}`)
  if (!(await ud.count())) no('⭐ 「상하 뒤집기」가 없다 — 아래 귀퉁이에 놓으려면 손으로 돌려야 한다')
  else {
    await ud.first().click(); await page.waitForTimeout(700)
    const css = await tf()
    // ⭐ matrix(a,b,c,d,e,f) 에서 **d < 0 이면 세로로 뒤집힌 것**이다.
    //    「저장됐나」가 아니라 «화면에 그려졌나»를 본다 — 저장만 되고 안 그려진 적이 있다(v9.79).
    const m = (css.match(/matrix\(([^)]+)\)/) || [])[1]?.split(',').map(Number)
    console.log(`   ℹ️ transform d = ${m ? m[3].toFixed(2) : '?'} (음수면 세로로 뒤집힌 것)`)
    if (m && m[3] < 0) ok('⭐ 상하 뒤집기가 «화면에» 뒤집혀 그려진다')
    else no('상하 뒤집기를 눌러도 화면이 안 뒤집힌다')
    await lr.first().click(); await page.waitForTimeout(700)
    const m2 = ((await tf()).match(/matrix\(([^)]+)\)/) || [])[1]?.split(',').map(Number)
    if (m2 && m2[0] < 0 && m2[3] < 0) ok('좌우＋상하 = 180° 와 같은 그림 (네 귀퉁이가 다 나온다)')
    else no(`좌우＋상하가 같이 안 걸린다 (a=${m2 ? m2[0].toFixed(2) : '?'} d=${m2 ? m2[3].toFixed(2) : '?'})`)
  }
}

// ═══ ② «어디서든» 글씨 수정 — 창업자 1순위 ══════════════════
console.log('\n── ② 일꾸 탭에서 글칸을 누르면 글이 써지나 (무지 속지) ──')
await openDecor()
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
{
  const st = await page.locator('.decor-stage .paper').first().boundingBox()
  await page.mouse.click(st.x + st.width * 0.4, st.y + st.height * 0.3)
  await page.waitForTimeout(700)
  const r = await page.evaluate(() => {
    const t = document.querySelector('.decor-stage textarea')
    return { 있나: !!t, 포커스: !!t && document.activeElement === t, 읽기전용: !!t && t.readOnly }
  })
  const tab = await segOn()
  console.log(`   ℹ️ 쓰는 칸 ${r.있나 ? '있다' : '없다'} · 포커스 ${r.포커스} · 탭 ${tab}`)
  if (!r.있나 || r.읽기전용) no('⭐ 일꾸 탭에서는 글칸이 «죽어 있다» — 글을 고치려면 탭을 옮겨야 한다')
  else if (!r.포커스) no('⭐ 일꾸 탭에서 글칸을 눌러도 «키보드가 안 뜬다»')
  else if (tab !== '일꾸') no(`글은 써지는데 탭이 «${tab}»로 튀었다 — 창업자가 싫어한 그 왕복이다`)
  else ok('⭐ 일꾸 탭에서도 글칸을 누르면 바로 써지고 «탭이 안 튄다»')
  await page.keyboard.type('오늘도 한 끼'); await page.waitForTimeout(900)
  const saved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    return (s.diary || []).find((x) => x.kind === 'diary')?.note || ''
  })
  if (saved.includes('오늘도')) ok(`친 글자가 저장까지 된다 ("${saved.slice(0, 12)}")`)
  else no(`글자가 저장 안 된다 (저장값 "${saved.slice(0, 20)}")`)
}

// ═══ ②-2 글칸을 살린 «대가» — 스티커를 글칸 위로 끌 수 있나 ══
//   ⚠️ 코드 주석이 경고하던 바로 그것 — *"글칸은 읽기 전용이라 그 위에서 스티커를 끌 수 있고"*.
//      글칸을 살렸으니 **이게 깨졌는지 반드시 확인한다**(형광펜 때 실제로 깨진 적이 있다).
console.log('\n── ②-2 글칸을 살린 대가 — 스티커를 글칸 «위»로 끌 수 있나 ──')
{
  // ⛔ 앞 단계에서 글칸에 커서가 남아 있으면 「글씨·크기」 두 줄이 서랍을 밀어 칩이 안 눌린다.
  //    실제 손도 «글 다 쓰고 → 스티커»라 먼저 커서를 푼다. (＋ 그 밀림이 얼마인지는 아래에서 잰다)
  await page.evaluate(() => document.activeElement?.blur?.())
  await page.waitForTimeout(500)
  await page.locator('.decor-drawer .decor-sec img').first().click()
  await page.waitForTimeout(900)
  const before = await first()
  if (!before) no('스티커를 못 붙였다 — 검사 방식부터 볼 것')
  else {
    const st = await page.locator('.decor-stage .paper').first().boundingBox()
    const from = { x: st.x + st.width * before.x, y: st.y + st.height * before.y }
    const to = { x: st.x + st.width * 0.42, y: st.y + st.height * 0.2 }   // 글칸 한복판
    await page.mouse.move(from.x, from.y); await page.mouse.down()
    for (let i = 1; i <= 8; i++) { await page.mouse.move(from.x + (to.x - from.x) * i / 8, from.y + (to.y - from.y) * i / 8); await page.waitForTimeout(35) }
    await page.mouse.up(); await page.waitForTimeout(700)
    const after = await first()
    const moved = Math.hypot(after.x - before.x, after.y - before.y)
    console.log(`   ℹ️ (${before.x.toFixed(2)}, ${before.y.toFixed(2)}) → (${after.x.toFixed(2)}, ${after.y.toFixed(2)})`)
    if (moved > 0.08) ok('⭐ 글칸이 살아 있어도 스티커는 그 위로 그대로 끌린다')
    else no('스티커를 글칸 위로 못 끈다 — 글칸이 손가락을 먹는다(글칸을 살린 대가)')
  }
}

// ═══ ③④ 글자 색 · 모션 · 효과 ═══════════════════════════════
console.log('\n── ③ 글자 색 · ④ 글자에 모션·효과 ──')
await openDecor()
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
{
  await page.locator('.decor-drawer button').filter({ hasText: /^글자 넣기$/ }).first().click(); await page.waitForTimeout(800)
  // ⚠️ 시트 클래스는  다( 가 아니다) — 첫 판에 저장 단추를 못 눌러 시트가 안 닫혔고
  //    그 「sheet-mask」가 모션 칩 클릭을 30초 동안 막았다.
  const ta = page.locator('.sheet textarea, .sheet input').first()
  if (await ta.count()) { await ta.fill('맛있겠다'); await page.waitForTimeout(300) }
  const save = page.locator('.sheet button').filter({ hasText: /저장|확인|넣기|완료|붙이기/ }).first()
  if (await save.count()) { await save.click(); await page.waitForTimeout(900) }
  // ⭐ 「글자 넣기」는 넣자마자 그것을 «고른 상태»로 만든다(addText → setSel) → 다시 누를 필요가 없다.
  //    ⛔ 첫 판에 굳이 눌렀다가 «화면 밖»이라 죽었다(글자가 종이 아래쪽에 놓인다).
  await page.waitForTimeout(400)

  const colors = await page.locator('.decor-editor [aria-label^="글자색"]').count()
  console.log(`   ℹ️ 글자색 칩 ${colors}개`)
  if (colors >= 12) ok(`글자색 ${colors}개 — 스티커 색(13)과 어깨를 맞춘다`)
  else no(`글자색이 ${colors}개뿐`)

  const motion = await page.locator('.decor-editor').getByText('움직임', { exact: true }).count()
  const fx = await page.locator('.decor-editor').getByText('효과', { exact: true }).count()
  console.log(`   ℹ️ 움직임 줄 ${motion ? '있다' : '없다'} · 효과 줄 ${fx ? '있다' : '없다'}`)
  if (!motion || !fx) no('⭐ 글자에 모션·효과 줄이 «안 뜬다»')
  else {
    const mbtn = page.locator('.decor-editor button').filter({ hasText: /^통통$|^갸웃$|^찰랑$|^살랑$/ }).first()
    if (!(await mbtn.count())) no('모션 칩을 못 찾았다 — 검사 방식부터 볼 것')
    else {
      await mbtn.click(); await page.waitForTimeout(700)
      // ⛔ 「마지막 hk-m- 요소」를 보면 «부엌 식구들 기본 모션»이 잡힌다 — 우리가 물을 것은
      //    「그 글자에 붙었나」다. 그러니 **글자 내용으로 찾는다**(규칙 18 — 무엇을 보는지).
      const cls = await page.evaluate(() => {
        const el = [...document.querySelectorAll('.decor-stage [class*="hk-m-"]')]
          .find((e) => (e.textContent || '').includes('맛있겠다'))
        return el ? el.className : ''
      })
      console.log(`   ℹ️ 「맛있겠다」에 붙은 클래스 = ${cls || '(없음)'}`)
      if (cls.includes('hk-m-')) ok('⭐ 글자에 모션이 «화면에도» 걸린다')
      else no('모션을 골랐는데 그 글자에 클래스가 안 붙었다')
    }
  }
}

// ═══ ⑤ 글씨체 고르는 칸 높이 ═════════════════════════════════
console.log('\n── ⑤ 무지 속지 「글씨」 칩 높이 ──')
await openDecor()
await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(800)
{
  const h = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.decor-drawer button')].find((x) => x.textContent.trim() === '귀염체')
    return b ? Math.round(b.getBoundingClientRect().height) : 0
  })
  console.log(`   ℹ️ 「귀염체」 칩 높이 = ${h}px (전 = 30px)`)
  // ⭐ 「좀만 키워줘」였으니 «눈에 띄게 커졌나»(＋6px 이상)만 본다.
  //    ⛔ 손가락 최소 44px 기준을 들이대지 않는다 — 여긴 칩이 촘촘히 붙는 줄이라 그만큼 키우면 서랍이 눌린다.
  if (h >= 36) ok(`칩이 ${h}px 로 커졌다`)
  else no(`아직 ${h}px — 안 커졌다`)
}

// ═══ ⑥ 글 치는 «동안» 글씨 도구가 따라오나 ══════════════════
//   창업자 *"유저가 여기저기 탭 안누르고 글쓸때 편하게 사용한다는 의미야 (한번에 쓸수있게는)"*
//   ⭐ 인스타 스토리·캔바 문법 = **치는 동안에만 그 도구가 나온다.**
//      「어느 탭인가」가 아니라 「지금 치고 있나」로 띄운다.
console.log('\n── ⑥ 일꾸 탭에서 글을 치는 «동안» 글씨·크기 줄이 따라오나 ──')
await openDecor()
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
{
  const rows = () => page.evaluate(() => {
    const has = (t) => [...document.querySelectorAll('.decor-drawer span')].some((s) => s.textContent.trim() === t)
    return { 글씨: has('글씨'), 크기: has('크기') }
  })
  const before = await rows()
  const st = await page.locator('.decor-stage .paper').first().boundingBox()
  await page.mouse.click(st.x + st.width * 0.4, st.y + st.height * 0.3); await page.waitForTimeout(700)
  const after = await rows()
  console.log(`   ℹ️ 누르기 «전» 글씨 ${before.글씨} · 크기 ${before.크기}  →  «뒤» 글씨 ${after.글씨} · 크기 ${after.크기}`)
  if (!after.글씨 || !after.크기) no('⭐ 글칸을 눌러도 글씨·크기 줄이 «안 뜬다» — 아직 탭을 옮겨야 한다')
  else {
    ok('⭐ 글을 치기 시작하면 글씨·크기 줄이 따라온다 (탭 안 옮겨도 된다)')
    // ⚠️ 칩을 누르면 글칸이 포커스를 잃어 줄이 사라질 수 있다 — 그러면 한 번 고르고 끝이라 더 불편해진다
    const chip = page.locator('.decor-drawer button').filter({ hasText: /^삐뚤체$/ }).first()
    if (await chip.count()) {
      await chip.click(); await page.waitForTimeout(600)
      const keep = await rows()
      const focus = await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA')
      console.log(`   ℹ️ 글씨체 칩을 누른 «뒤» — 줄 ${keep.글씨 ? '그대로' : '사라짐'} · 커서 ${focus ? '유지' : '잃음'}`)
      if (keep.글씨 && focus) ok('칩을 눌러도 커서와 줄이 그대로다 — 이어서 계속 쓸 수 있다')
      else no('칩을 누르니 커서를 잃는다 — 한 번 고르면 줄이 사라져 더 불편해진다')
      // 📐 **두 줄이 늘면 서랍이 그만큼 눌린다** — 2026-08-07 에 이걸로 스크롤이 죽었다.
      //    ⭐ 폰에선 글 치는 동안 키보드가 서랍을 덮으니 손해가 없지만, «재서» 확인한다.
      const shelf = await page.evaluate(() => {
        const el = document.querySelector('.decor-drawer .decor-body, .decor-drawer .decor-scroll') || document.querySelector('.decor-drawer')
        return el ? Math.round(el.getBoundingClientRect().height) : 0
      })
      console.log(`   ℹ️ 글 치는 «중» 서랍 높이 = ${shelf}px`)
    }
  }
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)

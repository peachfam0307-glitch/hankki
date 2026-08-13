// 📸 창업자 판정 대기 «셋» — 실물 픽셀로 (2026-08-07)
//   ① 글자색 15개 중 8개만 보인다   ② 「효과」 라벨이 오른쪽 끝에 걸린다   ③ 글 상자를 스티커처럼
//
// ⛔ 규칙 13 — **원본 픽셀 100%.** 줄이면 판정 자체가 안 된다.
// ⛔ 규칙 15 — 개선안도 «내가 그린 그림»이 아니라 **실제 앱에 넣어 렌더한 것**을 찍는다.
//    (DOM 을 그 자리에서 고쳐서 진짜 화면으로 만든다 — 그래야 「이러면 이렇게 보인다」가 진짜다)
//
// ⭐⭐ ③ 을 파다가 알아낸 것 = **「줄글 사각형 프레임」은 이미 만들 수 있다.**
//    포스트잇에 무늬 「줄노트」(NOTE_PATTERNS) ＋ 모양 「기본/둥근」(NOTE_SHAPES) 이 이미 있다.
//    없는 건 **「그 자리에서 바로 치기」 하나**다 — 지금은 붙이면 시트가 열리고 거기 쳐야 한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/남은셋'
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
await new Promise((r) => srv.listen(4416, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const cuts = {}
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })

// ⚠️ 「일꾸」로 들어가야 갈래 칩이 보인다 · 「글자」 칸엔 그림이 없어 칩으로만 찾는다
const openDecor = async () => {
  await page.goto('http://127.0.0.1:4416/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
}
// 🔪 원본 픽셀 그대로 잘라 담는다(3배 화면 → 3배 픽셀). ⛔줄이지 않는다
const cut = async (name, sel, pad = 0) => {
  const box = await page.locator(sel).first().boundingBox()
  if (!box) { console.log('   ⛔ 못 찾음 —', name, sel); return }
  const buf = await page.screenshot({ clip: {
    x: Math.max(0, Math.round(box.x - pad)), y: Math.max(0, Math.round(box.y - pad)),
    width: Math.round(box.width + pad * 2), height: Math.round(box.height + pad * 2) } })
  cuts[name] = buf.toString('base64')
  console.log('  📸', name, `${Math.round(box.width)}×${Math.round(box.height)}px`)
}

// ═══════════════════════════════════════════════════════
// ① 글자색 — 15개 중 8개만 보인다
// ═══════════════════════════════════════════════════════
console.log('\n── ① 글자색 ──')
await openDecor()
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
{
  const add = page.locator('.decor-drawer button').filter({ hasText: /^글자 넣기$/ }).first()
  await add.click(); await page.waitForTimeout(800)
  const ta = page.locator('.hk-sheet textarea, .hk-sheet input, .sheet textarea, .sheet input').first()
  if (await ta.count()) { await ta.fill('맛있겠다'); await page.waitForTimeout(300) }
  const save = page.locator('.hk-sheet button, .sheet button').filter({ hasText: /저장|확인|넣기|완료|붙이기/ }).first()
  if (await save.count()) { await save.click(); await page.waitForTimeout(900) }
  const stk = page.locator('.decor-stage [style*="rotate"]').last()
  if (await stk.count()) { await stk.click({ force: true }); await page.waitForTimeout(800) }

  const m = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('[aria-label^="글자색"]')]
    if (!chips.length) return null
    const row = chips[0].parentElement
    const rb = row.getBoundingClientRect()
    const vis = chips.filter((c) => { const b = c.getBoundingClientRect(); return b.left >= rb.left - 1 && b.right <= rb.right + 1 && b.width > 0 })
    return { 전체: chips.length, 보임: vis.length, 줄폭: Math.round(rb.width),
             칩: Math.round(chips[0].getBoundingClientRect().width), 밀림: Math.round(row.scrollWidth - row.clientWidth) }
  })
  console.log(`   ℹ️ 그려진 것 ${m.전체} · 보이는 것 ${m.보임} · 줄 ${m.줄폭}px · 칩 ${m.칩}px · 밀림 ${m.밀림}px`)
  writeFileSync(join(OUT, '측정-글자색.json'), JSON.stringify(m))

  // 지금 모습
  await cut('1a-글자색-지금', '[aria-label^="글자색"] >> nth=0 >> xpath=..')

  // ⛔⛔ 첫 판이 «6px 짜리 빈 칸»을 찍었다 — 칩 폭을 '' 로 지우니 React 가 준 인라인 폭까지 날아갔다.
  //    📌 규칙 18 — 「안 보인다」가 아니라 «내 되돌리기»가 부순 것이었다.
  //    ✅ 그래서 «되돌리지 않는 순서»로 찍는다 — 얹기만 하는 것(자국) → 줄바꿈 → 칩 크기.
  // 개선안 ⓒ — 지금 그대로 ＋ 오른쪽 「더 있다」 자국 (얹기만 한다)
  await page.evaluate(() => {
    const row = document.querySelector('[aria-label^="글자색"]').parentElement
    row.style.webkitMaskImage = 'linear-gradient(90deg,#000 0,#000 calc(100% - 34px),rgba(0,0,0,.15) 100%)'
    row.style.maskImage = 'linear-gradient(90deg,#000 0,#000 calc(100% - 34px),rgba(0,0,0,.15) 100%)'
  })
  await page.waitForTimeout(400)
  await cut('1d-안ⓒ-자국', '[aria-label^="글자색"] >> nth=0 >> xpath=..')

  // 끝까지 밀면 숨은 7개가 나온다 — 「없는 게 아니라 밀려 있다」는 증거
  await page.evaluate(() => {
    const row = document.querySelector('[aria-label^="글자색"]').parentElement
    row.style.webkitMaskImage = ''; row.style.maskImage = ''
    row.scrollLeft = row.scrollWidth
  })
  await page.waitForTimeout(400)
  await cut('1e-끝까지-민-모습', '[aria-label^="글자색"] >> nth=0 >> xpath=..')

  // 개선안 ⓐ — 두 줄로 접기 (다 보인다 · 세로를 더 먹는다)
  await page.evaluate(() => {
    const row = document.querySelector('[aria-label^="글자색"]').parentElement
    row.dataset.old = row.style.cssText
    row.style.flexWrap = 'wrap'; row.style.overflowX = 'visible'; row.style.rowGap = '7px'
  })
  await page.waitForTimeout(400)
  await cut('1b-안ⓐ-두줄', '[aria-label^="글자색"] >> nth=0 >> xpath=..')

  // 개선안 ⓑ — 칩을 작게 (한 줄에 다 들어간다)
  await page.evaluate(() => {
    const row = document.querySelector('[aria-label^="글자색"]').parentElement
    row.style.cssText = row.dataset.old
    for (const c of row.querySelectorAll('[aria-label^="글자색"]')) { c.style.width = '20px'; c.style.height = '20px'; c.style.minWidth = '20px' }
    row.style.gap = '5px'
  })
  await page.waitForTimeout(400)
  await cut('1c-안ⓑ-칩작게', '[aria-label^="글자색"] >> nth=0 >> xpath=..')
}

// ═══════════════════════════════════════════════════════
// ② 「효과」 라벨이 오른쪽 끝에 걸린다
// ═══════════════════════════════════════════════════════
console.log('\n── ② 「효과」 라벨 ──')
{
  const m2 = await page.evaluate(() => {
    const lab = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '효과' && s.parentElement?.scrollWidth > s.parentElement?.clientWidth)
    if (!lab) return null
    const row = lab.parentElement, rb = row.getBoundingClientRect(), lb = lab.getBoundingClientRect()
    return { 줄폭: Math.round(rb.width), 밀림: Math.round(row.scrollWidth - row.clientWidth),
             라벨왼쪽: Math.round(lb.left - rb.left), 라벨오른쪽끝: Math.round(lb.right - rb.left),
             넘침: Math.round(lb.right - rb.right) }
  })
  console.log('   ℹ️', JSON.stringify(m2))
  writeFileSync(join(OUT, '측정-효과라벨.json'), JSON.stringify(m2 || {}))

  // 지금 모습 — 움직임 ＋ 효과 한 줄
  await cut('2a-효과-지금', '.decor-stage >> xpath=/.. >> css=div', 0).catch(() => {})
  const rowSel = 'xpath=//span[normalize-space(text())="효과"]/..'
  await cut('2a-효과-지금', rowSel)

  // 개선안 ⓐ — 「효과」 앞에 세로 칸막이 ＋ 여백
  await page.evaluate(() => {
    const lab = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '효과')
    if (!lab) return
    lab.parentElement.dataset.old2 = lab.parentElement.innerHTML
    const bar = document.createElement('span')
    bar.style.cssText = 'flex:0 0 auto;width:1.5px;height:17px;background:var(--line);margin:0 9px 0 5px;border-radius:2px'
    lab.parentElement.insertBefore(bar, lab)
  })
  await page.waitForTimeout(400)
  await cut('2b-안ⓐ-칸막이', rowSel)

  // 개선안 ⓑ — 다시 두 줄로 (v9.89 에 한 줄로 합친 걸 되돌린 모습)
  await page.evaluate(() => {
    const lab = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '효과')
    if (!lab) return
    const row = lab.parentElement
    row.style.flexWrap = 'wrap'; row.style.overflowX = 'visible'; row.style.rowGap = '8px'
    // 「효과」 라벨 앞에서 줄을 끊는다
    const br = document.createElement('span'); br.style.cssText = 'flex-basis:100%;height:0'
    row.insertBefore(br, lab.previousElementSibling)
  })
  await page.waitForTimeout(400)
  await cut('2c-안ⓑ-두줄', rowSel)

  // 개선안 ⓒ — 「움직임 ／ 효과」 두 단추로 갈라 «한 줄»에 (자리를 안 더 먹고 칩이 다 보인다)
  //   📏 계산 = 지금 한 줄 내용이 590px 인데 칸은 336px 이다. 갈라 놓으면
  //      움직임만 ≈324px · 효과만 ≈266px → **둘 다 한 줄에 들어간다.**
  await page.evaluate(() => {
    const lab = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '효과')
    if (!lab) return
    const row = lab.parentElement
    row.innerHTML = row.dataset.old2                      // 원래대로 되돌리고
    row.style.flexWrap = ''; row.style.overflowX = 'auto'; row.style.rowGap = ''
    const kids = [...row.children]
    const fxLab = kids.find((k) => k.textContent.trim() === '효과')
    const i = kids.indexOf(fxLab)
    const move = kids.slice(0, i), fx = kids.slice(i + 1)
    fxLab.remove()
    // 두 갈래 단추 — 앱의 갈래 칩(`.seg`)과 같은 결로
    const mk = (t, on) => { const el = document.createElement('button')
      el.textContent = t
      el.style.cssText = `flex:0 0 auto;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:800;white-space:nowrap;border:none;background:${on ? 'var(--brown)' : 'transparent'};color:${on ? '#fff' : 'var(--text-sub)'}`
      return el }
    const wrapBtn = document.createElement('span')
    wrapBtn.style.cssText = 'flex:0 0 auto;display:flex;gap:2px;background:var(--cream);border-radius:999px;padding:2px;margin-right:8px'
    wrapBtn.append(mk('움직임', true), mk('효과', false))
    row.prepend(wrapBtn)
    row.id = 'fxrow'   // ⛔ 「효과」 라벨을 단추로 바꾸면 xpath 셀렉터가 죽는다 → 표식을 단다
    move[0]?.remove()                                     // 옛 「움직임」 라벨은 뺀다(단추가 대신한다)
    for (const f of fx) f.style.display = 'none'          // 지금은 「움직임」 쪽
  })
  await page.waitForTimeout(400)
  await cut('2d-안ⓒ-두단추-움직임', '#fxrow')
  {
    const o = await page.evaluate(() => { const r = document.getElementById('fxrow'); return r ? Math.round(r.scrollWidth - r.clientWidth) : null })
    console.log(`   📏 안ⓒ «움직임» 쪽 밀림 = ${o}px`)
  }

  await page.evaluate(() => {
    const row = document.getElementById('fxrow')
    if (!row) return
    const [mv, fxb] = row.querySelector('span').children
    mv.style.background = 'transparent'; mv.style.color = 'var(--text-sub)'
    fxb.style.background = 'var(--brown)'; fxb.style.color = '#fff'
    // 움직임 칩 숨기고 효과 칩 보이기 — 칩은 rounded 단추, 라벨은 span
    const kids = [...row.children].slice(1)
    let seenAll = kids.length
    kids.forEach((k, i) => { k.style.display = i < 5 ? 'none' : '' })
    void seenAll
  })
  await page.waitForTimeout(400)
  await cut('2e-안ⓒ-두단추-효과', '#fxrow')
  // 📏 세 안이 «실제로» 얼마나 줄였나 — 눈이 아니라 숫자로
  const over = await page.evaluate(() => {
    const r = document.getElementById('fxrow')
    return r ? Math.round(r.scrollWidth - r.clientWidth) : null
  })
  console.log(`   📏 안ⓒ 밀림 = ${over}px (지금 254px)`)
}

// ═══════════════════════════════════════════════════════
// ③ 글 상자 — 「이미 되는 것」과 「없는 것」을 가른다
// ═══════════════════════════════════════════════════════
console.log('\n── ③ 글 상자 ──')
await openDecor()
{
  // 포스트잇을 붙인다 → 지금은 «시트가 열린다»(이게 창업자가 말한 번거로움)
  await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
  const note = page.locator('.decor-drawer button[aria-label*="포스트잇"], .decor-drawer button').filter({ hasText: /포스트잇/ }).first()
  const nb = await note.count() ? note : page.locator('.decor-drawer button[aria-label*="포스트잇"]').first()
  if (await nb.count()) {
    await nb.click(); await page.waitForTimeout(900)
    // 지금 흐름 = 시트가 뜬다
    const sheetUp = await page.locator('.hk-sheet, .sheet').count()
    console.log(`   ℹ️ 포스트잇을 붙이면 시트가 뜨나 = ${sheetUp ? '⛔ 뜬다(두 단계)' : '✅ 안 뜬다'}`)
    if (sheetUp) {
      await cut('3a-지금-시트가-뜬다', '.hk-sheet, .sheet')
      const ta = page.locator('.hk-sheet textarea, .sheet textarea, .hk-sheet input, .sheet input').first()
      if (await ta.count()) { await ta.fill('오늘은 김치찌개를 끓였다.\n국물이 진해서 좋았어.'); await page.waitForTimeout(300) }
      const save = page.locator('.hk-sheet button, .sheet button').filter({ hasText: /저장|확인|넣기|완료|붙이기/ }).first()
      if (await save.count()) { await save.click(); await page.waitForTimeout(900) }
    }
    // 붙은 포스트잇을 골라 «줄노트 무늬 ＋ 사각 모양»으로 바꾸고 크게 — 창업자가 말한 「줄글 사각형 프레임」
    const stk = page.locator('.decor-stage [style*="rotate"]').last()
    if (await stk.count()) { await stk.click({ force: true }); await page.waitForTimeout(700) }
    // ⛔ 무늬 칩엔 **글자가 없다** — 그림(MiniNote)만 들어 있다.
    //    첫 판에 `hasText:/^줄노트$/` 로 찾다 「못 찾았다」로 찍혔다(규칙 18 — 검사가 무엇을 보는지).
    //    ✅ 「무늬」 라벨이 연 줄에서 **네 번째 칩**(민무늬·모눈·체크·줄노트)을 누른다.
    const okLined = await page.evaluate(() => {
      const lab = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '무늬')
      if (!lab) return 'label'
      const chips = lab.parentElement.querySelectorAll('button')
      if (chips.length < 4) return `chips=${chips.length}`
      chips[3].click(); return 'ok'
    })
    await page.waitForTimeout(600)
    console.log(okLined === 'ok' ? '   ✅ 무늬 「줄노트」가 «이미» 있다 — 눌렀다' : `   ⛔ 무늬 줄을 못 찾았다 (${okLined})`)
    // 모양도 「기본」 사각으로 (창업자가 말한 「사각형 프레임」)
    await page.evaluate(() => {
      const lab = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '모양')
      lab?.parentElement.querySelectorAll('button')[0]?.click()
    })
    await page.waitForTimeout(500)
    // 크게 — 크기 손잡이 대신 저장값을 직접 키운다(손잡이 드래그는 판마다 흔들린다)
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
      if (el) { el.style.width = '78%'; el.style.height = '46%' }
    })
    await page.waitForTimeout(500)
    await cut('3b-줄글-사각-프레임-이미-된다', '.decor-stage', 6)
  } else console.log('   ⛔ 포스트잇 단추를 못 찾았다')
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
writeFileSync(join(OUT, 'cuts.json'), JSON.stringify(cuts))
await b.close(); srv.close()
console.log('📁', OUT, `· 컷 ${Object.keys(cuts).length}장`)

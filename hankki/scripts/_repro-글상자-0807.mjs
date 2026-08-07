// 🏷🐛 글 상자 — 우리 라벨지·메모지에 «글이 얹히나» (창업자 2026-08-07)
//   *"글자올릴수있는 스티커들을 다같이 배치해서 쓰자. 포스트잇이랑 여러가지 라벨들."*
//
// 재는 것 —
//   ⑴ 서랍 「글자」 칸에 글 상자 그룹이 뜨나 (라벨지·찢은종이·메모지·메모라벨·글쓰기프레임)
//   ⑵ 붙이면 «그 그림»이 종이에 올라가나
//   ⑶ 글을 치면 그 그림 «위»에 글자가 얹히나
//   ⑷⭐ **레꾸(레시피 표지)에서도 다 되나** — 여기가 급한 자리다(속지 글칸이 아예 없다)
//   ⑸ 크기·이동 손잡이가 그대로 붙나
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
await new Promise((r) => srv.listen(4419, r))
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
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })

// ⚠️ 「글자」는 하단 세그먼트가 아니라 «탭 안의 갈래 칩»이다 — 먼저 「일꾸」로 들어가야 보인다
const openIlkku = async () => {
  await page.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
}
// 레꾸 = 레시피 표지 꾸미기. 여기엔 「일꾸/레꾸」 칸이 없다(표지 하나뿐)
const openLekku = async () => {
  await page.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.locator('.grid-card').first().click(); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: /레시피 꾸미기/ }).first().click(); await page.waitForTimeout(1500)
  await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
}
const boxCells = () => page.locator('.decor-drawer button[aria-label^="글 상자"]')

// ═══ ⑴ 서랍에 글 상자 묶음이 뜨나 (일꾸) ═════════════════════
console.log('\n── ⑴ 서랍 「글자」 칸에 글 상자 ──')
await openIlkku()
{
  const n = await boxCells().count()
  const labels = await page.evaluate(() => [...document.querySelectorAll('.decor-drawer .decor-sec-label')].map((e) => e.textContent.trim()))
  console.log(`   ℹ️ 글 상자 칸 ${n}개 · 묶음 = ${labels.join(' / ')}`)
  // ⚠️ 문턱 40 → 20. 창업자가 2026-08-07 에 44 → 25컷으로 «골라» 줄였다.
  //    ⛔ 옛 문턱을 그대로 두면 「창업자가 정한 대로 했더니 검사가 실패」하는 자리가 된다.
  //    ⭐ 여기서 볼 것은 «개수»가 아니라 「글 상자가 뜨고 묶음이 다 있나」다(규칙 18 ⓘ).
  if (n >= 20) ok(`글 상자가 ${n}개 뜬다`)
  else no(`글 상자가 ${n}개뿐이다 — 20개는 넘어야 한다`)
  for (const want of ['라벨지 · 배너', '찢은 종이', '메모지', '메모 · 라벨', '글쓰기 프레임']) {
    if (labels.includes(want)) ok(`「${want}」 묶음이 있다`)
    else no(`「${want}」 묶음이 없다`)
  }
  // ⭐ 포스트잇이 «맨 뒤»인가 — 창업자 판정(*"포스트잇은 디자인이나 색상이 넘 별루"*)대로 우리 그림이 먼저
  const bi = labels.indexOf('라벨지 · 배너'), pi = labels.indexOf('포스트잇')
  if (bi >= 0 && pi >= 0 && bi < pi) ok('우리 그림이 포스트잇보다 «먼저» 나온다')
  else no(`차례가 어긋났다 — 라벨지 ${bi} · 포스트잇 ${pi}`)
}

// ═══ ⑵⑶ 붙이면 그림이 올라가고, 그 «위»에 글이 얹히나 ══════════
console.log('\n── ⑵⑶ 붙이기 → 그림 ＋ 그 위에 글 ──')
{
  // ⚠️ 2026-08-07 부터 시트가 «안» 열린다 — 붙이면 그 상자에 바로 커서가 들어간다.
  //    첫 판은 시트를 기다리다 죽었다. 검사도 새 흐름을 따라가야 한다.
  await boxCells().first().click(); await page.waitForTimeout(900)
  const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
  if (!(await ta.count())) no('붙였는데 글 쓰는 자리가 안 생겼다')
  else {
    await ta.fill('오늘 김치찌개'); await page.waitForTimeout(400)
    await page.mouse.click(8, 300); await page.waitForTimeout(600)   // 종이 밖 → 치기 끝
  }
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
    if (!el) return null
    const img = el.querySelector('img')
    const txt = (el.textContent || '').trim()
    const box = el.getBoundingClientRect()
    return { 그림: img ? (img.getAttribute('src') || '').split('/').pop() : null,
             그려짐: img ? img.naturalWidth > 0 : false,
             글자: txt, 폭: Math.round(box.width), 높이: Math.round(box.height) }
  })
  if (!r) no('붙인 것을 못 찾았다 — 검사 방식부터 볼 것')
  else {
    console.log(`   ℹ️ 그림 ${r.그림} · 그려짐 ${r.그려짐} · 글 "${r.글자}" · ${r.폭}×${r.높이}px`)
    if (r.그림) ok('우리 라벨지 그림이 종이에 올라갔다'); else no('그림이 없다 — 벡터 포스트잇이 나왔다')
    if (r.그려짐) ok('그림이 실제로 그려졌다(깨짐 0)'); else no('그림이 안 그려졌다')
    if (r.글자.includes('김치찌개')) ok('⭐ 그림 «위»에 글이 얹혔다')
    else no(`글이 안 얹혔다 (텍스트="${r.글자}")`)
    // 라벨지는 납작하다 — 정사각으로 나오면 비율이 안 먹은 것이다
    if (r.폭 > r.높이 * 1.3) ok(`납작하게 나온다 (${(r.폭 / r.높이).toFixed(2)}:1) — 그림 비율을 따랐다`)
    else no(`비율이 안 먹었다 (${(r.폭 / r.높이).toFixed(2)}:1) — 정사각 포스트잇 비율을 쓰고 있다`)
  }
}

// ═══ ⑸ 손잡이가 붙나 (크기·이동) ═════════════════════════════
console.log('\n── ⑸ 손잡이 ──')
{
  const stk = page.locator('.decor-stage [style*="rotate"]').last()
  await stk.click({ force: true }); await page.waitForTimeout(700)
  const n = await page.evaluate(() => document.querySelectorAll('.decor-stage button, .decor-stage [role="button"]').length)
  console.log(`   ℹ️ 판 위 단추 ${n}개`)
  if (n >= 2) ok('지우기·크기 손잡이가 붙는다')
  else no(`손잡이가 ${n}개뿐이다`)
}

// ═══ ⑷⭐ 레꾸에서도 다 되나 — 여기가 급한 자리 ═══════════════
console.log('\n── ⑷⭐ 레꾸(레시피 표지)에서도 ──')
await openLekku()
{
  const n = await boxCells().count()
  const labels = await page.evaluate(() => [...document.querySelectorAll('.decor-drawer .decor-sec-label')].map((e) => e.textContent.trim()))
  console.log(`   ℹ️ 레꾸 글 상자 칸 ${n}개 · 묶음 = ${labels.join(' / ')}`)
  if (n >= 20) ok(`⭐ 레꾸에서도 글 상자가 ${n}개 뜬다 — 여긴 속지 글칸이 «아예 없는» 자리다`)
  else no(`레꾸엔 글 상자가 ${n}개뿐이다 — 20개는 넘어야 한다`)
  if (labels.includes('메모지')) ok('⭐ 일기 메모지 12컷이 레꾸에서도 나온다 (전엔 only:diary 라 0개였다)')
  else no('레꾸에 메모지 묶음이 없다 — only:diary 가 아직 막고 있다')
  // 실제로 붙여서 글까지
  if (n) {
    await boxCells().first().click(); await page.waitForTimeout(900)
    const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
    if (await ta.count()) {
      await ta.fill('우리집 최고'); await page.waitForTimeout(400)
      await page.mouse.click(8, 300); await page.waitForTimeout(600)
    }
    const t = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
      return el ? { 글자: (el.textContent || '').trim(), 그림: !!el.querySelector('img') } : null
    })
    if (t && t.그림 && t.글자.includes('최고')) ok('⭐⭐ 레꾸 표지에 글 상자로 글을 썼다')
    else no(`레꾸에서 글이 안 얹혔다 — ${JSON.stringify(t)}`)
  }
}

// ═══ ⑹⭐ 「그 자리에서 바로 치기」 — 시트가 «안» 열리고 커서가 상자에 들어가나 ═══
//   창업자 2026-08-07 *"지금 처럼 붙이기는 너무 불편해(이건 레꾸에서도 너무 불편했었어)"*
console.log('\n── ⑹⭐ 붙이면 «그 자리»에서 바로 쳐지나 ──')
await openIlkku()
{
  await boxCells().first().click(); await page.waitForTimeout(900)
  const sheets = await page.evaluate(() => document.querySelectorAll('.hk-sheet, .sheet').length)
  if (sheets) no(`아직 시트가 뜬다 (${sheets}개) — 창업자 제보 그대로`)
  else ok('시트가 «안» 뜬다')
  // 판 «안»에 글칸이 생겼나 ＋ 커서가 거기 있나
  const r = await page.evaluate(() => {
    const ta = document.querySelector('.decor-stage textarea[data-boxtext]')
    return ta ? { 있나: true, 포커스: document.activeElement === ta } : { 있나: false }
  })
  if (!r.있나) no('상자에 치는 칸이 안 생겼다')
  else {
    ok('상자 «안»에 치는 칸이 생겼다')
    if (r.포커스) ok('⭐ 커서가 «바로» 그 상자에 들어갔다 — 아무것도 안 눌러도 쳐진다')
    else no('커서가 안 들어갔다 — 한 번 더 눌러야 한다')
  }
  // 실제로 쳐 보고 그림 위에 남나
  await page.keyboard.type('바로 쳐진다'); await page.waitForTimeout(500)
  await page.mouse.click(8, 300); await page.waitForTimeout(600)   // 종이 밖 → 치기 끝
  const t = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
    return el ? { 글자: (el.textContent || '').trim(), 칸남음: !!document.querySelector('.decor-stage textarea[data-boxtext]') } : null
  })
  console.log(`   ℹ️ 남은 글 "${t?.글자}" · 종이 밖 누른 뒤 치는 칸 ${t?.칸남음 ? '남음' : '없어짐'}`)
  if (t && t.글자.includes('바로 쳐진다')) ok('⭐⭐ 친 글이 그림 위에 그대로 남았다')
  else no(`친 글이 안 남았다 — ${JSON.stringify(t)}`)
  if (t && !t.칸남음) ok('종이 밖을 누르면 치기가 끝난다')
  else no('종이 밖을 눌러도 치는 칸이 안 닫힌다')
}

// ═══ ⑺ 「글자 넣기」도 시트 없이 그 자리에서 ═══════════════════
//   창업자 2026-08-07 *"그럼 예전방식은 없어진거지? 따로창떠서 쓰고 붙이기하던거"*
//   → 포스트잇·글 상자·글자 넣기 **셋 다** 없앴다. 여기선 마지막 하나를 잰다.
console.log('\n── ⑺ 「글자 넣기」도 그 자리에서 ──')
await openIlkku()
{
  const add = page.locator('.decor-drawer button').filter({ hasText: /^글자 넣기$/ }).first()
  if (!(await add.count())) no('「글자 넣기」 단추를 못 찾았다 — 검사 방식부터 볼 것')
  else {
    await add.click(); await page.waitForTimeout(900)
    const sheets = await page.evaluate(() => document.querySelectorAll('.hk-sheet, .sheet').length)
    if (sheets) no(`「글자 넣기」에 아직 시트가 뜬다 (${sheets}개)`)
    else ok('「글자 넣기」도 시트가 «안» 뜬다')
    const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
    if (!(await ta.count())) no('글자 스티커에 치는 칸이 안 생겼다')
    else {
      await ta.fill('우리집 최고 메뉴'); await page.waitForTimeout(400)
      await page.mouse.click(8, 300); await page.waitForTimeout(600)
      const t = await page.evaluate(() => {
        const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
        return el ? (el.textContent || '').trim() : null
      })
      console.log(`   ℹ️ 남은 글 "${t}"`)
      if (t && t.includes('우리집 최고')) ok('⭐ 글자 스티커도 그 자리에서 쳐진다')
      else no(`글자가 안 남았다 ("${t}")`)
    }
  }
  // ⭐ 시트를 여는 길이 «하나도» 안 남았나 — 죽은 코드를 지웠으니 아예 없어야 한다
  const anySheet = await page.evaluate(() => document.querySelectorAll('.hk-sheet, .sheet').length)
  if (!anySheet) ok('「따로 창 떠서 쓰고 붙이기」가 어디서도 안 뜬다')
  else no(`시트가 아직 ${anySheet}개 떠 있다`)
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)

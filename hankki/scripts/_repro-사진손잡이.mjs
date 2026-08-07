// 📷🐛 창업자 폰 제보 2026-08-07 (두 번째 묶음)
//   ⓐ *"일꾸에서 사진을 넣었잖아. **삭제하는 버튼이 없어**(넣은 사진)"*
//   ⓑ *"**프레임에 넣은 사진을 줄이는 도구도 없고**"*
//
// ⛔ 짐작 금지 — 「단추가 DOM 에 있나」가 아니라 **「눈에 보이고 누를 수 있나」**를 잰다.
//    지난 판에서 만족도 점이 «DOM 엔 눌려 있는데 화면엔 안 보이던» 일을 이미 겪었다.
//    ⭐ 그래서 여기선 셋을 다 본다 — ①있나 ②판 «안»에 있나(잘렸나) ③그 자리를 «진짜 그 단추»가 받나
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4391, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const { FRAME_WINDOW } = await import('../src/data/frameWindows.js')
const FKEY = Object.keys(FRAME_WINDOW).find((k) => /^pf_(0|1)/.test(k)) || Object.keys(FRAME_WINDOW)[0]

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)

// 📐 「단추가 판 «안»에 온전히 있나」 — `.decor-stage` 는 overflow:hidden 이라 넘치면 «잘려서 안 보인다»
const btnState = async (label) => page.evaluate((lb) => {
  const st = document.querySelector('.decor-stage')
  const el = document.querySelector(`.decor-stage [aria-label="${lb}"]`)
  if (!el) return { there: false }
  const r = el.getBoundingClientRect(); const s = st.getBoundingClientRect()
  // 🎯 그 한가운데를 «누가» 받는가 — 다른 게 위에 있으면 눌러도 그놈이 먹는다
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2
  const top = document.elementFromPoint(cx, cy)
  return {
    there: true, w: Math.round(r.width), h: Math.round(r.height),
    // 판 «안»에 온전히 들어와야 보인다 (하나라도 밖이면 잘린 것)
    inside: r.left >= s.left - 0.5 && r.top >= s.top - 0.5 && r.right <= s.right + 0.5 && r.bottom <= s.bottom + 0.5,
    over: !!(top && (top === el || el.contains(top) || top.closest?.(`[aria-label="${lb}"]`))),
    x: Math.round(r.left - s.left), y: Math.round(r.top - s.top),
  }
}, label)

// 🖼 어떤 종류가 골라졌나 — 고른 것의 상자 안에 무엇이 들었는지로 판단한다
const selKind = async () => page.evaluate(() => {
  const btn = document.querySelector('.decor-stage [aria-label="스티커 삭제"]')
  if (!btn) return 'none'
  const box = btn.closest('[style*="translate(-50%"]')?.parentElement
  if (!box) return '?'
  const img = box.querySelector('img')
  if (!img) return 'other'
  return (img.currentSrc || img.src).startsWith('data:') ? 'photo' : 'sticker'
})

const shot = (n) => page.screenshot({ path: join(OUT, `사진손잡이-${n}.png`) })

// ═══ ⓐ 그냥 사진 스티커 ═══════════════════════════════
console.log('\n── ⓐ 일꾸에 붙인 «사진 스티커» ──')
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
const TW = 540, TH = 960
const b64 = await page.evaluate(([w, h]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d'); x.fillStyle = '#cc8866'; x.fillRect(0, 0, w, h)
  return c.toDataURL('image/png').split(',')[1]
}, [TW, TH])
const fi = page.locator('.decor-drawer input[type=file]').first()
await fi.setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') })
await page.waitForTimeout(1600)

let s1 = await btnState('스티커 삭제')
if (!s1.there) no('붙인 «직후»에도 삭제 단추가 아예 없다')
else if (!s1.inside) no(`붙인 직후 삭제 단추가 «판 밖»이라 잘린다 — 판 기준 (${s1.x}, ${s1.y})`)
else if (!s1.over) no('삭제 단추 자리를 «다른 것»이 받는다 — 눌러도 안 지워진다')
else ok(`붙인 직후 = 삭제 단추가 보이고 눌린다 (판 기준 ${s1.x}, ${s1.y})`)
const h1 = await btnState('크기·회전')
if (h1.there && h1.inside && h1.over) ok('크기 손잡이도 보이고 눌린다')
else no(`크기 손잡이가 ${!h1.there ? '없다' : !h1.inside ? '판 밖이라 잘린다' : '다른 것에 가렸다'}`)
await shot('a1-붙인직후')

// 딴 데 눌러 풀었다가 → 사진을 다시 눌러 고른다 (창업자가 실제로 하는 일)
const stage = await page.locator('.decor-stage').first().boundingBox()
await page.mouse.click(stage.x + stage.width * 0.06, stage.y + stage.height * 0.06); await page.waitForTimeout(400)
if ((await selKind()) !== 'none') no('딴 데를 눌렀는데도 고른 게 안 풀린다')
const ph = await page.locator('.decor-stage img[src^="data:"]').first().boundingBox()
await page.mouse.click(ph.x + ph.width / 2, ph.y + ph.height / 2); await page.waitForTimeout(400)
const k1 = await selKind()
if (k1 !== 'photo') no(`사진을 눌렀는데 «${k1}» 이 골라졌다`)
else {
  const s2 = await btnState('스티커 삭제')
  if (s2.there && s2.inside && s2.over) ok('다시 눌러 골라도 삭제 단추가 보이고 눌린다')
  else no(`다시 골랐을 때 삭제 단추가 ${!s2.there ? '없다' : !s2.inside ? '판 밖이라 잘린다' : '가렸다'}`)
}

// 📌 위쪽으로 끌면? — `overflow:hidden` 이라 단추가 «판 밖»으로 나가면 잘린다
await page.mouse.move(ph.x + ph.width / 2, ph.y + ph.height / 2)
await page.mouse.down()
await page.mouse.move(stage.x + stage.width * 0.5, stage.y + stage.height * 0.08, { steps: 12 })
await page.mouse.up(); await page.waitForTimeout(500)
const s3 = await btnState('스티커 삭제')
if (s3.there && s3.inside && s3.over) ok('사진을 «위로 끌어도» 삭제 단추가 판 안에 남는다')
else no(`⭐ 사진을 위로 끄니 삭제 단추가 ${!s3.there ? '사라졌다' : !s3.inside ? `«판 밖»으로 잘렸다 — 판 기준 (${s3.x}, ${s3.y})` : '가렸다'}`)
await shot('a2-위로끌기')

// ═══ ⓒ 탭을 옮기지 «않아도» 고칠 수 있나 ═══════════════
//   창업자 *"일꾸아이템은 일꾸탭을 눌러야 수정, 글쓰기는 글쓰기 탭을 눌러야 수정. 아직도 안바뀌었어."*
console.log('\n── ⓒ 딴 탭에서도 스티커를 탭하면 고쳐지나 ──')
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(700)
if ((await selKind()) !== 'none') no('탭을 옮겼는데 고른 게 남아 있다')
const ph3 = await page.locator('.decor-stage img[src^="data:"]').first().boundingBox()
if (!ph3) no('속지 탭에서 사진을 못 찾았다')
else {
  await page.mouse.click(ph3.x + ph3.width / 2, ph3.y + ph3.height / 2); await page.waitForTimeout(600)
  const k4 = await selKind()
  const onIlkku = await page.locator('.seg.on', { hasText: '일꾸' }).count()
  if (k4 === 'photo') ok('⭐ 「속지」 탭에서 스티커를 탭하니 바로 골라진다 — 탭을 옮길 일이 없다')
  else no(`⭐ 「속지」 탭에서 스티커를 탭했는데 «${k4}» — 여전히 「일꾸」 탭을 먼저 눌러야 한다`)
  if (onIlkku) ok('꾸미기(일꾸) 탭으로 저절로 넘어갔다')
  else no('고르긴 했는데 꾸미기 탭으로 안 넘어갔다 — 도구가 안 보인다')
}
// ⛔ 빈 자리는 그대로 통과해야 한다 — 스티커가 아닌 곳을 눌러 속지 축이 죽으면 안 된다
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(600)
const axis = page.locator('.decor-stage [aria-label="날씨 표시"]').first()
if (await axis.count()) {
  await axis.click(); await page.waitForTimeout(350)
  const pressed = await axis.getAttribute('aria-pressed')
  if (pressed === 'true') ok('빈 자리는 그대로 통과한다 — 속지 축이 살아 있다')
  else no('스티커 층이 속지 축을 가로챈다')
} else console.log('   ℹ️ 이 틀엔 날씨 축이 없어 건너뜀')

// ═══ ⓑ 프레임에 끼운 사진 ═════════════════════════════
//   ⭐ 서랍에서 프레임을 «찾아 누르는» 길은 탭·스크롤에 흔들린다(첫 판에서 실제로 못 붙였다).
//      `_repro-frameshot` 과 같이 **프레임을 미리 판에 심어두고** 시작한다 — 재는 건 그 «다음»이다.
console.log('\n── ⓑ «프레임에 끼운» 사진 ──')
// ⚠️⚠️ **같은 창에서 이어 하면 앞 단계가 남는다.** `addInitScript` 를 덧붙여도 앞 상태가 이겼다
//    (판 위 그림이 ⓐ에서 붙인 사진의 data URL 이었다) → **새 창으로 갈라서** 확실히 끊는다.
//    📌 「덮어썼겠지」는 짐작이다. 갈라 놓으면 짐작할 일이 없다.
const ctx2 = await b.newContext({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
page = await ctx2.newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { ...state, diary: [{ ...state.diary[0], decor: [{ id: 'fr1', type: 'sticker', key: FKEY, x: 0.5, y: 0.42, s: 0.58, r: 0 }] }] })
await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '레꾸', exact: true }).last().click(); await page.waitForTimeout(700)
// 판 위 프레임을 탭해서 고른다 — 그래야 단추가 「이 프레임에 사진 넣기」로 바뀐다
const fimg = page.locator(`.decor-stage img[src*="${FKEY}"]`).first()
if (await fimg.count()) { const bb = await fimg.boundingBox(); if (bb) await page.mouse.click(bb.x + 8, bb.y + 8) }
await page.waitForTimeout(500)
// ⚠️ 「무엇이 판에 있나」를 «파일 이름»으로 본다 — 빌드가 해시를 붙여서 경로로 찾으면 놓친다(2026-08-07 실제로 놓쳤다)
const onStage = await page.evaluate(() => [...document.querySelectorAll('.decor-stage img')].map((i) => (i.currentSrc || i.src).split('/').pop()))
console.log('   ℹ️ 판 위 그림 =', onStage.join(' | ') || '(없음)')
const frameOnStage = onStage.filter((n) => n.startsWith('pf_')).length
if (!frameOnStage) { no('프레임을 판에 못 붙였다 — 이 아래 검사는 못 한다'); }
else {
  ok(`프레임을 붙였다 (판 위 ${frameOnStage}개)`)
  // 「이 프레임에 사진 넣기」로 바뀌었는지
  const label = (await page.getByText('이 프레임에 사진 넣기', { exact: true }).count()) ? '이 프레임에 사진 넣기' : '사진 스티커로 붙이기'
  console.log('   ℹ️ 지금 단추 이름 =', label)
  const fi2 = page.locator('.decor-drawer input[type=file]').first()
  await fi2.setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') })
  await page.waitForTimeout(1600)
  await shot('b1-프레임에넣음')

  const ph2 = await page.locator('.decor-stage img[src^="data:"]').first().boundingBox()
  if (!ph2) no('프레임에 넣은 사진이 판에 없다')
  else {
    // 딴 데 눌러 풀고 → 사진 한가운데를 누른다
    const st2 = await page.locator('.decor-stage').first().boundingBox()
    await page.mouse.click(st2.x + st2.width * 0.06, st2.y + st2.height * 0.06); await page.waitForTimeout(400)
    await page.mouse.click(ph2.x + ph2.width / 2, ph2.y + ph2.height / 2); await page.waitForTimeout(450)
    const k2 = await selKind()
    console.log(`   ℹ️ 창 안을 누르면 «${k2 === 'sticker' ? '프레임' : k2}» 이 골라진다 (프레임이 위에 있으니 당연하다)`)
    // ⭐ 그래서 「길을 하나 낸다」 — 도구 바의 「속 사진 고르기」
    // 🔀 2026-08-07(v9.97·안 D) — 도구가 «갈래»로 갈렸다. 「사진」 갈래를 먼저 눌러야 그 줄이 나온다.
    //    ⛔ 안 누르고 찾으면 늘 0개다 → 「없다」가 아니라 «내가 안 열었다». (규칙 18)
    const 사진갈래 = page.locator('.decor-tools button[data-ctxtab="photo"]')
    console.log(`   ℹ️ 「사진」 갈래 ${await 사진갈래.count()}개`)
    if (await 사진갈래.count()) { await 사진갈래.first().click(); await page.waitForTimeout(400) }
    else no('⭐ 프레임을 골랐는데 「사진」 갈래가 아예 없다 — 속 사진으로 갈 길이 없다')
    const bridge = page.getByRole('button', { name: '속 사진 고르기' })
    if (!(await bridge.count())) no('⭐ 프레임을 골랐는데 「속 사진 고르기」가 없다 — 사진에 손이 안 닿는다')
    else {
      await bridge.first().click(); await page.waitForTimeout(400)
      const k3 = await selKind()
      if (k3 !== 'photo') no(`「속 사진 고르기」를 눌렀는데 «${k3}» 이 골라졌다`)
      else {
        ok('⭐ 「속 사진 고르기」로 프레임 속 사진이 골라진다')
        const s4 = await btnState('크기·회전')
        if (s4.there && s4.inside && s4.over) ok('⭐ 그 사진의 «크기 손잡이»가 보이고 눌린다 — 줄일 수 있다')
        else no(`사진을 골랐는데 크기 손잡이가 ${!s4.there ? '없다' : !s4.inside ? '판 밖이라 잘린다' : '가렸다'}`)
        const s5 = await btnState('스티커 삭제')
        if (s5.there && s5.inside && s5.over) ok('그 사진의 지우기 단추도 보이고 눌린다')
        else no('사진을 골랐는데 지우기 단추가 안 보인다')
        // 되돌아가는 길도 있어야 한다
        if (await page.getByRole('button', { name: '프레임 고르기' }).count()) ok('사진에서 «프레임으로» 돌아가는 길도 있다')
        else no('사진을 고르면 프레임으로 돌아갈 길이 없다')
      }
    }
    await shot('b2-사진누름')
  }
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남 — 창업자 제보가 재현됐다\n` : '\n✅✅ 전부 통과 — 재현 안 됨(다른 원인)\n')
process.exit(bad ? 1 : 0)

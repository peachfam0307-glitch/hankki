// 🔢📱 **「재료는 2열이 나아, 스크롤이 나아?」를 «재서» 답한다** (2026-09-04)
//
// 📮 창업자 물음 = *"재료는 2열이 나아 아님 스크롤이 나아?"* ＋ *"글씨가 너무 작아(패드에서)"*
//
// ⛔ 「2열이 좋아 보인다」는 답이 아니다 — 창업자가 고를 수 있게 **숫자**를 놓는다(규칙 6·11).
// ⭐ 재는 것 = **「스크롤이 생기나」** 하나. 요리모드 0단계는 «재료를 다 꺼내 놓고 시작하는» 자리라
//    한 눈에 다 보이는 것이 값이고, 스크롤은 불 앞에서 «한 번 더 만지게» 만든다.
//
// 🔬 짜임 = 실제 앱을 패드 가로(1280×800)로 띄워 요리모드 0단계로 들어간 뒤,
//    글자 크기와 열 수를 **CSS 변수가 아니라 실제 규칙으로** 바꿔가며 `.cook-body` 가 넘치나 본다.
//    ⛔ 흉내 낸 HTML 로 재지 않는다 — 앱과 같은 것을 재야 한다(절대원칙 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-재료두열-0904.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const 집 = `http://127.0.0.1:${srv.address().port}/`

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🖥 재는 자리 = 창업자가 실제로 쓰는 두 방향
const 화면들 = [
  { 이름: '패드 가로', w: 1280, h: 800 },
  { 이름: '패드 세로', w: 800, h: 1280 },
]

// 🔢 재는 칸 = (열 수 × 글자 크기). 19 = 지금 값 · 30 = 내가 넣은 값 · 그 위는 여유가 있나 보려고.
const 글자들 = [19, 24, 26, 28, 30, 32, 34, 36]

const 표 = []
for (const 화면 of 화면들) {
  const ctx = await b.newContext({ viewport: { width: 화면.w, height: 화면.h } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  p.setDefaultTimeout(15000)
  await p.goto(집, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (const 글자 of ['나중에 볼게요', '확인', '닫기']) {
    const t = p.getByRole('button', { name: 글자 }).first()
    if (await t.count()) { await t.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(600) }
  }

  // 📚 요리모드 0단계로 들어간다 — 첫 편이면 된다(재는 건 «짜임»이지 «내용»이 아니다)
  const 탭 = p.locator('.tabbar button, nav button, [role="tab"]').filter({ hasText: /^레시피$/ }).first()
  if (await 탭.count()) { await 탭.click(); await p.waitForTimeout(1200) }
  const 첫칸 = p.locator('.grid-card button.press').first()
  if (!(await 첫칸.count())) { console.log(`  ⛔ ${화면.이름} — 목록에서 한 편도 못 찾았다`); await ctx.close(); continue }
  await 첫칸.click(); await p.waitForTimeout(1400)
  const 시작 = p.getByRole('button', { name: /요리모드 시작/ }).first()
  if (!(await 시작.count())) { console.log(`  ⛔ ${화면.이름} — 「요리모드 시작」을 못 찾았다`); await ctx.close(); continue }
  await 시작.click(); await p.waitForTimeout(1600)

  // 🔢 재료 «개수»를 원하는 만큼 맞춘다 — 줄을 복제해서.
  //    ⛔ 흉내가 아니다: DOM 도 CSS 도 앱의 것 그대로이고 «내용»만 늘린 것이다.
  //       재는 것이 「글자가 몇 줄을 먹나」라 이걸로 참값이 나온다.
  // ⛔⛔ [2026-09-04 · 규칙 18 이 잡았다] 처음엔 «첫 줄만» 복제해 늘렸더니 값이 어긋났다 —
  //    첫 재료가 긴 이름이면 큰 글자에서 두 줄로 접혀 **높이가 통째로 부풀었다.**
  //    ✅ 그래서 그 편의 재료 줄을 «통째로 갈무리»해 두고 **돌려가며** 채운다. 길이 분포가 실물과 같아진다.
  const 목표재료 = Number(process.env.ING || 10)
  const 원래수 = await p.locator('.cook-ing').count()
  await p.evaluate(() => {
    const 통 = document.querySelector('.cook-ings')
    window.__원본줄 = 통 ? [...통.querySelectorAll('.cook-ing-row')].map((el) => el.outerHTML) : []
  })
  const 맞추기 = `(목표) => {
    const 통 = document.querySelector('.cook-ings')
    const 본 = window.__원본줄 || []
    if (!통 || !본.length) return
    통.innerHTML = ''
    for (let i = 0; i < 목표; i++) 통.insertAdjacentHTML('beforeend', 본[i % 본.length])
  }`
  await p.evaluate(new Function('return ' + 맞추기)(), 목표재료)
  await p.waitForTimeout(300)
  const 재료수 = await p.locator('.cook-ing').count()
  console.log(`\n🖥 ${화면.이름} (${화면.w}×${화면.h}) — 재료 ${재료수}개로 맞춰 잰다 (그 편의 원래 개수 ${원래수})`)
  console.log('   글자   1열            2열')

  for (const 크기 of 글자들) {
    const 줄 = []
    for (const 열 of [1, 2]) {
      const 넘침 = await p.evaluate(({ 크기, 열 }) => {
        const 옛 = document.getElementById('_probe-css')
        if (옛) 옛.remove()
        const st = document.createElement('style')
        st.id = '_probe-css'
        // ⚠️ 인라인이 아니라 «규칙»으로 준다 — 앱이 쓰는 것과 같은 길로 들어가야 참값이 나온다
        st.textContent = `
          .cook-ings { max-width: ${열 === 2 ? 1040 : 620}px !important; columns: ${열 === 2 ? '2' : 'auto'} !important; column-gap: 54px; }
          .cook-ings .cook-ing-row { break-inside: avoid; min-height: ${크기 >= 26 ? 54 : 44}px !important; }
          .cook-ing { font-size: ${크기}px !important; }
          .cook-ing-box { width: ${크기 >= 26 ? 30 : 23}px !important; height: ${크기 >= 26 ? 30 : 23}px !important; }`
        document.head.appendChild(st)
        const body = document.querySelector('.cook-body')
        if (!body) return null
        // 강제로 다시 재게
        void body.offsetHeight
        return { 넘침: body.scrollHeight - body.clientHeight, 안높이: body.clientHeight, 속높이: body.scrollHeight }
      }, { 크기, 열 })
      await p.waitForTimeout(120)
      줄.push(넘침)
    }
    const 글 = (r) => (r === null ? '  ?  ' : r.넘침 <= 1 ? '✅ 스크롤 없음  ' : `⛔ ${r.넘침}px 넘침`)
    console.log(`   ${String(크기).padStart(2)}px   ${글(줄[0]).padEnd(16)}${글(줄[1])}`)
    표.push({ 화면: 화면.이름, 크기, 재료수, 한열: 줄[0]?.넘침 ?? -1, 두열: 줄[1]?.넘침 ?? -1 })
  }

  // 🔢🔢 **「몇 개까지 스크롤 없이 보이나」** — 이게 창업자가 실제로 겪는 값이다.
  //    ⛔ 「스크롤이 아예 없다」고 말할 수 없다: 재료 29개짜리(샤브샤브·양지수육)가 있다.
  //       그러니 없앤다가 아니라 **«몇 개까지 한눈에 들어오나»**를 재서 말한다.
  console.log('   ─ 몇 개까지 스크롤 없이 보이나 ─')
  for (const [열, 크기, 이름] of [[1, 19, '지금 (1열·19px)'], [2, 30, '고친 뒤 (2열·30px)']]) {
    let 마지막 = 0
    for (let n = 4; n <= 30; n++) {
      const 넘침 = await p.evaluate(({ n, 열, 크기 }) => {
        const 통 = document.querySelector('.cook-ings')
        const 본 = window.__원본줄 || []
        if (!통 || !본.length) return 9999
        통.innerHTML = ''
        for (let i = 0; i < n; i++) 통.insertAdjacentHTML('beforeend', 본[i % 본.length])
        const 옛 = document.getElementById('_probe-css'); if (옛) 옛.remove()
        const st = document.createElement('style'); st.id = '_probe-css'
        st.textContent = `
          .cook-ings { max-width: ${열 === 2 ? 1040 : 620}px !important; columns: ${열 === 2 ? '2' : 'auto'} !important; column-gap: 54px; }
          .cook-ings .cook-ing-row { break-inside: avoid; min-height: ${크기 >= 26 ? 54 : 44}px !important; }
          .cook-ing { font-size: ${크기}px !important; }
          .cook-ing-box { width: ${크기 >= 26 ? 30 : 23}px !important; height: ${크기 >= 26 ? 30 : 23}px !important; }`
        document.head.appendChild(st)
        const body = document.querySelector('.cook-body')
        void body.offsetHeight
        return body.scrollHeight - body.clientHeight
      }, { n, 열, 크기 })
      if (넘침 <= 1) 마지막 = n; else break
    }
    console.log(`   ${이름.padEnd(20)} → ${마지막}개까지`)
  }
  await ctx.close()
}

await b.close(); srv.close()

console.log('\n📌 한 줄로 =')
for (const 화면 of [...new Set(표.map((r) => r.화면))]) {
  const 것 = 표.filter((r) => r.화면 === 화면)
  const 한열최대 = 것.filter((r) => r.한열 <= 1).map((r) => r.크기).pop()
  const 두열최대 = 것.filter((r) => r.두열 <= 1).map((r) => r.크기).pop()
  console.log(`   ${화면} · 재료 ${것[0].재료수}개 — 1열은 ${한열최대 ?? '없음'}px 까지 · 2열은 ${두열최대 ?? '없음'}px 까지 (스크롤 없이)`)
}

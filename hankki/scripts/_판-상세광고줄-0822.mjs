// 🛒 [판정 대기 · 2026-08-22] 레시피 상세의 「주부의 장바구니에서 고른 재료」 — 줄바꿈 시안
//
// 📮 창업자 = *"레시피상세에서 **광고도 줄바꿈 손보고** 전체적으로 손봐야해."*
//
// 🔢 지금 (390×844) — 한 줄이 이렇게 생겼다
//    [그림30] [제품 이름 ＋ 몰 배지]  [사러가기]
//    ⛔ 이름과 배지가 «같은 줄»에 인라인으로 붙어 있고, 오른쪽 「사러가기」가 폭을 먹는다.
//       → 이름이 두 줄로 갈라지고 **배지가 둘째 줄 «끝»에 매달린다**:
//         「오월햇살 우리밀 / 유기농국수 [쿠팡]」  「무농약콩으로 만든 / 콩국물 [한살림·조합원 전용]」
//       ⭐ 이름과 배지는 «한 덩어리»로 읽혀야 하는데 갈라져서 어색하다.
//
// ⛔ 이름을 «자르지» 않는다 — 제품 이름이 안 보이면 살 수가 없다(그게 이 칸의 일이다).
// ⛔ 앱 소스는 «안» 고친다 — 진짜 화면 DOM 을 그 자리에서 바꿔 찍는 판이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-상세광고줄-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/상세광고줄'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4442, r))

// 「고른 재료」 칸의 줄들을 찾는다 — 그림 30px ＋ 이름 ＋ 오른쪽 단추가 있는 flex 줄
// ⛔ 함수를 evaluate 의 «인자»로 넘길 수 없다(직렬화가 안 된다) → 페이지 «안»에서 정의한다
const 줄찾기심기 = () => {
  window.__줄찾기 = () => {
    // ⛔ 「find」로 잡으면 «제일 바깥»이 걸린다 — html 은 자식이 둘(head·body)이라 조건을 통과한다.
    //    ✅ 조건에 맞는 것 중 «제일 안쪽»(마지막)을 고른다.
    const 후보 = [...document.querySelectorAll('*')].filter((e) => /주부의 장바구니에서 고른 재료/.test(e.innerText || '') && e.children.length <= 4)
    const 제목 = 후보[후보.length - 1]
    if (!제목 || !제목.parentElement) return null
    const 상자 = 제목.parentElement
    return [...상자.children].filter((el) => {
      const cs = getComputedStyle(el)
      return cs.display === 'flex' && el.querySelector('img') && /사러가기|매장에서/.test(el.innerText || '')
    })
  }
}

const 조각 = {
  // ⓐ 배지를 «이름 아래»로 — 이름이 온전한 폭을 쓰고, 배지는 자기 줄을 갖는다
  배지아래로: () => {
    const 줄 = window.__줄찾기(); if (!줄 || !줄.length) return '못 찾음'
    let n = 0
    for (const el of 줄) {
      const 가운데 = [...el.children].find((c) => c.tagName === 'DIV')
      if (!가운데) continue
      const 이름 = 가운데.children[0], 배지 = 가운데.children[1]
      if (!이름) continue
      이름.style.display = 'block'
      if (배지) { 배지.style.display = 'inline-block'; 배지.style.marginLeft = '0'; 배지.style.marginTop = '3px' }
      n++
    }
    return n + '줄'
  },
  // ⓑ 「사러가기」를 «아래 줄»로 — 이름이 폭을 다 쓴다
  단추아래로: () => {
    const 줄 = window.__줄찾기(); if (!줄 || !줄.length) return '못 찾음'
    let n = 0
    for (const el of 줄) {
      el.style.flexWrap = 'wrap'
      const 끝 = el.lastElementChild
      if (끝) { 끝.style.marginLeft = '40px'; 끝.style.marginTop = '4px' }
      const 가운데 = [...el.children].find((c) => c.tagName === 'DIV')
      if (가운데) 가운데.style.flexBasis = 'calc(100% - 40px)'
      n++
    }
    return n + '줄'
  },
  // ⓒ 「사러가기」를 «작게» — 글자를 줄여 이름 폭을 벌어준다
  단추작게: () => {
    const 줄 = window.__줄찾기(); if (!줄 || !줄.length) return '못 찾음'
    let n = 0
    for (const el of 줄) {
      const 끝 = el.lastElementChild
      if (!끝) continue
      끝.style.fontSize = '14px'
      끝.style.padding = '5px 9px'
      n++
    }
    return n + '줄'
  },
}

const 갈래 = [
  { key: 'ㄱ', 이름: '지금 그대로', 설명: '이름 두 줄 ＋ 배지가 둘째 줄 끝에 매달림', 손: [] },
  { key: 'ㄴ', 이름: '배지를 «이름 아래»로', 설명: '⭐제일 적게 바꾼다 — 이름이 온전히 흐르고 배지가 자기 줄을 갖는다', 손: ['배지아래로'] },
  { key: 'ㄷ', 이름: '「사러가기」를 «아래 줄»로', 설명: '이름이 폭을 다 쓴다 · ⚠️칸이 세로로 길어진다', 손: ['단추아래로'] },
  { key: 'ㄹ', 이름: 'ㄴ ＋ 「사러가기」 작게', 설명: '배지도 내리고 단추도 줄여 이름 폭을 최대로', 손: ['단추작게', '배지아래로'] },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

console.log('\n🛒 레시피 상세 「고른 재료」 — 시안 넷 (390×844)\n')
for (const g of 갈래) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4442/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  await p.getByRole('button', { name: /^레시피/ }).last().click()
  await p.waitForTimeout(800)
  await p.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first().click()
  await p.waitForTimeout(900)
  await p.evaluate(줄찾기심기)
  const 몇줄 = await p.evaluate(() => (window.__줄찾기() || []).length)
  if (!몇줄) { console.log(`  ${g.key} ⛔ 「고른 재료」 칸을 못 찾았다`); await ctx.close(); continue }

  const 한것 = []
  for (const 이름 of g.손) 한것.push(이름 + '=' + await p.evaluate(조각[이름]))
  await p.mouse.move(195, 500); await p.mouse.wheel(0, 760); await p.waitForTimeout(600)

  // 🔢 「이름이 몇 줄로 갈라지나」 — 이 판이 재는 값
  const 잰값 = await p.evaluate(() => {
    const 줄 = window.__줄찾기() || []
    return 줄.map((el) => {
      const 가운데 = [...el.children].find((c) => c.tagName === 'DIV')
      const 이름 = 가운데 && 가운데.children[0]
      if (!이름) return null
      const rg = document.createRange(); rg.selectNodeContents(이름)
      const tops = new Set([...rg.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top)))
      return { 글: (이름.innerText || '').slice(0, 16), 줄수: tops.size, 키: Math.round(el.getBoundingClientRect().height) }
    }).filter(Boolean)
  })
  const 파일 = join(OUT, g.key + '.png')
  await p.screenshot({ path: 파일 })
  const 갈린것 = 잰값.filter((x) => x.줄수 >= 2).length
  console.log(`  ${g.key} ${g.이름.padEnd(24, ' ')} 이름이 «갈린» 줄 ${갈린것}/${잰값.length} · 칸 키 ${잰값.map((x) => x.키).join('/')}px`)
  console.log(`     ${g.설명}`)
  if (한것.length) console.log(`     (${한것.join(' · ')})`)
  await ctx.close()
}

await b.close(); srv.close()
console.log('\n⭐ ⛔찍고 끝내지 말 것 — 보내기 «전»에 네 장을 «열어서» 본다(절대원칙 21).')

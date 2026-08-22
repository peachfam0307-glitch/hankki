// 🛒 [판정 대기 · 2026-08-22] 「주부의 장바구니」 윗글 정리 — 시안 다섯
//
// 📮 창업자 = *"장바구니 2줄도 예쁘게 정리해야할 것 같아."*
//    ＋ *"상세 주부의 장바구니랑 그아래 설명도 줄바꿈이상"* → *"시안보여줄래"*
//
// 🔢 지금 (390×844 · 글자3 뒤) — 제목 아래에 **문단 둘이 각각 두 줄 = 넉 줄**
//    ⓐ 소개  = 「써보고 좋은 건 꼭 나누는 18년차 주부의 · 첨가물 적은 건강 식재료 · 앞으로도 하나씩 계속 올라와요」
//    ⓑ 고지  = 「'사러가기'는 외부 쇼핑몰로 이어져요 · 한끼는 수수료를 받지 않아요 (나중에 제휴가 생겨도 …)」
//    ⭐ 둘 다 **가운뎃점(·)으로 «세 가지 말»을 이어 붙인 한 문단**이다. 그래서 빽빽하게 읽힌다.
//
// ⛔⛔ **고지(ⓑ)는 지울 수 없다** — `check-affiliate.mjs` 가 배포를 막고,
//    창업자가 콕 집은 이유가 있다: *"고지없이 수수료받는 줄.."* 로 읽힌다.
//    ✅ 그래서 «없애는» 갈래는 안 만든다. **무게를 낮추거나 · 갈라 놓거나** 둘 중 하나다.
//
// ⛔ 앱 소스는 «안» 고친다 — 진짜 화면의 DOM 을 그 자리에서 바꿔 찍는 판이다(절대원칙 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-장바구니줄-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/장바구니줄'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4441, r))

// ── 손보기 조각 — «함수»로 넘긴다(문자열로 넘기면 백틱 함정에 걸린다) ──
const 조각 = {
  // 💰 고지를 «작고 연하게» — 성격이 다르다. 소개는 «권하는 말», 고지는 «알리는 말».
  고지작게: () => {
    const 것 = [...document.querySelectorAll('.t-sub')].find((e) => /수수료를 받지 않아요/.test(e.innerText || ''))
    if (!것) return '못 찾음'
    것.style.fontSize = '13.5px'
    것.style.opacity = '0.72'
    것.style.marginTop = '2px'
    return '13.5px · 흐리게'
  },
  // ↩️ 소개의 가운뎃점을 «줄바꿈»으로 — 세 조각이 각자 한 줄을 갖는다
  소개갈라: () => {
    const 것 = [...document.querySelectorAll('.t-sub')].find((e) => /계속 올라와요/.test(e.innerText || ''))
    if (!것) return '못 찾음'
    것.innerHTML = 것.innerHTML.replace(/\s·\s/g, '<br>')
    return '가운뎃점 → 줄바꿈'
  },
  // 📄 제품 설명 한 줄 → 두 줄 (지금은 `WebkitLineClamp: 1`)
  설명두줄: () => {
    let n = 0
    for (const e of document.querySelectorAll('.t-sub')) {
      const cs = getComputedStyle(e)
      if (cs.webkitLineClamp === '1') { e.style.webkitLineClamp = '2'; n++ }
    }
    return n + '개 → 2줄'
  },
  // 🧊 고지를 «접는다» — 제목 줄 옆 물음표를 눌러야 보이게 (지금 자리엔 한 줄만)
  고지접기: () => {
    const 것 = [...document.querySelectorAll('.t-sub')].find((e) => /수수료를 받지 않아요/.test(e.innerText || ''))
    if (!것) return '못 찾음'
    것.innerHTML = '<span style="opacity:.72">한끼는 <b style="color:var(--brown)">수수료를 받지 않아요</b> · <span style="text-decoration:underline">자세히</span></span>'
    것.style.fontSize = '13.5px'
    return '한 줄로 접음'
  },
}

const 갈래 = [
  { key: 'ㄱ', 이름: '지금 그대로', 설명: '소개 2줄 ＋ 고지 2줄 = 넉 줄', 손: [] },
  { key: 'ㄴ', 이름: '고지를 «작고 연하게»', 설명: '⭐제일 적게 바꾼다 — 소개가 앞에 서고 고지는 한 발 물러선다', 손: ['고지작게'] },
  { key: 'ㄷ', 이름: 'ㄴ ＋ 소개를 «세 줄로 갈라»', 설명: '가운뎃점 → 줄바꿈. 세 가지 말이 각자 한 줄', 손: ['고지작게', '소개갈라'] },
  { key: 'ㄹ', 이름: 'ㄴ ＋ 제품 설명 «두 줄»', 설명: '설명이 1줄이라 「…어울려요.…」로 점이 넷처럼 보인다', 손: ['고지작게', '설명두줄'] },
  { key: 'ㅁ', 이름: '고지를 «한 줄로 접기» ＋ 설명 두 줄', 설명: '고지에서 괄호 설명을 빼고 「자세히」로. ⚠️게이트 확인 필요', 손: ['고지접기', '설명두줄'] },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

console.log('\n🛒 「주부의 장바구니」 윗글 — 시안 다섯 (390×844)\n')
for (const g of 갈래) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4441/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  await p.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('장보기'))?.click()
  })
  await p.waitForTimeout(800)

  const 한것 = []
  for (const 이름 of g.손) 한것.push(이름 + '=' + await p.evaluate(조각[이름]))
  await p.waitForTimeout(300)

  // 🔢 「제품 카드가 화면 위에서 몇 px 아래 있나」 — 윗글이 짧아질수록 제품이 빨리 보인다
  const 잰값 = await p.evaluate(() => {
    const 카드 = document.querySelector('.cur-card, [class*="cur-"]')
    const 찾기 = document.querySelector('.searchbar')
    return {
      찾기y: 찾기 ? Math.round(찾기.getBoundingClientRect().top) : null,
      카드y: 카드 ? Math.round(카드.getBoundingClientRect().top) : null,
    }
  })
  const 파일 = join(OUT, g.key + '.png')
  await p.screenshot({ path: 파일 })
  console.log(`  ${g.key} ${g.이름.padEnd(28, ' ')} 찾기칸 y=${String(잰값.찾기y).padStart(4)} · 제품카드 y=${String(잰값.카드y).padStart(4)}`)
  console.log(`     ${g.설명}`)
  if (한것.length) console.log(`     (${한것.join(' · ')})`)
  await ctx.close()
}

await b.close(); srv.close()
console.log('\n⭐ ⛔찍고 끝내지 말 것 — 보내기 «전»에 다섯 장을 «열어서» 본다(절대원칙 21).')
console.log('⛔ 「고지를 없애기」 갈래는 «만들지 않았다» — 게이트가 막고, 없으면 「말 안 하고 받는다」로 읽힌다.')

// 📸 「이달의 레꾸」 칸을 «어느 자리»에 놓을까 — 시안 찍기 (2026-09-13)
//   ⛔ 앱 소스를 안 건드린다. 화면에 «얹어서» 찍기만 한다(창업자가 고르면 그때 만든다).
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const 방 = process.env.OUT || '/tmp/claude-0/이달의레꾸'
mkdirSync(방, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = 4399
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1')
}, state)
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.waitForTimeout(1800)
for (let i = 0; i < 5; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
  if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
  else await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
}

// 🍱 칸을 만든다 — 앱 톤(크림 #FFFDF7 · 갈색 #5d3410)에 맞춘다
const 칸HTML = (제목) => `
<section data-shim="이달의레꾸" style="margin:14px 0 4px">
  <div style="display:flex;align-items:baseline;gap:8px;padding:0 16px 9px">
    <b style="font-size:17px;color:#5d3410;letter-spacing:-.3px">${제목}</b>
    <span style="font-size:12.5px;color:#a98a6b">10월 · 할로윈</span>
    <span style="margin-left:auto;font-size:12.5px;color:#c2703f;font-weight:700">더보기</span>
  </div>
  <div style="display:flex;gap:11px;overflow-x:auto;padding:2px 16px 4px;scrollbar-width:none">
    ${[['꼬미맘', '#ffe6c9', '🎃'], ['하루한끼', '#e7dcff', '👻'], ['뚝딱요리사', '#ffd9d4', '🦇']].map(([who, bg, e]) => `
      <div style="flex:0 0 118px">
        <div style="width:118px;height:148px;border-radius:15px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:44px;box-shadow:0 2px 8px rgba(93,52,16,.10)">${e}</div>
        <div style="margin-top:6px;font-size:12px;color:#7a5a3a;text-align:center;font-weight:600">@${who} 님</div>
      </div>`).join('')}
  </div>
</section>`

const 얹기 = async (자리, 제목) => {
  await p.evaluate(({ 자리, html }) => {
    document.querySelectorAll('[data-shim="이달의레꾸"]').forEach((n) => n.remove())
    const wrap = document.createElement('div')
    wrap.innerHTML = html
    const node = wrap.firstElementChild
    // ⛔ 상단바(로고·검색·설정) «위»에 얹으면 안 된다 — 그 아래 첫 칸부터가 내용이다.
    //    그래서 «한끼 소식» 카드를 기준으로 앞/뒤에 넣는다.
    // 🔎 «글자»로 기준 칸을 찾는다 — 화면마다 구조가 달라서 자리 번호로는 못 잡는다.
    // ⭐ 글자를 «가진 제일 안쪽» 칸을 찾고, 거기서 «형제로 설 수 있는 데»까지 올라간다.
    //    ⛔ 안 올라가면 그 카드 «안»에 들어가 버린다(첫 판이 그랬다).
    const 속칸 = (re) => [...document.querySelectorAll('section,div,h2,h3,p')]
      .filter((n) => re.test(n.textContent || ''))
      .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0]
    const 바깥까지 = (n) => {
      let c = n
      while (c && c.parentElement && c.parentElement !== document.body) {
        const r = c.getBoundingClientRect()
        if (r.width > 300) return c            // 화면 폭에 가까우면 «칸»이다
        c = c.parentElement
      }
      return c
    }
    const 씨 = 자리 === 'top' ? 속칸(/한끼 소식|자랑할 레시피/) : 속칸(/이번 주 제철/)
    const 기준 = 씨 ? 바깥까지(씨) : null
    if (기준 && 기준.parentElement) {
      if (자리 === 'top') 기준.parentElement.insertBefore(node, 기준)
      else 기준.parentElement.insertBefore(node, 기준.nextElementSibling)
      node.scrollIntoView({ block: 'center' })
    } else {
      console.log('⚠️ 기준 칸을 못 찾았다 —', 자리)
    }
  }, { 자리, html: 칸HTML(제목) })
  await p.waitForTimeout(400)
}

// ⓐ 홈 맨 위
await 얹기('top', '이달의 레꾸')
await p.screenshot({ path: `${방}/a-홈맨위.png` })
// ⓑ 홈 가운데(주간 레시피 아래쯤)
await 얹기('mid', '이달의 레꾸')
await p.screenshot({ path: `${방}/b-홈가운데.png` })

// ⓒ 레꾸자랑 탭 맨 위
await p.evaluate(() => { document.querySelectorAll('[data-shim="이달의레꾸"]').forEach((n) => n.remove()) })
const 탭 = p.getByRole('button', { name: /레꾸자랑/ }).first()
if (await 탭.count()) { await 탭.click().catch(() => {}); await p.waitForTimeout(1200) }
await 얹기('top', '이달의 레꾸')
await p.screenshot({ path: `${방}/c-레꾸자랑탭.png` })

await b.close(); srv.kill()
console.log('📸 찍었다 →', 방)

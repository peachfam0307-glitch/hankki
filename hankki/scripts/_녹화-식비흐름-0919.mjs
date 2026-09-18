// 🎥💰 「직접 해보는」 녹화 — 레시피 → 장보기 → 식비 → 냉장고 (2026-09-19)
//
// 📮 창업자 2026-09-18 = *"사진만 죽~~보여주는 느낌이야 / 나는 직접해보는 흐름을 원했는데.. 내가 봐도 뭔지 모르겟어"*
//   · *"군더더기 빼고 딱 중요한 흐름만 보여준다."*
//   · *"보여주고자 하는거에 효과나 동그라미나 커서나 이런걸 넣었으면 좋겠어"*  ← 이 판에서 넣은 것
//
// ⛔⛔ 앞 판(_릴스-식비소개-0919)이 왜 반려됐나 — 스스로 적어 둔다:
//   ⒜ «잘라낸 조각»이라 어느 화면인지 모른다 — 맥락이 잘려 나갔다
//   ⒝ 13장면을 1~2초씩 넘겨 «정신없다» — 장면 전환이 내용보다 많았다
//   ⒞ 정지 사진이라 «해보는 느낌»이 아니다 — 「오 편하겠는데」는 «한 번 눌러서 저기로 가는 걸» 볼 때 난다
//
// ✅ 그래서 = 앱을 «진짜 조작해서 녹화»한다. 화면은 통째로 둔다(맥락 유지).
//   👆 커서(동그란 손끝) · 💥 누른 자리 파동 · ⭕ 보여줄 것에 노란 동그라미 — 셋을 화면에 «그려» 넣는다.
//      ⛔ Playwright 의 진짜 마우스는 영상에 «안 찍힌다». 그래서 DOM 으로 그린다.
//
// 쓰는 법: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_녹화-식비흐름-0919.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync, readdirSync, renameSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4613, r))
const 밖 = process.env.OUT || '/tmp/claude-0/녹화-식비흐름'
rmSync(밖, { recursive: true, force: true }); mkdirSync(밖, { recursive: true })

// ⛔ 날짜를 여기서 «만들지» 않는다(절대원칙 27) — todayKST() 에서 ±n일만 옮긴다.
const { todayKST } = await import('../src/today.js')
const 주첫 = (() => { const d = new Date(todayKST() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.toISOString().slice(0, 10) })()
const 며칠 = (n) => { const d = new Date(주첫 + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 씨 = [
  { d: 며칠(0), k: 'shop', won: 38400, memo: '쿠팡' },
  { d: 며칠(1), k: 'out', won: 15000, memo: '배민 치킨' },
  { d: 며칠(2), k: 'shop', won: 12700, memo: '자연드림' },
  { d: 며칠(3), k: 'out', won: 9500, memo: '쿠팡이츠 국밥' },
  { d: 며칠(4), k: 'shop', won: 26800, memo: '컬리' },
  { d: 며칠(-6), k: 'shop', won: 41000, memo: '이마트몰' },
  { d: 며칠(-4), k: 'out', won: 21000, memo: '분식' },
  { d: 며칠(-9), k: 'shop', won: 33000, memo: '한살림' },
]

// 👆⭕💥 「연출」 — 커서 · 파동 · 동그라미. 창업자 2026-09-18 요구 그대로.
//   ⛔ 앱 코드는 한 글자도 안 건드린다 — 녹화할 때만 페이지에 얹는다.
const 연출 = `
  (() => {
    const 칠 = () => {
      if (document.getElementById('연출칠')) return
      const s = document.createElement('style'); s.id = '연출칠'
      s.textContent = [
        '#연출커서{position:fixed;z-index:2147483646;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;',
        'background:rgba(255,255,255,.34);border:2.5px solid rgba(60,60,60,.55);box-shadow:0 3px 10px rgba(0,0,0,.28),inset 0 0 0 5px rgba(255,255,255,.55);',
        'pointer-events:none;opacity:0;transition:left .42s cubic-bezier(.4,0,.2,1),top .42s cubic-bezier(.4,0,.2,1),opacity .25s}',
        '.연출파동{position:fixed;z-index:2147483647;width:78px;height:78px;margin:-39px 0 0 -39px;border-radius:50%;',
        'background:rgba(74,111,165,.28);border:3px solid rgba(74,111,165,.8);pointer-events:none;animation:연출파 .62s ease-out forwards}',
        '@keyframes 연출파{0%{transform:scale(.3);opacity:.95}100%{transform:scale(1.5);opacity:0}}',
        '.연출고리{position:fixed;z-index:2147483645;border:4px solid #F5B301;border-radius:18px;pointer-events:none;',
        'box-shadow:0 0 0 3px rgba(245,179,1,.22),0 0 18px rgba(245,179,1,.55);animation:연출콩 1.1s ease-in-out infinite}',
        '@keyframes 연출콩{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.035);opacity:.72}}',
      ].join('')
      document.head.appendChild(s)
    }
    const 커서 = () => {
      칠()
      let c = document.getElementById('연출커서')
      if (!c) { c = document.createElement('div'); c.id = '연출커서'; document.body.appendChild(c) }
      return c
    }
    window.__커서 = (x, y) => { const c = 커서(); c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.opacity = '1' }
    window.__커서끄기 = () => { const c = document.getElementById('연출커서'); if (c) c.style.opacity = '0' }
    window.__파동 = (x, y) => {
      칠(); const d = document.createElement('div'); d.className = '연출파동'
      d.style.left = x + 'px'; d.style.top = y + 'px'
      document.body.appendChild(d); setTimeout(() => d.remove(), 720)
    }
    window.__고리 = (x, y, w, h, 여백) => {
      칠(); window.__고리지움()
      const 여 = 여백 == null ? 6 : 여백
      const d = document.createElement('div'); d.className = '연출고리'; d.id = '연출고리'
      d.style.left = (x - 여) + 'px'; d.style.top = (y - 여) + 'px'
      d.style.width = (w + 여 * 2) + 'px'; d.style.height = (h + 여 * 2) + 'px'
      document.body.appendChild(d)
    }
    window.__고리지움 = () => { const o = document.getElementById('연출고리'); if (o) o.remove() }
    document.addEventListener('pointerdown', (e) => window.__파동(e.clientX, e.clientY), true)
  })()
`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
let 저장본 = null
let 장번호 = 0

async function 장면(이름, 하기, { 씨뿌리기 = false } = {}) {
  장번호++
  const 딱지 = String(장번호).padStart(2, '0') + '-' + 이름
  const 방 = join(밖, 딱지)
  mkdirSync(방, { recursive: true })
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR',
    storageState: 저장본 || undefined,
    recordVideo: { dir: 방, size: { width: 780, height: 1688 } },
  })
  // ⛔ 코치마크는 접두어(hankki:coach)로 통째로 막는다 — 안 그러면 녹화 내내 안내창이 덮는다
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      const _get = Storage.prototype.getItem
      Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
    } catch { /* noop */ }
  })
  await ctx.addInitScript(연출)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4613/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2300)
  await 안내치우기(p)
  if (씨뿌리기) {
    // ⛔ 씨앗은 «앱이 한 번 저장한 뒤»에 심는다 — load() 는 recipes 배열이 없으면 저장본을 통째로 버린다(store.jsx:145)
    const 심음 = await p.evaluate((줄들) => {
      try {
        const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
        if (!s || !Array.isArray(s.recipes)) return '아직 저장 전'
        s.foodCost = [...(s.foodCost || []), ...줄들.map((e, i) => ({ id: 'seed' + i, ...e }))]
        localStorage.setItem('hankki:v1', JSON.stringify(s))
        return '심었다 ' + s.foodCost.length + '줄'
      } catch (e) { return '⛔ ' + e.message }
    }, 씨)
    console.log('     🌱', 심음)
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 안내치우기(p)
  }
  await p.waitForTimeout(400)
  try { await 하기(p) } catch (e) { console.log('     ⚠️', 이름, '중간에 멈췄다 —', e.message.split('\n')[0]) }
  await p.waitForTimeout(1000)
  저장본 = await ctx.storageState()
  await ctx.close()
  const f = readdirSync(방).find((x) => x.endsWith('.webm'))
  if (f) { renameSync(join(방, f), join(밖, 딱지 + '.webm')); rmSync(방, { recursive: true, force: true }) }
  console.log('  🎥', 딱지)
}

async function 안내치우기(p) {
  for (let i = 0; i < 10; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(300) } catch { break }
  }
}

// 👆 커서를 그 자리로 «옮긴다» — 옮기는 0.42초가 보여야 「손이 갔다」가 읽힌다
const 손 = async (p, 것) => {
  await 것.scrollIntoViewIfNeeded().catch(() => {})
  await p.waitForTimeout(260)
  const r = await 것.boundingBox()
  if (!r) return null
  await p.evaluate(([x, y]) => window.__커서(x, y), [r.x + r.width / 2, r.y + r.height / 2])
  await p.waitForTimeout(520)
  return r
}
// ⭕ 보여줄 것에 노란 동그라미 — 창업자 *"보여주고자 하는거에 효과나 동그라미나"*
const 동그라미 = async (p, 것, { 여백 = 6, 머묾 = 1400 } = {}) => {
  const 대상 = typeof 것 === 'string' ? p.locator(것).first() : 것
  if (await 대상.count() === 0) { console.log('     ⚠️ 동그라미 못 그림 —', String(것)); return }
  await 대상.scrollIntoViewIfNeeded().catch(() => {})
  await p.waitForTimeout(300)
  const r = await 대상.boundingBox()
  if (!r) return
  await p.evaluate(([x, y, w, h, 여]) => window.__고리(x, y, w, h, 여), [r.x, r.y, r.width, r.height, 여백])
  await p.waitForTimeout(머묾)
}
const 동그라미지움 = (p) => p.evaluate(() => window.__고리지움())
// 🐢 사람이 누르는 속도로 — 너무 빠르면 「무슨 일이 났는지」 안 보인다
const 눌러 = async (p, 것, 쉼 = 950) => {
  const 대상 = typeof 것 === 'string' ? p.locator(것).first() : 것
  if (await 대상.count() === 0) { console.log('     ⚠️ 못 찾음 —', String(것)); return false }
  await 손(p, 대상)
  await 대상.click({ force: true })
  await p.waitForTimeout(쉼)
  return true
}
const 탭 = (p, 글) => p.locator('.bottom-nav .nav-item').filter({ hasText: 글 }).first()
const 칸 = (p, 글) => p.locator('.segment .seg').filter({ hasText: 글 }).first()

// ════════ ① 레시피에서 «필요한 재료만» 골라 담는다 ════════
await 장면('①레시피-골라담기', async (p) => {
  await 눌러(p, 탭(p, '레시피'), 1100)
  await 눌러(p, p.locator('text=어남선생 두부조림').first(), 1600)
  await 안내치우기(p)
  await p.locator('.ing').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(800)
  // ☑️ 체크가 «하나씩 켜지는» 걸 보여준다 — 이게 「필요한 것만 고른다」의 전부다
  for (const 이름 of ['두부', '양파', '대파']) {
    const 줄 = p.locator('.ing').filter({ hasText: 이름 }).first()
    if (await 줄.count()) await 눌러(p, 줄, 680)
  }
  await p.waitForTimeout(500)
  // ⛔ 단추 이름은 «고른 개수»로 바뀐다(「3개 담기」) — 글자로 찾으면 못 찾는다. data-coach 로 잡는다.
  const 담기 = p.locator('[data-coach="shop"]').first()
  await 동그라미(p, 담기, { 여백: 8, 머묾: 1200 })
  await 눌러(p, 담기, 1800)
  await 동그라미지움(p)
})

// ════════ ② 장보기 — 담긴 재료에 «금액만» 적으면 끝 ════════
await 장면('②장보기-금액적기', async (p) => {
  await 눌러(p, 탭(p, '장보기'), 1500)
  await 동그라미(p, '.shop-list', { 여백: 6, 머묾: 1500 })
  await 동그라미지움(p)
  // ＋ 금액 칸 — 레시피에서 담은 재료는 금액이 비어 있다(창업자 *"그런 가격은 다시입력해야하긴해"*)
  const 금액칸 = p.locator('button[aria-label*="금액 적기"]').first()
  if (await 눌러(p, 금액칸, 1000)) {
    const 시트칸 = p.locator('input[type="text"], input[inputmode="numeric"]').last()
    if (await 시트칸.count()) {
      await 손(p, 시트칸)
      for (const 글 of ['1', '19', '191', '1910']) { await 시트칸.fill(글); await p.waitForTimeout(280) }
      await p.waitForTimeout(700)
      await p.keyboard.press('Enter').catch(() => {})
      await p.waitForTimeout(1200)
    }
    await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(700)
  }
  // 🧾 합계 상자 = 「담은 것 합계 ＋ 식비에 넣기」 — 여기가 장보기와 식비의 이음매다
  await 동그라미(p, '.sum-box', { 여백: 8, 머묾: 1900 })
  await 동그라미지움(p)
})

// ════════ ③ 배달·외식도 «여기서 바로» ════════
await 장면('③식비-배달외식', async (p) => {
  await 눌러(p, 탭(p, '장보기'), 900)
  await 눌러(p, 칸(p, '식비'), 1300)
  const 적기 = p.locator('button:has-text("외식·배달 적기")').first()
  await 눌러(p, 적기, 1200)
  // 🔘 알약 둘 = 장보기 / 외식·배달
  await 동그라미(p, '.fc-seg', { 여백: 6, 머묾: 1400 })
  await 눌러(p, p.locator('.fc-seg button:has-text("외식·배달")').first(), 800)
  // 🏪 「가서 보고 올까요?」 = 자주 가는 가게들 — 눌러서 보고 와서 적는다
  await 동그라미(p, '.fc-shops', { 여백: 6, 머묾: 1800 })
  await 동그라미지움(p)
  for (const 키 of ['1', '5', '000']) await 눌러(p, p.locator('.fc-key').filter({ hasText: new RegExp('^' + 키 + '$') }).first(), 420)
  await p.waitForTimeout(600)
  await 눌러(p, p.locator('.fc-save').first(), 1600)
})

// ════════ ④ 예산을 정하면 «남은 돈»이 보인다 ════════
await 장면('④식비-예산', async (p) => {
  await 눌러(p, 탭(p, '장보기'), 900)
  await 눌러(p, 칸(p, '식비'), 1300)
  const 예산단추 = p.locator('.fc-bud-new, button:has-text("· 고치기")').first()
  await 눌러(p, 예산단추, 1100)
  const 예산칸 = p.locator('.fc-key').filter({ hasText: /^2$/ }).first()
  if (await 예산칸.count()) {
    for (const 키 of ['2', '0', '0', '000']) await 눌러(p, p.locator('.fc-key').filter({ hasText: new RegExp('^' + 키 + '$') }).first(), 380)
    await p.waitForTimeout(500)
    await 눌러(p, p.locator('.fc-save, button:has-text("정했어요")').first(), 1600)
  } else { await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(600) }
  // 💰 「N원 남았어요」 — 장 보면서 «얼마 남았지»를 본다
  await 동그라미(p, '.fc-big', { 여백: 8, 머묾: 2000 })
  await 동그라미지움(p)
}, { 씨뿌리기: true })

// ════════ ⑤ 주별 · 달별로 한눈에 ════════
await 장면('⑤식비-주별달별', async (p) => {
  await 눌러(p, 탭(p, '장보기'), 900)
  await 눌러(p, 칸(p, '식비'), 1300)
  await 동그라미(p, '.fc-ratio', { 여백: 6, 머묾: 1500 })
  await 동그라미지움(p)
  await 눌러(p, p.locator('.fc-scale button').filter({ hasText: '달별' }).first(), 1300)
  await 동그라미(p, '.fc-two', { 여백: 6, 머묾: 1800 })
  await 동그라미지움(p)
  await p.locator('.fc-card').first().scrollIntoViewIfNeeded().catch(() => {})
  await p.waitForTimeout(1400)
})

// ════════ ⑥ 체크하면 냉장고로 · 그 재료로 만들 요리까지 ════════
await 장면('⑥냉장고-만들요리', async (p) => {
  await 눌러(p, 탭(p, '장보기'), 1100)
  const 체크 = p.locator('.check-box').first()
  await 눌러(p, 체크, 1200)
  // 🧊 토스트 = 「샀어요! 냉장고에 넣어뒀어요」 (ShopScreen.jsx:214)
  await 동그라미(p, '.toast', { 여백: 8, 머묾: 1400 })
  await 동그라미지움(p)
  await 눌러(p, 칸(p, '냉장고'), 1500)
  await 안내치우기(p)
  await 동그라미(p, '.hscroll', { 여백: 6, 머묾: 2000 })
  await 동그라미지움(p)
})

await b.close(); srv.close()
console.log('✅ 녹화 끝 →', 밖)

// 🎥💰 「직접 해보는」 녹화 — 레시피 → 장보기 → 식비 → 냉장고 (2026-09-19)
//
// 📮 창업자 2026-09-18 = *"사진만 죽~~보여주는 느낌이야 / 나는 직접해보는 흐름을 원했는데"*
//   ＋ *"보여주고자 하는거에 효과나 동그라미나 커서나 이런걸 넣었으면"*
//   ＋ **2차 되먹임** = *"중간중간 홈으로 왔다갔다 쓸데없는 장면이 많아. 그리고 너무 느려...
//      금액적거나 하는 건 좀 빠르게 넘어가고"*
//
// ⛔ 「홈 왔다갔다」의 뿌리 = 녹화는 **context 를 만드는 순간** 시작된다. 그래서 앱이 켜지는 것도,
//    홈에서 그 탭까지 가는 길도 다 찍힌다. 눈대중으로 「앞 3초」 자르던 게 이 화근이었다.
//    ✅ 그래서 장면을 «준비»와 «보여줄 것» 둘로 갈랐다. 준비가 끝난 «그 시각»을 스스로 적어
//       `자를곳.json` 에 남기고, 편집이 딱 거기서부터 쓴다. 홈은 한 칸도 안 남는다.
//
// 🐢→🐇 속도 = 누르는 쉼 480ms · 커서 옮김 300ms · 동그라미 900ms · 금액 타자 110ms.
//
// 쓰는 법: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_녹화-식비흐름-0919.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
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

// 👆⭕💥 「연출」 — 커서 · 파동 · 동그라미. ⛔ 앱 코드는 한 글자도 안 건드린다.
const 연출 = `
  (() => {
    const 칠 = () => {
      if (document.getElementById('연출칠')) return
      const s = document.createElement('style'); s.id = '연출칠'
      s.textContent = [
        '#연출커서{position:fixed;z-index:2147483646;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;',
        'background:rgba(255,255,255,.34);border:2.5px solid rgba(60,60,60,.55);box-shadow:0 3px 10px rgba(0,0,0,.28),inset 0 0 0 5px rgba(255,255,255,.55);',
        'pointer-events:none;opacity:0;transition:left .28s cubic-bezier(.4,0,.2,1),top .28s cubic-bezier(.4,0,.2,1),opacity .18s}',
        '.연출파동{position:fixed;z-index:2147483647;width:78px;height:78px;margin:-39px 0 0 -39px;border-radius:50%;',
        'background:rgba(74,111,165,.28);border:3px solid rgba(74,111,165,.8);pointer-events:none;animation:연출파 .5s ease-out forwards}',
        '@keyframes 연출파{0%{transform:scale(.3);opacity:.95}100%{transform:scale(1.5);opacity:0}}',
        '.연출고리{position:fixed;z-index:2147483645;border:4px solid #F5B301;border-radius:18px;pointer-events:none;',
        'box-shadow:0 0 0 3px rgba(245,179,1,.22),0 0 18px rgba(245,179,1,.55);animation:연출콩 .9s ease-in-out infinite}',
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
    window.__파동 = (x, y) => {
      칠(); const d = document.createElement('div'); d.className = '연출파동'
      d.style.left = x + 'px'; d.style.top = y + 'px'
      document.body.appendChild(d); setTimeout(() => d.remove(), 600)
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
const 자를곳 = []   // 📝 편집이 읽을 「어디부터 쓸지」 표 — 눈대중 금지

async function 안내치우기(p) {
  for (let i = 0; i < 10; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(250) } catch { break }
  }
}

// 🎬 장면 = 「준비(안 쓴다)」 ＋ 「보여줄 것(쓴다)」
async function 장면(이름, 준비, 하기, { 씨뿌리기 = false } = {}) {
  장번호++
  const 딱지 = String(장번호).padStart(2, '0') + '-' + 이름
  const 방 = join(밖, 딱지)
  mkdirSync(방, { recursive: true })
  const 켠때 = Date.now()   // ⏱ 여기가 영상의 0초다
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
  await p.waitForTimeout(2000)
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
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1700); await 안내치우기(p)
  }
  // 🚪 준비 = 홈에서 보여줄 자리까지 가는 길. ⛔ 릴스엔 «안 들어간다»
  if (준비) { try { await 준비(p) } catch (e) { console.log('     ⚠️ 준비 중 —', e.message.split('\n')[0]) } }
  await p.waitForTimeout(200)
  const 자를초 = (Date.now() - 켠때) / 1000
  try { await 하기(p) } catch (e) { console.log('     ⚠️', 이름, '중간에 멈췄다 —', e.message.split('\n')[0]) }
  await p.waitForTimeout(600)
  저장본 = await ctx.storageState()
  await ctx.close()
  const f = readdirSync(방).find((x) => x.endsWith('.webm'))
  if (f) { renameSync(join(방, f), join(밖, 딱지 + '.webm')); rmSync(방, { recursive: true, force: true }) }
  자를곳.push({ 파일: 딱지 + '.webm', 자를초: Math.round(자를초 * 100) / 100 })
  console.log('  🎥', 딱지, '· 앞', 자를초.toFixed(1) + '초 = 준비(잘라낸다)')
}

// 👆 커서를 그 자리로 옮긴다
const 손 = async (p, 것) => {
  await 것.scrollIntoViewIfNeeded().catch(() => {})
  await p.waitForTimeout(140)
  const r = await 것.boundingBox()
  if (!r) return null
  await p.evaluate(([x, y]) => window.__커서(x, y), [r.x + r.width / 2, r.y + r.height / 2])
  await p.waitForTimeout(300)
  return r
}
// ⭕ 보여줄 것에 노란 동그라미
const 동그라미 = async (p, 것, { 여백 = 6, 머묾 = 900 } = {}) => {
  const 대상 = typeof 것 === 'string' ? p.locator(것).first() : 것
  if (await 대상.count() === 0) { console.log('     ⚠️ 동그라미 못 그림 —', String(것)); return }
  await 대상.scrollIntoViewIfNeeded().catch(() => {})
  await p.waitForTimeout(200)
  const r = await 대상.boundingBox()
  if (!r) return
  await p.evaluate(([x, y, w, h, 여]) => window.__고리(x, y, w, h, 여), [r.x, r.y, r.width, r.height, 여백])
  await p.waitForTimeout(머묾)
}
const 동그라미지움 = (p) => p.evaluate(() => window.__고리지움())
const 눌러 = async (p, 것, 쉼 = 480) => {
  const 대상 = typeof 것 === 'string' ? p.locator(것).first() : 것
  if (await 대상.count() === 0) { console.log('     ⚠️ 못 찾음 —', String(것)); return false }
  await 손(p, 대상)
  await 대상.click({ force: true })
  await p.waitForTimeout(쉼)
  return true
}
// 🤫 준비용 = 커서도 파동도 없이 «조용히» 간다 (어차피 잘려 나가므로 시간만 먹는다)
const 그냥눌러 = async (p, 것, 쉼 = 700) => {
  const 대상 = typeof 것 === 'string' ? p.locator(것).first() : 것
  if (await 대상.count() === 0) return false
  await 대상.click({ force: true }); await p.waitForTimeout(쉼); return true
}
const 탭 = (p, 글) => p.locator('.bottom-nav .nav-item').filter({ hasText: 글 }).first()
const 칸 = (p, 글) => p.locator('.segment .seg').filter({ hasText: 글 }).first()

// ════════ ① 레시피에서 «필요한 재료만» 골라 담는다 ════════
await 장면('①레시피-골라담기',
  async (p) => {   // 준비 = 레시피 상세까지 «조용히» 간다
    await 그냥눌러(p, 탭(p, '레시피'), 900)
    await 그냥눌러(p, p.locator('text=어남선생 두부조림').first(), 1300)
    await 안내치우기(p)
    await p.locator('.ing').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(500)
  },
  async (p) => {
    // ☑️ 체크가 «하나씩 켜지는» 걸 보여준다 — 이게 「필요한 것만 고른다」의 전부다
    for (const 이름 of ['두부', '양파', '대파']) {
      const 줄 = p.locator('.ing').filter({ hasText: 이름 }).first()
      if (await 줄.count()) await 눌러(p, 줄, 380)
    }
    // ⛔ 단추 이름은 «고른 개수»로 바뀐다(「3개 담기」) — data-coach 로 잡는다
    const 담기 = p.locator('[data-coach="shop"]').first()
    await 동그라미(p, 담기, { 여백: 8, 머묾: 700 })
    await 눌러(p, 담기, 1400)
    await 동그라미지움(p)
  })

// ════════ ② 장보기 — 담긴 재료에 «금액만» 적으면 끝 ════════
await 장면('②장보기-금액적기',
  async (p) => { await 그냥눌러(p, 탭(p, '장보기'), 900) },
  async (p) => {
    await 동그라미(p, '.shop-list', { 여백: 6, 머묾: 900 })
    await 동그라미지움(p)
    // ＋ 금액 칸 — 레시피에서 담은 재료는 금액이 비어 있다
    const 금액칸 = p.locator('button[aria-label*="금액 적기"]').first()
    if (await 눌러(p, 금액칸, 600)) {
      const 시트칸 = p.locator('input[type="text"], input[inputmode="numeric"]').last()
      if (await 시트칸.count()) {
        await 손(p, 시트칸)
        // 🐇 금액 타자는 «빠르게» — 창업자 *"금액적거나 하는 건 좀 빠르게 넘어가고"*
        for (const 글 of ['1', '19', '191', '1910']) { await 시트칸.fill(글); await p.waitForTimeout(110) }
        await p.waitForTimeout(350)
        await p.keyboard.press('Enter').catch(() => {})
        await p.waitForTimeout(800)
      }
      await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(400)
    }
    // 🧾 합계 상자 = 「담은 것 합계 ＋ 식비에 넣기」 — 장보기와 식비의 이음매
    await 동그라미(p, '.sum-box', { 여백: 8, 머묾: 1300 })
    await 동그라미지움(p)
  })

// ════════ ③ 배달·외식도 «여기서 바로» ════════
await 장면('③식비-배달외식',
  async (p) => {
    await 그냥눌러(p, 탭(p, '장보기'), 700)
    await 그냥눌러(p, 칸(p, '식비'), 900)
  },
  async (p) => {
    await 눌러(p, p.locator('button:has-text("외식·배달 적기")').first(), 800)
    await 동그라미(p, '.fc-seg', { 여백: 6, 머묾: 800 })
    await 눌러(p, p.locator('.fc-seg button:has-text("외식·배달")').first(), 450)
    // 🏪 「가서 보고 올까요?」 = 자주 가는 가게들
    await 동그라미(p, '.fc-shops', { 여백: 6, 머묾: 1200 })
    await 동그라미지움(p)
    for (const 키 of ['1', '5', '000']) await 눌러(p, p.locator('.fc-key').filter({ hasText: new RegExp('^' + 키 + '$') }).first(), 240)
    await p.waitForTimeout(300)
    await 눌러(p, p.locator('.fc-save').first(), 1200)
  })

// ════════ ④ 예산을 정하면 «남은 돈»이 보인다 ════════
await 장면('④식비-예산',
  async (p) => {
    await 그냥눌러(p, 탭(p, '장보기'), 700)
    await 그냥눌러(p, 칸(p, '식비'), 900)
  },
  async (p) => {
    await 눌러(p, p.locator('.fc-bud-new, button:has-text("· 고치기")').first(), 700)
    if (await p.locator('.fc-key').first().count()) {
      for (const 키 of ['2', '0', '0', '000']) await 눌러(p, p.locator('.fc-key').filter({ hasText: new RegExp('^' + 키 + '$') }).first(), 220)
      await p.waitForTimeout(300)
      await 눌러(p, p.locator('.fc-save, button:has-text("정했어요")').first(), 1200)
    } else { await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(400) }
    // 💰 「N원 남았어요」
    await 동그라미(p, '.fc-big', { 여백: 8, 머묾: 1400 })
    await 동그라미지움(p)
  }, { 씨뿌리기: true })

// ════════ ⑤ 주별 · 달별로 한눈에 ════════
await 장면('⑤식비-주별달별',
  async (p) => {
    await 그냥눌러(p, 탭(p, '장보기'), 700)
    await 그냥눌러(p, 칸(p, '식비'), 900)
  },
  async (p) => {
    await 동그라미(p, '.fc-ratio', { 여백: 6, 머묾: 900 })
    await 동그라미지움(p)
    await 눌러(p, p.locator('.fc-scale button').filter({ hasText: '달별' }).first(), 900)
    await 동그라미(p, '.fc-two', { 여백: 6, 머묾: 1200 })
    await 동그라미지움(p)
    await p.locator('.fc-card').first().scrollIntoViewIfNeeded().catch(() => {})
    await p.waitForTimeout(900)
  })

// ════════ ⑥ 체크하면 냉장고로 · 그 재료로 만들 요리까지 ════════
await 장면('⑥냉장고-만들요리',
  async (p) => { await 그냥눌러(p, 탭(p, '장보기'), 900) },
  async (p) => {
    await 눌러(p, p.locator('.check-box').first(), 700)
    // 🧊 토스트 = 「샀어요! 냉장고에 넣어뒀어요」 (ShopScreen.jsx:214)
    await 동그라미(p, '.toast', { 여백: 8, 머묾: 900 })
    await 동그라미지움(p)
    await 눌러(p, 칸(p, '냉장고'), 1000)
    await 안내치우기(p)
    await 동그라미(p, '.hscroll', { 여백: 6, 머묾: 1400 })
    await 동그라미지움(p)
  })

writeFileSync(join(밖, '자를곳.json'), JSON.stringify(자를곳, null, 2))
await b.close(); srv.close()
console.log('✅ 녹화 끝 →', 밖, '· 자를곳.json 에 「어디부터 쓸지」 적어 뒀다')

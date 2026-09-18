// 🎥💰 「직접 해보는」 녹화 — 레시피 → 장보기 → 식비 → 냉장고 (2026-09-19)
//
// 📮 창업자 2026-09-18 = *"사진만 죽~~보여주는 느낌이야 / 나는 직접해보는 흐름을 원했는데.. 내가 봐도 뭔지 모르겟어"*
//   · *"그것도 사진다 다 잘라놔서 뭐가 뭔지 하나도 모르겠는 느낌"*
//   · *"너가 유저라면 어떤 화면을 보고싶을지. 릴스를 보면서 오 편하겠는데/ 라는 생각이 들게"*
//
// ⛔⛔ 앞 판(_릴스-식비소개-0919)이 왜 실패했나 — 스스로 적어 둔다:
//   ⒜ «잘라낸 조각»이라 어느 화면인지 모른다 — 맥락이 잘려 나갔다
//   ⒝ 13장면을 1~2초씩 넘겨 «정신없다» — 장면 전환이 내용보다 많았다
//   ⒞ 정지 사진이라 «해보는 느낌»이 아니다 — 유저가 「오 편하겠는데」 하는 건
//      예쁜 화면을 볼 때가 아니라 «한 번 눌러서 저기로 가는 걸» 볼 때다
//
// ✅ 그래서 = 앱을 «진짜 조작해서 녹화»한다. 누르는 자리엔 파동을 띄워 손가락이 보이게.
//   ⭐ 화면은 통째로 둔다(맥락 유지). 자막은 나중에 배경 판 위에 얹는다.
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_녹화-식비흐름-0919.mjs
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
const { todayKST } = await import('../src/today.js')
const 며칠 = (n) => { const d = new Date(주첫 + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 주첫 = (() => { const d = new Date(todayKST() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.toISOString().slice(0, 10) })()

// 👆 누르는 자리에 파동 — 「손가락이 눌렀다」가 보여야 «해보는 느낌»이 난다
const 파동 = `
  (() => {
    const 넣기 = () => {
      if (document.getElementById('탭칠')) return
      const s = document.createElement('style'); s.id = '탭칠'
      s.textContent = '.탭파동{position:fixed;z-index:2147483647;width:76px;height:76px;margin:-38px 0 0 -38px;border-radius:50%;' +
        'background:rgba(74,111,165,.30);border:3px solid rgba(74,111,165,.75);pointer-events:none;animation:탭파 .62s ease-out forwards}' +
        '@keyframes 탭파{0%{transform:scale(.35);opacity:.95}100%{transform:scale(1.45);opacity:0}}'
      document.head.appendChild(s)
    }
    const 그리기 = (x, y) => {
      넣기()
      const d = document.createElement('div'); d.className = '탭파동'
      d.style.left = x + 'px'; d.style.top = y + 'px'
      document.body.appendChild(d); setTimeout(() => d.remove(), 700)
    }
    window.__탭 = 그리기
    document.addEventListener('pointerdown', (e) => 그리기(e.clientX, e.clientY), true)
  })()
`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
let 저장본 = null
let 장번호 = 0

// 🎬 한 장면 = 「한 번 누른다 → 그 결과가 같은 화면에서 바뀐다」
async function 장면(이름, 하기, { 준비 } = {}) {
  장번호++
  const 방 = join(밖, String(장번호).padStart(2, '0') + '-' + 이름)
  mkdirSync(방, { recursive: true })
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR',
    storageState: 저장본 || undefined,
    recordVideo: { dir: 방, size: { width: 780, height: 1688 } },
  })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      const _get = Storage.prototype.getItem
      Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
    } catch { /* noop */ }
  })
  await ctx.addInitScript(파동)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4613/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2200)
  for (let i = 0; i < 10; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(300) } catch { break }
  }
  if (준비) await 준비(p)
  await p.waitForTimeout(500)
  await 하기(p)
  await p.waitForTimeout(900)
  저장본 = await ctx.storageState()
  await ctx.close()
  const f = readdirSync(방).find((x) => x.endsWith('.webm'))
  if (f) { renameSync(join(방, f), join(밖, String(장번호).padStart(2, '0') + '-' + 이름 + '.webm')); rmSync(방, { recursive: true, force: true }) }
  console.log('  🎥', 장번호, 이름)
}

// 🐢 사람이 누르는 속도로 — 너무 빠르면 「무슨 일이 났는지」 안 보인다
const 눌러 = async (p, 것, 쉼 = 900) => { await 것.scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(260); await 것.click({ force: true }); await p.waitForTimeout(쉼) }

// ① 레시피에서 재료를 «고르고» 담는다 — 한 장면에 다 담는다(창업자 지시)
await 장면('레시피-재료고르기', async (p) => {
  await 눌러(p, p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first(), 1100)
  await 눌러(p, p.locator('text=어남선생 두부조림').first(), 1500)
  await p.locator('.ing').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(700)
  for (const 이름 of ['두부', '양파', '대파']) {
    const 칸 = p.locator('.ing').filter({ hasText: 이름 }).first()
    if (await 칸.count()) await 눌러(p, 칸, 620)
  }
  await p.waitForTimeout(500)
  await 눌러(p, p.locator('button:has-text("장보기 담기")').first(), 1600)
})

// ② 장보기 — 고른 재료가 «다 들어와» 있다
await 장면('장보기-들어옴', async (p) => {
  await 눌러(p, p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first(), 1600)
  await p.waitForTimeout(900)
}, { 준비: async () => {} })

await b.close(); srv.close()
console.log('✅ 녹화 끝 →', 밖)

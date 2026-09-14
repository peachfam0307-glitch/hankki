// 🕳 [판정대기 · 2026-08-21] 2칸으로 가면 3편 주에 생기는 «빈칸» — 뭘 넣나
//
// 📮 창업자 = *"ㄴ가고 **빈칸에는 애들을 넣거나 뭐 다른방법을** 생각해보자"*
//    → 2칸(갈래 ㄴ)은 **확정**. 이 판은 «빈칸» 하나만 판정한다.
//
// ⛔ 말로 설명하지 않는다 — **진짜 앱에 넣어서 찍는다**(절대원칙 30 · 규칙 21).
//    후보 카드를 DOM 에 실제로 끼워 넣고 격자가 어떻게 되는지 그대로 본다.
//
// ⚠️ 미리 잰 것 — 홈에 «우리가 넣은» UI 캐릭터가 **이미 2마리** 있다
//    (한끼 소식 `gom_wow` 27px · 다음에 뭐 할까 `pn_search` 31px).
//    ⛔ 창업자가 그 자리에서 *"얘도 꼬르곰이라 좀 정신이없어"* 라고 한 적이 있다(v11.17).
//    ⭐ 그래서 「애들」 안은 **셋째 마리**가 된다 — 이 판에서 그걸 눈으로 확인해야 한다.
//    📌 확정 원칙 = 「우리 애들을 화면마다 «한 마리»씩」(v10.67)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-빈칸-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/빈칸'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4416, r))

const 두칸 = `.weekly-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important; }`

// ⭐ 후보는 «이미 가진 것»으로만 만든다 — 새로 그릴 그림 0장(규칙 8)
const 후보 = [
  { key: '①', 이름: '빈칸 그대로', 설명: '아무것도 안 넣는다 (기준)', 넣기: null },
  {
    key: '②', 이름: '애들 카드', 설명: '꼬르곰＋펭펭 ＋ 한마디 · 누르면 「오늘 뭐 해먹지」',
    넣기: { 종류: '캐릭터', 그림: 'gp_duohi', 글: '오늘도\n한 끼 해냈어요', 밑: '꼬르곰과 펭펭' },
  },
  {
    key: '③', 이름: '이번 주 재료 카드', 설명: '그 주 재료 그림 ＋ 「이번 주는 ○○」 · 누르면 그 재료 검색',
    넣기: { 종류: '재료', 글: '이번 주는\n시원한 것', 밑: '이 재료 더 보기' },
  },
  {
    key: '④', 이름: '더 보기 카드', 설명: '글자만 · 누르면 그 주제 검색',
    넣기: { 종류: '더보기', 글: '이 주제\n더 보기', 밑: '' },
  },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 찍기 = async (c) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

  // 레꾸를 심는다 — 창업자가 짚은 *"레꾸화면이 더 잘보이겠다"* 를 같이 본다
  const p0 = await ctx.newPage()
  await p0.goto('http://127.0.0.1:4416/hankki/', { waitUntil: 'networkidle' })
  await p0.waitForTimeout(700)
  await p0.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const 제목들 = [...document.querySelectorAll('.weekly-row .mini-card .name')].map((n) => n.textContent.trim().replace(/…$/, ''))
    st.recipes = (st.recipes || []).map((r) => (제목들.some((t) => t && r.title.startsWith(t)) ? {
      ...r,
      decor: [
        { id: 'a', type: 'sticker', key: 'gp_gomhi', x: 0.24, y: 0.26, s: 0.30, r: -8 },
        { id: 'b', type: 'sticker', key: 'gp_pengv', x: 0.78, y: 0.30, s: 0.24, r: 7 },
        { id: 'c', type: 'note', key: 'yellow', text: '오늘 성공!', x: 0.5, y: 0.80, s: 0.52, r: -3 },
      ],
    } : r))
    localStorage.setItem('hankki:v1', JSON.stringify(st))
  })
  await p0.close()

  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4416/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  await p.addStyleTag({ content: 두칸 })
  await p.waitForTimeout(300)

  if (c.넣기) {
    await p.evaluate((n) => {
      const row = document.querySelector('.weekly-row')
      if (!row) return
      const 첫 = row.querySelector('.mini-card')
      const 표지 = 첫?.querySelector('div[style*="position"]')
      const 반지름 = 표지 ? getComputedStyle(표지).borderRadius : '16px'

      const btn = document.createElement('button')
      btn.className = 'mini-card press'
      btn.style.cssText = 'width:auto;background:none;border:none;padding:0;cursor:pointer'

      const box = document.createElement('div')
      box.style.cssText = `position:relative;width:100%;aspect-ratio:1/1;border-radius:${반지름};overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px`

      if (n.종류 === '캐릭터') {
        // ⭐ 우리 컷 그대로 — 새로 그린 그림 0장
        box.style.background = 'var(--thumb)'
        const img = document.createElement('img')
        const 원본 = document.querySelector('img[src*="gp_"]')
        img.src = 원본 ? 원본.src.replace(/gp_[a-z0-9]+/, n.그림) : ''
        img.style.cssText = 'width:56%;height:auto;display:block'
        box.appendChild(img)
      } else if (n.종류 === '재료') {
        box.style.background = 'var(--thumb)'
        const img = document.createElement('img')
        // 재료 아이콘 171컷(v10.96) 중 하나를 흉내 — 실물 판정은 진짜 키로 붙일 때
        const 원본 = document.querySelector('.weekly-row img')
        img.src = 원본 ? 원본.src : ''
        img.style.cssText = 'width:44%;height:auto;display:block;opacity:.55'
        box.appendChild(img)
      } else {
        box.style.background = 'var(--cream)'
        const 화 = document.createElement('div')
        화.textContent = '→'
        화.style.cssText = 'font-size:30px;color:var(--brown);line-height:1'
        box.appendChild(화)
      }

      const 글 = document.createElement('div')
      글.textContent = n.글
      글.style.cssText = 'font-size:13px;font-weight:700;color:var(--text);white-space:pre-line;line-height:1.45;letter-spacing:-.02em;word-break:keep-all'
      box.appendChild(글)
      btn.appendChild(box)

      const nm = document.createElement('div')
      nm.className = 'name'
      nm.textContent = n.밑 || ' '
      btn.appendChild(nm)
      row.appendChild(btn)
    }, c.넣기)
    await p.waitForTimeout(400)
  }

  await p.evaluate(() => document.querySelector('.weekly-box')?.scrollIntoView({ block: 'start' }))
  await p.waitForTimeout(300)
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 560 } })
  await ctx.close()
  return buf
}

console.log('\n🕳 2칸의 «빈칸» — 뭘 넣나 (390×560 · 3배 · 같은 크기로 잘라 나란히)\n')
const 찍힌 = []
for (const c of 후보) {
  찍힌.push({ ...c, buf: await 찍기(c) })
  console.log(`  ${c.key} ${c.이름}`)
}

// 한 장으로 — 같은 캔버스·같은 배율(⛔따로 보내면 세로가 달라 크기가 왜곡된다 · 2026-08-21 사고)
const page = await (await b.newContext({ viewport: { width: 1640, height: 700 }, deviceScaleFactor: 2 })).newPage()
const d = (buf) => `data:image/png;base64,${buf.toString('base64')}`
await page.setContent(`
<style>
  body{margin:0;background:#f6f3ec;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;
       display:flex;gap:18px;padding:20px;box-sizing:border-box}
  .col{flex:1;min-width:0;text-align:center}
  .lab{font-size:16px;font-weight:800;color:#2a2622;margin:0 0 2px;letter-spacing:-.02em}
  .d{font-size:12px;color:#6b6055;margin:0 0 9px;line-height:1.5;min-height:34px}
  img{width:100%;height:auto;display:block;border-radius:11px;border:1px solid #e3dccf;background:#fff}
</style>
${찍힌.map((c) => `<div class="col"><p class="lab">${c.key} ${c.이름}</p><p class="d">${c.설명}</p><img src="${d(c.buf)}"></div>`).join('')}
`)
await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, '⭐빈칸-후보넷.png'), fullPage: true })
await b.close(); srv.close()

찍힌.forEach((c) => writeFileSync(join(OUT, `${c.key}-${c.이름}.png`), c.buf))
console.log(`\n🖼 ${join(OUT, '⭐빈칸-후보넷.png')}\n`)

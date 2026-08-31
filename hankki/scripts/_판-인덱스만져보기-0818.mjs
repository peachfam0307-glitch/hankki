// 🔖 인덱스 «만져보는 판» — 창업자가 폰에서 크기·클립을 갈아끼워 본다 (2026-08-18)
//
// 📮 창업자 *"근데 이것도 **내가 앱에서 안써봐서 모르겠어.**"*
// 📮 → *"**클립종류도 앱에서 좀 붙여봐야** 예쁜게 뭔지 알 것 같아"*
//
// ⭐⭐ **두 말이 같은 것을 가리킨다 — 스샷으로는 판정이 안 된다.**
//    나는 오늘 판을 일곱 장 보냈는데 창업자는 여전히 *"모르겠어"* 라고 했다.
//    **정지된 그림은 「이 크기가 맞나」를 못 답한다.** 견주려면 «바꿔봐야» 한다.
//
// ⛔ 그렇다고 앱에 넣어 배포할 수는 없다 — 판정이 안 끝났고 푸시 = 곧 배포다(규칙 9·13).
// ✅ 그래서 **앱 화면을 크기·클립마다 «미리 찍어» 두고, 판에서 갈아끼운다.**
//    ⭐ 갈아끼우는 게 «진짜 앱 스크린샷»이라 흉내가 아니다(규칙 30) —
//       CSS 로 앱을 흉내 내면 그 순간 「내가 만든 것」을 판정하게 된다.
//
// 📐 한 화면에 다 담는다 — 카드 18개:
//    ⑴ 꾸민 표지 ＋ 인덱스 7종  ⑵ 기본 표지 ＋ 인덱스 7종  ⑶ 인덱스 «없는» 칸 4개
//    ⭐ ⑶ 이 있어야 「안 걸린 칸이 텅 빈다」가 어떻게 보이는지 같이 판정된다(창업자 확정 사항).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-인덱스만져보기-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/인덱스판'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')

// ✅ 창업자가 고른 일곱 (2026-08-18) — "요리사모자 계란 일기장 숟가락" ＋ "요리사모자하트없는판 아까꺼도"
const 컷목록 = [
  { k: 'cl_13', 이름: '요리사모자 · 하트' },
  { k: 'ck_27', 이름: '요리사모자 · 민' },
  { k: 'cl_03', 이름: '계란후라이' },
  { k: 'cl_01', 이름: '일기장' },
  { k: 'cl_15', 이름: '나무 숟가락' },
  { k: 'cl_16', 이름: '계량 스푼' },
  { k: 'ck_30', 이름: '숟가락＋마테' },
]
// ✅ 창업자 판정 = *"나는 28이나 32로 가면 좋겠고"* → 그 언저리를 촘촘히 본다
const 크기들 = (process.env.IDX_SIZES || '26,28,30,32,34,36').split(',').map(Number)
const 밖 = -4, 위밖 = 22   // G3 확정

const 폴더 = { cl: join(ROOT, 'docs/stickers/클립인덱스-창업자-2026-08-18/낱개'), ck: join(ROOT, 'docs/stickers/요리소품-창업자-2026-08-17/낱개') }
const url = (k) => 'data:image/png;base64,' + readFileSync(join(폴더[k.slice(0, 2)], `${k}.png`)).toString('base64')
for (const { k } of 컷목록) if (!readdirSync(폴더[k.slice(0, 2)]).includes(`${k}.png`)) throw new Error(`⛔ ${k}.png 없다`)
const 그림 = Object.fromEntries(컷목록.map(({ k }) => [k, url(k)]))

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4383, r))

const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
const 샘플 = allBasicRecipes.find((r) => r.decor?.length)
const now = Date.now()
const 아이콘 = ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04', 'fh_k12']
// ⑴ 꾸민 7 · ⑵ 기본 7 · ⑶ 인덱스 없는 4
const 칸 = [
  ...컷목록.map((c, i) => ({ 제목: ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림'][i], 꾸밈: true, 컷: c.k })),
  ...컷목록.map((c, i) => ({ 제목: ['무생채', '계란말이', '미역국', '갈치조림', '고등어구이', '잡채', '비빔밥'][i], 꾸밈: false, 컷: c.k })),
  ...['카레', '오므라이스', '떡볶이', '순두부찌개'].map((t) => ({ 제목: t, 꾸밈: false, 컷: null })),
]
const R = (c, i) => c.꾸밈
  ? { ...샘플, id: 'x'.repeat(i + 1), title: c.제목, savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0, sample: false }
  : { id: 'x'.repeat(i + 1), title: c.제목, category: '한식', time: 15, thumb: 'icon', icon: 아이콘[i % 10], ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: !!c.컷, cooked: 0 }
const state = { recipes: 칸.map(R), diary: [], seedV: BASICS_VERSION }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const errors = []
const 찍은것 = []

for (const 격자 of ['small', 'big']) {
  const 높이 = 격자 === 'small' ? 1180 : 2100
  const page = await b.newPage({ viewport: { width: 360, height: 높이 }, deviceScaleFactor: 2 })
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(({ s, g }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, { s: state, g: 격자 })
  await page.goto('http://127.0.0.1:4383/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1200)

  for (const PX of 크기들) {
    const n = await page.evaluate(({ 그림, PX, 밖, 위밖, 칸 }) => {
      const 표 = new Map(칸.map((c) => [c.제목, c]))
      const 카드들 = [...document.querySelectorAll('.grid-card')]
      let 얹은수 = 0, 본것 = new Set()
      for (const c of 카드들) {
        const t = c.querySelector('.name')?.textContent
        const 값 = 표.get(t)
        // ⛔ 같은 이름의 «기본 레시피»가 섞인다 — 처음 나온 하나만 남기고 나머지는 감춘다
        if (!값 || 본것.has(t)) { c.style.display = 'none'; continue }
        본것.add(t); c.style.display = ''
        const d = c.querySelector('.fav-dot')
        if (d) {
          if (!값.컷) { d.innerHTML = ''; d.style.background = 'none' }   // ⭐ 안 걸린 칸은 «텅»(창업자 확정)
          else {
            d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
            d.style.width = 'auto'; d.style.height = 'auto'; d.style.overflow = 'visible'
            d.style.top = `${8 - 위밖}px`; d.style.right = `${8 - 밖}px`
            d.innerHTML = `<img src="${그림[값.컷]}" style="display:block;height:${PX}px;width:auto" alt="">`
            얹은수++
          }
        }
      }
      document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
      return 얹은수
    }, { 그림, PX, 밖, 위밖, 칸 })
    await page.waitForTimeout(350)
    const 이름 = `${격자}-${PX}`
    await page.screenshot({ path: join(OUT, `${이름}.png`), fullPage: true })
    찍은것.push(이름)
    if (n !== 14) console.log(`   ⚠️ ${이름} — 인덱스 ${n}개 (14 여야 한다)`)
  }
  console.log(`   ✅ ${격자} — ${크기들.length}장`)
  await page.close()
}

// 📦 판에 넣을 수 있게 WebP 로 (PNG 12장이면 아티팩트 16MB 를 넘본다)
writeFileSync(join(OUT, '목록.json'), JSON.stringify({ 크기들, 컷목록, 찍은것 }, null, 1))
if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ ${찍은것.length}장 → ${OUT}\n`)

// 📐 인덱스를 「바깥으로 걸치면」 무엇이 깨지나 — 실측 (2026-08-18)
//
// 📮 창업자 *"딱 레시피 안에 넣기보다 **바깥에 걸쳐서**"* → *"흠...어떤게 낫지..."*
//
// ⭐⭐ **「예쁜가」는 창업자가 정한다(규칙 11). 「기능이 깨지나」는 내가 잰다.**
//    걸치면 단추가 카드 «밖»으로 나가는데, 그 자리에 **옆 카드나 화면 가장자리**가 있으면
//    ⑴손가락이 엉뚱한 걸 누르거나 ⑵인덱스가 잘려 보인다.
//    ⛔ 이걸 안 재고 「D가 예뻐요」라고 하면 **창업자가 고른 뒤에 사고가 난다.**
//
// 🔬 재는 것 넷 — 전부 «눈»이 아니라 «좌표와 히트테스트»로
//    ① 화면 밖으로 나가나       (단추 상자가 뷰포트를 벗어나나)
//    ② 눌리는 게 맞나           (`elementFromPoint` 로 단추 한가운데를 찍어 «무엇이 잡히나»)
//    ③ 옆·위 카드를 덮나        (다른 카드의 썸네일과 겹치는 넓이)
//    ④ 손가락 칸이 남아 있나    (단추의 «보이는» 넓이 — 잘리면 못 누른다)
//
// ⚠️ **큰 격자(2열)와 작은 격자(3열)를 «둘 다» 잰다** — 어제 판은 큰 격자만 봤다.
//    작은 격자는 카드가 좁고 인덱스도 16px 이라 **걸침의 영향이 더 크다.**
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-인덱스걸침-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 낱개 = join(ROOT, 'docs/stickers/요리소품-창업자-2026-08-17/낱개')

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4374, r))

const 담기 = (k) => 'data:image/png;base64,' + readFileSync(join(낱개, `${k}.png`)).toString('base64')

// 📐 놓는 방식 — 어제 찍은 판과 «같은 값»이라야 판정이 이어진다
const 놓기 = [
  { 이름: 'B 안쪽', 밖: 0, 배: 30 / 19 },
  { 이름: 'C 살짝', 밖: 9, 배: 30 / 19 },
  { 이름: 'D 반쯤', 밖: 15, 배: 32 / 19 },
]

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const R = (id, title, icon) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0 })
const state = {
  recipes: ['a', 'bb', 'ccc', 'dddd', 'eeeee', 'ffffff', 'ggggggg', 'hhhhhhhh', 'iiiiiiiii']
    .map((id, i) => R(id, ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림', '무생채', '계란말이'][i], ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04'][i])),
  diary: [], seedV: BASICS_VERSION,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const 결과 = []
let 나쁨 = 0

for (const 격자 of ['big', 'small']) {
  const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
  await page.addInitScript(({ s, g }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, { s: state, g: 격자 })
  await page.goto('http://127.0.0.1:4374/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(800)

  for (const 방식 of 놓기) {
    const r = await page.evaluate(({ 방식, url }) => {
      const dots = [...document.querySelectorAll('.fav-dot')]
      if (!dots.length) return { 오류: '.fav-dot 이 없다' }
      // 어제 판과 같은 방식으로 갈아끼운다
      dots.forEach((d) => {
        const 원래 = d.querySelector('svg')
        const 기본 = 원래 ? Number(원래.getAttribute('width')) || 19 : 19
        const px = Math.round(기본 * 방식.배)
        d.style.background = 'none'; d.style.backdropFilter = 'none'
        d.style.top = `${8 - 방식.밖}px`; d.style.right = `${8 - 방식.밖}px`
        d.innerHTML = `<img src="${url}" width="${px}" height="${px}" style="display:block;object-fit:contain" alt="">`
      })
      document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })

      const W = window.innerWidth, H = window.innerHeight
      const 카드들 = [...document.querySelectorAll('.grid-card')]
      // ⛔⛔ **첫 판이 엉뚱한 걸 쟀다** — 「오터치」의 정체가 대부분 **하단 탭바**였다.
      //    화면 아래로 내려간 카드는 «원래» 탭바가 덮는다. 걸침과 아무 상관이 없다.
      //    📌 규칙 18 ⓘ — 「무엇을 보고 있나」. 붙박이 덮개(탭바·상단바)에 걸린 단추는 «판정 대상이 아니다».
      const 덮개 = [...document.querySelectorAll('nav, .tabbar, .bottom-nav, [class*="nav-"]')]
        .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
      const 덮개에걸리나 = (q) => 덮개.some((r) =>
        Math.min(q.right, r.right) - Math.max(q.left, r.left) > 1 &&
        Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top) > 1)
      let 화면밖 = 0, 오터치 = 0, 덮음 = 0, 잘림 = 0, 건너뜀 = 0
      const 사례 = []
      const 이름 = (e) => {
        if (!e) return 'null'
        const c = typeof e.className === 'string' ? e.className : (e.getAttribute?.('class') || '')
        return `${e.tagName}${c ? '.' + c.split(/\s+/)[0] : ''}`
      }
      for (const d of dots) {
        const q = d.getBoundingClientRect()
        if (q.bottom < 0 || q.top > H) continue      // 화면에 안 보이는 카드는 건너뛴다
        if (덮개에걸리나(q)) { 건너뜀++; continue }   // 붙박이 덮개 밑 — 걸침 탓이 아니다
        // ① 화면 밖으로 나가나
        if (q.right > W + 0.5 || q.left < -0.5) { 화면밖++; 사례.push(`화면밖 right=${q.right.toFixed(1)}>${W}`) }
        // ② 한가운데를 찍으면 무엇이 잡히나 — 이게 진짜 「눌리나」다
        const cx = Math.min(W - 1, Math.max(0, q.left + q.width / 2))
        const cy = Math.min(H - 1, Math.max(0, q.top + q.height / 2))
        const hit = document.elementFromPoint(cx, cy)
        if (!hit || (!d.contains(hit) && hit !== d)) {
          오터치++; 사례.push(`오터치 → ${이름(hit)}`)
        }
        // ③ 다른 카드를 덮나
        const 내카드 = d.closest('.grid-card')
        for (const c of 카드들) {
          if (c === 내카드) continue
          const p = c.getBoundingClientRect()
          const ow = Math.min(q.right, p.right) - Math.max(q.left, p.left)
          const oh = Math.min(q.bottom, p.bottom) - Math.max(q.top, p.top)
          if (ow > 1 && oh > 1) { 덮음++; 사례.push(`옆카드 덮음 ${(ow * oh).toFixed(0)}px²`); break }
        }
        // ④ 손가락 칸이 남아 있나 — 뷰포트 안에 남은 넓이
        const vw = Math.min(q.right, W) - Math.max(q.left, 0)
        const vh = Math.min(q.bottom, H) - Math.max(q.top, 0)
        const 남은 = (vw * vh) / (q.width * q.height)
        if (남은 < 0.9) { 잘림++; 사례.push(`손가락칸 ${Math.round(남은 * 100)}%만 남음`) }
      }
      const 첫 = dots.find((d) => d.getBoundingClientRect().top > 0)
      const q0 = 첫 ? 첫.getBoundingClientRect() : null
      return { 칸수: dots.length, 잰것: dots.length - 건너뜀, 화면밖, 오터치, 덮음, 잘림, 사례: [...new Set(사례)].slice(0, 3), 단추: q0 ? `${q0.width.toFixed(0)}×${q0.height.toFixed(0)}` : '?' }
    }, { 방식, url: 담기('ck_12') })
    const bad = (r.화면밖 || 0) + (r.오터치 || 0) + (r.덮음 || 0) + (r.잘림 || 0)
    나쁨 += bad
    결과.push({ 격자, 이름: 방식.이름, ...r, bad })
  }
  await page.close()
}

await b.close(); srv.close()

console.log('\n📐 인덱스 「걸침」 실측 — 기능이 깨지나\n')
console.log('격자    놓기      잰것   단추     화면밖  오터치  옆카드덮음  손가락칸잘림   판정')
for (const r of 결과) {
  const 격 = r.격자 === 'big' ? '큰(2열)' : '작은(3열)'
  console.log(`${격.padEnd(8)}${r.이름.padEnd(10)}${String(r.잰것).padStart(4)}${String(r.단추).padStart(8)}${String(r.화면밖).padStart(8)}${String(r.오터치).padStart(8)}${String(r.덮음).padStart(12)}${String(r.잘림).padStart(14)}   ${r.bad ? '⛔' : '✅'}`)
  if (r.사례?.length) r.사례.forEach((s) => console.log(`            └ ${s}`))
}
console.log(나쁨 ? `\n⛔ 어긋난 자리 ${나쁨}곳 — 위 표에서 ⛔ 인 줄은 그대로 쓰면 안 된다\n` : '\n✅ 셋 다 기능은 안 깨진다 — 판정은 「예쁜가」로만\n')

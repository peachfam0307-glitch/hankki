// 🔖 인덱스 그림을 «진짜 카드 위에» 얹어 본다 — 창업자 판정용 (2026-08-17)
//
// 📮 창업자 *"북마크(이미지를) **예쁜걸로** 바꾸고"* · *"일단 몇개를 넣을지 정해야해"*
// 📮 → *"딱 레시피 안에 넣기보다 **바깥에 걸쳐서** 넣는게 더 예쁜거 같아 **레꾸도 안해치고**"*
// 📮 → *"나는 그냥 **딱 저 아이콘만** 붙이고 싶은데 **테두리없이**..."*
//
// ⭐⭐ **왜 「19px 판」만으로는 부족한가** — 그 판은 «흰 칸» 위에서 잰다.
//    앱에선 **크림색 카드(`--thumb`) 위**에 얹힌다. 바탕이 다르면 답도 다르다.
//    📌 그래서 **앱을 띄워서 그 자리에 얹는다**(규칙 30 — 흉내가 아니라 실물).
//
// ⭐⭐⭐ **「테두리 없이」가 19px 문제까지 같이 푼다.**
//    지금 `.fav-dot` = **34px 흰 동그라미 «안»에 19px 그림**. 동그라미를 빼면
//    **그 34px 을 그림이 다 쓴다** → 19px → 30px. 읽힘이 완전히 달라진다.
//    ⛔ 손가락이 닿는 칸(34px)은 그대로다 — 작아지는 게 아니라 «그림만» 커진다.
//
// ⛔ 앱 코드에 후보를 심지 않는다 — 판정 뒤엔 하나만 남고 나머지는 죽은 코드가 된다.
//    대신 **화면에 뜬 `.fav-dot` 을 그 자리에서 갈아끼운다.** 앱은 한 글자도 안 바뀐다.
// ⛔ 판정용 표시(점선 테 같은 것)를 그리지 않는다 — 창업자가 **앱 디자인으로 오해한다**
//    (2026-08-17 실제로 그랬다: *"저 핑크 테두리는 안하고싶다...ㅠ"* — 내가 「여기 봐」로 넣은 것이었다).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-인덱스스티커-0817.mjs
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
await new Promise((r) => srv.listen(4372, r))

const 담기 = (k) => 'data:image/png;base64,' + readFileSync(join(낱개, `${k}.png`)).toString('base64')

// 📐 놓는 방식 — 창업자가 «고를 수 있게» 나란히.
//    ⛔ 걸치는 «양»은 내가 못 정한다(규칙 11).
const 놓기 = [
  { 이름: 'A-지금', 설명: 'A · 지금 (표지 안 · 흰 동그라미 · 그림 19px)', 흰원: true, px: 19, 밖: 0, 기울기: 0 },
  { 이름: 'B-테없이', 설명: 'B · 흰 동그라미 빼고 그림만 (표지 안 · 30px)', 흰원: false, px: 30, 밖: 0, 기울기: 0 },
  { 이름: 'C-걸침', 설명: 'C · 모서리에 살짝 걸침 (30px)', 흰원: false, px: 30, 밖: 9, 기울기: 0 },
  { 이름: 'D-걸침기울임', 설명: 'D · 반쯤 걸침 ＋ 살짝 기울임 (32px)', 흰원: false, px: 32, 밖: 15, 기울기: -12 },
]

// 📋 어떤 그림으로 볼까 — 「창업자가 고른 것」과 「19px 를 견딘 것」
const 묶음 = {
  창업자픽: [
    ['ck_30', '숟가락＋체크마테'], ['ck_27', '요리사모자＋클립'], ['ck_29', '하트 요리사모자'],
    ['ck_05', '하트 요리사모자(2)'], ['ck_03', '별 요리사모자'], ['ck_25', '빨간선 요리사모자'],
  ],
  살아남은것: [
    ['ck_18', '빨간 씰'], ['ck_12', '빨간 오븐장갑'], ['ck_22', '하트 식빵'],
    ['ck_23', '케첩'], ['ck_16', '하트 레시피북'], ['ck_19', '클립＋하트'],
  ],
  중간: [
    ['ck_09', '하트 접시'], ['ck_11', '하트 뚜껑'], ['ck_20', '하트 냅킨'],
    ['ck_17', '체크 냅킨'], ['ck_21', '노랑 하트 접시'], ['ck_06', '접시 위 숟가락'],
  ],
}

// 🎬 찍을 판 = (놓는 방식 × 그림 묶음). 전부 찍으면 12장이라 필요한 것만.
const 찍기 = [
  ['A-지금', '살아남은것'], ['B-테없이', '살아남은것'], ['C-걸침', '살아남은것'], ['D-걸침기울임', '살아남은것'],
  ['C-걸침', '창업자픽'], ['C-걸침', '중간'],
]

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
// ⚠️ `status: 'sorted'` 가 없으면 목록에 아예 안 뜬다(MyRecipesScreen:227) — 시드에 필수
const R = (id, title, icon) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0 })
const state = {
  recipes: [
    R('a', '들깨나물무침', 'fe_143'), R('bb', '콩나물국', 'fh_k02'), R('ccc', '제육볶음', 'fe_18'),
    R('dddd', '된장찌개', 'fe_133'), R('eeeee', '김치찌개', 'fe_128'), R('ffffff', '어묵탕', 'fh_k18'),
  ],
  diary: [], seedV: BASICS_VERSION,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'big')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4372/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)

for (const [놓기이름, 묶음이름] of 찍기) {
  const 방식 = 놓기.find((x) => x.이름 === 놓기이름)
  const 컷 = 묶음[묶음이름].map(([k, 라벨]) => [k, 라벨, 담기(k)])
  const n = await page.evaluate(({ 컷, 방식, 묶음이름 }) => {
    document.querySelectorAll('[data-판이름표]').forEach((e) => e.remove())
    const dots = [...document.querySelectorAll('.fav-dot')]
    dots.forEach((d, i) => {
      const [키, 라벨, url] = 컷[i % 컷.length]
      // 🖼 흰 동그라미를 빼고 그림만 — 손가락 닿는 칸(34px)은 그대로 둔다
      if (!방식.흰원) {
        d.style.background = 'none'
        d.style.backdropFilter = 'none'
        d.style.webkitBackdropFilter = 'none'
      }
      d.style.top = `${8 - 방식.밖}px`
      d.style.right = `${8 - 방식.밖}px`
      d.style.overflow = 'visible'
      d.innerHTML = `<img src="${url}" width="${방식.px}" height="${방식.px}" style="display:block;object-fit:contain${방식.기울기 ? `;transform:rotate(${방식.기울기}deg)` : ''}" alt="">`
      // 🏷 이름표는 **왼쪽 아래**에 — 위에 두면 정작 인덱스를 가린다(첫 판에서 실제로 그랬다)
      const tag = document.createElement('span')
      tag.dataset.판이름표 = '1'
      tag.textContent = `${키} · ${라벨}`
      tag.style.cssText = 'position:absolute;left:6px;bottom:52px;background:rgba(255,255,255,.94);border-radius:8px;padding:2px 6px;font-size:9.5px;font-weight:800;color:#5d3410;z-index:5;letter-spacing:-.02em'
      d.parentElement.appendChild(tag)
    })
    // 카드가 겹치는 칸이라 걸치면 잘릴 수 있다 → 넘치게 열어둔다(무엇이 잘리는지도 같이 보인다)
    document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
    const h = document.createElement('div')
    h.dataset.판이름표 = '1'
    h.textContent = `${방식.설명}  —  ${묶음이름}`
    h.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99;background:#5d3410;color:#fffdf8;font-size:12.5px;font-weight:800;padding:9px 14px;text-align:center'
    document.body.appendChild(h)
    return dots.length
  }, { 컷, 방식, 묶음이름 })
  await page.waitForTimeout(400)
  const 파일 = `인덱스-${놓기이름}-${묶음이름}.png`
  await page.screenshot({ path: join(OUT, 파일) })
  console.log(`   ✅ ${방식.설명} · ${묶음이름} — 카드 ${n}개 → ${파일}`)
}

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
await b.close(); srv.close()
console.log(`\n✅ 판 ${찍기.length}장 → ${OUT}\n`)

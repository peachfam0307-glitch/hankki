// 🔖 인덱스 그림을 «진짜 카드 위에» 얹어 본다 — 창업자 판정용 (2026-08-17 → 08-18 갱신)
//
// 📮 08-17 *"북마크(이미지를) **예쁜걸로** 바꾸고"* · *"일단 몇개를 넣을지 정해야해"*
// 📮 08-17 *"딱 레시피 안에 넣기보다 **바깥에 걸쳐서** 넣는게 더 예쁜거 같아 **레꾸도 안해치고**"*
// 📮 08-17 *"나는 그냥 딱 저 아이콘만 붙이고 싶은데 **테두리없이**"* → *"웅 테두리는 없어야이뻐."* ✅확정
// 📮 08-18 *"있자나.. **인덱스는 안눌려도 되지않아?**"* → *"**표시용도니까.**"*
// 📮 08-18 지금 것을 보고 → *"**새 아이콘으로 해보자. 저거는 지금 너무 별로고 커**"*
//
// ⭐⭐ **왜 「19px 판」만으로는 부족한가** — 그 판은 «흰 칸» 위에서 잰다.
//    앱에선 **크림색 카드(`--thumb`) 위**에 얹힌다. 바탕이 다르면 답도 다르다.
//    📌 그래서 **앱을 띄워서 그 자리에 얹는다**(규칙 30 — 흉내가 아니라 실물).
//
// 🏷 **[08-18] 「표시용」으로 전제가 바뀌면서 사라진 것 셋**
//    ⑴ 손가락 칸 34px 제약 ⑵ 「안 눌린 상태를 어떻게 그리나」 ⑶ 오터치 걱정
//    ⭐ 그래서 **안 걸린 카드엔 «아무것도 안 그린다»** 판을 같이 만든다 —
//       지금은 15칸 중 11칸이 「안 걸림」인데 전부 흰 동그라미가 떠서 **목록이 시끄럽다**(창업자 *"별로고 커"*).
//    ⭐ 「대표 인덱스 버튼」 자리는 이미 있다 — 필터 줄의 「★ 즐겨찾기 N」 칩(`MyRecipesScreen.jsx:684`).
//
// ⛔ 앱 코드에 후보를 심지 않는다 — 판정 뒤엔 하나만 남고 나머지는 죽은 코드가 된다.
//    대신 **화면에 뜬 `.fav-dot` 을 그 자리에서 갈아끼운다.** 앱은 한 글자도 안 바뀐다.
// ⛔ 판정용 표시(점선 테 같은 것)를 그리지 않는다 — 창업자가 **앱 디자인으로 오해한다**
//    (2026-08-17 실제로 그랬다: *"저 핑크 테두리는 안하고싶다...ㅠ"*).
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

// 📐 놓는 방식 — 「크기」가 오늘의 물음이다(창업자 *"너무 별로고 커"*).
//    ⛔ 걸치는 «양»도 크기도 내가 못 정한다(규칙 11) → 나란히 놓고 창업자가 고른다.
const 놓기 = [
  { 이름: '1-작게', 설명: '① 작게 · 모서리에 걸침 (22px)', px: 22, 밖: 7, 기울기: 0, 안걸린것: '없음' },
  { 이름: '2-중간', 설명: '② 중간 · 모서리에 걸침 (28px)', px: 28, 밖: 10, 기울기: 0, 안걸린것: '없음' },
  { 이름: '3-크게', 설명: '③ 크게 · 반쯤 걸침 (36px)', px: 36, 밖: 14, 기울기: 0, 안걸린것: '없음' },
  { 이름: '4-중간흐림', 설명: '④ 중간 ＋ 안 걸린 칸엔 흐린 그림 (28px)', px: 28, 밖: 10, 기울기: 0, 안걸린것: '흐리게' },
  { 이름: '5-중간기울임', 설명: '⑤ 중간 ＋ 살짝 기울임 (28px · −10°)', px: 28, 밖: 10, 기울기: -10, 안걸린것: '없음' },
]

// 📋 어떤 그림으로 볼까
const 묶음 = {
  창업자픽: [
    ['ck_27', '요리사모자＋클립'], ['ck_30', '숟가락＋체크마테'], ['ck_29', '하트 요리사모자'],
    ['ck_19', '클립＋하트'], ['ck_05', '하트 요리사모자(2)'], ['ck_32', '클립＋나무숟가락'],
  ],
  진한것: [
    ['ck_18', '빨간 씰'], ['ck_12', '빨간 오븐장갑'], ['ck_22', '하트 식빵'],
    ['ck_23', '케첩'], ['ck_16', '하트 레시피북'], ['ck_19', '클립＋하트'],
  ],
}

// 🎬 찍을 판 = (놓는 방식 × 그림 묶음 × 격자)
const 찍기 = [
  ['1-작게', '창업자픽', 'big'], ['2-중간', '창업자픽', 'big'], ['3-크게', '창업자픽', 'big'],
  ['4-중간흐림', '창업자픽', 'big'], ['5-중간기울임', '창업자픽', 'big'],
  ['2-중간', '창업자픽', 'small'],   // ⭐ 「커」가 제일 심했던 작은 격자
  ['2-중간', '진한것', 'big'],
]

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
// ⚠️ `status: 'sorted'` 가 없으면 목록에 아예 안 뜬다(MyRecipesScreen:227) — 시드에 필수
// ⭐⭐ [08-18] **인덱스를 «섞어서» 심는다.** 어제 판은 6개 «전부» 붙어 있어서
//    「표시」로 보이질 않았다 — 진짜 목록은 **몇 개만** 붙는다.
const R = (id, title, icon, fav) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - id.length * 1000, source: 'user', status: 'sorted', favorite: !!fav, cooked: 0 })
const state = {
  recipes: [
    R('a', '들깨나물무침', 'fe_143', true), R('bb', '콩나물국', 'fh_k02', false), R('ccc', '제육볶음', 'fe_18', true),
    R('dddd', '된장찌개', 'fe_133', false), R('eeeee', '김치찌개', 'fe_128', false), R('ffffff', '어묵탕', 'fh_k18', true),
    R('ggggggg', '두부조림', 'fe_66', false), R('hhhhhhhh', '무생채', 'fe_95', false), R('iiiiiiiii', '계란말이', 'fe_04', true),
  ],
  diary: [], seedV: BASICS_VERSION,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const errors = []
const 쪽 = {}

for (const [놓기이름, 묶음이름, 격자] of 찍기) {
  const 방식 = 놓기.find((x) => x.이름 === 놓기이름)
  const 컷 = 묶음[묶음이름].map(([k, 라벨]) => [k, 라벨, 담기(k)])
  if (!쪽[격자]) {
    const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
    page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
    await page.addInitScript(({ s, g }) => {
      localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', g)
      const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
    }, { s: state, g: 격자 })
    await page.goto('http://127.0.0.1:4372/hankki/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(900)
    쪽[격자] = page
  }
  const page = 쪽[격자]

  const n = await page.evaluate(({ 컷, 방식, 묶음이름 }) => {
    document.querySelectorAll('[data-판이름표]').forEach((e) => e.remove())
    const dots = [...document.querySelectorAll('.fav-dot')]
    let 걸린번호 = 0
    dots.forEach((d) => {
      const 걸림 = d.getAttribute('aria-pressed') === 'true'
      // 🖼 흰 동그라미를 뺀다 — 스티커에 이미 흰 다이컷 테두리가 있다
      d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
      d.style.top = `${8 - 방식.밖}px`; d.style.right = `${8 - 방식.밖}px`
      d.style.overflow = 'visible'
      if (!걸림 && 방식.안걸린것 === '없음') { d.innerHTML = ''; return }   // ⭐ 표시용 = 안 걸리면 텅 빈다
      const [키, 라벨, url] = 컷[걸린번호++ % 컷.length]
      const 흐림 = !걸림 && 방식.안걸린것 === '흐리게' ? ';opacity:.28' : ''
      d.innerHTML = `<img src="${url}" width="${방식.px}" height="${방식.px}" style="display:block;object-fit:contain${방식.기울기 ? `;transform:rotate(${방식.기울기}deg)` : ''}${흐림}" alt="">`
      if (걸림) {
        const tag = document.createElement('span')
        tag.dataset.판이름표 = '1'
        tag.textContent = `${키} · ${라벨}`
        tag.style.cssText = 'position:absolute;left:6px;bottom:52px;background:rgba(255,255,255,.94);border-radius:8px;padding:2px 6px;font-size:9.5px;font-weight:800;color:#5d3410;z-index:5;letter-spacing:-.02em'
        d.parentElement.appendChild(tag)
      }
    })
    document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
    const h = document.createElement('div')
    h.dataset.판이름표 = '1'
    h.textContent = `${방식.설명}  —  ${묶음이름}`
    h.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99;background:#5d3410;color:#fffdf8;font-size:12.5px;font-weight:800;padding:9px 14px;text-align:center'
    document.body.appendChild(h)
    return dots.length
  }, { 컷, 방식, 묶음이름 })

  await page.waitForTimeout(400)
  const 파일 = `인덱스-${놓기이름}-${묶음이름}-${격자 === 'big' ? '큰격자' : '작은격자'}.png`
  await page.screenshot({ path: join(OUT, 파일) })
  console.log(`   ✅ ${방식.설명} · ${묶음이름} · ${격자} — 카드 ${n}개 → ${파일}`)
}

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ 판 ${찍기.length}장 → ${OUT}\n`)

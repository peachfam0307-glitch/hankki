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
  // 📮 [08-18] *"**바깥으로 반쯤 나오게**도 할 수 있어? **인덱스처럼**"*
  //    🔢 실측 = 화면 360px · 좌우 여백 **20px** · 카드 사이 **큰격자 14px · 작은격자 9px**
  //       28px 을 반쯤(14px) 빼면 → 오른쪽 열은 화면 끝까지 **6px 남고**(✅),
  //       큰 격자 왼쪽 열은 옆 카드에 **딱 닿고**, 작은 격자는 옆 카드를 **5px 침범**한다.
  //    ⭐ 그래서 「반쯤」의 «방향»을 갈라 본다 — 옆으로 / 대각선으로 / 위로.
  { 이름: '6-반쯤옆', 설명: '⑥ 옆으로 반쯤 나오게 (14px 밖)', px: 28, 밖: 22, 위밖: 8, 기울기: 0, 안걸린것: '없음' },
  { 이름: '7-반쯤대각', 설명: '⑦ 대각선으로 반쯤 (옆·위 둘 다 14px 밖)', px: 28, 밖: 22, 위밖: 22, 기울기: 0, 안걸린것: '없음' },
  // 📮 [08-18] *"**사각박스 오른쪽 상단 위**도 하나있었으면 좋겠는데. **(반은 안에 반은 밖에)**"*
  //    ⚠️ ⑧을 이미 만들었는데 창업자가 «없다»고 느꼈다 → 왜인지 재보니
  //       **스티커 PNG 안에 투명 여백이 있다.** 28×28 상자에 `contain` 으로 넣으면
  //       세로로 긴 컷(ck_27 = 393×587)은 **폭이 19px** 라 오른쪽에 9px 빈다.
  //       → 「오른쪽 끝」에 맞췄는데도 «안쪽으로 들어간» 것처럼 보인다.
  //    ⭐ 그래서 상자 기준이 아니라 **그림이 실제로 오른쪽에 붙게** 더 빼는 판을 같이 만든다.
  // 📮 [08-18] G 를 보고 → *"넘 **사각상단끝에걸리는거보다 왼쪽으로 들어오는게 더나은거같아.**
  //    **오른쪽 완전끝말고 살짝 왼쪽으로.**"*
  //    🔢 G 는 `right: -6px` 이라 그림이 카드 오른쪽 «밖»으로 6px 나가 있었다.
  //    ⭐ 위로 반반(`위밖: 22`)은 그대로 두고 **옆만** 안쪽으로 들인다.
  { 이름: 'G1-끝', 설명: 'G1 · 오른쪽 끝에 딱 (안쪽 0px)', px: 28, 밖: 8, 위밖: 22, 기울기: 0, 안걸린것: '없음', 꽉: true },
  { 이름: 'G2-살짝안', 설명: 'G2 · 살짝 왼쪽으로 (안쪽 6px)', px: 28, 밖: 2, 위밖: 22, 기울기: 0, 안걸린것: '없음', 꽉: true },
  { 이름: 'G3-더안', 설명: 'G3 · 더 왼쪽으로 (안쪽 12px)', px: 28, 밖: -4, 위밖: 22, 기울기: 0, 안걸린것: '없음', 꽉: true },
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
  // 📮 [08-18] *"**클립형태가 이쁘긴하다 딱 인덱스같고**"*
  //    🔍 32컷에서 «진짜 클립»은 셋뿐이다 — `ck_08`·`ck_28` 은 클립이 아니라 **매다는 고리**다(실물 확인).
  클립: [
    ['ck_27', '요리사모자＋클립'], ['ck_19', '클립＋하트'], ['ck_32', '숟가락＋클립'],
    ['ck_27', '요리사모자＋클립'], ['ck_19', '클립＋하트'], ['ck_32', '숟가락＋클립'],
  ],
}

// 🎬 찍을 판 = (놓는 방식 × 그림 묶음 × 격자)
const 찍기 = [
  ['G3-더안', '클립', 'big'], ['G3-더안', '클립', 'small'],
  ['G2-살짝안', '클립', 'big'],   // 견줄 것 하나
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
      // ⭐ 옆(right)과 위(top)를 «따로» 준다 — 「반쯤」의 방향이 갈래마다 다르다
      d.style.top = `${8 - (방식.위밖 ?? 방식.밖)}px`; d.style.right = `${8 - 방식.밖}px`
      // ⛔⛔ **`.fav-dot` 은 34×34 인데 그림은 «가운데»에 놓인다**(`align/justify: center`).
      //    28px 그림이면 좌우로 3px 씩 남아서, right 를 0 으로 맞춰도 그림은 3px 안쪽에 선다.
      //    ＋ 스티커 PNG 자체의 투명 여백까지 더해져 「오른쪽 끝인데 안 붙어 보이는」 착시가 난다.
      //    ⭐ `꽉` 일 땐 상자를 그림 크기로 줄여 **좌표와 그림이 어긋나지 않게** 한다.
      if (방식.꽉) { d.style.width = 'auto'; d.style.height = 'auto' }
      d.style.overflow = 'visible'
      if (!걸림 && 방식.안걸린것 === '없음') { d.innerHTML = ''; return }   // ⭐ 표시용 = 안 걸리면 텅 빈다
      const [키, 라벨, url] = 컷[걸린번호++ % 컷.length]
      const 흐림 = !걸림 && 방식.안걸린것 === '흐리게' ? ';opacity:.28' : ''
      // ⭐ `꽉` = 상자 여백을 없앤다 — 세로로 긴 컷은 `contain` 이면 좌우가 비어
      //    「오른쪽 끝에 맞췄는데 안쪽으로 들어가 보이는」 착시가 난다(창업자가 그걸 잡았다).
      //    높이만 28px 로 두고 폭은 그림 비율대로 → 그림이 진짜 오른쪽 끝에 붙는다.
      const 크기 = 방식.꽉
        ? `height:${방식.px}px;width:auto`
        : `width:${방식.px}px;height:${방식.px}px;object-fit:contain`
      d.innerHTML = `<img src="${url}" style="display:block;${크기}${방식.기울기 ? `;transform:rotate(${방식.기울기}deg)` : ''}${흐림}" alt="">`
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
  // 🔍 확대 — 「반은 안 반은 밖」이 진짜 반반인지는 **한 칸을 크게 봐야** 안다
  const 칸 = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.grid-card')]
      .find((x) => x.querySelector('.fav-dot')?.innerHTML.includes('<img'))
    if (!c) return null
    const r = c.getBoundingClientRect()
    return { x: Math.max(0, r.left - 26), y: Math.max(0, r.top - 26), width: r.width + 52, height: Math.min(r.height, r.width) + 52 }
  })
  if (칸) await page.screenshot({ path: join(OUT, `인덱스확대-${놓기이름}-${격자 === 'big' ? '큰격자' : '작은격자'}.png`), clip: 칸 })
  console.log(`   ✅ ${방식.설명} · ${묶음이름} · ${격자} — 카드 ${n}개 → ${파일}${칸 ? ' ＋확대' : ''}`)
}

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ 판 ${찍기.length}장 → ${OUT}\n`)

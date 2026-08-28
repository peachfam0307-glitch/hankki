// 🎬🎬 릴스 — 「인스타 캡처 → 공유 → 더보기 → 한끼 → 레시피 저장」 (2026-08-28)
//
// 📮 창업자 = *"이걸 **영상으로도** 만들어줘. 우리 우리앱에 공유해서 **레시피저장되는 것 까지.**
//    인스타 홍보용으로 **사람들은 릴스를 보더라고..**"*
//
// ⭐⭐ 어제 문서에 답이 이미 있었다(`docs/인스타-첫날-2026-08-26.md`) —
//    *"릴스 = 작품 ✗ / **움직이는 사용 설명서** ○"* · *"⚠️클로드가 «폰 화면 녹화»는 못 한다.
//     앱 화면을 **연속 캡처해 이어붙이는 것**은 된다"*
//    → 그래서 이 판은 **프레임을 한 장씩 그려 이어붙인다**(ffmpeg-static).
//
// 🎞 장면 여덟 — ⛔순서가 곧 설명이다
//    ① 인스타에서 레시피를 본다      ② 캡처하면 아래 띠가 뜬다 · 공유
//    ③ 공유 시트에서 더보기          ④ 앱 목록에서 한끼
//    ⑤ 담겼다(레시피 목록)           ⑥ 재료가 정리돼 있다
//    ⑦ 만드는 법까지                 ⑧ 「한끼에서 만나요」
//
// ⛔ 왜 ①~④ 가 «정지 캡처»인가 — 그건 안드로이드·인스타 화면이라 우리가 못 띄운다.
//    ⭐ 대신 **줌인 ＋ 동그라미 펄스**로 「지금 여기를 누른다」를 만든다. 정지 그림도 시선은 움직인다.
//    ⑤~⑦ 은 «우리 앱»이라 실제로 찍은 화면을 쓴다(`_shot-스토어용화면-0822.mjs` 가 찍어 둔 것).
//
// ⛔ 프레임마다 setContent 하면 «느리다»(168번 × 렌더). → 한 번 그리고 evaluate 로 «상태만» 바꾼다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_릴스-캡처공유저장-0828.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'

const SCR = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const OUT = `${SCR}/릴스0828`
const 프레임 = `${OUT}/f`
mkdirSync(프레임, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const 원본 = join(ROOT, 'design/promo/가져오기안내-원본캡처-2508')
const 앱화면 = `${SCR}/홍보/앱화면`

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 곰펭 = join(ROOT, 'src/assets/stickers/photo/gp_duoht.png')

// 🎞 FPS 는 «낮게» — 정지 그림에 줌만 얹으므로 12 로 충분하고, 프레임 수가 1/3 이라 빨리 뽑힌다
const FPS = 12

// ⭕ 하이라이트 = 원본 캡처 좌표 그대로(어제 실측). 화면 폭 1080 기준이라 그대로 쓴다.
//    ⛔ 공유시트는 «친구 줄 338px 을 잘라낸» 판이라 y 를 그만큼 올린다(2046 → 1708).
//
// 🔒🔒 창업자 지시 = *"영상만들때 **내 개인정보랑 친구목록은 다 지워줘야해**"*
//    → 그림 넷은 «반드시» 가린 판을 쓴다. ⛔가리지 않은 원본을 쓰면 영상에 개인정보가 그대로 들어간다.
//      · `2·3-가림` = 상단바(통신사·시각·알림 배지)를 아래 띠로 덮음
//      · `3-가림`   = ＋카톡 친구 3명 줄을 통째로 잘라냄(그래서 세로가 2002)
//      · `4-가림`   = 한끼 아이콘만 남기고 나머지 앱을 블러
//
// 🖼 s2 는 «합성판»이다 — `_판-인스타공유동그라미-0828.py` 가 만든다
//    📮 창업자 = *"만드는법을 캡쳐된 작은 상자가 가려."* (실물 확인 = 만드는 법 다섯 걸음이 가려졌다)
//    ⭐ 그래서 「깨끗판 ＋ 도구 띠만 오려 붙이기」로 만든다 — 도구 띠(＝「방금 캡처했다」는 신호)는 남고
//       그보다 위에 뜨는 캡처 썸네일 작은 상자는 안 딸려온다.
//    ⛔ 동그라미가 «구워지지 않은» 판을 쓴다 — 여기서는 맥박치게 그려야 한다.
// ⭕ 공유 단추 자리 = 합성판이 «계산해서 넘겨준 값»을 읽는다
//    ⛔ 손으로 옮겨 적지 않는다 — 원본이 바뀌면(인사이트 줄을 자르는 등) 자리가 밀리는데
//       그때 여기만 낡아서 동그라미가 엉뚱한 곳에 뜬다.
const 공유자리JSON = join(원본, '인스타-공유자리.json')
if (!existsSync(공유자리JSON)) {
  console.error('⛔ 공유 자리를 모른다 → 먼저 `python3 scripts/_판-인스타공유동그라미-0828.py` 를 돌린다')
  process.exit(1)
}
const { x: 공유x, y: 공유y, r: 공유r } = JSON.parse(readFileSync(공유자리JSON, 'utf8'))
const 공유자리 = [공유x, 공유y, 공유r]

// ⏱⏱ 창업자 = *"**너무 빠르게 지나가지 않게 강조 딱딱해서** 만들어줘"*
//    ⭐ 두 가지를 같이 한다 —
//      ⑴ **길게**: 누를 자리를 보여주는 장면(⭕있는 셋)을 제일 길게 준다. 14.3초 → 20초 안팎.
//      ⑵ **멈춤**: 줌을 앞쪽에서 «끝내고» 뒤는 세워 둔다. 내내 움직이면 눈이 어디서 멈출지 모른다.
//         → `멈춤` 값 = 그 장면의 뒤 몇 할을 정지로 둘 것인가.
const 장면들 = [
  // 🪝🪝 첫 장 = 훅. 📮창업자 = *"첫장에 시선을 끌 한장이 필요해"* · *"쌓아둔 레시피 많은거를.."*
  //    ⭐ 릴스는 첫 1초가 전부다 — 스크롤을 멈추게 못 하면 나머지 20초는 아무도 안 본다.
  //       「많다」는 정지 그림으로 전달이 약한데 **흘러가면** 한 번에 읽힌다.
  //    🛠 재료 = `_shot-목록훅-0828.mjs` 가 스크롤 자리를 달리해 찍은 여섯 장
  {
    id: 's0',
    그림들: 'abcdef'.split('').map((c) => `${앱화면}/28${c}-목록훅.png`),
    초: 2.0, 자막: '이거 다 <b>캡처</b>로 담은 거예요', 줌: [1.04, 1.0], 초점: [540, 900], 멈춤: 0.22, 큰자막: true,
  },
  { id: 's1', 그림: `${원본}/2-인스타-깨끗-가림.png`, 초: 2.0, 자막: '인스타에서 본 레시피', 줌: [1.0, 1.06], 초점: [540, 820], 멈춤: 0.30 },
  { id: 's2', 그림: `${원본}/인스타-도구띠-합성.png`, 초: 2.9, 자막: '캡처하면 아래에 <b>공유</b>', 동그라미: 공유자리, 줌: [1.05, 1.5], 초점: [공유자리[0], 공유자리[1] - 46], 멈춤: 0.48 },
  { id: 's3', 그림: `${원본}/3-공유시트-가림.png`, 초: 2.9, 자막: '한끼가 안 보이면 <b>더보기</b>', 동그라미: [907, 1708, 106], 줌: [1.0, 1.45], 초점: [907, 1700], 멈춤: 0.48 },
  { id: 's4', 그림: `${원본}/4-앱목록-가림.png`, 초: 2.7, 자막: '<b>한끼</b>를 누르면', 동그라미: [412, 478, 112], 줌: [1.0, 1.5], 초점: [412, 520], 멈춤: 0.48 },
  // ⭐ 초점을 「공심채 볶음」 카드에 맞춘다 — 자막(bottom 290px)이 그 이름표를 덮으면
  //    「무엇이 담겼는지」가 안 읽혀서 앞 장면들과 흐름이 끊긴다(창업자가 잡은 그 자리).
  { id: 's5', 그림: `${앱화면}/20-레시피목록.png`, 초: 2.4, 자막: '레시피가 담겼어요', 줌: [1.06, 1.0], 초점: [540, 960], 멈춤: 0.36 },
  { id: 's6', 그림: `${앱화면}/21-상세-재료순서.png`, 초: 2.8, 자막: '재료가 알아서 정리돼요', 줌: [1.0, 1.08], 초점: [540, 900], 멈춤: 0.36 },
  { id: 's7', 그림: `${앱화면}/22-상세-만드는법.png`, 초: 2.6, 자막: '만드는 법까지', 줌: [1.0, 1.08], 초점: [540, 900], 멈춤: 0.36 },
]

// 🖼 장면은 그림 «하나»(`그림`) 이거나 «여러 장을 넘기는 것»(`그림들`)이다
const 그림목록 = (s) => s.그림들 ?? [s.그림]
for (const s of 장면들) {
  for (const g of 그림목록(s)) {
    if (!existsSync(g)) { console.error('⛔ 재료가 없다 →', g); process.exit(1) }
  }
}

const IMG = Object.fromEntries(장면들.map((s) => [s.id, 그림목록(s).map(b64)]))
const IMG곰펭 = b64(곰펭)

// 📐 9:16 = 1080×1920. 폰 캡처(1080×2340)는 세로가 더 길어 «가운데를 채워» 쓴다.
const HTML = `<!doctype html><meta charset="utf-8"><style>
${폰트}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#fbf0e0}
#stage{position:absolute;inset:0;overflow:hidden}
#shot{position:absolute;left:50%;top:50%;width:1080px;transform-origin:center center;display:block}
/* ⭕ 누르는 자리 — 그림과 «같은 좌표계»에 얹어야 줌을 따라간다
   ⭐ 16px = 「강조 딱딱」(창업자). 밝은 화면에서도 획이 끊겨 보이지 않는 굵기 */
#ring{position:absolute;border:16px solid #d63c3c;border-radius:50%;box-sizing:border-box;display:none;
  box-shadow:0 0 0 4px rgba(255,255,255,.55), 0 6px 20px rgba(150,20,20,.28)}
/* 🏷 자막 — 릴스는 소리 없이 본다. 글자가 커야 한다
   ⛔⛔ 그림자만으로는 «앱 화면 글자» 위에서 안 읽힌다 — s5~s7 은 바탕이 크림색에 검은 글씨라
      흰 자막이 재료 목록과 겹쳐 뭉갰다(확인판으로 봤다). → 진한 «알약»을 깔아 바탕과 끊는다.
   📐 bottom 290px = 인스타 릴스 하단 UI(좋아요·댓글·캡션)가 덮는 자리를 피한다 */
#cap{position:absolute;left:0;right:0;bottom:290px;text-align:center;z-index:9;
  font-family:'Jua','Gowun Dodum',system-ui,sans-serif;font-size:68px;letter-spacing:-0.02em}
#cap .pill{display:inline-block;max-width:1000px;padding:20px 44px;border-radius:999px;
  background:rgba(52,26,6,.86);color:#fffdf8;white-space:nowrap;
  box-shadow:0 16px 44px rgba(40,20,4,.38)}
#cap b{color:#ffd98a}
/* 🪝 첫 장(훅)은 더 크게 — 스크롤을 멈추게 하는 게 일이다 */
#cap.big{font-size:80px;bottom:250px}
#cap.big .pill{padding:24px 50px}
#capbg{position:absolute;left:0;right:0;bottom:0;height:660px;z-index:8;
  background:linear-gradient(to top,rgba(60,30,8,.46),rgba(60,30,8,0))}
/* 🐻🐧 아웃트로 */
#outro{position:absolute;inset:0;display:none;z-index:20;background:#f7e6d2;
  flex-direction:column;align-items:center;justify-content:center;gap:40px}
#outro img{width:520px;filter:drop-shadow(0 18px 34px rgba(93,52,16,.22))}
#outro .t{font-family:'Jua',sans-serif;color:#5d3410;font-size:92px;line-height:1.34;text-align:center;letter-spacing:-0.02em}
#outro .s{font-family:'Jua',sans-serif;color:#c2703a;font-size:52px;letter-spacing:-0.01em}
</style>
<div id="stage">
  <img id="shot">
  <div id="ring"></div>
  <div id="capbg"></div>
  <div id="cap"></div>
</div>
<div id="outro"><img src="${IMG곰펭}"><div class="t">캡처만 하면<br>레시피가 정리돼요</div><div class="s">한끼에서 만나요</div></div>`

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await p.setContent(HTML)
await p.evaluate(() => document.fonts.ready)
await p.addScriptTag({
  content: `
window.__그리기 = (o) => {
  const st = document.getElementById('stage')
  const shot = document.getElementById('shot')
  const ring = document.getElementById('ring')
  document.getElementById('outro').style.display = o.outro ? 'flex' : 'none'
  st.style.display = o.outro ? 'none' : 'block'
  if (o.outro) return
  if (shot.src !== o.src) shot.src = o.src
  // 🏷 자막은 «알약»으로 감싼다 — 앱 화면 글자 위에서 그림자만으론 안 읽힌다
  const cap = document.getElementById('cap')
  cap.className = o.big ? 'big' : ''   // 🪝 첫 장(훅)만 더 크게
  cap.innerHTML = o.cap ? '<span class="pill">' + o.cap + '</span>' : ''
  // 📐 초점(fx,fy)이 화면 가운데로 오도록 옮기고 z 배로 키운다 — 그림 좌표 그대로 쓴다
  const z = o.z
  shot.style.transform = 'translate(-50%,-50%) scale(' + z + ')'
  shot.style.left = (540 + (540 - o.fx) * z) + 'px'
  shot.style.top  = (960 + (o.imgH/2 - o.fy) * z) + 'px'
  if (o.ring) {
    const [cx, cy, r] = o.ring
    const sx = 540 + (cx - o.fx) * z
    const sy = 960 + (cy - o.fy) * z
    const R = r * z * o.pulse
    ring.style.display = 'block'
    ring.style.left = (sx - R) + 'px'
    ring.style.top = (sy - R) + 'px'
    ring.style.width = ring.style.height = (R * 2) + 'px'
    ring.style.opacity = o.ringOp
  } else ring.style.display = 'none'
}`,
})

// 📏 그림마다 세로 길이가 다르다(폰 2340 · 잘라낸 시트 2002) → 실제 값을 읽어 초점 계산에 쓴다
//    ⭐ 여러 장을 넘기는 장면은 «같은 화면을 굴려 찍은 것»이라 첫 장 하나만 재면 된다
const 높이 = {}
for (const s of 장면들) {
  높이[s.id] = await p.evaluate((src) => new Promise((r) => {
    const i = new Image(); i.onload = () => r(i.naturalHeight * (1080 / i.naturalWidth)); i.src = src
  }), IMG[s.id][0])
}

const 부드럽게 = (t) => t * t * (3 - 2 * t) // ease-in-out
let n = 0
const 찍기 = async (o) => {
  await p.evaluate((x) => window.__그리기(x), o)
  await p.screenshot({ path: join(프레임, String(n).padStart(4, '0') + '.png') })
  n++
}

// 🔎 장면마다 «가운데 프레임» 번호를 적어 둔다 — 확인판을 손으로 세지 않으려고(장면 길이가 바뀌면 어긋난다)
const 가운데 = []

for (const s of 장면들) {
  const 컷수 = Math.round(s.초 * FPS)
  가운데.push({ id: s.id, f: n + Math.floor(컷수 / 2) })
  const 멈춤 = s.멈춤 ?? 0.3
  for (let i = 0; i < 컷수; i++) {
    // ⏱ 줌을 앞쪽에서 «끝내고» 뒤는 세워 둔다 — 내내 움직이면 눈이 멈출 자리가 없다
    const 진행 = i / Math.max(1, 컷수 - 1)
    const t = 부드럽게(Math.min(1, 진행 / (1 - 멈춤)))
    const z = s.줌[0] + (s.줌[1] - s.줌[0]) * t
    // ⭕ 동그라미 = 「탁」 하고 크게 나타났다 제자리로 ＋ 잔잔한 맥박
    //    ⭐ 등장을 세게 준 이유 = 정지 그림이라 «나타나는 순간»이 없으면 있는 줄도 모른다.
    const 초 = i / FPS
    const 등장 = 초 < 0.30 ? 1 + 0.55 * (1 - 초 / 0.30) ** 2 : 1
    const 맥 = s.동그라미 ? 등장 * (1 + 0.085 * Math.sin(초 * Math.PI * 2.4)) : 1
    // 🪝 여러 장을 넘기는 장면 — 「멈춤」 구간에 닿기 «전»에 다 넘겨서 마지막 장에 눈이 머물게 한다
    const 장 = IMG[s.id].length
    const 몇번째 = 장 === 1 ? 0 : Math.min(장 - 1, Math.floor((진행 / Math.max(0.01, 1 - 멈춤)) * 장))
    await 찍기({
      src: IMG[s.id][몇번째], cap: s.자막, z, fx: s.초점[0], fy: s.초점[1], imgH: 높이[s.id],
      ring: s.동그라미 || null, pulse: 맥, ringOp: 1, big: !!s.큰자막,
    })
  }
}
// ⑧ 아웃트로 — 마지막 글자를 읽을 시간을 준다(창업자 = *"너무 빠르게 지나가지 않게"*)
const 아웃트로컷 = Math.round(2.6 * FPS)
가운데.push({ id: '아웃트로', f: n + Math.floor(아웃트로컷 / 2) })
for (let i = 0; i < 아웃트로컷; i++) await 찍기({ outro: true })

console.log(`🎞 프레임 ${n}장 (${(n / FPS).toFixed(1)}초)`)

// 🔎🔎 확인판 — 창업자에게 보내기 «전»에 내가 눈으로 본다(절대원칙 21)
//    ⛔ 프레임 번호를 손으로 세지 않는다. 위 `가운데` 가 장면 길이에서 저절로 나온다.
// ⛔ `setContent` 로 그리면 «그림이 안 뜬다» — 그 페이지는 `about:blank` 라 `file://` 이 막힌다.
//    (2026-08-28 실제로 텅 빈 판이 나왔고 절대원칙 21 덕에 잡았다)
//    → HTML 을 «프레임 폴더 안»에 써서 `goto` 로 연다. 그러면 상대경로 그림이 그대로 뜬다.
const 확인 = join(OUT, '_확인-장면.png')
const 확인HTML = join(프레임, '_확인.html')
const 칸 = 가운데
  .map(({ id, f }) => `<div class="c"><img src="${String(f).padStart(4, '0')}.png"><b>${id}</b></div>`)
  .join('')
writeFileSync(
  확인HTML,
  `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#faf6ee;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px;
  font-family:system-ui,sans-serif}
.c{position:relative}.c img{width:100%;display:block;border-radius:8px}
.c b{position:absolute;left:8px;top:8px;background:rgba(52,26,6,.86);color:#fffdf8;
  font-size:22px;padding:4px 12px;border-radius:999px}
</style>${칸}`,
)
await p.setViewportSize({ width: 1600, height: 1200 })
await p.goto('file://' + 확인HTML)
await p.waitForTimeout(600)
// 🔒 스스로 검사 — 그림이 진짜 떴나(안 뜨면 텅 빈 판을 「만들었다」고 넘긴다)
const 안뜬것 = await p.evaluate(() =>
  [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')),
)
if (안뜬것.length) { console.error('⛔ 확인판 그림이 안 떴다 →', 안뜬것); process.exit(1) }
await p.screenshot({ path: 확인, fullPage: true })
console.log(`🔎 확인판 → ${확인}`)

await br.close()

// 🎬 이어붙이기 — ⛔yuv420p 를 안 주면 인스타·카톡에서 «안 열리는» 폰이 있다
const mp4 = join(OUT, '한끼-릴스-캡처공유저장-2026-08-28.mp4')
execFileSync(ffmpeg, [
  '-y', '-framerate', String(FPS), '-i', join(프레임, '%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30',
  '-vf', 'scale=1080:1920:flags=lanczos', '-movflags', '+faststart', mp4,
], { stdio: 'inherit' })
writeFileSync(join(OUT, '_장면.txt'), 장면들.map((s) => `${s.id} ${s.초}s ${s.자막.replace(/<[^>]+>/g, '')}`).join('\n') + '\n아웃트로 2.0s')
console.log(`\n🎬 ${mp4}`)

// 🎬🍂 **패드 «가로» 두 장을 릴스 한 칸에 — 스크랩북 옷** (2026-09-04)
//
// 📮 창업자 = *"패드버전으로 스토어스샷같은 소개만들고 그걸로 릴스1번 … 우리ui를 바로 보여주는게 조회수가 낫더라고"*
//    ＋ *"똑같이 만들면 재미없으니까 레이아웃을 다르게 하면 좋겠엉"*
//    ＋ *"아 세로가 아니라 «가로» 버전이지"* → *"아하!! 좋은 생각이야"*
//    ＋ *"거의 꽉차게 해야 잘보이고 좋긴해"*  ← ⓑ꽉 확정
//    ＋ *"제목같은거 위에 적어야하지 않을까. 스샷처럼. 너무 밋밋한데.. 레이아웃도 없고 그냥 두장 붙인거라.."*
//    ＋ *"집 스타일 똑같이 하지말자 디자인을 좀 바꾸자... **바탕이나 이런거 좀 다르게** 하자"*
//
// ⭐⭐ **왜 «두 장»인가 — 숫자가 그렇게 생겼다.**
//    🔢 패드 가로 **1280×800(16:10)** → 릴스 폭 1080 에 맞추면 **1080×675** = 릴스의 3분의 1뿐.
//       그런데 **두 장이면 1350** 이고 릴스 안전지대(1920 − 위 230 − 아래 384 = **1306**)에 거의 딱 맞는다.
//       16:10 을 둘 쌓으면 9:16 이 된다 — 우연이 아니라 비율이 그렇다.
//    ✅ 그래서 자를 것도 «채울» 것도 없다. 2026-09-03 에 빈자리를 채우려다 세 판 헛돈 함정을 피한다.
//
// 🎨 **스토어 스샷과 «다른 옷»** (창업자가 두 번 짚었다)
//    | | 스토어 스샷(2508) | 이 릴스 |
//    |---|---|---|
//    | 바탕 | 파스텔 ＋ 흰 점무늬 | **가을 크라프트 종이 ＋ 결·얼룩** |
//    | 제목 | 가운데 · 큼 · Jua | **왼쪽 · 손글씨(나눔펜) ＋ 마스킹테이프** |
//    | 화면 | 한 장 크게 | **두 장을 종이에 «붙인» 것처럼** |
//    ⛔ 가을 «친구 스티커»는 안 붙인다 — 2026-09-03 창업자 = *"스티커는 다 빼자"* · *"너무 지저분해보여"*
//       종이·테이프·손글씨는 «판 디자인»이지 스티커가 아니다. 거기까지만 쓴다.
//    ⛔ 화면을 기울이지 않는다 — 창업자가 원하는 건 «UI 가 잘 보이는 것»이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-패드두장-0904.mjs
import { readdirSync, mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { join } from 'node:path'

const 찍은곳 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드릴스'
const 낼곳 = join(찍은곳, '두장쌓기')
mkdirSync(낼곳, { recursive: true })
const APP = new URL('..', import.meta.url).pathname
const 폰트 = (이름) => readFileSync(join(APP, 'design/promo/fonts', 이름)).toString('base64')
const 펜 = 폰트('nanumpen-korean-400.woff2')
const 주아 = 폰트('jua-korean-400.woff2')

// 🎞 릴스에 넣을 차례 — «흐름»으로 짝짓는다(아무거나 둘씩 묶지 않는다)
//    ⭐ 위/아래가 «한 이야기»라야 한 칸으로 읽힌다. 제목은 그 이야기를 한 줄로 말한다.
// ⛔⛔ [2026-09-04 · 창업자가 잡았다] **쪽지에 «내 앱에만 참인 값»을 쓰지 않는다.**
//    📮 창업자 = *"260편은 내 앱만.. 되는건데"* — 맞다.
//    🔢 그 숫자는 창업자 백업의 편수다. **새로 깐 사람은 시드 65편만 본다.**
//       홍보물에 「260편」이라 써 붙이면 **「깔면 260편이 들어있대」**로 읽힌다 — 과장이고 거짓말이 된다.
//    ✅ 그래서 쪽지는 **«기능 이름»만** 쓴다(레꾸·일기·장보기·냉장고처럼). 숫자·개수는 안 쓴다.
//    ⚠️ 앱 «화면 안»에 260 이 보이는 건 실물이라 그대로 둔다 — 「이만큼 담긴다」로 읽히지
//       「이만큼 들어있다」로는 안 읽힌다. 문제는 **내가 덧붙인 문구**였다.
// 📱📱 **패드인 걸 «강조»한다** — 📮 창업자 = *"패드인거 강조해줘! 우리앱은 패드에서 쓸수있고
//    꼬르곰 펭펭이 **더 크고 더 귀엽다**고 ㅋㅋ"*
//    ⭐ 그래서 카피의 «축»을 바꿨다 — 기능 설명이 아니라 **「패드에서 보면 이렇다」**로.
//    ⭐ 요리모드는 패드 자랑과 «딱» 맞는 장면이다(불 앞에서 멀리서 보는 화면) — 창업자가 꼭 넣으라 했다.
//    ⛔ 「더 크고 귀엽다」를 «숫자»로 말하지 않는다 — 재본 적 없는 값을 지어내는 것이 된다.
const 짝 = [
  { 이름: 'R1-1', 위: '1-02-요리책', 아래: '1-03-상세', 제목: '패드로 보면', 제목2: '한 판에 다 보여요', 쪽지: '패드' },
  { 이름: 'R1-2', 위: '1-04-레꾸', 아래: '1-06-레꾸자랑', 제목: '꼬르곰·펭펭이', 제목2: '이만큼 커져요', 쪽지: '레꾸' },
  { 이름: 'R1-3', 위: '1-07-요리모드-재료', 아래: '1-08-요리모드-걸음', 제목: '불 앞에서도', 제목2: '멀리서 보여요', 쪽지: '요리모드' },
  { 이름: 'R1-4', 위: '1-05-일기', 아래: '1-01-홈', 제목: '한 끼가 쌓이면', 제목2: '한 해가 돼요', 쪽지: '일기' },
  { 이름: 'R2-1', 위: '2-01-장보기', 아래: '2-02-장바구니', 제목: '담기만 하면', 제목2: '장보기 끝', 쪽지: '장보기' },
  { 이름: 'R2-2', 위: '2-04-냉장고', 아래: '2-03-장바구니-더', 제목: '냉장고에', 제목2: '뭐 있더라?', 쪽지: '냉장고' },
]

const 있는것 = new Set(readdirSync(찍은곳).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)))
const 없는것 = 짝.flatMap((s) => [s.위, s.아래]).filter((n) => !있는것.has(n))
if (없는것.length) {
  // ⛔ 조용히 건너뛰지 않는다 — 빠진 채로 만들면 「됐다」고 말하게 된다
  console.log(`⛔ 찍힌 장이 없다: ${없는것.join(' · ')}`)
  console.log('   먼저 = BACKUP=<백업.json> node scripts/_shot-패드릴스-0904.mjs')
  process.exit(1)
}

// 📐 릴스 1080×1920 · 안전지대 = 위 230 · 아래 384 를 뺀 1306
//    제목 자리를 위에 두고, 화면 두 장은 그 아래로. 아래 장은 «아래로 흘러나가게» 둔다 —
//    ⭐ 스토어 스샷이 폰을 아래로 흘려 「더 있다」를 만든 것과 같은 수법인데, 여기선 «가로 두 장»이라 결이 다르다.
const W = 1920 * 9 / 16, H = 1920
const 장폭 = 1040
const 장높 = Math.round(장폭 * 800 / 1280)   // 650
const 사이 = 22
const 글머리 = 258                            // 위덮임 230 바로 아래
const 판시작 = 470
console.log(`📐 한 칸 ${장폭}×${장높} · 둘 ${장높 * 2 + 사이} · 시작 ${판시작} → 끝 ${판시작 + 장높 * 2 + 사이}`)

const 그림 = (n) => `data:image/png;base64,${readFileSync(join(찍은곳, n + '.png')).toString('base64')}`

const 판 = (s) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Pen';src:url(data:font/woff2;base64,${펜}) format('woff2');}
@font-face{font-family:'Jua';src:url(data:font/woff2;base64,${주아}) format('woff2');}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;position:relative;
  /* 🍂 가을 크라프트 종이 — 스토어 스샷의 «파스텔 ＋ 점무늬»와 확실히 다른 바탕 */
  background:
    radial-gradient(ellipse at 18% 12%, rgba(255,246,228,.85), transparent 55%),
    radial-gradient(ellipse at 82% 78%, rgba(214,180,140,.45), transparent 60%),
    linear-gradient(168deg,#e8d9c0 0%,#dfcaab 46%,#d3b894 100%);}
/* 종이 «결» — 아주 얇은 세로 섬유 */
.grain{position:absolute;inset:0;opacity:.5;
  background-image:repeating-linear-gradient(96deg, rgba(120,90,55,.055) 0 2px, transparent 2px 6px),
                   repeating-linear-gradient(4deg, rgba(255,255,255,.05) 0 3px, transparent 3px 9px);}
/* 종이 «얼룩» — 오래된 노트 느낌 */
.stain{position:absolute;inset:0;
  background-image:radial-gradient(circle at 12% 62%, rgba(150,110,60,.10), transparent 26%),
                   radial-gradient(circle at 88% 28%, rgba(150,110,60,.08), transparent 24%);}
.cap{position:absolute;left:78px;top:${글머리}px;width:${W - 200}px;}
/* 🩹 마스킹테이프 — 제목 위에 살짝 기울여 */
.tape{position:absolute;left:-14px;top:-46px;width:196px;height:52px;transform:rotate(-4.5deg);
  background:linear-gradient(180deg, rgba(196,150,96,.62), rgba(176,130,78,.55));
  border-left:2px dashed rgba(120,85,45,.35);border-right:2px dashed rgba(120,85,45,.35);
  box-shadow:0 3px 8px rgba(90,60,25,.18);}
h1{font-family:'Pen';font-size:104px;line-height:1.02;color:#4a2c11;letter-spacing:-.5px;
  text-shadow:0 2px 0 rgba(255,250,238,.55);}
h1 em{font-style:normal;color:#8a4a1c;}
.note{position:absolute;right:74px;top:${글머리 - 24}px;font-family:'Jua';font-size:34px;color:#6a4520;
  background:rgba(255,250,238,.82);padding:10px 22px;border-radius:999px;transform:rotate(3deg);
  box-shadow:0 6px 14px rgba(90,60,25,.16);}
.wrap{position:absolute;left:${(W - 장폭) / 2}px;top:${판시작}px;}
.shot{width:${장폭}px;height:${장높}px;border-radius:20px;display:block;object-fit:cover;
  box-shadow:0 22px 44px rgba(70,45,18,.34), 0 2px 0 rgba(255,252,244,.8);}
.shot+.shot{margin-top:${사이}px;}
</style></head><body>
<div class="grain"></div><div class="stain"></div>
<div class="note">${s.쪽지}</div>
<div class="cap"><div class="tape"></div><h1>${s.제목}<br><em>${s.제목2}</em></h1></div>
<div class="wrap"><img class="shot" src="${그림(s.위)}"><img class="shot" src="${그림(s.아래)}"></div>
</body></html>`

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: W, height: H } })
for (const s of 짝) {
  await p.setContent(판(s), { waitUntil: 'load' })
  await p.waitForTimeout(400)
  await p.screenshot({ path: join(낼곳, s.이름 + '.png') })
  console.log(`  ✅ ${s.이름}  「${s.제목} ${s.제목2}」  (${s.위} ＋ ${s.아래})`)
}
await b.close()
console.log(`\n📁 ${낼곳}`)
console.log('⭐ 규칙 21 — 이제 «열어서» 보고 판정한다. 숫자로는 「예쁜가」를 못 잰다.')

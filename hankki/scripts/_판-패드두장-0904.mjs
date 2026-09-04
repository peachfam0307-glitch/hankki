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
const 고운 = 폰트('gowun-dodum-korean-400.woff2')

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
// 🍑🌿 **바탕 색 — 릴스마다 «다르게»** (창업자 2026-09-04)
//    📮 *"가을이니까 **살구색** 배경으로 바꿔줘. 릴스"* ＋ *"집이랑 배경은 **릴스1이랑 다르게** 바꿔줘"*
//    ⭐ 그래서 릴스① = 살구 · 릴스② = 세이지(가을 잎 그늘색). 둘 다 가을이지만 한눈에 갈린다.
//    ⛔ 스토어 스샷의 파스텔＋점무늬는 안 쓴다 — 창업자가 두 번 「똑같이 하지 말자」고 했다.
const 바탕 = {
  살구: `radial-gradient(ellipse at 18% 12%, rgba(255,241,224,.9), transparent 55%),
         radial-gradient(ellipse at 82% 78%, rgba(226,158,106,.42), transparent 60%),
         linear-gradient(168deg,#f7ddc2 0%,#f0c8a3 46%,#e6b184 100%)`,
  세이지: `radial-gradient(ellipse at 20% 14%, rgba(245,247,236,.9), transparent 55%),
           radial-gradient(ellipse at 80% 80%, rgba(140,158,118,.40), transparent 60%),
           linear-gradient(168deg,#e4e9d6 0%,#d3ddc0 46%,#bfcda6 100%)`,
}
const 글씨색 = { 살구: ['#5a3113', '#a4521b'], 세이지: ['#2f3a24', '#5a7038'] }
const 테이프색 = { 살구: ['rgba(214,160,104,.62)', 'rgba(192,136,80,.55)'], 세이지: ['rgba(160,176,132,.62)', 'rgba(136,154,108,.55)'] }

// 🎨🎨 **릴스 ① 과 ② 는 «옷이 통째로» 다르다** (창업자 2026-09-04)
//    📮 *"릴스 2 릴스 1이랑 **배경 색 다른게 없는 것 같아. 완전 다른 스타일이 나와야지.**"*
//    ⛔ 맞는 지적이다 — 그 전엔 **바탕색만 살구/세이지로 갈랐고** 짜임·글씨·화면 테두리가 전부 같았다.
//       바탕색 둘 다 «밝은 파스텔»이라 인스타 피드에서 나란히 걸리면 한 릴스로 읽힌다.
//    ✅ 그래서 **명도부터 뒤집는다** — ①은 밝은 살구 종이, ②는 **짙은 숲**. 그리고 다섯을 다 갈랐다:
//       | | 릴스① 스크랩북 | 릴스② 살림노트 |
//       |---|---|---|
//       | 바탕 | 살구 크라프트 종이 ＋ 결·얼룩 | **짙은 숲 ＋ 옅은 모눈** |
//       | 글씨 | 나눔펜 «손글씨» 104px 갈색 | **고운돋움 «정자» 92px 크림** |
//       | 제목 장식 | 마스킹테이프 | **큰 번호(01~06) ＋ 금빛 밑줄** |
//       | 곁말 | 오른쪽 둥근 «알약» 쪽지 | **네모 «태그»(테두리만)** |
//       | 화면 | 종이에 «붙인» 듯 둥근 모서리 | **크림 카드 «위에 얹은» 각진 모서리** |
//    ⭐ 번호를 쓴 이유 = 릴스②는 **차례가 곧 내용**이다(담기 → 고르기 → 사기 → 채우기 → 찍기 → 꺼내기).
//       ①은 「이런 게 있어요」라 차례가 없다. 그래서 ①엔 번호를 안 붙인다.
const 짝 = [
  { 이름: 'R1-1', 옷: '살구', 위: '1-02-요리책', 아래: '1-03-상세', 제목: '패드로 보면', 제목2: '한 판에 다 보여요', 쪽지: '패드' },
  { 이름: 'R1-2', 옷: '살구', 위: '1-04-레꾸', 아래: '1-06-레꾸자랑', 제목: '꼬르곰·펭펭이', 제목2: '이만큼 커져요', 쪽지: '레꾸' },
  { 이름: 'R1-3', 옷: '살구', 위: '1-07-요리모드-재료', 아래: '1-08-요리모드-걸음', 제목: '불 앞에서도', 제목2: '멀리서 보여요', 쪽지: '요리모드' },
  { 이름: 'R1-4', 옷: '살구', 위: '1-11-레꾸-프레임', 아래: '1-11-레꾸-데코', 제목: '붙일 게', 제목2: '이만큼 많아요', 쪽지: '꾸미기' },
  { 이름: 'R1-5', 옷: '살구', 위: '1-05-일기', 아래: '1-12-일기-속지', 제목: '틀도 골라서', 제목2: '내 맘대로', 쪽지: '속지' },
  { 이름: 'R1-6', 옷: '살구', 위: '1-10-일기-틀', 아래: '1-01-홈', 제목: '한 끼가 쌓이면', 제목2: '한 해가 돼요', 쪽지: '한끼일기' },
  // ── 릴스 ② 살림노트 (짙은 숲 · 번호 있음) ──────────────────
  { 이름: 'R2-1', 옷: '숲', 번호: '01', 위: '2-01-장보기', 아래: '2-02-장바구니', 제목: '필요한 걸 담으면', 제목2: '장보기 끝', 쪽지: '장보기' },
  { 이름: 'R2-2', 옷: '숲', 번호: '02', 위: '2-08-큐레이션-갈래', 아래: '2-09-큐레이션-제품', 제목: '주부가 골라 둔 걸', 제목2: '갈래별로', 쪽지: '큐레이션' },
  { 이름: 'R2-3', 옷: '숲', 번호: '03', 위: '2-10-큐레이션-더', 아래: '2-03-장바구니-더', 제목: '사러가기까지', 제목2: '한 자리에서', 쪽지: '사러가기' },
  { 이름: 'R2-4', 옷: '숲', 번호: '04', 위: '2-04-냉장고', 아래: '2-06-재료담기', 제목: '유통기한까지', 제목2: '적어 둬요', 쪽지: '냉장고' },
  { 이름: 'R2-5', 옷: '숲', 번호: '05', 위: '2-07-영수증자리', 아래: '2-04-냉장고', 제목: '영수증 찍으면', 제목2: '냉장고로 쏙', 쪽지: '영수증' },
  { 이름: 'R2-6', 옷: '숲', 번호: '06', 위: '2-05-냉장고-아래', 아래: '2-01-장보기', 제목: '있는 걸로', 제목2: '뭐 해먹지', 쪽지: '살림' },
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

// 🌲🌲 **릴스 ② — 「살림노트」 판** (2026-09-04 · 창업자 = *"완전 다른 스타일이 나와야지"*)
//    ⭐ 위 표의 다섯을 코드로 옮긴 것이다. ⛔릴스① 판(`판()`)을 손대지 않는다 — 창업자가 그건 *"좋앙"* 했다.
//    📐 자리 = 화면을 «크림 카드»가 감싸므로 화면이 그만큼 작아진다(1040 → 990).
//       🔢 990 × 800/1280 = 619 · 카드 = 990+15×2 = 1020 × 649 · 둘 ＋ 사이 26 = **1324**
//          → 릴스①(1322)과 «같은 높이»라 안전지대 판정이 그대로 간다(창업자가 이미 확정한 값).
const 장폭2 = 990
const 장높2 = Math.round(장폭2 * 800 / 1280)
const 여백2 = 15
const 사이2 = 26
const 판2 = (s) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Gowun';src:url(data:font/woff2;base64,${고운}) format('woff2');}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;position:relative;
  /* 🌲 짙은 숲 — 릴스①(밝은 살구)과 «명도»부터 뒤집는다. 가을 저녁 색이라 계절도 안 어긋난다 */
  background:
    radial-gradient(ellipse at 22% 6%, rgba(126,158,124,.30), transparent 58%),
    radial-gradient(ellipse at 88% 94%, rgba(11,24,19,.62), transparent 64%),
    linear-gradient(163deg,#263a30 0%,#1b2a24 52%,#121e19 100%);}
/* 🔲 옅은 «모눈» — 살림 노트의 결. ①의 종이 «섬유»와 완전히 다른 무늬다 */
.grid{position:absolute;inset:0;opacity:.85;
  background-image:repeating-linear-gradient(0deg, rgba(232,240,222,.052) 0 1px, transparent 1px 48px),
                   repeating-linear-gradient(90deg, rgba(232,240,222,.052) 0 1px, transparent 1px 48px);}
/* 🔢 큰 번호 — 차례가 곧 내용이라 번호가 «정보»다(장식이 아니다) */
.no{position:absolute;right:64px;top:${글머리 - 86}px;font-family:'Gowun';font-size:196px;
  line-height:1;color:rgba(232,240,222,.085);letter-spacing:-.04em;}
.cap2{position:absolute;left:70px;top:${글머리}px;width:${W - 220}px;}
.bar{width:96px;height:7px;border-radius:4px;background:linear-gradient(90deg,#e8b866,#c98f45);margin-bottom:26px;}
.cap2 h1{font-family:'Gowun';font-size:88px;line-height:1.16;color:#f3efe2;letter-spacing:-1.5px;}
.cap2 h1 em{font-style:normal;color:#e8b866;}
/* 🏷 네모 «태그» — ①의 둥근 알약 쪽지와 모양이 반대다 */
.tag{position:absolute;left:70px;top:${글머리 + 232}px;font-family:'Gowun';font-size:30px;color:#e8b866;
  border:2px solid rgba(232,184,102,.5);padding:8px 22px;border-radius:5px;letter-spacing:.09em;}
.wrap2{position:absolute;left:${(W - (장폭2 + 여백2 * 2)) / 2}px;top:${판시작}px;}
/* 🗂 크림 «카드» 위에 화면을 얹는다 — ①은 종이에 붙인 듯 둥글었고, 여기선 각지게 */
.card{background:#f4efe3;padding:${여백2}px;border-radius:14px;
  box-shadow:0 26px 52px rgba(0,0,0,.46), 0 0 0 1px rgba(255,255,255,.06);}
.card+.card{margin-top:${사이2}px;}
.card img{width:${장폭2}px;height:${장높2}px;border-radius:7px;display:block;object-fit:cover;}
</style></head><body>
<div class="grid"></div>
<div class="no">${s.번호 || ''}</div>
<div class="cap2"><div class="bar"></div><h1>${s.제목}<br><em>${s.제목2}</em></h1></div>
<div class="tag">${s.쪽지}</div>
<div class="wrap2">
  <div class="card"><img src="${그림(s.위)}"></div>
  <div class="card"><img src="${그림(s.아래)}"></div>
</div>
</body></html>`

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: W, height: H } })
for (const s of 짝) {
  await p.setContent(s.옷 === '숲' ? 판2(s) : 판(s), { waitUntil: 'load' })
  await p.waitForTimeout(400)
  await p.screenshot({ path: join(낼곳, s.이름 + '.png') })
  console.log(`  ✅ ${s.이름}  「${s.제목} ${s.제목2}」  (${s.위} ＋ ${s.아래})`)
}
await b.close()
console.log(`\n📁 ${낼곳}`)
console.log('⭐ 규칙 21 — 이제 «열어서» 보고 판정한다. 숫자로는 「예쁜가」를 못 잰다.')

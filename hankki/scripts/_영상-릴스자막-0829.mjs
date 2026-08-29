// 💬 **릴스 말풍선판 — 앱 화면 «위»에 바로 얹는 말풍선을 투명 PNG 로 뽑는다**
//
// 📮 창업자 2026-08-29 (시간순) =
//    *"자막이나 알려주는 포인트가 없어서 무슨 내용인지 모를 것 같아"* · *"우리ui나올때 뭐가뭔지 안내해줘야 할 것 같아"*
//    *"자막이 저렇게 위에 2개가 붙어??"* → *"두개가 같이 있으니까 정신이 없고 무슨말인지 모르겠어;;"*
//    *"유저가 **이 앱은 저런 기능이있구나 편하겠네** 생각을 해야하니까 **재밌게** … 센스있게"*
//    *"**근데 자막 빨간색이 글자도 너무 안예뻐 우리앱이랑 안어울려**"*
//    *"**ui에 자막을 바로 넣어도 되지않아? 말풍선이나 알약이나.**"*
//
// ⭐⭐ **창업자 안이 내 것보다 낫다 — 말풍선은 「어디를 말하는지」까지 알려준다.**
//    위쪽 자막 띠는 화면 밖에 떠 있어 **무엇을 가리키는지 모른다.** 게다가 띠만큼 앱이 작아졌다.
//    ＋ 4화 시안에 이미 말풍선이 있다(*"몇 분 남았어?!"* · *"8초. 국부터 줄여."*) → **시안과 한 몸이 된다.**
//
// 🎨 **색·글꼴을 앱에서 «꺼내 왔다»**(짐작하지 않았다 · `src/styles.css` 실측)
//    ⛔⛔ **`--brown` 은 갈색이 아니라 «더스티 블루» `#5878a0`** 다 — **이름만 brown 이다.**
//       *"포인트 = 더스티 블루(전 테마 통일 포인트) … 주황 남용 탈피"*
//    ⛔ 내가 쓰던 **주아체(Jua)는 앱에 «없는» 글꼴**이라 어색했다 → 앱 본문 글꼴 **고운돋움**으로.
//    ✅ 그래서 말풍선 = **앱의 「다음 →」 버튼과 같은 결**(블루 채움 · 흰 글씨 · 둥근 모서리).
//
// 실행: node scripts/_영상-릴스자막-0829.mjs
// ⛔ `_fresh.mjs`(dist 신선도 검사)를 부르지 «않는다» — 이 판은 앱을 띄우지 않는다.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/릴스/자막'
mkdirSync(OUT, { recursive: true })

// 📐 말풍선 판 = 릴스 폭 그대로 × 넉넉한 높이(꼬리 포함). 실제 자리는 합성판이 `y` 로 정한다.
const W = 1080, H = 210
const 앱색 = { 포인트: '#5878a0', 글자: '#ffffff', 흰: '#fdfbf7', 진한글자: '#3d3830' }

// 🚨🚨 **스토리보드** — `초` 는 «앱 실사 구간이 시작된 뒤» 몇 초.
//    `y` = 앱 화면 세로에서 말풍선 «위끝»이 놓일 비율(0~1).
//
// ⛔⛔ **첫 판이 화면과 어긋났다 — 「프레임 차이가 큰 순간」을 «무슨 화면인지 안 보고» 해석했다.**
//    📌 차이가 «크다»는 건 뭔가 바뀌었다는 뜻일 뿐, **무엇으로 바뀌었는지는 안 알려준다**(규칙 18).
// ✅ 본편을 **0.5초마다 뽑아 전부 눈으로 봤다**(절대원칙 21) — 아래가 그 실측이다:
//    0.0~1.4 재료 준비 / 1.4~4.8 STEP 1→2→3 / 4.8~6.3 타이머 시트 /
//    6.3~9.8 요리모드＋타이머(9:59→9:56) / 9.8~13.6 상세→홈(9:56→9:53) / 13.6~ 장보기(9:52→9:50)
//
// ⭐⭐ **뒤 셋(6.3s~)은 «하단 타이머 바»를 가리킨다** — 그게 이 릴스의 심장이다.
//    🔢 타이머 바 자리 = 앱 844px 중 **y=713**(녹화 로그 실측) → 0.845. 그 «위»에 붙인다.
export const 자막들 = [
  { 초: 0.0,  끝: 1.4,  글: '장 봐온 거 다 있나 먼저 체크',   y: 0.13 },
  { 초: 1.4,  끝: 4.8,  글: '지금 이 단계만 크게 · 안 헤매요', y: 0.13 },
  { 초: 4.8,  끝: 6.3,  글: '3분? 5분? 눌러두면 알려줘요',    y: 0.11 },
  { 초: 6.3,  끝: 9.8,  글: '손 젖어도 화면은 안 꺼져요',     y: 0.70 },
  { 초: 9.8,  끝: 13.6, 글: '딴 화면 가도 타이머는 계속',     y: 0.70 },
  { 초: 13.6, 끝: 99,   글: '장 보는 동안 냄비는 우리가',     y: 0.70 },
]

// ⭐ 꼬리는 «아래»로 — 말풍선이 가리키는 것은 늘 자기 아래에 있다(재료 목록 · STEP 글씨 · 타이머 바).
const 판 = (글) => `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family:'Gowun'; src:url('file://${join(ROOT, 'src/assets/fonts/gowun-dodum-korean-400.woff2')}') format('woff2'); }
  html,body { margin:0; width:${W}px; height:${H}px; background:transparent; }
  .wrap { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; }
  /* 🫧 앱 「다음 →」 버튼과 같은 결 — 블루 채움 · 흰 글씨 · 둥근 모서리
     📮 창업자 *"말풍선은 «잘보이게» 넣어줘"*
     ⛔ 앱 화면에도 같은 블루 버튼이 있어 그냥 두면 «UI 의 일부»로 읽힌다.
     ✅ **흰 테두리 6px** 로 둘러 앱과 갈라놓고 그림자를 진하게 → 「위에 얹힌 것」이 한눈에 보인다. */
  .bub { background:${앱색.포인트}; color:${앱색.글자}; font-family:'Gowun',sans-serif;
         font-size:54px; line-height:1.25; font-weight:700; padding:26px 46px 30px;
         border-radius:36px; white-space:nowrap; border:6px solid ${앱색.흰};
         box-shadow:0 16px 34px rgba(61,56,48,.42); }
  /* 꼬리 = 같은 색 삼각형(흰 테두리 위에 겹쳐 올려 이음매를 덮는다) */
  .tail { width:0; height:0; margin-top:-8px;
          border-left:24px solid transparent; border-right:24px solid transparent;
          border-top:30px solid ${앱색.흰}; }
  .tail2 { width:0; height:0; margin-top:-34px;
           border-left:16px solid transparent; border-right:16px solid transparent;
           border-top:22px solid ${앱색.포인트}; }
</style>
<div class="wrap"><div class="bub">${글}</div><div class="tail"></div><div class="tail2"></div></div>`

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const p = await ctx.newPage()

const 만든것 = []
for (let i = 0; i < 자막들.length; i++) {
  const s = 자막들[i]
  await p.setContent(판(s.글))
  await p.evaluate(() => document.fonts.ready)   // ⛔ 폰트가 오기 «전»에 찍으면 기본 고딕으로 나온다
  await p.waitForTimeout(200)
  // 🔢 말풍선이 앱 화면보다 넓으면 삐져나간다 — «찍기 전»에 재서 막는다(규칙 18)
  const 잰값 = await p.evaluate(() => {
    const r = document.querySelector('.bub').getBoundingClientRect()
    const t = document.querySelector('.tail').getBoundingClientRect()
    return { 폭: r.width, 키: t.bottom - r.top, 위: r.top }
  })
  if (잰값.폭 > 900) { console.error(`✗ 「${s.글}」 말풍선이 ${Math.round(잰값.폭)}px — 앱 폭(약 887px)을 넘는다. 글을 줄일 것`); process.exit(1) }
  const 길 = join(OUT, `${String(i).padStart(2, '0')}.png`)
  await p.screenshot({ path: 길, omitBackground: true })   // ⭐ 투명 배경이라야 앱 위에 얹힌다
  만든것.push({ ...s, 파일: 길, 키: Math.round(잰값.키) })
  console.log(`  ${String(s.초).padStart(5)}s ~ ${String(s.끝).padStart(5)}s  y=${s.y}  「${s.글}」 (${Math.round(잰값.폭)}px)`)
}
// ── 📣 선언 카드 — 인트로(시안) «다음»에 한 장 박고 앱으로 들어간다 ──
// 📮 창업자 = *"**한끼에는 요리모드에 타이머도 있다!!! 한장 박고 시작할까**"*
// ⭐⭐ 맞는 판단이다 — 시안만으론 *"그래서 무슨 앱인데?"* 가 안 닫힌다.
//    이 한 장이 **릴스의 주제를 못 박고**, 뒤에 나오는 앱 화면이 전부 그 증거가 된다.
// 🎨 배경은 시안 바탕색을 이어받아 인트로에서 «툭» 끊기지 않게. 꼬르곰은 냄비 든 컷.
const 카드 = `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family:'Gowun'; src:url('file://${join(ROOT, 'src/assets/fonts/gowun-dodum-korean-400.woff2')}') format('woff2'); }
  html,body { margin:0; width:1080px; height:1920px; background:#ecd1b4;
              font-family:'Gowun',sans-serif; color:${앱색.진한글자}; }
  .wrap { width:100%; height:100%; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:40px; }
  .small { font-size:64px; }
  .big { font-size:96px; font-weight:700; line-height:1.35; text-align:center; }
  .big em { font-style:normal; color:${앱색.포인트}; }
  .bang { font-size:112px; font-weight:700; color:${앱색.포인트}; letter-spacing:6px; }
  img { width:420px; }
</style>
<div class="wrap">
  <div class="small">한끼에는</div>
  <div class="big">요리모드에 <em>타이머</em>도<br>있다</div>
  <div class="bang">!!!</div>
  <img src="file://${join(ROOT, 'src/assets/ui/wave/gom_pot.png')}">
</div>`

await p.setViewportSize({ width: 1080, height: 1920 })
await p.setContent(카드)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
const 카드길 = join(OUT, '선언카드.png')
await p.screenshot({ path: 카드길 })
console.log(`  📣 선언 카드 = ${카드길}`)

await b.close()

writeFileSync(join(OUT, '자막목록.json'), JSON.stringify(만든것, null, 2))
console.log(`\n✅ 말풍선 ${만든것.length}장 ＋ 선언 카드 = ${OUT}\n`)

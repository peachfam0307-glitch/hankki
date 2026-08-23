// 📣📣 홍보 카드 — 카톡·인스타에 뿌릴 그림을 «앱 자산»으로 만든다 (2026-08-20)
//
// 📮 창업자 = *"나 카톡에 올릴 홍보영상이랑 카드만들어줄래 우리 인스타에 올릴 것도 만들어야해"*
//    → *"카톡 세로로 긴 카드하나 가로로 긴 카드하나 만들어줘"*
//    → *"뭔가 심심해보이네 애들만 덜렁있어서 그런가 프레임같은거 없이."*
//    → *"1.7번 웃는걸로 프레임까지 해서 부탁해 / 이쁘게에~~!!!!!"*
//
// ⭐⭐ **글자를 그림에 «굽지» 않는다** — 여기서 HTML 로 그리고 찍는다.
//    ⛔ 2026-07-31 스토어 스샷 사고가 그것이었다 — 앱 밖에서 따로 그려서
//       **앱 문구가 바뀌어도 스샷이 안 따라왔고**, 이모지가 깨진 채로 스토어에 올라가 있었다.
//
// 🎀 **꾸밈 = 「레꾸한 것」처럼.** 창업자가 「심심하다」고 한 자리에 우리 답을 넣는다 —
//    캐릭터를 **종이에 얹고 마스킹테이프로 붙인** 모양. ⭐그 자체가 «이 앱이 뭘 하는 앱인지»를 말한다.
//    ⛔ 프레임 스티커(`pf_`) 75컷을 다 열어봤지만 **안에 넣으면 캐릭터가 작아져 답답하다** —
//       그래서 프레임 대신 «종이 ＋ 마테»로 갔다. 마테는 우리 자산(`wt_`)을 그대로 쓴다.
//
// 🖼 캐릭터 = **웃는 판**(창업자 *"카롱 넘 무표정인가 ㅋㅋㅋㅋ 아까 그걸로도 만들어줄래? 웃는거"*)
//    ⚠️ 영상 프레임에서 뽑았다. **9.1초** 자리다 — 아무 데나 뽑으면 안 된다:
//       🔢 20프레임을 재보니 **1.1초·8.6초는 펭펭이 눈을 감는 순간**이었다
//          (창업자 = *"펭펭 눈이 이상해 … 우리펭펭 자는거 같애"* — 내가 1.2초를 썼다)
//       ✅ 8.85~9.35초 구간이 눈이 또렷하다. 다시 뽑을 땐 이 구간에서.
//    ⛔ `캐릭터-세계관-확장-2507/⭐정본-5인-삼각구도.png` 는 **옛 카피바라**다(창업자 *"다 폐기해"*).
//
// ⚠️⚠️ **뿌리는 시점** — 2026-08-20 지금은 **검토 중**이라 스토어에 «없다».
//    검토가 최대 7일이니 **게시된 걸 확인한 뒤에 뿌린다.** 만들어 두는 건 괜찮다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홍보카드-0820.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보'
mkdirSync(OUT, { recursive: true })

// 📦 그림·글씨체를 data URI 로 심는다 — 파일 경로로 두면 캡처가 «빈 칸»으로 찍힌다
const b64 = (p) => readFileSync(p).toString('base64')
const 그림 = (p) => `data:image/png;base64,${b64(p)}`
const 스티커 = (n) => 그림(join(ROOT, 'src/assets/stickers/photo', `${n}.png`))
const F = (n) => `data:font/woff2;base64,${b64(join(ROOT, 'src/assets/fonts', n))}`

// ⛔⛔ [2026-08-20 갈아끼움] 옛 소스 '5인-웃는판.png'(창업자 새 영상 1.5초)는 «못 쓴다» —
//    ⑴꼬르곰 셰프모자가 프레임 위(y=0)에 닿아 배경빼기가 «모자 속 흰색»을 통째로 먹었다(구멍)
//    ⑵발·그림자가 아래 크림 띠에 잘렸다 · 크림 띠는 완전 불투명이라 되살릴 수 없다
//    ✅ 창업자 판정 = 저장소 8/5 영상의 «f01» (📮 *"f01좋은거 같아"* · *"카롱은 안웃지만.. 온전한게 없네"*)
//       모자 온전 ＋ 꼬르곰 활짝 웃음 ＋ 발 다섯 다 온전. 배경빼기는 «좌우에서만» flood 했다
const 다섯 = 그림(join(OUT, '5인-f01-투명.png'))
// ⭐ 로고는 «투명판» — 브라운판은 갈색 «사각형»이 통째로 찍힌다(첫 판에서 실제로 그랬다)
const 로고 = 그림(join(ROOT, 'design/promo/logo/한끼로고-곰ㅎ-투명-2507.png'))
// 🎀 마테 = 48컷을 다 열어보고 «우리 톤»으로 둘 — 노랑 데이지 ＋ 살구
const 마테A = 스티커('wt_daisy_yellow')
const 마테B = 스티커('wt_dy14')

// 🎨 색 — 앱 톤 그대로. ⛔새로 지어내지 않는다(로고 확정색 2026-07-23)
const 색 = {
  바탕1: '#f4ece0', 바탕2: '#fdfaf4',
  잉크: '#4a3520', 연잉크: '#8a7355',
  강조: '#c2762e',      // 「레꾸」 — 곰 몸색(#EBAB73)의 진한 판
  로고: '#5d3410',
  종이: '#fffdf9',
}

const 글씨체 = {
  jua: { 이름: '주아', ko: 'jua-korean-400.woff2', la: 'jua-latin-400.woff2', 자간: '-.02em', 굵기: 400 },
  gaegu: { 이름: '개구', ko: 'gaegu-korean-400.woff2', la: 'gaegu-latin-400.woff2', 자간: '-.01em', 굵기: 700 },
}

const 머리 = (f) => `
<style>
  @font-face{font-family:'SL';src:url('${F(f.ko)}') format('woff2');font-weight:${f.굵기}}
  @font-face{font-family:'SL';src:url('${F(f.la)}') format('woff2');font-weight:${f.굵기}}
  @font-face{font-family:'GD';src:url('${F('gowun-dodum-korean-400.woff2')}') format('woff2')}
  @font-face{font-family:'GD';src:url('${F('gowun-dodum-latin-400.woff2')}') format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'GD',sans-serif;color:${색.잉크};-webkit-font-smoothing:antialiased}
  .판{background:linear-gradient(165deg,${색.바탕1} 0%,${색.바탕2} 48%,${색.바탕1} 100%);
      position:relative;overflow:hidden;display:flex}
  /* 🌾 아주 옅은 점무늬 — 크림 위 크림이라 «안 보일 듯 보인다» */
  .판::before{content:'';position:absolute;inset:0;opacity:.55;
    background-image:radial-gradient(${색.연잉크}20 1.5px,transparent 1.6px);background-size:28px 28px}
  /* ⛔⛔ 「flex:1」 이 없으면 «높이가 콘텐츠만큼»이라 아래가 통째로 빈다 —
     첫 판에서 실제로 그랬다(알약 아래 600px 공백).
     ⛔ 이 주석에 백틱을 쓰면 «템플릿 문자열이 그 자리에서 끊긴다» — 2026-08-20 에 실제로 죽었다.
        CLAUDE.md 에 박힌 「백틱 지뢰」를 또 밟았다. 주석엔 낫표「」를 쓴다. */
  .속{position:relative;z-index:1;width:100%;flex:1;display:flex}
  /* ⭐ 덩어리를 «넷»으로 묶어 space-between 으로 편다 — 슬로건과 부제가 갈라지지 않게 한 덩어리로 */
  .덩{display:flex;flex-direction:column;align-items:center;width:100%}

  /* ⛔⛔ [창업자 확정 2026-08-20] **꾸미기를 뺐다 — 심플하게 간다.**
     📮 *"마테가 안어울령.."* → *"그냥 심플하게 갈까...꾸미기 뺴고."*
     ⭐ 종이(폴라로이드) ＋ 마스킹테이프를 얹어 봤는데 창업자 판정이 「안 어울린다」였다.
        ⛔ 되살리지 말 것. 「심심해 보인다」는 앞선 말은 **여백이 아래로 몰린 것**이 절반이었고,
           그건 「flex:1」로 고쳤다 — 꾸밈을 더해서 풀 문제가 아니었다.
     ✅ 대신 캐릭터에 «아주 옅은 그림자»만 — 바탕에서 살짝 떠 보이게. */
  .애들{display:block;width:100%;filter:drop-shadow(0 16px 30px #5d34101a)}

  .슬로건{font-family:'SL',sans-serif;font-weight:${f.굵기};color:${색.잉크};
          letter-spacing:${f.자간};line-height:1.24;text-wrap:balance}
  .레꾸{color:${색.강조}}
  .부제{color:${색.연잉크};font-weight:400}
  /* 🏷 스토어 알약 — ⛔구글 배지 그림을 흉내내지 않는다(상표라 규격이 따로 있다) */
  .알약{display:inline-flex;align-items:center;gap:.45em;background:${색.로고};color:#fffdf8;
        border-radius:999px;font-family:'SL',sans-serif;font-weight:${f.굵기};white-space:nowrap;
        box-shadow:0 8px 20px #5d341026}
  .알약 b{color:#ffd9a8;font-weight:${f.굵기}}
</style>`

// ─────────────────────────────────────────────────────────────
const 세로 = (f) => `${머리(f)}
<div class="판" style="width:1080px;height:1920px;flex-direction:column">
 <div class="속" style="flex-direction:column;align-items:center;justify-content:space-between;padding:104px 56px 96px">

  <img src="${로고}" style="height:156px">

  <img class="애들" src="${다섯}" style="width:100%">

  <div class="덩">
    <div class="슬로건" style="font-size:92px;text-align:center">
      한 끼를 해낸다면,<br><span class="레꾸">레꾸</span>하세요.
    </div>
    <div class="부제" style="font-size:38px;margin-top:26px">레시피를 예쁘게 꾸미는 앱</div>
  </div>

  <div class="덩">
    <div class="알약" style="font-size:42px;padding:30px 56px">
      Google Play 에서 <b>한끼</b> 검색
    </div>
    <div class="부제" style="font-size:28px;margin-top:24px">회원가입 없이 바로 시작해요</div>
  </div>
 </div>
</div>`

// ⭐ 가로판 — 첫 판에서 **뾰미가 오른쪽으로 잘렸다**. 음수 margin 을 없애고 폭으로 맞춘다.
const 가로 = (f) => `${머리(f)}
<div class="판" style="width:1200px;height:630px">
 <div class="속" style="align-items:center;padding:0 56px;gap:44px">

  <div style="flex:0 0 452px;display:flex;flex-direction:column;align-items:flex-start">
    <img src="${로고}" style="height:88px;margin-bottom:18px">
    <div class="슬로건" style="font-size:54px;text-align:left">
      한 끼를 해낸다면,<br><span class="레꾸">레꾸</span>하세요.
    </div>
    <div class="부제" style="font-size:24px;margin-top:14px">레시피를 예쁘게 꾸미는 앱</div>
    <div class="알약" style="font-size:25px;padding:17px 32px;margin-top:26px">
      Google Play 에서 <b>한끼</b> 검색
    </div>
  </div>

  <img class="애들" src="${다섯}" style="flex:1;min-width:0">
 </div>
</div>`

// ⭐ 인스타 피드 4:5 — 세로보다 짧아 «캐릭터 ＋ 슬로건»만
const 피드 = (f) => `${머리(f)}
<div class="판" style="width:1080px;height:1350px;flex-direction:column">
 <div class="속" style="flex-direction:column;align-items:center;justify-content:space-between;padding:66px 56px 62px">
  <img src="${로고}" style="height:118px">

  <img class="애들" src="${다섯}" style="width:100%">

  <div class="슬로건" style="font-size:76px;text-align:center">
    한 끼를 해낸다면,<br><span class="레꾸">레꾸</span>하세요.
  </div>

  <div class="알약" style="font-size:35px;padding:24px 48px">
    Google Play 에서 <b>한끼</b> 검색
  </div>
 </div>
</div>`

const 꼴들 = [
  { 이름: '세로-1080x1920', 만들기: 세로, w: 1080, h: 1920 },
  { 이름: '가로-1200x630', 만들기: 가로, w: 1200, h: 630 },
  { 이름: '인스타피드-1080x1350', 만들기: 피드, w: 1080, h: 1350 },
]

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
for (const [키, f] of Object.entries(글씨체)) {
  for (const 꼴 of 꼴들) {
    const page = await b.newPage({ viewport: { width: 꼴.w, height: 꼴.h }, deviceScaleFactor: 1 })
    await page.setContent(`<!doctype html><meta charset="utf-8">${꼴.만들기(f)}`, { waitUntil: 'load' })
    // ⚠️ 글씨체가 아직 안 올라온 채 찍으면 «다른 글씨»로 나온다(규칙 18: 「있나」가 아니라 「됐나」)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    const 이름 = `카드-${f.이름}-${꼴.이름}.png`
    await page.locator('.판').first().screenshot({ path: join(OUT, 이름) })
    await page.close()
    console.log(`✅ ${이름}`)
  }
}
await b.close()
console.log(`\n📁 ${OUT}`)
console.log('⚠️ 뿌리기 «전»에 스토어에 실제로 올라왔는지 확인할 것 — 2026-08-20 지금은 검토 중이다.')

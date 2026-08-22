// 🏪🏪 스토어 스크린샷 v5 시안 (2026-08-22)
//
// 📮 창업자 = *"레시피브로는 «스샷이 직관적»이야. 우리는 예쁜데 **스샷안에 사진이 너무 작아.**"*
//    → *"리서치해서 시안다시잡자."* → *"**우리 감성은 살리면서 우리가 뭐하는 앱인지 잘보이게.**"*
//    → 1차 갈래 셋(ㄱ·ㄴ·ㄷ)을 보고 **"마지막이 좋은데?"**(＝ㄷ 「꽉 채우고 아래 자막」)
//    → *"꼬르곰 스티커는 빼도 될듯"* · *"제일 아래에 넣거나"*
//    → 그 뒤 *"**근데 우리 스샷이 예쁘긴하거든..**"* · *"**스샷안에 사진을 더 키우고.
//       우리앱을 더 잘보여주게 ui를 보통하자**"* → **갈래 ㅎ 추가**(아래)
//
// ⭐⭐ 진단(v4 8장을 실제로 열어 보고) = **우리 스샷엔 «앱 화면»이 한 장도 없다.**
//    v4 는 「앱 안의 온보딩」을 찍은 것인데 온보딩이 «그림 카드»라서,
//    결과적으로 **앱이 어떻게 생겼는지·뭐가 되는지가 스토어에서 안 보인다.**
//
// 🔎 리서치(2026-08-22)로 확인한 것 넷
//   ① 스토어 검색결과엔 **앞 2~3장만** 뜬다 → 첫 장이 「무슨 앱인지」를 혼자 말해야 한다
//   ② 이기는 구조 = **진짜 앱 화면 «한 장» ＋ 혜택 헤드라인 «한 줄»**
//   ③ 헤드라인이 화면에서 «제일 크고 굵은 글자»여야 한다 (한 줄 ＋ 부제 한 줄까지)
//   ④ **8장 반복보다 4~6장 강한 것**이 낫다
//
// ⛔⛔ 1차 시안에서 «앱 화면 고르기»를 틀렸다 — 레시피 상세의 «맨 위»(표지)를 썼더니
//    파란 물결 그림만 크게 보여 **「그림 그리는 앱」으로 읽혔다.**
//    📌 **「앱 화면을 크게」만으로는 모자라다. «무엇이 보이는 자리»까지 골라야 한다.**
//    → `_shot-스토어용화면-0822.mjs` 로 **재료·순서가 보이는 자리**를 따로 찍는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-스토어시안-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const 앱화면 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/스토어시안'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 곰 = b64(join(ROOT, 'src/assets/stickers/photo/gp_gomhi.png'))

// ⛔ 색을 박지 않고 앱 토큰과 같은 값을 쓴다 — 진한웜 #5d3410 = 로고 색
const 공통 = `
${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;background:#e9d9c0;
  font-family:'Gowun Dodum','Jua',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.shot{width:1080px;height:1920px;object-fit:cover;display:block}
.h{font-family:'Jua','Gowun Dodum',system-ui,sans-serif;letter-spacing:-0.02em;color:#fff8ec}
.s{letter-spacing:-0.01em;color:rgba(255,248,236,.80)}
`

// 📐 ㄷ 의 «자막 띠»
// ⛔⛔ 첫 판은 «부드러운 그라데이션»이라 **앱 글자가 헤드라인 뒤로 비쳐 지저분했다**
//    (「콩국수 샘플」·「…이에요 · 레시피」가 그대로 읽혔다 · 규칙 21 이 잡았다).
//    ✅ 자막이 앉는 자리는 **꽉 찬 색**으로, 그 «위»에만 짧게 흐린다. 비쳐 보일 자리가 없어진다.
const 띠 = (꽉, 흐림) => `.veil{position:absolute;left:0;right:0;bottom:0;height:${꽉}px;background:#3a200a}
  .fade{position:absolute;left:0;right:0;bottom:${꽉}px;height:${흐림}px;
    background:linear-gradient(to top,#3a200a 0%,rgba(58,32,10,.62) 46%,rgba(58,32,10,0) 100%)}`

// ✅ 창업자 확정 (2026-08-22)
//   · **꼬르곰 스티커는 각 장에 안 넣는다** (*"1번이 더 깔끔한데"*)
//   · **「한끼 · 꼬르곰이 함께해요」는 «마지막 장»에** (*"마지막에 넣어도 되지 않을까"*)
//     ⭐ 검색결과엔 앞 2~3장만 뜬다. 앞장은 「뭐하는 앱인지」에 다 쓰고 브랜드는 마지막에 크게.

// 📐 갈래 ㄷ — 앱 화면을 꽉 채우고 아래 자막 띠
// ⛔ 「위에서 자른다」를 «모든 장»에 쓰면 안 된다 — 꾸미기 화면은 «서랍이 아래»에 있어서
//    위를 남기면 정작 보여줄 것이 자막 띠에 통째로 덮인다(2026-08-22 실측).
//    → 장마다 «어디를 남길지»(`자리`)를 따로 정한다.
const 장 = ({ 파일, 머리, 부제, 브랜드, 자리 = 'top' }) => `<style>${공통}${띠(브랜드 ? 620 : 520, 230)}
  .shot{object-position:${자리}}
  .cap{position:absolute;left:76px;right:76px;bottom:${브랜드 ? 196 : 96}px}
  .cap .h{font-size:94px;line-height:1.28}
  .cap .s{font-size:40px;line-height:1.5;margin-top:24px}
  .gom{position:absolute;left:70px;bottom:44px;width:142px;
    filter:drop-shadow(0 8px 18px rgba(0,0,0,.35))}
  .mark{position:absolute;left:232px;bottom:78px;font-size:34px;color:rgba(255,248,236,.66);
    font-family:'Gowun Dodum',system-ui,sans-serif;letter-spacing:-0.01em}
</style>
<img class="shot" src="${b64(join(앱화면, 파일))}">
<div class="fade"></div><div class="veil"></div>
<div class="cap"><div class="h">${머리}</div><div class="s">${부제}</div></div>
${브랜드 ? `<img class="gom" src="${곰}"><div class="mark">${브랜드}</div>` : ''}`

// 🎀🎀 갈래 ㅎ — 「우리 감성 ＋ 앱 화면을 «크게»」
// 📮 창업자 = *"근데 우리 스샷이 예쁘긴하거든.."* → *"**스샷안에 사진을 더 키우고. 우리앱을 더 잘보여주게 ui를 보통하자**"*
// ⭐ v4 의 «예쁜 틀»(파스텔 바탕 · 도트 · 우리 서체)은 살리고, 그 안의 그림카드를 **진짜 앱 화면**으로 바꾼다.
//    ⛔ v4 는 앱 화면이 아예 «없었고», 있던 그림카드도 작았다. 여기선 폭 **92%** 로 크게 흘린다.
const 감성색 = ['#fbf0e0', '#eef3e6', '#fdeef0', '#eaf1f6', '#f6efe2', '#f9ece2']
const 장ㅎ = ({ 파일, 머리, 부제, 브랜드, 자리 = 'top' }, i) => `<style>${공통}
  body{background:${감성색[i % 감성색.length]}}
  body::before{content:'';position:absolute;inset:0;opacity:.5;
    background-image:radial-gradient(rgba(93,52,16,.13) 3px,transparent 3px);background-size:34px 34px}
  .wrap{position:relative;z-index:2;padding:112px 76px 0;text-align:center}
  .hh{font-family:'Jua','Gowun Dodum',system-ui,sans-serif;color:#5d3410;letter-spacing:-0.02em;
    font-size:92px;line-height:1.30}
  .ss{color:rgba(93,52,16,.68);letter-spacing:-0.01em;font-size:40px;line-height:1.5;margin-top:24px}
  .box{position:absolute;left:44px;right:44px;top:${브랜드 ? 470 : 448}px;z-index:2}
  /* 📐 «사진을 더 키운다» — 폭 992px(92%). 흰 테를 얇게 둘러 바탕과 갈라 준다 */
  .big{width:100%;height:1500px;object-fit:cover;object-position:${자리};display:block;
    border-radius:44px;border:10px solid #fffdf8;
    box-shadow:0 34px 70px rgba(93,52,16,.22),0 6px 18px rgba(93,52,16,.10)}
  .gom{position:absolute;right:56px;top:322px;width:170px;z-index:4;
    filter:drop-shadow(0 10px 20px rgba(93,52,16,.24))}
</style>
<div class="wrap"><div class="hh">${머리}</div><div class="ss">${부제}</div></div>
<div class="box"><img class="big" src="${b64(join(앱화면, 파일))}"></div>
${브랜드 ? `<img class="gom" src="${곰}">` : ''}`

// 🐻🐧 마지막 장 — 「꼬르곰은 저예요」 ＋ **마무리**
// 📮 창업자 = *"마지막 장이 소개를 «여는» 장같이 느껴져. 글 마무리가."* ·
//    *"«18년차주부가 만든앱» 다음이나 아래에 — 한끼에서 만나자는 설명 들어가면 좋겠다."*
// ⭐ v4 판을 그대로 쓰지 않고 «우리 틀(ㅎ)»로 다시 그린다 — 그래야 앞 7장과 한 벌이고,
//    ⛔앱 온보딩(`Onboarding.jsx`)을 안 건드린다(앱 변경은 검수 대상이다 · 규칙 13).
// ⭐ 마무리 문구의 뿌리 = `docs/메인컨셉-전략.md` 「물려주는 레시피북」 —
//    *"엄마가 해주시던 밥솥카스테라를 40이 넘은 지금도 기억하는 것처럼"* ＋ 앱 슬로건 「한 끼를 해낸다면, 레꾸하세요」
const 곰펭 = b64(join(ROOT, 'src/assets/stickers/photo/gp_duoht.png'))
const 마지막장 = () => `<style>${공통}
  body{background:#f7e6d2}
  body::before{content:'';position:absolute;inset:0;opacity:.5;
    background-image:radial-gradient(rgba(93,52,16,.13) 3px,transparent 3px);background-size:34px 34px}
  .wrap{position:relative;z-index:2;padding:104px 76px 0;text-align:center}
  .hh{font-family:'Jua','Gowun Dodum',system-ui,sans-serif;color:#5d3410;letter-spacing:-0.02em;
    font-size:92px;line-height:1.30}
  .ss{color:rgba(93,52,16,.68);letter-spacing:-0.01em;font-size:40px;line-height:1.5;margin-top:22px}
  .duo{position:absolute;left:50%;transform:translateX(-50%);top:404px;width:720px;z-index:3;
    filter:drop-shadow(0 18px 34px rgba(93,52,16,.20))}
  .card{position:absolute;left:76px;right:76px;top:1010px;z-index:2;background:#fffdf8;
    border-radius:40px;padding:56px 54px;box-shadow:0 20px 44px rgba(93,52,16,.14);text-align:left}
  .card p{color:#5d3410;font-size:40px;line-height:1.62;letter-spacing:-0.01em}
  .card .go{color:#c2703a;font-weight:700}
  .card hr{border:0;border-top:2px dashed rgba(93,52,16,.22);margin:34px 0}
  .pill{position:absolute;left:50%;transform:translateX(-50%);bottom:236px;z-index:3;
    background:#5d3410;color:#fff8ec;border-radius:999px;padding:20px 44px;font-size:36px;
    font-family:'Jua','Gowun Dodum',system-ui,sans-serif;letter-spacing:-0.01em;white-space:nowrap}
  /* ⭐ 창업자가 콕 집은 자리 — 알약 «아래» 마무리 */
  .end{position:absolute;left:76px;right:76px;bottom:92px;z-index:3;text-align:center;
    font-family:'Jua','Gowun Dodum',system-ui,sans-serif;color:#5d3410;
    font-size:52px;line-height:1.44;letter-spacing:-0.02em}
</style>
<div class="wrap"><div class="hh">꼬르곰은 저예요</div><div class="ss">펭펭은 제 사춘기 딸이고요</div></div>
<img class="duo" src="${곰펭}">
<div class="card">
  <p>저장만 해둔 레시피 캡처가 수백 장.<br>정작 해먹고 싶을 땐 못 찾았어요.<br><span class="go">그래서 한끼를 만들었어요.</span></p>
  <hr>
  <p>엄마가 해주던 그 맛을 아직 기억하는 것처럼,<br>오늘 차린 한 끼도 누군가에게 남으면 좋겠어요.</p>
</div>
<div class="pill">18년차 주부가 만든 앱</div>
<div class="end">오늘도 한 끼 해냈다면,<br>한끼에서 만나요</div>`

// 🗂 제안 6장 — ⛔순서가 곧 값어치다(앞 2~3장만 검색결과에 뜬다)
// ✅ 창업자 지시로 갈아끼운 것 넷 (2026-08-22 밤)
//   · 5번 = *"불앞에서도 편하게는 «요리모드»가 좋지않을까"* ＋ *"끓이는거 없엉?? 보통 타이머는 뭐 끓을때 맞춰"*
//     → 콩국수(끓이는 걸음 0)를 버리고 **김치찌개 STEP 5「15분 끓여요」** 로
//   · 3번 = *"레꾸꾸미기에서 «더 귀여운 스티커들» 있는 부분으로"* → **친구들 탭**(꼬르곰·펭펭)
//   · 6번 = *"일기에는 «음식아이콘 몇개» 넣어서"* → 요리 기록 7개를 심어 **채운 달력**
//   · 8번 = 옛 v4 에서 **한 장만** 살린다(아래 이유)
const 장들 = {
  '1-정리': { 파일: '21-상세-재료순서.png', 머리: '캡처 한 장이면<br>레시피가 정리돼요', 부제: '재료도 순서도 알아서 · 내 요리책이 돼요' },
  '2-요리책': { 파일: '20-레시피목록.png', 머리: '레시피가 쌓이면<br>나만의 요리책', 부제: '표지도 내 마음대로 꾸며요' },
  '3-레꾸': { 파일: '23-꾸미기-스티커서랍.png', 머리: '레시피 정리? 우린<br>레시피 레꾸해요', 부제: '꼬르곰·펭펭 스티커 붙이고 배경 깔고 · 한 끼가 추억이 돼요', 자리: 'center' },
  // ⛔ 화면 «맨 위»는 큐레이션 소개글이라 「담기·사러가기」가 안 보인다(창업자 지적) → 굴려서 찍은 판
  '4-장보기': { 파일: '27-장보기-사러가기.png', 머리: '재료는 한 번에<br>사러가기', 부제: '레시피 재료 그대로 톡 · 18년차 주부의 추천템까지' },
  '5-요리모드': { 파일: '25-요리모드-걸음.png', 머리: '불 앞에서도<br>편하게', 부제: '걸음마다 타이머 · 요리하는 동안 화면도 안 꺼져요', 자리: 'center' },
  '6-일기': { 파일: '26-일기-채운달력.png', 머리: '오늘의 한 끼가<br>일기가 돼요', 부제: '달력에 하나씩 쌓여요 · 사진 한 장, 한 줄이면 충분해요' },
  '7-자랑': { 파일: '10-랜덤카드.png', 머리: '오늘의 한 끼를<br>카드 한 장으로', // ⛔ 자랑 카드는 시트라 «뒤가 어둡다» — 너무 아래를 남기면 그 어두운 띠가 들어와 다른 장과 톤이 튄다
  부제: '뽑을 때마다 달라지는 카드 · 친구에게 톡', 자리: '50% 42%' },
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
let i = 0
for (const [이름, 값] of Object.entries(장들)) {
  for (const [꼬리, 그리기] of [['ㄷ', () => 장(값)], ['ㅎ', () => 장ㅎ(값, i)]]) {
    await p.setContent(`<!doctype html><meta charset="utf-8">${그리기()}`)
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(350)
    await p.screenshot({ path: join(OUT, `${꼬리}-${이름}.png`) })
  }
  console.log(`  ✅ ${이름} (ㄷ·ㅎ 둘 다)`)
  i++
}
// 🐻🐧 마지막 장은 앱 화면이 없다 — 따로 그린다
await p.setContent(`<!doctype html><meta charset="utf-8">${마지막장()}`)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(350)
await p.screenshot({ path: join(OUT, 'ㅎ-8-왜만들었나.png') })
console.log('  ✅ 8-왜만들었나')
console.log(`\n📸 → ${OUT}`)
await br.close()

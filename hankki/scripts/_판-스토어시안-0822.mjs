// 🏪🏪 스토어 스크린샷 v5 — 최종 8장 (2026-08-22)
//
// 📮 창업자 = *"레시피브로는 «스샷이 직관적»이야. 우리는 예쁜데 **스샷안에 사진이 너무 작아.**"*
//    → *"리서치해서 시안다시잡자."* → *"**우리 감성은 살리면서 우리가 뭐하는 앱인지 잘보이게.**"*
//    → *"**근데 우리 스샷이 예쁘긴하거든..**"* · *"**스샷안에 사진을 더 키우고. ui를 보통하자**"*
//    → 갈래 둘을 실제로 이어 붙여 보여주니 **"1번이 낫네"**(＝ㅎ)
//
// ⭐⭐ 진단(v4 8장을 실제로 열어 보고) = **우리 스샷엔 «앱 화면»이 한 장도 없었다.**
//    v4 는 「앱 안의 온보딩」을 찍은 것인데 온보딩이 «그림 카드»라서,
//    결과적으로 **앱이 어떻게 생겼는지·뭐가 되는지가 스토어에서 안 보였다.**
//
// 🔎 리서치(2026-08-22)로 확인한 것 넷
//   ① 스토어 검색결과엔 **앞 2~3장만** 뜬다 → 첫 장이 「무슨 앱인지」를 혼자 말해야 한다
//   ② 이기는 구조 = **진짜 앱 화면 «한 장» ＋ 혜택 헤드라인 «한 줄»**
//   ③ 헤드라인이 화면에서 «제일 크고 굵은 글자»여야 한다
//   ④ 8장이 한도다 — 앞 7장은 «기능», 마지막 한 장만 «이야기»
//
// ⭐ 틀(ㅎ) = v4 의 파스텔 바탕·도트·우리 서체를 그대로 물려받고, 안의 «그림 카드»만
//    **진짜 앱 화면(폭 92%)** 으로 바꿨다. → 옛 v4 장과 이어 붙여도 결이 안 튄다(창업자 확인).
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
const 곰펭 = b64(join(ROOT, 'src/assets/stickers/photo/gp_duoht.png'))

// ⛔ 색을 박지 않고 앱 토큰과 같은 값을 쓴다 — 진한웜 #5d3410 = 로고 색
const 공통 = `
${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;
  font-family:'Gowun Dodum','Jua',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
body::before{content:'';position:absolute;inset:0;opacity:.5;
  background-image:radial-gradient(rgba(93,52,16,.13) 3px,transparent 3px);background-size:34px 34px}
.hh{font-family:'Jua','Gowun Dodum',system-ui,sans-serif;color:#5d3410;letter-spacing:-0.02em}
.ss{color:rgba(93,52,16,.68);letter-spacing:-0.01em}
`

const 감성색 = ['#fbf0e0', '#eef3e6', '#fdeef0', '#eaf1f6', '#f6efe2', '#f0f2e8', '#fdeee6']

// 📐 한 장 = 헤드라인 ＋ «진짜 앱 화면»을 크게
const 장 = ({ 파일, 머리, 부제, 자리 = 'top' }, i) => `<style>${공통}
  body{background:${감성색[i % 감성색.length]}}
  .wrap{position:relative;z-index:2;padding:112px 76px 0;text-align:center}
  .hh{font-size:92px;line-height:1.30}
  .ss{font-size:40px;line-height:1.5;margin-top:24px}
  .box{position:absolute;left:44px;right:44px;top:448px;z-index:2}
  /* 📐 «사진을 더 키운다» — 폭 992px(92%). 흰 테를 얇게 둘러 바탕과 갈라 준다 */
  .big{width:100%;height:1500px;object-fit:cover;object-position:${자리};display:block;
    border-radius:44px;border:10px solid #fffdf8;
    box-shadow:0 34px 70px rgba(93,52,16,.22),0 6px 18px rgba(93,52,16,.10)}
</style>
<div class="wrap"><div class="hh">${머리}</div><div class="ss">${부제}</div></div>
<div class="box"><img class="big" src="${b64(join(앱화면, 파일))}"></div>`

// 🐻🐧 마지막 장 — 「꼬르곰은 저예요」 ＋ **마무리**
// 📮 창업자 = *"마지막 장이 소개를 «여는» 장같이 느껴져. 글 마무리가."* ·
//    *"«18년차주부가 만든앱» 다음이나 아래에 — 한끼에서 만나자는 설명 들어가면 좋겠다."* ·
//    *"꼬르곰과 펭펭 티격태격 이부분 좋은데 «다 넣고», 네가 추가한 두줄을 더 넣자"*
// ⛔⛔ 「엄마가 해주던 그 맛」을 **따로 놓았더니 안 붙었다** — 창업자 = *"갑자기 엄마맛기억이 나오니까 좀 안맞네"*.
//    ⭐ 맞는 지적이었다. 앞 문단이 «지금 우리 집» 얘긴데 시간이 갑자기 뒤로 뛴다.
// ✅ 창업자가 다리를 놓아 줬다 = *"**사춘기딸도 제가 기억하는 것처럼 나중에 엄마의 요리를 기억하길** 바란다던가.. 흐름에 맞게"*
//    → **펭펭(사춘기 딸)이 바로 앞 문단에 이미 나온다.** 그 아이를 이어받아 「나중에」로 넘기면
//      「계기 → 우리 집 → 그래서 남긴다 → 마무리」로 한 줄기가 된다. 시간이 안 튄다.
// 📌 오늘 배운 것 = **문단이 안 붙을 땐 «빼는 것»이 아니라 «다리를 놓는 것»이 답일 때가 있다.**
// ⭐ v4 판을 그대로 안 쓰고 «우리 틀»로 다시 그린다 — 앞 7장과 한 벌이 되고,
//    ⛔앱 온보딩(`Onboarding.jsx`)을 안 건드린다(앱 변경은 검수 대상 · 규칙 13).
const 마지막장 = () => `<style>${공통}
  body{background:#f7e6d2}
  /* ⛔ 문단이 셋으로 늘자 카드가 길어져 **알약·마무리를 덮었다**(2026-08-22 · 규칙 21 이 잡았다).
        → 캐릭터를 줄여 위로 올리고, 카드를 올리고, 글자를 한 호수 줄여 자리를 만든다. */
  .wrap{position:relative;z-index:2;padding:88px 76px 0;text-align:center}
  .hh{font-size:88px;line-height:1.30}
  .ss{font-size:37px;line-height:1.5;margin-top:18px}
  .duo{position:absolute;left:50%;transform:translateX(-50%);top:300px;width:440px;z-index:3;
    filter:drop-shadow(0 16px 30px rgba(93,52,16,.20))}
  .card{position:absolute;left:72px;right:72px;top:772px;z-index:2;background:#fffdf8;
    border-radius:40px;padding:48px 48px;box-shadow:0 20px 44px rgba(93,52,16,.14);text-align:left}
  .card p{color:#5d3410;font-size:36px;line-height:1.62;letter-spacing:-0.01em}
  .card .go{color:#c2703a;font-weight:700}
  .card hr{border:0;border-top:2px dashed rgba(93,52,16,.22);margin:30px 0}
  .pill{position:absolute;left:50%;transform:translateX(-50%);bottom:214px;z-index:3;
    background:#5d3410;color:#fff8ec;border-radius:999px;padding:20px 44px;font-size:36px;
    font-family:'Jua','Gowun Dodum',system-ui,sans-serif;letter-spacing:-0.01em;white-space:nowrap}
  /* ⭐ 창업자가 콕 집은 자리 — 알약 «아래» 마무리 */
  .end{position:absolute;left:76px;right:76px;bottom:62px;z-index:3;text-align:center;
    font-family:'Jua','Gowun Dodum',system-ui,sans-serif;color:#5d3410;
    font-size:50px;line-height:1.42;letter-spacing:-0.02em}
</style>
<div class="wrap"><div class="hh">꼬르곰은 저예요</div><div class="ss">펭펭은 제 사춘기 딸이고요</div></div>
<img class="duo" src="${곰펭}">
<div class="card">
  <p>저장만 해둔 레시피 캡처가 수백 장.<br>정작 해먹고 싶을 땐 못 찾았어요.<br><span class="go">그래서 한끼를 만들었어요.</span></p>
  <hr>
  <p>꼬르곰과 펭펭, 티격태격하지만<br>그게 곧 사랑이에요.<br>우리 집 이야기이자, 여느 집 이야기죠.</p>
  <hr>
  <p>제가 엄마의 밥상을 기억하듯<br>저 아이도 언젠가 오늘의 한 끼를<br><span class="go">기억했으면 좋겠어요.</span></p>
</div>
<div class="pill">18년차 주부가 만든 앱</div>
<div class="end">오늘도 한 끼 해냈다면,<br>한끼에서 만나요</div>`

// 🗂 최종 8장 — ⛔순서가 곧 값어치다(앞 2~3장만 검색결과에 뜬다)
const 장들 = {
  '01-정리': { 파일: '21-상세-재료순서.png', 머리: '캡처 한 장이면<br>레시피가 정리돼요', 부제: '재료도 순서도 알아서 · 내 요리책이 돼요' },
  '02-요리책': { 파일: '20-레시피목록.png', 머리: '레시피가 쌓이면<br>나만의 요리책', 부제: '표지도 내 마음대로 꾸며요' },
  '03-레꾸': { 파일: '23-꾸미기-스티커서랍.png', 머리: '레시피 정리? 우린<br>레시피 레꾸해요', 부제: '꼬르곰·펭펭 스티커 붙이고 배경 깔고 · 한 끼가 추억이 돼요', 자리: 'center' },
  // ⛔ 굴리기로는 «칩 줄 조각»이 맨 위에 남는다(칸이 그 높이로 안 떨어진다) → 자를 때 조금 내려서 시작
  '04-장보기': { 파일: '27-장보기-사러가기.png', 머리: '재료는 한 번에<br>사러가기', 부제: '레시피 재료 그대로 톡 · 18년차 주부의 추천템까지', 자리: '50% 6%' },
  '05-요리모드': { 파일: '25-요리모드-걸음.png', 머리: '불 앞에서도<br>편하게', 부제: '걸음마다 타이머 · 요리하는 동안 화면도 안 꺼져요', 자리: 'center' },
  '06-일기': { 파일: '26-일기-채운달력.png', 머리: '오늘의 한 끼가<br>일기가 돼요', 부제: '달력에 하나씩 쌓여요 · 사진 한 장, 한 줄이면 충분해요' },
  // ⛔ 자랑 카드는 시트라 «뒤가 어둡다» — 너무 아래를 남기면 어두운 띠가 들어와 다른 장과 톤이 튄다
  '07-자랑': { 파일: '10-랜덤카드.png', 머리: '오늘의 한 끼를<br>카드 한 장으로', // ⛔ 42% 면 아래 「이 카드를 내 레시피 표지로」가 반쯤 잘린다(창업자 지적) → 위로 당긴다
  부제: '뽑을 때마다 달라지는 카드 · 친구에게 톡', 자리: '50% 37%' },
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
let i = 0
for (const [이름, 값] of Object.entries(장들)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${장(값, i)}`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(350)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  console.log(`  ✅ ${이름}`)
  i++
}
// 🐻🐧 마지막 장은 앱 화면이 없다 — 따로 그린다
await p.setContent(`<!doctype html><meta charset="utf-8">${마지막장()}`)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(350)
await p.screenshot({ path: join(OUT, '08-왜만들었나.png') })
console.log('  ✅ 08-왜만들었나')
console.log(`\n📸 8장 → ${OUT}`)
await br.close()

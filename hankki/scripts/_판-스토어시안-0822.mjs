// 🏪🏪 스토어 스크린샷 v5 시안 (2026-08-22)
//
// 📮 창업자 = *"레시피브로는 «스샷이 직관적»이야. 우리는 예쁜데 **스샷안에 사진이 너무 작아.**"*
//    → *"리서치해서 시안다시잡자."* → *"**우리 감성은 살리면서 우리가 뭐하는 앱인지 잘보이게.**"*
//    → 1차 갈래 셋(ㄱ·ㄴ·ㄷ)을 보고 **"마지막이 좋은데?"**(＝ㄷ 「꽉 채우고 아래 자막」)
//    → *"꼬르곰 스티커는 빼도 될듯"* · *"제일 아래에 넣거나"*
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

// 📐 ㄷ 의 «자막 띠» — 창업자가 고른 구조. 셋의 차이는 «꼬르곰 자리»와 «띠 높이»뿐이다
// ⛔⛔ 첫 판은 «부드러운 그라데이션»이라 **앱 글자가 헤드라인 뒤로 비쳐 지저분했다**
//    (「콩국수 샘플」·「…이에요 · 레시피」가 그대로 읽혔다 · 규칙 21 이 잡았다).
//    ✅ 자막이 앉는 자리는 **꽉 찬 색**으로, 그 «위»에만 짧게 흐린다. 비쳐 보일 자리가 없어진다.
const 띠 = (꽉, 흐림) => `.veil{position:absolute;left:0;right:0;bottom:0;height:${꽉}px;background:#3a200a}
  .fade{position:absolute;left:0;right:0;bottom:${꽉}px;height:${흐림}px;
    background:linear-gradient(to top,#3a200a 0%,rgba(58,32,10,.62) 46%,rgba(58,32,10,0) 100%)}`

const 자막 = (머리, 부제) => `<div class="cap"><div class="h">${머리}</div><div class="s">${부제}</div></div>`

// ✅✅ 창업자 확정 구조 (2026-08-22)
//   · 갈래 = **ㄷ 「앱 화면을 꽉 채우고 아래에 자막 띠」** (*"마지막이 좋은데?"*)
//   · **꼬르곰 스티커는 각 장에 안 넣는다** (*"1번이 더 깔끔한데"*)
//   · **「한끼 · 꼬르곰이 함께해요」는 «마지막 장»에** (*"마지막에 넣어도 되지 않을까"*)
//     ⭐ 내 생각도 같다 — 스토어 «검색결과»엔 앞 2~3장만 뜬다. 앞장은 「뭐하는 앱인지」에 다 써야 하고,
//        브랜드는 마지막 한 장에서 «크게» 말하는 게 세다. 매 장에 곰이 있으면 눈이 하나씩 안 센다
//        (오늘 홈에서 배운 「키 비슷한 상자가 셋 이상이면 안 세어진다」와 같은 결).

// 📐 한 장 = 앱 화면 ＋ 자막 띠. 마지막 장만 «브랜드 줄»이 붙는다
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

// 🗂 제안 6장 — ⛔순서가 곧 값어치다(앞 2~3장만 검색결과에 뜬다)
const 장들 = {
  '1-정리': { 파일: '21-상세-재료순서.png', 머리: '캡처 한 장이면<br>레시피가 정리돼요', 부제: '재료도 순서도 알아서 · 내 요리책이 돼요' },
  '2-요리책': { 파일: '20-레시피목록.png', 머리: '레시피가 쌓이면<br>나만의 요리책', 부제: '표지도 내 마음대로 꾸며요' },
  // ⛔ 꾸미기는 «서랍이 아래»라 위를 남기면 서랍이 통째로 덮인다 → 가운데를 남긴다
  '3-레꾸': { 파일: '03-꾸미기편집.png', 머리: '레시피 정리? 우린<br>레시피 레꾸해요', 부제: '스티커 붙이고 배경 깔고 · 한 끼가 추억이 돼요', 자리: 'center' },
  '4-장보기': { 파일: '04-장보기.png', 머리: '재료는 한 번에<br>사러가기', 부제: '레시피 재료 그대로 톡 · 18년차 주부의 추천템까지' },
  // ⛔ 위를 남기면 앞 절의 «잘린 회색 상자»가 걸린다 → 걸음이 꽉 차는 자리로
  '5-요리모드': { 파일: '22-상세-만드는법.png', 머리: '불 앞에서도<br>편하게', 부제: '걸음마다 타이머 · 화면도 안 꺼져요', 자리: 'center' },
  '6-브랜드': { 파일: '10-랜덤카드.png', 머리: '오늘의 한 끼를<br>카드 한 장으로', 부제: '뽑을 때마다 달라지는 카드 · 친구에게 톡', 브랜드: '한끼 · 꼬르곰이 함께해요', 자리: 'center' },
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
for (const [이름, 값] of Object.entries(장들)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${장(값)}`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(350)
  await p.screenshot({ path: join(OUT, `v5-${이름}.png`) })
  console.log(`  ✅ v5-${이름}`)
}
console.log(`\n📸 → ${OUT}`)
await br.close()

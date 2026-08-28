// 🏪🏪 스토어 01장 — 「캡처하는 법」 시안 (2026-08-28)
//
// 📮 창업자 = *"스토어 이미지 **캡쳐하는 법넣어서** 만들어야해."* → *"**큼직하게 만들어줘. 잘보이게 한눈에!**"*
//    → 갈래 ⓐ(01번을 통째로 갈아끼운다)에 **"a로 가자"**
//    → *"**1장에 sns 갤러리 다 넣으면 조잡해지는거 아닐까**"* → ✅맞다. **SNS 하나만** 넣는다.
//
// ⭐⭐ 왜 SNS 인가 — 우리 앱이 이미 정해 놨다.
//    `ImportScreen.jsx` 의 가져오기 목록에서 **SNS 칸에만 「제일 많이 써요」 알약**이 붙어 있다.
//    ＋ 스토어 검색결과엔 **앞 2~3장만** 뜬다(v5 리서치) → 첫 장은 «제일 흔한 길»이어야 한다.
//
// ⛔⛔ **위아래 2컷은 죽은 길이다 — 재 보고 접었다.**
//    그림 자리가 1500px 인데 위아래로 나누면 한 컷 높이 ~700 → 폰 비율(1080:2340)이라 **폭이 323px**.
//    좌우로 놓으면 폭 ~460 · 높이 996 이라 **훨씬 크다.** 「큼직하게」와 정반대가 될 뻔했다.
//
// 🖼 재료
//   · 인스타 = `design/promo/가져오기안내-원본캡처-2508` 의 «깨끗한 판 ＋ 도구 띠»를 합치고 공유에 빨간 동그라미
//     (⛔1번 판을 통째로 쓰면 «작은 미리보기 창»이 지저분하게 걸린다 — 실측 2118~2285 띠만 가져온다)
//   · 한끼 = `_shot-스토어용화면-0822.mjs` 가 찍은 `21-상세-재료순서.png` (⭐「엄마표 김밥」 = 브랜드 0)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-스토어01-캡처하는법-0828.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SCR = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const OUT = `${SCR}/스토어01`
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')

const 인스타 = `${OUT}/인스타-공유동그라미.png`
const 한끼 = `${SCR}/홍보/앱화면/21-상세-재료순서.png`
for (const p of [인스타, 한끼]) if (!existsSync(p)) { console.error('⛔ 재료가 없다 →', p); process.exit(1) }
const IMG_인스타 = b64(인스타)
const IMG_한끼 = b64(한끼)

// 🏷🏷 [창업자 확정 2026-08-28] 알약 문구 = **「공유 → 더보기 → 한끼앱 누르면 끝」**
//    📮 창업자 = *"공유->더보기->한끼앱 누르면 정리끝 붙일까? (공유한번이번 끝이 나을까?)"*
//       → 내가 「공유 한 번이면 끝」을 근거 셋으로 밀었는데 창업자가 *"**공유-더보기-한끼앱 누르면 끝.할까...**"*
//    ⭐⭐ 창업자가 «이유»를 말해 줬고 그게 **내 반대 근거를 통째로 무너뜨렸다** —
//       📮 *"홍보시안에서 내가 중요하게 생각한게 뭐냐면. **처음보는 사람들이 이해가 가야하니까.**
//          **공유한번 해본사람들은 저 홍보시안이 의미가 없잖아.** 그래서 더보기가 들어가야하지 않나 한거지.."*
//    ⛔⛔ 내가 댄 근거 = *"자주 쓰면 한끼가 앱 줄 첫 줄로 올라와 더보기를 안 거친다"* →
//       **대상을 잘못 잡았다.** 스토어 스샷을 보는 사람은 «앱을 아직 안 깐 사람»이다.
//       한끼로 공유해 본 적이 없으니 **앱 줄에 한끼가 있을 수가 없다 → 반드시 더보기를 거친다.**
//    📌 규칙 18 의 사촌 = **「이 화면을 누가 보는가」를 안 따지고 «기능이 어떻게 도는가»만 봤다.**
//       ＋ 창업자가 앱 안내에서 이미 같은 말을 했다 — *"390번에서 처음보는 유저들은 더보기를 알려줘야해."*
//    📐 문구가 길어져 **알약을 폰 «사이»에 못 둔다** → 세 판 다 **맨 아래 가운데**로 옮긴다.
//       ⛔ 시안ㄱ의 「보다가 캡처 / 한끼가 정리」 캡션은 뺐다 — 알약이 흐름을 다 말해 «같은 말이 두 번»이 된다.
const 알약글 = '공유 → 더보기 → 한끼앱 누르면 끝'

// ⛔ 색을 박지 않고 v5 판과 «같은 값»을 쓴다 — 앞뒤 장과 결이 튀면 안 된다
const 공통 = `
${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;background:#fbf0e0;
  font-family:'Gowun Dodum','Jua',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
body::before{content:'';position:absolute;inset:0;opacity:.5;
  background-image:radial-gradient(rgba(93,52,16,.13) 3px,transparent 3px);background-size:34px 34px}
.hh{font-family:'Jua','Gowun Dodum',system-ui,sans-serif;color:#5d3410;letter-spacing:-0.02em}
.ss{color:rgba(93,52,16,.68);letter-spacing:-0.01em}
.wrap{position:relative;z-index:2;padding:104px 76px 0;text-align:center}
.hh{font-size:92px;line-height:1.30}
.ss{font-size:40px;line-height:1.5;margin-top:22px}
.shot{border-radius:34px;border:9px solid #fffdf8;display:block;object-fit:cover;object-position:top;
  box-shadow:0 30px 62px rgba(93,52,16,.24),0 6px 16px rgba(93,52,16,.10)}
/* ⭐ 「공유 한 번」 알약 — 흐름의 «동사»가 그림 사이에 있어야 한눈에 읽힌다 */
.pill{position:absolute;z-index:5;background:#5d3410;color:#fff8ec;border-radius:999px;
  font-family:'Jua','Gowun Dodum',system-ui,sans-serif;letter-spacing:-0.01em;white-space:nowrap;
  box-shadow:0 12px 26px rgba(93,52,16,.28)}
.arrow{position:absolute;z-index:4;color:#c2703a;font-family:'Jua',sans-serif}
`

// ㉠ 좌우 나란히 — 같은 크기 두 장 ＋ 가운데 화살표
const 좌우 = `<style>${공통}
  .l{position:absolute;left:40px;top:470px;width:456px;height:988px}
  .r{position:absolute;right:40px;top:470px;width:456px;height:988px}
  .shot{width:100%;height:100%}
  .arrow{left:50%;top:964px;transform:translate(-50%,-50%);font-size:120px;line-height:1}
  .pill{left:50%;top:1546px;transform:translateX(-50%);padding:20px 44px;font-size:44px}
</style>
<div class="wrap"><div class="hh">캡처 한 장이면<br>레시피가 정리돼요</div>
  <div class="ss">보다가 캡처 · 재료도 순서도 알아서</div></div>
<div class="l"><img class="shot" src="${IMG_인스타}"></div>
<div class="arrow">›</div>
<div class="r"><img class="shot" src="${IMG_한끼}"></div>
<div class="pill">${알약글}</div>`

// ㉡ 겹침 — 인스타가 «주인공»(크게 뒤) · 한끼가 결과(앞 오른쪽 아래)
const 겹침A = `<style>${공통}
  .back{position:absolute;left:56px;top:452px;width:560px;height:1214px}
  .front{position:absolute;right:44px;top:734px;width:470px;height:1018px}
  .shot{width:100%;height:100%}
  .front .shot{border-width:11px}
  /* 📐 알약이 길어져 맨 아래 가운데로 — 두 폰(bottom 1666·1752) 아래라 안 겹친다 */
  .pill{left:50%;bottom:52px;transform:translateX(-50%);padding:20px 44px;font-size:44px}
  .arrow{left:590px;top:1140px;font-size:104px;line-height:1}
</style>
<div class="wrap"><div class="hh">캡처 한 장이면<br>레시피가 정리돼요</div>
  <div class="ss">보다가 캡처 · 재료도 순서도 알아서</div></div>
<div class="back"><img class="shot" src="${IMG_인스타}"></div>
<div class="arrow">›</div>
<div class="front"><img class="shot" src="${IMG_한끼}"></div>
<div class="pill">${알약글}</div>`

// ㉢ 겹침 반대 — 한끼가 «주인공»(크게) · 인스타는 「어디서 왔나」로 작게
const 겹침B = `<style>${공통}
  .back{position:absolute;left:44px;top:534px;width:430px;height:932px}
  .front{position:absolute;right:48px;top:444px;width:566px;height:1226px}
  .shot{width:100%;height:100%}
  .front .shot{border-width:11px}
  /* 📐 두 폰 bottom = 1466 · 1670 → 알약을 맨 아래 가운데에 둔다 */
  .pill{left:50%;bottom:52px;transform:translateX(-50%);padding:20px 44px;font-size:44px}
  .arrow{left:452px;top:984px;font-size:104px;line-height:1}
</style>
<div class="wrap"><div class="hh">캡처 한 장이면<br>레시피가 정리돼요</div>
  <div class="ss">보다가 캡처 · 재료도 순서도 알아서</div></div>
<div class="back"><img class="shot" src="${IMG_인스타}"></div>
<div class="arrow">›</div>
<div class="front"><img class="shot" src="${IMG_한끼}"></div>
<div class="pill">${알약글}</div>`

const 판들 = { '시안ㄱ-좌우': 좌우, '시안ㄴ-겹침-인스타주인공': 겹침A, '시안ㄷ-겹침-한끼주인공': 겹침B }

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
for (const [이름, 몸] of Object.entries(판들)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${몸}`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(320)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  console.log(`  ✅ ${이름}`)
}
console.log(`\n📸 → ${OUT}`)
await br.close()

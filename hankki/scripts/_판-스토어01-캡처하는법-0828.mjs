// 🏪🏪 스토어 01장 — 「캡처하는 법」 시안 (2026-08-28)
//
// 📮 창업자 = *"스토어 이미지 **캡쳐하는 법넣어서** 만들어야해."* → *"**큼직하게 만들어줘. 잘보이게 한눈에!**"*
//    → 갈래 ⓐ(01번을 통째로 갈아끼운다)에 **"a로 가자"**
//    → *"**1장에 sns 갤러리 다 넣으면 조잡해지는거 아닐까**"* → ✅맞다. **SNS 하나만** 넣는다.
//    → *"잠깐만 **공심채볶음이되어야지 오른쪽도**"* → 왼쪽·오른쪽을 «같은 요리»로 맞춘다.
//    → *"**더보기 아이콘?도 정확하게 붙여서 안내해주면 좋겠어 간단하게**"*
//
// ⭐⭐ 왜 SNS 인가 — 우리 앱이 이미 정해 놨다.
//    `ImportScreen.jsx` 의 가져오기 목록에서 **SNS 칸에만 「제일 많이 써요」 알약**이 붙어 있다.
//    ＋ 스토어 검색결과엔 **앞 2~3장만** 뜬다(v5 리서치) → 첫 장은 «제일 흔한 길»이어야 한다.
//
// ⛔⛔ **위아래 2컷은 죽은 길이다 — 재 보고 접었다.**
//    그림 자리가 1500px 인데 위아래로 나누면 한 컷 높이 ~700 → 폰 비율(1080:2340)이라 **폭이 323px**.
//    좌우로 놓으면 폭 ~460 · 높이 996 이라 **훨씬 크다.** 「큼직하게」와 정반대가 될 뻔했다.
//
// 🏷🏷 [창업자 확정] 흐름 표시 = **「공유 › 더보기 › 한끼앱」 ＋ «진짜 아이콘»**
//    📮 내가 「공유 한 번이면 끝」을 근거 셋으로 밀었는데 창업자가 **이유**를 말해 뒤집었다 —
//       *"홍보시안에서 내가 중요하게 생각한게 뭐냐면. **처음보는 사람들이 이해가 가야하니까.**
//        **공유한번 해본사람들은 저 홍보시안이 의미가 없잖아.**"* ＋ *"**한끼앱이 처음에 안보이면 못찾고 헤맬까봐..**"*
//    ⛔⛔ 내 근거(*"자주 쓰면 한끼가 앱 줄 첫 줄로 올라와 더보기를 안 거친다"*)는 **대상을 잘못 잡았다.**
//       스토어 스샷을 보는 사람은 «앱을 아직 안 깐 사람»이다 → 한끼로 공유한 적이 없으니
//       **앱 줄에 한끼가 있을 수가 없다 → 반드시 더보기를 거친다.**
//    📌 규칙 18 의 사촌 = **「이 화면을 누가 보는가」를 안 따지고 «기능이 어떻게 도는가»만 봤다.**
//       ＋ 창업자가 앱 안내에서 이미 같은 말을 했다 — *"390번에서 처음보는 유저들은 더보기를 알려줘야해."*
//    ⭐ 「간단하게」 = 글자를 늘리지 않고 **실물 아이콘 세 개**로 말한다(글자는 이름표만).
//
// 🖼 재료
//   · 인스타 = 원본 캡처의 «깨끗한 판 ＋ 도구 띠»를 합치고 공유에 빨간 동그라미
//     (⛔1번 판을 통째로 쓰면 «작은 미리보기 창»이 지저분하게 걸린다 — 실측 2118~2285 띠만 가져온다)
//   · 아이콘 셋 = `_아이콘잘라내기` 가 어제 실측 좌표로 잘라 둔 것(공유·더보기·한끼)
//   · 한끼 화면 = `_shot-스토어용화면-0822.mjs` (⭐`SHOT_RECIPE='공심채 볶음'` 로 왼쪽과 맞춘다)
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

const 있어야 = {
  인스타: `${OUT}/인스타-공유동그라미.png`,
  한끼: `${SCR}/홍보/앱화면/21-상세-재료순서.png`,
  i공유: `${OUT}/i-공유.png`,
  i더보기: `${OUT}/i-더보기.png`,
  i한끼: `${OUT}/i-한끼.png`,
}
for (const [k, p] of Object.entries(있어야)) {
  if (!existsSync(p)) { console.error(`⛔ 재료가 없다 (${k}) →`, p); process.exit(1) }
}
const IMG = Object.fromEntries(Object.entries(있어야).map(([k, p]) => [k, b64(p)]))

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
.wrap{position:relative;z-index:2;padding:100px 76px 0;text-align:center}
.hh{font-size:92px;line-height:1.30}
.ss{font-size:40px;line-height:1.5;margin-top:22px}
.shot{border-radius:34px;border:9px solid #fffdf8;display:block;object-fit:cover;object-position:top;
  box-shadow:0 30px 62px rgba(93,52,16,.24),0 6px 16px rgba(93,52,16,.10)}
.arrow{position:absolute;z-index:4;color:#c2703a;font-family:'Jua',sans-serif}

/* 🏷 흐름 띠 — «진짜 아이콘» 셋을 › 로 잇고 이름표를 아래 작게.
   ⭐ 알약 하나에 긴 문장을 넣으면 스토어 검색결과(작게 뜬다)에서 안 읽힌다. 아이콘이 대신 말한다. */
.flow{position:absolute;left:50%;transform:translateX(-50%);bottom:56px;z-index:6;
  display:flex;align-items:center;gap:14px;
  background:#fffdf8;border-radius:999px;padding:18px 34px;
  box-shadow:0 16px 34px rgba(93,52,16,.20);border:3px solid rgba(93,52,16,.10)}
.chip{display:flex;flex-direction:column;align-items:center;gap:6px;width:118px}
.chip img{width:86px;height:86px;border-radius:50%;display:block;
  box-shadow:0 3px 9px rgba(93,52,16,.18)}
.chip b{font-family:'Jua',sans-serif;font-weight:400;color:#5d3410;font-size:30px;letter-spacing:-0.02em}
.sep{font-family:'Jua',sans-serif;color:#c2703a;font-size:56px;line-height:1;margin-top:-26px}
.end{font-family:'Jua',sans-serif;color:#5d3410;font-size:36px;letter-spacing:-0.02em;
  margin-left:10px;margin-top:-26px;white-space:nowrap}
`

const 흐름띠 = `<div class="flow">
  <div class="chip"><img src="${IMG.i공유}"><b>공유</b></div>
  <div class="sep">›</div>
  <div class="chip"><img src="${IMG.i더보기}"><b>더보기</b></div>
  <div class="sep">›</div>
  <div class="chip"><img src="${IMG.i한끼}"><b>한끼</b></div>
  <div class="end">누르면 끝</div>
</div>`

const 머리 = `<div class="wrap"><div class="hh">캡처 한 장이면<br>레시피가 정리돼요</div>
  <div class="ss">보다가 캡처 · 재료도 순서도 알아서</div></div>`

// ㉠ 좌우 나란히 — 같은 크기 두 장 ＋ 가운데 화살표
const 좌우 = `<style>${공통}
  .l{position:absolute;left:40px;top:452px;width:456px;height:988px}
  .r{position:absolute;right:40px;top:452px;width:456px;height:988px}
  .shot{width:100%;height:100%}
  .arrow{left:50%;top:946px;transform:translate(-50%,-50%);font-size:120px;line-height:1}
</style>
${머리}
<div class="l"><img class="shot" src="${IMG.인스타}"></div>
<div class="arrow">›</div>
<div class="r"><img class="shot" src="${IMG.한끼}"></div>
${흐름띠}`

// ㉡ 겹침 — 인스타가 «주인공»(크게 뒤) · 한끼가 결과(앞 오른쪽 아래)
const 겹침A = `<style>${공통}
  .back{position:absolute;left:56px;top:440px;width:560px;height:1160px}
  .front{position:absolute;right:44px;top:700px;width:470px;height:972px}
  .shot{width:100%;height:100%}
  .front .shot{border-width:11px}
</style>
${머리}
<div class="back"><img class="shot" src="${IMG.인스타}"></div>
<div class="front"><img class="shot" src="${IMG.한끼}"></div>
${흐름띠}`
// ⛔ 화살표(›)를 **뺐다** — 겹치는 50px 띠에 놓여 있어 한끼 화면의 「소스」 글자를 덮었다(실물로 봤다).
//    ⭐ 자리를 옮기는 대신 «없앴다» — 아래 흐름 띠가 이미 › 로 흐름을 말한다. 두 번 말할 이유가 없다.
//    ⚠️ ㉢은 화살표가 두 폰 «사이 빈 자리»에 떨어져 있어 안 겹친다 → 거긴 그대로 둔다.

// ✅✅✅ [창업자 확정 2026-08-28] **㉢ 으로 간다 — 이게 스토어 01장이다.**
//    📮 *"레시피 저장되는걸 보여줘야하니까 난 2번째가 좋은 것 같아."* → *"아 **ㄷ는 아래가 시원한**"* → *"**ㄷ하자 ㅋㅋㅋ**"*
//    ⭐ 창업자가 짚은 것 = ㉢은 폰 아래에 «여백»이 있어 흐름 띠가 답답하게 안 붙는다.
//       ＋ 한끼 화면이 제일 커서 「레시피가 저장된 모습」이 그대로 읽힌다(창업자가 먼저 댄 이유도 그것이다).
//    ⛔ ㉠㉡ 은 지우지 않는다 — 나중에 다시 견줄 때 «다시 만들» 필요가 없다.
// ㉢ 겹침 반대 — 한끼가 «주인공»(크게) · 인스타는 「어디서 왔나」로 작게
const 겹침B = `<style>${공통}
  .back{position:absolute;left:44px;top:520px;width:430px;height:892px}
  .front{position:absolute;right:48px;top:434px;width:566px;height:1172px}
  .shot{width:100%;height:100%}
  .front .shot{border-width:11px}
  .arrow{left:452px;top:958px;font-size:104px;line-height:1}
</style>
${머리}
<div class="back"><img class="shot" src="${IMG.인스타}"></div>
<div class="arrow">›</div>
<div class="front"><img class="shot" src="${IMG.한끼}"></div>
${흐름띠}`

const 판들 = { '시안ㄱ-좌우': 좌우, '시안ㄴ-겹침-인스타주인공': 겹침A, '시안ㄷ-겹침-한끼주인공': 겹침B }

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
for (const [이름, 몸] of Object.entries(판들)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${몸}`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(320)
  // 🔎 규칙 21 의 짝 — 흐름 띠가 «화면 밖으로» 나가면 잡는다(글자가 늘면 조용히 넘친다)
  const 넘침 = await p.evaluate(() => {
    const f = document.querySelector('.flow'); if (!f) return '띠가 없다'
    const r = f.getBoundingClientRect()
    return (r.left < 8 || r.right > 1072) ? `띠가 넘쳤다 (${Math.round(r.left)}~${Math.round(r.right)})` : ''
  })
  if (넘침) console.log(`  ⚠️ ${이름} — ${넘침}`)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  console.log(`  ✅ ${이름}`)
}
console.log(`\n📸 → ${OUT}`)
await br.close()

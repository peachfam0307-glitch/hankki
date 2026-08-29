// 💬🚨 **릴스 자막판 — 「긴급 출동 무전」 자막을 투명 PNG 로 뽑는다**
//
// 📮 창업자 2026-08-29 =
//    *"자막이나 알려주는 포인트가 없어서 무슨 내용인지 모를 것 같아"*
//    *"우리ui나올때 뭐가뭔지 안내해줘야 할 것 같아."*
//    *"**좀 재밌게 설명해주면 좋겠어. 우리시안이 병맛이니까**"*
//    *"네가 컨셉을 잡아서 넣어야해. … **병맛이 가미된**"*
//
// ⛔⛔ **내가 「시안이 말해주니 자막은 필요 없다」고 했는데 틀렸다.**
//    시안은 «앞뒤 3초»만 나오고, 가운데 18초 동안 앱 화면만 흐른다.
//    만든 사람은 무슨 화면인지 알지만 **처음 보는 사람은 모른다.**
//
// ⭐⭐ **한글 폰트가 시스템에 없다** — `fc-list` = 일본어 IPAGothic 뿐이고 ttf 도 fonttools 도 없다.
//    → ffmpeg `drawtext` 는 못 쓴다.
//    ✅ **브라우저로 그린다** — `design/promo/fonts` 에 앱이 쓰는 **woff2** 가 있고 크로미움은 그걸 그대로 읽는다.
//       덤으로 **앱과 같은 글꼴**이 되고, CSS 라 테두리·그림자·둥근 모서리를 마음대로 준다.
//
// 🎨 컨셉 = **「긴급 출동 무전」** — 4화 시안이 폭발물 처리반이라 자막도 무전 보고 투로 통일한다.
//    ⛔ 화면마다 말투가 갈리면 병맛이 «어설픔»으로 읽힌다. 한 사람이 무전하는 것처럼.
//
// 실행: node scripts/_영상-릴스자막-0829.mjs
// ⛔ `_fresh.mjs`(dist 신선도 검사)를 부르지 «않는다» — 이 판은 **앱을 띄우지 않는다.**
//    글자를 그린 HTML 만 찍으므로 dist 와 아무 상관이 없고, 부르면 엉뚱한 이유로 막힌다.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/릴스/자막'
mkdirSync(OUT, { recursive: true })

// 📐 자막 띠 = 릴스 폭 1080 × 높이 170 (합성판이 앱 화면 «위»에 놓는다)
// ⭐ 두 줄에서 한 줄이 되며 250 → 170 으로 줄였다 — **그만큼 앱 화면이 커진다.**
// ⚠️ 이 높이는 합성판(`_영상-타이머릴스-편집-0829.mjs`)의 `자막띠` 와 «같아야» 한다.
const W = 1080, H = 170

// 🚨🚨 **스토리보드** — `초` 는 «앱 실사 구간이 시작된 뒤» 몇 초인지다(인트로 길이는 합성판이 더한다).
//
// ⛔⛔ **첫 판이 화면과 어긋났다 — 「프레임 차이가 큰 순간」을 «무슨 화면인지 안 보고» 해석했다.**
//    5.13s 를 「재료준비→STEP1」이라 단정했는데 실제로는 **STEP 3 → 타이머 시트**였다.
//    📌 차이가 «크다»는 건 뭔가 바뀌었다는 뜻일 뿐, **무엇으로 바뀌었는지는 안 알려준다**(규칙 18).
// ✅ 그래서 본편을 **0.5초마다 뽑아 전부 눈으로 봤다**(절대원칙 21). 아래가 그 실측이다 —
//    0.0~1.4 재료 준비 / 1.4~4.8 STEP 1→2→3 / 4.8~6.3 타이머 시트 /
//    6.3~9.8 요리모드＋타이머(9:59→9:56) / 9.8~13.6 상세→홈(9:56→9:53) / 13.6~ 장보기(9:52→9:50)
//
// ⛔⛔ **첫 판이 「무슨 말인지 모르겠다」는 말을 들었다** —
//    📮 창업자 = *"자막이 저렇게 위에 2개가 붙어??"* → *"**두개가 같이 있으니까 정신이 없고 무슨말인지 모르겠어;;**"*
//    ⭐⭐ 뿌리 둘 —
//    ⑴ **두 덩어리(빨간 머리 ＋ 흰 본문)라 눈이 두 번 읽어야 했다.** 릴스는 스쳐 지나간다.
//    ⑵ ⭐**내가 병맛에 치우쳐 정작 «설명»을 안 했다.** 「② 기폭 장치 세팅」이라 써놓고
//       **「타이머」라는 낱말을 한 번도 안 썼다.** 창업자가 시킨 건 *"우리ui나올때 뭐가뭔지 안내해줘"* 였다.
//
// ⭐⭐ **창업자가 원하는 것을 다시 정리해 줬다** —
//    📮 *"유저가 **이 앱은 저런 기능이있구나 편하겠네** 생각을 해야하니까 **재밌게** 자막을 달아달라는 뜻이었어. 센스있게"*
//    → 셋을 «한 줄»에 다 담아야 한다: **① 무슨 기능인지 ② 그래서 뭐가 편한지 ③ 말맛**
//    ⛔ 내가 두 번 반쪽을 냈다 — 처음엔 병맛만(「기폭 장치 세팅」＝무슨 기능인지 모름),
//       그다음엔 설명만(「단계마다 타이머」＝맞는 말인데 아무 느낌이 없다).
//    ✅ **잣대 = 「그래서 뭐가 편한데?」에 그 줄이 스스로 답하나.**
//       「단계마다 타이머」는 답을 못 하고, 「눌러두면 알려줘요」는 답한다.
export const 자막들 = [
  { 초: 0.0,  끝: 1.4,  글: '장 봐온 거 다 있나 먼저 체크' },
  { 초: 1.4,  끝: 4.8,  글: '지금 이 단계만 크게 · 안 헤매요' },
  { 초: 4.8,  끝: 6.3,  글: '3분? 5분? 눌러두면 알려줘요' },
  { 초: 6.3,  끝: 9.8,  글: '손 젖어도 화면은 안 꺼져요' },
  { 초: 9.8,  끝: 13.6, 글: '딴 화면 가도 타이머는 계속' },
  { 초: 13.6, 끝: 99,   글: '장 보는 동안 냄비는 우리가' },
]

// ⭐ **한 줄 · 한 문장.** 띠 하나라 눈이 «한 번»만 읽는다.
//    🚨 시안이 폭발물 처리반이니 띠 색만 그 빨강을 쓴다 — 말투까지 무전으로 하면 설명이 사라진다.
const 판 = (글) => `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family:'Jua'; src:url('file://${join(ROOT, 'design/promo/fonts/jua-korean-400.woff2')}') format('woff2'); }
  html,body { margin:0; width:${W}px; height:${H}px; background:transparent; }
  .wrap { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
  .one { background:#c0261f; color:#fff; font-family:'Jua',sans-serif;
         font-size:58px; line-height:1; padding:26px 48px 32px; border-radius:26px;
         border:5px solid #fff; box-shadow:0 11px 0 rgba(0,0,0,.28); white-space:nowrap; }
</style>
<div class="wrap"><div class="one">${글}</div></div>`

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
  // 🔢 띠가 화면 밖으로 삐져나가면 글자가 잘린다 — «찍기 전»에 재서 막는다(규칙 18)
  const 폭 = await p.evaluate(() => document.querySelector('.one').getBoundingClientRect().width)
  if (폭 > W - 40) { console.error(`✗ 「${s.글}」 띠가 ${Math.round(폭)}px — ${W - 40}px 를 넘는다. 글을 줄일 것`); process.exit(1) }
  const 길 = join(OUT, `${String(i).padStart(2, '0')}.png`)
  await p.screenshot({ path: 길, omitBackground: true })   // ⭐ 투명 배경이라야 앱 위에 얹힌다
  만든것.push({ ...s, 파일: 길 })
  console.log(`  ${String(s.초).padStart(5)}s ~ ${String(s.끝).padStart(5)}s  「${s.글}」 (${Math.round(폭)}px)`)
}
await b.close()

writeFileSync(join(OUT, '자막목록.json'), JSON.stringify(만든것, null, 2))
console.log(`\n✅ 자막 ${만든것.length}장 = ${OUT}\n`)

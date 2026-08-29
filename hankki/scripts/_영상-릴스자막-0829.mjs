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
import './_fresh.mjs'
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/릴스/자막'
mkdirSync(OUT, { recursive: true })

// 📐 자막 띠 = 릴스 폭 1080 × 높이 250 (합성판이 앱 화면 «위»에 놓는다)
const W = 1080, H = 250

// 🚨🚨 **스토리보드** — `초` 는 «앱 실사 구간이 시작된 뒤» 몇 초인지다(인트로 길이는 합성판이 더한다).
//
// ⛔⛔ **첫 판이 화면과 어긋났다 — 「프레임 차이가 큰 순간」을 «무슨 화면인지 안 보고» 해석했다.**
//    5.13s 를 「재료준비→STEP1」이라 단정했는데 실제로는 **STEP 3 → 타이머 시트**였다.
//    📌 차이가 «크다»는 건 뭔가 바뀌었다는 뜻일 뿐, **무엇으로 바뀌었는지는 안 알려준다**(규칙 18).
// ✅ 그래서 본편을 **0.5초마다 뽑아 전부 눈으로 봤다**(절대원칙 21). 아래가 그 실측이다 —
//    0.0~1.4 재료 준비 / 1.4~4.8 STEP 1→2→3 / 4.8~6.3 타이머 시트 /
//    6.3~9.8 요리모드＋타이머(9:59→9:56) / 9.8~13.6 상세→홈(9:56→9:53) / 13.6~ 장보기(9:52→9:50)
export const 자막들 = [
  { 초: 0.0,  끝: 1.4,  머리: '작전 개시',       본문: '재료부터 확인' },
  { 초: 1.4,  끝: 4.8,  머리: '① 한 걸음씩',     본문: '넘기면 다음 단계 · 손 젖어도 OK' },
  { 초: 4.8,  끝: 6.3,  머리: '② 기폭 장치 세팅', 본문: '1분~30분 · 알림음 5개' },
  { 초: 6.3,  끝: 9.8,  머리: '③ 카운트다운 개시', 본문: '요리하는 동안 화면도 안 꺼져요' },
  { 초: 9.8,  끝: 13.6, 머리: '⚠ 여기가 진짜다',  본문: '딴 화면으로 가도 안 꺼진다' },
  { 초: 13.6, 끝: 99,   머리: '장 보는 중에도',   본문: '아래에서 째깍째깍' },
]

const 판 = (머리, 본문) => `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family:'Jua'; src:url('file://${join(ROOT, 'design/promo/fonts/jua-korean-400.woff2')}') format('woff2'); }
  @font-face { font-family:'Gowun'; src:url('file://${join(ROOT, 'design/promo/fonts/gowun-dodum-korean-400.woff2')}') format('woff2'); }
  html,body { margin:0; width:${W}px; height:${H}px; background:transparent; }
  .wrap { width:100%; height:100%; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:14px; font-family:'Jua',sans-serif; }
  /* 🚨 무전 머리줄 — 폭발물 처리반이라 「경고 띠」 결로 */
  .head { display:inline-flex; align-items:center; gap:16px;
          background:#c0261f; color:#fff; font-size:62px; line-height:1;
          padding:20px 40px 26px; border-radius:22px;
          border:5px solid #fff; box-shadow:0 10px 0 rgba(0,0,0,.28); }
  .head::before, .head::after { content:'///'; color:#ffd7a8; font-size:38px; letter-spacing:-4px; }
  .body { font-family:'Gowun',sans-serif; font-size:42px; color:#2b1a0f;
          background:rgba(255,255,255,.94); padding:12px 34px 16px; border-radius:16px;
          border:3px solid #2b1a0f; box-shadow:0 7px 0 rgba(43,26,15,.22); }
</style>
<div class="wrap"><div class="head">${머리}</div><div class="body">${본문}</div></div>`

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const p = await ctx.newPage()

const 만든것 = []
for (let i = 0; i < 자막들.length; i++) {
  const s = 자막들[i]
  await p.setContent(판(s.머리, s.본문))
  await p.evaluate(() => document.fonts.ready)   // ⛔ 폰트가 오기 «전»에 찍으면 기본 고딕으로 나온다
  await p.waitForTimeout(200)
  const 길 = join(OUT, `${String(i).padStart(2, '0')}.png`)
  await p.screenshot({ path: 길, omitBackground: true })   // ⭐ 투명 배경이라야 앱 위에 얹힌다
  만든것.push({ ...s, 파일: 길 })
  console.log(`  ${String(s.초).padStart(5)}s ~ ${String(s.끝).padStart(5)}s  「${s.머리}」 ${s.본문}`)
}
await b.close()

writeFileSync(join(OUT, '자막목록.json'), JSON.stringify(만든것, null, 2))
console.log(`\n✅ 자막 ${만든것.length}장 = ${OUT}\n`)

// 🐻🐧🦫 우리 애들 «총 자산» 검수판 (2026-09-07)
//
// 📮 창업자 = *"너는 우리애들 총 자산 검수판 만들어줘. **맨날 쓰는 것만 쓰니까.**"*
//    🔢 맞는 말이다 — 소소 ①②③ 24장에 쓴 컷이 **12종뿐**이었다
//       (pjs_03·05·07·08 · duos_01·02·03·04·08 · gp_gomtb·gomhi · ka_g02·c02·c04).
//
// ⭐ 목록을 «손으로 적지 않는다» — 폴더를 읽어서 판을 만든다.
//    10/1 에 32컷 · 11/1 에 17컷 · 2027-03-01 에 23컷이 더 열리는데, 손목록은 그때 반드시 낡는다.
//
// 🚦 묶음을 «정본 / 앱 라이브 / 카드풀에서 내린 것»으로 «갈라서» 낸다 —
//    한 판에 섞으면 옛 펭펭(매끈 베레·트렌치)을 골라 쓰게 된다. ②편에서 실제로 그럴 뻔했다.
//    근거 = docs/stickers/README.md 1184~1200줄(현행 세대 · 2026-09-02 옛 컷을 카드풀에서 내렸다)
//
// 🔢 크기는 «높이»로 맞춘다 — 원본이 427~700px 로 제각각이라 폭으로 맞추면 캐릭터가 들쭉날쭉해진다.
//    캐러셀 생산기(_판-소소기록캐러셀-0907)와 «같은 잣대»라야 이 판이 캐러셀을 대신 판정한다.
//
// 실행: SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-애들자산-0907.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const POOL = join(ROOT, 'src/assets/sharepool')
const PHOTO = join(ROOT, 'src/assets/stickers/photo')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/애들자산'
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')

// 📁 폴더에서 접두어로 «읽어» 온다 — 손목록 금지
const 뽑기 = (dir, re) => readdirSync(dir).filter((f) => f.endsWith('.png') && re.test(f)).sort().map((f) => ({ key: f.replace(/\.png$/, ''), 길: join(dir, f) }))

// 🎬 세 편에서 «이미 쓴» 컷 — 판에 「썼음」 도장을 찍는다(같은 것만 또 쓰지 않으려고)
const 쓴것 = new Set(['pjs_03', 'pjs_05', 'pjs_07', 'pjs_08', 'duos_01', 'duos_02', 'duos_03', 'duos_04', 'duos_08', 'gp_gomtb', 'gp_gomhi', 'ka_g02', 'ka_c02', 'ka_c04'])

const 묶음들 = [
  { 판: '01-정본', 제목: '⭐ 정본 — 2026-09-02 새로 뽑은 것 (홍보물은 여기서 먼저 고른다)', 칸: [
    { 이름: '펭펭 솔로 · pjs_', 설명: '먹고 마신다 4 ＋ 부엌에서 한 끼 4', 컷: 뽑기(POOL, /^pjs_/) },
    { 이름: '꼬르곰·펭펭 콤비 · duos_', 설명: '둘이 한 끼를 만든다 ＋ 둘이 쉬어 간다', 컷: 뽑기(POOL, /^duos_/) },
  ] },
  { 판: '02-앱라이브', 제목: '✅ 앱 라이브 — 친구들 탭 맨 위 (v8.14 물결 정본)', 칸: [
    { 이름: '꼬르곰 · gp_gom', 설명: '화이팅 · 엄지 · 브이 · 인사', 컷: 뽑기(POOL, /^gp_gom/) },
    { 이름: '펭펭 · gp_peng', 설명: '⚠️ 펭펭 그림이 2026-09-02 정본보다 옛 판이다 — 곰과 짝지을 때만', 컷: 뽑기(POOL, /^gp_peng/) },
    { 이름: '콤비 · gp_duo', 설명: '⚠️ 같은 이유 — duos_ 가 있으면 그쪽을 먼저', 컷: 뽑기(POOL, /^gp_duo/) },
  ] },
  { 판: '03-꼬르곰', 제목: '🐻 꼬르곰 솔로 — gom_ · gn_ (곰은 정본 그대로다)', 칸: [
    { 이름: '요리·살림 · gom_', 설명: '냄비 · 팬 · 반죽 · 파스타 · 당근 · 장보기 …', 컷: 뽑기(POOL, /^gom_/) },
    { 이름: '감정 · gn_', 설명: '응원 · 화이팅 · 하트 · 인사 · 만세 · 냠 · 놀람', 컷: 뽑기(POOL, /^gn_/) },
  ] },
  { 판: '04-카롱', 제목: '🦫 카롱 — 2026-09-01 데뷔 (가을이 카롱 철이다)', 칸: [
    { 이름: '카롱 솔로 · ka_', 설명: 'Stickers.jsx:1926 · season autumn · from 2026-09-01', 컷: 뽑기(PHOTO, /^ka_/) },
    { 이름: '카롱과 펭펭 · kp_', 설명: '부녀 케미 12컷 — 운동·힐링이 카롱 담당', 컷: 뽑기(PHOTO, /^kp_/) },
  ] },
  { 판: '05-가을', 제목: '🍂 가을 곰펭 — au_b (10/1·11/1 에 더 열린다)', 칸: [
    { 이름: '가을 · au_b', 설명: '9/1 부터 서랍에 있다 — 홍보물엔 아직 한 컷도 안 썼다', 컷: 뽑기(PHOTO, /^au_b/) },
  ] },
  { 판: '06-내린것', 제목: '⛔ 카드 뽑기 풀에서 «내린» 옛 컷 — 홍보물에 쓰지 않는다 (README 1184줄)', 칸: [
    { 이름: '옛 펭펭 · peng_ · pn_', 설명: '온보딩·홈 카드가 아직 쓰고 있어 지우지만 않았다', 컷: [...뽑기(POOL, /^peng_/), ...뽑기(POOL, /^pn_/)] },
    { 이름: '옛 콤비 · duo_', 설명: 'duos_ 로 갈아탔다', 컷: 뽑기(POOL, /^duo_/) },
    { 이름: '여름 · sm_', 설명: '철이 지났다 — 내년 여름에 다시', 컷: 뽑기(POOL, /^sm_/) },
  ] },
]

const 칸그림 = (c) => `<div class="cell${쓴것.has(c.key) ? ' used' : ''}">
  <div class="ph"><img src="${b64(c.길)}"></div>
  <div class="key">${c.key}</div>${쓴것.has(c.key) ? '<div class="stamp">썼음</div>' : ''}</div>`

const 판만들기 = (묶음) => `<style>${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;background:#f6f4ef;font-family:'Gowun Dodum',system-ui,sans-serif;padding:34px 30px 40px}
h1{font-family:'Jua';font-size:40px;color:#3b3a36;margin-bottom:6px}
.sub{font-size:20px;color:#8b8478;margin-bottom:26px}
h2{font-family:'Jua';font-size:30px;color:#5d3410;margin:26px 0 4px}
.desc{font-size:19px;color:#8b8478;margin-bottom:14px}
.grid{display:flex;flex-wrap:wrap;gap:14px}
.cell{position:relative;width:270px;background:#efece5;border:2px solid #e0dbd0;border-radius:16px;padding:10px 10px 8px;text-align:center}
.cell.used{border-color:#c98b5e;background:#f6ece2}
.ph{height:210px;display:flex;align-items:center;justify-content:center}
.ph img{height:190px;width:auto;max-width:250px;object-fit:contain}
.key{font-family:'Gowun Dodum';font-size:19px;color:#5a5347;letter-spacing:-0.01em}
.stamp{position:absolute;right:8px;top:8px;background:#c9603e;color:#fff;font-size:16px;border-radius:999px;padding:3px 12px}
.foot{margin-top:30px;font-size:18px;color:#9a9285}</style>
<h1>${묶음.제목}</h1>
<div class="sub">칸 테두리가 진한 것 = 소소 기능 ①②③ 에 «이미 쓴» 컷 · 크기는 원본이 제각각이라 «높이»로 맞춰 보여준다</div>
${묶음.칸.map((k) => `<h2>${k.이름} <span style="font-size:22px;color:#9a9285">${k.컷.length}컷</span></h2>
<div class="desc">${k.설명}</div>
<div class="grid">${k.컷.map(칸그림).join('')}</div>`).join('')}
<div class="foot">한끼 · 우리 애들 자산 검수판 · 2026-09-07 · 폴더를 읽어서 만든다(손목록 아님)</div>`

const br = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1.4 })
let 총 = 0
for (const 묶음 of 묶음들) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${판만들기(묶음)}`)
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250)
  await p.screenshot({ path: `${OUT}/애들자산-${묶음.판}.png`, fullPage: true })
  const n = 묶음.칸.reduce((a, k) => a + k.컷.length, 0); 총 += n
  console.log('  🖼', 묶음.판, n + '컷')
}
await br.close()
// 📄 글자 목록도 같이 낸다 — 캐러셀을 짤 때 «이름»으로 집으려면 그림만으론 모자란다
writeFileSync(`${OUT}/애들자산-목록.txt`, 묶음들.map((묶) => `\n■ ${묶.제목}\n` + 묶.칸.map((k) => `  · ${k.이름} (${k.컷.length}) — ${k.컷.map((c) => c.key + (쓴것.has(c.key) ? '*' : '')).join(' ')}`).join('\n')).join('\n') + `\n\n(* = 소소 ①②③ 에 이미 쓴 컷 ${쓴것.size}종)\n`)
console.log(`\n🐻🐧🦫 ${묶음들.length}판 · ${총}컷 → ${OUT}`)

// 【✅ 반영됨 · v11.19 · smoke 게이트】 ⛔이 판이 죽으면 배포가 막힌다 — 문구를 되돌린 것이다.
// 🔗✅ 「링크가 되는 척하지 않는가」 — 창업자 확정 ⓑ 검증 (2026-08-21)
//
// 📮 창업자 = *"우리 링크는 아예 안돼 원래"* → *"AI가져오기처럼 링크 넣으면 자동으로 레시피가 작성되는게
//    아니라 그냥 보관함에 담기고 직접입력해야하잖아. **그건 내가 말한 저장이 아니야 그걸 누가써**"*
//    → 갈래 셋 중 *"B로 할까"* · *"네가 알아서해."* · *"**C는 되면 좋으니까 서버되면 꼭 하자**"*
//
// ⭐⭐ **이 판의 심장 = 「안 되는 걸 약속하는 글자가 «남아 있나»」.**
//    ⛔ 「화면이 예쁜가」를 재는 판이 아니다. 그건 창업자가 본다(규칙 11).
//    ⛔ 「링크 저장이 되나」도 아니다 — 그건 `_repro-링크저장-0821.mjs` 가 이미 쟀고 **된다**.
//       문제는 «되는 것»이 아니라 «안 되는 걸 된다고 적어둔 것»이었다.
//
// 🔢 그래서 세 가지를 잰다
//    ⑴ ⛔**금지 문구**가 화면에서 사라졌나 (「블로그 글 읽어오기」·「본문 자동 읽기」·「캡처·링크 올리면」…)
//    ⑵ ✅**정직 문구**가 그 자리에 있나 (「주소만」·「안 담겨요」) — ⛔지우기만 하면 유저는 아무것도 모른다
//    ⑶ 📥**Inbox 입구가 «늘»** 보이나 (창업자 *"INBOX나도 어딨는지 모르는데"*)
//
// ⛔⛔ 규칙 18 ⓘ — 「검사가 무엇을 보는지」.
//    이 판은 **화면에 «그려진 글자»**(innerText)를 본다. 소스를 grep 하면
//    주석에 적어둔 옛 문구까지 걸려서 **고쳐놓고도 실패로 나온다**(주석에 경위를 길게 적는 우리 방식과 충돌).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-링크정직-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/링크정직'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4406, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

let 통과 = 0, 실패 = 0
const 실패목록 = []
function chk(이름, 조건) {
  if (조건) 통과++; else { 실패++; 실패목록.push(이름) }
  console.log(`  ${조건 ? '✅' : '❌'} ${이름}`)
  return !!조건
}

// ⛔ 「되는 척」하는 문구들 — 하나라도 화면에 남아 있으면 실패다.
//    ⭐ 「링크」라는 «낱말 자체»는 금지가 아니다(주소를 담는 기능은 그대로 있다).
//       금지되는 건 **「링크에서 내용을 가져온다」는 약속**뿐이다.
const 금지 = [
  '블로그 글 읽어오기',
  '본문 자동 읽기',
  '본문 읽는 중',
  '캡처·링크 올리면',
  '블로그 링크 (베타)',
  '되는 페이지만',
  '링크에서 내용을 읽는 중',
  '자동 읽기는 블로그에 따라',
]

const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const 에러 = []
page.on('pageerror', (e) => 에러.push(String(e.message).split('\n')[0]))
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
await page.goto('http://127.0.0.1:4406/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const 글자 = () => page.evaluate(() => document.body.innerText || '')
const 없나 = async (말들) => {
  const t = await 글자()
  return 말들.filter((m) => t.includes(m))
}

console.log('\n🔗 링크 정직하게 — 창업자 확정 ⓑ 검증\n')

// ── ① 홈 : Inbox 입구가 «늘» 보이나 (지금 저장소는 미정리 0개다) ──
console.log('── ① 홈 · Inbox 입구 ──')
const 미정리 = await page.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).filter((r) => r.status === 'unsorted').length } catch { return -1 }
})
console.log(`  · 미정리 ${미정리}개 (0개라야 이 검사가 뜻이 있다)`)
// 🔁 [2026-08-22 창업자 확정] 입구가 «글자 카드» → «상단바 아이콘»으로 옮겨졌다.
//    📮 창업자 = *"임시보관함은 저기에 있으면 좀 지저분해보영.."* ＋ *"그옆에 임시보관함 아이콘을 넣던가"*
//    ⛔⛔ 그래서 이 검사가 빨간불이 됐고 **그게 맞는 동작이다** — 잣대가 «글자»를 보고 있었으니까.
//    ⭐ 지키려는 것은 «글자»가 아니라 **「입구가 늘 있나」** 다 → 잣대를 «누를 수 있는 자리»로 옮긴다.
//       (규칙 18 ⓘ — 검사가 «무엇을 보는지». 8/20 별점 검사도 같은 이유로 잣대를 옮겼다)
const 입구 = 'button[aria-label^="임시보관함"]'
const 홈글 = await 글자()
chk('① 미정리가 0개인데도 임시보관함 입구가 «있다»(상단바 아이콘)', await page.locator(입구).count() > 0)
writeFileSync(join(OUT, '1-홈.png'), await page.screenshot())

// 눌러서 진짜 열리나 — 「보인다」와 「간다」는 다른 말이다(규칙 21)
await page.locator(입구).first().click().catch(() => {})
await page.waitForTimeout(900)
const 보관함글 = await 글자()
chk('② 눌렀더니 임시보관함이 «열린다»', /임시보관함/.test(보관함글))
// 🏷 창업자 = *"INBOX나도 어딨는지 모르는데"* — 입구를 늘 띄워도 **이름이 영어면 같은 곳인 줄 모른다.**
//    홈과 화면 제목이 «같은 말»이라야 유저가 둘을 잇는다.
//    ⛔ 「보관함」으로 갔다가 창업자가 물렸다 — *"임시보관함으로 바꾸던가.. 그냥 보관함은 애매"*
chk('③ ⭐화면에 영어 「Inbox」가 «0개»', !/Inbox/i.test(보관함글))
writeFileSync(join(OUT, '2-보관함.png'), await page.screenshot())
await page.goBack(); await page.waitForTimeout(700)

// ── ② 가져오기 첫 화면 ──
console.log('\n── ② 가져오기 첫 화면 ──')
await page.getByRole('button', { name: '가져오기' }).first().click()
await page.waitForTimeout(800)
const 남은1 = await 없나(금지)
chk(`③ 금지 문구 0개 (남은 것: ${남은1.join(' / ') || '없음'})`, 남은1.length === 0)
const t1 = await 글자()
chk('④ 「링크 주소만 담아두기」로 이름이 바뀌었다', t1.includes('링크 주소만 담아두기'))
chk('⑤ 「재료·순서는 안 담겨요」가 목록에서 바로 보인다', t1.includes('안 담겨요'))
chk('⑥ 텍스트 붙여넣기 설명이 커졌다(재료·순서까지)', t1.includes('재료·순서까지 자동 정리'))
writeFileSync(join(OUT, '3-가져오기.png'), await page.screenshot())

// ── ③ AI 자동정리 시트 — 여기가 제일 세게 약속하던 자리 ──
console.log('\n── ③ AI 자동정리 시트 ──')
await page.getByText('AI 자동 정리', { exact: false }).first().click()
await page.waitForTimeout(800)
const 남은2 = await 없나(금지)
chk(`⑦ 시트에도 금지 문구 0개 (남은 것: ${남은2.join(' / ') || '없음'})`, 남은2.length === 0)
writeFileSync(join(OUT, '4-AI시트.png'), await page.screenshot())
await page.getByText('닫기', { exact: false }).first().click()
await page.waitForTimeout(600)

// ── ④ 링크 화면 ──
console.log('\n── ④ 링크 화면 ──')
await page.getByText('링크 주소만 담아두기', { exact: false }).first().click()
await page.waitForTimeout(800)
const t2 = await 글자()
const 남은3 = await 없나(금지)
chk(`⑧ 링크 화면에 금지 문구 0개 (남은 것: ${남은3.join(' / ') || '없음'})`, 남은3.length === 0)
chk('⑨ ⭐「주소만 담아둬요」를 «맨 먼저» 말한다', t2.includes('주소만 담아둬요'))
chk('⑩ 「재료·만드는 법은 안 담겨요」', /재료·만드는 법은/.test(t2) && t2.includes('안 담겨요'))
chk('⑪ 되는 길(텍스트 붙여넣기)을 같이 알려준다', t2.includes('텍스트 붙여넣기'))
// ⭐ 버튼이 하나뿐이라야 한다 — 「저장」과 「자동 읽기」 둘이 나란하면 유저는 더 좋아 보이는 쪽을 누른다
// ⛔⛔ 첫 판이 `/저장/` 으로 찾다가 **화면 뒤에 남아 있던 홈 카드**를 셋이나 잡았다
//    (「저장해두고 아직 한 번도 안 만든 거예요」). 앱이 아니라 **잣대가 틀린 것**이었다.
//    📌 화면을 옮겨도 앞 화면 DOM 은 남아 있다 — 잣대는 «이 화면의 그 단추»를 콕 집어야 한다.
//    ✅ 「저장」을 빼고 이 화면에만 있는 낱말로 좁힌다.
const 버튼들 = await page.evaluate(() =>
  [...document.querySelectorAll('button')].map((x) => (x.textContent || '').trim()).filter((s) => /담아두기|자동 읽기|본문/.test(s)))
console.log(`     화면의 관련 단추 = ${JSON.stringify(버튼들)}`)
chk('⑫ ⭐단추가 «하나»뿐이다(고를 게 없으면 헷갈릴 것도 없다)', 버튼들.length === 1 && 버튼들[0].includes('주소만 담아두기'))
writeFileSync(join(OUT, '5-링크화면.png'), await page.screenshot())

// ── ⑤ 실제로 담아 보고 → 썸네일이 ✕ 가 아닌지 ──
console.log('\n── ⑤ 담아 보기 · 썸네일 ──')
await page.evaluate(() => {
  const set = (el, v) => {
    const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    d ? d.call(el, v) : (el.value = v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const 칸들 = [...document.querySelectorAll('input')]
  const 주소칸 = 칸들.find((x) => /https?:\/\//.test(x.placeholder || ''))
  const 제목칸 = 칸들.find((x) => /예\s*\)/.test(x.placeholder || ''))
  if (주소칸) set(주소칸, 'https://blog.naver.com/hankkitest/223456789')
  if (제목칸) set(제목칸, '정직판 시험')
})
await page.waitForTimeout(400)
await page.evaluate(() => {
  const b2 = [...document.querySelectorAll('button')].find((x) => /주소만 담아두기/.test(x.textContent || ''))
  if (b2) b2.click()
})
await page.waitForTimeout(1800)
const 담김 = await page.evaluate(() => {
  try {
    const rs = JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []
    const r = rs.find((x) => (x.sourceUrl || '') === 'https://blog.naver.com/hankkitest/223456789')
    return r ? { 있다: true, 상태: r.status, 아이콘: r.icon } : { 있다: false }
  } catch { return { 있다: false } }
})
chk('⑬ 담기는 그대로 «된다»(기능을 안 죽였다)', 담김.있다 === true && 담김.상태 === 'unsorted')
console.log(`     붙은 아이콘 키 = ${담김.아이콘}`)
writeFileSync(join(OUT, '6-담은뒤.png'), await page.screenshot())

// ⭐ ✕ 그림이 진짜 사라졌나 — 키가 아니라 «그려진 SVG»를 본다.
//    옛 그림의 정체 = `<path d="M20 20l8 8M28 20l-8 8">` (가위표 두 획). 그게 DOM 에 없어야 한다.
const 가위표 = await page.evaluate(() =>
  [...document.querySelectorAll('svg path')].filter((p) => /M20 20l8 8M28 20l-8 8/.test(p.getAttribute('d') || '')).length)
chk(`⑭ ⭐✕(가위표) 획이 화면에 «0개» (찾은 개수 ${가위표})`, 가위표 === 0)

// 접시로 바뀌었나 — default 아이콘이 그려진 자리에 동심원이 있나
const 접시 = await page.evaluate(() => {
  const svgs = [...document.querySelectorAll('svg')]
  return svgs.some((s) => {
    const cs = [...s.querySelectorAll('circle')].map((c) => +c.getAttribute('r'))
    return cs.includes(12.4) && cs.includes(7.6)
  })
})
chk('⑮ 그 자리에 빈 접시(동심원)가 그려졌다', 접시)

// ── ⑥ 홈으로 돌아가 「정리 안 한 레시피 1개」로 바뀌나 ──
console.log('\n── ⑥ 상태에 따라 글자가 바뀌나 ──')
await page.evaluate(() => { const b2 = [...document.querySelectorAll('button')].find((x) => /홈/.test(x.textContent || '')); if (b2) b2.click() })
await page.waitForTimeout(1100)
// 🔁 [2026-08-22] 글자 카드가 «아이콘＋숫자 뱃지»로 바뀌었다.
//    ⭐ 지키려는 것은 그대로 = **「몇 개 남았는지 유저가 스스로 안다」**(2026-08-13 잔량 원칙과 같은 생각).
//       ⛔ 아이콘만 두고 숫자를 안 띄우면 그 원칙이 깨진다 → 뱃지 «숫자»를 직접 읽는다.
const 뱃지 = await page.locator('button[aria-label^="임시보관함"] span').first().textContent().catch(() => '')
const 라벨 = await page.locator('button[aria-label^="임시보관함"]').first().getAttribute('aria-label').catch(() => '')
chk(`⑯ 담은 뒤엔 뱃지에 「1」이 뜬다 (뱃지="${뱃지}" · 라벨="${라벨}")`, String(뱃지).trim() === '1' && /1개/.test(라벨 || ''))
writeFileSync(join(OUT, '7-홈-1개.png'), await page.screenshot())

console.log(`\n  pageerror = ${에러.length}${에러.length ? ' ⛔ ' + 에러[0] : ''}`)
chk('⑰ pageerror 0', 에러.length === 0)

await b.close(); srv.close()

console.log('\n──────── 결과 ────────')
console.log(`통과 ${통과} · 실패 ${실패}`)
if (실패목록.length) { console.log('\n⛔ 실패:'); 실패목록.forEach((s) => console.log('   · ' + s)) }
console.log(`\n📁 ${OUT}`)
console.log('\n⏳ 서버 되면 = 금지 목록의 「본문 자동 읽기」를 되살리고 이 판의 그 줄을 빼면 된다.')
process.exit(실패 ? 1 : 0)

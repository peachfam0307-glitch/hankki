// 🍚🌏 한 편이 «나라 칩»과 «종류 칩»에 둘 다 뜬다 — 재현판 (2026-09-14)
//
// 📮 창업자 = *"지금 한식이 진짜 많고 나머지는 적은데. 이거 맞게 갈린건지 확인좀해봐야겠어"*
//    → 재 보니 **간장게장이 「한식」 칩에 «안» 떴다.** folder 가 '반찬' 이라 category 가 버려졌다.
//    📮 창업자 = *"중복이어야 맞아"* · *"나라로 가자"* · *"간식은 하나로 통일"*
//
// ⭐⭐ **무엇을 재나** — 앱을 «실제로 켜서» 칩을 누르고 편이 보이나를 본다.
//    ⛔ 소스 grep 으로 재지 않는다 — 「거르는 줄」이 맞아도 칩 목록이 틀리면 눌러 볼 수가 없다.
//    📮 창업자 = *"오류안나게 재현후 넣어(눈으로 직접보고 시뮬돌려봐)"*
//
// ⛔ 이 판이 잡는 사고 셋
//   ⓐ 나라 칩에서 편이 사라짐 (folder 가 category 를 덮어서)
//   ⓑ 아무도 정한 적 없는 칩이 저 혼자 생김 (레시피에 적힌 folder 가 칩이 되던 구조)
//   ⓒ 어느 칩에도 안 뜨는 편 (종류를 못 고른 편)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-나라와종류-0914.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4494, r))

const { allBasicRecipes } = await import('../src/data/basics.js')
const { 종류들, 종류고르기 } = await import('../src/data/종류.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')

let 통과 = 0, 실패 = 0
const 실패목록 = []
const chk = (이름, 값, 기대) => {
  const ok = String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `\n       나온 값 = ${값}  ·  기대 = ${기대}`}`)
  ok ? 통과++ : (실패++, 실패목록.push(이름))
}

const { 나라들 } = await import('../src/data/종류.js')   // ⛔ 목록을 두 벌로 적지 않는다 — 두 벌이 되면 반드시 갈린다

console.log('\n🍚🌏 한 편이 나라 칩과 종류 칩에 둘 다 뜬다\n')

// ───────── ① 저장소 쪽 — 갈래가 «다» 나라인가 ─────────
console.log('① 갈래(category)가 모두 나라다')
{
  const 아닌것 = allBasicRecipes.filter((r) => !나라들.includes(r.category || ''))
  chk('⭐ 갈래가 나라가 아닌 편 0편', 아닌것.length, 0)
  if (아닌것.length) console.log('       ' + 아닌것.slice(0, 8).map((r) => r.title + '=' + r.category).join(' · '))
}

// ───────── ② 종류를 «모든» 편이 받는가 ─────────
console.log('\n② 201편이 모두 종류 여섯 중 하나에 들어간다 (⛔빠지는 편이 있으면 안 된다)')
{
  const 밖 = allBasicRecipes.filter((r) => !종류들.includes(종류고르기(r)))
  chk('⭐ 종류를 못 고른 편 0편', 밖.length, 0)
  const 셈 = {}
  for (const r of allBasicRecipes) 셈[종류고르기(r)] = (셈[종류고르기(r)] || 0) + 1
  console.log('       ' + 종류들.map((g) => g + ' ' + (셈[g] || 0)).join(' · '))
  chk('   합이 전체와 같다', Object.values(셈).reduce((a, b) => a + b, 0), allBasicRecipes.length)
}

// ───────── ③ ⭐심장 — 앱을 켜서 칩을 눌러 본다 ─────────
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => {
  try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ }
})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4494/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)

// 레시피 탭으로
// ⛔⛔ 「한끼 소식」 시트가 앞을 막는다 — news:off 를 심어도 뜬다(실측 2026-09-14).
//    그걸 모르고 곧장 칩을 읽었더니 «0개»가 나왔고, 그러면 뒤 칸들이 전부 «못 잰 채로 빨간불»이 된다.
//    📌 가짜 빨간불도 가짜 초록불만큼 나쁘다 — 엉뚱한 데를 고치게 된다.
{
  const 닫기 = await p.$('text=닫기')
  if (닫기) { await 닫기.click(); await p.waitForTimeout(800) }
  const 것 = await p.$('text=내 레시피 전체 보기')
  if (것) { await 것.click(); await p.waitForTimeout(1500) }
}

const 칩읽기 = () => p.evaluate(() => [...document.querySelectorAll('.pill')].map((e) => (e.textContent || '').trim()))

console.log('\n③ ⭐앱을 켜서 칩을 본다')
const 칩 = await 칩읽기()
console.log('       ' + 칩.join(' | '))
// ⛔ 칩이 0개면 «화면에 못 들어간 것»이다 — 그걸 못 잡으면 아래가 전부 헛으로 빨간불이 된다
chk('⛔ 레시피 탭에 실제로 들어갔다 (칩이 0개면 못 잰 것이다)', 칩.length >= 8, 'true')

// ⛔ⓑ 아무도 정한 적 없는 칩이 있으면 안 된다
{
  const 이름만 = 칩.map((t) => t.replace(/\s*\d+\s*$/, '').trim()).filter(Boolean)
  const 허락 = new Set([...나라들, ...종류들, '전체', '요리사', '하트', '핀', 'SNS', '자주', '＋ 폴더'])   // ⛔「＋ 폴더」는 칩이 아니라 «만들기 단추»다
  const 몰래 = 이름만.filter((n) => !허락.has(n) && !/^[0-9]+$/.test(n))
  chk('⛔ 아무도 정한 적 없는 칩 0개 (레시피가 칩을 저 혼자 만들면 안 된다)', 몰래.length, 0)
  if (몰래.length) console.log('       몰래 생긴 칩 = ' + 몰래.join(' · '))
}

// ⭐ⓐ 칩을 눌러 편이 보이나
const 눌러보기 = async (칩이름) => {
  await p.evaluate((이름) => {
    const 것 = [...document.querySelectorAll('.pill')].find((e) => (e.textContent || '').trim().replace(/\s*\d+\s*$/, '').trim() === 이름)
    if (것) 것.click()
  }, 칩이름)
  await p.waitForTimeout(700)
  return p.evaluate(() => document.body.innerText)
}

console.log('\n④ ⭐⭐심장 — 간장게장이 «한식» 칩에도 «반찬» 칩에도 뜬다')
{
  const 한식글 = await 눌러보기('한식')
  chk('⭐ 한식 칩에 간장게장이 뜬다 (그 전엔 folder 가 덮어서 사라졌다)', /간장게장/.test(한식글), 'true')
  const 반찬글 = await 눌러보기('반찬')
  chk('⭐ 반찬 칩에도 간장게장이 뜬다 (＝둘 다 뜬다)', /간장게장/.test(반찬글), 'true')
}

console.log('\n⑤ 되짚기 — 종류가 다르면 «안» 떠야 한다 (아무 데나 다 뜨면 ④가 헛통과다)')
{
  const 면글 = await 눌러보기('면')
  chk('⛔ 면 칩에는 간장게장이 «안» 뜬다', /간장게장/.test(면글), 'false')
  chk('   면 칩에 콩국수는 뜬다', /콩국수/.test(면글), 'true')
}

console.log('\n⑥ 나라가 다른 편이 섞이지 않는다')
// ⛔⛔ 여기 쓸 편은 «오늘 열려 있는» 편이라야 한다 — 처음엔 스키야키로 쟀는데 그건 2026-12-28 에 열린다.
//    안 열린 편은 화면에 없으니 «안 뜬다»가 맞고, 그걸 빨간불로 세면 엉뚱한 데를 고치게 된다.
{
  const 일식글 = await 눌러보기('일식')
  chk('일식 칩에 명란 아보카도 덮밥이 뜬다', /명란 아보카도 덮밥/.test(일식글), 'true')
  chk('⛔ 일식 칩에 된장찌개는 «안» 뜬다', /된장찌개/.test(일식글), 'false')
}

await ctx.close()

// ───────── ⑦ ⭐⭐⭐제일 큰 구멍 — «이미 깔린 폰»도 새 갈래를 받나 ─────────
//   ⛔⛔ 앱은 «폰에 저장된 복사본»을 보여준다. 원본을 고쳐도 이미 깔린 폰은 옛 값을 그대로 쓴다.
//      실측(store.jsx) = 씨앗 다시 맞추기가 글·사진·savedAt 은 고치는데 **category 는 안 고친다**
//      (팟타이 한 편만 손으로 박혀 있다 · 216줄).
//   📌 어제 가지무침이 12시간 안 바뀐 것과 «같은 뿌리»다(규칙 18 ⓙ).
//   ⭐ 그래서 「옛 갈래가 저장된 폰」을 흉내 내어 심고, 앱을 켜서 갈래가 새것이 되나를 본다.
console.log('\n⑦ ⭐⭐이미 깔린 폰 — 옛 갈래가 저장돼 있어도 새 갈래를 받나')
{
  const 씨 = allBasicRecipes.find((r) => r.id === 'basic-ganjang-gejang')
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx2.addInitScript(SEED_COACH_SEEN)
  // 🧪 옛 판이 저장해 둔 모습 그대로 — 갈래가 '반찬'(종류가 갈래 자리에 들어 있던 때)
  await ctx2.addInitScript(([편, 앞버전]) => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:v1', JSON.stringify({ recipes: [편], diary: [], seedV: 앞버전 }))
    } catch { /* noop */ }
  //   ⛔ 폴더는 씨앗과 «다른» 값을 심는다 — 씨앗과 같은 값을 심으면 덮여도 티가 안 나
  //      「안 건드렸다」로 잘못 읽힌다(실제로 처음에 그렇게 가짜 초록불이 났다).
  }, [{ ...씨, category: '반찬', folder: '내폴더' }, 0])
  const p2 = await ctx2.newPage()
  await p2.goto('http://127.0.0.1:4494/hankki/', { waitUntil: 'networkidle' })
  await p2.waitForTimeout(2000)
  const 뒤 = await p2.evaluate(() => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      const r = (s.recipes || []).find((x) => x.id === 'basic-ganjang-gejang')
      return r ? { category: r.category, folder: r.folder } : { category: '(그 편이 없다)', folder: '' }
    } catch (e) { return { category: 'X' + e.message, folder: '' } }
  })
  await ctx2.close()
  chk('⭐⭐ 갈래가 새것(한식)으로 맞춰진다', 뒤.category, '한식')
  // ⛔ 되짚기 — 폴더는 «건드리면 안 된다». 유저가 옮겨 둔 자리를 잃으면 안 되기 때문.
  chk('⛔ 유저가 옮겨 둔 폴더를 잃지 않는다', 뒤.folder, '내폴더')
}

// ───────── ⑧ 🗑 폰에만 남은 «옛 폴더» — 칩에선 빠지고 편은 «안» 사라진다 ─────────
//   📮 창업자 2026-09-14 = 폰 칩 줄에 「소스 25 · 밥·면·덮밥 19 · 고기 21 · 해물 7 …」이 떠 있었다
//      → *"나 기억안나는데 ???"* → *"그럼 다 빼야지"*
//   ⛔⛔ **제일 중요한 것 = 편이 사라지면 안 된다.** 칩만 빼고 편은 다른 칩에서 보여야 한다.
//      그래서 이 칸은 «둘 다» 잰다 — ⓐ칩이 없다 ⓑ그 편이 그래도 보인다.
console.log('\n⑧ 🗑 폰에만 남은 옛 폴더 — 칩에선 빠지고, 편은 안 사라진다')
{
  const { 옛폴더이름 } = await import('../src/data/종류.js')
  const 씨 = allBasicRecipes.find((r) => r.id === 'basic-ganjang-gejang')
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx3.addInitScript(SEED_COACH_SEEN)
  // 🧪 옛 판이 남긴 모습 — folders 목록에 옛 이름이 들어 있고, 한 편이 그 폴더에 들어 있다
  await ctx3.addInitScript(([편, 옛것]) => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:v1', JSON.stringify({
        recipes: [편], diary: [], seedV: 0,
        folders: ['한식', '중식', '일식', '양식', '아시안', ...옛것, '내가만든폴더'],
      }))
    } catch { /* noop */ }
  }, [{ ...씨, folder: '소스' }, 옛폴더이름])
  const p3 = await ctx3.newPage()
  await p3.goto('http://127.0.0.1:4494/hankki/', { waitUntil: 'networkidle' })
  await p3.waitForTimeout(1800)
  {
    const 닫기 = await p3.$('text=닫기')
    if (닫기) { await 닫기.click(); await p3.waitForTimeout(700) }
    const 것 = await p3.$('text=내 레시피 전체 보기')
    if (것) { await 것.click(); await p3.waitForTimeout(1500) }
  }
  const 칩3 = await p3.evaluate(() => [...document.querySelectorAll('.pill')].map((e) => (e.textContent || '').trim().replace(/\s*\d+\s*$/, '').trim()))
  console.log('       ' + 칩3.join(' | '))
  const 남은옛것 = 옛폴더이름.filter((n) => 칩3.includes(n))
  chk('⭐ 옛 폴더 칩이 하나도 없다', 남은옛것.length, 0)
  if (남은옛것.length) console.log('       남은 것 = ' + 남은옛것.join(' · '))
  // ⛔⛔ 되짚기 둘 — 이게 없으면 「다 지워버렸다」도 통과한다
  chk('⛔ 유저가 «직접 만든» 폴더는 살아 있다', 칩3.includes('내가만든폴더'), 'true')
  const 한식글 = await p3.evaluate(() => {
    const 것 = [...document.querySelectorAll('.pill')].find((e) => (e.textContent || '').trim().replace(/\s*\d+\s*$/, '').trim() === '한식')
    if (것) 것.click()
    return new Promise((r) => setTimeout(() => r(document.body.innerText), 700))
  })
  chk('⭐⭐ 그 폴더에 있던 편이 «사라지지 않는다» (한식 칩에 뜬다)', /간장게장/.test(한식글), 'true')
  await ctx3.close()
}

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) console.log('   ' + 실패목록.join('\n   '))
console.log()
process.exit(실패 ? 1 : 0)

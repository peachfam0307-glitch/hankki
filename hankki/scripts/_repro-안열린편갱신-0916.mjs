// 🍲 «폰엔 있는데 씨앗엔 없는 편»이 갱신을 못 받는다 — 재현판 (2026-09-16)
//
// 📮 창업자 폰 캡처 = 두부참치찌개가 **옛 판**으로 떠 있었다
//    (물 450ml · 올리고당 5큰술 · 진간장 5큰술 · 참기름 · 깨).
//    오늘 재료·만드는 법을 통째로 갈고 BASICS_VERSION 을 160까지 올렸는데 **한 글자도 안 바뀌었다.**
//
// 🌲 뿌리 둘
//   ① `store.jsx` 의 `seedById` 가 `basicRecipes`(＝`from` 이 지난 99편)로 만들어져 있었다.
//      두부참치찌개는 `from: '2026-10-12'` 라 **그 목록에 없다** → 갱신 표들이 전부 건너뛴다.
//      ⭐ 「한 번 열렸다가 여는 날짜를 뒤로 민 편」은 **폰에 남아 계속 보이는데 갱신만 안 닿는다.**
//   ② 설령 닿아도 v31 은 `ingredients`·`memo` 둘만 갈았다 — **만드는 법(steps)은 안 갈았다.**
//      재료만 새것이 되면 「해물가루육수를 넣으라면서 450ml를 끓이라는」 섞인 판이 된다.
//
// ⛔ 소스 grep 으로 재지 않는다 — 이건 «저장본이 갈아끼워지나»라 실제로 켜 봐야 안다(절대원칙 18ⓘ·30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-안열린편갱신-0916.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const PORT = 4497
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(PORT, r))

const { basicRecipes, allBasicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')

const ID = 'basic-dubu-chamchi-jjigae'
const 씨 = allBasicRecipes.find((r) => r.id === ID)

let 통과 = 0, 실패 = 0
const 실패목록 = []
const chk = (이름, 값, 기대) => {
  const ok = String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `\n       나온 값 = ${값}\n       기대   = ${기대}`}`)
  ok ? 통과++ : (실패++, 실패목록.push(이름))
}

console.log('\n🍲 «폰엔 있는데 아직 안 열린 편»도 갱신을 받나\n')

console.log('① 조건 확인 — 이 편이 정말 「씨앗 목록 밖」인가')
chk('씨앗 목록(basicRecipes)에는 없다', basicRecipes.some((r) => r.id === ID), 'false')
chk('전체 목록(allBasicRecipes)에는 있다', !!씨, 'true')

// 🧪 창업자 폰을 흉내 낸다 — 옛 판이 저장돼 있고, 편집한 적이 있어 `touched` 가 붙었다
const 옛판 = {
  ...씨,
  touched: 1,
  ingredients: ['두부 1모', '참치캔 1개', '대파 1대', '물 450ml', '고추장 2큰술', '고춧가루 1/2컵', '올리고당 5큰술', '다진 마늘 3큰술', '진간장 5큰술', '맛술 2큰술', '참기름 약간', '깨 약간'],
  steps: ['냄비에 물 450ml를 붓고 끓여요.', '두부를 노릇하게 구워요.', '올리고당을 넣어 마무리해요.'],
  time: 25,
  favorite: 1,          // ⭐ 개인 것이 살아남나도 같이 잰다
  cooked: 3,
  folder: '내가옮긴자리',
}

const 켜보기 = async (앞버전) => {
  const ctx = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
    .then((b) => b.newContext({ viewport: { width: 390, height: 844 } }).then((c) => ({ b, c })))
  await ctx.c.addInitScript(SEED_COACH_SEEN)
  await ctx.c.addInitScript(([편, v]) => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      // ⭐ 일기 3건을 같이 심는다 — 앱은 요리 횟수를 «일기 개수»에 맞춘다(store.jsx:700).
      //    안 심으면 cooked 가 0으로 내려가는데 그건 «정상 동작»이지 고침 탓이 아니다.
      const 일기 = [1, 2, 3].map((i) => ({ id: 'd' + i, recipeId: 편.id, date: '2026-09-0' + i }))
      localStorage.setItem('hankki:v1', JSON.stringify({ recipes: [편], diary: 일기, seedV: v }))
    } catch { /* noop */ }
  }, [옛판, 앞버전])
  const p = await ctx.c.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  const 뒤 = await p.evaluate((id) => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      const r = (s.recipes || []).find((x) => x.id === id)
      if (!r) return { 없다: 1 }
      return {
        물: (r.ingredients || []).find((x) => x.includes('물 ')) || '(없다)',
        올리고당: (r.ingredients || []).some((x) => x.includes('올리고당')),
        육수: (r.ingredients || []).some((x) => x.includes('해물가루육수')),
        걸음수: (r.steps || []).length,
        첫걸음: (r.steps || [])[0] || '',
        time: r.time,
        favorite: r.favorite, cooked: r.cooked, folder: r.folder,
      }
    } catch (e) { return { 없다: 'X' + e.message } }
  }, ID)
  await ctx.b.close()
  return 뒤
}

// ⛔⛔ 「버전이 이미 최신인 폰」은 «일부러» 안 잰다 — store.jsx:168 이 v >= BASICS_VERSION 이면
//    통째로 early return 해서 **표가 하나도 안 돈다**(2026-09-14 그림갱신 재현판이 이미 적어둔 함정).
//    ⭐ 그래서 «고침을 내보낼 때는 BASICS_VERSION 을 반드시 같이 올린다» — 그 강제는
//       check-basics-version.mjs 가 한다. 여기서는 「번호가 낮은 폰이 받나」만 잰다.
for (const [이름, 앞버전] of [['버전이 하나 낮은 폰', BASICS_VERSION - 1], ['버전이 훨씬 낮은 폰(156)', 156]]) {
  console.log(`\n② ${이름} — 켜면 갱신되나`)
  const r = await 켜보기(앞버전)
  chk('   재료 물이 350ml 다', r.물, '물 350ml')
  chk('   옛 재료(올리고당)가 빠졌다', r.올리고당, 'false')
  chk('   새 재료(해물가루육수)가 들어왔다', r.육수, 'true')
  chk('   ⭐만드는 법이 6걸음이다', r.걸음수, '6')
  chk('   ⭐첫 걸음이 새 글이다', /먹기 좋게 썰고/.test(r.첫걸음), 'true')
  chk('   시간이 20분이다', r.time, '20')
  console.log('   ─ 개인 것은 살아 있나 (⛔여기가 깨지면 고침이 더 나쁘다)')
  chk('   즐겨찾기 살아 있다', r.favorite, '1')
  chk('   요리 횟수 살아 있다', r.cooked, '3')
  chk('   옮겨 둔 폴더 살아 있다', r.folder, '내가옮긴자리')
}

srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패}`)
if (실패) { console.log('   ' + 실패목록.join('\n   ')); process.exit(1) }

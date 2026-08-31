// 🍜🍜 「폰에 박힌 카와이가 «진짜로» 새 컷으로 갈리나」 재현판 — 창업자 전수 판정 431장
//
// 📮 창업자 2026-08-31 = *"어제 내가 찾아서 바꾼건 크림파스타, 애호박덮밥, 김치볶음밥에 아직도 붙어있었어"*
//    → *"카와이는 영구삭제해줘"* → 판으로 전수 판정 → *"복사했어요 (431장)"*
//
// ⭐⭐ **심장 = 「저장된 값이 진짜로 바뀌었나」다.** ⛔「목록에 넣었나」가 아니다.
//    소스에 목록만 넣어두고 통과시키면, 창업자 폰에선 그대로인 채 초록불이 뜬다
//    (v11.33 이 정확히 그 사고였다 — 규칙만 갈고 박힌 값을 안 건드렸다).
//    그래서 소스를 안 보고 **localStorage 에 실제로 뭐가 들어 있나**를 읽는다.
//
// ⭐ ＋ 「어제 바꿨는데 오늘 다시 붙는다」도 잰다 — 그게 이번 뿌리였다.
//    `ICON_FORCE_V38` 이 **제목으로 강제**해서 유저가 직접 고른 아이콘까지 덮고 있었다.
//
// 🧪 규칙 12 = `카와이_V96` 을 옛 36장으로 되돌리거나 `ICON_FORCE_V38` 에 카와이를 도로 넣으면 죽는다.
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-카와이철거-0831.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shot'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

let 죽음 = 0
const 나쁨 = (m) => { console.error(`  ✗ ${m}`); 죽음++ }
const 좋음 = (m) => console.log(`  ok  ${m}`)

const 카와이 = new Set(JSON.parse(readFileSync(join(ROOT, 'docs/stickers/카와이-전수판정-2026-08-31.json'), 'utf8')).카와이)
const { SEED_COACH_SEEN } = await import('../src/coach.js')

// 📱 창업자 폰을 흉내낸다 — 옛 판에서 저장돼 «카와이가 박힌» 레시피들.
//   ⛔ 씨앗 id 를 쓰면 씨앗 재동기화가 대신 고쳐서 «v96 이 일하는지»를 못 잰다 → 내 레시피로 만든다.
//   ⭐ 마지막 둘이 이번 뿌리다 — `ICON_FORCE_V38` 이 제목으로 강제하던 자리.
const 옛판 = [
  { id: 'k-1', title: '베이컨 크림 파스타', icon: 'fe_53' },   // 📮 창업자가 본 그것
  { id: 'k-2', title: '김치볶음밥', icon: 'fe_20' },           // 📮 창업자가 본 그것
  { id: 'k-3', title: '로제 파스타', icon: 'fe_27' },
  { id: 'k-4', title: '치즈 샌드위치', icon: 'fe_26' },
  { id: 'k-5', title: '묵은지 들기름 파스타', icon: 'fe_52' },
  { id: 'k-6', title: '차돌박이 볶음', icon: 'fe_64' },
  { id: 'k-7', title: '짬뽕', icon: 'fj_jsk01' },
  { id: 'k-8', title: '버섯 솥밥', icon: 'fe_04' },
  { id: 'k-9', title: '순두부조림', icon: 'fe_35' },
].map((r) => ({ ...r, thumb: 'icon', ingredients: [], steps: [], savedAt: Date.now() }))

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript((seed) => {
  try {
    localStorage.setItem('hankki:onboarded', '1')
    // seedV 를 낮게 둬서 마이그레이션이 «돌게» 한다
    localStorage.setItem('hankki:v1', JSON.stringify({ recipes: seed, seedV: 87 }))
  } catch { /* 저장 못 해도 화면은 돈다 */ }
}, 옛판)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1800)

console.log('\n── 🍜 카와이 철거 (창업자 전수 판정 431장) ──')

// ① 저장된 값을 «직접» 읽는다 — 소스가 아니라 localStorage
const 저장 = await p.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []) } catch { return [] }
})
if (!저장.length) { 나쁨('저장된 레시피를 못 읽었다 — 이 판이 아무것도 못 잰다'); }
else 좋음(`저장된 레시피 ${저장.length}편을 읽었다`)

const 내것 = 저장.filter((r) => String(r.id).startsWith('k-'))
if (내것.length !== 옛판.length) 나쁨(`흉내낸 ${옛판.length}편 중 ${내것.length}편만 남았다`)

let 남은카와이 = []
for (const r of 내것) {
  const 옛 = 옛판.find((x) => x.id === r.id)
  if (카와이.has(r.icon)) 남은카와이.push(`${r.title}=${r.icon}`)
  else console.log(`      ${r.title.padEnd(14)} ${옛.icon.padEnd(10)} → ${r.icon}`)
}
if (남은카와이.length) 나쁨(`아직 카와이가 박혀 있다 (${남은카와이.length}편) — ${남은카와이.join(' · ')}`)
else 좋음('흉내낸 폰의 카와이가 «하나도 안 남았다»')

// ② 새 컷이 «그림으로도» 뜨나 — 키만 바뀌고 파일이 없으면 빈 접시가 된다
const 빈접시 = await p.evaluate(async (keys) => {
  const bad = []
  for (const k of keys) {
    const ok = await new Promise((res) => {
      const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false)
      i.src = `assets/${k}.png`
    }).catch(() => false)
    if (!ok) bad.push(k)
  }
  return bad
}, 내것.map((r) => r.icon))
// ⚠️ 번들이 파일 이름을 해시로 바꾸므로 위 경로 검사는 «믿지 않는다» — 대신 화면에서 잰다(아래 ③)

// ③⭐ 화면에 «진짜로 그려지나» — 레시피 탭을 열어 깨진 그림을 센다
await p.evaluate(() => { const b = [...document.querySelectorAll('button,a')].find((e) => /레시피/.test(e.innerText || '')); b && b.click() })
await p.waitForTimeout(1500)
const 깨짐 = await p.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth).length)
if (깨짐) 나쁨(`화면에 깨진 그림 ${깨짐}개 — 키만 갈고 파일이 없으면 빈 접시가 된다`)
else 좋음('화면에 깨진 그림 0개')

// ④ 소스 쪽 그물 — 어디에서도 카와이를 «박지» 않는다
const S = readFileSync(join(ROOT, 'src/store.jsx'), 'utf8')
const i0 = S.indexOf('const 카와이_V96 = new Set(['), i1 = S.indexOf('  ])', i0)
const 나머지 = S.slice(0, i0) + S.slice(i1)
const 박는것 = [...new Set([...나머지.matchAll(/:\s*'([a-z]{2,3}_[A-Za-z0-9_]+)'/g)].map((m) => m[1]).filter((k) => 카와이.has(k)))]
if (박는것.length) 나쁨(`store.jsx 가 아직 카와이를 박는다 — ${박는것.join(' ')}`)
else 좋음('store.jsx 어디에서도 카와이를 «안» 박는다')

const B = readFileSync(join(ROOT, 'src/data/basics.js'), 'utf8')
const 씨앗카와이 = [...new Set([...B.matchAll(/icon:\s*'([^']+)'/g)].map((m) => m[1]).filter((k) => 카와이.has(k)))]
if (씨앗카와이.length) 나쁨(`씨앗 레시피가 아직 카와이를 쓴다 — ${씨앗카와이.join(' ')}`)
else 좋음('씨앗 레시피가 카와이를 «안» 쓴다')

const F = readFileSync(join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')
const ri = F.indexOf('const ICON_RULES = [')
const 규칙카와이 = [...new Set([...F.slice(ri).matchAll(/\],\s*'([A-Za-z0-9_]+)'\s*\]/g)].map((m) => m[1]).filter((k) => 카와이.has(k)))]
const 픽커카와이 = [...new Set([...F.slice(F.indexOf('export const FOOD_ICON_GROUPS'), ri).matchAll(/'([a-z]{2,3}_[A-Za-z0-9_]+)'/g)].map((m) => m[1]).filter((k) => 카와이.has(k)))]
if (규칙카와이.length) 나쁨(`규칙이 아직 카와이를 부른다 — ${규칙카와이.join(' ')}`)
else 좋음('규칙(ICON_RULES)이 카와이를 «안» 부른다')
if (픽커카와이.length) 나쁨(`서랍(픽커)에 아직 카와이가 있다 — ${픽커카와이.join(' ')}`)
else 좋음('서랍(픽커)에 카와이가 «없다»')

await p.screenshot({ path: join(OUT, '카와이철거.png'), fullPage: false })
await b.close(); srv.close()
console.log(죽음 ? `\n⛔ ${죽음}칸 실패` : '\n✅ 전부 통과')
process.exit(죽음 ? 1 : 0)

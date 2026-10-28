// 🕳🕳 **재료 픽커에서 요리를 뺐더니 «못 고르게 된 재료»가 있나** (2026-09-11)
// 📮 창업자 = *"픽커에서 뺀것도 오류있는지 검토해(네 눈으로)"*
//
// ⛔ 진짜 위험은 「요리가 안 보인다」가 아니라 **「재료인데 요리 갈래에만 있던 것」**이다.
//    그런 게 있으면 유저가 그 재료를 담을 때 아이콘을 못 고른다 — 조용히 나빠진다.
// ⭐ 그래서 **앱을 띄워 픽커를 실제로 열고** 재료 이름을 전부 쳐 본다.
//    ⛔ node 로 `FoodIcon.jsx` 를 직접 import 할 수 없다(확장자를 모른다) — 브라우저가 답한다.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = '/home/user/hankki/hankki'
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4429, r))

// 🥕 앱이 아는 재료 이름 전부 — ⛔내가 목록을 지어내지 않는다
const ing = readFileSync(join(ROOT, 'src/data/ingIcons.js'), 'utf8')
const 이름들 = [...new Set([...ing.matchAll(/\[\s*'([^']+)'\s*,\s*'ig_[^']*'\s*\]/g)].map((m) => m[1]))]

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul' })
const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p.goto('http://127.0.0.1:4429/', { waitUntil: 'networkidle' })
await p.click('text=장보기'); await p.waitForTimeout(400)
await p.click('text=냉장고'); await p.waitForTimeout(600)
await p.click('text=재료 담기'); await p.waitForTimeout(500)
await p.click('.emoji-tile'); await p.waitForTimeout(600)

let 나쁨 = 0
const 말 = (ok, s, 덤 = '') => { if (!ok) 나쁨++; console.log(`${ok ? '✅' : '⛔'} ${s}${덤 ? ' — ' + 덤 : ''}`) }

const 쳐보기 = async (q) => {
  await p.fill('.ficon-search input', q)
  await p.waitForTimeout(120)
  return p.evaluate(() => [...document.querySelectorAll('.ficon-name')].map((s) => s.textContent))
}

console.log(`🥕 앱이 아는 재료 이름 ${이름들.length}개를 하나씩 쳐 본다\n`)

// ① 하나도 안 걸리는 재료가 있나 = 「담을 수 있는데 아이콘을 못 고르는」 재료
const 구멍 = []
for (const 이름 of 이름들) {
  const r = await 쳐보기(이름)
  if (!r.length) 구멍.push(이름)
}
말(구멍.length === 0, `재료 ${이름들.length}개가 재료 자리에서 다 걸린다`, 구멍.length ? `못 걸리는 것 ${구멍.length}개 → ${구멍.join(' / ')}` : '')

// ② 요리가 새어 들어오나 — 재료 자리에 완성된 요리 이름이 뜨면 안 된다
const 새는것 = []
for (const q of ['가지', '두부', '김치', '소고기', '계란', '파', '국수', '떡']) {
  const r = await 쳐보기(q)
  const 요리 = r.filter((n) => /볶음|덮밥|무침|조림|찌개|튀김|구이$|국$|전$|밥$|탕$/.test(n))
  if (요리.length) 새는것.push(`${q}→${요리.join('·')}`)
}
말(새는것.length === 0, '완성된 요리가 재료 자리로 안 샌다', 새는것.join(' / '))

// ③ 한 글자 함정 — 「김」이 김치를, 「무」가 단무지를 끌고 오면 안 된다(CLAUDE.md 핀)
for (const q of ['김', '무', '배', '감']) {
  const r = await 쳐보기(q)
  말(r[0] === q, `「${q}」 첫 결과가 «${q}» 자신이다`, r.slice(0, 4).join(' / '))
}

// ④ 갈래 목록에 요리가 없나
await p.fill('.ficon-search input', '')
await p.waitForTimeout(300)
const 갈래 = await p.evaluate(() => [...document.querySelectorAll('.emoji-cat')].map((c) => c.textContent))
const 재료갈래 = ['채소', '과일', '고기·해산물', '유제품', '양념·장', '밥·면·빵', '음료·기타']
말(갈래.every((t) => 재료갈래.includes(t) || t === '최근에 쓴 것'), '갈래가 재료뿐이다', 갈래.join(' · '))

// ⑤ 📌 이미 «요리 아이콘으로» 담아둔 재료는? — `FoodIcon` 은 «키만 보고» 그리므로 그대로 그려진다.
//    픽커 목록에서 내렸을 뿐 컷을 지운 게 아니다(파일도 그대로). 그래서 옛 데이터는 안 깨진다.
//    ⚠️ 딱 하나 달라지는 것 = 그 재료의 아이콘을 «바꾸러» 픽커를 열면 지금 쓰는 컷에 선택 표시가 안 뜬다.
//       ⭐ 고르면 바로 재료 컷으로 바뀌니 유저가 막히지는 않는다.

await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 빨간불` : '\n✅ 전부 초록불 — 요리를 빼서 잃은 재료가 없다')
process.exit(나쁨 ? 1 : 0)

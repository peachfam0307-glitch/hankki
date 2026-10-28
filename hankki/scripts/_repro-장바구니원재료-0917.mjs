// 🛒 주부의 장바구니 «상세 시트» — 원재료명·알레르기·영양 ＋ 확인일·신고 길이 «실제로» 그려지나 (2026-09-17)
//
// 📮 창업자 = *"주부의 장바구니를 좀 키워서 성분표와 가격을 올리면 좋겠어"* → *"원재료가 중요한거야"*
//    ＋ 저작권 답 둘(docs/장바구니-원재료-저작권답-2026-09-17.md) → 사진 ✗ · 글자 ✓ · 확인일 ＋ 신고 길.
//
// 무엇을 재나 (다섯)
//   ① 장보기 → 카드 «이름 줄»을 누르면 시트가 뜬다 (카드는 그대로 · 시트로 본다)
//   ② 원재료 있는 편(굴소스) = 추천 글 전문 ＋ 원재료명 ＋ 알레르기 ＋ 영양정보 ＋ 「M/D 확인」 ＋ 「잘못됐어요 알려주기」
//   ③ 원재료 «없는» 편(옛 132개) = 원재료 블록을 «안 그린다» — 「준비 중」·빈 칸 금지
//   ④ 긴 시트여도 「담기」 단추에 «스크롤로 닿는다» (시트가 화면보다 길어 처음엔 아래로 잘린다 — 캡처로 확인 2026-09-17)
//   ⑤ 「담기」를 누르면 시트가 닫히고 장보기 목록에 그 이름이 «담긴다»
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-장바구니원재료-0917.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const PORT = 4499
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(PORT, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')

// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 못 읽는다 → 소스 글자를 읽어 편을 «고르기만» 한다.
//    값 대조는 화면(＝앱이 그린 것)에서 한다. 이름을 손으로 박지 않는다(규칙 30).
const cur = readFileSync(join(ROOT, 'src/data/curation.js'), 'utf8')
const 덩이들 = [...cur.matchAll(/\{\s*name:\s*'([^']+)'[\s\S]*?\}(?=,\s*(?:\/\/[^\n]*\n\s*)*(?:\{|\]))/g)].map((m) => m[0])
const 값 = (덩이, k) => { const m = 덩이.match(new RegExp(`\\b${k}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)); return m ? m[1].replace(/\\'/g, "'") : '' }
const 편 = (덩이) => ({ name: 값(덩이, 'name'), benefit: 값(덩이, 'benefit'), ingredients: 값(덩이, 'ingredients'), allergen: 값(덩이, 'allergen'), nutrition: 값(덩이, 'nutrition'), checked: 값(덩이, 'checked'), from: 값(덩이, 'from') })
const 전부 = 덩이들.map(편).filter((it) => it.name && it.benefit && !it.from)   // from 있는 편은 아직 안 열렸을 수 있다
const 있는편 = 전부.find((it) => it.ingredients)
const 없는편 = 전부.find((it) => !it.ingredients && !it.allergen && !it.nutrition)
if (!있는편 || !없는편) { console.log('⛔ 원재료 있는 편/없는 편을 데이터에서 못 찾았다'); process.exit(1) }

let 통과 = 0, 실패 = 0
const 실패목록 = []
const chk = (이름, 값, 기대) => {
  const ok = String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `\n       나온 값 = ${값}\n       기대   = ${기대}`}`)
  ok ? 통과++ : (실패++, 실패목록.push(이름))
}
console.log(`\n🛒 장바구니 상세 시트 — 원재료 있는 편 「${있는편.name}」 · 없는 편 「${없는편.name}」\n`)

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const c = await b.newContext({ viewport: { width: 390, height: 844 } })
await c.addInitScript(SEED_COACH_SEEN)
await c.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:push:consent', 'no') /* 🔔 담기 뒤 알림 시트(v13.80) */ } catch {} })
const p = await c.newPage()
await p.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (let i = 0; i < 3; i++) { const x = p.locator('button:has-text("닫기")').first(); if (await x.count()) { await x.click().catch(() => {}); await p.waitForTimeout(250) } }
await p.locator('text=장보기').last().click(); await p.waitForTimeout(800)

const 시트글 = async () => p.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].pop(); return s ? s.innerText : '' })
const 열기 = async (name) => {
  const q = p.locator('input[placeholder*="찾기"]').first()
  await q.fill(''); await q.fill(name); await p.waitForTimeout(500)
  const card = p.locator('.cur-card', { hasText: name }).first()
  await card.locator('[role="button"]').first().click()
  await p.waitForSelector('.sheet', { timeout: 15000 })
  await p.waitForTimeout(500)
}
const 닫기 = async () => { await p.locator('.sheet button:has-text("닫기")').first().click(); await p.waitForTimeout(400) }

console.log('① 카드 이름 줄 → 시트')
await 열기(있는편.name)
let 글 = await 시트글()
chk('시트에 제품 이름이 있다', 글.includes(있는편.name), 'true')

console.log('② 원재료 있는 편 — 글자 전부 ＋ 확인일 ＋ 신고 길')
chk('추천 글 전문이 있다', 글.includes(있는편.benefit), 'true')
chk('「원재료명」 ＋ 본문', 글.includes('원재료명') && 글.includes(있는편.ingredients), 'true')
chk('「알레르기 유발물질」 ＋ 본문', !있는편.allergen || (글.includes('알레르기 유발물질') && 글.includes(있는편.allergen)), 'true')
chk('「영양정보」 ＋ 본문', !있는편.nutrition || (글.includes('영양정보') && 글.includes(있는편.nutrition)), 'true')
const 확인일 = `${Number(있는편.checked.slice(5, 7))}/${Number(있는편.checked.slice(8, 10))} 확인`
chk(`확인일 「${확인일}」이 있다`, 글.includes(확인일), 'true')
chk('「실제 제품 포장 표시가 우선이에요」가 있다', 글.includes('실제 제품 포장 표시가 우선이에요'), 'true')
chk('「잘못됐어요 알려주기」 단추가 있다', await p.locator('.sheet button:has-text("잘못됐어요 알려주기")').count(), '1')
chk('사진(img)은 원재료 블록에 없다 — 머리 아이콘 하나뿐', await p.locator('.sheet img').count(), '1')

console.log('④ 긴 시트 — 담기 단추에 스크롤로 닿는다')
const 담기 = p.locator('.sheet button:has-text("담기")').first()
await 담기.scrollIntoViewIfNeeded()
const box = await 담기.boundingBox()
chk('담기 단추가 화면 안에 있다', !!box && box.y >= 0 && box.y + box.height <= 844, 'true')
chk('시트가 스크롤된다(overflow-y auto)', await p.evaluate(() => getComputedStyle([...document.querySelectorAll('.sheet')].pop()).overflowY), 'auto')

console.log('⑤ 담기 → 시트 닫힘 · 목록에 담김')
await 담기.click(); await p.waitForTimeout(600)
chk('시트가 닫혔다', await p.locator('.sheet').count(), '0')
// 장보기 목록은 앱 상태(`hankki:v1`)의 `shoppingList` 에 저장된다(store.jsx KEY) — 화면 글자로 세면 카드 이름과 섞인다
await p.waitForTimeout(600)
const 목록 = await p.evaluate(() => { try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').shoppingList) || [] } catch { return [] } })
chk('장보기 목록에 그 이름이 있다', 목록.some((x) => x.name === 있는편.name), 'true')

console.log('③ 원재료 없는 편 — 블록을 안 그린다')
await 열기(없는편.name)
글 = await 시트글()
chk('추천 글은 있다', 글.includes(없는편.benefit), 'true')
chk('「원재료명」 글자가 없다', !글.includes('원재료명'), 'true')
chk('「준비 중」·「없어요」 같은 빈 칸 말이 없다', !/준비 중|아직 없|정보 없/.test(글), 'true')
chk('「잘못됐어요 알려주기」도 없다(원재료가 없으니 신고할 것도 없다)', await p.locator('.sheet button:has-text("잘못됐어요 알려주기")').count(), '0')
await 닫기()

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패}`)
if (실패) { console.log('   ' + 실패목록.join('\n   ')); process.exit(1) }

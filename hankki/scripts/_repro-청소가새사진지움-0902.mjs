// 🧹🚨 「앱을 켠 «뒤»에 담은 사진을 8초 청소가 지운다」 — 창업자 제보 뿌리 찾기 (2026-09-02) 〔조사판〕
//
// 📮 창업자 = "채우러가기 눌렀는데 이래" ＋ 캡처가 «깨진 아이콘»
//    앞선 조사판으로 증상은 재현됐다 = **쪽지는 남았는데 창고에 사진이 없다.**
//    ⛔ 남은 물음 = **왜 없나.** 창업자 것은 18분 전 저장이라 이사 «뒤»에 담은 새 것이다.
//
// ⭐ 짚이는 곳 = `store.jsx` 의 「주인 없는 사진 청소」
//    ```
//    useEffect(() => { setTimeout(async () => { 나누기(state) … }, 8000) }, [])
//    ```
//    `[]` 라 그 안의 `state` 는 **앱을 «켠 순간»의 값**에 굳어 있다(stale closure).
//    → 켠 «뒤»에 담은 사진은 「살아있는 열쇠」에 없어서 **주인 없는 것으로 잡혀 지워진다.**
//    ⛔ 안전장치(`살아있는열쇠.size === 0`)는 **처음부터 사진이 하나도 없을 때만** 막아 준다.
//       창업자 폰엔 사진이 11.8MB 있으므로 그 장치가 안 걸린다.
//
// 🔢 그래서 이렇게 잰다 — ①사진 있는 판으로 켜고 ②켠 «뒤»에 표지 사진을 넣고 ③8초를 넘겨 기다린다
//
// 실행: node scripts/_repro-청소가새사진지움-0902.mjs
// 🏷 이름표 = 반영됨 (smoke 게이트)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4499, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const 사진 = readFileSync(join(ROOT, 'src/assets/ui/key_one.png'))
const 옛사진 = 'data:image/png;base64,' + 사진.toString('base64')

// ── ① 사진이 «이미 있는» 판을 만든다 (창업자 폰과 같은 조건) ──
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4499/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1500)
await p0.evaluate((그림) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  s.recipes = [
    { id: 'old-1', title: '옛날 편', status: 'sorted', source: 'manual', thumb: 'photo', image: 그림, savedAt: Date.now(), ingredients: ['소금 1T', '물 1L'], steps: ['끓인다', '먹는다'] },
    ...(s.recipes || []),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 옛사진)
await p0.close()

// 이사 한 번
const p1 = await ctx.newPage()
await p1.goto('http://127.0.0.1:4499/hankki/', { waitUntil: 'networkidle' })
await p1.waitForTimeout(3500)
console.log('① 켜기 전 서랍 =', await p1.evaluate(() => {
  const r = (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).find((x) => x.id === 'old-1')
  return String(r?.image || '').slice(0, 22)
}))
await p1.close()

// ── ② 앱을 «켠 뒤» 표지 사진을 넣는다 ──
const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => { if (!/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(e.message)) 오류.push(e.message) })
await p.goto('http://127.0.0.1:4499/hankki/', { waitUntil: 'networkidle' })
// ⏱ 대기를 «짧게» — 8초 청소가 돌기 «전»에 사진을 넣고 찍기 시작해야 갈린다(앞 판이 여기서 늦었다)
await p.waitForTimeout(700)

// 레시피 탭 → 아무 편(옛날 편이 아닌 것) 열기
await p.evaluate(() => {
  const 바 = document.querySelector('.bottom-nav') || document.querySelector('nav')
  ;[...(바?.querySelectorAll('button') || [])].find((x) => (x.innerText || '').trim().includes('레시피'))?.click()
})
await p.waitForTimeout(800)
const 연것 = await p.evaluate(() => {
  const c = [...document.querySelectorAll('.grid-card')].find((x) => !/옛날 편/.test(x.innerText || ''))
  const 제목 = (c?.innerText || '').split('\n')[0].trim()
  ;(c?.querySelector('button') || c)?.click()
  return 제목
})
await p.waitForTimeout(600)
console.log('② 연 레시피 =', JSON.stringify(연것))

// 표지 사진 넣기 — 진짜 파일 입력에 넣는다(흉내 아님)
await p.setInputFiles('input[accept="image/*"]', { name: '새사진.png', mimeType: 'image/png', buffer: 사진 })
await p.waitForTimeout(1100)
// 확인 시트가 뜨면 「예」 쪽을 누른다(일기에도 넣을까요 등)
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /^(네|예|넣기|넣을래요|좋아요)/.test((x.innerText || '').trim()))
  if (b) b.click()
})
await p.waitForTimeout(600)

// ⏱⏱ **시각을 «찍어서» 본다** — 앞 판은 여기서 틀렸다.
//   ⛔ 「8초 전」이라고 라벨을 붙였는데 실제로는 페이지를 연 지 9.3초였다(대기들을 더해 보니).
//      즉 「처음부터 없었다」가 아니라 **「지워진 뒤를 봤다」**였을 수 있다.
//   ✅ 그래서 1초마다 창고를 찍어 **언제 생기고 언제 사라지는지** 눈으로 본다.
const 켠때 = Date.now()
const 넣은뒤 = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.recipes || []).filter((r) => String(r.image || '').startsWith('idb://')).map((r) => ({ id: r.id, 쪽지: r.image }))
})
console.log('③ 넣은 직후 쪽지들 =', JSON.stringify(넣은뒤))

const 창고보기 = () => p.evaluate(() => new Promise((res) => {
  const req = indexedDB.open('hankki-photos', 1)
  req.onerror = () => res(['(못 열었다)'])
  req.onsuccess = () => {
    const db = req.result
    const q = db.transaction('img', 'readonly').objectStore('img').getAllKeys()
    q.onsuccess = () => { res(q.result.map(String)); db.close() }
    q.onerror = () => { res(['(못 읽었다)']); db.close() }
  }
  setTimeout(() => res(['(시간 초과)']), 5000)
}))
const 새열쇠 = 'recipes/basic-kongguksu/image'
console.log(`④ 창고 시간표 — 새 열쇠 「${새열쇠}」 가 언제 있고 언제 없나`)
let 있었던적 = false
let 사라진때 = null
for (let i = 0; i < 16; i++) {
  const 열쇠들 = await 창고보기()
  const 있나 = 열쇠들.includes(새열쇠)
  if (있나) 있었던적 = true
  if (있었던적 && !있나 && 사라진때 === null) 사라진때 = Date.now() - 켠때
  console.log(`   ${String(Math.round((Date.now() - 켠때) / 100) / 10).padStart(5)}초  ${있나 ? '있다 ✅' : '없다 ⛔'}  (창고 ${열쇠들.length}개)`)
  await p.waitForTimeout(1000)
}
console.log('   pageerror =', 오류.length ? 오류.join(' · ') : 0)

// 🔒 게이트 — 「켠 뒤에 담은 사진이 살아 있나」를 exit code 로 낸다
const 살았나 = 있었던적 && 사라진때 === null
console.log(
  살았나
    ? '\n✅ 켠 «뒤»에 담은 사진이 15초를 살아남았다 — 청소가 안 지운다'
    : 사라진때 !== null
      ? `\n⛔ 새 사진이 «들어갔다가» ${Math.round(사라진때 / 100) / 10}초에 사라졌다 = 청소가 지웠다`
      : '\n⛔ 새 사진이 «한 번도» 창고에 안 들어갔다 = 넣기 자체가 실패했는데 쪽지만 남았다',
)
if (!살았나) process.exitCode = 1

await b.close(); srv.close()

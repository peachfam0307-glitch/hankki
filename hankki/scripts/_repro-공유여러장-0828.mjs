// 📄📄 「2장짜리 레시피를 «한 번에» 공유했는데 한 장만 담긴다」 재현판 — 창업자 폰 제보 2026-08-28
//
// 📮 창업자 = *"2장짜리레시피야"* ＋ 캡처 넷(원본 2장 · 앱 결과 2장) → *"한번에 공유했어."*
//    🔢 실물 = 탕수육 레시피가 캡션 두 장인데 앱엔 **둘째 장만** 담겼다.
//       제목 = 「풀리게 저어주다가」 · 재료 = 탕수육 «소스» 재료 6줄뿐
//       (첫 장의 진짜 재료 6개 ＋ 걸음 1~7 이 통째로 없다)
//
// ⛔⛔ **뿌리가 «둘»이었다 — 하나만 고치면 안 된다**
//    ⑴ `sw.js` 가 `form.get('image')` = **첫 장 하나**만 꺼냈다(`getAll` 이 아니다)
//    ⑵ 담는 자리가 `'shared-image'` **고정 키 하나**라, 여러 장을 꺼내도 **서로 덮는다**
//
// ⭐ **안드로이드 인텐트는 «이미» 도착하고 있다** — 창업자가 두 장을 한 번에 공유했을 때 앱이 열렸다.
//    그러니 받는 쪽만 고치면 된다. ⛔AAB 를 다시 굽는 일이 아니다.
//
// ⭐ **흉내가 아니다**(절대원칙 30) — 서비스워커가 쓰는 그 캐시(`hankki-shared`)에
//    새 서비스워커와 «같은 모양»(`shared-image-0`·`-1` ＋ `imageCount`)으로 심고 **새 탭**으로 연다.
//
// ⚠️⚠️ **정직하게 — 「두 장의 «글자»가 이어붙었나」는 여기서 못 잰다.**
//    이 컨테이너는 `cdn.jsdelivr.net` 을 막아 tesseract 가 죽고, Google Vision 프록시도 안 탄다.
//    ✅ 그래서 이 판이 지키는 것은 **「두 장이 «앱까지» 도착했나」** 다 — 그게 뿌리였고,
//       이어붙이기는 `EditorScreen` 이 쓰던 검증된 코드를 그대로 쓴다.
//
// 🧪 규칙 12 = `sw.js` 를 `form.get('image')` 로, `shareIntake.js` 를 한 장만 읽게 되돌리면 ②③이 죽는다.
//
// 실행: node scripts/_repro-공유여러장-0828.mjs
// 🏷 이름표 = 판정대기 (⏳창업자 「배포해」 전 · hold/공유여러장-0828)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4457, r))

let 통과 = 0, 실패 = 0
const 실패목록 = []
// ⛔ 이 컨테이너는 `cdn.jsdelivr.net` 을 못 연다 → tesseract 폴백이 죽으며 pageerror 를 쏜다.
//    **우리 코드 잘못이 아니라 «네트워크»다.**
const 남의탓 = (m) => /tesseract|importScripts|cdn\.jsdelivr|Failed to fetch|NetworkError/i.test(m)
const 에러받기 = (page, 어디) => page.on('pageerror', (e) => {
  if (남의탓(e.message)) return
  실패++; 실패목록.push(`pageerror(${어디}): ` + e.message)
})
function chk(이름, 조건, 덧말 = '') {
  if (조건) 통과++; else { 실패++; 실패목록.push(이름) }
  console.log(`  ${조건 ? '✅' : '❌'} ${이름}${덧말 ? '  ' + 덧말 : ''}`)
  return !!조건
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
// 🍞 토스트는 «떴다 사라진다» — 폴링으로 잡으면 놓친다(첫 판이 그래서 빈손이었다).
//    DOM 이 바뀔 때마다 «전부 적어두는» 감시자를 붙인다. 놓칠 수가 없다.
await ctx.addInitScript(() => {
  window.__토스트기록 = []
  const 본다 = () => {
    const t = document.body ? document.body.innerText || '' : ''
    for (const 줄 of t.split('\n')) if (줄.includes('담았어요')) window.__토스트기록.push(줄.trim())
  }
  // ⛔ addInitScript 는 «문서가 생기기 전»에 돈다 — documentElement 가 아직 null 이다(첫 판이 여기서 죽었다)
  const 붙이기 = () => {
    if (!document.documentElement) return setTimeout(붙이기, 0)
    new MutationObserver(본다).observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  }
  붙이기()
})

// 📸 «두 장짜리 레시피»를 흉내낸다 — 1장엔 재료, 2장엔 만드는 법(창업자 실물 그대로의 모양)
const 장만들기 = (글줄) => `(() => {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1800
  const x = c.getContext('2d')
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 900, 1800)
  x.fillStyle = '#111111'; x.font = 'bold 34px sans-serif'
  const 줄 = ${JSON.stringify(글줄)}
  줄.forEach((t, i) => x.fillText(t, 60, 140 + i * 70))
  return c.toDataURL('image/jpeg', 0.92)
})()`

// 🥣 새 서비스워커와 «같은 모양»으로 심는다
const 여러장심기 = async (page, dataUrls) => page.evaluate(async (dus) => {
  const cache = await caches.open('hankki-shared')
  await cache.put('shared-meta', new Response(JSON.stringify({
    title: '', text: '', url: '', ts: Date.now(), hasImage: true, imageCount: dus.length,
  }), { headers: { 'Content-Type': 'application/json' } }))
  for (let i = 0; i < dus.length; i++) {
    const blob = await (await fetch(dus[i])).blob()
    await cache.put(`shared-image-${i}`, new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } }))
  }
}, dataUrls)

// 🥣 «옛» 서비스워커가 남긴 모양(키 하나 · imageCount 없음) — 되돌아가기 호환 확인용
const 옛모양심기 = async (page, dataUrl) => page.evaluate(async (du) => {
  const blob = await (await fetch(du)).blob()
  const cache = await caches.open('hankki-shared')
  await cache.put('shared-meta', new Response(JSON.stringify({
    title: '', text: '', url: '', ts: Date.now(), hasImage: true,
  }), { headers: { 'Content-Type': 'application/json' } }))
  await cache.put('shared-image', new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } }))
}, dataUrl)

const 저장소 = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('hankki:v1') || '{}') } catch { return {} }
})

console.log('\n📄 2장짜리 레시피가 «두 장 다» 담기나 — 재현판\n')

// ─────────────────────────────────────────────
// ① 두 장을 심는다
// ─────────────────────────────────────────────
console.log('① 두 장 공유 (재료 장 ＋ 만드는 법 장)')
const p0 = await ctx.newPage()
에러받기(p0, '심기')
await p0.goto('http://127.0.0.1:4457/hankki/', { waitUntil: 'networkidle' })
const 장1 = await p0.evaluate(장만들기(['재료', '돼지고기 등심 350g', '당근조금', '양파 4분의 1개', '목이버섯 5-6개']))
const 장2 = await p0.evaluate(장만들기(['탕수육 소스만들어요', '물 300ml', '진간장 1T', '식초 2T', '케찹 1T']))
await 여러장심기(p0, [장1, 장2])
await p0.close()

// ⛔ `page.reload()` 금지 — `addInitScript` 가 다시 돌아 저장값이 시드로 덮인다(옛 함정 사전 ①)
const p1 = await ctx.newPage()
에러받기(p1, '두장')
// 🔢 «글자 읽기를 몇 번 시도했나» — OCR 결과는 이 환경에서 못 얻지만 «시도»는 셀 수 있다.
//    ⭐ 이게 「두 장을 다 읽나」를 재는 유일한 잣대다(프록시 주소는 `src/ocr.js` 의 OCR_PROXY_URL).
let 읽기시도 = 0
p1.on('request', (r) => { if (/hankki-ocr|workers\.dev/.test(r.url())) 읽기시도++ })
await p1.goto('http://127.0.0.1:4457/hankki/', { waitUntil: 'networkidle' })
await p1.waitForTimeout(6000)
const 토스트 = (await p1.evaluate(() => (window.__토스트기록 || [])[0] || '')) || ''
chk('② 「사진 2장을 담았어요」가 떴다 = 두 장이 앱까지 왔다', /사진\s*2장/.test(토스트), `토스트="${토스트}"`)

const s1 = await 저장소(p1)
const 담긴 = (s1.recipes || []).find((r) => r.source === 'photo')
chk('③ 레시피가 담겼다', !!담긴, 담긴 ? `「${담긴.title}」` : '(못 찾음)')
// ⭐⭐ 심장 = 「두 장을 «다» 읽으려 했나」. 한 장만 읽으면 첫 장(재료)이 통째로 사라진다.
chk('④ 글자 읽기를 «두 번» 시도했다 (장마다 한 번)', 읽기시도 >= 2, `시도 ${읽기시도}회`)
await p1.close()

// ─────────────────────────────────────────────
// ④ 옛 서비스워커가 남긴 «한 장» 모양도 그대로 돈다 (되돌아가기 호환)
// ─────────────────────────────────────────────
console.log('\n④ 옛 모양(키 하나) 호환')
const p2 = await ctx.newPage()
에러받기(p2, '옛모양심기')
await p2.goto('http://127.0.0.1:4457/hankki/', { waitUntil: 'networkidle' })
await 옛모양심기(p2, 장1)
await p2.close()

const p3 = await ctx.newPage()
에러받기(p3, '옛모양')
await p3.goto('http://127.0.0.1:4457/hankki/', { waitUntil: 'networkidle' })
await p3.waitForTimeout(3000)
const 토스트2 = (await p3.evaluate(() => (window.__토스트기록 || [])[0] || '')) || ''
chk('⑤ 옛 모양도 담긴다', /담았어요/.test(토스트2), `토스트="${토스트2}"`)
chk('⑥ 한 장일 땐 「N장」을 안 붙인다', !/사진\s*\d+장/.test(토스트2), `토스트="${토스트2}"`)
await p3.close()

// ─────────────────────────────────────────────
// ⑦ ⭐진짜 서비스워커에 «두 장을 POST» 한다 — 위 칸들은 캐시에 직접 심어서 sw.js 를 «안 거친다».
//    📌 그래서 sw.js 의 `getAll` 을 되돌려도 위 칸들은 전부 초록불이었다(규칙 18 ⓘ).
//       안 재는 고침은 조용히 죽는다 → 이 칸이 그 자리를 막는다.
// ─────────────────────────────────────────────
console.log('\n⑦ 진짜 서비스워커에 두 장 POST')
const p4 = await ctx.newPage()
에러받기(p4, 'SW')
await p4.goto('http://127.0.0.1:4457/hankki/', { waitUntil: 'networkidle' })
const sw결과 = await p4.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready
  if (!reg.active) return { 오류: '서비스워커가 안 떴다' }
  const 그림 = (색) => new Promise((res) => {
    const c = document.createElement('canvas'); c.width = 40; c.height = 40
    const x = c.getContext('2d'); x.fillStyle = 색; x.fillRect(0, 0, 40, 40)
    c.toBlob(res, 'image/jpeg')
  })
  const fd = new FormData()
  fd.append('title', ''); fd.append('text', ''); fd.append('url', '')
  fd.append('image', await 그림('#111'), '1.jpg')   // 재료 장
  fd.append('image', await 그림('#eee'), '2.jpg')   // 만드는 법 장
  try { await fetch('share-target', { method: 'POST', body: fd, redirect: 'manual' }) } catch { /* 리다이렉트는 무시 */ }
  const cache = await caches.open('hankki-shared')
  const meta = await (await cache.match('shared-meta')).json()
  return {
    개수: meta.imageCount,
    장0: !!(await cache.match('shared-image-0')),
    장1: !!(await cache.match('shared-image-1')),
  }
})
chk('⑦ 서비스워커가 «두 장 다» 받았다', sw결과.개수 === 2 && sw결과.장0 && sw결과.장1, JSON.stringify(sw결과))
await p4.close()

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패} 통과`)
if (실패) { console.log('실패:', 실패목록.join(' · ')); process.exit(1) }

// 🗃🧹 「임시보관함에 정리된 레시피가 섞여 있다」 ＋ 「이미 담긴 큰 사진」 재현판 — 창업자 확정 2026-08-28 〔반영됨〕
//
// 📮 창업자 = *"보관함에 있는 반영된 레시피는 따로 보관해야지.
//    **유저들이 모르고 지울 수도 있을 것 같아. 미정리랑 같이있으니까..**"* → 갈래 「㉠」
// 📮 ＋ *"2. ㄱ."* = ②이미 담긴 사진도 줄인다 · ㉠정리됨은 임시보관함에서 뺀다
//
// ⛔⛔ **뿌리 둘**
//  ⑴ `InboxScreen` 이 `[...recipes]` 를 «필터 없이» 썼다 → 창업자 폰 「전체 248 · 정리됨 242」.
//     그 242 는 「내 레시피」 탭이 보여주는 바로 그 목록인데 **여기엔 줄마다 휴지통이 있었다.**
//     누르면 `recipes` 에서 통째로 빠져 **「내 레시피」에서도 사라진다**(기본 레시피까지).
//  ⑵ v11.64 는 «앞으로 담는 것»만 줄인다 — 이미 담긴 6장(4MB)은 그대로였다(규칙 18 ⓙ).
//
// ⭐⭐ **이 판의 심장 = 「안 보인다」가 아니라 «안 잃었다»** 다.
//    ③번 칸이 그걸 잰다 — 임시보관함에서 사라진 레시피가 **「내 레시피」엔 그대로 있나**.
//    ⛔ 그걸 안 재면 「숨기기」와 「지우기」를 구별 못 하는 판이 된다.
//
// ⭐ 사진 쪽 심장 = **「두 번 굽지 않는다」**(⑦). 창업자 걱정이 정확히 그거였다 —
//    *"2번을 하면 앱에서 사진이 뿌옇게 보이는거 아냐?"*
//    🔢 실측 = 이미 1200px 로 담긴 사진을 또 구우면 **용량 95KB→95KB(안 준다) · 화질만 RMSE 0.36 깎인다.**
//    ✅ 그래서 문턱(260,000자)을 넘는 것만 건드린다. 작은 건 손도 안 댄다.
//
// 🧪 규칙 12 = `InboxScreen` 의 `status === 'unsorted'` 필터를 빼면 ②④가 죽고,
//    `App.jsx` 의 줄이기 useEffect 를 빼면 ⑤⑥이 죽는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-보관함정리-0828.mjs
// 🏷 이름표 = 반영됨 (배포 게이트 · smoke)
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
await new Promise((r) => srv.listen(4452, r))

let 통과 = 0, 실패 = 0
const 실패목록 = []
const 남의탓 = (m) => /tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(m)
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

const 저장소 = (page) => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('hankki:v1') || '{}') } catch { return {} } })
const 재기 = (page, du) => page.evaluate((d) => new Promise((res) => {
  const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res({ w: 0, h: 0 }); im.src = d
}), du)

console.log('\n🗃 임시보관함 정리 ＋ 이미 담긴 사진 줄이기 — 재현판\n')

// ─────────────────────────────────────────────
// 씨앗 심기 — 큰 사진 / 작은 사진 / 정리된 것
// ─────────────────────────────────────────────
const p0 = await ctx.newPage()
에러받기(p0, '심기')
await p0.goto('http://127.0.0.1:4452/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1200)
const 심은값 = await p0.evaluate(() => {
  // 폰 스크린샷처럼 — 평평한 면 ＋ 글자(노이즈로 만들면 JPEG 가 못 눌러 실물과 달라진다)
  const 그리기 = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const x = c.getContext('2d')
    x.fillStyle = '#101014'; x.fillRect(0, 0, w, h)
    x.fillStyle = '#1c1c22'; x.fillRect(20, 100, w - 40, h - 200)
    x.fillStyle = '#e8e8ee'; x.font = 'bold ' + Math.round(w / 24) + 'px sans-serif'
    for (let k = 0; k < 24; k++) x.fillText('깨끗이 씻은 콩나물 300g 들기름 1큰술', 36, 160 + k * Math.round(h / 28))
    return c.toDataURL('image/jpeg', 0.92)
  }
  const 큰사진 = 그리기(1080, 2340)   // 원본급 — 줄어야 한다
  const 작은사진 = 그리기(360, 640)    // 이미 작다 — 손대면 안 된다
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 이제 = Date.now()
  s.recipes = [
    { id: 'zz-big', title: '판정용 큰사진', status: 'unsorted', source: 'photo', image: 큰사진, savedAt: 이제, ingredients: [], steps: [], favorite: false, cooked: 0 },
    { id: 'zz-small', title: '판정용 작은사진', status: 'unsorted', source: 'photo', image: 작은사진, savedAt: 이제 - 1000, ingredients: [], steps: [], favorite: false, cooked: 0 },
    { id: 'zz-sorted', title: '판정용 정리끝난것', status: 'sorted', source: 'manual', savedAt: 이제 - 2000, ingredients: ['콩나물 300g'], steps: ['씻어요'], favorite: false, cooked: 0 },
    ...(s.recipes || []),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { 큰: 큰사진.length, 작은: 작은사진.length }
})
console.log(`   심은 큰 사진 = ${심은값.큰.toLocaleString()}자 · 작은 사진 = ${심은값.작은.toLocaleString()}자\n`)
await p0.close()

// ─────────────────────────────────────────────
// 새 탭 — 앱이 뜨면 ②(사진 줄이기)가 저절로 돈다
// ⛔ `page.reload()` 안 쓴다(`check-mistakes` ⑧ 옛 함정 사전)
// ─────────────────────────────────────────────
const p1 = await ctx.newPage()
에러받기(p1, '본판')
await p1.goto('http://127.0.0.1:4452/hankki/', { waitUntil: 'networkidle' })
await p1.waitForTimeout(6000) // 줄이기는 2.5초 뒤 시작 ＋ 장당 60ms

console.log('🧹 ② 이미 담긴 사진 줄이기')
const s1 = await 저장소(p1)
const 큰 = (s1.recipes || []).find((r) => r.id === 'zz-big')
const 작은 = (s1.recipes || []).find((r) => r.id === 'zz-small')
if (chk('심은 레시피가 살아 있다', !!큰 && !!작은)) {
  chk('큰 사진이 «줄었다»', 큰.image.length < 심은값.큰,
    `${심은값.큰.toLocaleString()} → ${큰.image.length.toLocaleString()}자`)
  const k = await 재기(p1, 큰.image)
  chk('큰 사진 긴 변이 1600 이하', Math.max(k.w, k.h) <= 1600, `${k.w}×${k.h}`)
  // ⭐⭐ 창업자 걱정 그 자리 — 작은 건 «건드리지도» 않아야 한다(다시 구우면 화질만 깎인다)
  chk('작은 사진은 «한 글자도» 안 바뀌었다', 작은.image.length === 심은값.작은,
    `${심은값.작은.toLocaleString()}자 그대로`)
} else {
  실패 += 3; 실패목록.push('심은 레시피를 못 찾아 사진 칸을 못 쟀다')
  console.log('  ⛔ 못 찾아서 뒤 칸을 «판정하지 않는다»(규칙 18 ⓘ)')
}

// ⑦ 두 번째로 열어도 «또» 굽지 않는다 — 재압축이 쌓이면 뿌예진다
const 줄인길이 = 큰 ? 큰.image.length : 0
await p1.close()
const p2 = await ctx.newPage()
에러받기(p2, '두번째')
await p2.goto('http://127.0.0.1:4452/hankki/', { waitUntil: 'networkidle' })
await p2.waitForTimeout(6000)
const s2 = await 저장소(p2)
const 큰2 = (s2.recipes || []).find((r) => r.id === 'zz-big')
chk('다시 열어도 «또 굽지» 않는다', !!큰2 && 큰2.image.length === 줄인길이,
  큰2 ? `${큰2.image.length.toLocaleString()}자 그대로` : '(못 찾음)')

// ─────────────────────────────────────────────
// ㉠ 임시보관함 — 정리된 것은 «안 보인다», 그런데 «안 잃었다»
// ─────────────────────────────────────────────
console.log('\n🗃 ㉠ 임시보관함에서 정리된 것 빼기')
await p2.getByRole('button', { name: /임시보관함/ }).first().click()
await p2.waitForTimeout(900)
// ⛔⛔ **`document.body.innerText` 로 재면 안 된다** — 화면을 옮겨도 «앞 화면 DOM 이 남는다».
//    첫 판이 그래서 빨간불이었는데, 열어보니 「판정용 정리끝난것」이 뜬 자리는
//    **홈의 「오늘 뭐 해먹지」 카드(`.today-card`)와 레시피 격자(`.grid2`)** 였다.
//    임시보관함엔 처음부터 없었다 — **판이 엉뚱한 화면을 재고 있었다**(v11.19 에 밟은 그 함정 · 규칙 18 ⓘ).
// ✅ 잣대를 **`.inbox-row`**(임시보관함 줄 전용 클래스)로 콕 집는다. 그게 곧 「이 화면에 뜬 목록」이다.
const 보관함 = await p2.evaluate(() => {
  const 줄들 = [...document.querySelectorAll('.inbox-row')].map((e) => e.innerText)
  // 칩은 「임시보관함 화면 «안»」의 것만 센다 — 다른 화면의 칩까지 세면 늘 빨간불이다
  const 화면 = document.querySelector('.inbox-row')?.closest('.screen') || null
  return {
    줄들,
    제목있나: /임시보관함/.test(화면?.innerText || ''),
    칩수: 화면 ? 화면.querySelectorAll('.pill').length : -1,
  }
})
const 목록글 = 보관함.줄들.join('\n')
chk('임시보관함이 열렸다', 보관함.제목있나, `줄 ${보관함.줄들.length}개`)
chk('미정리는 보인다', 목록글.includes('판정용 큰사진'))
chk('정리된 것은 «안» 보인다', !목록글.includes('판정용 정리끝난것'))
chk('칩(전체/정리됨)이 없다', 보관함.칩수 === 0, `칩 ${보관함.칩수}개`)

// ⭐⭐ 제일 중요한 칸 — 안 보이는 것과 «없어진 것»은 다르다
const 아직있나 = await p2.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).some((r) => r.id === 'zz-sorted') } catch { return false }
})
chk('⭐ 정리된 레시피가 «저장소에 그대로» 있다(안 잃었다)', 아직있나)

await b.close(); srv.close()
console.log(`\n${실패 ? '❌' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) { console.log('  실패:', 실패목록.join(' · ')); process.exit(1) }

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

// 🗄🗄 **[2026-09-02] 사진이 「큰 창고」(IndexedDB)로 이사했다 — 서랍만 보면 «쪽지»를 잰다**
//   ⛔⛔ 이 판은 `localStorage` 의 `r.image` 길이로 「줄었나」를 쟀는데, 이사 뒤 그 값은
//      `idb://recipes/zz-big/image` 같은 **서른 글자짜리 쪽지**다.
//      → 「큰 사진이 줄었다」는 «늘» 초록불이 되고(1,000,000 → 30) 「작은 건 안 바뀌었다」는 «늘» 빨간불이 된다.
//      **둘 다 사진을 안 재고 있다**(규칙 18 ⓘ).
//   ✅ 그래서 쪽지면 **창고에서 진짜 사진을 꺼내** 그것을 잰다. 잣대가 「사진 그 자체」로 돌아온다.
const 사진값 = (page, v) => page.evaluate((val) => new Promise((res) => {
  if (typeof val !== 'string' || !val.startsWith('idb://')) return res(val || '')
  const 길 = val.slice(6)
  const req = indexedDB.open('hankki-photos', 1)
  req.onerror = () => res('')
  req.onsuccess = () => {
    const db = req.result
    try {
      const g = db.transaction('img', 'readonly').objectStore('img').get(길)
      g.onsuccess = () => { res(typeof g.result === 'string' ? g.result : ''); db.close() }
      g.onerror = () => { res(''); db.close() }
    } catch { res(''); db.close() }
  }
}), v)

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
    // 🗃 2026-09-01 창업자 제보 — 「AI 가 다 읽었는데 임시보관함에 갇혀 레시피 탭에 안 보인다」
    { id: 'zz-full', title: '판정용 다읽은것', status: 'unsorted', source: 'photo', savedAt: 이제 - 3000,
      ingredients: ['콩나물 300g', '들기름 1큰술', '소금 조금'], steps: ['씻어요', '데쳐요', '무쳐요'], favorite: false, cooked: 0 },
    { id: 'zz-half', title: '판정용 반쪽만읽은것', status: 'unsorted', source: 'photo', savedAt: 이제 - 4000,
      ingredients: ['콩나물 300g', '들기름 1큰술'], steps: [], favorite: false, cooked: 0 },
    ...(s.recipes || []),
  ]
  // ⛔⛔ **「옛 폰」을 흉내내려면 이사 표식을 지워야 한다.**
  //    앱이 한 번 뜨면 `initialState` 가 «처음 켠 사람»으로 보고 `inboxV` 를 박아 둔다.
  //    그대로 두고 씨앗만 심으면 **이사가 «이미 끝난 것»으로 건너뛰어** 아무것도 안 옮겨진다
  //    (그러면 판은 초록불인데 창업자 폰은 그대로 — 제일 나쁜 거짓 초록불이다).
  // 🖼 2026-09-02 창업자 판정 — 「캡처는 표지 안 쓴다」
  //   ⓐ `zz-big` = 도장(`thumb`)이 «없는» 편 → 잣대(`기본표지`)가 바로 아이콘으로 그린다
  //   ⓑ 아래 `zz-stamp` = 편집기가 이미 `thumb: 'photo'` 를 «박아둔» 옛 폰 흉내 → 이사가 도장을 지워야 한다
  s.recipes.push({ id: 'zz-stamp', title: '판정용 캡처표지', status: 'sorted', source: 'photo',
    thumb: 'photo', image: 작은사진, savedAt: 이제 - 5000,
    ingredients: ['콩나물 300g', '들기름 1큰술'], steps: ['씻어요', '무쳐요'], favorite: false, cooked: 0 })
  //   ⓐ 도장이 «없는» 편 — 잣대가 바로 아이콘으로 그려야 한다
  //   ⛔ `zz-big` 을 쓰면 안 된다 — 그건 끝까지 `unsorted` 라 «레시피 탭 격자에 아예 없다»(못 재고 빨간불)
  s.recipes.push({ id: 'zz-nostamp', title: '판정용 도장없는캡처', status: 'sorted', source: 'photo',
    image: 작은사진, savedAt: 이제 - 6000,
    ingredients: ['콩나물 300g', '들기름 1큰술'], steps: ['씻어요', '무쳐요'], favorite: false, cooked: 0 })
  delete s.inboxV
  // ⛔ 이것도 지워야 이사가 돈다 — 안 지우면 «이미 끝난 것»으로 건너뛰어 거짓 초록불이 된다
  delete s.coverV
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
// 🗄 서랍엔 쪽지만 남을 수 있다 → «진짜 사진»을 꺼내서 잰다(위 `사진값` 주석 참조)
const 큰그림 = 큰 ? await 사진값(p1, 큰.image) : ''
const 작은그림 = 작은 ? await 사진값(p1, 작은.image) : ''
if (chk('심은 레시피가 살아 있다', !!큰 && !!작은)) {
  chk('⭐ 사진을 «창고에서든 서랍에서든» 찾았다', !!큰그림 && !!작은그림,
    `큰 ${큰그림.length.toLocaleString()}자 · 작은 ${작은그림.length.toLocaleString()}자`)
  chk('큰 사진이 «줄었다»', 큰그림.length > 0 && 큰그림.length < 심은값.큰,
    `${심은값.큰.toLocaleString()} → ${큰그림.length.toLocaleString()}자`)
  const k = await 재기(p1, 큰그림)
  chk('큰 사진 긴 변이 1600 이하', k.w > 0 && Math.max(k.w, k.h) <= 1600, `${k.w}×${k.h}`)
  // ⭐⭐ 창업자 걱정 그 자리 — 작은 건 «건드리지도» 않아야 한다(다시 구우면 화질만 깎인다)
  chk('작은 사진은 «한 글자도» 안 바뀌었다', 작은그림.length === 심은값.작은,
    `${심은값.작은.toLocaleString()}자 그대로`)
} else {
  실패 += 4; 실패목록.push('심은 레시피를 못 찾아 사진 칸을 못 쟀다')
  console.log('  ⛔ 못 찾아서 뒤 칸을 «판정하지 않는다»(규칙 18 ⓘ)')
}

// ⑦ 두 번째로 열어도 «또» 굽지 않는다 — 재압축이 쌓이면 뿌예진다
const 줄인길이 = 큰그림.length
await p1.close()
const p2 = await ctx.newPage()
에러받기(p2, '두번째')
await p2.goto('http://127.0.0.1:4452/hankki/', { waitUntil: 'networkidle' })
await p2.waitForTimeout(6000)
const s2 = await 저장소(p2)
const 큰2 = (s2.recipes || []).find((r) => r.id === 'zz-big')
const 큰2그림 = 큰2 ? await 사진값(p2, 큰2.image) : ''
chk('다시 열어도 «또 굽지» 않는다', !!큰2 && 큰2그림.length === 줄인길이 && 줄인길이 > 0,
  큰2 ? `${큰2그림.length.toLocaleString()}자 그대로` : '(못 찾음)')

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

// ─────────────────────────────────────────────
// 🗃 2026-09-01 — 「다 읽었으면 끝난 것」은 레시피 탭으로 졸업한다 (창업자 제보)
//   📮 창업자 = *"최근저장에는 뜨는데 레시피탭에 가면 안보여."*
//             · *"ai다 다 읽었으면 끝난거잖아. 그럼 수동으로 옮겨야해?"*
//   ⭐⭐ 이 칸의 심장 = **«화면에» 보이나** 다. 저장소만 보면 v11.00 사고를 또 밟는다
//      (`addShopItem` 이 필드를 골라 버려서 넘겼는데 저장이 안 됐고 게이트 50개가 전부 초록불이었다).
// ─────────────────────────────────────────────
console.log('\n🗃 다 읽은 것은 «레시피 탭»으로 졸업한다 (2026-09-01)')
const s3 = await 저장소(p2)
const 다읽은 = (s3.recipes || []).find((r) => r.id === 'zz-full')
const 반쪽 = (s3.recipes || []).find((r) => r.id === 'zz-half')
chk('⭐ 다 읽은 것이 «정리 끝»으로 옮겨졌다', !!다읽은 && 다읽은.status === 'sorted', 다읽은 ? 다읽은.status : '(못 찾음)')
chk('반쪽만 읽은 것은 임시보관함에 «남는다»', !!반쪽 && 반쪽.status === 'unsorted', 반쪽 ? 반쪽.status : '(못 찾음)')
chk('임시보관함 목록에 «다 읽은 것»이 없다', !목록글.includes('판정용 다읽은것'))
chk('임시보관함 목록에 «반쪽»은 그대로 있다', 목록글.includes('판정용 반쪽만읽은것'))

// ⭐ 화면으로 확인 — 잣대를 «레시피 격자의 이름표»(.grid2/.grid3 안 .name)로 콕 집는다.
//   ⛔ `document.body.innerText` 로 재면 «앞 화면 DOM» 까지 걸려 늘 초록불이 된다(이 판이 이미 밟은 함정).
// ⛔ 임시보관함은 «전체화면»이라 하단바가 없다 — 거기서 탭을 누르려다 30초를 기다렸다(v11.30 함정).
//    ⭐ 새 탭에서 연다. 옮기기는 이미 저장까지 끝났으므로 새로 열어도 그대로다.
const p3 = await ctx.newPage()
에러받기(p3, '레시피탭')
await p3.goto('http://127.0.0.1:4452/hankki/', { waitUntil: 'networkidle' })
await p3.waitForTimeout(1500)
await p3.getByRole('button', { name: '레시피', exact: true }).first().click()
await p3.waitForTimeout(1200)
const 레시피탭 = await p3.evaluate(() => {
  const 격자 = document.querySelector('.grid2, .grid3')
  if (!격자) return { 열렸나: false, 이름들: [] }
  return { 열렸나: true, 이름들: [...격자.querySelectorAll('.name')].map((e) => e.innerText.trim()) }
})
if (chk('레시피 탭이 열렸다', 레시피탭.열렸나, `카드 ${레시피탭.이름들.length}장`)) {
  chk('⭐⭐ 다 읽은 것이 «레시피 탭 화면에» 뜬다 (창업자가 못 보던 그것)',
    레시피탭.이름들.includes('판정용 다읽은것'))
  chk('반쪽은 레시피 탭에 «안» 뜬다 (임시보관함이 제자리다)',
    !레시피탭.이름들.includes('판정용 반쪽만읽은것'))
} else {
  실패 += 2; 실패목록.push('레시피 탭을 못 열어 화면 칸을 «판정하지 않았다»(규칙 18 ⓘ)')
  console.log('  ⛔ 못 열어서 뒤 칸을 «판정하지 않는다»')
}

// ─────────────────────────────────────────────
// 🚪 2026-09-02 — 「나가는 길」이 임시보관함 «안»에 있나 (창업자 확정)
//
//   📮 창업자 = *"임시보관함 자체에 선택해서 저장하는 기능을 넣어야해"*
//             · *"레시피를 내가 편집하지 않는이상 큰 정리완료 단추는 못찾고"*
//             · *"그럼 유저가 그걸 어떻게 고쳐??"*
//             · *"얘는 왜 자동으로 안가고 여기있지? 할 것 같은데"*
//   ⭐⭐ 이 절의 심장 = **「이유 ＋ 고칠 길」이 «화면에» 같이 있나.**
//      이유만 있으면 잔소리고, 길만 있으면 왜 눌러야 하는지 모른다. 둘이 한 벌이다.
// ─────────────────────────────────────────────
console.log('\n🚪 임시보관함에서 «바로» 나가는 길 (2026-09-02)')
const 길 = await p2.evaluate(() => {
  const 화면 = document.querySelector('.inbox-row')?.closest('.screen')
  if (!화면) return null
  const 글 = 화면.innerText
  const 단추 = [...화면.querySelectorAll('button')].map((b) => b.innerText.trim())
  return {
    머리말: /덜 읽힌/.test(글),
    까닭: (글.match(/덜 읽었어요/g) || []).length,
    채우러: 단추.filter((t) => t === '채우러 가기').length,
    저장: 단추.filter((t) => t === '그대로 저장' || t === '레시피로 저장').length,
    줄수: 화면.querySelectorAll('.inbox-row').length,
  }
})
if (chk('임시보관함 화면을 읽었다', !!길, 길 ? `줄 ${길.줄수}개` : '(못 읽음)')) {
  chk('⭐ 「왜 여기 있나」 머리말이 있다', 길.머리말)
  chk('⭐ 줄마다 «까닭»이 붙는다', 길.까닭 >= 1, `${길.까닭}줄`)
  chk('⭐ 「채우러 가기」가 있다 (편집 안 거치고 고치러 간다)', 길.채우러 >= 1, `${길.채우러}개`)
  chk('⭐ 「저장」 단추가 줄마다 있다 (여기서 바로 내보낸다)', 길.저장 === 길.줄수, `${길.저장}/${길.줄수}`)
} else {
  실패 += 4; 실패목록.push('임시보관함을 못 읽어 나가는 길 칸을 «판정하지 않았다»(규칙 18 ⓘ)')
}

// ── 「채우러 가기」를 누르면 «편집기»로 가고, 거기 단추가 「저장」인가 ──
//   ⛔ 창업자가 못 찾은 그 단추다 — 옛 이름은 편집 중일 때만 「정리 완료」였다.
const 갔나 = await p2.evaluate((제목) => {
  const 줄 = [...document.querySelectorAll('.inbox-row')].find((e) => e.innerText.includes(제목))
  const 칸 = 줄?.parentElement?.parentElement
  const b = [...(칸?.querySelectorAll('button') || [])].find((x) => x.innerText.trim() === '채우러 가기')
  if (!b) return false
  b.click(); return true
}, '판정용 큰사진')
await p2.waitForTimeout(1100)
const 편집 = await p2.evaluate(() => {
  const 큰 = document.querySelector('button.btn-primary')
  const 띠 = document.querySelector('.topbar-stick')
  return {
    열렸나: !!큰,
    큰단추: (큰?.innerText || '').trim(),
    옛이름: /정리 완료/.test(document.body.innerText),
    붙었나: 띠 ? getComputedStyle(띠).position === 'sticky' : false,
    // 📷📷 덜 정리된 것 ＋ 사진이 있으면 «이미 고정된 채로» 열려야 한다 (창업자 2026-09-02)
    //   ⛔⛔ 옛 잣대 = `img[src^="data:image"]` — **썸네일 미리보기 한 장만 있어도 초록불**이었다.
    //      「고정 창이 열렸나」를 물어야 하는데 「그림이 화면에 있나」를 물었다(규칙 18 ⓘ).
    //   ✅ 이제 «접기 손잡이»를 본다 — 그 단추는 `pin === 'photo'` 일 때만 그려진다.
    사진고정: !!document.querySelector('button[aria-label="캡처 사진 접기"]'),
    //   ＋ 진짜로 «크게» 그려졌나(썸네일은 폭 100px 대다)
    사진폭: Math.round([...document.querySelectorAll('img')]
      .filter((e) => /^data:image/.test(e.src))
      .reduce((m, e) => Math.max(m, e.getBoundingClientRect().width), 0)),
  }
})
if (chk('「채우러 가기」로 편집기가 열렸다', 갔나 && 편집.열렸나, 편집.큰단추 ? `큰 단추 = 「${편집.큰단추}」` : '(못 열림)')) {
  chk('⭐⭐ 큰 단추가 «「저장」»이다 (창업자가 못 찾던 그것)', 편집.큰단추 === '저장', `「${편집.큰단추}」`)
  chk('⭐ 「정리 완료」가 화면에 «한 글자도» 없다', !편집.옛이름)
  chk('⭐ 상단바가 «붙어 있다» (스크롤해도 「저장」이 안 떠내려간다)', 편집.붙었나)
  // 📷📷 창업자가 콕 집은 자리 — *"임시보관함에 제대로 안읽은 레시피를 네가 편집할때 사진띄워놓겠다며"*
  //   ⛔⛔ 이 값은 2026-09-02 까지 «계산만 하고 판정을 안 했다» — 지키는 줄이 0이었다(규칙 18 ⓘ).
  chk('⭐⭐ 캡처가 «이미 펼쳐진 채로» 열린다 (덜 읽힌 것 ＋ 사진 있음)', 편집.사진고정)
  chk('⭐ 그 캡처가 «크게» 그려졌다 (썸네일이 아니다)', 편집.사진폭 >= 300, `${편집.사진폭}px`)
} else {
  실패 += 5; 실패목록.push('편집기를 못 열어 「저장」·「사진」 칸을 «판정하지 않았다»(규칙 18 ⓘ)')
}

// ── 「그대로 저장」을 누르면 «레시피 탭 화면»에 뜨나 (반쪽도 유저가 정하면 나간다) ──
await p2.evaluate(() => document.querySelector('button[aria-label="닫기"]')?.click())
await p2.waitForTimeout(900)
const 밀었나 = await p2.evaluate((제목) => {
  const 줄 = [...document.querySelectorAll('.inbox-row')].find((e) => e.innerText.includes(제목))
  const 칸 = 줄?.parentElement?.parentElement
  const b = [...(칸?.querySelectorAll('button') || [])].find((x) => x.innerText.trim() === '그대로 저장')
  if (!b) return false
  b.click(); return true
}, '판정용 반쪽만읽은것')
await p2.waitForTimeout(1100)
const p4 = await ctx.newPage()
에러받기(p4, '레시피탭2')
await p4.goto('http://127.0.0.1:4452/hankki/', { waitUntil: 'networkidle' })
await p4.waitForTimeout(1500)
await p4.getByRole('button', { name: '레시피', exact: true }).first().click()
await p4.waitForTimeout(1200)
const 탭2 = await p4.evaluate(() => {
  const 격자 = document.querySelector('.grid2, .grid3')
  return 격자 ? [...격자.querySelectorAll('.name')].map((e) => e.innerText.trim()) : null
})
if (chk('「그대로 저장」을 눌렀고 레시피 탭이 열렸다', 밀었나 && !!탭2, 탭2 ? `카드 ${탭2.length}장` : '(못 열림)')) {
  chk('⭐⭐ 유저가 «직접 민» 반쪽이 레시피 탭 화면에 뜬다', 탭2.includes('판정용 반쪽만읽은것'))
} else {
  실패++; 실패목록.push('「그대로 저장」 결과를 «판정하지 않았다»(규칙 18 ⓘ)')
}

// ── 🖼 캡처가 «표지»가 되지 않는다 (창업자 판정 2026-09-02) ──
//   📮 창업자 = *"저 자리는 음식아이콘이 들어가야하는데 편집끝나도 사진으로 남는거야?"* → **캡처는 표지 안 쓴다**
//   ⭐ 화면으로 잰다 — 저장소만 보면 「도장이 지워졌나」까지밖에 못 말한다(⛔그건 「카드가 아이콘이다」가 아니다)
const 표지 = await p4.evaluate(() => {
  const 저장소 = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 재기 = (제목, id) => {
    const 이름 = [...document.querySelectorAll('.name')].find((e) => e.innerText.trim() === 제목)
    const 카드 = 이름?.closest('.grid-card') || 이름?.parentElement
    if (!카드) return null
    // ⛔⛔ 「data: 그림이 있나」로 재면 «안 된다» — 빌드가 작은 아이콘 PNG 를 `data:` 로 인라인한다.
    //    음식 아이콘도 data: 라서 늘 빨간불이 된다(규칙 18 ⓘ · 2026-09-02 에 실제로 밟았다).
    // ✅ 「그 레시피의 «사진 그 자체»가 쓰였나」를 본다 — 그게 곧 「캡처가 표지다」이다.
    const 사진 = (저장소.recipes || []).find((r) => r.id === id)?.image || ''
    const 그림들 = [...카드.querySelectorAll('img')].map((e) => e.src)
    return { 사진쓰나: !!사진 && 그림들.some((s) => s === 사진), 그림수: 그림들.length }
  }
  const st = (저장소.recipes || []).find((r) => r.id === 'zz-stamp')
  return { 도장없음: 재기('판정용 도장없는캡처', 'zz-nostamp'), 도장있던것: 재기('판정용 캡처표지', 'zz-stamp'),
    저장된도장: st ? (st.thumb ?? '(지워짐)') : '(못 찾음)', 사진남았나: !!st?.image }
})
if (chk('표지 칸을 잴 카드 둘을 찾았다', !!표지.도장없음 && !!표지.도장있던것)) {
  chk('⭐⭐ 캡처가 «표지»가 아니다 (도장 없던 편)', 표지.도장없음.사진쓰나 === false)
  chk('⭐⭐ 이미 박힌 캡처 표지도 «풀렸다» (규칙 18 ⓙ · 창업자 판정)', 표지.도장있던것.사진쓰나 === false,
    `저장된 thumb = ${표지.저장된도장}`)
  chk('⭐ 사진을 «지우지는» 않았다 — 「사진」 칩으로 되돌릴 수 있다', 표지.사진남았나)
} else {
  실패 += 3; 실패목록.push('표지 카드를 못 찾아 «판정하지 않았다»(규칙 18 ⓘ)')
}

// ─────────────────────────────────────────────
// 🤖 2026-09-02 — 「AI 가 «나중에» 채우면 그때 졸업하나」 (창업자 제보의 뿌리)
//
//   ⚠️⚠️ **이 두 칸만 «소스»를 읽는다. 화면으로 못 재는 이유를 적어 둔다** —
//      그 길(`App.jsx` 공유받기 → `채우기()`)은 `if (data.imageDataUrl)` 안에 있고
//      **`await ocrImage()` 를 지나야** 닿는다. 이 판은 OCR 이 막혀(tesseract·Vision 둘 다)
//      글자가 빈 채로 `return` 하므로 **거기까지 갈 수가 없다.**
//   ⛔ 그러니 이 칸은 위 화면 칸들보다 «약하다». 「코드에 있다」까지만 말하고
//      「진짜 도나」는 말하지 않는다 — 그걸 섞어 말하면 그게 거짓 초록불이다(규칙 18 ⓘ).
//   ⛔ 주석을 걷어내고 «코드»만 본다 — 안 그러면 위에 적어둔 설명 글자를 세어
//      고침을 지워도 초록불이 된다(이 저장소가 이미 두 번 밟은 함정).
// ─────────────────────────────────────────────
console.log('\n🤖 AI 가 «나중에» 채우면 그때 졸업한다 (⚠️소스 검사 — 위 칸들보다 약하다)')
const 주석뺀다 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
const App소스 = 주석뺀다(readFileSync(join(ROOT, 'src/App.jsx'), 'utf8'))
const store소스 = 주석뺀다(readFileSync(join(ROOT, 'src/store.jsx'), 'utf8'))
const 채우기몸통 = (App소스.split('const 채우기 = (r) =>')[1] || '').split('현재.title = 새제목')[0]
chk('⭐⭐ `채우기()` 가 «다 읽었으면» status 를 올린다 (창업자 폰 항정살조림이 갇힌 자리)',
  /다읽었나\(r\)/.test(채우기몸통) && /status:\s*'sorted'/.test(채우기몸통))
chk('⭐ 잣대가 «한 곳»이다 — 세 자리가 `다읽었나()` 를 부른다 (갈리면 또 어긋난다)',
  /export function 다읽었나/.test(store소스) && (App소스.match(/다읽었나\(/g) || []).length >= 2,
  `App.jsx 안 ${(App소스.match(/다읽었나\(/g) || []).length}번`)
chk('⭐ `INBOX_V` 가 2 이상이다 — 이미 폰에 갇힌 것을 한 번 더 꺼낸다 (창업자 판정)',
  /const INBOX_V = ([2-9]|\d{2,})/.test(store소스), (store소스.match(/const INBOX_V = \d+/) || ['?'])[0])

await b.close(); srv.close()
console.log(`\n${실패 ? '❌' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) { console.log('  실패:', 실패목록.join(' · ')); process.exit(1) }

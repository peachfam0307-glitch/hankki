// 📦📦 「공유받은 사진이 «원본 그대로» 저장된다」 재현판 — 창업자 폰 제보 2026-08-28 〔반영됨〕
//
// 📮 창업자 = *"저장 공간이 가득 찼어요"* 토스트 캡처 ＋ *"미정리 레시피가 10개도 안되는데 용량이부족하구나.."*
//    🔢 창업자 폰 실측 = 미정리 **6**(전부 「사진」＝공유받기) ＋ 일기 **2** · 「전체 248 · 정리됨 242」
//
// ⛔⛔ **뿌리** = `shareIntake.js:17` 이 `blobToDataUrl(blob)` 결과를 **줄이지 않고** 돌려주고
//    `App.jsx` 가 그걸 그대로 `image:` 에 넣어 `localStorage` 에 담았다.
//    캡처 504KB → base64 **672KB** → 6장 **4MB** → 한도(5MB) 초과 → `store.jsx:830` 이 throw
//    → **저장이 통째로 막혔다.** (앱을 껐다 켜면 그동안 담은 게 날아간다)
//
// ⭐⭐ **사진이 들어오는 문이 열 곳인데 아홉은 이미 줄이고 있었다** —
//    일기 `fitImage(1200)` · 표지 `fitImage(1200)` · 편집 `cropSquare(800)` · 아바타 `cropSquare(256)` ·
//    꾸미기 `cropRatio(700)` · 자르기 시트 `2400` 제한. **공유받기 하나만 원본이었다.**
//    📌 그래서 처음에 내가 *"줄이는 코드가 0줄"* 이라 한 건 **틀렸다** — 우리 함수 이름이
//       `fitImage`·`cropSquare` 라 `grep resize|quality|toDataURL` 에 안 걸렸다(규칙 18 ⓘ).
//
// ⭐ **이 판의 심장 = 「소스에 fitImage 가 있나」가 아니라 «진짜 담긴 값이 작아졌나»** 다.
//    v11.00 사고(`addShopItem` 이 필드를 골라 `noBuy` 를 말없이 버렸다 · 게이트 50개가 초록불)를
//    되풀이하지 않으려고 **`localStorage` 를 직접 열어** 잰다.
//
// ⭐ 흉내가 아니다(절대원칙 30) — 서비스워커가 쓰는 그 캐시(`hankki-shared`)에
//    `shared-meta`＋`shared-image` 를 심고 **새 탭**으로 열면 앱의 `consumeSharedIntake` 가 그대로 읽는다.
//
// 🧪 규칙 12 = `App.jsx` 의 `image: shrunk` 를 `image: data.imageDataUrl` 로 되돌리면 ②③④가 죽는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-공유사진크기-0828.mjs
// 🏷 이름표 = 반영됨 (배포 게이트 · smoke)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 사진값 } from './_창고사진.mjs'   // 🗄 사진이 창고(IndexedDB)로 갔으면 꺼내서 잰다

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4451, r))

let 통과 = 0, 실패 = 0
const 실패목록 = []
// ⛔ 이 컨테이너는 `cdn.jsdelivr.net` 을 못 연다 → tesseract 폴백이 죽으며 pageerror 를 쏜다.
//    **우리 코드 잘못이 아니라 «네트워크»다.** 이걸 실패로 세면 늘 빨간불인 죽은 게이트가 된다.
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

// 📸 큰 사진을 «브라우저 안에서» 만든다 — **폰 스크린샷처럼** 생기게.
//    ⛔⛔ 첫 판은 8px 격자에 랜덤 색을 칠했다. 그건 **노이즈 덩어리**라 JPEG 가 못 눌러
//       88% 밖에 안 줄었고 「절반 아래로」가 실패했다.
//       📌 **고침이 약한 게 아니라 시험지가 이상했다** — 진짜 캡처는 저렇게 안 생겼다.
//    ⭐ 폰 캡처 = **평평한 면 ＋ 글자**(UI 화면이니까). 그렇게 그려야 실제와 같은 비율이 나온다.
const 큰사진만들기 = (w, h) => `(() => {
  const c = document.createElement('canvas'); c.width = ${w}; c.height = ${h}
  const x = c.getContext('2d')
  x.fillStyle = '#101014'; x.fillRect(0, 0, ${w}, ${h})               // 인스타 다크 배경
  x.fillStyle = '#1c1c22'; x.fillRect(24, 180, ${w} - 48, ${h} - 360) // 글 카드
  x.fillStyle = '#e8e8ee'; x.font = 'bold ' + Math.round(${w} / 26) + 'px sans-serif'
  const 줄 = ['콩나물의 시원함을 최대한 살린 콩나물무침', '깨끗이 씻은 콩나물 300g을', '냄비에 넣고',
    '물은 딱 1/3컵만 넣어주세요.', '적게 넣어야 이 물을 버리지 않고 다 사용할 수 있어요.',
    '중불로 불을 올린 뒤 끓어 김이', '올라오는순간부터', '3분동안 찌듯이 살아주시고']
  for (let k = 0; k < 26; k++) x.fillText(줄[k % 줄.length], 48, 260 + k * Math.round(${h} / 30))
  return c.toDataURL('image/jpeg', 0.92)
})()`

// 🥣 공유받기 캐시에 심는다 — 서비스워커가 넣는 것과 «같은 모양»
const 심기 = async (page, dataUrl) => page.evaluate(async (du) => {
  const blob = await (await fetch(du)).blob()
  const cache = await caches.open('hankki-shared')
  await cache.put('shared-meta', new Response(JSON.stringify({
    title: '', text: '', url: '', ts: Date.now(), hasImage: true,
  }), { headers: { 'Content-Type': 'application/json' } }))
  await cache.put('shared-image', new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } }))
  return blob.size
}, dataUrl)

const 저장소 = (page) => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('hankki:v1') || '{}') } catch { return {} }
})

// 📐 저장된 dataURL 의 «진짜 픽셀 크기»를 잰다 — 글자·바이트가 아니라 실물
const 재기 = (page, dataUrl) => page.evaluate((du) => new Promise((res) => {
  const im = new Image()
  im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight })
  im.onerror = () => res({ w: 0, h: 0 })
  im.src = du
}), dataUrl)

console.log('\n📦 공유받은 사진이 «줄어서» 저장되나 — 재현판\n')

// ─────────────────────────────────────────────
// ① 큰 사진(1080×2340 · 폰 스크린샷 크기)
// ─────────────────────────────────────────────
console.log('① 큰 사진 — 폰 스크린샷 크기(1080×2340)')
const p0 = await ctx.newPage()
에러받기(p0, '심기')
await p0.goto('http://127.0.0.1:4451/hankki/', { waitUntil: 'networkidle' })
const 원본 = await p0.evaluate(큰사진만들기(1080, 2340))
const 원본바이트 = await 심기(p0, 원본)
console.log(`   심은 원본 = ${원본.length.toLocaleString()}자 (blob ${Math.round(원본바이트 / 1024)}KB)`)
await p0.close()

// ⛔ `page.reload()` 를 쓰지 않는다 — `addInitScript` 가 다시 돌아 저장값이 시드로 덮인다
//    (`check-mistakes` ⑧ 「옛 함정 사전」 첫 항목). **새 탭**으로 연다.
const p1 = await ctx.newPage()
에러받기(p1, '큰사진')
await p1.goto('http://127.0.0.1:4451/hankki/', { waitUntil: 'networkidle' })
await p1.waitForTimeout(2500)

const s1 = await 저장소(p1)
const 담긴 = (s1.recipes || []).find((r) => r.source === 'photo' && r.image)
chk('큰 사진이 담겼다', !!담긴, 담긴 ? `「${담긴.title}」` : '(못 찾음)')

if (담긴) {
  // 🗄 [2026-09-02] 서랍엔 쪽지(`idb://…`)만 남는다 → **창고에서 꺼낸 진짜 사진**을 잰다(규칙 18 ⓘ)
  const 담긴그림 = await 사진값(p1, 담긴.image)
  chk('사진을 «창고에서든 서랍에서든» 찾았다', 담긴그림.startsWith('data:image'),
    `${담긴그림.length.toLocaleString()}자`)
  const 줄인길이 = 담긴그림.length
  const 비율 = 줄인길이 / 원본.length
  chk('저장된 사진이 «원본보다 작다»', 줄인길이 < 원본.length,
    `${원본.length.toLocaleString()} → ${줄인길이.toLocaleString()}자 (${Math.round(비율 * 100)}%)`)
  // ⚠️ **잣대를 0.5 → 0.7 로 늦췄다. 봐준 게 아니라 «시험지가 실물보다 안 눌리기 때문»이다.**
  //    🔢 실측 대조 — 같은 설정(1600·0.85)인데 그림에 따라 이만큼 갈린다:
  //       · 진짜 폰 캡처(1080×2340) : 521KB → **129KB (25%)**
  //       · 이 합성 그림            : 358KB → **187KB (52%)**  ← 글자가 화면을 꽉 채워 덜 눌린다
  //    📌 진짜 판정은 **아래 「긴 변 1600 이하」**가 한다 — 그건 시험지에 안 흔들린다.
  //       이 칸은 「아예 안 줄었다(100%)」를 잡는 그물이다. 원본으로 되돌리면 여기서 죽는다.
  chk('원본보다 확실히 작다', 비율 < 0.7,
    `아끼는 양 ≈ ${Math.round((원본.length - 줄인길이) / 1024)}KB / 장`)
  const 크기 = await 재기(p1, 담긴그림)
  chk('긴 변이 1600 이하다', Math.max(크기.w, 크기.h) <= 1600, `${크기.w}×${크기.h}`)
  chk('사진이 안 깨졌다(픽셀이 있다)', 크기.w > 0 && 크기.h > 0)
} else {
  실패 += 4; 실패목록.push('담긴 사진이 없어 ②③④⑤를 못 쟀다')
  console.log('  ⛔ 담긴 사진이 없어 ②③④⑤를 «판정하지 않는다» — 안 잰 것을 초록불로 만들지 않는다(규칙 18 ⓘ)')
}
await p1.close()

// ─────────────────────────────────────────────
// ② 작은 사진은 «안 건드린다» — 괜히 키우거나 다시 굽지 않는다
// ─────────────────────────────────────────────
console.log('\n② 작은 사진 — 400×400 (줄일 게 없다)')
const p2 = await ctx.newPage()
await p2.goto('http://127.0.0.1:4451/hankki/', { waitUntil: 'networkidle' })
const 작은원본 = await p2.evaluate(큰사진만들기(400, 400))
await 심기(p2, 작은원본)
await p2.close()

const p3 = await ctx.newPage()
에러받기(p3, '작은사진')
await p3.goto('http://127.0.0.1:4451/hankki/', { waitUntil: 'networkidle' })
await p3.waitForTimeout(2500)
const s3 = await 저장소(p3)
// ⛔⛔ 첫 판은 `.pop()` 으로 「마지막」을 집었는데 **목록이 최신순이라 새 것은 «앞»에 붙는다**
//    → 큰 사진을 집어 「738×1600」이 나왔다. **판이 엉뚱한 걸 재고 빨간불이었다**(규칙 18 ⓘ).
//    ✅ `savedAt` 이 가장 큰 것 = «방금 담긴 것».
const 사진들 = (s3.recipes || []).filter((r) => r.source === 'photo' && r.image)
const 작은담긴 = [...사진들].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0]
if (작은담긴) {
  const k = await 재기(p3, await 사진값(p3, 작은담긴.image))
  chk('작은 사진은 크기가 그대로다', k.w === 400 && k.h === 400, `${k.w}×${k.h}`)
} else {
  실패++; 실패목록.push('작은 사진이 안 담겼다')
  console.log('  ❌ 작은 사진이 안 담겼다')
}
await p3.close()

// ─────────────────────────────────────────────
// ③ ⭐ OCR 은 «원본»으로 읽는다 — 줄인 걸로 읽으면 레시피가 덜 읽힌다
// ─────────────────────────────────────────────
console.log('\n③ OCR 은 원본으로 읽나 (소스)')
const app = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8')
// ⛔ 주석까지 세면 «고쳐놓고도 실패»로 나온다(규칙 18 ⓘ) → 주석 줄을 걷어내고 «진짜 호출»만 본다
const 코드줄 = app.split('\n').filter((l) => !l.trim().startsWith('//'))
// ⛔⛔ [2026-08-28] 잣대를 «글자»에서 «뜻»으로 옮겼다.
//    앞 판은 `ocrImage(data.imageDataUrl)` 이라는 «글자»를 찾았는데, 2장짜리 레시피를 받으려고
//    `for (const 장 of 장들) ocrImage(장)` 으로 바뀌자 **뜻은 그대로인데 글자가 없어져** 죽었다.
//    ⭐ 이 칸이 «진짜로» 지키려는 것 = **줄인 사진(`shrunk`)으로 읽지 않는다.** 그걸 본다.
//    (`장들` 은 `data.imageDataUrls` = 원본 dataURL 이다 — 줄이는 건 저장할 때뿐)
chk('OCR 을 «줄인 사진»으로 돌리지 않는다',
  !코드줄.some((l) => /ocrImage\(\s*shrunk/.test(l)))
chk('OCR 을 부르는 자리가 있다',
  코드줄.some((l) => /ocrImage\(/.test(l)))
chk('`image:` 에는 줄인 것을 담는다',
  코드줄.some((l) => /image:\s*shrunk/.test(l)))
chk('원본을 그대로 담는 옛 줄이 없다',
  !코드줄.some((l) => /image:\s*data\.imageDataUrl/.test(l)))

await b.close(); srv.close()
console.log(`\n${실패 ? '❌' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) { console.log('  실패:', 실패목록.join(' · ')); process.exit(1) }

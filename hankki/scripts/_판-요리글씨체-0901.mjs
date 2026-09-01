// 🍳🔤 **요리모드 글씨체 시안 — 실제 요리모드 화면에 «얹어서» 찍는다** (창업자 지시 2026-09-01)
//
// 📮 창업자 = *"추가로 **요리모드 글씨체바꾸기**"*
//
// ⛔⛔ **크기는 한 글자도 안 건드린다** — `.cook-steptext` 24px(작은 폰) · 28px(min-height 750) ·
//    38px(패드) · `.cook-stepno` 16px 는 **2026-08-21 「글자2」 470곳 확대 때 «일부러» 건너뛴 값**이다
//    (창업자가 964걸음을 전수로 재서 콕 집어 정했다). 이번 일은 **글꼴(font-family)만** 바꾸는 것이다.
//
// ⭐⭐ **새 글꼴을 받아오지 않는다** — 앱에 이미 열두 벌이 `@font-face` 로 들어 있다(꾸미기 글씨).
//    새로 받으면 첫 화면이 무거워지고(precache 215MB 사고와 같은 결) 라이선스도 다시 봐야 한다.
//
// ⭐ 절대원칙 30 — **앱을 흉내 내지 않는다.** 진짜 앱을 띄워 요리모드까지 들어간 뒤
//    `font-family` «한 줄»만 덮어 찍는다. 그래서 줄바꿈·스크롤이 실제와 어긋날 수가 없다.
//
// 실행: node /home/user/hankki/hankki/scripts/_판-요리글씨체-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글씨체'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))   // ⛔ 포트를 손으로 박지 않는다(EADDRINUSE 사고 둘)
const PORT = srv.address().port

// ── 후보 여섯 ──────────────────────────────────────────────
// ⭐ 고른 잣대 = **부엌에서 «멀리서 힐끗» 읽는 글자**다. 손에 물이 묻어 있고 폰은 조리대에 놓여 있다.
//    그래서 「예쁜가」보다 **「획이 안 뭉치나 · 받침이 살아 있나」**가 먼저다.
// ⛔ 손글씨체(나눔펜)는 일부러 «한 벌만» 넣었다 — 셋씩 넣으면 판정이 흐려진다.
const 후보 = [
  { id: 'now', 이름: '지금 그대로', 폰트: null, 왜: '앱 본문 글꼴(Pretendard). 바꾸기 «전» 판이다 — 이게 잣대다' },
  { id: 'gowun', 이름: '고운돋움', 폰트: "'Gowun Dodum'", 왜: '본문과 제일 가깝고 부드럽다. 획이 굵어 멀리서도 안 뭉친다' },
  { id: 'jua', 이름: '주아', 폰트: "'Jua'", 왜: '둥글고 굵다. 우리 그림체(꼬르곰)와 결이 같다' },
  { id: 'dohyeon', 이름: '도현', 폰트: "'Do Hyeon'", 왜: '각지고 굵다. 멀리서 제일 잘 보인다' },
  { id: 'gaegu', 이름: '귀염체', 폰트: "'Gaegu'", 왜: '메모지(포스트잇)에 이미 쓴다 — 앱 안에서 «한 세트»가 된다' },
  { id: 'pen', 이름: '나눔펜', 폰트: "'Nanum Pen Script'", 왜: '손글씨. 예쁘지만 획이 가늘어 부엌에서 불리할 수 있다' },
  // ⭐⭐ **창업자 물음에 «답하려고» 넣은 판** = *"나는 귀염체가 좋은데 두껍지 않아도 괜찮을까.."*
  //    ⛔ 크기를 키우는 게 아니다(창업자 확정값이라 못 건드린다). **획만 0.4px 덧그린다.**
  //    ⭐ 획 덧그리기(text-stroke)는 글자 «둘레»만 두껍게 해서 자리·줄바꿈이 하나도 안 바뀐다.
  { id: 'gaegu2', 이름: '귀염체 (조금 굵게)', 폰트: "'Gaegu'", 획: '0.4px',
    왜: '창업자가 걱정한 «가늘다»를 크기 안 건드리고 푸는 판 — 획만 덧그린다' },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// ── 요리모드까지 들어가기 ────────────────────────────────
async function 요리모드로(폭, 높이) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 높이 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  }
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  // 「요리모드 시작」이 있는 편을 만날 때까지 카드를 눌러 본다
  const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
  const n = Math.min(await 카드.count(), 14)
  for (let i = 0; i < n; i++) {
    await 카드.nth(i).click().catch(() => {})
    await p.waitForTimeout(800)
    if (await p.locator('[data-coach="cook"]').count()) break
    await p.goBack().catch(() => {}); await p.waitForTimeout(600)
  }
  if (!(await p.locator('[data-coach="cook"]').count())) return { ctx, p, 됐나: false }
  await p.locator('[data-coach="cook"]').first().click()
  await p.waitForTimeout(1200)
  // ⭐ 0단계는 «재료 준비»라 걸음 글자가 없다 → 걸음 글자가 나올 때까지 다음으로
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.cook-steptext').count()) break
    await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {})
    await p.waitForTimeout(700)
  }
  return { ctx, p, 됐나: await p.locator('.cook-steptext').count() > 0 }
}

// ⛔⛔ **첫 판에 「패드 가로」가 빠져 있었다** — 창업자가 잡았다(2026-09-01):
//    *"그리고 패드는 가로모드 아니야?? 세로로 찍은 것 같은데."*
//    ⭐ 맞다. 요리할 땐 패드를 «세워두고 눕혀서» 본다. 게다가 v10.08 에 가로모드를 «일부러 열었다».
//    📌 세로만 찍으면 창업자가 실제로 보는 화면이 판에 없다(절대원칙 30 의 사촌 — 판이 실물과 달랐다).
const 기기 = [
  { id: 'phone', 이름: '폰 390×844', 폭: 390, 높이: 844 },
  { id: 'pad', 이름: '패드 세로 820×1180', 폭: 820, 높이: 1180 },
  { id: 'padland', 이름: '패드 가로 1180×820', 폭: 1180, 높이: 820 },
]

// 🔢🔢 **「두껍지 않을까」를 눈이 아니라 숫자로** (창업자 2026-09-01
//    *"나는 귀염체가 좋은데 두껍지 않아도 괜찮을까.."* · *"주아는 … 조금 두껍지 않나"*)
//    ⭐ 재는 것 = **글자 상자 안에서 「잉크가 덮은 넓이」 비율.** 굵을수록 커진다.
//    ⛔ `font-weight` 숫자로는 못 잰다 — 글꼴마다 같은 700 이어도 실제 획이 다르다.
function 잉크비율(file) {
  const buf = readFileSync(file)
  let w = 0, h = 0, depth = 0, ctype = 0
  const idat = []
  for (let o = 8; o + 8 <= buf.length;) {
    const len = buf.readUInt32BE(o)
    const type = buf.toString('latin1', o + 4, o + 8)
    const data = buf.subarray(o + 8, o + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    o += 12 + len
  }
  // ⛔⛔ **첫 판이 여기서 죽었다** — RGBA(6)만 읽게 짜뒀는데
  //    Playwright 의 «요소» 캡처는 투명이 없어 **RGB(2)** 로 나온다 → 여섯 판 전부 「잉크 ?」.
  //    📌 규칙 18 ⓘ — 검사가 «무엇을 보는지». 값이 안 나오면 잣대부터 의심한다.
  if ((ctype !== 6 && ctype !== 2) || depth !== 8 || !w || !h) return null
  let raw; try { raw = inflateSync(Buffer.concat(idat)) } catch { return null }
  const BPP = ctype === 6 ? 4 : 3, stride = w * BPP
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride)
  let 잉크 = 0, 칸 = 0
  for (let y = 0; y < h; y += 1) {
    const off = y * (stride + 1)
    if (off + stride >= raw.length + 1) break
    const filter = raw[off]
    raw.copy(cur, 0, off + 1, off + 1 + stride)
    for (let i = 0; i < stride; i += 1) {
      const a = i >= BPP ? cur[i - BPP] : 0, b = prev[i], c = i >= BPP ? prev[i - BPP] : 0
      if (filter === 1) cur[i] = (cur[i] + a) & 255
      else if (filter === 2) cur[i] = (cur[i] + b) & 255
      else if (filter === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
    }
    for (let x = 0; x < w; x += 1) {
      const r = cur[x * BPP], g = cur[x * BPP + 1], bl = cur[x * BPP + 2]
      const 밝기 = (r * 299 + g * 587 + bl * 114) / 1000
      칸 += 1
      // ⭐ 문턱 150 = 크림 바탕(238)과 글자(44) 사이. 반투명 가장자리는 «반만» 세지 않고 넣는다
      //    — 가는 글꼴은 가장자리 비중이 커서 빼면 실제보다 더 가늘게 나온다
      if (밝기 < 150) 잉크 += 1
    }
    cur.copy(prev)
  }
  return 칸 ? { 비율: 잉크 / 칸, 잉크칸: 잉크 } : null
}

const 잰값 = []
for (const g of 기기) {
  const { ctx, p, 됐나 } = await 요리모드로(g.폭, g.높이)
  if (!됐나) { console.error(`✗ ${g.이름} — 요리모드 걸음 글자를 못 찾았다(아무것도 못 잰다)`); await ctx.close(); continue }
  console.log(`\n── ${g.이름} ──`)
  for (const f of 후보) {
    // ⭐⭐ 글꼴 «한 줄»만 덮는다. 크기·굵기·줄간은 안 건드린다(창업자 확정값)
    await p.evaluate(([ff, st]) => {
      document.getElementById('_ff')?.remove()
      if (!ff) return
      const s = document.createElement('style'); s.id = '_ff'
      s.textContent = `.cook-steptext, .cook-stepno { font-family: ${ff}, 'Pretendard', sans-serif !important; }`
      if (st) s.textContent += `\n.cook-steptext { -webkit-text-stroke: ${st} currentColor; }`
      document.head.appendChild(s)
    }, [f.폰트, f.획 || null])
    await p.waitForTimeout(600)   // 글꼴 내려받기·다시 그리기
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(250)
    // 🔢 「진짜로 갈렸나」를 재서 찍는다 — 안 재면 **아무것도 안 바꾸고 통과**한다(규칙 18 ⓘ)
    const m = await p.evaluate(() => {
      const e = document.querySelector('.cook-steptext'); if (!e) return null
      const cs = getComputedStyle(e), r = e.getBoundingClientRect()
      return { 글꼴: cs.fontFamily.split(',')[0].replace(/["']/g, ''), 크기: cs.fontSize, 높이: Math.round(r.height), 글자수: (e.innerText || '').length }
    })
    const 파일 = `${g.id}-${f.id}.png`
    await p.screenshot({ path: join(OUT, 파일) })
    // ⭐ 두께는 «글자 상자만» 잘라서 잰다 — 화면 전체로 재면 곰 그림·단추까지 섞여 뜻이 없다
    const 잘린 = `${g.id}-${f.id}-글자.png`
    await p.locator('.cook-steptext').first().screenshot({ path: join(OUT, 잘린) }).catch(() => {})
    const 잉크 = 잉크비율(join(OUT, 잘린))
    // ⭐⭐ **「비율」로 두께를 견주면 «틀린다»** — 상자 넓이가 줄 수에 따라 달라져서
    //    줄이 하나 적은 글꼴(주아·나눔펜)은 같은 잉크가 «절반 넓이»에 담겨 두 배로 굵어 보인다.
    //    ✅ 두께는 **글자 하나가 먹는 잉크**로 잰다 — 상자·줄 수와 무관해진다.
    //    (deviceScaleFactor 2 라 실제 픽셀은 두 배 → 크기도 2배로 나눠 맞춘다)
    const 글자당 = 잉크 && m?.글자수 ? 잉크.잉크칸 / m.글자수 / ((parseFloat(m.크기) * 2) ** 2) : null
    잰값.push({ 기기: g.id, 기기이름: g.이름, ...f, ...m, 파일,
      잉크: 잉크 == null ? null : Math.round(잉크.비율 * 10000) / 100,
      두께: 글자당 == null ? null : Math.round(글자당 * 1000) / 10 })
    console.log(`  · ${f.이름.padEnd(7)} → 크기 ${m?.크기} · 글상자 ${m?.높이}px · 글자당 잉크 ${글자당 == null ? '?' : (글자당 * 100).toFixed(1)}`)
  }
  await ctx.close()
}
await b.close(); srv.close()

// ⚠️ 「크기가 안 바뀌었나」를 스스로 검사한다 — 하나라도 다르면 판정이 오염된다
const 크기들 = [...new Set(잰값.filter((v) => v.기기 === 'phone').map((v) => v.크기))]
if (크기들.length > 1) console.error(`\n⛔ 폰에서 글자 크기가 갈렸다(${크기들.join(' / ')}) — 글꼴만 바꿔야 하는데 크기가 따라 움직였다`)
else console.log(`\n✅ 폰 글자 크기 = ${크기들[0]} 로 «여섯 판 전부 같다» (글꼴만 갈렸다)`)

writeFileSync(join(OUT, '잰값.json'), JSON.stringify(잰값, null, 2))
console.log(`\n📁 ${OUT}`)

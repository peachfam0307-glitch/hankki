// 🔎 온보딩 «전수» 검수 — 날짜 · 문구 · 이모지 · 넘침
//    ⛔ 파일 이름에 장수를 넣지 않는다 — 첫 판이 「9장」이었는데 그날 바로 열 장이 됐다.
//       장수는 계속 늘어난다(v8.37 여섯 → v9.04 여덟 → v10.05 아홉 → 열). 개수는 아래 WANT_N 한 곳에서만.
//
// 📮 창업자 2026-08-09 — *"8장 검수해서 날짜랑 멘트랑 다 확인하자"*
//    (＋ *"날짜도 맞춰야해(온보드에 날짜 써있는 이미지가 있을거야)"* — 맞았다.
//     레꾸 카드에 `2026.07.25` 가 «고정으로 박혀» 있었다. 이제 오늘로 계산한다.)
//
// 🎯 재는 것 — 전부 «화면에 실제로 그려진 글자»로 판정한다(코드 짐작 아님)
//   ① 아홉 장 각각의 제목·부제·꼬리말·카드 글자를 다 뽑는다
//   ② 날짜처럼 생긴 글자를 찾아 «오늘(KST)»과 대조한다 — 하나라도 어긋나면 실패
//   ③ 유니코드 이모지 0개 (CLAUDE.md ⛔UI 유니코드 이모지 금지)
//   ④ 글자가 스테이지 밖으로 안 나갔나
//
// ⛔⛔ **캐러셀이라 아홉 장이 «전부» DOM 에 있다** — `body.innerText` 로 읽으면 안 보이는 장까지 잡힌다.
//    2026-08-08 에 그렇게 재서 「1번째」로 나왔다(실물 5번째). → **트랙의 k번째 자식**만 읽는다.
// ⏰ 컨테이너는 UTC 다. 유저 폰은 KST → `timezoneId` 를 주지 않으면 날짜가 «하루 밀려» 찍힌다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4374, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
let bad = 0
const ok = (b, m) => { console.log(`${b ? '✅' : '⛔'} ${m}`); if (!b) bad++ }

// ⏰ 오늘(KST) — 앱이 만드는 두 형식과 같은 규칙으로 만든다
const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
const WD = ['일', '월', '화', '수', '목', '금', '토'][kst.getDay()]
const WANT_DOT = `${kst.getFullYear()}.${String(kst.getMonth() + 1).padStart(2, '0')}.${String(kst.getDate()).padStart(2, '0')}`
const WANT_DIARY = `${kst.getMonth() + 1}.${kst.getDate()} ${WD}`
const WANT_MONTH = `${kst.getMonth() + 1}월`
console.log(`\n⏰ 오늘(KST) = ${WANT_DOT} (${WD}) · 일기형식 「${WANT_DIARY}」 · 달력 「${WANT_MONTH}」\n`)

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 380, height: 820 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0]))
await page.addInitScript((a) => { localStorage.setItem('hankki:v1', JSON.stringify(a.s)) }, { s: { recipes: [], seedV: BASICS_VERSION } })
await page.goto('http://127.0.0.1:4374/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)

// 트랙 = 슬라이드가 가로로 나란히 붙은 flex. 자식 하나 = 한 장.
const N = await page.evaluate(() => {
  const t = [...document.querySelectorAll('div')].find((d) => d.style.display === 'flex' && /^\d+%$/.test(d.style.width) && d.children.length > 3)
  return t ? t.children.length : 0
})
const WANT_N = 10   // 🛒 2026-08-09 장보기 추가 → 열 장
ok(N === WANT_N, `슬라이드가 ${WANT_N}장이다 — 센 것 ${N}`)

// 🈶 유니코드 이모지 — 우리 스티커만 쓴다(문서·주석 아닌 «화면 글자»에서만 본다)
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{23E9}-\u{23FA}]/u

const rows = []
for (let i = 0; i < WANT_N; i++) {
  await page.waitForTimeout(460)
  const d = await page.evaluate((k) => {
    const t = [...document.querySelectorAll('div')].find((x) => x.style.display === 'flex' && /^\d+%$/.test(x.style.width) && x.children.length > 3)
    const slide = t.children[k]
    const grab = (sel) => [...slide.querySelectorAll(sel)].map((e) => e.innerText.trim()).filter(Boolean)
    // 스테이지 = 1080×1920 판. 글자가 이 밖으로 나가면 잘린다.
    const stage = slide.querySelector('div > div')
    const sr = stage ? stage.getBoundingClientRect() : null
    let over = 0
    if (sr) {
      for (const e of slide.querySelectorAll('h1, div, span')) {
        if (!e.innerText || !e.innerText.trim()) continue
        if (e.children.length) continue                    // 글자를 «직접» 가진 것만
        const r = e.getBoundingClientRect()
        if (r.width === 0) continue
        if (r.left < sr.left - 1 || r.right > sr.right + 1 || r.top < sr.top - 1 || r.bottom > sr.bottom + 1) over++
      }
    }
    return { h1: grab('h1').join(' / '), all: slide.innerText.replace(/\n+/g, ' · ').trim(), over }
  }, i)
  rows.push(d)
  await page.screenshot({ path: `${OUT}/ob9-${String(i + 1).padStart(2, '0')}.png` })
  const next = page.locator('button', { hasText: /다음|시작/ }).first()
  if (await next.count()) await next.click().catch(() => {})
}

console.log('\n── 아홉 장 글자 ──────────────────────────────')
rows.forEach((r, i) => {
  console.log(`\n[${i + 1}] ${r.h1.replace(/\n/g, ' ')}`)
  console.log(`    ${r.all}`)
})

// ② 날짜 — 화면에 나온 «날짜처럼 생긴 글자»를 다 모아 오늘과 대조
const text = rows.map((r) => r.all).join(' ')
const dots = [...new Set(text.match(/\d{4}\.\d{2}\.\d{2}/g) || [])]
const diaries = [...new Set(text.match(/\d{1,2}\.\d{1,2}\s*[일월화수목금토]/g) || [])]
const months = [...new Set(text.match(/\b\d{1,2}월/g) || [])]
console.log('\n── 날짜 ─────────────────────────────────────')
console.log(`   카드 날짜 ${dots.length ? dots.join(', ') : '(없음)'}   기대 ${WANT_DOT}`)
console.log(`   일기 날짜 ${diaries.length ? diaries.join(', ') : '(없음)'}   기대 ${WANT_DIARY}`)
console.log(`   달력 달   ${months.length ? months.join(', ') : '(없음)'}   기대 ${WANT_MONTH}`)
ok(dots.length > 0 && dots.every((d) => d === WANT_DOT), `카드 날짜가 전부 오늘이다`)
ok(diaries.length > 0 && diaries.every((d) => d.replace(/\s+/g, ' ') === WANT_DIARY), `일기 날짜가 오늘이다`)
ok(months.length > 0 && months.every((m) => m === WANT_MONTH), `달력 달이 이번 달이다`)

// ③ 이모지 ④ 넘침 ⑤ 크래시
const emo = rows.map((r, i) => [i + 1, (r.all.match(EMOJI) || [])]).filter(([, m]) => m.length)
ok(emo.length === 0, `유니코드 이모지 0개${emo.length ? ` — ${emo.map(([i, m]) => `${i}장 ${m.join('')}`).join(' / ')}` : ''}`)
const over = rows.map((r, i) => [i + 1, r.over]).filter(([, o]) => o > 0)
ok(over.length === 0, `글자가 판 밖으로 안 나갔다${over.length ? ` — ${over.map(([i, o]) => `${i}장 ${o}개`).join(', ')}` : ''}`)
ok(errs.length === 0, `런타임 크래시 0${errs.length ? ` — ${[...new Set(errs)].join(' / ')}` : ''}`)

writeFileSync(`${OUT}/온보딩9장-글자.json`, JSON.stringify({ today: WANT_DOT, rows }, null, 2))
await page.close(); await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 — 고칠 것\n` : `\n✅ 온보딩 ${WANT_N}장 전수 검수 통과\n`)
process.exit(bad ? 1 : 0)

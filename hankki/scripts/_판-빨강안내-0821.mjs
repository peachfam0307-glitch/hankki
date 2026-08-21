// 【⏳ 창업자 판정 대기 · 9월 결제와 한 몸】 시안까지 찍었고 아직 안 보냈다. ⛔죽은 게 아니다.
// 🔴 「1장 스캔하면 1장 깎인다」를 빨강으로 — 갈래 넷을 실물 앱에서 찍는다 (2026-08-21)
//
// 📮 창업자 = *"빨강색으로 안내해줘야할 것 같아. **1장 스캔하면 1장 까인다는걸.**"*
//    그 앞 = *"레시피 하나 저장하는데 9장쓰면 9장이 카운트되는데 **바보가 아닌이상 그렇게 막 쓰지 않겠지**"*
//
// ⭐⭐ 창업자 논리가 이 화면의 «전부»다 —
//    「장수가 곧 돈이다」를 유저가 **알면** 알아서 아낀다. 그러면 과다 사용도, 분당 6회 벽도 저절로 안 걸린다.
//    ⛔ 그런데 그 전제가 지금 안 지켜지고 있다 — **첫 진짜 유저(남편)가 「20장」이 뭔지 몰랐다.**
//    📌 그래서 이 빨강은 «장식»이 아니라 **유저가 돈을 아끼게 하는 장치**다.
//
// 🔎 지금 왜 안 읽히나 (실물 · EditorScreen.jsx:686~699)
//    「캡처는 이렇게 채워요」 카드 안에 줄이 셋인데 **셋 다 같은 색(--brown) · 같은 굵기**다.
//    → 「값(돈)」 줄이 「사용법」 줄과 무게가 같아 **그냥 안내문 중 하나**로 읽힌다.
//
// ⛔⛔ [v11.17 교훈] 색을 «숫자로» 박지 않는다 — `--danger` 는 테마마다 다르다
//    크림 #c85a3f · 다크 #e0946a · 기본(greige) #bd5a44
//    → 시안에서 숫자를 박으면 다크에서 안 읽히는 판을 고르게 된다.
//
// ⛔ [절대원칙 30] 흉내를 그리지 않는다 — 진짜 앱을 띄우고 «그 줄만» 덮어씌운다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-빨강안내-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/빨강안내'
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
await new Promise((r) => srv.listen(4401, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🎨 갈래 넷 — 「빨강」은 확정(창업자). 갈리는 건 **얼마나 세게** 다.
//    ⭐ 첫 줄(=값 줄)을 고르는 선택자 = 안내 카드의 첫 번째 항목
const 첫줄 = '.hk-cap-line-0'
const 갈래 = [
  {
    키: 'a', 이름: 'ⓐ 지금 그대로',
    설명: '갈색 굵게 — 아래 두 줄과 무게가 같다(남편이 못 알아챈 그 상태)',
    css: '',
  },
  {
    키: 'b', 이름: 'ⓑ 글자만 빨강',
    설명: '제일 조용하다 — 카드 모양은 그대로 두고 「1장에 1장」만 빨강',
    css: `${첫줄} b { color: var(--danger) !important; }`,
  },
  {
    키: 'c', 이름: 'ⓒ 빨강 ＋ 줄 전체를 진하게',
    설명: '그 줄 전체가 빨강 계열 — 점까지 빨강이라 눈이 먼저 간다',
    css: `
      ${첫줄} { color: var(--danger) !important; font-weight: 700 !important; }
      ${첫줄} b { color: var(--danger) !important; font-weight: 900 !important; }
      ${첫줄} > span:first-child { background: var(--danger) !important; }`,
  },
  {
    키: 'd', 이름: 'ⓓ 빨간 칸으로 «따로» 빼기',
    설명: '안내문에서 꺼내 자기 칸을 준다 — 제일 세다. ⛔대신 화면이 조금 시끄러워진다',
    css: `
      ${첫줄} {
        background: color-mix(in srgb, var(--danger) 12%, transparent) !important;
        border: 1px solid color-mix(in srgb, var(--danger) 45%, transparent) !important;
        border-radius: 10px !important;
        padding: 9px 11px !important;
        margin: 0 0 9px 0 !important;
        color: var(--danger) !important; font-weight: 700 !important;
      }
      ${첫줄} > span:first-child { background: var(--danger) !important; }
      ${첫줄} b { color: var(--danger) !important; font-weight: 900 !important; }`,
  },
]

// 테마 셋 다 본다 — ⛔한 테마에서만 고르면 다크에서 안 읽히는 걸 고른다
const 테마들 = [
  { 키: 'greige', 이름: '기본' },
  { 키: 'cream', 이름: '크림' },
  { 키: 'dark', 이름: '다크' },
]

const 컷 = {}
const 잰값 = []

async function 편집화면(page) {
  await page.getByRole('button', { name: '가져오기' }).first().click()
  await page.waitForTimeout(700)
  await page.getByText('직접 작성', { exact: false }).first().click()
  await page.waitForTimeout(900)
}

for (const 테마 of 테마들) {
  for (const g of 갈래) {
    // ⭐ 기본 테마만 갈래 넷을 다 찍고, 나머지 테마는 «고를 후보»만 (판이 무거워지면 안 본다)
    if (테마.키 !== 'greige' && g.키 === 'a') continue

    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    await page.addInitScript(SEED_COACH_SEEN)
    await page.addInitScript((t) => {
      try {
        localStorage.setItem('hankki:onboarded', '1')
        // ⛔⛔ 키는 «하이픈» 이다 — `hankki-theme` (`src/theme.js:15` THEME_KEY).
        //    첫 판에서 `hankki:theme`(콜론)로 써서 **세 테마가 전부 기본으로 찍혔다.**
        //    숫자가 셋 다 똑같이 나온 게 신호였다(규칙 18 — 검사부터 의심).
        if (t !== 'greige') localStorage.setItem('hankki-theme', t)
      } catch { /* noop */ }
    }, 테마.키)
    await page.goto('http://127.0.0.1:4401/hankki/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)

    await 편집화면(page)

    // 🏷 안내 카드의 «첫 줄»에 표식을 붙인다 — 갈래 CSS 가 그 줄만 집을 수 있게.
    //    ⛔ 앱 소스는 안 건드린다(규칙 9·13). 판에서만 붙였다 뗀다.
    const 붙었나 = await page.evaluate(() => {
      const 카드 = [...document.querySelectorAll('div')]
        .find((d) => d.textContent?.trim().startsWith('캡처는 이렇게 채워요'))
      if (!카드) return false
      const 줄들 = [...카드.children].filter((c) => c.tagName === 'DIV' && c.querySelector('b'))
      if (!줄들.length) return false
      줄들[0].classList.add('hk-cap-line-0')
      return true
    })
    if (!붙었나) { console.log(`  ⛔ ${테마.이름}/${g.키} — 안내 카드를 못 찾았다`); await page.close(); continue }

    if (g.css) { await page.addStyleTag({ content: g.css }); await page.waitForTimeout(220) }

    // 🔢 눈이 아니라 «대비»가 답한다 — 빨강이 바탕 위에서 실제로 읽히나
    const v = await page.evaluate(() => {
      const L = (c) => { const [r, g2, bb] = c.match(/\d+/g).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g2 + 0.0722 * bb }
      const 비 = (p, q) => { const [x, y] = [L(p), L(q)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2) }
      const 줄 = document.querySelector('.hk-cap-line-0')
      const 강조 = 줄?.querySelector('b')
      if (!줄 || !강조) return null
      // ⛔⛔ «반투명» 배경을 불투명으로 착각하면 대비가 5억까지 튄다(첫 판에서 실제로 그랬다).
      //    ⓓ 의 `color-mix(… 12%, transparent)` 가 `rgba(200,90,63,0.12)` 로 나오는데
      //    그걸 그대로 배경으로 쓰면 밝기 계산이 무너진다 → 알파가 거의 1일 때만 «배경»으로 친다.
      const 불투명 = (c) => { const m = c?.match(/[\d.]+/g); return m && (m.length < 4 || parseFloat(m[3]) > 0.95) }
      let 뒤 = null, e = 줄
      while (e && !뒤) { const c = getComputedStyle(e).backgroundColor; if (c && 불투명(c)) 뒤 = c; e = e.parentElement }
      const 다른줄 = [...document.querySelectorAll('.hk-cap-line-0 ~ div b')][0]
      return {
        강조색: getComputedStyle(강조).color,
        바탕: 뒤,
        강조대비: 비(getComputedStyle(강조).color, 뒤),
        // ⭐ 「아래 두 줄과 얼마나 다른가」 — 이게 «묻히나»의 답이다
        아랫줄과같은색: 다른줄 ? getComputedStyle(다른줄).color === getComputedStyle(강조).color : null,
      }
    })
    잰값.push({ 테마: 테마.이름, 갈래: g.이름, ...(v || {}) })

    const 카드 = await page.evaluate(() => {
      const c = [...document.querySelectorAll('div')].find((d) => d.textContent?.trim().startsWith('캡처는 이렇게 채워요'))
      if (!c) return null
      const r = c.getBoundingClientRect()
      return { x: Math.max(0, r.x - 14), y: Math.max(0, r.y - 14), width: Math.min(390, r.width + 28), height: r.height + 28 }
    })
    const 이름 = `${테마.키}-${g.키}`
    const buf = await page.screenshot(카드 ? { clip: 카드 } : { fullPage: false })
    writeFileSync(join(OUT, `${이름}.png`), buf)
    컷[이름] = buf.toString('base64')
    const pe = []
    page.on('pageerror', (e) => pe.push(String(e.message).split('\n')[0]))
    console.log(`  ✅ ${테마.이름} / ${g.이름}  대비 ${v?.강조대비 ?? '?'}${pe.length ? ' ⛔에러' : ''}`)
    await page.close()
  }
}

await b.close(); srv.close()

console.log('\n──── 잰 값 ────')
잰값.forEach((r) => console.log(`  ${r.테마} · ${r.갈래}`.padEnd(42), `대비 ${r.강조대비}`, r.아랫줄과같은색 === true ? '⛔아랫줄과 같은 색(안 튄다)' : '✅아랫줄과 다르다'))
console.log(`\n📁 ${OUT}`)
writeFileSync(join(OUT, '_잰값.json'), JSON.stringify(잰값, null, 2))

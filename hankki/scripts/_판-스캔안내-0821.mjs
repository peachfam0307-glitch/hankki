// 🔴📖 「AI 스캔 = 돈」을 처음 보는 사람도 알게 — 두 화면 × 갈래 넷 (2026-08-21)
//
// 📮 창업자 지시 (오늘, 순서대로)
//    ① *"빨강색으로 안내해줘야할 것 같아. **1장 스캔하면 1장 까인다는걸.**"*
//    ② *"가져오기에 안내도 명확하고 잘보이게 **다시 적어야** 할 것 같아. **색이나 문체등등**"*
//    ③ *"**처음보는 사람도 이해하게** 써야해."* · *"**예시를 적어도 좋고**"*
//    ④ *"천천히 하자. 정확하게"*
//
// ⭐⭐⭐ 왜 이게 「돈」 문제인가 — 창업자 논리가 이 화면의 전부다
//    📮 *"레시피 하나 저장하는데 9장쓰면 9장이 카운트되는데 **바보가 아닌이상 그렇게 막 쓰지 않겠지**"*
//    → 맞다. **「장수가 곧 돈」인 걸 알면** 유저가 알아서 아낀다.
//    ⛔ 그런데 그 «알면»이 지금 안 지켜진다 — **첫 진짜 유저(남편)가 「20장」이 뭔지 몰랐다.**
//       *"20번의 AI 기능을 이용할 수 있는 거냐"* → 우리는 **사진 20장**인데 「기능 20번」으로 읽혔다.
//
// 🔎 조사로 드러난 «진짜» 뿌리 — 색이 아니라 구조다 (2026-08-21 실측)
//    ⑴ 편집 화면 안내 = **권유가 먼저, 값이 나중**
//       「긴 레시피는 **여러 장 골라도 돼요** — 사진 1장에 AI 스캔 1장씩 써요」
//       → 색만 빨갛게 하면 **「골라도 돼요」가 빨개진다**(경고 칸 안에서 권하는 꼴).
//    ⑵ 가져오기 화면이 **두 말을 동시에** 한다
//       맨 위 = 「무료 AI 스캔 **20장** 남았어요」 ↔ 아래 = 「AI 자동 정리 **〔이미 돼요〕**」
//       → 처음 보는 사람: *"AI가 두 개인가? 하나는 20장, 하나는 그냥 되는 건가?"*
//    ⑶ 그 초록 카드가 **돈 드는 길과 공짜 길을 한 줄로 묶었다**
//       「**캡처**·**링크** 올리면 재료·순서를 자동으로 채워요」 — 캡처는 돈, 링크는 공짜인데 같이 적혀 있다
//
// 🔢 어느 길이 장수를 쓰나 (코드로 확인 · 짐작 아님)
//    ⛔ 쓴다  = 사진·직접 작성 / Instagram(캡처) / YouTube(캡처)  → `ocrImage()` (`EditorScreen.jsx:311`)
//    ✅ 공짜  = 텍스트 붙여넣기 / 링크 붙여넣기 → `linkReader.js:128·146` 이 남의 서버를 쓰고 우리 AI 를 안 거친다
//
// ⛔ [절대원칙 30] 흉내를 그리지 않는다 — **진짜 앱을 띄우고 그 자리 글자·색만** 갈아끼운다.
//    앱 소스는 한 줄도 안 고친다(규칙 9·13). 판에서만 바꿨다 되돌린다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-스캔안내-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/스캔안내'
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
await new Promise((r) => srv.listen(4402, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// ═══ 갈래 넷 — «점점 세지는» 순서로 (고르기 쉽게) ═══
//   ⛔ 색은 `--danger` 변수로만. 숫자로 박으면 다크에서 안 읽힌다(v11.17 교훈).
const 갈래 = [
  {
    키: 'a', 이름: 'ⓐ 지금 그대로',
    한줄: '비교용 — 값이 문장 «뒤»에 있고 아래 두 줄과 색·굵기가 같다',
    띠: null, 카드: null, 안내: null,
  },
  {
    키: 'b', 이름: 'ⓑ 순서만 뒤집기 ＋ 빨강',
    한줄: '값을 «맨 앞»으로. 제일 작은 손질',
    띠: { 아래: '사진 1장 읽을 때마다 1장씩 써요' },
    카드: null,
    안내: { 앞: '사진 1장에 AI 스캔 1장', 뒤: '을 써요 — 긴 레시피는 여러 장 골라도 돼요.', 빨강: true },
  },
  {
    키: 'c', 이름: 'ⓒ ＋ 예시 한 줄',
    한줄: '창업자 *"예시를 적어도 좋고"* — 숫자로 보여준다',
    띠: { 아래: '사진 1장 읽을 때마다 1장씩 써요' },
    카드: null,
    안내: { 앞: '사진 1장에 AI 스캔 1장', 뒤: '을 써요 — 캡처 3장으로 만들면 3장.', 빨강: true },
  },
  {
    키: 'd', 이름: 'ⓓ ＋ 공짜 길까지 알려주기',
    한줄: '⭐제일 셈 — 「글자·링크는 공짜」를 같이 말한다(초록 카드의 오해를 여기서 푼다)',
    띠: { 아래: '사진 1장 읽을 때마다 1장씩 써요 · 글자·링크로 넣으면 안 써요' },
    카드: { 제목: '자동으로 채워주기', 배지: '', 설명: '사진은 AI 스캔을 쓰고, 글자·링크는 안 써요' },
    안내: { 앞: '사진 1장에 AI 스캔 1장', 뒤: '을 써요 — 캡처 3장으로 만들면 3장.', 빨강: true },
  },
]

const 테마들 = [{ 키: 'greige', 이름: '기본' }, { 키: 'dark', 이름: '다크' }]

// ── 화면에 글자·색을 갈아끼우는 조각 (브라우저 안에서 돈다) ──────────
function 바꾸기(g) {
  return (갈래) => {
    const R = 'var(--danger)'

    // ① 가져오기 «잔량 띠» — 작은 설명 줄을 갈아끼운다
    if (갈래.띠) {
      // ⛔⛔ 「그 글자를 «포함»하는 div」로 찾으면 **바깥 상자**가 먼저 잡힌다.
      //    첫 판이 그래서 제목(「무료 AI 스캔 20장 남았어요」)까지 통째로 날렸고,
      //    그 뒤 캡처 찾기가 실패해 ⓑⓒⓓ 가 «한 장도 안 찍혔다».
      //    ✅ 「그 글자로 «시작»하는」 제일 안쪽 것만 집는다.
      {
        const 알약 = [...document.querySelectorAll('div')]
          .find((d) => (d.textContent || '').trim().startsWith('처음 한 번만'))
        if (알약) {
          알약.innerHTML = ''
          const s1 = document.createElement('div')
          s1.textContent = 갈래.띠.아래
          s1.style.cssText = `color:${R};font-weight:900;`
          const s2 = document.createElement('div')
          s2.textContent = '처음 한 번만 드리는 20장이에요 · 다 쓰면 매달 5장'
          s2.style.cssText = 'margin-top:3px;opacity:.85;font-weight:700;'
          알약.append(s1, s2)
        }
      }
    }

    // ② 초록 「AI 자동 정리」 카드 — 이름·배지·설명
    if (갈래.카드) {
      const 이름 = [...document.querySelectorAll('span')].find((s) => (s.textContent || '').trim() === 'AI 자동 정리')
      if (이름) {
        이름.textContent = 갈래.카드.제목
        const 배지 = 이름.nextElementSibling
        if (배지) { if (갈래.카드.배지) 배지.textContent = 갈래.카드.배지; else 배지.remove() }
        const 설명 = 이름.parentElement?.nextElementSibling
        if (설명) 설명.textContent = 갈래.카드.설명
      }
    }

    // ③ 편집 화면 캡처 안내 «첫 줄»
    if (갈래.안내) {
      const 카드 = [...document.querySelectorAll('div')]
        .find((d) => (d.textContent || '').trim().startsWith('캡처는 이렇게 채워요'))
      if (카드) {
        const 줄들 = [...카드.children].filter((c) => c.tagName === 'DIV' && c.querySelector('b'))
        if (줄들.length) {
          const 줄 = 줄들[0]
          const 점 = 줄.firstElementChild
          const 글 = 줄.lastElementChild
          if (갈래.안내.빨강 && 점) 점.style.background = R
          if (글) {
            글.innerHTML = ''
            const bb = document.createElement('b')
            bb.textContent = 갈래.안내.앞
            bb.style.cssText = `color:${R};font-weight:900;`
            글.append(bb, document.createTextNode(갈래.안내.뒤))
            if (갈래.안내.빨강) 줄.style.color = R
          }
        }
      }
    }
  }
}

const 잰값 = []
const 찍기 = async (page, 찾기, 이름) => {
  const box = await page.evaluate(찾기)
  if (!box) return false
  const buf = await page.screenshot({ clip: box })
  writeFileSync(join(OUT, `${이름}.png`), buf)
  return true
}

for (const 테마 of 테마들) {
  for (const g of 갈래) {
    if (테마.키 !== 'greige' && g.키 === 'a') continue

    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const 에러 = []
    page.on('pageerror', (e) => 에러.push(String(e.message).split('\n')[0]))
    await page.addInitScript(SEED_COACH_SEEN)
    await page.addInitScript((t) => {
      try {
        localStorage.setItem('hankki:onboarded', '1')
        if (t !== 'greige') localStorage.setItem('hankki-theme', t)   // ⛔ 키는 하이픈 (theme.js:15)
      } catch { /* noop */ }
    }, 테마.키)
    await page.goto('http://127.0.0.1:4402/hankki/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)

    // ── 화면 1) 가져오기 ──
    await page.getByRole('button', { name: '가져오기' }).first().click()
    await page.waitForTimeout(800)
    await page.evaluate(바꾸기(g), g)
    await page.waitForTimeout(250)
    await 찍기(page, () => {
      const t = [...document.querySelectorAll('div')].find((d) => /무료 AI 스캔/.test(d.textContent || '') && d.clientHeight < 200)
      const c = [...document.querySelectorAll('span')].find((s) => /자동 정리|자동으로 채워/.test((s.textContent || '').trim()))?.closest('button')
      if (!t) return null
      const a = t.getBoundingClientRect(), z = c?.getBoundingClientRect()
      const top = Math.max(0, a.top - 12)
      const bot = Math.min(844, (z ? z.bottom : a.bottom) + 12)
      return { x: 8, y: top, width: 374, height: Math.max(60, bot - top) }
    }, `${테마.키}-${g.키}-가져오기`)

    // ── 화면 2) 편집(캡처 안내) ──
    await page.getByText('직접 작성', { exact: false }).first().click()
    await page.waitForTimeout(900)
    await page.evaluate(바꾸기(g), g)
    await page.waitForTimeout(250)
    await 찍기(page, () => {
      const c = [...document.querySelectorAll('div')].find((d) => (d.textContent || '').trim().startsWith('캡처는 이렇게 채워요'))
      if (!c) return null
      const r = c.getBoundingClientRect()
      return { x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 12), width: Math.min(390, r.width + 24), height: r.height + 24 }
    }, `${테마.키}-${g.키}-편집`)

    // 🔢 빨강이 실제로 읽히나 — 눈이 아니라 대비가 답한다
    const v = await page.evaluate(() => {
      const L = (c) => { const m = c.match(/[\d.]+/g).map(Number); const [r, g2, bb] = m.slice(0, 3).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g2 + 0.0722 * bb }
      const 비 = (p, q) => { const [x, y] = [L(p), L(q)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2) }
      const 불투명 = (c) => { const m = c?.match(/[\d.]+/g); return m && (m.length < 4 || parseFloat(m[3]) > 0.95) }
      const 카드 = [...document.querySelectorAll('div')].find((d) => (d.textContent || '').trim().startsWith('캡처는 이렇게 채워요'))
      const 강조 = 카드?.querySelector('b')
      if (!강조) return null
      let 뒤 = null, e = 강조
      while (e && !뒤) { const c = getComputedStyle(e).backgroundColor; if (c && 불투명(c)) 뒤 = c; e = e.parentElement }
      return { 대비: 비(getComputedStyle(강조).color, 뒤) }
    })
    잰값.push({ 테마: 테마.이름, 갈래: g.이름, 대비: v?.대비 ?? null, 에러: 에러.length })
    console.log(`  ✅ ${테마.이름} / ${g.이름}  대비 ${v?.대비 ?? '?'}${에러.length ? ' ⛔pageerror' : ''}`)
    await page.close()
  }
}

await b.close(); srv.close()
console.log('\n──── 잰 값 ────')
잰값.forEach((r) => console.log(`  ${r.테마} · ${r.갈래}`.padEnd(46), `대비 ${r.대비}`, r.에러 ? '⛔에러' : ''))
writeFileSync(join(OUT, '_잰값.json'), JSON.stringify({ 갈래, 잰값 }, null, 2))
console.log(`\n📁 ${OUT}`)

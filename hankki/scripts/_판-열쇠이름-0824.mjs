// 🔑🏷 「AI 크레딧」 새 이름 후보 — 실물 앱 화면에 «글자만» 갈아끼워 찍는다 (2026-08-24) 〔판정 대기〕
//
// 📮 창업자 = *"레시피열쇠 꽤 괜찮아. 지금까지 나온 것 중에서는 상위권으로 두고 싶어."*
//    ＋ *"다만 바로 확정하기보다는 레시피열쇠와 «비슷한 결»의 이름을 10개 정도 더 찾아보고 결정하는 걸 추천해."*
//
// ⭐ 창업자가 준 잣대 (그대로 옮긴다)
//    · 「콩/별/방울」 같은 **귀여운 재화는 아니다**
//    · **AI 가 무언가를 해주는 기능을 은유**하면서
//    · **실제 물건이라 1개·2개로 셀 수 있는** 이름
//    · 「열쇠처럼 «의미가 있는» 물건 위주」
//    · 좁은 자리에선 **줄여 쓸 수 있어야** 한다(레시피열쇠 → 열쇠)
//
// ⛔ 앱에서 «이미 쓰는 말»과 겹치면 탈락 — 「my pick」이 장보기 「이번 주 픽」과 겹쳐 접힌 전례가 있다.
//    🔢 실측(2026-08-24) = **돋보기 ⛔**(「우측 상단 돋보기로 검색해요」) · **바구니 ⛔**(장바구니 145곳)
//       · 자석 ⚠️(꾸미기 「각도 자석」) · 열쇠·국자·티켓·봉투 ✅(스티커 이름·주석뿐이라 화면엔 없다)
//
// ⭐ 이 판이 하는 일 = **가져오기 화면의 잔량 줄**에 이름만 갈아끼워 찍는다.
//    그 줄이 유저가 이 이름을 «제일 자주 보는» 자리다(`ImportScreen.jsx:165`).
//    ⛔ 소스를 안 고친다 — 화면 글자만 바꿔 찍으므로 «지금 앱 그대로»에 얹힌다(절대원칙 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-열쇠이름-0824.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/열쇠이름'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')

// [키, 정식이름, 세는말, 이모지, 은유, 걸리는 것]
const 후보 = [
  ['01', '레시피열쇠', '개', '🔑', '연다 — 콘텐츠 속 레시피를 열어준다', '지금 안'],
  ['02', '레시피필름', '장', '🎞', '찍은 것을 현상한다 — 사진·영상 둘 다 맞는다', '필름을 모르는 유저'],
  ['03', '레시피국자', '개', '🥄', '퍼온다 — 한끼다움이 제일 강하다', '「가져오기」와 한 단계 멀다'],
  ['04', '레시피가위', '개', '✂️', '오려온다 — 스크랩', '앱에 「가위표」가 있다'],
  ['05', '레시피티켓', '장', '🎫', '이용권 — 누구나 안다', '흔하다 · 감성이 약하다'],
  ['06', '레시피등불', '개', '🔦', '비춰서 읽는다', '「등불 1개」가 어색'],
  ['07', '레시피따개', '개', '🥫', '연다 — 캔따개', '낯설다'],
  ['08', '레시피종', '개', '🔔', '부르면 온다', '뜻이 흐리다'],
  ['09', '레시피지팡이', '개', '🪄', '마법', 'AI 은유로 흔하다'],
  ['10', '레시피자석', '개', '🧲', '끌어온다', '⚠️꾸미기 「각도 자석」과 겹침'],
]

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4418, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4418/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

// 📥 가져오기 탭 — 잔량 줄이 여기 있다
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('가져오기'))
  t?.click()
})
await page.waitForTimeout(1300)

const 있나 = await page.evaluate(() => /AI 스캔/.test(document.body.innerText || ''))
if (!있나) { console.log('⛔ 가져오기 화면에서 「AI 스캔」 글자를 못 찾았다 — 판을 못 만든다'); await b.close(); srv.close(); process.exit(1) }

const 잰값 = []
for (const [키, 이름, 세는말, 이모지, 은유, 흠] of 후보) {
  // ⭐ 화면에 그려진 글자만 갈아끼운다 — 만드는 코드는 손 안 댄다
  const r = await page.evaluate(({ 이름, 세는말 }) => {
    // ⛔⛔ 텍스트 노드 «하나»만 봐서는 큰 줄의 「20회」를 영영 못 바꾼다.
    //    `ImportScreen.jsx:165` = `{ocrLeft.total}회` 라 React 가 「20」과 「회」를 **다른 노드**로 그린다.
    //    (2026-08-24 실측 — 작은 줄 「…드리는 20회예요」는 한 노드라 바뀌는데 큰 줄만 안 바뀌었다)
    // ✅ 그래서 텍스트 노드를 «문서 순서대로» 모아 «앞 노드»까지 같이 본다.
    const 노드 = []
    const 걷기 = (n) => {
      if (n.nodeType === 3) { 노드.push(n); return }
      for (const c of [...n.childNodes]) 걷기(c)
    }
    걷기(document.body)

    let 바뀜 = 0
    노드.forEach((n, i) => {
      const t = n.textContent
      let v = t
      if (v.includes('AI 스캔')) v = v.replace(/무료 AI 스캔/g, `무료 ${이름}`).replace(/AI 스캔/g, 이름)
      // ⑴ 한 노드 안에 「20회」가 다 있는 경우 (작은 줄)
      if (/\d\s*회/.test(v)) v = v.replace(/(\d)\s*회/g, `$1${세는말}`)
      // ⑵ 「회」만 홀로 있고 «앞 노드»가 숫자로 끝나는 경우 (큰 줄 — 이것 때문에 한 판을 헛으로 찍었다)
      else if (/^\s*회/.test(v) && i > 0 && /\d\s*$/.test(노드[i - 1].textContent)) {
        v = v.replace(/^(\s*)회/, `$1${세는말}`)
      }
      if (v !== t) { n.textContent = v; 바뀜++ }
    })

    const el = [...document.querySelectorAll('div')].find((x) => (x.innerText || '').includes(이름))
    // ⭐ 「회」가 한 글자도 안 남았나 — 이게 이 판의 심장이다(⛔「바꿨다」가 아니라 「안 남았다」)
    const 남은회 = (document.body.innerText.match(/\d\s*회/g) || []).length
      + (document.body.innerText.match(/무료 \d+회/g) || []).length
    return { 바뀜, 남은회, 줄: el ? (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60) : '' }
  }, { 이름, 세는말 })
  await page.waitForTimeout(200)
  await page.screenshot({ path: join(OUT, `${키}.png`), clip: { x: 0, y: 96, width: 390, height: 205 } })
  잰값.push({ 키, 이름, 세는말, 이모지, 바뀐곳: r.바뀜, 남은회: r.남은회, 줄: r.줄, 은유, 흠 })
  // 되돌린다 — 다음 후보를 «같은 바탕»에 얹기 위해
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('가져오기'))
    t?.click()
  })
  await page.waitForTimeout(1100)
}
console.table(잰값.map(({ 키, 이름, 세는말, 바뀐곳, 남은회, 줄 }) => ({ 키, 이름, 세는말, 바뀐곳, 남은회, 줄: 줄.slice(0, 34) })))
const 샌것 = 잰값.filter((v) => v.남은회 > 0)
console.log(샌것.length ? `⛔ 「회」가 남은 판 ${샌것.length}개 — ${샌것.map((v) => v.키).join(',')}` : '✅ 열 판 모두 「회」가 한 글자도 안 남았다')
console.log(`📁 ${OUT}`)
await b.close(); srv.close()

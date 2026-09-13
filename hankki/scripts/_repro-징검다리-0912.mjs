// 🔗📊 [2026-09-12] 「징검다리」가 진짜로 세나 — 실제로 열어서 잰다
//
// 📮 창업자 = *"이게 되는지 알면 인스타로 계속 사람몇명왔다 셀때 나한테 말했어야지"*
//
// ⛔ 구글 태그 스크립트를 막고 dataLayer 를 읽는다(밖으로 한 건도 안 나간다).
// ⛔⛔ serviceWorkers: 'block' — SW 가 fetch 를 가로채면 route 가 한 건도 못 잡는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4491, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🔗 징검다리를 열고, 그때 나간 이름들과 «어디로 갔나»를 돌려준다.
//    단추누를까 = 자동 이동을 기다리지 않고 유저가 먼저 누른 상황
async function 열어본다({ 단추누를까 = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR', serviceWorkers: 'block' })
  // ⛔⛔ 스토어로 «진짜» 넘어가면 그 순간 window 가 새로 나서 dataLayer 가 통째로 사라진다.
  //    → 「갔다」를 보내놓고도 못 읽는다(처음 판이 그래서 0건이 나왔다).
  //    ⭐ 그래서 이동을 «막고», 대신 «가려고 했는가»를 기록한다. 페이지는 그대로 남아 읽을 수 있다.
  const 가려한주소 = []
  await ctx.route('**://play.google.com/**', (r) => { 가려한주소.push(r.request().url()); r.abort() })
  await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
  await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
  // ⛔⛔⛔ 여기가 이 재현판에서 제일 어려웠던 자리 —
  //    「갔다」는 스토어로 넘어가는 «바로 그 순간» 나간다. 그런데 넘어가면 window 가 새로 나서
  //    dataLayer 가 통째로 사라진다(이동을 막아도 오류 페이지로 갈아타며 똑같이 사라진다).
  //    ⭐ 그래서 dataLayer 를 «나중에 읽지» 않고, 담길 때마다 console 로 흘려보낸다.
  //       console 은 우리 쪽(테스트 프로세스)에 쌓이니까 페이지가 죽어도 안 잃는다.
  const p = await ctx.newPage()
  const 이름들 = []
  await p.addInitScript(() => {
    window.dataLayer = window.dataLayer || []
    const 원래 = window.dataLayer.push.bind(window.dataLayer)
    window.dataLayer.push = function (...칸) {
      try {
        for (const a of 칸) {
          const 줄 = [...a]
          if (줄[0] === 'event' && 줄[1] === 'page_view') console.log('재현판:' + 줄[2]?.page_title)
        }
      } catch { /* noop */ }
      return 원래(...칸)
    }
  })
  p.on('console', (m) => { const t = m.text(); if (t.startsWith('재현판:')) 이름들.push(t.slice(4)) })
  await p.goto('http://127.0.0.1:4491/hankki/get.html', { waitUntil: 'domcontentloaded' })
  const 링크 = await p.getAttribute('#go', 'href')
  if (단추누를까) await p.click('#go')
  // 자동 이동(1.2초) ＋ gtag 실패 감지까지 넉넉히
  await p.waitForTimeout(3500)
  await ctx.close()
  return { 이름들, 링크, 가려한주소 }
}

console.log('\n🔗 징검다리\n')

// ── ① 그냥 열었을 때 — 「왔다」 ＋ 자동으로 「갔다」
{
  const { 이름들, 링크, 가려한주소 } = await 열어본다()
  잰다(이름들.filter((n) => n === 'bridge').length === 1, '① 「왔다」(bridge)가 «한 번» 나간다', JSON.stringify(이름들))
  잰다(이름들.filter((n) => n === 'bridge_go').length === 1, '① ⭐자동 이동이어도 「갔다」(bridge_go)가 «한 번» 나간다')
  // ⭐ 여기가 제일 위험한 자리 — gtag 가 못 붙었는데도 계측이 살아 있나
  잰다(이름들.length === 2, '① ⛔gtag 가 못 붙어도(막았다) 두 건이 «다» 쌓인다 — 안 그러면 통째로 날아간다', `${이름들.length}건`)
  잰다(가려한주소.some((u) => /play\.google\.com/.test(u)), '① 그러고도 스토어로 «간다» — 계측이 길을 막지 않는다', 가려한주소[0] || '(안 갔다)')
  잰다(/[?&]referrer=utm_source%3Dhankki_bridge/.test(링크 || ''), '① 🏷️단추에 꼬리표(referrer)가 달려 있다 — Play 콘솔이 센다')
  잰다(/id=io\.github\.peachfam0307_glitch\.twa/.test(링크 || ''), '① 꼬리표를 달아도 앱 id 는 그대로다(엉뚱한 앱으로 안 간다)')
}

// ── ② ⭐⭐ 유저가 «먼저 눌러도» 두 번 안 세진다
//    ⛔ 이게 없으면 「갔다」가 부풀어서 «프로필→스토어» 비율이 거짓이 된다.
{
  const { 이름들 } = await 열어본다({ 단추누를까: true })
  const 셈 = 이름들.filter((n) => n === 'bridge_go').length
  잰다(셈 === 1, '② ⭐단추를 누른 뒤 자동 이동도 걸리지만 「갔다」는 «한 번»만', `${셈}번`)
}

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 징검다리 통과')
process.exit(나쁨 ? 1 : 0)

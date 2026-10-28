// 🔁🔁 [2026-09-12] 「다시 왔나」가 진짜로 나가나 — 앱을 돌려서 잰다
//
// 📮 창업자 = *"ㅇㅇ b로 심어줘"*
//
// ⛔ 왜 우리가 재나 = Firebase 「로그인 날짜」는 «재로그인»할 때만 갱신돼서 못 쓴다
//    (창업자 2026-09-12 = "앱을 켤때마다 로그인 새로하는 사람은 없잖아").
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
await new Promise((r) => srv.listen(4489, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🔁 한 번 열어 보고, 그때 나간 이름들을 돌려준다.
//    지난날 = localStorage 에 미리 넣어 둘 「지난번 연 날」(null 이면 안 넣는다)
async function 열어본다(지난날, { 두번열까 = false, 통계끔 = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR', serviceWorkers: 'block' })
  await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
  await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
  await ctx.addInitScript(([지난날, 통계끔]) => {
    try {
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      localStorage.setItem('hankki:onboarded', '1')
      if (지난날) localStorage.setItem('hankki:lastOpen', 지난날)
      if (통계끔) localStorage.setItem('hankki:stats:off', '1')
    } catch { /* noop */ }
  }, [지난날, 통계끔])
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4489/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(3000)
  if (두번열까) { await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(3000) }
  const 이름들 = await p.evaluate(() => [...(window.dataLayer || [])]
    // ⛔ dataLayer 에는 «배열이 아닌 것»도 들어온다(GTM 의 { 'gtm.start': … }) — 펼치면 죽는다
    .filter((a) => a && typeof a.length === 'number')
    .map((a) => [...a])
    .filter((a) => a[0] === 'event' && a[1] === 'page_view')
    .map((a) => a[2]?.page_title))
  const 적힌날 = await p.evaluate(() => { try { return localStorage.getItem('hankki:lastOpen') } catch { return null } })
  await ctx.close()
  return { 이름들, 적힌날 }
}

// 📅 앱과 «같은» 잣대로 날짜를 만든다 — 손으로 계산하면 잣대가 갈린다(절대원칙 30)
const { todayKST } = await import(join(ROOT, 'src/today.js'))
const 오늘 = todayKST()
const 며칠전 = (n) => {
  const d = new Date(Date.parse(`${오늘}T00:00:00Z`) - n * 86400000)
  return d.toISOString().slice(0, 10)
}

console.log('\n🔁 다시 왔나\n')

// ── ① 처음 연 사람
{
  const { 이름들, 적힌날 } = await 열어본다(null)
  잰다(이름들.includes('first_open'), '① 처음이면 first_open 이 나간다', JSON.stringify(이름들))
  잰다(적힌날 === 오늘, '① 오늘 날짜가 적힌다', String(적힌날))
}

// ── ② 바로 다음 날 ⭐ 제일 중요한 값
{
  const { 이름들 } = await 열어본다(며칠전(1))
  잰다(이름들.includes('return_d1'), '② ⭐어제 왔다 오늘 또 오면 return_d1', JSON.stringify(이름들))
  잰다(!이름들.includes('first_open'), '② first_open 은 «안» 나간다')
}

// ── ③ 2~7일 · 8일 넘어
{
  const a = await 열어본다(며칠전(5))
  잰다(a.이름들.includes('return_d2_7'), '③ 5일 만이면 return_d2_7', JSON.stringify(a.이름들))
  const c = await 열어본다(며칠전(30))
  잰다(c.이름들.includes('return_d8plus'), '③ 30일 만이면 return_d8plus', JSON.stringify(c.이름들))
}

// ── ④ ⭐⭐ 같은 날 두 번 켜도 «한 번»만
//    ⛔ 이게 없으면 하루에 앱을 여러 번 켜는 사람이 여러 명처럼 세진다.
{
  const { 이름들 } = await 열어본다(며칠전(1), { 두번열까: true })
  const 셈 = 이름들.filter((n) => n === 'return_d1').length
  잰다(셈 === 1, '④ ⭐같은 날 두 번 켜도 «한 번»만 나간다', `${셈}번`)
}

// ── ⑤ 날짜가 «뒤로» 갔을 때 — 폰 시계를 바꿨거나 시차를 거슬렀다
//    ⛔ 지어내지 않고 «아무것도 안 보낸다». (절대원칙 34 — 모르면 침묵)
{
  const 내일 = (() => { const d = new Date(Date.parse(`${오늘}T00:00:00Z`) + 86400000); return d.toISOString().slice(0, 10) })()
  const { 이름들 } = await 열어본다(내일)
  const 다시옴 = 이름들.filter((n) => /^(first_open|return_)/.test(n || ''))
  잰다(다시옴.length === 0, '⑤ 지난날이 «미래»면 아무것도 안 보낸다(지어내지 않는다)', JSON.stringify(다시옴))
}

// ── ⑥ 저장값이 깨졌으면 처음으로 본다
{
  const { 이름들 } = await 열어본다('망가진값')
  잰다(이름들.includes('first_open'), '⑥ 저장값이 날짜 모양이 아니면 first_open', JSON.stringify(이름들))
}

// ── ⑦ 🔕 통계를 끈 사람에겐 아무 일도 안 난다
{
  const { 이름들, 적힌날 } = await 열어본다(며칠전(1), { 통계끔: true })
  잰다(이름들.length === 0, '⑦ 통계를 끄면 한 건도 안 나간다', JSON.stringify(이름들))
  잰다(적힌날 === 며칠전(1), '⑦ 끈 사람의 날짜는 «안 건드린다»(나중에 켜도 맞게 센다)', String(적힌날))
}

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 다시 왔나 통과')
process.exit(나쁨 ? 1 : 0)

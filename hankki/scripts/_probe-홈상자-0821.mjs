// 📏 [2026-08-21] 홈 «윗부분»의 상자들을 잰다 — 키·여백·성격
//
// 📮 창업자 = *"**위에 높이가 낮은 상자들이 몰려있으니까 지저분해 보이지 않아? 눈에도 잘 안들어오고**"*
//    ＋ *"소식, 안해봤어요. 뭐해먹기 «사이도» 여백이 조금씩 있었음 좋겠어"* ＋ *"다닥다닥 붙어있어서"*
//
// ⭐ 「지저분하다」를 숫자로 바꾼다 — **키가 비슷한 상자가 몇 개 연달아 붙어 있나.**
//    ⛔ 눈으로만 보면 「좀 답답하네」에서 멈춘다. 재면 «무엇을 고칠지»가 나온다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-홈상자-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4436, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4436/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)

const 표 = await p.evaluate(() => {
  const 판 = document.querySelector('.pad')
  if (!판) return []
  const 것 = []
  let 앞바닥 = null
  // ⭐⭐ 한 겹 더 들어간다 — `.pad` 의 자식 하나가 «묶음»(`.home-pair`)이고
  //    창업자가 말한 「키 낮은 상자들」은 그 «안»에 들어 있다.
  //    ⛔ 첫 판이 겉만 재서 「연달아 2개」로 나왔다. 실제로는 묶음 안에 셋이 있다.
  const 칸들 = []
  for (const el of 판.children) {
    const 속 = [...el.children]
    const 투명 = getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)'
    if (투명 && 속.length > 1 && el.getBoundingClientRect().height < 400) 칸들.push(...속)
    else 칸들.push(el)
  }
  for (const el of 칸들) {
    const r = el.getBoundingClientRect()
    if (r.height < 6) continue
    const 글 = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 22)
    const cs = getComputedStyle(el)
    것.push({
      글, 키: Math.round(r.height), 틈: 앞바닥 === null ? null : Math.round(r.top - 앞바닥),
      바탕: cs.backgroundColor, 클래스: (el.className || '').toString().slice(0, 24),
    })
    앞바닥 = r.bottom
  }
  return 것
})

console.log('\n📏 홈 윗부분 상자 — 390×844\n')
console.log('   키    틈    바탕                     내용')
표.forEach((t) => {
  console.log(`  ${String(t.키).padStart(4)}  ${String(t.틈 ?? '—').padStart(4)}  ${t.바탕.padEnd(24, ' ')} ${t.글}`)
})

// ⭐ 「키가 비슷한 상자가 몇 개 연달아 붙어 있나」 = 눈이 미끄러지는 이유
const 낮은것 = 표.filter((t) => t.키 <= 110)
let 연달아 = 0, 최다 = 0
표.forEach((t) => { if (t.키 <= 110) { 연달아++; 최다 = Math.max(최다, 연달아) } else 연달아 = 0 })
console.log(`\n  🔢 키 110px 이하 상자 = ${낮은것.length}개 · 그중 «연달아» 붙은 것 = 최대 ${최다}개`)
console.log(`  🔢 상자 사이 틈 = ${[...new Set(표.map((t) => t.틈).filter((x) => x != null))].sort((a, b) => a - b).join(' · ')}px`)
console.log('\n⭐ 읽는 법')
console.log('   · 키가 «비슷한» 상자가 셋 이상 연달으면 눈이 하나씩 세지 않고 «한 덩어리»로 본다')
console.log('   · 그때 답은 여백만이 아니다 — ⑴합치거나 ⑵키를 다르게 하거나 ⑶성격이 다른 것을 떼어 놓는다')

await b.close(); srv.close()

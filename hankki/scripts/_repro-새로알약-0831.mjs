// 🔵 「홈 «새로» 알약 — 읽으면 꺼지고, 새것이 오면 다시 뜬다」 재현판 (smoke)
//
// ✅ 창업자 확정 2026-08-31 = 시안 넷 중 **㉣ 둘 다** (*"ㄹ하자"*) — 주황 ＋ 읽으면 꺼짐
//    📮 그 앞 = *"한끼소식에 알약은 색을 다르게 하거나, 새로 올라온게 있으면 표시가 있으면 좋겠어."*
//    📮 자리 되물음 = *"내가 말한건 **홈화면세 한끼소식 (새로)알약**"*
//
// ⭐⭐ **이 판의 심장 = ④ 「새것이 오면 다시 뜨나」.**
//    ①②만 재면 「그냥 한 번 꺼지고 영영 안 뜨는 것」도 통과한다 — 그건 고친 게 아니라 없앤 것이다.
// ⭐ **「저장됐나」를 본다(③), 「껐나」가 아니라** — v11.00 에서 `addShopItem` 이 필드를 골라 새 객체를 만드는 바람에
//    값을 넘기고도 말없이 버려졌고 그때 게이트 50개가 전부 초록불이었다.
// ⛔ 소스를 grep 하지 않는다 — **화면에 그려진 것**과 **localStorage 에 진짜로 들어간 값**을 본다(규칙 18 ⓘ·30).
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-새로알약-0831.mjs
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

let 통과 = 0, 죽음 = 0
const 칸 = (이름, 됐나, 덧말 = '') => {
  if (됐나) { 통과++; console.log(`  ✅ ${이름}${덧말 ? ` — ${덧말}` : ''}`) }
  else { 죽음++; console.log(`  ⛔ ${이름}${덧말 ? ` — ${덧말}` : ''}`) }
}

// 홈에 그려진 「새로」 알약을 «소식 카드 안»에서 찾는다 — ⛔글자로만 찾으면 딴 화면 잔재를 집는다.
const 알약보기 = () => {
  const card = document.querySelector('button.news-card')
  if (!card) return { 카드: false }
  const el = [...card.querySelectorAll('span')].find((s) => s.innerText.trim() === '새로')
  // ⛔⛔ **글자만으로 찾으면 「투명한 겉 상자」를 집는다** — 첫 판이 그랬고,
  //    `rgba(0,0,0,0) !== 주황` 이라 **초록불이 났는데 아무것도 안 잰 것**이었다(규칙 18 ⓘ).
  //    ✅ 그래서 「채워진 ＋ 둥근」 것만 고른다 = 진짜 알약.
  const 딴알약 = [...document.querySelectorAll('.screen span, .screen div')].find((e) => {
    if (!e.innerText || e.innerText.trim() !== '아직 안 해봤어요') return false
    const c = getComputedStyle(e); const r = e.getBoundingClientRect()
    const 채움 = c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent'
    return 채움 && parseFloat(c.borderRadius) >= r.height / 2
  })
  return {
    카드: true, 있나: !!el,
    바탕: el ? getComputedStyle(el).backgroundColor : null,
    글자: el ? getComputedStyle(el).color : null,
    선물색: getComputedStyle(document.documentElement).getPropertyValue('--gift').trim(),
    딴알약바탕: 딴알약 ? getComputedStyle(딴알약).backgroundColor : null,
    저장된서명: (() => { try { return localStorage.getItem('hankki:news:seen') } catch { return '⛔못읽음' } })(),
    부제: card.querySelector('.news-sub')?.innerText.trim() || '',
  }
}

const 열기 = async (ctx) => {
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1100)
  // 새 소식 팝업이 홈을 덮는다 — ⛔Escape 로는 안 닫힌다(`useModalBack` 은 뒤로가기를 쓴다).
  //    ⚠️ 여기서 「닫기」를 누르면 «봤음»으로 쳐진다 — 그게 실제 앱 동작이라 그대로 둔다(칸 ⑤가 그걸 잰다).
  return p
}
const 팝업닫기 = async (p) => {
  if (await p.locator('.sheet-mask').count()) {
    await p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click().catch(() => {})
    await p.waitForTimeout(500)
  }
}

// 🎨 색을 «이름»이 아니라 실제 픽셀로 견준다 — `--gift` 를 딴 데 박아도 잡히게.
const 같은색 = (rgb, hex) => {
  if (!rgb || !hex) return false
  const a = (rgb.match(/\d+/g) || []).slice(0, 3).map(Number)
  const h = hex.replace('#', '')
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return a.length === 3 && a.every((v, i) => Math.abs(v - c[i]) <= 2)
}

const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* 화면은 돈다 */ } })
await ctx.clock.setFixedTime(new Date('2026-08-31T03:00:00Z'))   // 12:00 KST

console.log('\n① 처음 켠 사람 — 「새로」가 뜨고, 색이 선물 주황인가')
let p = await 열기(ctx)
let v = await p.evaluate(알약보기)
칸('소식 카드가 있다', v.카드)
칸('「새로」가 뜬다', v.있나, v.부제)
칸('색 = --gift', 같은색(v.바탕, v.선물색), `${v.바탕} (--gift ${v.선물색})`)
// ⛔ 「딴알약을 못 찾았다」를 «통과»로 세지 않는다 — 못 찾으면 견줄 수가 없으니 실패다.
칸('「아직 안 해봤어요」 알약을 찾았다', !!v.딴알약바탕, String(v.딴알약바탕))
칸('그 알약과 색이 다르다', !!v.딴알약바탕 && v.바탕 !== v.딴알약바탕, `새로 ${v.바탕} ↔ 딴알약 ${v.딴알약바탕}`)
await 팝업닫기(p)

console.log('\n② 소식을 열어 보면 그 자리에서 꺼진다')
await p.locator('button.news-card').first().click()
await p.waitForTimeout(900)
// 소식 시트를 닫고 홈으로
await p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click().catch(async () => { await p.goBack() })
await p.waitForTimeout(700)
v = await p.evaluate(알약보기)
칸('「새로」가 사라졌다', !v.있나)
칸('소식 카드는 그대로 있다', v.카드, v.부제)

console.log('\n③ 앱을 껐다 켜도 안 뜬다 — «저장»됐나')
await p.close()
p = await 열기(ctx)
v = await p.evaluate(알약보기)
칸('다시 켜도 「새로」가 없다', !v.있나)
칸('본 서명이 저장돼 있다', !!v.저장된서명 && v.저장된서명 !== '⛔못읽음', `"${String(v.저장된서명).slice(0, 46)}…"`)
const 옛서명 = v.저장된서명

console.log('\n④ ⭐새 소식이 오면 «다시» 뜬다  (8/31 → 9/1)')
await ctx.clock.setFixedTime(new Date('2026-09-01T03:00:00Z'))
await p.close()
p = await 열기(ctx)
v = await p.evaluate(알약보기)
칸('9/1 소식이 8/31 과 다르다', v.부제 !== '' && v.저장된서명 === 옛서명, `부제 "${v.부제}"`)
칸('「새로」가 다시 뜬다', v.있나)
칸('다시 뜬 색도 --gift', 같은색(v.바탕, v.선물색), String(v.바탕))

console.log('\n⑤ 팝업을 닫아도 «봤음»이 된다 (팝업과 열쇠가 하나다)')
await 팝업닫기(p)
await p.waitForTimeout(400)
v = await p.evaluate(알약보기)
칸('팝업을 닫으니 「새로」도 꺼졌다', !v.있나)
칸('서명이 9/1 것으로 갱신됐다', v.저장된서명 !== 옛서명, `"${String(v.저장된서명).slice(0, 46)}…"`)

await ctx.close()
await b.close(); srv.close()
console.log(`\n${죽음 ? '⛔' : '✅'} ${통과}/${통과 + 죽음} 통과`)
process.exit(죽음 ? 1 : 0)

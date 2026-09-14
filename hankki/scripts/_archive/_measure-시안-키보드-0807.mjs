// ⌨️ 「프레임·글자쓰기·포스트잇에도 D 가 맞나?」 (창업자 2026-08-07)
//   ⛔ 앞 판(_measure-시안-0807)은 «스티커 붙이기» 하나만 쟀다. 글자·포스트잇은 **키보드가 뜨는 일**이라
//      조건이 다르다 — D 는 도구가 «맨 아래»라 키보드와 정면으로 만난다.
//   👉 지금 앱에서 «키보드가 떴을 때» 무엇이 어디로 가는지부터 잰다. 그 위에서 판단한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4444, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 360, height: 780 } })
const page = await ctx.newPage()
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [{ id: 'n1', type: 'note', key: 'butter', text: '오늘 김치찌개', font: 'gaegu', x: 0.5, y: 0.45, s: 0.42, r: 0 }] }] })
await page.goto('http://127.0.0.1:4444/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)

const snap = async (label) => {
  const m = await page.evaluate(() => {
    const R = (e) => (e ? Math.round(e.getBoundingClientRect().height) : 0)
    const T = (e) => (e ? Math.round(e.getBoundingClientRect().top) : 0)
    const B = (e) => (e ? Math.round(e.getBoundingClientRect().bottom) : 0)
    const st = document.querySelector('.decor-stage')
    const ctx = document.querySelector('.decor-ctx')
    const dr = document.querySelector('.decor-drawer')
    const sc = document.querySelector('.decor-scroll')
    return {
      화면: window.innerHeight,
      종이: R(st), 종이바닥: B(st),
      컨텍스트바: R(ctx), 컨텍스트위치: ctx ? `${T(ctx)}~${B(ctx)}` : '없음',
      서랍: R(dr), 서랍위치: dr ? `${T(dr)}~${B(dr)}` : '없음',
      스크롤칸: R(sc),
      // 「글 쓸 때만 뜨는 줄」 — 글씨체·크기
      쓰기도구: [...document.querySelectorAll('.decor-drawer span')].filter((x) => ['글씨', '크기'].includes(x.textContent.trim())).length,
      화면밖: dr ? Math.max(0, B(dr) - window.innerHeight) : 0,
    }
  })
  console.log(`\n📐 ${label}`)
  console.log(`   화면 ${m.화면} · 종이 ${m.종이}(바닥 ${m.종이바닥}) · 컨텍스트바 ${m.컨텍스트바} [${m.컨텍스트위치}]`)
  console.log(`   서랍 ${m.서랍} [${m.서랍위치}] · 스크롤 칸 ${m.스크롤칸} · 쓰기도구 줄 ${m.쓰기도구}개 · 화면 밖 ${m.화면밖}px`)
  return m
}

console.log('═══ ① 그냥 (키보드 없음) ═══')
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(600)
const a1 = await snap('포스트잇 고른 상태')

console.log('\n═══ ② 포스트잇에 글 치는 중 (키보드 «전») ═══')
// ⛔ `.decor-stage textarea` 는 «속지 본문»도 잡는다 — 그건 종이 밑에 깔려 있어 클릭이 막힌다.
//    포스트잇 글칸은 그 아이템을 «한 번 더» 탭해야 열린다(onEditNote).
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(700)
const ta = page.locator('.decor-stage [style*="rotate"] textarea').first()
console.log('   ℹ️ 포스트잇 글칸 =', (await ta.count()) ? '열렸다' : '⛔ 안 열렸다')
const a2 = await snap('커서가 들어간 상태')

console.log('\n═══ ③ 키보드가 올라온 상태 (화면 780 → 390) ═══')
console.log('   ⚠️ 실제 폰에서 자판은 화면의 45~50% 를 먹는다 — 그걸 흉내낸다')
await page.setViewportSize({ width: 360, height: 390 })
await page.waitForTimeout(900)
const a3 = await snap('자판이 절반을 덮었을 때')

console.log('\n═══ 정리 ═══')
console.log(`   종이     ${a1.종이} → ${a2.종이} → ${a3.종이}px`)
console.log(`   컨텍스트바 ${a1.컨텍스트바} → ${a2.컨텍스트바} → ${a3.컨텍스트바}px`)
console.log(`   서랍     ${a1.서랍} → ${a2.서랍} → ${a3.서랍}px`)
console.log(`   스크롤 칸 ${a1.스크롤칸} → ${a2.스크롤칸} → ${a3.스크롤칸}px`)
if (a3.화면밖 > 0) console.log(`   ⛔ 자판이 뜨면 서랍이 화면 밖으로 ${a3.화면밖}px 밀린다`)
else console.log('   ✅ 자판이 떠도 서랍이 화면 안에 있다')

await b.close(); srv.close()

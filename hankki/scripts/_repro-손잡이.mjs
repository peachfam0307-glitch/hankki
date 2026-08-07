// 🔧 창업자 2026-08-07 *"이런거 상하좌우반전 넣어줄수있어? 돌리고 키우는거 잘안되서 불편"*
//
// ⛔ 「불편하다」는 느낌이다 — 고치려면 «무엇이 얼마나» 어긋나는지 숫자로 재야 한다(규칙 7).
// 재는 것 셋 —
//   ⓐ **크기만** 키우려고 손잡이를 똑바로 바깥으로 끌 때 **각도가 얼마나 딸려 도나**
//   ⓑ 작은 스티커일수록 심한가 (중심-손잡이 거리가 짧으면 같은 손떨림이 큰 각도가 된다)
//   ⓒ 손으로 **180°** 를 맞출 수 있나 (코너 장식을 아래 귀퉁이에 놓으려면 이게 필요하다)
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
await new Promise((r) => srv.listen(4406, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
})
await page.goto('http://127.0.0.1:4406/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)

// 창업자 화면과 같은 것 = 「코너」 그룹의 첫 컷
const sec = page.locator('.decor-sec').filter({ hasText: '코너' }).first()
const chip = (await sec.count()) ? sec.locator('img').first() : page.locator('.decor-drawer .decor-sec img').first()
await chip.click(); await page.waitForTimeout(700)

const val = () => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const d = (s.diary || []).find((x) => x.kind === 'diary')
  const it = (d?.decor || [])[0] || {}
  return { s: it.s, r: it.r || 0, flip: !!it.flip, flipY: !!it.flipY }
})
const box = async () => (await page.locator('.decor-stage .paper').first().boundingBox())

// 손잡이 = 선택된 아이템 우하단
const handle = page.getByRole('button', { name: '크기·회전' }).first()

console.log('\n── ⓐ 「크기만」 키우려 할 때 각도가 딸려 도나 ──')
{
  const before = await val()
  const h = await handle.boundingBox()
  const st = await box()
  const cx = h.x + h.width / 2, cy = h.y + h.height / 2
  // ⭐ 「똑바로 바깥으로」 = 중심에서 손잡이로 향하는 «그 방향 그대로» 더 멀리.
  //    사람 손은 이만큼 곧지도 않다 — 이게 «가장 잘 된 경우»다.
  await page.mouse.move(cx, cy); await page.mouse.down()
  for (let i = 1; i <= 6; i++) { await page.mouse.move(cx + i * 5, cy + i * 5); await page.waitForTimeout(40) }
  await page.mouse.up(); await page.waitForTimeout(500)
  const after = await val()
  const dr = Math.abs(after.r - before.r)
  console.log(`   ℹ️ 크기 ${before.s?.toFixed(3)} → ${after.s?.toFixed(3)} · 각도 ${before.r.toFixed(1)}° → ${after.r.toFixed(1)}°`)
  if (dr <= 1) ok(`똑바로 끌면 각도가 거의 안 돈다 (${dr.toFixed(1)}°)`)
  else no(`⭐ 크기만 키웠는데 각도가 ${dr.toFixed(1)}° 돌았다`)
}

console.log('\n── ⓑ 손가락이 살짝 빗나가면 (실제 손동작) ──')
{
  const before = await val()
  const h = await handle.boundingBox()
  const cx = h.x + h.width / 2, cy = h.y + h.height / 2
  // 바깥으로 끌되 **8px 옆으로** 빗나간다 — 폰에서 이 정도는 늘 생긴다
  await page.mouse.move(cx, cy); await page.mouse.down()
  for (let i = 1; i <= 6; i++) { await page.mouse.move(cx + i * 5 + 8, cy + i * 5 - 8); await page.waitForTimeout(40) }
  await page.mouse.up(); await page.waitForTimeout(500)
  const after = await val()
  const dr = Math.abs(after.r - before.r)
  console.log(`   ℹ️ 각도 ${before.r.toFixed(1)}° → ${after.r.toFixed(1)}°  (8px 빗나감)`)
  if (dr <= 3) ok(`살짝 빗나가도 각도는 ${dr.toFixed(1)}° 만 돈다`)
  else no(`⭐ 8px 빗나갔을 뿐인데 각도가 ${dr.toFixed(1)}° 돌았다 — 「돌리고 키우는 게 잘 안 된다」의 정체`)
}

console.log('\n── ⓒ 손으로 180° 를 맞출 수 있나 (아래 귀퉁이에 놓으려면 필요) ──')
{
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1'))
    const d = s.diary.find((x) => x.kind === 'diary'); d.decor[0].r = 0
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  })
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
  const stk = page.locator('.decor-stage .decor-item').first()
  if (await stk.count()) { await stk.click(); await page.waitForTimeout(600) }
  const h2 = page.getByRole('button', { name: '크기·회전' }).first()
  if (!(await h2.count())) { no('손잡이를 못 찾았다'); }
  else {
    const st = await box()
    const hb = await h2.boundingBox()
    const cx0 = st.x + st.width / 2, cy0 = st.y + st.height / 2   // 스티커 중심은 판 한가운데 근처
    const R = Math.hypot(hb.x + hb.width / 2 - cx0, hb.y + hb.height / 2 - cy0)
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down()
    // 반대편까지 «원을 그리며» 돈다 — 사람이 하는 그대로
    const a0 = Math.atan2(hb.y + hb.height / 2 - cy0, hb.x + hb.width / 2 - cx0)
    for (let i = 1; i <= 18; i++) {
      const a = a0 + (Math.PI * i) / 18
      await page.mouse.move(cx0 + R * Math.cos(a), cy0 + R * Math.sin(a)); await page.waitForTimeout(30)
    }
    await page.mouse.up(); await page.waitForTimeout(500)
    const after = await val()
    const off = Math.abs(((after.r % 360) + 360) % 360 - 180)
    console.log(`   ℹ️ 반 바퀴 돌린 결과 = ${after.r.toFixed(1)}° (180° 에서 ${off.toFixed(1)}° 어긋남) · 크기도 ${after.s?.toFixed(3)} 로 바뀜`)
    if (off <= 2) ok(`손으로도 180° 가 맞는다 (${off.toFixed(1)}° 차이)`)
    else no(`⭐ 반 바퀴 돌려도 ${off.toFixed(1)}° 어긋난다 — 코너를 아래 귀퉁이에 «정확히» 못 놓는다`)
  }
}

console.log('\n── ⓓ 상하 뒤집기가 있나 ──')
{
  const has = await page.locator('.decor-editor button').filter({ hasText: /^상하 뒤집기$/ }).count()
  if (has) ok('「상하 뒤집기」 단추가 있다')
  else no('⭐ 「상하 뒤집기」가 «없다» — 창업자 요청 그대로. 지금은 좌우(scaleX)뿐')
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)

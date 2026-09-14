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
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
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

// ⛔⛔ 2026-08-07 전수검사에서 잡음 — 이 검사는 «저장 안 한» 상태를 hankki:v1 에서 읽고 있었다.
//    거기엔 아무것도 없어서 크기·각도가 늘 undefined／0 이었고, 그래서 「각도가 안 돈다」가
//    **무슨 짓을 해도 통과**했다(실패할 줄 모르는 검사 = 없는 검사).
//    ⭐ 저장 전 값은 hankki:decorDraft:＜일기 id＞ 에 350ms 마다 쌓인다 — 거기서 읽는다.
//    ⚠️ 초안 키의 뒷부분은 «일기 id» 인데 일기는 날짜로 id 를 짓는다(hankki:decorDraft:diary-2026-7-7).
//       그래서 이름을 박지 않고 **decorDraft 로 시작하는 키를 찾아** 읽는다.
const val = () => page.evaluate(() => {
  const k = Object.keys(localStorage).find((x) => x.startsWith('hankki:decorDraft:'))
  const it = (k ? (JSON.parse(localStorage.getItem(k)).items || []) : [])[0] || {}
  return { s: it.s, r: it.r || 0, flip: !!it.flip, flipY: !!it.flipY }
})
const box = async () => (await page.locator('.decor-stage .paper').first().boundingBox())

// 손잡이 = 선택된 아이템 우하단
// ⚠️ 손잡이는 button 이 아니라 span 이다(포인터 이벤트만 받는다) → role 로 찾으면 영원히 못 찾는다.
const handle = page.locator('[aria-label="크기·회전"]').first()

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
  // 🧲 2026-08-07 문턱＋자석 — 크기만 끌면 문턱(6°) 덕에 각도가 «전혀» 안 돈다.
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
  // ⛔ 옛 판은 여기서 새로고침을 했다 — 저장 안 한 값을 hankki:v1 에서 고치려다 터졌고,
  //    새로고침 뒤 «홈»으로 돌아오는 것도 안 챙겨서 여기까지 온 적이 아예 없었다.
  // ⭐ 새로고침이 필요 없다 — 물을 것은 「0 에서 180 이 되나」가 아니라 **「반 바퀴 돌리면 180° 가 도나」**다.
  //    지금 각도를 재 두고 «움직인 만큼»을 본다. 판을 다시 세울 일이 없다.
  const 시작 = (await val()).r
  const h2 = page.locator('[aria-label="크기·회전"]').first()
  if (!(await h2.count())) { no('손잡이를 못 찾았다'); }
  else {
    // ⛔⛔ 옛 판은 «종이 한가운데»를 축으로 삼았다 — 스티커는 x 0.44 · y 0.345 라 «한가운데가 아니다».
    //    엉뚱한 축으로 원을 그리니 반 바퀴를 돌려도 각이 안 맞는다(첫 판 67° 어긋남 = 검사 탓).
    //    ⭐ 축은 «그 스티커의 한가운데»여야 한다 — 실제 상자에서 잰다.
    const sb = await page.locator('.decor-stage [style*="rotate"]').first().boundingBox()
    const hb = await h2.boundingBox()
    const cx0 = sb.x + sb.width / 2, cy0 = sb.y + sb.height / 2
    const R = Math.hypot(hb.x + hb.width / 2 - cx0, hb.y + hb.height / 2 - cy0)
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down()
    // ⭐ «사람처럼» 돌린다 — 조금씩 돌리며 화면의 «실제 각»을 읽고, 180° 근처(4° 안)에 오면 손을 뗀다.
    //    자석이 있으면 그 근처에서 정확히 180 에 붙고, 없으면(옛 코드) 어중간한 각이 남아 걸린다(규칙 12).
    //    ⛔ 「몇 도 돌리겠다」고 미리 겨냥하지 않는다 — 축 추정이 살짝만 어긋나도 목표를 놓친다(실제로 그랬다).
    const a0 = Math.atan2(hb.y + hb.height / 2 - cy0, hb.x + hb.width / 2 - cx0)
    const liveR = () => page.evaluate(() => {
      const el = document.querySelector('.decor-stage [style*="rotate"]')
      const m = /rotate\((-?[\d.]+)deg\)/.exec(el?.getAttribute('style') || '')
      return m ? parseFloat(m[1]) : NaN
    })
    for (let i = 1; i <= 90; i++) {
      const a = a0 + (Math.PI / 36) * i   // 5° 씩
      await page.mouse.move(cx0 + R * Math.cos(a), cy0 + R * Math.sin(a)); await page.waitForTimeout(25)
      const rNow = await liveR()
      const d = Math.abs((((rNow % 360) + 360) % 360) - 180)
      if (d <= 4) break   // 사람 눈에 「거의 뒤집혔다」 — 여기서 손을 뗀다
    }
    await page.mouse.up(); await page.waitForTimeout(500)
    const after = await val()
    // 🧲 자석이 생겨 물음이 바뀐다 — 「반 바퀴 돌리면 «180° 그 자리에» 딱 붙나」.
    //    (전엔 시작각을 그대로 업고 가서 172° 같은 어중간한 값이 나왔다 — 그걸 자석이 먹는다)
    const 끝 = ((after.r % 360) + 360) % 360
    const off = Math.abs(끝 - 180)
    console.log(`   ℹ️ ${시작.toFixed(1)}° 에서 반 바퀴 → ${after.r.toFixed(1)}° (180° 에서 ${off.toFixed(1)}° 어긋남) · 크기도 ${after.s?.toFixed(3)} 로 바뀜`)
    if (off <= 2) ok(`⭐ 반 바퀴 돌리면 «정확히 180°» 에 붙는다 (${off.toFixed(1)}° 차이) — 자석이 일한다`)
    else no(`⭐ 반 바퀴 돌려도 ${off.toFixed(1)}° 어긋난다 — 코너를 아래 귀퉁이에 «정확히» 못 놓는다`)
  }
}

console.log('\n── ⓓ 상하 뒤집기가 있나 ──')
{
  // ⛔⛔ 뒤집기는 «뒤집을 수 있는 컷»에만 뜬다(`canFlip`) — 마스킹테이프엔 안 뜨는 게 맞다.
  //    앞 절이 마테를 붙여 놨으니 여기선 «데코» 스티커를 하나 붙여서 묻는다.
  //    (옛 판은 마테를 고른 채 물어서 «없다»가 나왔다 — 기능이 아니라 검사가 틀렸다.)
  await page.getByRole('button', { name: '데코', exact: true }).last().click(); await page.waitForTimeout(700)
  const deco = page.locator('.decor-drawer .decor-sec img').first()
  if (await deco.count()) { await deco.click(); await page.waitForTimeout(800) }
  // 🔀 2026-08-07(안 D) — 뒤집기는 「순서」 갈래 «안»에 있다. 갈래를 안 열면 늘 0개다(규칙 18).
  //    ⛔⛔ 「이미 펼쳐진 갈래를 또 누르면 «접힌다»」 — 무턱대고 누르면 오히려 닫아버린다.
  //       실제로 이 검사가 그래서 「상하 뒤집기가 없다」로 잘못 찍혔다. `aria-expanded` 를 먼저 본다.
  const 순서 = page.locator('.decor-tools button[data-ctxtab="order"]')
  if (await 순서.count()) {
    if ((await 순서.first().getAttribute('aria-expanded')) !== 'true') { await 순서.first().click(); await page.waitForTimeout(400) }
  }
  const has = await page.locator('.decor-editor button').filter({ hasText: /^상하 뒤집기$/ }).count()
  if (has) ok('「상하 뒤집기」 단추가 있다')
  else no('⭐ 「상하 뒤집기」가 «없다» — 창업자 요청 그대로. 지금은 좌우(scaleX)뿐')
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)

// 🔎 창업자 폰 제보 2026-08-09 밤 — *"오늘의한끼누르면 쪼그라들어"*
//    캡처 둘 다 「저장 안 하고 나갔던 꾸미기를 이어서 불러왔어요」 띠가 격자 «밖»으로 튀어나와 있었다.
//    ⭐ 그 띠가 있는 상태로 재현한다 — 초안(`hankki:decorDraft:d1`)을 심어야 뜬다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4418, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let 나쁨 = 0
const 봄 = (좋나, 줄) => { if (!좋나) 나쁨++; console.log(`   ${좋나 ? '✅' : '⛔'} ${줄}`) }

for (const [판, w, h, 자판h] of [['📱 가로 891×411', 891, 411, 230], ['📱 세로 411×891', 411, 891, 410], ['📱 작은 폰 360×640', 360, 640, 320]]) {
  console.log(`\n━━━ ${판} ━━━`)
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  page.on('pageerror', e => { 나쁨++; console.log('   ⛔ pageerror', e.message) })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    // ⛔ 초안 키는 `hankki:decorDraft:diary-<날짜>` 다(DiaryScreen 257줄) — 손으로 심으려다 «날짜»를 몰라 실패했다.
    //    ⭐ 그래서 아래에서 «진짜로» 꾸미다 새로고침해 초안을 남긴다. 그게 창업자가 겪은 그 상태다.
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4418/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  // 🛟 «진짜로» 초안을 남긴다 — 스티커 하나 붙이고 저장 없이 새로고침(앱이 죽은 것과 같다).
  await page.locator('.seg', { hasText: /^일꾸$/ }).first().click(); await page.waitForTimeout(600)
  await page.evaluate(() => { const bs = [...document.querySelectorAll('.decor-grid button')]; if (bs[0]) bs[0].click() })
  await page.waitForTimeout(1200)
  // ⚠️ 「reload ＋ addInitScript」는 옛 함정이라 배포 게이트가 막는다 — 여기선 **왜 괜찮은지** 적고 쓴다.
  //    ⭐ 초안이 남으려면 «앱이 죽은 것»을 흉내내야 하는데 그 길이 reload 뿐이다.
  //    ⭐ 안전한 이유 = `addInitScript` 가 덮는 건 `hankki:v1`·코치 키뿐이고 **초안 키는 안 건드린다.**
  //       그래서 거짓 실패가 안 난다 — 실제로 띠가 「1개」로 정확히 잡혔다(안 잡히면 이 줄이 먼저 실패한다).
  await page.reload({ waitUntil: 'networkidle' }) // 일부러 — 초안을 남기려면 앱이 죽은 것을 흉내내야 한다
  await page.waitForTimeout(1200)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)

  const 띠있나 = await page.locator('.decor-restored').count()
  봄(띠있나 > 0, `「이어서 불러왔어요」 띠가 떴다(창업자 화면과 같은 상태) — ${띠있나}개`)

  // 속지 「오늘의 한끼」를 고른다 (창업자가 누른 그것)
  await page.locator('.seg', { hasText: /속지/ }).first().click(); await page.waitForTimeout(600)
  const 한끼 = page.locator('.decor-drawer button').filter({ hasText: /오늘의 한끼/ })
  const 골랐나 = await 한끼.count()
  if (골랐나) { await 한끼.first().click(); await page.waitForTimeout(900) }
  봄(골랐나 > 0, `속지 「오늘의 한끼」를 골랐다`)

  const 잰다 = () => {
    const st = document.querySelector('.decor-stage'), sr = st.getBoundingClientRect()
    const paper = st.querySelector('.paper'), pr = paper ? paper.getBoundingClientRect() : null
    const 띠 = document.querySelector('.decor-restored')
    const tr = 띠 ? 띠.getBoundingClientRect() : null
    const dw = document.querySelector('.decor-drawer'), dr = dw ? dw.getBoundingClientRect() : null
    return {
      칸: `${Math.round(sr.width)}×${Math.round(sr.height)}`,
      종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null,
      종이폭: pr ? Math.round(pr.width) : 0,
      띠가띄워졌나: tr ? getComputedStyle(document.querySelector('.decor-restored')).position === 'fixed' : null,
      서랍이오른쪽: !!(dr && dr.left > sr.right - 2),
    }
  }
  const 전 = await page.evaluate(잰다)
  console.log(`   속지 고른 뒤 ${JSON.stringify(전)}`)

  // 글칸에 커서 → 자판 뜸
  await page.evaluate(() => { const t = document.querySelector('.decor-stage textarea'); if (t) t.focus() })
  await page.setViewportSize({ width: w, height: 자판h }); await page.waitForTimeout(900)
  const 후 = await page.evaluate(잰다)
  console.log(`   자판 뜬 뒤   ${JSON.stringify(후)}`)
  // 📌 자판이 떠도 종이 폭이 «바닥값 230px» 밑으로 안 내려가야 한다(그게 「쪼그라든다」의 정체)
  봄(후.종이폭 >= 200, `자판 떠도 종이가 안 쪼그라든다 — 폭 ${전.종이폭} → ${후.종이폭}px (200 이상이라야)`)

  // ⭐⭐ **창업자가 실제로 밟은 길** — 자판이 «뜬 채로» 속지 탭을 누른다.
  //    탭을 옮기면 `dropCaret()` 이 커서를 내려놓아 `typing` 이 꺼진다 → 자판용 바닥값이 사라진다.
  //    ⛔ 그런데 자판은 안 내려가서 판은 여전히 낮다 → 종이가 통째로 쪼그라든다.
  //    🔢 창업자 캡처에서 잰 종이 ≈ 36×33px (내 첫 재현은 230×307 이라 이 길을 못 밟고 있었다)
  await page.locator('.seg', { hasText: /속지/ }).first().click(); await page.waitForTimeout(700)
  const 탭뒤 = await page.evaluate(잰다)
  console.log(`   자판 뜬 채 속지 탭 ${JSON.stringify(탭뒤)}`)
  봄(탭뒤.종이폭 >= 200, `자판 뜬 채 탭을 옮겨도 안 쪼그라든다 — 폭 ${후.종이폭} → ${탭뒤.종이폭}px (200 이상이라야)`)

  // 창업자 폰은 자판이 더 커서 앱에 76px 밖에 안 남는다 — 극단값도 잰다
  await page.setViewportSize({ width: w, height: Math.min(자판h, 90) }); await page.waitForTimeout(700)
  const 극단 = await page.evaluate(잰다)
  console.log(`   판이 90px 뿐일 때 ${JSON.stringify(극단)}`)
  봄(극단.종이폭 >= 200, `판이 90px 뿐이어도 종이는 그대로 — 폭 ${극단.종이폭}px (굴려서 본다)`)
  await page.close()
}
await b.close(); srv.close()
console.log(나쁨 === 0 ? '\n✅ 복구 띠가 있어도 판이 안 밀린다' : `\n⛔ ${나쁨}칸 어긋남`)
process.exit(나쁨 === 0 ? 0 : 1)

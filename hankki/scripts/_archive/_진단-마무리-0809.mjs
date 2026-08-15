// 🔎 마무리 확인 — 1·2차에서 «안 잰» 네 가지
//    ⓑ 세로에서 «스티커를 고른» 상태의 서랍(창업자가 본 화면) · ⓔ 나간 뒤 종이가 화면에 들어오나
//    🤏 두 손가락 확대가 실제로 되나 · 📐 자판 뜬 종이가 «비율»을 지키나
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4414, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let 나쁨 = 0
const 봄 = (좋나, 줄) => { if (!좋나) 나쁨++; console.log(`   ${좋나 ? '✅' : '⛔'} ${줄}`) }

async function 연다(w, h) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', hasTouch: true })
  page.on('pageerror', e => { 나쁨++; console.log('   ⛔ pageerror', e.message) })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4414/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  return page
}

// ⚠️ 작은 폰(360×640)을 꼭 넣는다 — 창업자 제보 *"세로모드 꾸미기탭 1칸도 채 안보임"* 이
//    411×891 에선 재현이 안 됐다. 「내 재현판 화면이 창업자 폰보다 큰 것」일 수 있다(규칙 18).
for (const [판, w, h, 자판h] of [['📱 세로 411×891', 411, 891, 410], ['📱 작은 폰 세로 360×640', 360, 640, 300], ['📱 가로 891×411', 891, 411, 160]]) {
  console.log(`\n━━━ ${판} ━━━`)

  // ─── ⓑ 「세로모드 꾸미기탭 1칸도 채 안보임」 = **스티커를 «고른» 상태**(도구바가 커진다)라야 창업자 화면이다
  {
    const page = await 연다(w, h)
    await page.locator('.seg', { hasText: /^일꾸$/ }).first().click(); await page.waitForTimeout(700)
    // ⚠️ 기본 갈래(마테)는 그룹이 3컷뿐이라 무엇을 고쳐도 「3칸」으로 보인다 — 컷이 많은 「데코」로 잰다.
    const 데코 = page.locator('.decor-cats button').filter({ hasText: /^데코$/ })
    if (await 데코.count()) { await 데코.first().click(); await page.waitForTimeout(700) }
    await page.evaluate(() => { const b2 = [...document.querySelectorAll('.decor-grid button')]; if (b2[0]) b2[0].click() })
    await page.waitForTimeout(900)
    const d = await page.evaluate(() => {
      const dw = document.querySelector('.decor-drawer'), dwr = dw.getBoundingClientRect()
      const sc = dw.querySelector('.decor-scroll') || dw.lastElementChild, scr = sc.getBoundingClientRect()
      const grid = dw.querySelector('.decor-grid'), cell = grid ? grid.firstElementChild : null
      const cr = cell ? cell.getBoundingClientRect() : null
      const tools = document.querySelector('.decor-tools'), tr = tools ? tools.getBoundingClientRect() : null
      const 보임 = Math.max(0, Math.min(scr.bottom, dwr.bottom) - Math.max(scr.top, dwr.top))
      // ⭐⭐ **「몇 줄」이 아니라 «실제로 온전히 보이는 칸 개수»를 센다** — 창업자가 세는 것이 이것이다.
      //    ⛔ 「굴칸 ÷ 한 칸」은 가정이다. 굴칸 안엔 선물 줄·그룹 이름·여백이 같이 들어 있어서
      //       숫자로는 2.4줄인데 화면엔 한 줄만 차 있었다(검수판을 눈으로 보고 알았다 — 규칙 13·18).
      const 칸들 = [...dw.querySelectorAll('.decor-grid > *')]
      const 온전히 = 칸들.filter((c) => { const r = c.getBoundingClientRect(); return r.top >= scr.top - 1 && r.bottom <= scr.bottom + 1 }).length
      const 첫칸위 = 칸들.length ? 칸들[0].getBoundingClientRect().top : scr.top
      return { 서랍: Math.round(dwr.height), 도구바: tr ? Math.round(tr.height) : 0, 굴칸: Math.round(보임), 한칸: cr ? Math.round(cr.height) : null, 온전히, 첫칸앞: Math.round(첫칸위 - scr.top) }
    })
    // 📌 문턱 = **5칸**. 창업자 제보가 *"1칸도 채 안보임"* 이었다 — 한 줄이 온전히 차야 답이 된다.
    봄(d.온전히 >= 5, `ⓑ 스티커 «고른» 상태 — **온전히 보이는 칸 ${d.온전히}개** · 서랍 ${d.서랍}px(도구바 ${d.도구바}) · 굴칸 ${d.굴칸}px 중 첫 칸 앞을 ${d.첫칸앞}px 이 먹는다 · 한 칸 ${d.한칸}px`)
    await page.close()
  }

  // ─── 📐 자판 뜬 종이가 «비율»을 지키나 (전수판에서 230×154 로 보여 확인이 필요했다)
  {
    const page = await 연다(w, h)
    await page.locator('.seg', { hasText: /속지/ }).first().click(); await page.waitForTimeout(600)
    const 속지 = page.locator('.decor-drawer button').filter({ hasText: /사진|기록|한끼|무지|줄/ })
    if (await 속지.count() > 0) { await 속지.first().click(); await page.waitForTimeout(800) }
    await page.evaluate(() => { const t = document.querySelector('.decor-stage textarea'); if (t) t.focus() })
    await page.setViewportSize({ width: w, height: 자판h }); await page.waitForTimeout(900)
    const p = await page.evaluate(() => {
      const st = document.querySelector('.decor-stage'), sr = st.getBoundingClientRect()
      const paper = st.querySelector('.paper'), pr = paper ? paper.getBoundingClientRect() : null
      const wrap = st.querySelector(':scope > div:not(.t-sub)'), wr = wrap ? wrap.getBoundingClientRect() : null
      return {
        칸: `${Math.round(sr.width)}×${Math.round(sr.height)}`,
        종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null,
        비율: pr ? +(pr.height / pr.width).toFixed(2) : null,
        래퍼: wr ? `${Math.round(wr.width)}×${Math.round(wr.height)}` : null,
        굴릴양: Math.round(st.scrollHeight - st.clientHeight),
      }
    })
    // 속지는 3:4 라 높이/폭 ≈ 1.33 이라야 하고, **폭이 바닥값(230px) 밑으로 안 내려가야** 한다.
    //   ⛔ 비율만 보면 «절반으로 줄어든 것»을 못 잡는다 — 절반이어도 비율은 그대로다(실제로 그랬다).
    const 폭 = p.종이 ? +p.종이.split('×')[0] : 0
    봄(p.비율 !== null && Math.abs(p.비율 - 4 / 3) < 0.06 && 폭 >= 225,
      `📐 자판 뜬 종이 ${p.종이}(높이/폭 ${p.비율} · 3:4 면 1.33 · 폭 225px 이상이라야) · 칸 ${p.칸} · 래퍼 ${p.래퍼} · 굴릴 양 ${p.굴릴양}px`)
    await page.close()
  }

  // ─── 🤏 두 손가락으로 벌리면 확대되나
  {
    const page = await 연다(w, h)
    const 전 = await page.evaluate(() => {
      const st = document.querySelector('.decor-stage'), r = st.getBoundingClientRect()
      const wr = st.querySelector(':scope > div:not(.t-sub)').getBoundingClientRect()
      return { 종이: Math.round(wr.width), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), 배율: document.querySelector('.decor-zoom span').textContent }
    })
    // 두 손가락을 «벌린다» — 40px 떨어진 데서 시작해 140px 로
    const 손 = await page.context().newCDPSession(page)
    const 점 = (dx) => ([{ x: 전.cx - dx, y: 전.cy, id: 1 }, { x: 전.cx + dx, y: 전.cy, id: 2 }])
    await 손.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: 점(20).map(p => ({ x: p.x, y: p.y, id: p.id })) })
    for (const d of [35, 50, 65, 80]) {
      await 손.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: 점(d).map(p => ({ x: p.x, y: p.y, id: p.id })) })
      await page.waitForTimeout(60)
    }
    await 손.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(500)
    const 후 = await page.evaluate(() => {
      const st = document.querySelector('.decor-stage')
      return { 종이: Math.round(st.querySelector(':scope > div:not(.t-sub)').getBoundingClientRect().width), 배율: document.querySelector('.decor-zoom span').textContent }
    })
    봄(후.종이 > 전.종이 + 8, `🤏 두 손가락으로 벌리기 — 종이 ${전.종이} → ${후.종이}px · 배율 ${전.배율} → ${후.배율}`)
    await page.close()
  }

  // ─── ⓔ 꾸미다가 «취소»하면 화면이 엄청 커지나
  {
    const page = await 연다(w, h)
    await page.locator('.seg', { hasText: /^일꾸$/ }).first().click(); await page.waitForTimeout(600)
    await page.evaluate(() => { const b2 = [...document.querySelectorAll('.decor-grid button')]; if (b2[0]) b2[0].click() })
    await page.waitForTimeout(700)
    await page.getByRole('button', { name: '취소' }).first().click(); await page.waitForTimeout(600)
    const 시트 = page.getByRole('button', { name: /안 하고 나가|나가기|버리기|저장 안/ })
    if (await 시트.count() > 0) { await 시트.first().click(); await page.waitForTimeout(900) }
    const r = await page.evaluate(() => {
      const paper = document.querySelector('.paper'), pr = paper ? paper.getBoundingClientRect() : null
      return { 종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null, 높이: pr ? Math.round(pr.height) : null, 화면: innerHeight }
    })
    // 종이 높이가 화면 높이의 1.2배를 넘으면 「화면이 엄청 커진」 상태로 본다
    봄(r.높이 !== null && r.높이 <= r.화면 * 1.2, `ⓔ 취소하고 나온 뒤 종이 ${r.종이} · 화면 높이 ${r.화면}px (1.2배 ${Math.round(r.화면 * 1.2)}px 이하라야)`)
    await page.close()
  }
}
await b.close(); srv.close()
console.log(나쁨 === 0 ? '\n✅✅ 마무리 확인 전부 통과' : `\n⛔ ${나쁨}칸 어긋남`)
process.exit(나쁨 === 0 ? 0 : 1)

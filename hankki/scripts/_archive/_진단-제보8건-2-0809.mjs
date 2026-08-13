// 🔎 1차(_진단-제보8건-0809)에서 «내가 잘못 잰 칸»만 다시 잰다.
//    ⛔ 1차 실수 = ⓐ 스티커 대신 점선 테두리(inset:-6)를 잡았다 · ⓑ 꾸미기 탭을 안 열고 쟀다(빈 값을 ✅로 찍음)
//                 · ⓕ 「겹치면 보임」으로 느슨하게 판정했다 · ⓓ 「크기가 변하면 ✅」라 «작아진 것»도 통과시켰다
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4412, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

async function 연다(w, h) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  page.on('pageerror', e => console.log('   ⛔ pageerror', e.message))
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4412/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  return page
}
// ⭐ 아이템 = `left`·`top` 이 «퍼센트»인 겹 (DecorLayer 206~208줄). 점선 테두리는 px 라 안 걸린다.
// ⛔⛔ 오늘 이 자리에서 두 번 틀렸다 — ⑴선택 테두리(`inset:-6`)를 잡아 늘 50%/50% 로 읽었고
//    ⑵그걸 고친 뒤엔 «마지막 것»이 방금 붙인 게 아니라 옆 겹이었다.
//    📌 그래서 「방금 붙인 것」은 목록에서 고르지 말고 **커서가 들어간 textarea 에서 거슬러 올라가** 찾는다.
const 아이템들 = () => [...document.querySelectorAll('.decor-stage div')]
  .filter(e => e.style && e.style.left.endsWith('%') && e.style.top.endsWith('%') && !e.style.height)
  .map(e => ({ left: e.style.left, top: e.style.top }))
// 방금 붙인 것 하나를 «확실히» 집는다 — 커서가 있으면 그 글칸의 주인, 없으면 마지막 아이템.
const 방금붙인것 = () => {
  const ta = document.querySelector('.decor-stage textarea[data-boxtext]')
  let t = ta ? ta.parentElement : null
  while (t && !(t.style && t.style.left.endsWith('%') && t.style.top.endsWith('%'))) t = t.parentElement
  if (!t) {
    const list = [...document.querySelectorAll('.decor-stage div')].filter(e => e.style && e.style.left.endsWith('%') && e.style.top.endsWith('%') && !e.style.height)
    t = list[list.length - 1]
  }
  if (!t) return null
  const r = t.getBoundingClientRect()
  window.__끌대상 = t
  return { left: t.style.left, top: t.style.top, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
}
const 지금자리 = () => (window.__끌대상 ? { left: window.__끌대상.style.left, top: window.__끌대상.style.top } : null)

for (const [판, w, h, 자판h] of [['📱 세로 411×891', 411, 891, 410], ['📱 가로 891×411', 891, 411, 160]]) {
  console.log(`\n━━━ ${판} ━━━`)

  // ───────── ⓑ "세로모드 꾸미기 탭 1칸도 채 안 보임 · 나머지는 고르기 버튼이 다 잡아먹음"
  {
    const page = await 연다(w, h)
    await page.locator('.seg', { hasText: /^일꾸$/ }).first().click(); await page.waitForTimeout(800)
    const d = await page.evaluate(() => {
      const dw = document.querySelector('.decor-drawer'), dwr = dw.getBoundingClientRect()
      const sc = dw.querySelector('.decor-scroll') || dw.lastElementChild
      const scr = sc.getBoundingClientRect()
      const grid = dw.querySelector('.decor-grid'), gr = grid ? grid.getBoundingClientRect() : null
      const cell = grid ? grid.firstElementChild : null, cr = cell ? cell.getBoundingClientRect() : null
      // 서랍에서 「고르는 것」(탭 줄·갈래 칩·라벨)이 먹는 높이 = 서랍 − 굴러가는 칸
      const 고정 = dwr.height - scr.height
      const 보이는칸높이 = Math.max(0, Math.min(scr.bottom, dwr.bottom) - Math.max(scr.top, dwr.top))
      const 한줄 = cr ? cr.height : null
      return {
        서랍: Math.round(dwr.height), 고르는것: Math.round(고정), 굴러가는칸: Math.round(보이는칸높이),
        한칸: 한줄 ? Math.round(한줄) : null, 보이는줄: 한줄 ? +(보이는칸높이 / 한줄).toFixed(2) : null,
        한줄에몇칸: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : null,
      }
    })
    console.log(`   ⓑ 서랍 ${d.서랍}px 중 «고르는 것» ${d.고르는것}px · 스티커 굴러가는 칸 ${d.굴러가는칸}px`)
    console.log(`      한 칸 ${d.한칸}px × 한 줄 ${d.한줄에몇칸}칸 → ${d.보이는줄}줄 보임 ${d.보이는줄 < 1.5 ? '⛔ 1줄도 채 안 보인다' : '✅'}`)
    await page.close()
  }

  // ───────── ⓐ "스티커 붙이고 «바로» 움직이면 안 움직여짐 · 자판바를 없애고 움직여야 움직여짐"
  //    두 갈래로 나눠 잰다 — ⑴ 그냥 스티커 ⑵ 붙자마자 커서가 들어가는 글 상자
  for (const [갈래, 탭, 고르기] of [['그림 스티커', /^일꾸$/, 0], ['글 상자(붙이면 바로 커서)', /^레꾸$/, -1]]) {
    const page = await 연다(w, h)
    try {
      await page.locator('.seg', { hasText: 탭 }).first().click(); await page.waitForTimeout(700)
      if (고르기 === -1) {   // 글자 갈래로 가서 포스트잇·글 상자를 고른다
        const t = page.locator('.decor-cats button').filter({ hasText: /^글자$/ })
        if (await t.count() > 0) { await t.first().click(); await page.waitForTimeout(700) }
      }
      const 전목록 = await page.evaluate(아이템들)
      const 붙임 = await page.evaluate((끝) => {
        const btns = [...document.querySelectorAll('.decor-grid button')]
        if (!btns.length) return null
        const i = 끝 === -1 ? 0 : 끝
        btns[i].click(); return btns.length
      }, 고르기 === -1 ? -1 : 0)
      await page.waitForTimeout(900)
      const 후목록 = await page.evaluate(아이템들)
      if (!붙임 || 후목록.length <= 전목록.length) { console.log(`   ⓐ [${갈래}] ⚠️ 스티커가 안 붙었다 — 재현이 경로를 못 밟았다`); await page.close(); continue }

      const 상태 = await page.evaluate(() => ({ 커서: document.activeElement ? document.activeElement.tagName : null, 글칸수: document.querySelectorAll('.decor-stage textarea').length }))
      const 붙은것 = await page.evaluate(방금붙인것)
      if (!붙은것) { console.log(`   ⓐ [${갈래}] ⚠️ 붙인 것을 못 집었다`); await page.close(); continue }
      // ⑴ 붙이자마자 «바로» 끌어본다
      await page.mouse.move(붙은것.x, 붙은것.y); await page.mouse.down(); await page.waitForTimeout(80)
      await page.mouse.move(붙은것.x + 45, 붙은것.y + 35, { steps: 10 }); await page.waitForTimeout(80); await page.mouse.up(); await page.waitForTimeout(400)
      const 끈뒤 = await page.evaluate(지금자리)
      const 바로움직임 = 끈뒤.left !== 붙은것.left || 끈뒤.top !== 붙은것.top
      const 커서유지 = await page.evaluate(() => document.activeElement.tagName)
      // ⑵ 커서를 내려놓고(=자판 없애고) 다시 끌어본다
      await page.evaluate(() => { const a = document.activeElement; if (a && a.tagName === 'TEXTAREA') a.blur() }); await page.waitForTimeout(500)
      const 자리2 = await page.evaluate(() => { const t = window.__끌대상, r = t.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } })
      await page.mouse.move(자리2.x, 자리2.y); await page.mouse.down(); await page.waitForTimeout(80)
      await page.mouse.move(자리2.x + 45, 자리2.y + 35, { steps: 10 }); await page.waitForTimeout(80); await page.mouse.up(); await page.waitForTimeout(400)
      const 끈뒤2 = await page.evaluate(지금자리)
      const 나중움직임 = 끈뒤2.left !== 끈뒤.left || 끈뒤2.top !== 끈뒤.top
      const 판정 = 바로움직임 ? '✅ 바로 움직인다' : (나중움직임 ? '⛔ 창업자 제보 그대로 — 자판을 없애야만 움직인다' : '⚠️ 둘 다 안 움직임 — 재현이 못 밟았을 수 있다')
      console.log(`   ⓐ [${갈래}] ${판정}`)
      console.log(`      붙인 직후 커서=${상태.커서}(글칸 ${상태.글칸수}개) · 바로 끌기 ${바로움직임 ? '움직임' : '⛔안 움직임'}(끈 뒤 커서=${커서유지}) → 커서 내리고 끌기 ${나중움직임 ? '움직임' : '안 움직임'}`)
      console.log(`      자리: ${붙은것.left}/${붙은것.top} → ${끈뒤.left}/${끈뒤.top} → ${끈뒤2.left}/${끈뒤2.top}`)
    } catch (e) { console.log(`   ⓐ [${갈래}] ⚠️ 재현 실패: ${e.message}`) }
    await page.close()
  }

  // ───────── ⓕ "속지 선택하고 바로 글쓰면 젤 위칸에 글쓰는데 안보임" — 「일부라도 겹치면 보임」이 아니라 «온전히» 보이나
  //           ⓓ ＋ 를 누르면 커서가 풀리나 (1차에서 종이가 «작아진» 이유 의심)
  {
    const page = await 연다(w, h)
    try {
      await page.locator('.seg', { hasText: /속지/ }).first().click(); await page.waitForTimeout(600)
      const 속지 = page.locator('.decor-drawer button').filter({ hasText: /사진|기록|한끼|무지|줄/ })
      if (await 속지.count() > 0) { await 속지.first().click(); await page.waitForTimeout(800) }
      const 첫칸 = await page.evaluate(() => {
        const st = document.querySelector('.decor-stage'); const tas = [...st.querySelectorAll('textarea')]
        if (!tas.length) return null
        tas.sort((a, c) => a.getBoundingClientRect().top - c.getBoundingClientRect().top)
        tas[0].focus(); return tas.length
      })
      if (!첫칸) { console.log('   ⓕ ⚠️ 이 속지엔 글칸이 없다'); }
      else {
        await page.setViewportSize({ width: w, height: 자판h }); await page.waitForTimeout(800)
        const 재기 = () => {
          const st = document.querySelector('.decor-stage'), sr = st.getBoundingClientRect()
          const t = document.activeElement && document.activeElement.tagName === 'TEXTAREA' ? document.activeElement : st.querySelector('textarea')
          const r = t ? t.getBoundingClientRect() : null
          const w2 = st.querySelector(':scope > div:not(.t-sub)'), pr = w2 ? w2.getBoundingClientRect() : null
          return {
            커서: document.activeElement ? document.activeElement.tagName : null,
            칸: `${Math.round(sr.top)}~${Math.round(sr.bottom)}`,
            글칸: r ? `${Math.round(r.top)}~${Math.round(r.bottom)}` : null,
            위잘림: r ? Math.round(Math.max(0, sr.top - r.top)) : null,
            아래잘림: r ? Math.round(Math.max(0, r.bottom - sr.bottom)) : null,
            종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null,
          }
        }
        const a = await page.evaluate(재기)
        const 온전히 = a.위잘림 === 0 && a.아래잘림 === 0
        console.log(`   ⓕ 자판 뜬 뒤 첫 글칸 ${a.글칸} · 보이는 칸 ${a.칸} → 위 ${a.위잘림}px · 아래 ${a.아래잘림}px 잘림 ${온전히 ? '✅' : '⛔ 글칸이 잘려 안 보인다'}`)
        const plus = page.locator('.decor-zoom button').last()
        if (await plus.count() > 0 && await plus.isVisible().catch(() => false)) {
          await plus.click({ force: true }); await page.waitForTimeout(600)
          const c = await page.evaluate(재기)
          const 커짐 = c.종이 !== a.종이
          console.log(`   ⓓ ＋ 누른 뒤 — 커서 ${a.커서} → ${c.커서} ${c.커서 !== 'TEXTAREA' ? '⛔ ＋ 를 누르면 커서가 풀린다' : '✅ 커서 유지'}`)
          console.log(`      종이 ${a.종이} → ${c.종이} ${커짐 ? (parseInt(c.종이) > parseInt(a.종이) ? '✅ 커짐' : '⛔ 오히려 작아짐') : '⛔ 그대로 = 자판 떠 있는 동안 확대가 안 먹는다'}`)
        } else console.log('   ⓓ ⚠️ ＋ 단추가 안 보인다')
      }
    } catch (e) { console.log('   ⓕⓓ ⚠️ 재현 실패: ' + e.message) }
    await page.close()
  }
}
await b.close(); srv.close()

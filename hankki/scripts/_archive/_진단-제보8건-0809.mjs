// 🔎🔎 창업자 제보 8건을 «하나씩» 재현한다 (2026-08-09 밤)
//    창업자 원문 그대로 달아 둔다 — 내가 말을 바꿔 적으면 엉뚱한 걸 재게 된다.
//    ⛔ 못 재현한 것을 「없다」로 적지 말 것(규칙 18). 「내 재현이 못 밟았다」와 「앱이 멀쩡하다」는 다른 말이다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4411, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

const 결과 = []
const 적는다 = (판, 항목, 판정, 값) => { 결과.push({ 판, 항목, 판정, 값 }); console.log(`   ${판정} ${항목} — ${값}`) }

// 꾸미기 판을 연다
async function 연다(w, h) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  page.on('pageerror', e => console.log('   ⛔ pageerror', e.message))
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4411/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  return page
}
const 잰다 = () => {
  const st = document.querySelector('.decor-stage')
  const sr = st ? st.getBoundingClientRect() : null
  const w = st && st.querySelector(':scope > div:not(.t-sub)')
  const r = w ? w.getBoundingClientRect() : null
  const z = document.querySelector('.decor-zoom'), zr = z ? z.getBoundingClientRect() : null
  const zv = z ? getComputedStyle(z).display !== 'none' : false
  const dg = document.querySelector('.decor-grid'), dgr = dg ? dg.getBoundingClientRect() : null
  const dw = document.querySelector('.decor-drawer'), dwr = dw ? dw.getBoundingClientRect() : null
  return {
    화면: `${innerWidth}×${innerHeight}`,
    가로로봄: matchMedia('(orientation: landscape)').matches,
    칸: sr ? `${Math.round(sr.width)}×${Math.round(sr.height)}` : null,
    칸위: sr ? Math.round(sr.top) : null,
    종이: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : null,
    종이위: r ? Math.round(r.top) : null,
    위잘림: (r && sr) ? Math.round(Math.max(0, sr.top - r.top)) : 0,
    굴린양: st ? Math.round(st.scrollTop) : 0,
    굴릴수있는양: st ? Math.round(st.scrollHeight - st.clientHeight) : 0,
    확대보임: zv, 확대칸: zr ? `${Math.round(zr.left)},${Math.round(zr.top)} ${Math.round(zr.width)}×${Math.round(zr.height)}` : null,
    서랍: dwr ? `${Math.round(dwr.width)}×${Math.round(dwr.height)}` : null,
    스티커칸높이: dgr ? Math.round(dgr.height) : null,
  }
}

for (const [판, w, h, 자판h] of [['📱 세로 411×891', 411, 891, 410], ['📱 가로 891×411', 891, 411, 160]]) {
  console.log(`\n━━━ ${판} ━━━`)
  const page = await 연다(w, h)
  const 처음 = await page.evaluate(잰다)
  console.log('   기준', JSON.stringify(처음))

  // ───────── ⓖ "확대 버튼이 글자칸을 가림"
  try {
    const g = await page.evaluate(() => {
      const z = document.querySelector('.decor-zoom'); if (!z || getComputedStyle(z).display === 'none') return { 없음: true }
      const zr = z.getBoundingClientRect()
      const st = document.querySelector('.decor-stage')
      const paper = st.querySelector('.paper') || st.querySelector(':scope > div:not(.t-sub)')
      const pr = paper.getBoundingClientRect()
      const ov = Math.max(0, Math.min(zr.right, pr.right) - Math.max(zr.left, pr.left)) * Math.max(0, Math.min(zr.bottom, pr.bottom) - Math.max(zr.top, pr.top))
      // 종이 맨 윗줄(글칸 첫 칸)과 겹치나
      const box = st.querySelector('textarea') || paper.firstElementChild
      const br = box ? box.getBoundingClientRect() : null
      const ov2 = br ? Math.max(0, Math.min(zr.right, br.right) - Math.max(zr.left, br.left)) * Math.max(0, Math.min(zr.bottom, br.bottom) - Math.max(zr.top, br.top)) : 0
      // 확대 단추 한가운데에 뭐가 잡히나
      const el = document.elementFromPoint(zr.left + zr.width / 2, zr.top + zr.height / 2)
      return { 종이와겹침: Math.round(ov), 첫칸과겹침: Math.round(ov2), 그자리에잡히는것: el ? (el.className || el.tagName) + '' : null }
    })
    if (g.없음) 적는다(판, 'ⓖ 확대 단추가 글자칸을 가림', '⚪', '확대 단추가 이 판엔 안 보임')
    else 적는다(판, 'ⓖ 확대 단추가 글자칸을 가림', g.종이와겹침 > 0 ? '⛔' : '✅', `종이와 겹치는 넓이 ${g.종이와겹침}px² · 첫 칸과 ${g.첫칸과겹침}px² · 그 자리 = ${g.그자리에잡히는것}`)
  } catch (e) { 적는다(판, 'ⓖ', '⚠️', '재현 실패: ' + e.message) }

  // ⛔⛔ **ⓑ(서랍 칸)·ⓐ(스티커 끌기)는 여기서 «빼냈다».**
  //    이 판에서 재 봤더니 ⓑ 는 꾸미기 탭을 안 열어 «빈 값»을 ✅ 로 찍었고,
  //    ⓐ 는 스티커 대신 «선택 점선 테두리»(inset:-6)를 잡아 늘 「안 움직임」이라 했다.
  //    📌 **틀리게 재고 ✅ 를 찍는 칸은 없느니만 못하다**(규칙 18 ⓘ).
  //    → ⓑ 는 `_진단-마무리-0809`(스티커 고른 상태 · 작은 폰 포함) · ⓐ 는 `_진단-제보8건-2-0809` 가 잰다.

  // ───────── ⓕ "속지 선택하고 바로 글쓰면 젤 위칸에 글쓰는데 안보임(자판은 눌러짐)"
  try {
    await page.locator('.seg', { hasText: '속지' }).first().click(); await page.waitForTimeout(500)
    const 속지 = page.locator('.decor-drawer button').filter({ hasText: /사진|기록|한끼|무지|줄/ })
    if (await 속지.count() > 0) { await 속지.first().click(); await page.waitForTimeout(700) }
    // 종이 «맨 위» 글칸을 누른다
    const hit = await page.evaluate(() => {
      const st = document.querySelector('.decor-stage')
      const tas = [...st.querySelectorAll('textarea')]
      if (!tas.length) return null
      tas.sort((a, c) => a.getBoundingClientRect().top - c.getBoundingClientRect().top)
      const t = tas[0]; t.focus()
      const r = t.getBoundingClientRect(), sr = st.getBoundingClientRect()
      return { 첫칸: `${Math.round(r.top)}~${Math.round(r.bottom)}`, 칸: `${Math.round(sr.top)}~${Math.round(sr.bottom)}`, 글칸수: tas.length }
    })
    if (!hit) 적는다(판, 'ⓕ 속지 첫 칸이 안 보임', '⚠️', '이 속지엔 글칸이 없다 — 재현이 경로를 못 밟았다')
    else {
      await page.setViewportSize({ width: w, height: 자판h }); await page.waitForTimeout(700)
      const after = await page.evaluate(() => {
        const st = document.querySelector('.decor-stage'); const sr = st.getBoundingClientRect()
        const t = document.activeElement && document.activeElement.tagName === 'TEXTAREA' ? document.activeElement : st.querySelector('textarea')
        if (!t) return { 커서없음: true }
        const r = t.getBoundingClientRect()
        const 보임 = r.bottom > sr.top + 2 && r.top < sr.bottom - 2
        return { 커서칸: `${Math.round(r.top)}~${Math.round(r.bottom)}`, 보이는칸: `${Math.round(sr.top)}~${Math.round(sr.bottom)}`, 보임, 위로잘린양: Math.round(Math.max(0, sr.top - r.top)) }
      })
      적는다(판, 'ⓕ 속지 첫 칸이 자판 뜨면 안 보임', after.보임 === false ? '⛔' : '✅', `커서 ${after.커서칸} · 보이는 칸 ${after.보이는칸} · 위로 잘린 양 ${after.위로잘린양}px`)
      // ───────── ⓓ "확대가 자판 열렸을 땐 안 되고 자판 사라지면 커짐"
      const 자판중 = await page.evaluate(잰다)
      const plus = page.locator('.decor-zoom button').last()
      let 눌림 = false
      if (await plus.count() > 0 && await plus.isVisible().catch(() => false)) { await plus.click({ force: true }); await page.waitForTimeout(500); 눌림 = true }
      const 확대후 = await page.evaluate(잰다)
      적는다(판, 'ⓓ 자판 떠 있는 동안 ＋ 를 눌러도 안 커짐', !눌림 ? '⚠️' : (확대후.종이 === 자판중.종이 ? '⛔' : '✅'),
        눌림 ? `자판 중 ${자판중.종이} → ＋ 누른 뒤 ${확대후.종이}` : '＋ 단추를 못 눌렀다(안 보임)')
      // 자판이 사라지면? — ⚠️ 여기서 종이가 «또» 커지는 건 정상이다(칸이 넓어졌으니).
      //    창업자 제보는 「자판 떠 있는 «동안»엔 확대가 안 먹는다」였고 그건 바로 위 ⓓ 가 잰다.
      //    ⛔ 처음엔 이 칸을 「크기가 변하면 ⛔」로 짰다가 «정상 동작»을 결함으로 찍었다 — 정보로만 남긴다.
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(700)
      const 자판내림 = await page.evaluate(잰다)
      적는다(판, 'ⓓ2 (참고) 자판 내리면 칸이 넓어져 종이도 커진다', '✅', `＋ 누른 뒤 ${확대후.종이} → 자판 내리니 ${자판내림.종이}`)
    }
  } catch (e) { 적는다(판, 'ⓕⓓ', '⚠️', '재현 실패: ' + e.message) }

  // ───────── ⓙ/ⓗ "위쪽 고정 · 젤 위로 스크롤 안 됨"
  try {
    // 종이가 칸보다 커지게 확대를 끝까지
    for (let i = 0; i < 5; i++) { const p = page.locator('.decor-zoom button').last(); if (await p.count() && await p.isVisible().catch(() => false)) { await p.click({ force: true }); await page.waitForTimeout(220) } }
    const s = await page.evaluate(() => {
      const st = document.querySelector('.decor-stage'), sr = st.getBoundingClientRect()
      const w = st.querySelector(':scope > div:not(.t-sub)'), r = w.getBoundingClientRect()
      const 넘침 = Math.round(r.height - sr.height)
      st.scrollTop = -9999                       // 맨 위로 올려본다
      const 올린뒤 = st.scrollTop
      const r2 = w.getBoundingClientRect()
      return {
        칸: `${Math.round(sr.width)}×${Math.round(sr.height)}`, 종이: `${Math.round(r.width)}×${Math.round(r.height)}`,
        넘친양: 넘침, 굴릴수있는양: Math.round(st.scrollHeight - st.clientHeight), 맨위로올린뒤굴린양: Math.round(올린뒤),
        위잘림: Math.round(Math.max(0, sr.top - r2.top)),
      }
    })
    적는다(판, 'ⓙ 종이 위쪽이 잘리고 맨 위로 못 올림', (s.넘친양 > 0 && s.위잘림 > 0) ? '⛔' : '✅',
      `칸 ${s.칸} · 종이 ${s.종이} · 넘친 ${s.넘친양}px · 굴릴 수 있는 양 ${s.굴릴수있는양}px · 맨 위로 올린 뒤에도 위가 ${s.위잘림}px 잘림`)
  } catch (e) { 적는다(판, 'ⓙ', '⚠️', '재현 실패: ' + e.message) }

  // ───────── ⓗ "스티커를 위쪽에 붙이면 안 보임 / 아래쪽에서만 움직임"
  try {
    const h2 = await page.evaluate(() => {
      const st = document.querySelector('.decor-stage'), sr = st.getBoundingClientRect()
      const w = st.querySelector(':scope > div:not(.t-sub)'), r = w.getBoundingClientRect()
      // 종이 y=5% 자리(스티커를 「위쪽」에 붙이는 자리)가 화면에 보이나
      const y5 = r.top + r.height * 0.05, y50 = r.top + r.height * 0.5
      return { 종이맨위5퍼센트가보이나: y5 > sr.top && y5 < sr.bottom, 가운데가보이나: y50 > sr.top && y50 < sr.bottom, y5: Math.round(y5), 칸위: Math.round(sr.top) }
    })
    적는다(판, 'ⓗ 종이 위쪽에 붙인 스티커가 화면 밖', h2.종이맨위5퍼센트가보이나 ? '✅' : '⛔',
      `종이 5% 자리 y=${h2.y5} · 보이는 칸은 y=${h2.칸위} 부터 → ${h2.종이맨위5퍼센트가보이나 ? '보인다' : '화면 밖'}(가운데는 ${h2.가운데가보이나 ? '보임' : '안 보임'})`)
  } catch (e) { 적는다(판, 'ⓗ', '⚠️', '재현 실패: ' + e.message) }

  await page.close()

  // ───────── ⓐ "스티커 붙이고 바로 움직이면 안 움직여짐" (판을 새로 열어서)
  try {
    const p2 = await 연다(w, h)
    await p2.locator('.seg', { hasText: /꾸미기|일꾸/ }).first().click(); await p2.waitForTimeout(600)
    const 붙임 = await p2.evaluate(() => {
      const btns = [...document.querySelectorAll('.decor-grid button')]
      if (!btns.length) return false
      btns[0].click(); return true
    })
    await p2.waitForTimeout(700)
    if (!붙임) 적는다(판, 'ⓐ 스티커 붙이고 바로 못 움직임', '⚠️', '서랍에서 스티커를 못 찾았다')
    else {
      // ⭐ 방금 붙인 것 = 커서가 든 글칸의 주인, 없으면 «높이를 안 정한» 마지막 아이템.
      //    ⛔ 그냥 「마지막 아이템」으로 잡으면 선택 점선 테두리(`inset:-6`)나 프레임 겹을 잡는다 — 오늘 두 번 당했다.
      const 전 = await p2.evaluate(() => {
        const ta = document.querySelector('.decor-stage textarea[data-boxtext]')
        let t = ta ? ta.parentElement : null
        while (t && !(t.style && t.style.left.endsWith('%') && t.style.top.endsWith('%'))) t = t.parentElement
        if (!t) {
          const list = [...document.querySelectorAll('.decor-stage div')].filter(e => e.style && e.style.left.endsWith('%') && e.style.top.endsWith('%') && !e.style.height)
          t = list[list.length - 1]
        }
        if (!t) return null
        window.__끌대상 = t
        const r = t.getBoundingClientRect()
        return { left: t.style.left, top: t.style.top, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), 커서: document.activeElement ? document.activeElement.tagName : null }
      })
      if (!전) 적는다(판, 'ⓐ', '⚠️', '붙인 스티커를 못 찾았다')
      else {
        await p2.mouse.move(전.x, 전.y); await p2.mouse.down(); await p2.waitForTimeout(60)
        await p2.mouse.move(전.x + 40, 전.y + 30, { steps: 8 }); await p2.waitForTimeout(60); await p2.mouse.up(); await p2.waitForTimeout(400)
        const 후 = await p2.evaluate(() => { const t = window.__끌대상; return { left: t.style.left, top: t.style.top } })
        const 움직였다 = 후.left !== 전.left || 후.top !== 전.top
        적는다(판, 'ⓐ 스티커 붙이고 «바로» 끌면 안 움직임', 움직였다 ? '✅' : '⛔',
          `끌기 전 ${전.left}/${전.top}(커서=${전.커서}) → 끈 뒤 ${후.left}/${후.top}`)
      }
      // ───────── ⓔ "꾸미다가 취소하면 화면이 엄청 커짐"
      const 취소전 = await p2.evaluate(() => {
        const f = document.querySelector('.app-frame'), fr = f ? f.getBoundingClientRect() : null
        return { 앱폭: fr ? Math.round(fr.width) : null, 화면: `${innerWidth}×${innerHeight}`, 배율: getComputedStyle(document.documentElement).zoom || null }
      })
      await p2.getByRole('button', { name: '취소' }).first().click(); await p2.waitForTimeout(600)
      const 시트 = p2.getByRole('button', { name: /안 하고 나가|나가기|버리기|저장 안/ })
      if (await 시트.count() > 0) { await 시트.first().click(); await p2.waitForTimeout(800) }
      const 취소후 = await p2.evaluate(() => {
        const f = document.querySelector('.app-frame'), fr = f ? f.getBoundingClientRect() : null
        const paper = document.querySelector('.paper'), pr = paper ? paper.getBoundingClientRect() : null
        return { 앱폭: fr ? Math.round(fr.width) : null, 종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null, 화면: `${innerWidth}×${innerHeight}` }
      })
      // ⛔ 「앱 폭이 변했나」로 봤더니 «늘 안 변해서» 아무것도 못 잡았다 — 창업자가 본 건 앱 폭이 아니라
      //    «종이가 화면을 넘는 것»이다(가로에서 851×1135). 종이 높이를 화면 높이와 견준다.
      const 넘침 = 취소후.종이 ? Number(취소후.종이.split('×')[1]) > h * 1.2 : false
      적는다(판, 'ⓔ 취소하고 나오면 종이가 화면을 넘는다', 넘침 ? '⛔' : '✅',
        `취소 전 앱 폭 ${취소전.앱폭}px → 취소 뒤 ${취소후.앱폭}px · 나간 뒤 종이 ${취소후.종이} (화면 높이 ${h}px)`)
    }
    await p2.close()
  } catch (e) { 적는다(판, 'ⓐⓔ', '⚠️', '재현 실패: ' + e.message) }
}

await b.close(); srv.close()
console.log('\n━━━ 모아보기 ━━━')
const 나쁨 = 결과.filter(r => r.판정 === '⛔'), 모름 = 결과.filter(r => r.판정 === '⚠️' || r.판정 === '⚪')
console.log(`⛔ 재현됨 ${나쁨.length}건 · ✅ 멀쩡 ${결과.filter(r => r.판정 === '✅').length}건 · ⚠️⚪ 못 가름 ${모름.length}건`)
나쁨.forEach(r => console.log(`   ⛔ [${r.판}] ${r.항목}`))
모름.forEach(r => console.log(`   ${r.판정} [${r.판}] ${r.항목} — ${r.값}`))

// 🐛🐛 재현 — 「레꾸에서 배경이 겹겹이 쌓이고, 지우기·아이콘 변경이 반응이 없다」 (창업자 제보 2026-08-23)
//
// 📮 창업자 원문 =
//   *"1. 그거 레꾸자랑카드를 표지로 바꾼거야."*
//   *"2. 배경되돌리기?지우기를 하면 백지가 되어야해. 그런데 안바뀌고 겹겹히 쌓이잖아."*
//   *"마늘쫑비빔밥은 배경음식아이콘지우기에 반응없고, 아이콘을 변경해도 반응이없어. 다 문제야 지금."*
//
// ⭐ 재는 것 셋 — 전부 «화면에 칠해진 픽셀»로 잰다(DOM 이 아니다).
//   ① 자랑카드를 표지로 저장한 레시피의 레꾸 판에 «그 카드»가 배경으로 깔리나 (＝겹침)
//   ② 「배경 음식 아이콘 지우기」를 누르면 판이 «실제로» 바뀌나
//   ③ 상세에서 「아이콘 바꾸기」로 아이콘을 갈면 표지가 «실제로» 바뀌나
//
// ⛔ 「DOM 이 바뀌었나」로 재지 않는다 — 창업자가 본 건 «눈에 아무 일도 안 일어난다»이다.
//    바뀌었는데 덮여서 안 보이는 것도 창업자에겐 「반응 없음」이다. 그래서 그림을 견준다.
// ⚠️ 진짜 카드를 만들어 진짜로 저장한다(규칙 30 — 앱과 같은 길).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { 사진값 } from './_창고사진.mjs'   // 🗄 사진이 창고(IndexedDB)에 있으면 꺼내서 잰다

const OUT = process.env.OUT || '/tmp/레꾸겹침'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 코치키들 = Object.values(COACH)
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4391)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: 코치키들 })
await page.goto(url)
await page.waitForTimeout(2200)

let 죽음 = 0
const 칸 = (ok, 말) => { if (!ok) 죽음++; console.log(`  ${ok ? '✅' : '⛔'} ${말}`) }
const 판찍기 = async (이름) => {
  const el = page.locator('.decor-stage, .cover-box').first()
  const t = await el.count() ? el : page.locator('body')
  const b = await t.screenshot({ path: `${OUT}/${이름}.png` })
  return b
}
// ⭐ 「반응 없음」은 «몇 %가 바뀌었나»로 잰다 — 바이트 같나로는 1픽셀만 달라도 「바뀌었다」가 된다.
//    창업자가 본 것은 «눈에 아무 일도 안 일어난다»이니 눈이 보는 잣대라야 한다(규칙 18 ⓘ).
const 바뀐비율 = async (a, b) => page.evaluate(async ([A, B]) => {
  const load = (d) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = d })
  const [ia, ib] = await Promise.all([load(A), load(B)])
  const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height)
  const g = (im) => { const c = document.createElement("canvas"); c.width = w; c.height = h
    const x = c.getContext("2d"); x.drawImage(im, 0, 0); return x.getImageData(0, 0, w, h).data }
  const pa = g(ia), pb = g(ib)
  let n = 0
  for (let i = 0; i < pa.length; i += 4) {
    if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i+1] - pb[i+1]) + Math.abs(pa[i+2] - pb[i+2]) > 24) n++
  }
  return Math.round((n / (w * h)) * 1000) / 10
}, [`data:image/png;base64,${a.toString("base64")}`, `data:image/png;base64,${b.toString("base64")}`])

// ══ ① 자랑카드를 «진짜로» 표지에 저장한다 ══
console.log('\n① 레꾸자랑 카드를 표지로 저장')
await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1200)
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(600)
await page.getByText('랜덤 카드로 뽑기').click()
await page.waitForTimeout(2500)
await page.getByText('이 카드를 내 레시피 표지로').click()
// 🗄 [2026-09-02] 사진이 「큰 창고」로 이사해서 서랍엔 **쪽지**(`idb://…`)가 남는다.
//    ⛔ 옛 잣대(`image.startsWith('data:image')`)로 찾으면 **표지가 멀쩡히 저장돼도 「저장 실패」**가 된다.
//    ✅ 「표지 자리에 무언가 붙었나」로 찾고, 크기는 **창고에서 꺼낸 진짜 사진**으로 잰다.
let 카드주인 = null
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500)
  const 후보 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (s.recipes || []).find((x) => typeof x.image === 'string' &&
      (x.image.startsWith('data:image') || x.image.startsWith('idb://')))
    return r ? { id: r.id, title: r.title, thumb: r.thumb, image: r.image } : null
  })
  if (!후보) continue
  const 그림 = await 사진값(page, 후보.image)
  if (!그림.startsWith('data:image')) continue   // 아직 창고에 안 들어갔다 — 조금 더 기다린다
  카드주인 = { ...후보, kb: Math.round(그림.length / 1024) }
  break
}
칸(!!카드주인, 카드주인 ? `카드가 표지로 저장됐다 — 「${카드주인.title}」 thumb=${카드주인.thumb} ${카드주인.kb}KB` : '표지 저장 실패')
if (!카드주인) { await browser.close(); stop(); process.exit(1) }

// ⭐⭐ 창업자 확정(2026-08-23) = *"자랑카드를 표지로 올리면 레꾸스티커는 없어지는게 맞아.
//    대신 자동등록된 음식아이콘은 살아있어야해."* — 그 둘을 «저장된 값»으로 잰다.
//    ⛔ 화면으로만 재면 「가려서 안 보이는 것」과 「없는 것」을 못 가른다(오늘 그걸로 하루 헤맸다).
console.log('\n①-b 카드를 올린 «뒤» 저장된 값 — 스티커는 비고 아이콘은 남나')
{
  // 먼저 스티커가 «있는» 레시피를 만들어 두고 다시 카드를 올린다
  await page.evaluate((id) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1'))
    const r = s.recipes.find((x) => x.id === id)
    r.decor = [{ id: 'z1', key: 'gp_gomhi', x: 40, y: 40, s: 1, r: 0 }, { id: 'z2', key: 'gp_pengv', x: 60, y: 60, s: 1, r: 0 }]
    // ⭐⭐ ①이 남긴 표지를 «되돌린다» — 안 그러면 아래 칸들이 «①의 잔재»를 보고 통과한다.
    //    ⛔ 전엔 `thumb=photo`·`image` 가 ①에서 이미 저장돼 있어서 「카드가 표지 자리에 앉았다」 칸이
    //       ①-b 가 아무 일도 안 해도 초록불이었다 — **통과했는데 아무것도 안 쟀다**(규칙 18 ⓘ).
    //    ⭐ 되돌려 두면 「image 가 다시 생겼나」가 곧 **「이번 저장이 도착했나」**가 된다.
    //       ＋ 이게 창업자가 겪은 상태와도 같다(스티커는 있고 카드 표지는 아직 없다).
    delete r.image; delete r.thumb; delete r.imageFit; delete r.imagePos; delete r.imageZoom
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  }, 카드주인.id)
  await page.goto(url); await page.waitForTimeout(1600)
  await page.getByText('레꾸자랑', { exact: true }).last().click(); await page.waitForTimeout(1200)
  await page.locator('.grid-card').filter({ hasText: 카드주인.title }).first().locator('button').first().click()
  await page.waitForTimeout(600)
  await page.getByText('랜덤 카드로 뽑기').click(); await page.waitForTimeout(2500)
  await page.getByText('이 카드를 내 레시피 표지로').click()

  // ⏳⏳ **「4초 지났나」가 아니라 «이번 저장이 도착했나»를 기다린다.** (2026-08-27)
  //   ⛔⛔ 고정 4초였을 때 **흔들렸다** — 2026-08-24 순차에서 한 번, 08-27 병렬 3회 검증에서 또.
  //      뿌리 = 표지 저장이 `toJpeg`(pixelRatio 1.5)로 카드를 통째로 캡처하는데,
  //      **JS 는 단일 스레드라 그동안 저장도 못 되고 `evaluate` 응답도 못 온다.**
  //      🔢 실측(`_probe-레꾸겹침흔들림-0827` · CPU 경쟁) = **1.6 · 8.3 · 8.9 · 11.6초**
  //         → 4초를 넘긴 셋이 정확히 실패한 셋이었다. **앱은 멀쩡했고 잣대가 흔들렸다.**
  //   ⭐ `카드표지로()` 는 **한 객체**를 통째로 patch 한다 → `image` 가 들어갔으면 `decor: []` 도 들어갔다.
  //      그래서 `image` 를 «도착 신호»로 쓰면 아래 네 칸이 전부 «이번 저장»을 잰다.
  //      ⛔ 「decor 가 빌 때까지」로 기다리면 검사가 «자기 답»을 기다리는 꼴이라 버그를 영영 못 잡는다.
  let 뒤 = null
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(500)
    뒤 = await page.evaluate((id) => {
      const s = JSON.parse(localStorage.getItem('hankki:v1'))
      const r = s.recipes.find((x) => x.id === id)
      return { decor: (r.decor || []).length, icon: r.icon || null, thumb: r.thumb, bg: r.decorBg || null, img: !!r.image }
    }, 카드주인.id)
    if (뒤.img) break
  }
  console.log(`     저장값 = ${JSON.stringify(뒤)}`)
  칸(뒤.decor === 0, `⭐ 레꾸 스티커가 «비었다» (지금 ${뒤.decor}개)`)
  칸(!!뒤.icon, `⭐ 자동 음식 아이콘이 «살아 있다» (icon=${뒤.icon})`)
  칸(뒤.thumb === 'photo' && 뒤.img, '카드가 표지 자리에 앉았다')
  칸(뒤.bg !== undefined, `배경지는 안 건드린다 (decorBg=${뒤.bg})`)
}

// ⭐ 그 레시피에 «꾸미기»도 심는다 — 창업자 화면이 그 상태다(카드 표지 ＋ 스티커)
await page.evaluate((id) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes.find((x) => x.id === id)
  r.decorBg = 'sage'
  r.decor = [{ id: 'd1', key: 'gp_gomhi', x: 50, y: 60, s: 1.1, r: 0 }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 카드주인.id)
await page.goto(url); await page.waitForTimeout(1800)

// ══ ② 그 레시피 레꾸 판을 연다 ══
console.log('\n② 레꾸 판 — 「배경 음식 아이콘 지우기」가 판을 바꾸나')
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(1200)
await page.locator('.grid-card').filter({ hasText: 카드주인.title }).first().click()
await page.waitForTimeout(1400)
await page.getByText('레시피 꾸미기').first().click()
await page.waitForTimeout(1600)

const 버튼 = page.getByText(/(배경 음식 아이콘|표지 그림) (지우기|되돌리기)/).first()
칸(await 버튼.count() > 0, '표지 지우기 단추가 있다 — 이름이 셋이라 셋 다 받는다(카드면 「표지 그림 지우기」)')
const 글자전 = await 버튼.innerText().catch(() => '')
const 판전 = await 판찍기('A1-카드표지-누르기전')
// 판 «안»에 카드 그림(img)이 실제로 칠해져 있나
const 카드깔림 = await page.evaluate(() => {
  const st = document.querySelector('.decor-stage') || document.querySelector('[style*="aspect-ratio"]')
  if (!st) return null
  const im = [...st.querySelectorAll('img')].filter((i) => (i.currentSrc || i.src || '').startsWith('data:image'))
  return im.map((i) => { const r = i.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) })
})
console.log(`     판 안에 깔린 data:image = ${JSON.stringify(카드깔림)}`)
칸(Array.isArray(카드깔림) && 카드깔림.length > 0, '⭐ 카드가 «배경으로» 판에 깔려 있다 (＝겹침의 정체)')

await 버튼.click(); await page.waitForTimeout(900)
const 글자후 = await 버튼.innerText().catch(() => '')
const 판후 = await 판찍기('A2-카드표지-누른뒤')
칸(글자전 !== 글자후, `단추 글자가 바뀐다 (${글자전.trim()} → ${글자후.trim()})`)
const 바뀜A = await 바뀐비율(판전, 판후)
칸(바뀜A >= 5, `⭐ 누르면 판 그림이 «눈에 띄게» 바뀐다 — 바뀐 넓이 ${바뀜A}% (5% 미만이면 「반응 없음」)`)
const 남은카드 = await page.evaluate(() => {
  const st = document.querySelector('.decor-stage') || document.querySelector('[style*="aspect-ratio"]')
  return st ? [...st.querySelectorAll('img')].filter((i) => (i.currentSrc || i.src || '').startsWith('data:image')).length : -1
})
칸(남은카드 === 0, `⭐ 「지우기」 뒤 판에 카드가 «안 남는다» (지금 ${남은카드}장)`)

// ══ ③ 꾸미기가 덮는 레시피 — 토글이 반응하나 ══
console.log('\n③ 꾸미기가 «덮는» 레시피 — 토글·아이콘 변경이 눈에 보이나')
const 덮인 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes.find((x) => !x.image && x.icon)
  if (!r) return null
  r.decorBg = 'sage'
  // 가운데를 통째로 덮는 큰 스티커 하나 — 창업자 화면의 「흰 종이」 자리
  r.decor = [{ id: 'c1', key: 'pf_w01', x: 50, y: 50, s: 2.6, r: 0 }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { id: r.id, title: r.title, icon: r.icon }
}, )
칸(!!덮인, 덮인 ? `덮개를 심었다 — 「${덮인.title}」 icon=${덮인.icon}` : '대상 레시피를 못 찾았다')
await page.goto(url); await page.waitForTimeout(1800)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1200)
await page.locator('.grid-card').filter({ hasText: 덮인.title }).first().click(); await page.waitForTimeout(1400)
const 상세전 = await 판찍기('B1-덮인-상세')
await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1600)
const 버튼2 = page.getByText(/(배경 음식 아이콘|표지 그림) (지우기|되돌리기)/).first()
const 판전2 = await 판찍기('B2-덮인-누르기전')
await 버튼2.click(); await page.waitForTimeout(900)
const 판후2 = await 판찍기('B3-덮인-누른뒤')
const 바뀜B = await 바뀐비율(판전2, 판후2)
칸(바뀜B >= 5, `⭐ 덮인 레시피도 누르면 판이 «눈에» 바뀐다 — 바뀐 넓이 ${바뀜B}%`)

// ══ ④ 아이콘을 바꾸면 표지가 «눈에» 바뀌나 ══
console.log('\n④ 상세에서 「아이콘 바꾸기」 — 표지가 눈에 바뀌나')
// ⛔ 「취소」를 누르면 «저장 안 함?» 확인 시트가 뜬다 — 거기서 한 번 더 골라야 나간다
await page.getByText('취소', { exact: true }).first().click().catch(() => {})
await page.waitForTimeout(800)
await page.getByText('저장 안 하고 나가기').first().click().catch(() => {})
await page.waitForTimeout(1500)
const 표지전 = await 판찍기('B4-아이콘바꾸기-전')
const 아바 = page.getByText('아이콘 바꾸기').first()
칸(await 아바.count() > 0, '「아이콘 바꾸기」 단추가 있다')
await 아바.click(); await page.waitForTimeout(900)
// ⛔⛔ 첫 판이 «거짓말»을 했다 — 화면 «전체»에서 그림 든 단추를 골랐더니
//    아이콘이 아니라 «레시피 카드»를 눌러 화면이 통째로 넘어갔고, 그 넘어감을 「97.7% 바뀜」으로 셌다.
//    📌 규칙 18 ⓘ — 검사가 «무엇을 보는지». 통과했는데 아무것도 안 쟀다.
// ✅ 시트 «안»에서만, 그리고 «음식 아이콘 칸»만 콕 집는다. 못 찾으면 통과시키지 말고 죽는다.
const 골랐나 = await page.evaluate(() => {
  const sheet = [...document.querySelectorAll('div')].find((d) => /아이콘 선택/.test(d.innerText || '') && d.querySelector('.ficon-grid, [class*=ficon]'))
  const grid = (sheet || document).querySelector('.ficon-grid') || document.querySelector('.ficon-grid')
  if (!grid) return null
  const btns = [...grid.querySelectorAll('button')].filter((b) => b.querySelector('img'))
  const t = btns[5] || btns[1]
  if (!t) return null
  t.click(); return (t.innerText || '').trim().slice(0, 20) || '(이름없음)'
})
칸(!!골랐나, 골랐나 ? `아이콘을 골랐다 — 「${골랐나}」` : '⛔ 아이콘 격자(.ficon-grid)를 못 찾았다 — 이 칸은 «못 쟀다»')
if (!골랐나) { console.log('     ⛔ ④는 판정하지 말 것 — 잣대가 대상을 못 집었다'); }
await page.waitForTimeout(1400)
const 표지후 = await 판찍기('B5-아이콘바꾸기-후')
const 바뀜C = await 바뀐비율(표지전, 표지후)
칸(바뀜C >= 5, `⭐ 아이콘을 바꾸면 표지가 «눈에» 바뀐다 — 바뀐 넓이 ${바뀜C}%`)

console.log(`\n${죽음 ? `⛔ ${죽음}칸 실패 — 창업자 제보가 재현됐다` : '✅ 전부 통과'}`)
if (errs.length) console.log('⚠️ pageerror:', errs.slice(0, 3))
console.log(`📸 ${OUT}`)
await browser.close(); stop()
process.exit(죽음 ? 1 : 0)

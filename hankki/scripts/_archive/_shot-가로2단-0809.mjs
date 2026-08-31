// 🖼 **가로 2단 시안** — 창업자 2026-08-09 밤 *"이거 스샷하나 만들어줘. 지금은 재료랑 만드는법이 안보여서 어차피 패드에서 앱을 못써."*
//
// ⭐ 미감 판정(규칙 11)은 창업자 몫이라 **실물로 찍어** 나란히 보여준다.
// ⛔ 앱 코드는 하나도 안 건드린다 — 화면에 CSS 만 얹어서(`addStyleTag`) 찍는다.
//    시안 단계에서 코드를 고치면 되돌릴 때 회귀가 난다(v10.11 에 실제로 겪었다).
// ⚠️ 규칙 13 — 검수판은 **원본 픽셀 100%**. 줄이면 「글자가 작다」 같은 판정을 아예 못 한다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const OUT = join(R, 'docs/검수-2026-08-09-가로2단')
mkdirSync(OUT, { recursive: true })
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4424, r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

// 🅱 2단 CSS — 표지를 «왼쪽에 붙박이»로 두고 내용(재료·만드는 법)이 오른쪽에서 굴러간다.
//    ⭐ 상단바·하단 단추는 그대로 전체 폭을 쓴다(누르는 자리라 옮기면 헷갈린다).
//    ⚠️ 시안이라 자리만 잡았다 — 여백·정렬 다듬기는 창업자가 고른 뒤에.
// ⛔⛔ **첫 판이 grid 로 짰다가 표지가 «0×0» 이 됐다.**
//    `grid-row: 2 / 200` 으로 200행까지 늘리자 암묵 행이 잔뜩 생겨 칸이 무너졌다.
//    📌 숫자를 안 쟀으면 «표지 없는 시안»을 창업자에게 보낼 뻔했다(규칙 18).
// ⭐ 그래서 «흘려보내기(float)» 로 바꿨다 — 표지를 왼쪽에 띄우면 뒤 내용이 저절로 오른쪽으로 흐른다.
//    행을 셀 필요가 없어 자식이 몇 개든 안 깨진다.
// ⛔ 둘째 판(float)도 반쪽이었다 — 표지보다 글이 길어지면 **표지 밑으로 흘러 왼쪽 끝까지** 퍼져
//    순서 3·4 만 왼쪽에서 시작해 어긋나 보였다. 판정을 흐리는 그림이라 다시 고쳤다.
// ✅ 셋째 판 = grid. 첫 판이 깨진 이유는 grid 자체가 아니라 `grid-row: 2 / 200`(200행까지 늘림)이었다 →
//    **명시 행 2·3 만** 쓰고 나머지는 자동 배치에 맡긴다. 오른쪽 글은 어디까지 길어져도 둘째 열에 머문다.
// ⭐⭐ **네 번 헤맨 끝에 구조를 «직접 봤다» — 그러니 한 번에 풀렸다.**
//    `.screen` 의 자식은 여섯이고, 오른쪽에 갈 내용(제목·재료·만드는 법)은 **`.pad` 하나로 묶여 있다.**
//    0: 빈 div(absolute) · 1: `.detail-bar`(위바·sticky) · 2: `.cover-box` · 3: 단추 줄 · 4: `.pad` · 5: `.action-bar`(sticky)
//    ⛔ 앞서 `div:first-child` 를 위바로 여겼는데 **첫 자식은 빈 div** 라 그 규칙이 헛돌았다.
//       (그래서 위바가 오른쪽 열로 밀려 캡처에서 오른쪽에만 있었다)
//    📌 규칙 18 그대로 — 「무엇을 보는지」. 구조를 안 보고 네 번 고쳤다.
const 두단 = `
@media (orientation: landscape) and (min-width: 700px) {
  /* ⭐ grid 로 네 번 시도했지만 왼쪽 두 요소를 한 덩어리로 못 묶어 단추가 계속 밀렸다
        (래퍼가 없어서 «표지 ＋ 단추 줄»을 한 칸에 넣을 방법이 없다).
     ✅ 고전 2단 기법으로 바꾼다 — 왼쪽을 띄우고(float), 오른쪽 글에 BFC(overflow)를 줘서
        **글이 표지 밑으로 흘러 내려가지 않고 오른쪽 칸에 머물게** 한다. 래퍼가 필요 없다. */
  /* ⛔⛔ 첫 판은 표지를 화면 «왼쪽 끝(x=0)»에 붙였다 — 창업자가 바로 잡았다(*"왼쪽이 잘린 것 같아"*).
        🔢 재보니 그림은 «안» 잘렸다(넘침 0) — 그런데 **가장자리에 붙으면 잘린 것처럼 보인다.**
        📌 세로에선 표지가 화면 폭을 꽉 쓰는 게 «맞다»(가장자리까지 가는 그림). 하지만 2단에선
           표지가 「왼쪽 칸」이 되므로 여백이 있어야 한 장의 그림으로 읽힌다. */
  .screen { padding-right: 12px; padding-left: 20px; }
  .screen > .pad { overflow: hidden; }   /* ← 이 한 줄이 「오른쪽 칸」을 만든다 */
  /* ⛔⛔ 좌우 auto 마진을 «반드시» 0 으로 되돌린다 — 가로 규칙(v10.20)이 표지를 가운데로 모으려고
        걸어둔 것인데, grid 칸 안에서 auto 마진은 남는 자리를 통째로 먹어 **표지를 0×0 으로 만든다.**
        ⚠️ 이 주석은 템플릿 문자열 «안»이라 백틱을 쓰면 문자열이 거기서 끊긴다 — 실제로 한 번 깨졌다. */
  .screen > .cover-box {
    float: left; width: 38%;
    max-width: none; margin: 0 20px 0 0;
    border-radius: 16px; overflow: hidden;   /* 칸이 되었으니 「한 장의 그림」으로 읽히게 */
  }
  .screen > .cover-box + div {              /* 「아이콘 바꾸기 · 레시피 꾸미기」 */
    float: left; clear: left; width: 38%;
    margin: 10px 20px 12px 0;
    padding-left: 0 !important; padding-right: 0 !important;
  }
}`

for (const [판, w, h] of [['패드-가로-1600x900', 1600, 900], ['폰-눕힘-891x411', 891, 411]]) {
  for (const [갈래, css] of [['A-지금', ''], ['B-2단', 두단]]) {
    const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
    page.on('pageerror', e => console.log('   ⛔ pageerror', e.message))
    await page.addInitScript(() => {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
      const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
    })
    await page.goto('http://127.0.0.1:4424/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1100)
    await page.locator('.grid-card').first().click(); await page.waitForTimeout(1300)
    if (css) { await page.addStyleTag({ content: css }); await page.waitForTimeout(700) }
    // 📏 첫 화면에 무엇이 «실제로» 보이나 — 시안을 눈으로만 고르지 않게 숫자도 같이 남긴다
    const 잰 = await page.evaluate(() => {
      const 찾 = (re) => [...document.querySelectorAll('div, h2, h3, span')].find((x) => x.children.length === 0 && re.test((x.textContent || '').trim()))
      const y = (el) => (el ? Math.round(el.getBoundingClientRect().top) : null)
      const 재료 = 찾(/^재료/), 법 = 찾(/^(만드는 법|조리|순서)/)
      const cov = document.querySelector('.cover-box')
      // ⭐ 「레시피 꾸미기」는 이 앱의 핵심 단추다 — 시안에서 사라지면 그 시안은 못 쓴다.
      const 꾸미기 = [...document.querySelectorAll('button')].find((x) => /레시피 꾸미기/.test(x.textContent || ''))
      const kr = 꾸미기 ? 꾸미기.getBoundingClientRect() : null
      return {
        표지: cov ? `${Math.round(cov.getBoundingClientRect().width)}×${Math.round(cov.getBoundingClientRect().height)}` : null,
        재료y: y(재료), 만드는법y: y(법), 화면: innerHeight,
        재료보임: 재료 ? y(재료) < innerHeight - 20 : null,
        만드는법보임: 법 ? y(법) < innerHeight - 20 : null,
        꾸미기단추: kr ? `x=${Math.round(kr.left)} y=${Math.round(kr.top)}` : null,
        꾸미기보임: kr ? (kr.top > 0 && kr.bottom < innerHeight && kr.left >= 0) : null,
      }
    })
    console.log(`   ${판} / ${갈래} ${JSON.stringify(잰)}`)
    await page.screenshot({ path: join(OUT, `${판}__${갈래}.png`) })
    await page.close()
  }
}
await b.close(); srv.close()
console.log(`\n✅ 시안 넉 장 → ${OUT}`)

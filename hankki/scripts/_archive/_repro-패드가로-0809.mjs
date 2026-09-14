// 🔎 창업자 «패드 가로» 제보 4건 (2026-08-09 밤 · 캡처 3장)
//    📮 *"달력 사이에 선 안보임, 숫자, 글자, 아이콘 너무 작음"*
//    📮 *"홈화면,레시피,레꾸자랑 다 딱 2개만 뜸. 이미지가 너무 커서 아래가 안보인다.(2*3)6장이 한번에 보이고 스크롤 되면 좋겠음"*
//    📮 *"레시피누르면(예를들어 된장찌개) 아이콘이미지랑 아래 요리시작만 보이고 재료 만드는법 등이 다 안보임"*
//    📮 *"폴드도 달력아이콘글자가 너무 작음 구분선도 잘 안보임"*
//
// ⭐ 넷의 뿌리가 하나다 — 가로에선 `.app-frame { max-width: none }`(창업자 확정 「안 D」)이라
//    앱이 화면 폭을 다 쓰는데 **내용은 한 줄로만 퍼진다.** 칸이 늘어나야 할 자리에서 칸이 «커지기»만 했다.
// ⚠️ 패드 CSS 뷰포트를 모르니 짐작하지 않고 **두 크기 다** 잰다(규칙 15).
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4421, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let 나쁨 = 0
const 봄 = (좋나, 줄) => { if (!좋나) 나쁨++; console.log(`   ${좋나 ? '✅' : '⛔'} ${줄}`) }

for (const [판, w, h, 큰판] of [
  ['📱 패드 가로 1600×900', 1600, 900, true],
  ['📱 패드 가로 1280×800', 1280, 800, true],
  ['📖 폴드 펼침 765×689', 765, 689, true],
  ['📱 폰 눕힘 891×411', 891, 411, true],
  ['📱 폰 세로 411×891 (회귀)', 411, 891, false],
]) {
  console.log(`\n━━━ ${판} ━━━`)
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  page.on('pageerror', e => { 나쁨++; console.log('   ⛔ pageerror', e.message) })
  // ⛔⛔ **첫 판이 달력을 못 찾아 `null` 을 뱉었다 — 「달력이 없다」가 아니라 «시드를 안 넣어서»였다.**
  //    시드가 없으면 「일기」 탭 첫 화면은 안내문이고 달력은 «모아보기» 쪽에 있다.
  //    📌 규칙 18 그대로 — 「없다」의 이유를 내가 정하지 말고 화면 글자를 읽는다(읽으니 「모아보기」가 있었다).
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x, i) => { x.at = d.getTime() - i * 86400000 })
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, {
    recipes: [],
    diary: [
      { id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '오늘' },
      { id: 'c1', kind: 'cook', at: 0, title: '김치찌개', icon: '' },
    ],
    seedV: BASICS_VERSION,
  })
  await page.goto('http://127.0.0.1:4421/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)

  // ① 홈 「최근 저장」 — 한 줄에 몇 칸인가
  const 홈 = await page.evaluate(() => {
    const g = document.querySelector('.grid2')
    if (!g) return null
    const cs = getComputedStyle(g)
    const 열 = cs.gridTemplateColumns.split(' ').filter(Boolean).length
    const 칸 = g.children[0] ? Math.round(g.children[0].getBoundingClientRect().width) : 0
    // 화면 «안»에 온전히 보이는 카드 수 — 창업자가 센 방식
    const 보임 = [...g.children].filter((c) => { const r = c.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }).length
    return { 열, 칸, 보임, 전체: g.children.length }
  })
  console.log(`   홈 ${JSON.stringify(홈)}`)
  if (큰판) 봄(홈 && 홈.열 >= 3, `홈 카드가 한 줄에 3칸 이상 — ${홈?.열}열 (칸 ${홈?.칸}px · 화면에 ${홈?.보임}장)`)
  else 봄(홈 && 홈.열 === 2, `폰 세로는 그대로 2열 — ${홈?.열}열 (칸 ${홈?.칸}px)`)

  // ② 레시피 상세 — 첫 화면에 «재료»가 보이나
  await page.locator('.grid-card').first().click(); await page.waitForTimeout(1200)
  const 상세 = await page.evaluate(() => {
    const cov = document.querySelector('.cover-box')
    const cr = cov ? cov.getBoundingClientRect() : null
    const 찾 = (re) => [...document.querySelectorAll('div, h2, h3, span')].find((x) => x.children.length === 0 && re.test((x.textContent || '').trim()))
    const 재료 = 찾(/^재료/), 법 = 찾(/^(만드는 법|조리|순서)/)
    const rr = 재료 ? 재료.getBoundingClientRect() : null
    const lr = 법 ? 법.getBoundingClientRect() : null
    const 꾸 = [...document.querySelectorAll('button')].find((x) => /레시피 꾸미기/.test(x.textContent || ''))
    const kr = 꾸 ? 꾸.getBoundingClientRect() : null
    return {
      표지: cr ? `${Math.round(cr.width)}×${Math.round(cr.height)}` : null,
      표지높이: cr ? Math.round(cr.height) : 0,
      재료y: rr ? Math.round(rr.top) : null,
      만드는법y: lr ? Math.round(lr.top) : null,
      화면높이: innerHeight,
      재료보임: rr ? rr.top < innerHeight - 20 : null,
      만드는법보임: lr ? lr.top < innerHeight - 20 : null,
      꾸미기보임: kr ? (kr.top > 0 && kr.bottom < innerHeight) : null,
      // ⭐ 「진짜 2단인가」 = 글이 표지 «오른쪽»에서 시작하나. 세로면 표지 아래라 false 여야 한다.
      두단: (cr && rr) ? rr.left >= cr.right - 2 : null,
    }
  })
  console.log(`   상세 ${JSON.stringify(상세)}`)
  // ⭐⭐ **판정 기준이 v10.21 에 바뀌었다 — 창업자가 「가로 2단(38:62)」을 확정했다.**
  //    ⛔ 옛 기준 「표지가 화면 절반 아래」는 **1단일 때의 기준**이다. 2단에선 표지가 커도 옆에 글이 있으므로
  //       그 잣대로 재면 «더 좋아진 화면»을 실패로 찍는다. 📌 고치면 재는 자리도 같이 고친다.
  //    ✅ 이제 보는 것 = ⑴재료 ⑵만드는 법 ⑶「레시피 꾸미기」 단추가 첫 화면에 있나 ＋ ⑷진짜 2단인가.
  //    ⭐ 옛 기준으로는 **폰 눕힘이 「못 한다」였는데 2단이 그걸 풀었다** — 표지 173→326 이면서 재료가 보인다.
  봄(상세.재료보임 === true, `첫 화면에 「재료」가 보인다 — 표지 ${상세.표지} · 재료 y=${상세.재료y} / 화면 ${상세.화면높이}`)
  봄(상세.두단 === !!큰판, `${큰판 ? '가로는 2단이다(글이 표지 오른쪽)' : '폰 세로는 1단 그대로다'} — 두단=${상세.두단}`)
  봄(상세.꾸미기보임 === true, `「레시피 꾸미기」 단추가 첫 화면에 있다 — ${상세.꾸미기보임}`)
  // ⚠️ 「만드는 법」은 **2단이면서 화면이 600px 이상**일 때만 첫 화면에 온다.
  //    ⛔ 첫 판이 「화면 ≥600」만 봐서 **폰 세로(891)까지 걸어 실패로 찍었다** — 세로는 1단이라
  //       표지(411) 밑에 글이 오므로 «있을 수 없는 것»을 요구한 것이다. 게다가 세로는 창업자가 OK 한 화면이다.
  //    📌 또 「무엇을 보는지」다(규칙 18) — 잣대에 «2단인가»를 안 넣었다.
  if (큰판 && 상세.화면높이 >= 600) 봄(상세.만드는법보임 === true, `「만드는 법」도 보인다 — y=${상세.만드는법y} / 화면 ${상세.화면높이}`)
  else console.log(`   · ${큰판 ? `화면 ${상세.화면높이}px` : '세로 1단'} — 「만드는 법」(y=${상세.만드는법y})은 굴려서 본다(막대가 알려준다)`)

  // ③ 달력 — 칸 모양·구분선·글자·아이콘
  await page.goBack(); await page.waitForTimeout(700)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(1200)
  const 달력 = await page.evaluate(() => {
    const d = document.querySelector('.cal-day')
    if (!d) return null
    const r = d.getBoundingClientRect()
    const cs = getComputedStyle(d)
    const num = d.querySelector('.cal-num')
    const 카드 = document.querySelector('.cal-card')
    return {
      한칸: `${Math.round(r.width)}×${Math.round(r.height)}`,
      납작함: +(r.width / Math.max(1, r.height)).toFixed(2), // 1 = 정사각 · 크면 가로로 길다
      선: cs.boxShadow && cs.boxShadow !== 'none' ? '있음' : '없음',
      숫자: num ? Math.round(parseFloat(getComputedStyle(num).fontSize)) : 0,
      달력폭: 카드 ? Math.round(카드.getBoundingClientRect().width) : 0,
    }
  })
  const 아이콘 = await page.evaluate(() => {
    const f = document.querySelector('.cal-food')
    return f ? Math.round(f.getBoundingClientRect().width) : 0
  })
  console.log(`   달력 ${JSON.stringify(달력)} · 아이콘 ${아이콘}px`)
  if (달력) {
    봄(달력.납작함 <= 2, `달력 칸이 가로로 안 길다 — ${달력.한칸} (폭÷높이 ${달력.납작함} · 2 이하라야)`)
    봄(달력.선 === '있음' || !큰판, `칸 사이 구분선이 있다 — ${달력.선}`)
    if (큰판) {
      봄(달력.숫자 >= 13, `날짜 숫자가 안 작다 — ${달력.숫자}px (13 이상이라야)`)
      봄(아이콘 >= 26, `음식 아이콘이 안 쪼그맣다 — ${아이콘}px (26 이상이라야)`)
    }
  }
  await page.close()
}
await b.close(); srv.close()
console.log(나쁨 === 0 ? '\n✅ 패드 가로 4건 전부 통과' : `\n⛔ ${나쁨}칸 어긋남`)
process.exit(나쁨 === 0 ? 0 : 1)

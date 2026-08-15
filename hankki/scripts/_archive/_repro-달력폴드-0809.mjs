// 🔎 창업자 폴드 제보 ＋ 스크롤 표시 ＋ 길게 누르기 (2026-08-09 밤)
//    📮 *"폴드 펼치면 딱 이렇게 보이나봐. 아래 오늘 일기, 8월0일일기 버튼이 안보여. 그래서 먹통일 줄 알았데."*
//    📮 *"음식아이콘도 되게 쪼그맣게 보이네;;"* · *"달력에서 아이콘을 누르면 바로 일기로 들어가게"*
//    📮 *"지금 우리 일꾸나 레꾸 앱 전반적으로 스크롤이 표시가 안되어있지 않아??"* · *"얇게라도 표시해줘야"*
//    📮 *"길게누르면 이렇게돼"* (크롬 이미지 메뉴 캡처) · *"이건저번에 고쳤는데 왜 또 이렇게되지?"*
//
// ⭐ 판정이 바뀐 자리 = **「단추가 화면 안에 있나」가 아니라 「굴러간다는 걸 알 수 있나」**.
//    화면이 낮으면 단추가 밖으로 나가는 건 못 막는다(달력＋통계가 이미 화면을 채운다).
//    창업자 제보의 알맹이는 「안 보인다」가 아니라 **「먹통인 줄 알았다」** — 그래서 막대로 답한다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4420, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let 나쁨 = 0
const 봄 = (좋나, 줄) => { if (!좋나) 나쁨++; console.log(`   ${좋나 ? '✅' : '⛔'} ${줄}`) }

// ⚠️ 창업자 캡처는 **1529×1378** 인데 그건 «물리 픽셀»이고 CSS 뷰포트는 그보다 작다(DPR 만큼).
//    ⛔ DPR 을 모르니 짐작하지 않는다 — **둘 다 잰다.** 어느 쪽이든 통과해야 한다.
for (const [판, w, h, 커야하나] of [
  ['📖 폴드 펼침(캡처 그대로) 1529×1378', 1529, 1378, true],
  ['📖 폴드 펼침(DPR 2 가정) 765×689', 765, 689, true],
  ['📱 폰 눕힘 891×411', 891, 411, true],
  ['📱 폰 세로 411×891', 411, 891, false],
]) {
  console.log(`\n━━━ ${판} ━━━`)
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  page.on('pageerror', e => { 나쁨++; console.log('   ⛔ pageerror', e.message) })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x, i) => { x.at = d.getTime() - i * 86400000 })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, {
    recipes: [],
    diary: [
      { id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '오늘' },
      { id: 'c1', kind: 'cook', at: 0, title: '김치찌개', icon: '' },
    ],
    seedV: BASICS_VERSION,
  })
  await page.goto('http://127.0.0.1:4420/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(1200)

  const 잰다 = () => {
    const day = document.querySelector('.cal-day'), dr = day ? day.getBoundingClientRect() : null
    const food = document.querySelector('.cal-food'), fr = food ? food.getBoundingClientRect() : null
    const btn = [...document.querySelectorAll('button')].find((x) => /일기 (쓰기|보기)/.test(x.textContent || ''))
    const br = btn ? btn.getBoundingClientRect() : null
    // 지금 «맨 위» 화면이 넘치나 — 넘치면 막대가 있어야 한다
    const list = document.querySelectorAll('.app-frame .screen')
    const sc = list[list.length - 1]
    const 넘침 = sc ? Math.round(sc.scrollHeight - sc.clientHeight) : 0
    const hint = document.querySelector('[data-vhint]')
    const hr = hint ? hint.getBoundingClientRect() : null
    return {
      한칸: dr ? `${Math.round(dr.width)}×${Math.round(dr.height)}` : null,
      칸높이: dr ? Math.round(dr.height) : 0,
      아이콘: fr ? Math.round(fr.width) : 0,
      일기단추: br ? Math.round(br.top) : null,
      화면높이: innerHeight,
      단추가화면안: br ? br.top < innerHeight - 40 : null,
      넘침,
      막대: hr ? `${Math.round(hr.width)}×${Math.round(hr.height)}` : null,
      막대폭: hr ? Math.round(hr.width) : 0,
    }
  }
  const r = await page.evaluate(잰다)
  console.log(`   ${JSON.stringify(r)}`)

  // ⭐ 단추가 화면 밖이어도 «굴러간다는 표시»가 있으면 통과 — 그게 이번 처방이다.
  봄(r.단추가화면안 === true || r.막대폭 > 0,
    `단추를 찾아갈 수 있다 — 단추 y=${r.일기단추} · 화면 ${r.화면높이}px · 막대 ${r.막대 || '없음'}`)
  // 📜 넘치는데 막대가 없으면 그게 창업자가 겪은 「먹통인 줄 알았다」다.
  if (r.넘침 > 8) 봄(r.막대폭 > 0, `굴러가는 화면(넘침 ${r.넘침}px)에 얇은 막대가 보인다 — ${r.막대 || '없음'}`)
  else console.log(`   · 이 판은 안 넘친다(${r.넘침}px) — 막대를 안 그리는 게 맞다`)

  if (커야하나) {
    봄(r.칸높이 <= 80, `달력 칸이 안 커진다 — ${r.한칸} (80px 이하라야)`)
    봄(r.아이콘 >= 25, `음식 아이콘이 안 쪼그맣다 — ${r.아이콘}px (25 이상이라야)`)
  } else {
    봄(r.칸높이 >= 30 && r.아이콘 >= 20, `폰 세로는 전과 같다 — 칸 ${r.한칸} · 아이콘 ${r.아이콘}px`)
  }

  // ✋ 길게 누르기 = 크롬 이미지 메뉴. 안드로이드에선 `contextmenu` 를 취소해야 안 뜬다.
  //    ⛔ `-webkit-touch-callout` 은 iOS 전용이라 여기선 아무 일도 안 한다.
  const 메뉴 = await page.evaluate(() => {
    const 친다 = (el) => { if (!el) return null; const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented }
    const img = document.querySelector('.app-frame img')
    return { 그림: 친다(img), 그림있나: !!img }
  })
  봄(메뉴.그림있나 && 메뉴.그림 === true, `그림을 길게 눌러도 크롬 메뉴가 안 뜬다 — 취소됨=${메뉴.그림}`)

  // 📔 칸을 누르면 «그날 일기»로 바로 가나
  const 눌림 = await page.evaluate(() => {
    const d = [...document.querySelectorAll('.cal-day')].find((x) => !x.disabled)
    if (!d) return null
    d.click(); return d.textContent.trim()
  })
  await page.waitForTimeout(1100)
  const 갔나 = await page.evaluate(() => /꾸미기 열기|속지|오늘 일기/.test(document.body.innerText))
  봄(!!눌림 && 갔나, `달력 칸(${눌림})을 누르면 그날 일기로 간다`)

  // 🗄 꾸미기 서랍에도 막대가 있나 ＋ 글 칸은 메뉴가 «살아 있어야» 한다(붙여넣기)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click().catch(() => {})
  await page.waitForTimeout(1200)
  const 서랍 = await page.evaluate(() => {
    const d = document.querySelector('.decor-scroll')
    if (!d) return null
    const 넘침 = Math.round(d.scrollHeight - d.clientHeight)
    // ⚠️ 꾸미기 판 «안»의 막대만 센다 — 전부 세면 뒤 화면 막대까지 섞인다(첫 판이 그랬다).
    const hint = [...document.querySelectorAll('.decor-editor [data-vhint]')]
    const 뒤화면막대 = document.querySelectorAll('.app-frame [data-vhint]').length // ScrollHint 는 .app-frame 안에 그린다
    const 글칸 = document.querySelector('.decor-editor textarea, .decor-editor input')
    let 글칸메뉴 = null
    if (글칸) { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); 글칸.dispatchEvent(e); 글칸메뉴 = e.defaultPrevented }
    return { 넘침, 막대수: hint.length, 뒤화면막대, 글칸메뉴막힘: 글칸메뉴 }
  })
  if (서랍) {
    console.log(`   서랍 ${JSON.stringify(서랍)}`)
    if (서랍.넘침 > 8) 봄(서랍.막대수 > 0, `서랍이 넘치면(${서랍.넘침}px) 막대가 보인다 — ${서랍.막대수}개`)
    else console.log(`   · 서랍은 안 넘친다(${서랍.넘침}px)`)
    // ⛔ 꾸미기 판이 화면을 덮고 있는 동안 «뒤 화면» 막대가 떠 있으면 안 된다.
    봄(서랍.뒤화면막대 === 0, `꾸미기 판이 열린 동안 뒤 화면 막대가 없다 — ${서랍.뒤화면막대}개`)
    // ⚠️ 글 쓰는 칸은 «막으면 안 된다» — 붙여넣기가 나와야 한다.
    if (서랍.글칸메뉴막힘 !== null) 봄(서랍.글칸메뉴막힘 === false, `글 쓰는 칸은 메뉴가 살아 있다(붙여넣기) — 막힘=${서랍.글칸메뉴막힘}`)
  } else console.log('   · 꾸미기 판을 못 열었다 — 서랍 검사 건너뜀')
  await page.close()
}
await b.close(); srv.close()
console.log(나쁨 === 0 ? '\n✅ 폴드 달력 · 스크롤 표시 · 길게 누르기 전부 통과' : `\n⛔ ${나쁨}칸 어긋남`)
process.exit(나쁨 === 0 ? 0 : 1)

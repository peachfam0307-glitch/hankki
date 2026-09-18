// 🔍🎨 창업자 꾸미기 카드와 «똑같이» 얹고, 원본 위에 겹쳐 본다 (2026-09-19)
//
// 📮 창업자 2026-09-18 = *"내꺼랑 똑같은 자리에 정확하게 얹어야해"*
//   ＋ *"근데 너는 이상하게 붙이더라고... 예전에도 그래서 결국 내가 했었던 기억이 난다"*
//   ＋ *"특히 그릇프레임쓸때 정확하게 검은 테두리 가리게 잘 붙여야해"* · *"위에 얹는거야."*
//
// ⛔⛔ **내 미감으로 자리를 고르지 않는다** — 창업자 카드에서 «잰» 값을 그대로 넣는다.
//    📏 잰 값 = docs/꾸미기릴스-창업자카드-실측-2026-09-19.json
// ⭐ 그릇 프레임은 사진 «위»에 얹혀 원래 접시의 검은 테를 덮는다 → 자리·크기가 어긋나면 테가 삐져나온다.
//    그래서 대조판에 «접시 테두리 확대»를 따로 넣는다.
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_판-꾸미기대조-0919.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4617, r))
const 밖 = process.env.OUT || '/tmp/claude-0/꾸미기녹화'
mkdirSync(밖, { recursive: true })

// 🧩 창업자 카드 — «잰 값» 그대로. ⛔여기 숫자를 내 눈대중으로 고치지 않는다.
//    조각 이름은 서랍 411칸을 찍어 «눈으로» 골랐다(⛔문서에서 짐작 안 함).
const 겹 = [
  // ⭐ 2차 — 창업자 판정을 반영했다 (2026-09-18)
  //   📮 "접시가 큰게 아니고 작아 그리고 아래로 조금 내려야해" → s 0.75→0.88 · y 0.46→0.50
  //      ⛔ 나는 1차에서 «너무 크다»고 거꾸로 봤다. 창업자가 바로잡았다.
  //   📮 "포토코너는 맞는데 크기랑 위치를 조절해야해" → 둘 다 키우고 모서리 쪽으로 붙였다
  //   📮 "나머지는 네가 본게 맞아 그대로 수정해" → 제목을 «글자만»으로 · 카롱 크게 · 코너 안 돌림
  //   📮 "데코 색바꾸기에 있는 하트야" → 큰·작은 하트 모두 `heart`(색 바꾸는 SVG)
  { 이름: '포토코너(왼위)',   it: { type: 'sticker', key: 'pc3_02', x: 0.115, y: 0.135, s: 0.23, r: 0 } },
  // 🔄🔄 오른아래 코너 = «좌우＋상하 둘 다 뒤집기» — 코너 둘을 확대해 눈으로 확인했다.
  //    왼위 = 깅엄이 왼쪽 위 · 오른아래 = 깅엄이 오른쪽 아래(＝점대칭).
  //    ⛔ 나는 1차에 r:180 으로 «맞게» 넣었다가, 창업자의 「크기랑 위치를 조절해야해」를
  //       「안 돌린 게 맞다」로 잘못 읽고 r:0 으로 되돌렸다 → 📮 *"포토코너 아래쪽에 있는거 잘못됐어"*
  //    ⭐ 앱 필드 이름은 flip(좌우)·flipY(상하) 다 — DecorLayer.jsx:351 에서 그렇게 읽는다.
  //       ⛔ 나는 flipX 로 넣어서 좌우 뒤집기가 «조용히 안 먹고» 있었다.
  { 이름: '포토코너(오른아래)', it: { type: 'sticker', key: 'pc3_02', x: 0.875, y: 0.90, s: 0.25, r: 0, flip: true, flipY: true } },
  { 이름: '하트 마테',        it: { type: 'sticker', key: 'wt_dy06', x: 0.60, y: 0.78, s: 0.34, r: -6 } },
  // ✍️ 제목 = «글자만»(type:'text'). ⛔note 를 쓰면 베이지 종이가 같이 붙는다(1차 사고)
  // 🟣 제목 색 = 보라 — 📮 창업자 = *"글자 색(새우관자전) 보라색?이고"* → wine(자주) 말고 lilac(라일락)
  { 이름: '제목 글자',        it: { type: 'text', text: '새우관자전', color: 'lilac', font: 'gaegu', x: 0.40, y: 0.125, s: 0.52, r: 0 } },
  // 💗 하트는 «얼굴 없는» 쪽이다 — 색바꾸기 칸에 둘이 있다: 얼굴 있는 SVG 와 얼굴 없는 PNG.
  //    창업자 = 「04하트야」 = dc_dhb04. ⛔내가 SVG 를 골라 «웃는 얼굴 하트»가 됐었다.
  { 이름: '큰 하트',          it: { type: 'sticker', key: 'dc_dhb04', color: '#d78e86', x: 0.645, y: 0.125, s: 0.115, r: 0 } },
  { 이름: '작은 하트(왼위)',  it: { type: 'sticker', key: 'dc_dhb04', color: '#e8b9bd', x: 0.235, y: 0.185, s: 0.05, r: 0 } },
  // 💗💗 카롱 위로 뜨는 작은 하트는 «스티커가 아니라 효과»다 — 📮 창업자 = *"카롱위에 작은 하트는 움직임 효과야"*
  //    ⛔ 그래서 데코 139칸을 다 뒤져도 없었다. FX_KINDS 의 heart (하트 · 위로 뜸 · Stickers.jsx:1150)
  { 이름: '카롱＋펭펭',       it: { type: 'sticker', key: 'kp_shoulder', x: 0.205, y: 0.705, s: 0.27, r: 0, motion: 'tongtong', fx: 'heart' } },
  // 🗣🗣 말풍선 = **글자가 이미 박힌 스티커** — 📮 창업자 = *"글자 한끼문구 아이원픽"*
  //    ⛔ 나는 fn_speech(빈 말풍선)에 글을 쓰는 줄 알았다. 틀렸다. 글자 탭 「한끼 문구」의 tw_kidpick 이다.
  //       (같은 그룹에 tw_hubbypick =「남편 원픽!」 — 창업자 캡처에 둘이 나란히 있었다)
  { 이름: '말풍선',           it: { type: 'sticker', key: 'tw_kidpick', x: 0.775, y: 0.295, s: 0.26, r: -5 } },
  // 🔝🔝 접시는 «맨 뒤»에 둔다 = 맨 위에 그려진다 — 📮 창업자 = *"내가 덮어서 찍었는데 뭘 절대 못덮어"*
  //    ⭐ DecorLayer 는 배열 «순서대로» 그린다(자동 정렬 없음 · DecorLayer.jsx:198).
  //    ⛔ 나는 접시를 맨 앞에 두고 「구조상 못 덮는다」고 단정했다 — 창업자가 실물로 반증했다.
  //       실물이 이긴다. 순서를 바꾸면 되는 일이었다.
  { 이름: '그릇 접시',        it: { type: 'sticker', key: 'pf_ad08', x: 0.505, y: 0.44, s: 0.98, r: 0 } },
]

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR' })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
  } catch { /* noop */ }
})
const p = await ctx.newPage()
const 안내치우기 = async () => {
  let 맑음 = 0
  for (let i = 0; i < 20; i++) {
    const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() > 0 && await 것.isVisible().catch(() => false)) {
      try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(250); continue } catch { /* 다시 */ }
    }
    if (await p.locator('.sheet-mask, button:has-text("건너뛰기")').count() === 0) { 맑음++; if (맑음 >= 2) return }
    else 맑음 = 0
    await p.waitForTimeout(500)
  }
}
await p.goto('http://127.0.0.1:4617/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2200); await 안내치우기()
if (process.env.DISH_FRONT) { await p.addInitScript(() => { window.__접시앞 = true }); await p.evaluate(() => { window.__접시앞 = true }) }

// 💾 꾸미기를 «저장본에 직접» 심는다 — 앱이 한 번 저장한 뒤라야 한다(store.jsx:145)
const 심기 = async (몇겹) => {
  const 결과 = await p.evaluate(([줄들, n]) => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
      if (!s || !Array.isArray(s.recipes)) return '아직 저장 전'
      const id = 'basic-saeu-gwanja-jeon'
      let 것들 = 줄들.slice(0, n).map((x, i) => ({ id: 'cmp' + i, ...x.it }))
      // 🔝 접시를 «맨 앞»으로 = 배열 맨 뒤로 (뒤에 있을수록 위에 그려진다)
      //    📮 창업자 = *"위에 얹는거야."* → 순서 바의 「맨 앞으로」를 쓴 것이다.
      if (window.__접시앞) { const d = 것들.shift(); 것들.push(d) }
      // ⛔⛔ 원래 줄을 «지우고 새로 넣으면» 레시피가 통째로 사라진다(2026-09-18 실측 — 목록에서 없어졌다).
      //    저장본의 그 줄은 «레시피 전부»를 들고 있다. 꾸미기만 얹는다.
      const 그줄 = s.recipes.find((r) => r.id === id)
      if (!그줄) return '⛔ 저장본에 그 레시피가 없다'
      그줄.decor = 것들
      그줄.decorBg = 'grid'
      localStorage.setItem('hankki:v1', JSON.stringify(s))
      return '심었다 ' + 것들.length + '겹'
    } catch (e) { return '⛔ ' + e.message }
  }, [겹, 몇겹]).catch((e) => '⛔ ' + e.message)
  return 결과
}
// 🎬🎬 릴스용 — 한 겹씩 쌓이는 «낱장»을 0겹부터 전부 찍는다
//   📮 창업자 = *"한겹씩쌓이게 우리 가을레꾸릴스만들었었자나"* ＋ *"저거 릴스만 만들어줘 16-17초짜리로"*
//   ⭐ 자막·배경은 «안» 넣는다 — 창업자 = *"내가 자막달고 다 할게"*
if (process.env.REEL) {
  for (let n = 0; n <= 겹.length; n++) {
    console.log('  🌱', await 심기(n), '· ' + n + '겹')
    // ⏳ 대기를 짧게 줬더니(1700/1000/1300/1400) 저장본을 «읽기 전»에 꾸미기가 열려 조각이 0개로 찍혔다.
    //    📌 「저장됐다」와 「화면에 그려졌다」는 다른 말이다 — 되읽기는 통과해도 그림은 빈 카드였다.
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2400); await 안내치우기()
    // 🔎 되읽어 확인 — 「심었다」만 믿지 않는다(2026-09-18: 심었다고 찍혔는데 그림이 안 바뀌었다)
    const 확인 = await p.evaluate(() => {
      try {
        const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
        const r = s?.recipes?.find((x) => x.id === 'basic-saeu-gwanja-jeon')
        return r ? ('decor ' + (r.decor?.length ?? 'none') + ' · bg ' + (r.decorBg || 'none')) : '그 줄 없음'
      } catch (e) { return '⛔ ' + e.message }
    })
    console.log('     🔎 되읽기 =', 확인)
    await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
    await p.waitForTimeout(1200); await 안내치우기()
    const 그것 = p.locator('text=새우관자전').first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
    await 그것.scrollIntoViewIfNeeded(); await 그것.click({ force: true }); await p.waitForTimeout(1700); await 안내치우기()
    await p.locator('[data-coach="decor"]').first().click({ force: true }); await p.waitForTimeout(2000); await 안내치우기()
    // ✅ 「그려졌나」를 «화면에서» 센다 — 저장본만 믿지 않는다
    const 그려진수 = await p.evaluate(() => document.querySelectorAll('.decor-stage [data-decor], .decor-stage img, .decor-stage svg').length)
    const rr = await p.evaluate(() => { const e = document.querySelector('.decor-stage'); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } })
    await p.screenshot({ path: join(밖, '겹-' + String(n).padStart(2, '0') + '.png'), clip: rr })
    console.log('     👁 화면에 그려진 것 =', 그려진수)
    console.log('  📸', n + '겹', n > 0 ? 겹[n - 1].이름 : '(민 카드)')
  }
  await b.close(); srv.close(); process.exit(0)
}
// 🍽 접시 크기를 «몇 단계»로 뽑아 창업자가 고르게 한다 — ⛔내가 눈대중으로 정하지 않는다
if (process.env.DISH_STEPS) {
  // 📮 창업자 = *"접시를 좀 더 키워야해. 네꺼 작아"* → 0.92 보다 «위쪽»으로 다시 뽑는다
  // 📮 창업자 2026-09-18 = *"흰테가 보이는건 괜찮아 «검은테두리»가 보이지않으면 돼"*
  //    ＋ *"내 접시 보면 «아래쪽은 새우관자전에 붙어있어» 윗쪽은 흰부분이 보이잖아"*
  //    ⭐ 그래서 문제는 «크기»가 아니라 «자리»였다 — 접시를 «아래로» 내려 아래쪽 갈색 테를 덮는다.
  //    ⛔ 나는 접시를 키우면 창이 커져 테가 더 드러난다는 것만 보고 「줄여야 한다」로 갔었다.
  //       창업자는 «가운데 맞추기»가 아니라 «아래를 붙이기»를 한 것이다.
  for (const sy of (process.env.DISH_LIST || '0.88@0.50,0.88@0.54,0.88@0.58,0.94@0.54,0.94@0.58').split(',')) {
    const [s, y] = sy.split('@').map(Number)
    겹[0].it.y = y
    겹[0].it.s = s
    console.log('  🌱', await 심기(겹.length), '· 접시 s =', s)
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await 안내치우기()
    await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
    await p.waitForTimeout(1100); await 안내치우기()
    const 그것 = p.locator('text=새우관자전').first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
    await 그것.scrollIntoViewIfNeeded(); await 그것.click({ force: true }); await p.waitForTimeout(1400); await 안내치우기()
    await p.locator('[data-coach="decor"]').first().click({ force: true }); await p.waitForTimeout(1500); await 안내치우기()
    const rr = await p.evaluate(() => { const e = document.querySelector('.decor-stage'); const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } })
    await p.screenshot({ path: join(밖, '접시-' + sy.replace(/[.@]/g, '_') + '.png'), clip: rr })
    console.log('  📸 접시', sy)
  }
  await b.close(); srv.close(); process.exit(0)
}
// 🎬 LAYERS=n → «본문 경로»로 n겹만 심고 한 장 찍는다.
//    ⛔ 한 프로세스 안에서 reload 를 돌며 여러 장 찍으면 앱이 자기 상태로 덮어 «빈 카드»가 나온다
//       (2026-09-18 실측 — 저장본 되읽기는 통과했는데 화면엔 조각이 0개였다).
//    ✅ 그래서 겹마다 프로세스를 따로 띄운다. 느리지만 «확실하다».
const 몇겹 = process.env.LAYERS ? Number(process.env.LAYERS) : 겹.length
console.log('  🌱', await 심기(몇겹), '· ' + 몇겹 + '겹')
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000); await 안내치우기()

// 🍤 레시피 상세 → 표지를 찍는다(꾸미기 화면이 아니라 «유저가 보는» 표지)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1200); await 안내치우기()
const 것 = p.locator('text=새우관자전').first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
if (await 것.count() === 0) { await p.screenshot({ path: join(밖, '⚠️못찾음.png') }); console.log('  ⚠️ 새우관자전을 못 찾았다 — ⚠️못찾음.png 를 볼 것'); await b.close(); srv.close(); process.exit(1) }
await 것.scrollIntoViewIfNeeded(); await 것.click({ force: true })
await p.waitForTimeout(1600); await 안내치우기()
await p.screenshot({ path: join(밖, '내판-상세.png') })
// 🎨 꾸미기 화면도 — 창업자 캡처와 «같은 화면»이라야 겹쳐 볼 수 있다
await p.locator('[data-coach="decor"]').first().click({ force: true })
await p.waitForTimeout(1800); await 안내치우기()
await p.screenshot({ path: join(밖, '내판-꾸미기.png') })
const r = await p.evaluate(() => { const e = document.querySelector('.decor-stage'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } })
console.log('  📐 판 자리 =', JSON.stringify(r))
if (r) await p.screenshot({ path: join(밖, process.env.LAYERS ? '겹-' + String(몇겹).padStart(2, '0') + '.png' : '내판-판만.png'), clip: r })
else console.log('  ⚠️ .decor-stage 를 못 찾았다 — 꾸미기 화면이 안 열렸다')
console.log('✅ →', 밖)
await b.close(); srv.close()

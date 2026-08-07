// 📔🐛 「한끼 일기」 앨범을 누르면 «그날 일기»로 간다 (창업자 2026-08-07)
//   창업자 제보 = *"이거 없애기로 하지않았어? 일기에서 만든음식 누르면 떠."* (「요리 기록 남기기」 시트 스크린샷)
//   창업자 선택 = **ⓒ 안** — 시트를 없애고 «그날 일기»로 보낸다.
//
// ⭐ v9.80 에 없앤 건 **「만들었어요」 누르면 «자동으로» 뜨던 것**이고,
//    여기 «직접 누르는 길»은 남아 있었다. 화면 이름이 「한끼 일기」인데 요리 기록이 뜨니 앞뒤가 안 맞았다.
// ⭐ 기록(별점·사진·팁) 고치기는 **레시피 상세**에 그대로 있다 → 잃는 길이 없다.
//
// ⛔⛔ 이 검사를 만들며 알아둘 것 —
//   ⑴ 앨범 칸은 **`aria-label="{제목} 기록 보기"`** 다(칸 안 글자는 제목뿐이라 그것만으론 못 잡는다)
//   ⑵ 앨범에 뜨는 건 `diary` 배열에서 **`kind !== 'diary'`** 인 것(요리 기록)이다 — `kind:'diary'` 는 달력 점으로만 간다
//   ⑶ 「일기」 화면은 상단 바에 **「N월 N일 ○요일」** 이 뜬다(`.detail-bar`) — 이게 「갔다」의 증거다
//   ⑷ ⚠️ **꾹 누르기(long press)가 먼저 발동하면 클릭이 무시된다** → `click()` 은 짧게 한 번만
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
await new Promise((r) => srv.listen(4415, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))

// 🍳 요리 기록 두 개 — 어제·오늘. 날짜가 달라야 「그날」로 갔는지 알 수 있다.
const NOW = Date.now()
const YEST = NOW - 86400000
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  diary: [
    { id: 'c1', title: '김치찌개', at: NOW, rating: 5, recipeId: 'x1' },
    { id: 'c2', title: '된장찌개', at: YEST, rating: 4, recipeId: 'x2' },
  ],
})

await page.goto('http://127.0.0.1:4415/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)

// ═══ ⑴ 하단바 「일기」 탭이 「한끼 일기」를 연다 ══════════════════
console.log('\n── ⑴ 하단바 「일기」 → 한끼 일기 ──')
{
  const tab = page.locator('.bottom-nav .nav-item').filter({ hasText: /^일기$/ }).first()
  if (!(await tab.count())) no('하단바에 「일기」 탭이 없다')
  else {
    await tab.click(); await page.waitForTimeout(1100)
    const title = await page.evaluate(() => (document.querySelector('.topbar')?.textContent || '').trim())
    console.log(`   ℹ️ 화면 제목 = "${title}"`)
    if (title.includes('한끼 일기')) ok('「일기」 탭이 「한끼 일기」로 연다')
    else no(`제목이 「한끼 일기」가 아니다 — "${title}"`)
  }
}

// ═══ ⑵⭐ 앨범 칸을 누르면 «그날 일기»로 간다 (시트가 안 뜬다) ══════
console.log('\n── ⑵⭐ 앨범 칸 → 그날 일기 (「요리 기록 남기기」 시트 ❌) ──')
{
  const tile = page.getByRole('button', { name: '된장찌개 기록 보기' }).first()
  if (!(await tile.count())) no('앨범 칸(「된장찌개 기록 보기」)을 못 찾았다 — 검사 방식부터 볼 것')
  else {
    await tile.click(); await page.waitForTimeout(1200)
    const r = await page.evaluate(() => ({
      // 「요리 기록 남기기」 시트가 떴나 — 시트 안에 「기록」·「별점」 글자가 뜬다
      sheet: [...document.querySelectorAll('.sheet')].map((s) => (s.textContent || '').slice(0, 40)),
      bar: (document.querySelector('.detail-bar')?.textContent || '').trim(),
      paper: !!document.querySelector('.paper-box, [class*="paper"]'),
    }))
    console.log(`   ℹ️ 뜬 시트 = ${r.sheet.length ? JSON.stringify(r.sheet) : '(없음)'}`)
    console.log(`   ℹ️ 상단 바 = "${r.bar}"`)
    if (r.sheet.some((t) => /기록|별점|남기기/.test(t))) no('⛔ 「요리 기록 남기기」 시트가 아직 뜬다 — 창업자 제보 그대로')
    else ok('「요리 기록 남기기」 시트가 안 뜬다')

    // 어제 기록을 눌렀으니 «어제 날짜» 일기로 가야 한다
    const d = new Date(YEST)
    const want = `${d.getMonth() + 1}월 ${d.getDate()}일`
    if (!r.bar) no('일기 화면으로 안 갔다 (상단 바가 없다)')
    else if (r.bar.includes(want)) ok(`⭐ «그날 일기»로 갔다 — ${want} (누른 기록의 날짜)`)
    else no(`엉뚱한 날 일기로 갔다 — 바랐던 것 "${want}" · 실제 "${r.bar}"`)
    if (r.paper) ok('일기 종이(속지)가 떴다'); else no('일기 종이가 안 보인다')
  }
}

// ═══ ⑶ 오늘 기록을 누르면 «오늘» 일기로 — 날짜가 따라간다 ═════════
console.log('\n── ⑶ 날짜가 «누른 기록»을 따라간다 ──')
{
  await page.goBack(); await page.waitForTimeout(1000)
  const tile = page.getByRole('button', { name: '김치찌개 기록 보기' }).first()
  if (!(await tile.count())) no('앨범으로 못 돌아왔다')
  else {
    await tile.click(); await page.waitForTimeout(1200)
    const bar = await page.evaluate(() => (document.querySelector('.detail-bar')?.textContent || '').trim())
    const d = new Date(NOW)
    const want = `${d.getMonth() + 1}월 ${d.getDate()}일`
    console.log(`   ℹ️ 상단 바 = "${bar}"`)
    if (bar.includes(want)) ok(`⭐ 오늘 기록 → ${want} 일기 — 칸마다 «제 날짜»로 간다`)
    else no(`날짜가 안 따라간다 — 바랐던 것 "${want}" · 실제 "${bar}"`)
  }
}

// ═══ ⑷ 고르기(꾹 누름) 모드는 그대로 — 지우는 길이 안 죽었나 ══════
console.log('\n── ⑷ 고르기 모드에선 «고르기»가 그대로 ──')
{
  await page.goBack(); await page.waitForTimeout(1000)
  const tile = page.getByRole('button', { name: '김치찌개 기록 보기' }).first()
  if (!(await tile.count())) no('앨범으로 못 돌아왔다')
  else {
    // 꾹 누르기 = 고르기 모드로 들어간다
    const box = await tile.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up()
    await page.waitForTimeout(700)
    const r = await page.evaluate(() => ({
      bar: (document.querySelector('.detail-bar')?.textContent || '').trim(),
      sel: document.querySelectorAll('.album-tile[style*="outline: rgb"], .album-tile[style*="solid"]').length,
      // ⛔ 첫 판에 slice(0,200) 만 봐서 «거짓 실패»가 났다 — 고르기 바는 화면 «맨 아래»에 뜬다(200자 밖).
      //    📌 규칙 18 — 「없다」가 아니라 «내 검사가 거기까지 안 본 것»이었다.
      body: document.body.innerText,
    }))
    if (r.bar) no('⛔ 꾹 눌렀는데 일기로 넘어갔다 — 고르기(지우기)를 못 쓴다')
    else ok('꾹 누르면 일기로 안 넘어간다 (고르기 모드)')
    // 고르기 모드의 «실물» = 맨 아래 알약 바(「1개 선택」·「전체 선택」·「삭제」) ＋ 위쪽 「편집」이 「완료」로
    if (/개 선택|기록을 눌러 선택/.test(r.body) && /삭제/.test(r.body) && /완료/.test(r.body)) ok('고르기 모드가 켜졌다 — 지우는 길이 살아 있다')
    else no(`고르기 모드가 안 보인다 — 화면 글자 "${r.body.replace(/\n/g, ' ').slice(0, 80)}"`)
  }
}

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)

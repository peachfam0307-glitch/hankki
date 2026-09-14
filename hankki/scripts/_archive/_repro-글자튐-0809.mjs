// 🔎 창업자 제보 — *"스티커 붙이고 글쓰면 글자가 위에 붙거든? 다쓰고 움직이면 중간으로 내려와. 버그야 의도한거야?"*
//    ⭐ 「치는 중」은 `textarea` 가 보여주고 「친 뒤」는 `flex; align-items:center` 인 겹이 보여준다.
//       textarea 엔 세로 가운데 정렬이 «없다» → 글이 위에 붙는다. 두 상태의 «글자 덩어리 중심»을 재서 비교한다.
//    ⛔ 눈으로 「비슷해 보인다」로 넘기지 말 것 — px 로 잰다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4416, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let 나쁨 = 0

// 「치는 중 글자 중심」 vs 「친 뒤 글자 중심」 — 둘이 어긋난 만큼이 창업자가 본 「튀는 양」이다.
const 잰다 = () => {
  const ta = document.querySelector('.decor-stage textarea[data-boxtext]')
  if (!ta) return { 없음: true }
  // 어떤 종류인지도 같이 본다 — 글자 스티커(text)·포스트잇(note)·글 상자(note+art) 는 상자 성질이 다르다.
  const 종류 = ta.parentElement && ta.parentElement.style.containerType ? (ta.parentElement.querySelector('img') ? '글 상자(그림)' : '포스트잇') : '글자 스티커'
  const cs = getComputedStyle(ta)
  const 위 = parseFloat(cs.paddingTop) || 0, 아래 = parseFloat(cs.paddingBottom) || 0
  const 글높이 = ta.scrollHeight - 위 - 아래          // 실제 글 덩어리 높이
  const 칸높이 = ta.clientHeight                      // 상자 안쪽 높이
  const 치는중 = 위 + 글높이 / 2                       // textarea 는 «위에서부터» 쌓인다
  const 친뒤 = 칸높이 / 2                              // 보이는 겹은 flex 가운데 정렬
  return { 종류, 칸높이: Math.round(칸높이), 글높이: Math.round(글높이), 치는중: Math.round(치는중), 친뒤: Math.round(친뒤), 튐: Math.round(Math.abs(치는중 - 친뒤)) }
}

// ⭐ 서랍 「글자」 탭 안에서 «어느 섹션»을 고르는지가 종류를 가른다 — 창업자는 *"스티커 붙이고 글쓰면"* 이라 했다.
//    ⛔ 그냥 첫 단추를 누르면 「한끼 문구」(글자 스티커)만 재게 된다 — 세 종류를 다 잰다.
for (const [갈래, 섹션, 글] of [
  // ⛔ 「한끼 문구」 같은 글자 «스티커»는 그림처럼 붙는 것이라 글칸이 «원래 없다» — 대신 「글자 넣기」를 잰다.
  ['직접 쓴 글자', '직접', '오늘'],
  ['포스트잇', /포스트잇/, '오늘'],
  ['포스트잇 두 줄', /포스트잇/, '오늘 저녁은\n김치찌개'],
  ['글 상자(라벨지)', /메모|라벨/, '오늘'],
]) {
  const page = await b.newPage({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  page.on('pageerror', e => { 나쁨++; console.log('   ⛔ pageerror', e.message) })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4416/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  await page.locator('.seg', { hasText: /^레꾸$/ }).first().click(); await page.waitForTimeout(700)
  const t = page.locator('.decor-cats button').filter({ hasText: /^글자$/ })
  if (await t.count()) { await t.first().click(); await page.waitForTimeout(700) }
  const 눌렀나 = await page.evaluate((패턴) => {
    // 「직접」이면 절이 아니라 «단추 글자»로 찾는다 — 「글자 넣기」는 절 안 격자가 아니라 낱개 단추다.
    if (패턴 === '직접') {
      const b3 = [...document.querySelectorAll('.decor-drawer button')].find((x) => /글자 넣기|직접 쓰기|글씨 넣기/.test(x.textContent || ''))
      if (!b3) return null
      b3.click(); return b3.textContent.trim()
    }
    const 절들 = [...document.querySelectorAll('.decor-drawer .decor-sec')]
    let 절 = 절들[0]
    if (패턴) {
      const re = new RegExp(패턴)
      절 = 절들.find((s) => { const l = s.querySelector('.decor-sec-label'); return l && re.test(l.textContent) })
    }
    if (!절) return null
    const b2 = 절.querySelector('button')
    if (!b2) return null
    b2.click()
    const l = 절.querySelector('.decor-sec-label')
    return l ? l.textContent : '(라벨 없음)'
  }, 섹션 === '직접' ? '직접' : (섹션 ? 섹션.source : null))
  await page.waitForTimeout(900)
  if (!눌렀나) { console.log(`▣ ${갈래} ⚠️ 그 절을 못 찾았다`); 나쁨++; await page.close(); continue }
  await page.keyboard.type(글, { delay: 20 }); await page.waitForTimeout(500)
  const r = await page.evaluate(잰다)
  if (r.없음) { console.log(`▣ ${갈래} ⚠️ 글칸을 못 찾았다`); 나쁨++ }
  else {
    // 📌 판정 둘 — ⑴글이 칸을 안 넘어야 하고(넘치면 어떤 정렬로도 두 상태가 못 맞는다) ⑵중심이 2px 안이라야 한다.
    const 넘침 = r.글높이 > r.칸높이
    const 좋나 = !넘침 && r.튐 <= 2
    if (!좋나) 나쁨++
    console.log(`${좋나 ? '✅' : '⛔'} ${갈래} 「${글.replace('\n', ' / ')}」 — 절 「${눌렀나}」 · 잰 것 = ${r.종류}`)
    console.log(`   칸 높이 ${r.칸높이}px · 글 덩어리 ${r.글높이}px${넘침 ? ' ⛔칸을 넘는다' : ''} → 치는 중 중심 ${r.치는중} · 친 뒤 중심 ${r.친뒤} = **${r.튐}px 튄다**`)
  }
  await page.close()
}
await b.close(); srv.close()
console.log(나쁨 === 0 ? '\n✅ 치는 중과 친 뒤가 같은 자리다' : '\n⛔ 글자가 튄다 — 창업자 제보 그대로')
process.exit(나쁨 === 0 ? 0 : 1)

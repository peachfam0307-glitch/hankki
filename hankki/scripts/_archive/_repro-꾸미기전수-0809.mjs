// 🧪🧪 꾸미기 전수 재현 — 창업자 *"하나하나 눌러보고 재현해서 알려줘. 가로모드 세로모드 다"* (2026-08-09)
//    ⛔ 「될 거다」가 아니라 «눌러 보고» 잰다. 판마다 12걸음을 밟는다.
//    📌 판정 기준 = ⑴종이가 쓸 만한 크기인가 ⑵서랍이 살아 있나 ⑶넘치거나 잘리지 않나
//       ⑷굴려야 할 땐 진짜 굴러가나 ⑸빠져나올 길이 있나 ⑹pageerror 0
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4401, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'
let 어긋남 = 0

const 잰다 = () => {
  const st = document.querySelector('.decor-stage'), dr = document.querySelector('.decor-drawer'), tl = document.querySelector('.decor-tools')
  const w = st && st.querySelector(':scope > div:not(.t-sub)')
  const r = w ? w.getBoundingClientRect() : null
  const 높 = (e) => (e ? Math.round(e.getBoundingClientRect().height) : 0)
  return {
    종이폭: r ? Math.round(r.width) : 0, 종이높이: r ? Math.round(r.height) : 0,
    칸높이: st ? Math.round(st.clientHeight) : 0,
    굴릴양: st ? Math.round(st.scrollHeight - st.clientHeight) : 0,
    서랍: 높(dr), 도구바: 높(tl),
    큰글칸: !!document.querySelector('.decor-editor.bigwrite'),
    다썼어요: (() => { const e = document.querySelector('.decor-donewrite'); if (!e) return false; const q = e.getBoundingClientRect(); return q.width > 1 && q.height > 1 })(),
    화면넘침: Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth)),
  }
}
const 시드 = (s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach((x) => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}
const 값 = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }

async function 판(이름, W, H, 자판H) {
  const page = await b.newPage({ viewport: { width: W, height: H }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  const 오류 = []
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 120)))
  await page.addInitScript(시드, 값)
  const 걸음 = []
  const 적는다 = async (n, 조건) => {
    const m = await page.evaluate(잰다)
    const ok = 조건 ? 조건(m) : true
    if (!ok) 어긋남++
    걸음.push({ n, m, ok })
    console.log(`   ${ok ? '✅' : '⛔'} ${n.padEnd(26)} 종이 ${String(m.종이폭).padStart(3)}×${String(m.종이높이).padStart(3)} · 칸 ${String(m.칸높이).padStart(3)} · 굴릴 ${String(m.굴릴양).padStart(3)} · 서랍 ${String(m.서랍).padStart(3)} · 도구바 ${String(m.도구바).padStart(2)}${m.큰글칸 ? ' · 큰글칸' : ''}${m.다썼어요 ? ' · 다썼어요' : ''}${m.화면넘침 ? ' · ⛔넘침' + m.화면넘침 : ''}`)
    return m
  }
  console.log(`\n▣▣ ${이름} (${W}×${H})`)
  await page.goto('http://127.0.0.1:4401/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  await 적는다('① 꾸미기 열림', (m) => m.종이폭 > 150 && m.서랍 > 80 && !m.화면넘침 && !m.다썼어요)

  // ② 속지 고르기
  await page.getByRole('button', { name: '속지', exact: true }).last().click(); await page.waitForTimeout(600)
  const 틀 = page.getByText('사진일기', { exact: true }).first()
  if (await 틀.count().catch(() => 0)) { await 틀.click().catch(() => {}); await page.waitForTimeout(900) }
  await 적는다('② 속지 「사진일기」', (m) => m.종이폭 > 150 && m.서랍 > 80 && !m.화면넘침)

  // ③ 일꾸 탭 → 스티커 붙이기
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  await 적는다('③ 일꾸 탭', (m) => m.서랍 > 80 && !m.화면넘침)
  const 컷 = page.locator('.decor-drawer img').first()
  await 컷.click(); await page.waitForTimeout(900)
  await 적는다('④ 스티커 붙임(고른 상태)', (m) => m.종이폭 > 150 && m.도구바 > 40 && !m.화면넘침)

  // ⑤ 도구바 갈래 눌러보기
  for (const k of ['order', 'motion', 'fx']) {
    const t = page.locator(`[data-ctxtab="${k}"]`).first()
    if (await t.count().catch(() => 0)) { await t.click().catch(() => {}); await page.waitForTimeout(400) }
  }
  await 적는다('⑤ 도구바 갈래 셋', (m) => !m.화면넘침)

  // ⑥ 종이 빈 데 눌러 선택 풀기
  await page.locator('.decor-stage').click({ position: { x: 8, y: 8 } }).catch(() => {}); await page.waitForTimeout(500)
  await 적는다('⑥ 선택 풀기', (m) => m.서랍 > 80 && !m.화면넘침)

  // ⑦ 글쓰기 탭 → 종이 글칸에 커서
  await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(700)
  await 적는다('⑦ 글쓰기 탭', (m) => m.종이폭 > 150 && !m.화면넘침)
  const 글칸 = page.locator('.decor-stage textarea').first()
  await 글칸.click({ force: true }); await page.waitForTimeout(800)
  await 적는다('⑧ 종이 글칸에 커서', (m) => m.종이폭 > 150 && !m.화면넘침)

  // ⑨ 자판이 올라온 셈
  await page.setViewportSize({ width: W, height: 자판H }); await page.waitForTimeout(700)
  const m9 = await 적는다('⑨ 자판 뜸', (m) => m.종이폭 >= 220 && !m.화면넘침)
  // ⑩ 굴러가나 (넘칠 때만)
  if (m9.굴릴양 > 0) {
    await page.mouse.move(Math.round(W * 0.12), Math.round(자판H * 0.6)); await page.mouse.wheel(0, 200); await page.waitForTimeout(500)
    const t = await page.evaluate(() => Math.round(document.querySelector('.decor-stage').scrollTop))
    console.log(`   ${t > 0 ? '✅' : '⛔'} ⑩ 넘친 만큼 굴러가나        → ${t}px 내려감`)
    if (!(t > 0)) 어긋남++
  } else console.log('   ✅ ⑩ 넘친 만큼 굴러가나        → 안 넘쳐서 굴릴 필요 없음')
  await page.screenshot({ path: `${OUT}/전수-${이름}-자판뜸.png` })

  // ⑪ 자판 내리고 빠져나오기
  await page.setViewportSize({ width: W, height: H }); await page.waitForTimeout(500)
  const 나가기 = page.getByRole('button', { name: '다 썼어요' })
  if (await 나가기.count().catch(() => 0) && await 나가기.isVisible().catch(() => false)) { await 나가기.click(); await page.waitForTimeout(700) }
  else { await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700) }
  await 적는다('⑪ 빠져나옴', (m) => m.서랍 > 80 && !m.다썼어요 && !m.화면넘침)

  // ⑫ 저장
  await page.getByRole('button', { name: '저장', exact: true }).last().click(); await page.waitForTimeout(1200)
  const 남았나 = await page.locator('.decor-editor').count()
  console.log(`   ${남았나 === 0 ? '✅' : '⛔'} ⑫ 저장하면 닫히나            → ${남았나 === 0 ? '닫혔다' : '아직 열려 있다'}`)
  if (남았나 !== 0) 어긋남++
  console.log(`   ${오류.length === 0 ? '✅' : '⛔'} pageerror ${오류.length}${오류.length ? ' — ' + 오류[0] : ''}`)
  if (오류.length) 어긋남++
  await page.close()
}

await 판('세로', 411, 891, 440)
await 판('가로-앱', 891, 411, 160)
await 판('가로-크롬', 891, 322, 140)
await b.close(); srv.close()
console.log(`\n${어긋남 === 0 ? '✅✅ 전부 통과' : `⛔⛔ ${어긋남}건 어긋남`}`)
process.exit(어긋남 === 0 ? 0 : 1)

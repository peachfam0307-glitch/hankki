// 📏 백업 시트가 «화면 밖으로 넘쳐» 아래 버튼을 못 누르게 됐나 — 실측 (2026-08-16)
//   ⛔ 왜 재나 = 안내 상자 둘을 새로 넣어 시트가 길어졌다. 길어지면 「백업 파일 불러오기」가
//      화면 아래로 밀려나고, 시트가 안 굴러가면 **영영 못 누른다**(= 기기 이전이 아예 막힌다).
//   ⭐ 심장 = 「마지막 버튼을 «실제로 누를 수 있나»」 — `elementFromPoint` 로 그 자리에 뭐가 있는지 본다.
//      ⛔ 「시트 높이」만 재면 넘쳐도 숫자는 멀쩡하다(규칙 18 ⓘ).
//   📐 작은 폰까지 본다 — 갤럭시 A 계열·구형은 640~740px 대다.
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
await new Promise((r) => srv.listen(4374, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
let 나쁨 = 0

for (const vh of [900, 740, 640]) {
  const page = await b.newPage({ viewport: { width: 390, height: vh } })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'))
  await page.goto('http://127.0.0.1:4374/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)
  // ⛔ 설정은 하단 탭에 «없다» — 홈 오른쪽 위 아이콘이다(2026-08-16 실측). 라벨로 집는다.
  await page.getByLabel('설정').first().click(); await page.waitForTimeout(800)
  await page.getByText('백업 · 내보내기', { exact: true }).first().click(); await page.waitForTimeout(900)

  // ⛔⛔ 첫 판이 «굴리기 전»만 재서 세 화면 다 「못 누른다」로 나왔다 — 실제로는 시트가 굴러간다.
  //    📌 물어야 할 것은 「지금 보이나」가 아니라 **「굴리면 닿나」**다(규칙 18 ⓘ).
  await page.getByText('코드 붙여넣기로 불러오기', { exact: false }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  const r = await page.evaluate(() => {
    const sh = document.querySelector('.sheet')
    if (!sh) return { err: '시트를 못 찾았다' }
    const box = sh.getBoundingClientRect()
    const btns = [...sh.querySelectorAll('button')]
    const 끝 = btns[btns.length - 1]
    const bb = 끝.getBoundingClientRect()
    // 그 버튼 한가운데를 «실제로» 누를 수 있나 — 그 좌표에 무엇이 있나
    const hit = document.elementFromPoint(Math.round(bb.left + bb.width / 2), Math.round(bb.top + bb.height / 2))
    return {
      화면: window.innerHeight,
      시트바닥: Math.round(box.bottom),
      넘침: Math.round(box.bottom - window.innerHeight),
      굴러가나: sh.scrollHeight > sh.clientHeight,
      overflowY: getComputedStyle(sh).overflowY,
      끝버튼: 끝.innerText.trim().slice(0, 20),
      끝버튼바닥: Math.round(bb.bottom),
      화면안: bb.bottom <= window.innerHeight && bb.top >= 0,
      그자리: hit ? (hit.closest('button') === 끝 ? '✅ 그 버튼' : `⛔ 딴 것(${(hit.innerText || hit.tagName).trim().slice(0, 16)})`) : '⛔ 없음',
    }
  })
  const ok = r.화면안 && String(r.그자리).startsWith('✅')
  if (!ok) 나쁨++
  console.log(`\n── 화면 ${vh}px ── ${ok ? '✅ 닿는다' : '⛔ 못 누른다'}`)
  console.log(JSON.stringify(r, null, 1))
  await page.close()
}
await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}개 화면에서 마지막 버튼을 못 누른다` : '\n✅ 세 화면 모두 마지막 버튼에 손이 닿는다')
process.exit(나쁨 ? 1 : 0)

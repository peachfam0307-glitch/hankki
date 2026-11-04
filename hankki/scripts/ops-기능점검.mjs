// 🩺 기능 점검 — 「깨지면 안 되는 기능」을 기계가 매일 «직접 눌러» 본다 (창업자 2026-11-04)
//   📮 *"우리 기능중에 깨지면 안되는 것들. 레꾸, 일꾸, 레꾸자랑, 장보기, 식비가계부등등"* → *"아이폰은 안돼??"* → *"좋아."*
//   📄 설계 = docs/운영-큰틀-설계안-2026-11-02.md 「기능 점검」 절 (설계 관문 통과 2026-11-04)
//
// 쓰기: node scripts/ops-기능점검.mjs --엔진 chromium --주소 https://peachfam0307-glitch.github.io/hankki/
//       node scripts/ops-기능점검.mjs --엔진 webkit --dist dist          (dist 를 스스로 띄워 본다 = 아이폰에 구운 판)
//   결과 = 표준출력 한 줄씩 · 끝에 `결과: 정상` 또는 `결과: 고장 <단계들>` · 고장이면 exit 1
//
// ⛔ 지키는 것
//   · 통계를 끄고 들어간다(hankki:stats:off · src/stats.js) — 기계가 GA4 유저로 잡히면 창업자 숫자가 틀어진다
//   · 쿠팡 「사러가기」는 «절대» 안 누른다(부정 클릭 위험) — 「담기」만 누른다
//   · 실패한 단계는 «새 화면에서 한 번 더» — 두 번 다 실패해야 고장(잠깐 느린 인터넷으로 거짓 알림 안 내기)
//   · 버튼은 «화면에 보이는 이름»으로만 찾는다 — 이름을 바꾸면 여기 단계도 같이 고친다(안 고치면 거짓 고장)
import { chromium, webkit } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

const 인자 = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const 엔진이름 = 인자('--엔진', 'chromium')
const distDir = 인자('--dist', '')
let 주소 = 인자('--주소', 'https://peachfam0307-glitch.github.io/hankki/')
const 사진폴더 = 인자('--사진', '')

let srv = null
if (distDir) {
  const D = resolve(distDir)
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' }
  srv = createServer((q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
    let b, t = MIME[extname(p)] || 'application/octet-stream'
    try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' }
    s.writeHead(200, { 'content-type': t }); s.end(b)
  })
  await new Promise((r) => srv.listen(0, '127.0.0.1', r))
  주소 = `http://127.0.0.1:${srv.address().port}/hankki/`
}

const 엔진 = 엔진이름 === 'webkit' ? webkit : chromium
const br = await 엔진.launch(엔진이름 === 'chromium' && process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:stats:off', '1')          // ⛔ GA4 에 안 잡히게
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    const g = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) }
  } catch { /* noop */ }
})
// ⛔ 쿠팡·바깥 쇼핑 주소로는 «아예 못 나가게» 막는다 — 실수로 눌려도 요청이 안 간다
await ctx.route(/coupang\.com|kurly\.com|ssg\.com|naver\.com\/shopping|oasis|hansalim|icoop/i, (r) => r.abort())

const 초 = (n) => n * 1000
let p, 오류 = []
async function 새화면() {
  if (p) await p.close().catch(() => {})
  p = await ctx.newPage(); 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e).split('\n')[0].slice(0, 160)))
  await p.goto(주소, { waitUntil: 'domcontentloaded', timeout: 초(45) })
  await p.locator('.bottom-nav .nav-item').first().waitFor({ timeout: 초(30) })
  await p.waitForTimeout(1200)
}
const 탭 = async (이름) => { await p.locator('.bottom-nav .nav-item').filter({ hasText: 이름 }).first().click({ timeout: 초(10) }); await p.waitForTimeout(1000) }
const 단추 = (이름) => p.locator('button:visible, [role=button]:visible').filter({ hasText: 이름 }).first()
const 누름 = async (이름) => { const b = p.getByRole('button', { name: 이름 }).filter({ visible: true }).first(); await b.click({ timeout: 초(10) }); await p.waitForTimeout(1000) }
const 보임 = async (글, 몇초 = 10) => { await p.getByText(글).filter({ visible: true }).first().waitFor({ timeout: 초(몇초) }) }

const 단계들 = [
  ['홈', async () => { await 탭('홈'); await 보임('오늘 뭐 해먹지') }],
  ['레시피 열기', async () => { await 레시피열기() }],
  ['레꾸(스티커 붙이고 저장)', async () => {
    await 레시피열기()
    await 누름('레시피 꾸미기')
    await 누름('친구들')
    await p.locator('button:visible img').last().click({ timeout: 초(10) }); await p.waitForTimeout(800)
    await 누름('저장')
    await p.getByRole('button', { name: '레시피 꾸미기' }).first().waitFor({ timeout: 초(10) })
  }],
]
async function 레시피열기() {
    await 탭('레시피')
    await p.locator('.bottom-nav').waitFor()
    // 목록 첫 레시피 — 이름이 매주 바뀌므로 「해볼 것에 꽂기」 옆 카드를 집는다
    const 꽂기 = p.getByRole('button', { name: /해볼 것에 꽂기$/ }).first()
    const 이름 = ((await 꽂기.getAttribute('aria-label')) || '').replace(/ 해볼 것에 꽂기$/, '')
    await p.getByText(이름, { exact: true }).filter({ visible: true }).first().click({ timeout: 초(10) })
    await p.getByRole('button', { name: '레시피 꾸미기' }).first().waitFor({ timeout: 초(10) })
}
단계들.push(
  ['일기 쓰기 + 일꾸', async () => {
    await p.goto(주소, { waitUntil: 'domcontentloaded' }); await p.locator('.bottom-nav .nav-item').first().waitFor({ timeout: 초(30) })
    await 탭('일기')
    await 누름('오늘 일기 쓰기')
    await p.locator('textarea:visible, [contenteditable=true]:visible').first().fill('점검')
    await 누름('꾸미기 열기')
    await p.getByRole('button', { name: /^속지 / }).nth(1).click({ timeout: 초(10) }); await p.waitForTimeout(600)
    await 누름('저장')
  }],
  ['레꾸자랑 카드', async () => {
    await p.goto(주소, { waitUntil: 'domcontentloaded' }); await p.locator('.bottom-nav .nav-item').first().waitFor({ timeout: 초(30) })
    await 탭('레꾸자랑')
    await p.getByRole('button', { name: /자랑하기$/ }).first().click({ timeout: 초(10) }); await p.waitForTimeout(1000)
    await 누름('랜덤 카드로 뽑기')
    await p.getByRole('button', { name: '공유하기' }).first().waitFor({ timeout: 초(15) })
    const 그림 = await p.locator('img[src^="blob:"]:visible, img[src^="data:"]:visible, canvas:visible').count()
    if (!그림) throw new Error('카드 그림이 안 그려졌다')
  }],
  ['장보기 담기', async () => {
    await 탭('장보기')
    await 누름('장보기')
    const 담기 = 단추(/^담기$/)
    await 담기.click({ timeout: 초(10) }); await p.waitForTimeout(1200)
    if (사진폴더) await p.screenshot({ path: join(사진폴더, '담은뒤-' + 엔진이름 + '.png') })
  }],
  ['식비 가계부 적기', async () => {
    await 탭('장보기')
    await 누름('식비')
    await 누름('외식·배달 적기')
    for (const n of ['1', '000']) await p.getByRole('button', { name: n, exact: true }).filter({ visible: true }).first().click({ timeout: 초(10) })
    await 누름('적었어요')
    await 보임('1,000')
  }],
)

const 고장 = []
await 새화면().catch((e) => 고장.push(`사이트 열기(${String(e).split('\n')[0].slice(0, 80)})`))
if (!고장.length) {
  for (const [이름, 할것] of 단계들) {
    let 끝 = false
    for (let 번 = 1; 번 <= 2 && !끝; 번++) {
      const 오류전 = 오류.length
      try {
        // 단계마다 «홈에서 새로» 시작한다 — 앞 단계가 남긴 시트·카드가 다음 단계를 가리지 않게
        { await p.goto(주소, { waitUntil: 'domcontentloaded' }); await p.locator('.bottom-nav .nav-item').first().waitFor({ timeout: 초(30) }); await p.waitForTimeout(800) }
        await 할것()
        if (오류.length > 오류전) throw new Error('앱 오류: ' + 오류.slice(오류전).join(' / '))
        console.log(`✅ ${이름}${번 === 2 ? ' (두 번째에 통과)' : ''}`); 끝 = true
      } catch (e) {
        const 왜 = String(e?.message || e).split('\n')[0].slice(0, 140)
        if (사진폴더) await p.screenshot({ path: join(사진폴더, `고장-${엔진이름}-${이름}-${번}.png`) }).catch(() => {})
        if (번 === 1) { console.log(`↻ ${이름} 다시 (${왜})`); await 새화면().catch(() => {}) }
        else { console.log(`❌ ${이름} — ${왜}`); 고장.push(이름); await 새화면().catch(() => {}) }
      }
    }
  }
}
await br.close(); srv?.close()
console.log(고장.length ? `결과: 고장 ${고장.join(', ')}` : '결과: 정상')
process.exit(고장.length ? 1 : 0)

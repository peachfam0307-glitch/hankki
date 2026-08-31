// ☁️📸 클라우드 첫 화면(CloudGate) ＋ 홈 한 줄을 «진짜 앱에서» 찍는다 — 2026-08-21
//   ⛔ 손으로 그린 그림이 아니다. 빌드한 앱을 띄워서 실제로 뜨는 화면을 찍는다(절대원칙 30).
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
// ⭐ 코치마크를 「이미 다 본」 상태로 만드는 조각 — 저장소에 이미 있다(규칙 17: 만들기 «전»에 찾는다).
//   ⛔ 안 쓰면 코치가 화면을 덮어 «홈 한 줄이 있는데도 안 보인다»(2026-08-21 실제로 그랬다).
import { SEED_COACH_SEEN } from '../src/coach.js'
const ROOT = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4605, r))

const b = await chromium.launch()
const errs = []
async function 새창 (init) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  pg.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  await pg.addInitScript(SEED_COACH_SEEN)
  if (init) await pg.addInitScript(init)
  await pg.goto('http://localhost:4605/hankki/', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(1600)
  return { ctx, pg }
}

// ── ① 새로 깐 사람 = 클라우드 첫 화면이 «맨 처음» 뜬다 ─────────────────
{
  const { ctx, pg } = await 새창()
  const 글 = await pg.textContent('body')
  const 맞나 = /Google로 시작하기/.test(글)
  await pg.screenshot({ path: '/tmp/클라우드첫화면.png' })
  console.log((맞나 ? '✅' : '⛔') + ' ① 새로 깐 사람 — 첫 화면이 클라우드다')
  if (!맞나) console.log('   본문 = ' + 글.slice(0, 160))
  // 「자세히」 펴 보기
  // ⛔⛔ 2026-08-31 고침 — getByText 가 «단추 «안»의 글자 div»를 집어 부모가 클릭을 가로챘고(30초 타임아웃),
  //    게다가 화면 «전체»에서 찾으면 설정의 「클라우드 저장」 시트에 «같은 글자의 단추»가 또 있다.
  //    → 이 화면(곰펭 그림의 부모) «안»에서 그 단추를 콕 집는다(규칙 18 ⓘ).
  const 자세히있나 = await pg.evaluate(() => {
    const img = document.querySelector('img[src*="duo_hi"]')
    if (!img) return false
    const b = [...img.parentElement.querySelectorAll('button')].find((x) => /로그인하면 새 폰에서도/.test(x.textContent))
    if (!b) return false
    b.click(); return true
  })
  if (자세히있나) {
    await pg.waitForTimeout(400)
    await pg.screenshot({ path: '/tmp/클라우드첫화면-자세히.png' })
    console.log('✅ ①-b 「자세히」가 펴진다')
  } else { console.log('⛔ ①-b 「자세히」 단추를 이 화면에서 못 찾았다'); process.exitCode = 1 }
  // 「그냥 둘러볼게요」 → 소개로 넘어가나
  // 「나중에 하기」 → ⚠️안내 팝업이 «한 번» 뜬다(창업자 2026-08-21 *"모르고 그냥 해볼수있으니까"*)
  await pg.getByText('나중에 하기').first().click()
  await pg.waitForTimeout(600)
  const 팝업 = await pg.textContent('body')
  const 팝업떴나 = /이 폰에만 저장돼요/.test(팝업)
  await pg.screenshot({ path: '/tmp/클라우드-나중에팝업.png' })
  console.log((팝업떴나 ? '✅' : '⛔') + ' ①-c 「나중에 하기」 → 안내 팝업이 뜬다')
  if (!팝업떴나) console.log('   본문 = ' + 팝업.slice(0, 200))
  await pg.getByText('그냥 시작하기').first().click()
  await pg.waitForTimeout(700)
  const 다음 = await pg.textContent('body')
  console.log((/건너뛰기/.test(다음) ? '✅' : '⛔') + ' ①-d 「그냥 시작하기」 → 소개로 넘어간다')
  await ctx.close()
}

// ── ② 이미 쓰던 사람 = 첫 화면 «안» 뜨고 홈에 한 줄 ───────────────────
{
  const { ctx, pg } = await 새창(() => {
    localStorage.setItem('hankki:onboarded', '1')          // 소개를 이미 봤다
    localStorage.setItem('hankki:v1', JSON.stringify({
      recipes: [{ id: 'u1', title: '내가 쓴 레시피', ingredients: [], steps: [] }],
      folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [],
      shoppingList: [], pantry: [], diary: [], seedV: 999, memoCleanV: 9, removedSeedIds: [],
    }))
    localStorage.setItem('hankki:coach:home', '1')
  })
  const 글 = await pg.textContent('body')
  const 첫화면없나 = !/Google로 시작하기/.test(글)
  const 한줄있나 = /지금은 레시피·일기가 이 폰에만 있어요/.test(글)
  console.log((첫화면없나 ? '✅' : '⛔') + ' ② 이미 쓰던 사람 — 첫 화면이 «안» 뜬다(벽 아님)')
  console.log((한줄있나 ? '✅' : '⛔') + ' ②-b 홈에 한 줄이 뜬다')
  await pg.screenshot({ path: '/tmp/홈-클라우드한줄.png', fullPage: true })
  if (!한줄있나) console.log('   본문 = ' + 글.slice(0, 260))
  await ctx.close()
}

// ── ③ 이미 로그인해 둔 사람 = 한 줄이 «안» 뜬다 ──────────────────────
{
  const { ctx, pg } = await 새창(() => {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:cloud:on', '1')            // 로그인해 둔 표식
    localStorage.setItem('hankki:v1', JSON.stringify({
      recipes: [{ id: 'u1', title: '내가 쓴 레시피', ingredients: [], steps: [] }],
      folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [],
      shoppingList: [], pantry: [], diary: [], seedV: 999, memoCleanV: 9, removedSeedIds: [],
    }))
    localStorage.setItem('hankki:coach:home', '1')
  })
  const 글 = await pg.textContent('body')
  console.log((!/지금은 레시피·일기가 이 폰에만 있어요/.test(글) ? '✅' : '⛔') + ' ③ 이미 로그인한 사람 — 한 줄이 «안» 뜬다')
  await ctx.close()
}

console.log('\n자바스크립트 오류 = ' + (errs.length ? errs.join(' / ') : '0'))
await b.close(); srv.close()
process.exit(errs.length ? 1 : 0)

// 🐛 재현 — 「요리 기록이 «직접 고른» 아이콘을 무시한다」 (2026-08-06 ②와 한 몸)
//
// 앨범 타일이 `guessFoodIcon(제목)` 으로 **제목에서 아이콘을 다시 추측**하고 있었다.
// 그래서 표지에서 아이콘을 직접 골라 둬도 요리 기록에선 딴 그림이 떴다.
// 📌 v9.77 에서 표지에 고친 것(`iconPicked`)과 **똑같은 버그**다.
// ⭐ 달력 칸에 음식을 띄우려면 어차피 이 값이 필요해서 한 번에 고쳤다.
//
// 판정 = 제목이 「오징어볶음」인데 사람이 **계란찜(fe_154)** 을 골라 둔 레시피에서
//        ⓐ 앨범 타일 ⓑ 달력 칸  둘 다 **fe_154** 를 그리나. (버그면 fe_75 오징어볶음이 뜬다)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-diaryicon.mjs
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4343, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const PICKED = 'fe_154'   // 사람이 «직접 고른» 계란찜
const GUESS = 'fe_75'     // 제목 「오징어볶음」이면 추측으로 나오는 그림
const now = Date.now()
const state = {
  recipes: [{ id: 'r1', title: '오징어볶음', category: '한식', time: 20, thumb: 'icon', icon: PICKED, iconPicked: true,
    ingredients: ['오징어 2마리'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user', cooked: 1 }],
  diary: [{ id: 'd1', recipeId: 'r1', title: '오징어볶음', at: now, rating: 5, note: '', photo: null }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4343/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(800)
await page.locator('.seg', { hasText: '한끼 일기' }).first().click(); await page.waitForTimeout(800)

const srcOf = async (sel) => (await page.locator(sel).first().getAttribute('src').catch(() => '')) || ''
const judge = (label, src) => {
  if (!src) return no(`${label} — 그림을 못 찾았다`)
  if (src.includes(PICKED)) ok(`${label} — 직접 고른 ${PICKED} 를 그린다`)
  else if (src.includes(GUESS)) no(`${label} — 제목으로 다시 추측해 ${GUESS} 를 그린다 (직접 고른 게 무시됐다)`)
  else no(`${label} — 엉뚱한 그림: ${src.split('/').pop()}`)
}

console.log('\n── ⓐ 앨범 타일 ──')
judge('앨범', await srcOf('.album-icon img'))

console.log('\n── ⓑ 달력 칸 ──')
const calN = await page.locator('.cal-food').count()
if (!calN) no('달력 칸에 음식이 없다 — 달력이 안 펼쳐졌거나 칸을 안 그린다')
else { ok(`달력 칸에 음식 ${calN}개`); judge('달력', await srcOf('.cal-food img')) }

console.log('\n── ⓒ 달력이 «기본으로» 펼쳐져 있나 ──')
if (await page.locator('.cal-card').first().isVisible().catch(() => false)) ok('탭을 열자마자 달력이 보인다')
else no('달력이 안 보인다 — 접혀 있다')
if (await page.getByRole('button', { name: /요리 달력/ }).first().isVisible().catch(() => false)) no('「요리 달력 보기」 토글이 아직 있다')
else ok('접기 토글은 없어졌다')

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')

await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)

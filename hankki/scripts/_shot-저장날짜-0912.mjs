// 📅 레시피 목록·상세에 「저장 날짜」가 어떻게 뜨나 — 규칙 21(보여주기 전에 내가 열어본다)
//
// 📮 창업자 폰 제보 2026-09-12 = *"날짜뭐야?"* · *"2020년?"* — 목록이 거의 다 「2020.01.01」이었다.
// ⛔ 뿌리 = 줄 세우려고 쓴 바닥값(2020-01-01)이 화면에 「저장 날짜」로 그대로 새어 나왔다.
// ✅ 창업자 확정 「a」 = 기본 레시피는 저장 날짜를 «안» 보여준다(유저가 저장한 적이 없다).
//
// 보는 것 = ①목록에 2020 이 한 글자도 없나 ②기본 레시피 상세에 「… 저장」이 없나
// 쓰는 법: node scripts/_shot-저장날짜-0912.mjs
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const dist = join(여기, '../dist')
const 낼곳 = join(여기, '../../_shots')
if (!existsSync(낼곳)) mkdirSync(낼곳, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
const pg = await b.newPage({ viewport: { width: 390, height: 3200 }, deviceScaleFactor: 2 })
await pg.addInitScript(SEED_COACH_SEEN)
await pg.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await pg.goto(`http://localhost:${port}/hankki/`)
await pg.waitForTimeout(1500)
// ⛔⛔ 1판이 «홈 + 소식 팝업»을 찍고 「2020 없다」로 초록불을 켰다 — 규칙 18ⓕ·21 그대로다.
//    소식을 먼저 닫고, 화면이 «정말» 레시피 탭인지 확인한 뒤에 잰다.
await pg.getByRole('button', { name: /^닫기$/ }).first().click().catch(() => {})
await pg.waitForTimeout(600)
await pg.getByRole('button', { name: '레시피', exact: true }).first().click({ force: true }).catch(() => {})
await pg.waitForTimeout(1500)
{
  const 글 = await pg.evaluate(() => document.body.innerText)
  if (!/내 레시피|레시피 \d+|전체/.test(글) || /한끼 소식/.test(글)) {
    console.log('⛔ 레시피 탭이 아니다 — 여기서 잰 값은 못 믿는다. 화면 앞 200자:')
    console.log('   ' + 글.slice(0, 200).replace(/\n/g, ' / '))
    process.exit(1)
  }
}

let 죽음 = 0
const 칸 = (참, 이름, 말 = '') => { console.log(`${참 ? '✅' : '❌'} ${이름}${말 ? ' · ' + 말 : ''}`); if (!참) 죽음++ }

const 목록글 = await pg.evaluate(() => document.body.innerText)
칸(!목록글.includes('2020.'), '목록에 「2020.」이 한 글자도 없다', 목록글.includes('2020.') ? '아직 있다' : '')
칸(!목록글.includes('2020'), '목록에 「2020」이 없다')
await pg.screenshot({ path: join(낼곳, '저장날짜-목록-0912.png'), fullPage: false })

// 기본 레시피 하나 열어 상세도 본다
await pg.getByText('가지 소고기 덮밥').first().click().catch(() => {})
await pg.waitForTimeout(1200)
const 상세글 = await pg.evaluate(() => document.body.innerText)
칸(!/\d{4}\.\d{2}\.\d{2} 저장/.test(상세글), '기본 레시피 상세에 「… 저장」이 없다', (상세글.match(/\S*\d{4}\.\d{2}\.\d{2} 저장/) || [''])[0])
await pg.screenshot({ path: join(낼곳, '저장날짜-상세-0912.png'), fullPage: false })

await b.close(); srv.close()
console.log(죽음 ? `\n❌ ${죽음}칸 실패` : '\n✅ 전부 통과 · _shots/ 에 두 장')
process.exit(죽음 ? 1 : 0)

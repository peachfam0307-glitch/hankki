// 📷 속지 사진이 «속지마다 따로» 담기나 — 창업자 폰 제보 2026-08-08
//
// 📮 *"속지는 기록3칸에 올린 사진들이 스크랩사진첩에 똑같이 붙어. 이건 의도한건지 아닌지는 모르겠지만 그렇다고."*
//    → 내가 낸 **①지금처럼 따라온다 / ②속지마다 따로 담는다** 중 창업자가 **②**를 골랐다.
//
// ⛔ 뿌리 = 여섯 속지가 **전부 `photo`/`photo2`/`photo3` 한 자리를 같이 썼다.**
//    (속지를 갈아입어도 사진이 안 날아가게 한 것인데, 칸 «모양»이 달라 엉뚱하게 붙어 보였다)
//
// 🎯 재는 것 — 셋 다 «화면에 실제로 그려진 사진»으로 판정한다
//   ① 🚚 이관 : 옛 저장본(`photo`)이 **그 일기가 쓰던 속지** 자리로 옮겨져 사진이 «안 날아간다»
//   ② ✂️ 분리 : 속지를 갈아입으면 그 사진이 **안 딸려온다**
//   ③ ↩️ 복귀 : 원래 속지로 돌아오면 사진이 **그대로 있다**
//
// ⛔⛔ 규칙 12 — 이 판은 **옛 코드에서 ②가 «걸리는» 것까지 확인하고 만들었다.**
//    (옛 코드 = papers.js 에 사진 key 없음 → 스크랩으로 갈아입으면 사진 3장이 그대로 따라온다)
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
await new Promise((r) => srv.listen(4376, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const shot = (c, t) => 'data:image/svg+xml;base64,' + Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220"><rect width="300" height="220" fill="${c}"/><text x="150" y="130" font-size="90" fill="#fff" text-anchor="middle">${t}</text></svg>`).toString('base64')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

// 🗄 **옛 저장본 그대로** — 「기록 3칸」 속지에 옛 키(photo/photo2/photo3)로 사진 셋
// ⏰⏰  은 **브라우저 안에서** 정한다 — 여기(Node)는 UTC 라  가 KST 21시가 된다.
//    그러면 시드가 «어제» 일기가 되고, 앱은 «오늘»을 열어 **빈 종이**가 뜬다.
//    2026-08-09 01:30 에 실제로 그랬고, 나는 그 빈 종이를 「이관 실패」로 읽을 뻔했다(규칙 18).
const seed = {
  id: 'd-old', kind: 'diary', at: 0,
  paper: { rule: 'lined', skin: 'ivory', art: 'list3' },
  decor: [], title: '옛 저장본',
  photo: shot('#7a9c6e', '1'), photo2: shot('#6e86a0', '2'), photo3: shot('#b08a6a', '3'),
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0)          // ⏰ 브라우저 시간대(KST) 기준 «오늘 정오»
  s.diary.forEach((x) => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  // 🧭 코치는 접두어로 통째로 — 이름으로 심으면 키를 올릴 때 낡는다(2026-08-08 사고)
  const _get = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _get.call(this, k) }
}, { recipes: [], diary: [seed], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4376/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1100)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)

// 종이 «안»에 그려진 사진만 센다 (data:image/svg = 우리가 심은 시험 사진)
const shots = async () => page.evaluate(() => {
  const p = document.querySelector('.paper'); if (!p) return -1
  return [...p.querySelectorAll('img')].filter((i) => i.src.startsWith('data:image/svg') && i.naturalWidth > 0).length
})
const stored = async () => page.evaluate(() => {
  const d = (JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary || []).find((x) => x.kind === 'diary') || {}
  return Object.keys(d).filter((k) => /^(photo\d*|ph_\w+)$/.test(k) && d[k])
})

// ── ① 🚚 이관 — 옛 저장본이 안 날아간다 ─────────────────
{
  const n = await shots()
  n === 3 ? ok(`옛 저장본 사진 셋이 그대로 보인다 (${n}장)`) : no(`옛 저장본 사진이 ${n}장만 보인다 — 이관이 안 됐다`)
  const keys = await stored()
  const moved = keys.filter((k) => k.startsWith('ph_l')).length
  moved === 3 ? ok(`저장 자리가 「기록 3칸」 것으로 옮겨졌다 (${keys.join(', ')})`) : no(`저장 자리가 안 옮겨졌다 — ${keys.join(', ') || '(빔)'}`)
}

// ── ② ✂️ 분리 — 속지를 갈아입으면 «안 딸려온다» ──────────
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(700)
const pickPaper = async (name) => {
  const t = page.getByRole('button', { name }).first()
  if (!(await t.count())) { no(`속지 「${name}」 칸을 못 찾았다`); return false }
  await t.click(); await page.waitForTimeout(900); return true
}
if (await pickPaper('스크랩 사진첩')) {
  const n = await shots()
  n === 0 ? ok('스크랩 사진첩으로 갈아입으니 «안 딸려온다» (0장)') : no(`스크랩 사진첩에 사진 ${n}장이 딸려왔다 — 저장 자리를 아직 같이 쓴다`)
}

// ── ③ ↩️ 복귀 — 되돌아오면 그대로 있다 ─────────────────
if (await pickPaper('기록 3칸')) {
  const n = await shots()
  n === 3 ? ok('「기록 3칸」으로 돌아오니 사진 셋이 그대로다') : no(`돌아왔는데 ${n}장만 남았다 — 사진이 날아갔다`)
}

if (errs.length) no(`런타임 크래시 — ${[...new Set(errs)].join(' / ')}`)
else ok('런타임 크래시 0')

await page.close(); await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 어긋남\n` : '\n✅ 속지 사진 분리 통과 — 이관 · 분리 · 복귀 셋 다\n')
process.exit(bad ? 1 : 0)

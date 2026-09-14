// 📔🍂 **가을 일기 «틀» 시안을 한 번에 뽑는다** (2026-09-04)
//
// 📮 창업자 = *"한끼일기도 «예쁜 틀»로 바꿔줘. 너무 저거는 백지라.."* → *"내가 꾸민 거 말고.."*
//    → *"**네가 꾸며서 넣어줘 가을 느낌나게**"*
//
// ⛔ 처음 「오늘의 한끼」 틀로 넣어 봤더니 **가운데 사진칸이 「사진 넣기」로 비어 있었다.**
//    🔢 이유 = 사진은 `localStorage` 가 아니라 **사진 창고(IndexedDB)** 에 있고,
//       이 판은 백업의 `_` 로 시작하는 열쇠(＝`_photos`)를 «안» 붓는다. 그래서 채울 사진이 없다.
//    ⛔ 그렇다고 아무 그림이나 «요리 사진인 척» 끼우지 않는다 — 그건 지어내는 것이다.
//    ✅ 그래서 **사진칸이 작거나 없는 틀**로 바꾸는 길을 잰다. 어느 틀이 예쁜지는 숫자로 못 재니
//       (규칙 11·21) **여러 판을 뽑아 놓고 창업자가 고른다.**
//
// 실행: BACKUP=<백업.json> node scripts/_shot-일기틀시안-0904.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/일기틀시안'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const 집 = `http://127.0.0.1:${srv.address().port}/`

const { todayKST } = await import('../src/today.js')   // ⛔ 날짜를 여기서 만들지 않는다(절대원칙 27)
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const [Y, M, D] = todayKST().split('-').map(Number)

// 🍂 가을 꾸미기 — 9/1 에 실제로 열린 것만 (`release-calendar.mjs --on 2026-09-01` 실측)
//    au_i43 담요 · i44 머그 · i45 호박 · i46 도토리 · i47 초 · i48 장화 · i49 바구니 · i50 버섯
//    au_i24 · i28 · i38 · i39 · i29 · i42 = 단풍·낙엽   /   au_b09 · b27 = 꼬르곰·펭펭의 가을
// 📐📐 **자리는 «찍은 판에서 역산»했다 — 짐작이 아니다** (규칙 21 로 열어 보고 잰 값)
//    🔢 A 판에서 종이는 이미지 x 583~1420 · y 168~1262 → 폭 837 · 높이 1094 (스티커 좌표는 종이 기준 0~1).
//       사진칸 = 이미지 x 735~1265 · y 300~770 → **종이 기준 x 0.18~0.81 · y 0.12~0.55**(중심 0.50 / 0.335).
//    ✅ 그래서 그 «안»에 스티커를 앉혀 「사진 넣기」 안내를 덮는다.
//       ⭐ 지어내는 게 아니다 — 유저도 사진 대신 스티커로 채운다. 앱이 실제로 되는 일이다.
//    ⛔ 창업자 사진을 홍보물에 쓰지 않는다(개인 데이터) — 그리고 백업엔 사진 «개수»만 있고 실물이 없다.
const 꾸밈 = () => [
  // ── 사진칸 «안» — 비어 보이던 자리를 채운다
  // ⛔ 처음엔 x 0.63 / 0.38 이라 **둘 사이(x 0.50)로 「사진 넣기」 글자가 비쳤다**(규칙 21 이 잡았다).
  //    ✅ 안내 글자는 사진칸 «한가운데»(x 0.50 · y 0.335)에 있으므로 둘을 그 위에서 겹치게 좁힌다.
  { id: 'a1', type: 'sticker', key: 'au_b09', x: 0.605, y: 0.300, s: 0.30, r: 3 },
  { id: 'a2', type: 'sticker', key: 'au_b27', x: 0.425, y: 0.330, s: 0.28, r: -3 },
  { id: 'a3', type: 'sticker', key: 'au_i24', x: 0.245, y: 0.155, s: 0.10, r: -14 },
  { id: 'a4', type: 'sticker', key: 'au_i38', x: 0.760, y: 0.470, s: 0.10, r: 9 },
  { id: 'a5', type: 'sticker', key: 'au_i49', x: 0.500, y: 0.495, s: 0.15, r: 2 },
  // ── 종이 아래 — 메모칸 «왼쪽 밖»으로 물려 글을 안 덮는다
  { id: 'a6', type: 'sticker', key: 'au_i45', x: 0.175, y: 0.930, s: 0.13, r: 5 },
  { id: 'a7', type: 'sticker', key: 'au_i46', x: 0.290, y: 0.962, s: 0.09, r: -8 },
  // ⛔ 쪽지는 «글이 앉는 자리»를 피한다 — 첫 판에서 글을 덮어 읽을 수가 없었다(규칙 21 이 잡았다)
  { id: 'a8', type: 'note', art: 'dgn07', text: '가을엔\n뜨끈한 게 최고', font: 'gaegu', x: 0.845, y: 0.875, s: 0.26, r: 3, tc: '#8a4a1c' },
]

// 🗂 재는 틀 — 「사진칸이 얼마나 크나」가 갈랐다.
//    ⭐ 1차로 여섯을 뽑아 «열어 보고»(규칙 21) A 를 골랐다 — 틀 그림이 제일 「일기」답다
//       (초록 테두리 ＋ 마스킹테이프 ＋ 항목 아이콘 줄 ＋ 평가 칸). B·C 는 빈 줄이 너무 많고,
//       D·E·F 는 가운데가 통째로 빈다. 이제 A 를 다듬어 다시 본다.
const 시안들 = [
  { 이름: 'A-오늘의한끼', art: 'today', skin: 'kraft', rule: 'plain' },
]

const 원본 = JSON.parse(readFileSync(process.env.BACKUP || '/tmp/claude-0/창업자백업.json', 'utf8'))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

for (const 시안 of 시안들) {
  const 담을것 = {}
  for (const k of Object.keys(원본)) if (!k.startsWith('_')) 담을것[k] = 원본[k]
  담을것.diary = [...(담을것.diary || []), {
    id: 'shot-가을일기', kind: 'diary',
    at: Date.UTC(Y, M - 1, D, 3, 0, 0),          // KST 정오
    paper: { rule: 시안.rule, skin: 시안.skin, art: 시안.art },
    note: '선선해져서 국물이 자꾸 생각나는 날.',
    title: '가을 첫 들깨탕', line: '뜨끈한 게 최고', weather: 'partly',
    font: 'gaegu', size: 'md',
    decor: 꾸밈(),
  }]

  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
  await ctx.addInitScript((v) => {
    try {
      const 이미 = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      localStorage.setItem('hankki:v1', JSON.stringify({ ...이미, ...v }))
    } catch { /* 못 넣으면 시드 — 아래 검산이 잡는다 */ }
  }, 담을것)

  const p = await ctx.newPage()
  p.setDefaultTimeout(15000)
  await p.goto(집, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1600)
  for (const 글자 of ['나중에 볼게요', '확인', '닫기']) {
    const t = p.getByRole('button', { name: 글자 }).first()
    if (await t.count()) { await t.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500) }
  }
  // 🧹 «청소 안내 띠»가 맨 위에 걸린다 — 「사진 N장을 정리해 …MB 를 비웠어요」.
  //    ⛔ 홍보물에 시스템 안내가 찍히면 안 된다. 1차 시안 여섯 장이 «전부» 이 띠를 달고 나왔다(규칙 21 이 잡았다).
  //    ⛔ 시간을 그냥 늘리지 않는다 — 띠가 «사라졌나»를 보고 끝낸다(절대원칙 34).
  for (let i = 0; i < 14; i++) {
    const 띠 = await p.evaluate(() => /정리해|비웠어요/.test(document.body.innerText))
    if (!띠) break
    await p.waitForTimeout(1000)
  }
  const 탭 = p.locator('.tabbar button, nav button, [role="tab"]').filter({ hasText: /^일기$/ }).first()
  if (await 탭.count()) { await 탭.click(); await p.waitForTimeout(1400) }
  const 칸 = p.locator('button.cal-day').filter({ has: p.locator('.cal-num', { hasText: new RegExp(`^${D}$`) }) }).first()
  if (await 칸.count()) {
    await 칸.click({ timeout: 5000 }).catch(() => {})
    await p.waitForTimeout(1800)
    // 🔎 «비어 보이는 자리»가 남았나 — 홍보물에 「사진 넣기」가 찍히면 안 된다
    const 빈자리 = await p.evaluate(() => (document.body.innerText.match(/사진 넣기|여기에 써요/g) || []).length)
    await p.screenshot({ path: join(OUT, 시안.이름 + '.png') })
    console.log(`  ${빈자리 ? '⚠️' : '✅'} ${시안.이름.padEnd(18)} 빈 자리 안내 ${빈자리}개`)
  } else console.log(`  ⛔ ${시안.이름} — 달력에서 ${D}일 칸을 못 찾았다`)
  await ctx.close()
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
console.log('⭐ 규칙 21 — 열어서 보고 고른다. 「예쁜가」는 숫자로 못 잰다.')
